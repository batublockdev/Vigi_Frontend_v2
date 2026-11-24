/**
 * /api/user/[walletAddress] — Busca si un usuario ya existe con su contrato.
 *
 * Retorna: user info + wallet/contract address si existe.
 * Usado por el onboarding para decidir si redirigir al dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export async function GET(
  _req: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = params.walletAddress;

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json(
        { exists: false, error: 'Invalid wallet address' },
        { status: 400 }
      );
    }

    const pool = getPool();
    const client = await pool.connect();

    try {
      // Buscar usuario por telegram_id (que es la wallet address lowercase)
      const userRes = await client.query(
        `SELECT id, telegram_id, status FROM users WHERE telegram_id = $1`,
        [walletAddress.toLowerCase()]
      );

      if (userRes.rows.length === 0) {
        return NextResponse.json({ exists: false });
      }

      const user = userRes.rows[0];

      // Buscar wallet/contrato asociado
      const walletRes = await client.query(
        `SELECT id, chain_id, contract_address, status
         FROM wallets
         WHERE user_id = $1 AND status = 'active'
         ORDER BY id DESC LIMIT 1`,
        [user.id]
      );

      if (walletRes.rows.length === 0) {
        // Usuario existe pero sin contrato deployado
        return NextResponse.json({
          exists: true,
          hasContract: false,
          user: {
            id: user.id,
            walletAddress: user.telegram_id,
            status: user.status,
          },
        });
      }

      const wallet = walletRes.rows[0];

      // Buscar tokens configurados del usuario desde user_token_config
      const tokensRes = await client.query(
        `SELECT token_symbol, token_address, allocation_pct, stop_loss_pct, take_profit_pct
         FROM user_token_config
         WHERE wallet_id = $1
         ORDER BY id`,
        [wallet.id]
      );

      // Also fetch onboarding log
      const onboardingRes = await client.query(
        `SELECT asset, action, reason
         FROM stockwallet_activity
         WHERE wallet_id = $1 AND type = 'onboarding'
         ORDER BY timestamp DESC LIMIT 1`,
        [wallet.id]
      );

      return NextResponse.json({
        exists: true,
        hasContract: true,
        user: {
          id: user.id,
          walletAddress: user.telegram_id,
          status: user.status,
        },
        contract: {
          walletId: wallet.id,
          chainId: wallet.chain_id,
          address: wallet.contract_address,
          status: wallet.status,
        },
        tokenConfig: tokensRes.rows.map((r: any) => ({
          symbol: r.token_symbol,
          address: r.token_address,
          allocationPct: r.allocation_pct,
          stopLossPct: r.stop_loss_pct,
          takeProfitPct: r.take_profit_pct,
        })),
        onboardingLog: onboardingRes.rows[0] || null,
      });
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[user lookup] Error:', error.message);
    return NextResponse.json(
      { exists: false, error: error.message || 'Failed to lookup user' },
      { status: 500 }
    );
  }
}
