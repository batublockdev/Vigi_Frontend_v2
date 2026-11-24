/**
 * /api/decisions — Lee las decisiones de inversión desde Redis (BullMQ).
 *
 * Retorna los jobs de bull:execution-queue:invest-* con su estado y tx hash.
 * También incluye los snapshots de precios actuales desde Redis.
 */

import { NextResponse } from 'next/server';
import { getInvestDecisions, getPriceSnapshots, TOKEN_SYMBOLS } from '@/lib/redis';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [jobs, snapshots] = await Promise.all([
      getInvestDecisions(),
      getPriceSnapshots(),
    ]);

    // Map jobs to a frontend-friendly format
    const decisions = jobs.map((job) => {
      const retVal = job.returnvalue;
      const isConfirmed = retVal?.status === 'confirmed';
      const isFailed = retVal?.status === 'failed';

      return {
        id: job.id,
        name: job.name,
        action: isConfirmed ? 'INVEST' : isFailed ? 'FAILED' : 'PENDING',
        status: retVal?.status || 'pending',
        txHash: retVal?.txHash || null,
        reason: isFailed
          ? `Invest simulation reverted: ${retVal?.reason || 'unknown'}`
          : isConfirmed
            ? 'Investment executed after deposit'
            : 'Waiting for execution...',
        timestamp: job.timestamp,
        processedOn: job.processedOn || null,
        finishedOn: job.finishedOn || null,
        contractAddress: job.data?.contractAddress || null,
        walletId: job.data?.walletId || null,
        chainId: job.data?.chainId || 56,
      };
    });

    // Map snapshots to readable format
    const prices = snapshots.map((snap) => ({
      tokenIn: snap.tokenIn,
      tokenInSymbol: TOKEN_SYMBOLS[snap.tokenIn?.toLowerCase()] || 'UNKNOWN',
      tokenOut: snap.tokenOut,
      tokenOutSymbol: TOKEN_SYMBOLS[snap.tokenOut?.toLowerCase()] || 'UNKNOWN',
      pricePerUnit: snap.pricePerUnit,
      fee: snap.fee,
      source: snap.source,
      blockNumber: snap.blockNumber,
      timestamp: snap.timestamp,
      marketId: snap.marketId,
    }));

    return NextResponse.json({
      success: true,
      decisions,
      prices,
      stats: {
        total: decisions.length,
        confirmed: decisions.filter((d) => d.status === 'confirmed').length,
        failed: decisions.filter((d) => d.status === 'failed').length,
        pending: decisions.filter((d) => d.status === 'pending').length,
      },
    });
  } catch (error: any) {
    console.error('[api/decisions] Error:', error.message);
    return NextResponse.json(
      {
        success: false,
        decisions: [],
        prices: [],
        stats: { total: 0, confirmed: 0, failed: 0, pending: 0 },
        error: error.message || 'Failed to read Redis data',
      },
      { status: 500 }
    );
  }
}
