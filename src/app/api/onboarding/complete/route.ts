/**
 * /api/onboarding/complete — Registra un usuario + contrato en PostgreSQL.
 *
 * Called after successful StockWallet deployment from the frontend.
 * Inserts: users, wallets, contract_runtime_state, monitored_markets.
 *
 * This is what connects the frontend onboarding to the bot —
 * the bot picks up new wallets from the `wallets` table automatically.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

interface TokenConfig {
  symbol: string;
  address: string;
  allocationPct: number;
  stopLossPct: number;
  takeProfitPct: number;
}

interface OnboardingPayload {
  user: {
    name: string;
    walletAddress: string;
  };
  contract: {
    address: string;
    chainId: number;
    scannerAddress?: string;
  };
  tokens: TokenConfig[];
}

// BSC tokens — base token is USDT (18 decimals on BSC)
const BSC_USDT = '0x55d398326f99059fF775485246999027B3197955';

export async function POST(req: NextRequest) {
  try {
    const body: OnboardingPayload = await req.json();

    const {
      user: { name, walletAddress },
      contract: { address: contractAddress, chainId, scannerAddress },
      tokens,
    } = body;

    if (!walletAddress || !contractAddress || !tokens?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: walletAddress, contractAddress, tokens' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert or update user (use wallet address as telegram_id placeholder)
      const userRes = await client.query(
        `INSERT INTO users (telegram_id, status)
         VALUES ($1, 'active')
         ON CONFLICT (telegram_id) DO UPDATE
         SET status = 'active'
         RETURNING id`,
        [walletAddress.toLowerCase()]
      );
      const userId = userRes.rows[0].id;

      // 2. Insert or update wallet (contract)
      const walletRes = await client.query(
        `INSERT INTO wallets (user_id, chain_id, contract_address, status)
         VALUES ($1, $2, $3, 'active')
         ON CONFLICT (contract_address) DO UPDATE
         SET status = 'active', user_id = $1
         RETURNING id`,
        [userId, chainId, contractAddress]
      );
      const walletId = walletRes.rows[0].id;

      // 3. Initialize runtime state if not exists
      await client.query(
        `INSERT INTO contract_runtime_state (wallet_id)
         VALUES ($1)
         ON CONFLICT (wallet_id) DO NOTHING`,
        [walletId]
      );

      // 4. Register monitored markets for each token (token -> USDT)
      //    This tells the Price Engine which markets to quote
      for (const token of tokens) {
        if (token.address.toLowerCase() === BSC_USDT.toLowerCase()) continue;

        // Standard fee tiers to try — the Price Engine will pick the best
        for (const feeTier of [100, 500, 3000, 10000]) {
          await client.query(
            `INSERT INTO monitored_markets (chain_id, dex, token_in, token_out, fee_tier, status)
             VALUES ($1, 'uniswap_v3', $2, $3, $4, 'active')
             ON CONFLICT DO NOTHING`,
            [chainId, token.address, BSC_USDT, feeTier]
          );
        }

        // Guardar config del token (allocation, SL, TP)
        await client.query(
          `INSERT INTO user_token_config (wallet_id, token_symbol, token_address, allocation_pct, stop_loss_pct, take_profit_pct)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (wallet_id, token_symbol) DO UPDATE
           SET allocation_pct = $4, stop_loss_pct = $5, take_profit_pct = $6`,
          [walletId, token.symbol, token.address, token.allocationPct, token.stopLossPct, token.takeProfitPct]
        );
      }

      // 5. Log the onboarding as an activity
      await client.query(
        `INSERT INTO stockwallet_activity
          (wallet_id, timestamp, type, action, reason)
         VALUES ($1, $2, 'onboarding', 'ONBOARDED', $3)`,
        [
          walletId,
          Date.now(),
          `User ${name} registered with ${tokens.length} tokens on chain ${chainId}`,
        ]
      );

      await client.query('COMMIT');

      console.log(`[onboarding] ✓ User ${name} registered | wallet_id: ${walletId} | contract: ${contractAddress}`);

      return NextResponse.json({
        ok: true,
        userId,
        walletId,
        contractAddress,
        tokensRegistered: tokens.length,
      });

    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

  } catch (error: any) {
    console.error('[onboarding] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to register onboarding' },
      { status: 500 }
    );
  }
}
