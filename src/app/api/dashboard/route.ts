import { NextResponse } from 'next/server';

// DB DESCONECTADA — retorna datos vacíos en modo local
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      botState: null,
      aave: { collateral: '0', debt: '0', healthFactor: 'N/A' },
      aiCapital: null,
      vaultPortfolio: null,
      balances: {},
      prices: {},
      tvls: {},
      knowledge: [],
      decisions: [],
      trades: [],
      botActivity: [],
      performance: null,
      positions: [],
      stats: { totalActivities: 0, totalDecisions: 0, trackedAssets: 0 },
    },
  });
}
