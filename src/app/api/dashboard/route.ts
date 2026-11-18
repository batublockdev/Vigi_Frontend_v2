import { NextResponse } from 'next/server';
import { getPool } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    // Parallel queries for all dashboard data
    const [
      botStateRes,
      decisionsRes,
      tradesRes,
      botActivityRes,
      positionsRes,
      statsRes,
    ] = await Promise.all([
      // Bot state
      client.query('SELECT * FROM bot_state ORDER BY id DESC LIMIT 1'),
      // AI decisions (latest 50)
      client.query(
        'SELECT * FROM decisions ORDER BY timestamp DESC LIMIT 50'
      ),
      // Trades (latest 50)
      client.query(
        'SELECT * FROM trades ORDER BY timestamp DESC LIMIT 50'
      ),
      // StockWallet activity log (latest 50)
      client.query(
        'SELECT * FROM stockwallet_activity ORDER BY timestamp DESC LIMIT 50'
      ),
      // Asset status snapshots
      client.query(
        'SELECT * FROM stockwallet_asset_status ORDER BY timestamp DESC'
      ),
      // Stats counts
      client.query(`
        SELECT
          (SELECT COUNT(*) FROM stockwallet_activity) as "totalActivities",
          (SELECT COUNT(*) FROM decisions) as "totalDecisions",
          (SELECT COUNT(DISTINCT asset) FROM stockwallet_asset_status) as "trackedAssets"
      `),
    ]);

    const botState = botStateRes.rows[0] || null;
    const decisions = decisionsRes.rows;
    const trades = tradesRes.rows;
    const botActivity = botActivityRes.rows;
    const positions = positionsRes.rows;
    const stats = statsRes.rows[0] || {
      totalActivities: 0,
      totalDecisions: 0,
      trackedAssets: 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        botState,
        aiCapital: null,
        vaultPortfolio: null,
        aave: { collateral: '0', debt: '0', healthFactor: 'N/A' },
        balances: {},
        prices: {},
        tvls: {},
        knowledge: [],
        decisions,
        trades,
        botActivity,
        positions,
        stats: {
          totalActivities: parseInt(stats.totalActivities) || 0,
          totalDecisions: parseInt(stats.totalDecisions) || 0,
          trackedAssets: parseInt(stats.trackedAssets) || 0,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard data',
        data: {
          botState: null,
          aiCapital: null,
          vaultPortfolio: null,
          aave: { collateral: '0', debt: '0', healthFactor: 'N/A' },
          balances: {},
          prices: {},
          tvls: {},
          knowledge: [],
          decisions: [],
          trades: [],
          botActivity: [],
          positions: [],
          stats: { totalActivities: 0, totalDecisions: 0, trackedAssets: 0 },
        },
      },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
