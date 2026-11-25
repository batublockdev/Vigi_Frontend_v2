'use client';

import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { BtcLogo, EthLogo, UsdtLogo, NearLogo, ZecLogo, FxiLogo } from './CoinLogos';

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

// Pre-built logos to avoid JSX-in-function parser issues with SWC
const LOGOS: Record<string, React.ReactNode> = {
  ETH: <EthLogo className="h-9 w-9 shrink-0" />,
  WETH: <EthLogo className="h-9 w-9 shrink-0" />,
  BTC: <BtcLogo className="h-9 w-9 shrink-0" />,
  WBTC: <BtcLogo className="h-9 w-9 shrink-0" />,
  BTCB: <BtcLogo className="h-9 w-9 shrink-0" />,
  USDT: <UsdtLogo className="h-9 w-9 shrink-0" />,
  NEAR: <NearLogo className="h-9 w-9 shrink-0" />,
  ZEC: <ZecLogo className="h-9 w-9 shrink-0" />,
  FXI: <FxiLogo className="h-9 w-9 shrink-0" />,
  FXLON: <FxiLogo className="h-9 w-9 shrink-0" />,
};

const NAMES: Record<string, string> = {
  ETH: 'Ethereum',
  WETH: 'Ethereum',
  BTC: 'Bitcoin',
  WBTC: 'Bitcoin',
  BTCB: 'Bitcoin',
  USDT: 'Tether USD',
  NEAR: 'NEAR Protocol',
  ZEC: 'Zcash',
  FXI: 'iShares China Large-Cap ETF',
  FXLON: 'iShares China Large-Cap ETF',
};

function getTokenInfo(symbol: string, tokenConfig: TokenConfigItem[]) {
  const sym = (symbol || '').toUpperCase();
  const cfg = tokenConfig.find((t) => t.symbol.toUpperCase() === sym);
  const stopLossLabel = cfg ? `${cfg.stopLossPct}% Max Loss` : '5% Max Loss';
  const takeProfitLabel = cfg ? `${cfg.takeProfitPct}% Target Profit` : '15% Target Profit';

  if (sym === 'USDT' || sym === 'USD₮') {
    return {
      name: 'Tether USD',
      ticker: 'USDT',
      logo: LOGOS['USDT'],
      stopLoss: 'Peg Guard',
      takeProfit: 'Stable',
    };
  }

  if (sym === 'ETH' || sym === 'WETH') {
    return {
      name: 'Ethereum',
      ticker: 'ETH',
      logo: LOGOS['ETH'],
      stopLoss: stopLossLabel,
      takeProfit: takeProfitLabel,
    };
  }

  if (sym === 'BTC' || sym === 'WBTC' || sym === 'BTCB') {
    return {
      name: 'Bitcoin',
      ticker: sym === 'BTCB' ? 'BTCB' : 'BTC',
      logo: LOGOS['BTCB'],
      stopLoss: stopLossLabel,
      takeProfit: takeProfitLabel,
    };
  }

  // Default fallback — usar logo del mapa si existe (NEAR, ZEC, FXION, etc.)
  return {
    name: NAMES[sym] || symbol || 'Selected Token',
    ticker: (symbol || 'TKN').slice(0, 6),
    logo: LOGOS[sym] || null,
    stopLoss: stopLossLabel,
    takeProfit: takeProfitLabel,
  };
}

function FallbackLogo({ symbol }: { symbol: string }) {
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-200 text-[10px] font-bold text-stone-600">
      {(symbol || 'TKN').slice(0, 3)}
    </div>
  );
}

export const SelectedTokens: React.FC<SelectedTokensProps> = ({
  positions,
  portfolioAddress,
  onAddFunds,
  tokenConfig = [],
}) => {
  const [showConfig, setShowConfig] = useState(false);

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
            Live token balances held by the portfolio vault on BNB Chain.
          </p>
          {portfolioAddress && (
            <a
              className="mt-1.5 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[#2540EB] hover:underline"
              href={`https://bscscan.com/address/${portfolioAddress}`}
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
            const info = getTokenInfo(tk.symbol, tokenConfig);
            return (
              <div key={tk.symbol} className="px-8 py-6 transition hover:bg-stone-50/50">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  {/* Token Identity */}
                  <div className="flex items-center gap-4">
                    {info.logo || <FallbackLogo symbol={tk.symbol} />}
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
                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Allocation
                      </span>
                      <span className="font-mono text-sm font-bold text-[#2540EB]">
                        {tk.allocationPct}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Stop Loss
                      </span>
                      <span className="inline-block rounded border border-red-200/60 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-700">
                        -{tk.stopLossPct}%
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Take Profit
                      </span>
                      <span className="inline-block rounded border border-green-200/60 bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700">
                        +{tk.takeProfitPct}%
                      </span>
                    </div>

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
            const info = getTokenInfo(pos.asset_symbol, tokenConfig);
            const isPositive = pos.pnlValue >= 0;
            const hasQuote = pos.estimatedValueNum > 0;
            const hasInvested = pos.investedNum > 0 || (parseFloat(pos.invested) || 0) > 0;
            const displayValue = hasQuote ? pos.estimatedValueNum : (pos.investedNum || parseFloat(pos.invested) || 0);
            const displayPnlValue = hasQuote ? pos.pnlValue : 0;
            const displayPnlPercent = hasQuote ? pos.pnlPercent : 0;

            return (
              <div key={pos.asset} className="px-8 py-6 transition hover:bg-stone-50/50">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    {info.logo || <FallbackLogo symbol={pos.asset_symbol} />}
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
                        {displayValue > 0
                          ? `$${displayValue.toFixed(4)} USD${!hasQuote ? ' (cost)' : ''}`
                          : 'No balance'}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Return
                      </span>
                      {hasQuote && hasInvested ? (
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-block font-mono text-xs font-bold rounded px-2 py-0.5 ${isPositive ? 'bg-[#2540EB]/5 text-[#2540EB] border border-[#2540EB]/10' : 'bg-stone-100 text-[#6B7280] border border-stone-200/60'}`}>
                            {isPositive ? '+' : ''}{displayPnlPercent.toFixed(2)}%
                          </span>
                          <span className="font-mono text-[11px] text-[#6B7280]">
                            ({isPositive ? '+' : ''}${Math.abs(displayPnlValue).toFixed(4)})
                          </span>
                        </div>
                      ) : hasInvested ? (
                        <span className="text-xs font-medium text-[#6B7280]">
                          Invested: ${(pos.investedNum || parseFloat(pos.invested) || 0).toFixed(4)}
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-[#6B7280]">
                          {info.ticker === 'USDT' ? 'Stable' : 'No investment yet'}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Stop Loss
                      </span>
                      <span className="inline-block rounded border border-red-200/60 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700">
                        -{info.stopLoss.replace('% Max Loss', '')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Take Profit
                      </span>
                      <span className="inline-block rounded border border-green-200/60 bg-green-50 px-2 py-0.5 text-[11px] font-bold text-green-700">
                        +{info.takeProfit.replace('% Target Profit', '')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#6B7280]">
                        Invested
                      </span>
                      <span className="font-mono text-sm font-bold text-[#0C1424]">
                        {hasInvested
                          ? `$${(pos.investedNum || parseFloat(pos.invested) || 0).toFixed(4)}`
                          : '—'}
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
