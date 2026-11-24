'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { BtcLogo, EthLogo, UsdtLogo } from './CoinLogos';

export interface PositionData {
  id: number;
  timestamp: string;
  asset: string;
  asset_symbol: string;
  balance: string;
  estimated_value: string;
  invested: string;
  action: string;
  reason: string;
  pool_fee?: number;
  tx_hash?: string;
  estimatedValueNum: number;
  investedNum: number;
  pnlValue: number;
  pnlPercent: number;
}

export interface TokenConfigItem {
  symbol: string;
  address: string;
  allocationPct: number;
  stopLossPct: number;
  takeProfitPct: number;
}

interface SelectedTokensProps {
  positions: PositionData[];
  portfolioAddress?: string;
  onAddFunds: () => void;
  tokenConfig?: TokenConfigItem[];
}

export const SelectedTokens: React.FC<SelectedTokensProps> = ({
  positions,
  portfolioAddress,
  onAddFunds,
  tokenConfig = [],
}) => {
  const [showConfig, setShowConfig] = useState(false);

  const getTokenInfo = (symbol: string) => {
    // Buscar config desde la DB primero
    const cfg = tokenConfig.find(
      (t) => t.symbol.toUpperCase() === symbol?.toUpperCase()
    );

    const stopLossLabel = cfg
      ? `${cfg.stopLossPct}% Max Loss`
      : '5% Max Loss';
    const takeProfitLabel = cfg
      ? `${cfg.takeProfitPct}% Target Profit`
      : '15% Target Profit';

    switch (symbol?.toUpperCase()) {
      case 'WETH':
      case 'ETH':
        return {
          name: 'Ethereum',
          ticker: 'ETH',
          logo: <EthLogo className="h-9 w-9 shrink-0" />,
          stopLoss: stopLossLabel,
          takeProfit: takeProfitLabel,
        };
      case 'WBTC':
      case 'BTCB':
        return {
          name: 'Bitcoin',
          ticker: symbol?.toUpperCase() === 'BTCB' ? 'BTCB' : 'BTC',
          logo: <BtcLogo className="h-9 w-9 shrink-0" />,
          stopLoss: stopLossLabel,
          takeProfit: takeProfitLabel,
        };
      case 'USD₮':
      case 'USDT':
        return {
          name: 'Tether USD',
          ticker: 'USDT',
          logo: <UsdtLogo className="h-9 w-9 shrink-0" />,
          stopLoss: 'Peg Guard',
          takeProfit: 'Stable',
        };
      default:
        return {
          name: symbol || 'Selected Token',
          ticker: symbol?.slice(0, 6) || 'TKN',
          logo: (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600">
              {symbol?.slice(0, 3) || 'TKN'}
            </div>
          ),
          stopLoss: stopLossLabel,
          takeProfit: takeProfitLabel,
        };
    }
  };

  return (
    <div
      className="overflow-hidden rounded-2xl border border-stone-200/60 bg-[#FAFAF9] shadow-xs"
      style={{ fontFamily: 'var(--font-inter)' }}
    >
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-stone-100 px-8 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2
            className="text-lg font-bold text-[#0C1424]"
            style={{ fontFamily: 'var(--font-playfair)' }}
          >
            Selected Tokens &amp; Safety Limits
          </h2>
          <p className="text-xs text-[#6B7280]">
            Live token balances held by the portfolio vault on Celo.
          </p>
          {portfolioAddress && (
            <a
              className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#2540EB] hover:underline"
              href={`https://celoscan.io/address/${portfolioAddress}`}
              target="_blank"
              rel="noreferrer"
            >
              <span>Vault: {portfolioAddress}</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <button
          onClick={() => setShowConfig(!showConfig)}
          className="text-[10px] font-bold uppercase tracking-wider text-[#2540EB] hover:opacity-70 transition"
        >
          {showConfig ? 'Hide Limits Detail' : 'View Safety Limits Detail'}
        </button>
      </div>

      {/* Token Rows */}
      <div className="divide-y divide-stone-100">
        {positions.length === 0 && tokenConfig.length === 0 ? (
          <div className="py-16 text-center text-sm text-[#6B7280]">
            No tokens currently active.
          </div>
        ) : positions.length === 0 && tokenConfig.length > 0 ? (
          /* === MODO CONFIGURACIÓN: tokens seleccionados sin balance on-chain aún === */
          tokenConfig.map((tk) => {
            const info = getTokenInfo(tk.symbol);
            return (
              <div key={tk.symbol} className="px-8 py-6 transition hover:bg-stone-50/50">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  {/* Token Identity */}
                  <div className="flex items-center gap-4">
                    {info.logo}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0C1424]" style={{ fontFamily: 'var(--font-inter)' }}>
                          {info.name}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                          {info.ticker}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[#6B7280]">
                        Allocation: <span className="font-bold text-[#2540EB]">{tk.allocationPct}%</span> of portfolio
                      </span>
                    </div>
                  </div>

                  {/* Risk Config */}
                  <div className="flex flex-wrap items-center gap-8 sm:gap-10">
                    {/* Allocation */}
                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Allocation
                      </span>
                      <span className="font-mono text-sm font-bold text-[#2540EB]">
                        {tk.allocationPct}%
                      </span>
                    </div>

                    {/* Stop Loss */}
                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Stop Loss
                      </span>
                      <span className="inline-block rounded border border-red-200/60 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                        -{tk.stopLossPct}%
                      </span>
                    </div>

                    {/* Take Profit */}
                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Take Profit
                      </span>
                      <span className="inline-block rounded border border-green-200/60 bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
                        +{tk.takeProfitPct}%
                      </span>
                    </div>

                    {/* Status */}
                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Status
                      </span>
                      <span className="inline-block rounded border border-amber-200/60 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700">
                        Waiting for deposit
                      </span>
                    </div>
                  </div>
                </div>

                {/* Safety Limits Detail */}
                {showConfig && (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200/60 bg-stone-50/50 px-5 py-4 text-xs text-[#6B7280]">
                    <div className="max-w-md">
                      <span className="font-bold text-[#0C1424]">Stop-Loss Protection: </span>
                      <span>
                        If {info.name} drops {tk.stopLossPct}% from cost basis, AI automatically sells into USDT.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-stone-200/60 bg-white px-2.5 py-1 font-bold text-[#0C1424]">
                        Stop: -{tk.stopLossPct}%
                      </span>
                      <span className="rounded-lg border border-stone-200/60 bg-white px-2.5 py-1 font-bold text-[#0C1424]">
                        Target: +{tk.takeProfitPct}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          /* === MODO LIVE: positions on-chain con balances reales === */
          positions.map((pos) => {
            const info = getTokenInfo(pos.asset_symbol);
            const isPositive = pos.pnlValue >= 0;
            const hasQuote = pos.estimatedValueNum > 0;

            return (
              <div key={pos.asset} className="px-8 py-6 transition hover:bg-stone-50/50">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {info.logo}
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[#0C1424]" style={{ fontFamily: 'var(--font-inter)' }}>
                          {info.name}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                          {info.ticker}
                        </span>
                      </div>
                      <span className="font-mono text-[11px] text-[#6B7280]">
                        Holdings:{' '}
                        {parseFloat(pos.balance || '0').toLocaleString('en-US', { maximumFractionDigits: 6 })}{' '}
                        {info.ticker}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-8 sm:gap-10">
                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Market Value
                      </span>
                      <span className="font-mono text-sm font-bold text-[#0C1424]">
                        {hasQuote ? `$${pos.estimatedValueNum.toFixed(4)} USD` : 'Calculating…'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Return
                      </span>
                      {hasQuote && pos.investedNum > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block font-mono text-xs font-bold rounded px-2 py-0.5 ${isPositive ? 'bg-[#2540EB]/5 text-[#2540EB] border border-[#2540EB]/10' : 'bg-stone-100 text-[#6B7280] border border-stone-200/60'}`}>
                            {isPositive ? '+' : ''}{pos.pnlPercent.toFixed(2)}%
                          </span>
                          <span className="font-mono text-[11px] text-[#6B7280]">
                            ({isPositive ? '+' : ''}${Math.abs(pos.pnlValue).toFixed(4)})
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs font-medium text-[#6B7280]">
                          {info.ticker === 'USDT' ? 'Stable' : 'Basis unavailable'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Status
                      </span>
                      <span className="inline-block rounded border border-[#2540EB]/10 bg-[#2540EB]/5 px-2.5 py-0.5 text-[11px] font-bold text-[#2540EB]">
                        On-chain balance
                      </span>
                    </div>
                  </div>
                </div>

                {showConfig && (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200/60 bg-stone-50/50 px-5 py-4 text-xs text-[#6B7280]">
                    <div className="max-w-md">
                      <span className="font-bold text-[#0C1424]">Stop-Loss Protection: </span>
                      <span>
                        If {info.name} drops past threshold, AI automatically sells into safe cash.
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg border border-stone-200/60 bg-white px-2.5 py-1 font-bold text-[#0C1424]">
                        Stop: {info.stopLoss}
                      </span>
                      <span className="rounded-lg border border-stone-200/60 bg-white px-2.5 py-1 font-bold text-[#0C1424]">
                        Target: {info.takeProfit}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
