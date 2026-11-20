/**
 * /api/dashboard/[walletAddress] — Get dashboard data for a specific wallet.
 *
 * Reads from PostgreSQL:
 * - stockwallet_asset_status (current positions)
 * - stockwallet_activity (recent activity log)
 * - execution_records (recent executions)
 * - contract_runtime_state (pause status)
 *
 * Reads on-chain:
 * - Token balances from the StockWallet contract
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPool } from '@/lib/db';
import { publicClient, BSC_TOKENS } from '@/lib/web3';
import { getAddress, formatUnits } from 'viem';
import { erc20Abi } from 'viem';

export async function GET(
  req: NextRequest,
  { params }: { params: { walletAddress: string } }
) {
  try {
    const walletAddress = params.walletAddress;

    if (!walletAddress || !walletAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid wallet address' }, { status: 400 });
    }

    const pool = getPool();

    // Find wallet by contract_address
    const walletRes = await pool.query(
      `SELECT w.id, w.user_id, w.chain_id, w.contract_address, w.status,
              crs.pause_until, crs.last_evaluated_at, crs.last_block_processed
       FROM wallets w
       LEFT JOIN contract_runtime_state crs ON crs.wallet_id = w.id
       WHERE w.contract_address = $1 AND w.status = 'active'`,
      [walletAddress.toLowerCase()]
    );

    if (walletRes.rows.length === 0) {
      return NextResponse.json({ error: 'Wallet not found' }, { status: 404 });
    }

    const wallet = walletRes.rows[0];
    const walletId = wallet.id;
    const contractAddress = wallet.contract_address;

    // Fetch asset statuses
    const assetsRes = await pool.query(
      `SELECT * FROM stockwallet_asset_status
       WHERE wallet_id = $1
       ORDER BY updated_at DESC`,
      [walletId]
    );

    // Fetch recent activity (last 50)
    const activityRes = await pool.query(
      `SELECT * FROM stockwallet_activity
       WHERE wallet_id = $1
       ORDER BY timestamp DESC
       LIMIT 50`,
      [walletId]
    );

    // Fetch recent execution records
    const execRes = await pool.query(
      `SELECT * FROM execution_records
       WHERE wallet_id = $1
       ORDER BY detected_at DESC
       LIMIT 20`,
      [walletId]
    );

    // Check pause status
    const pauseUntil = Number(wallet.pause_until || 0);
    const isPaused = Math.floor(Date.now() / 1000) < pauseUntil;

    // Try to read on-chain USDT balance of the contract
    let usdtBalance = '0';
    try {
      const balance = await publicClient.readContract({
        address: BSC_TOKENS.USDT.address as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [contractAddress as `0x${string}`],
      });
      usdtBalance = formatUnits(balance, BSC_TOKENS.USDT.decimals);
    } catch {
      // On-chain read may fail — return DB data only
    }

    return NextResponse.json({
      wallet: {
        id: walletId,
        contractAddress,
        chainId: wallet.chain_id,
        status: wallet.status,
        isPaused,
        pauseUntil,
        lastEvaluatedAt: wallet.last_evaluated_at,
        lastBlockProcessed: wallet.last_block_processed,
      },
      assets: assetsRes.rows,
      activity: activityRes.rows,
      executions: execRes.rows,
      usdtBalance,
    });

  } catch (error: any) {
    console.error('[dashboard] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
