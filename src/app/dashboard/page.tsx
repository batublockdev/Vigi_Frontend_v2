'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AccountSummary } from '@/components/AccountSummary';
import { SelectedTokens } from '@/components/SelectedTokens';
import { CashReserve } from '@/components/CashReserve';
import { AiActivity } from '@/components/AiActivity';
import { ProtectionLog } from '@/components/ProtectionLog';
import { InvestModal } from '@/components/InvestModal';
import { DecisionsSidebar } from '@/components/DecisionsSidebar';

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isInvestModalOpen, setIsInvestModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'reserve' | 'audit'>('overview');
  const [contractAddress, setContractAddress] = useState<string | null>(null);
  const [tokenConfig, setTokenConfig] = useState<any[]>([]);
  const [distribution, setDistribution] = useState({
    tokensPct: 78,
    aiAgentPct: 20,
    gasPct: 2,
  });
  // Redis decisions (invest executions from BullMQ)
  const [redisDecisions, setRedisDecisions] = useState<any[]>([]);
  const [redisPrices, setRedisPrices] = useState<any[]>([]);

  // ---- Fetch Redis decisions (invest executions) ----
  const fetchRedisData = useCallback(async () => {
    try {
      const res = await fetch('/api/decisions');
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setRedisDecisions(json.decisions || []);
          setRedisPrices(json.prices || []);
        }
      }
    } catch (err) {
      console.error('Error fetching Redis decisions:', err);
    }
  }, []);

  // ---- Detectar contrato del usuario al cargar ----
  useEffect(() => {
    // 1. Intentar desde localStorage (guardado por onboarding)
    const saved = localStorage.getItem('stockWalletAddress');
    if (saved && saved !== '0x0000000000000000000000000000000000000000') {
      setContractAddress(saved);
      // También buscar tokenConfig desde la API
      const provider = typeof window !== 'undefined' ? (window as any).ethereum : null;
      if (provider) {
        provider.request({ method: 'eth_accounts' }).then(async (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            try {
              const res = await fetch(`/api/user/${accounts[0]}`);
              if (res.ok) {
                const userData = await res.json();
                if (userData.tokenConfig) setTokenConfig(userData.tokenConfig);
              }
            } catch {}
          }
        }).catch(() => {});
      }
      return;
    }

    // 2. Si no hay en localStorage, buscar por wallet address en MetaMask
    const provider = typeof window !== 'undefined' ? (window as any).ethereum : null;
    if (provider) {
      provider
        .request({ method: 'eth_accounts' })
        .then(async (accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            try {
              const res = await fetch(`/api/user/${accounts[0]}`);
              if (res.ok) {
                const userData = await res.json();
                if (userData.exists && userData.hasContract) {
                  localStorage.setItem('stockWalletAddress', userData.contract.address);
                  setContractAddress(userData.contract.address);
                  if (userData.tokenConfig) setTokenConfig(userData.tokenConfig);
                }
              }
            } catch (err) {
              console.error('Error fetching user contract:', err);
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  // Store raw on-chain assets separately so we can recalc when redisPrices arrive
  const [rawAssets, setRawAssets] = useState<any[]>([]);
  const [rawUsdt, setRawUsdt] = useState('0');

  const fetchData = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      try {
        const savedContract = contractAddress || localStorage.getItem('stockWalletAddress');
        if (savedContract && savedContract !== '0x0000000000000000000000000000000000000000') {
          // 1. Leer config de tokens directamente del contrato on-chain
          const portfolioRes = await fetch(`/api/portfolio/${savedContract}`);
          if (portfolioRes.ok) {
            const portfolio = await portfolioRes.json();
            const onChainAssets = portfolio.assets || [];
            setRawAssets(onChainAssets);
            setRawUsdt(portfolio.usdtBalance || '0');
            // Guardar config on-chain para SelectedTokens
            setTokenConfig(onChainAssets.map((a: any) => ({
              symbol: a.symbol,
              address: a.address,
              allocationPct: a.allocationPct,
              stopLossPct: a.stopLossPct,
              takeProfitPct: a.takeProfitPct,
            })));
            // Guardar distribución leída del contrato (gasFee y adgentPercentage de storage slots)
            if (portfolio.tokensPercentagePct !== undefined) {
              setDistribution({
                tokensPct: portfolio.tokensPercentagePct,
                aiAgentPct: portfolio.adgentPercentagePct,
                gasPct: portfolio.gasFeePct,
              });
            }
            return;
          }
        }

        // Fallback: dashboard general
        const res = await fetch('/api/dashboard');
        const json = await res.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
        if (isManual) setRefreshing(false);
      }
    },
    [contractAddress]
  );

  useEffect(() => {
    if (contractAddress) {
      fetchData();
    }
  }, [contractAddress, fetchData]);

  // Fetch Redis data on mount and every 15s alongside dashboard data
  useEffect(() => {
    fetchRedisData();
    const interval = setInterval(() => {
      fetchRedisData();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchRedisData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // === Recalcular posiciones cuando rawAssets o redisPrices cambien ===
  useEffect(() => {
    if (rawAssets.length === 0) return;

    const positionsWithValues = rawAssets
      .filter((a: any) => parseFloat(a.balance) > 0)
      .map((a: any) => {
        const snap = redisPrices.find((p: any) => p.tokenIn?.toLowerCase() === a.address?.toLowerCase());
        let estimatedValue = 0;
        const investedNum = parseFloat(a.invested) || 0;
        if (snap && snap.pricePerUnit) {
          const pricePerUnitFloat = parseFloat(snap.pricePerUnit) / Math.pow(10, 18);
          const balanceNum = parseFloat(a.balance) || 0;
          estimatedValue = balanceNum * pricePerUnitFloat;
        }
        const pnlValue = estimatedValue - investedNum;
        const pnlPercent = investedNum > 0 ? (pnlValue / investedNum) * 100 : 0;
        return {
          asset: a.address,
          asset_symbol: a.symbol,
          balance: a.balance,
          estimated_value: estimatedValue.toString(),
          invested: a.invested,
          action: 'hold',
          estimatedValueNum: estimatedValue,
          investedNum,
          pnlValue,
          pnlPercent,
        };
      });

    const totalTokensValue = positionsWithValues.reduce((sum: number, p: any) => sum + p.estimatedValueNum, 0);
    const usdtBalanceNum = parseFloat(rawUsdt || '0');
    const totalPortfolioValue = totalTokensValue + usdtBalanceNum;

    const savedContract = contractAddress || localStorage.getItem('stockWalletAddress');

    setData({
      botState: { isPaused: false, pauseUntil: 0 },
      aiCapital: null,
      vaultPortfolio: {
        address: savedContract || '',
        positions: positionsWithValues,
        totalValue: totalTokensValue,
      },
      aave: { collateral: '0', debt: '0', healthFactor: 'N/A' },
      balances: { USDT: rawUsdt },
      decisions: [],
      trades: [],
      botActivity: [],
      positions: positionsWithValues,
      stats: {
        totalActivities: 0,
        totalDecisions: 0,
        trackedAssets: rawAssets.length,
      },
      totalPortfolioValue,
    });
  }, [rawAssets, redisPrices, rawUsdt, contractAddress]);

  const {
    botState,
    aiCapital,
    vaultPortfolio,
    aave = { collateral: '0', debt: '0', healthFactor: 'N/A' },
    balances = {},
    decisions = [],
    trades = [],
    botActivity = [],
    positions = [],
    stats = { totalActivities: 0, totalDecisions: 0, trackedAssets: 0 },
  } = data || {};

  const aaveCollateralUSD = aiCapital ? parseFloat(aiCapital.collateral) : 0;
  const walletUsdtUSD = parseFloat(balances['USDT'] || '0');
  const portfolioPositions = vaultPortfolio?.positions || [];
  const tokensValueUSD = vaultPortfolio?.totalValue || 0;
  const totalBalanceUSD = data?.totalPortfolioValue || (aaveCollateralUSD + walletUsdtUSD + tokensValueUSD);
  const totalInvestedUSD = portfolioPositions.reduce((sum: number, p: any) => sum + (p.investedNum || parseFloat(p.invested) || 0), 0);
  const totalGainAmountUSD = tokensValueUSD - totalInvestedUSD;
  const totalGainPercent = totalInvestedUSD > 0 ? (totalGainAmountUSD / totalInvestedUSD) * 100 : 0;

  // Latest decision for CashReserve — always the most recent, including hold
  const latestDecision = decisions[0] || null;

  // El % asignado al AI adgent viene del contrato (adgentPercentage). Si es 0,
  // el vault no destina capital al agente autónomo → se oculta la sección.
  const hasAiAgent = distribution.aiAgentPct > 0;

  // Si la distribución cambia a 0% AI mientras el tab está activo, volver a Portfolio
  // (siempre declarado ANTES del early return — Rules of Hooks)
  useEffect(() => {
    if (!hasAiAgent && activeTab === 'reserve') setActiveTab('overview');
  }, [hasAiAgent, activeTab]);

  if (loading && !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F5F5F4] text-[#0C1424]">
        <div className="h-6 w-6 border-2 border-[#2540EB] border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-[11px] font-medium uppercase tracking-wider text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>
          Loading Portfolio...
        </p>
      </div>
    );
  }

  // Removed "Vigi Activity" tab — now lives permanently in the sidebar
  const tabs: Array<{ id: string; label: string; count?: number }> = [
    { id: 'overview', label: 'Portfolio' },
    { id: 'tokens', label: `Tokens ${distribution.tokensPct}%`, count: portfolioPositions.length || tokenConfig.length },
    ...(hasAiAgent ? [{ id: 'reserve' as const, label: `Vigi Capital ${distribution.aiAgentPct}%` }] : []),
    { id: 'audit', label: 'Safety Log', count: stats.totalActivities },
  ];

  return (
    <div className="min-h-screen bg-[#F5F5F4] text-[#0C1424] flex flex-col">
      {/* Main layout: 2 columns — content fills left, sidebar right */}
      <div className="flex flex-1 gap-6 px-6 py-12">
        {/* Main content — fills all available width */}
        <main className="flex-1 min-w-0 space-y-8">
          {/* Back link */}
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>
            <Link href="/" className="hover:text-[#2540EB] transition-colors">
              ← Vigi Protocol
            </Link>
            <span className="text-stone-300">/</span>
            <span className="text-[#0C1424]">Dashboard</span>
          </div>

          {/* Account Summary */}
          <AccountSummary
            totalBalance={totalBalanceUSD}
            tokensValue={tokensValueUSD}
            reserveValue={aaveCollateralUSD}
            cashValue={walletUsdtUSD}
            totalGainAmount={totalGainAmountUSD}
            totalGainPercent={totalGainPercent}
            showPerformance={totalInvestedUSD > 0}
            onAddFunds={() => setIsInvestModalOpen(true)}
            activeTokens={portfolioPositions.map((p: any) => p.asset_symbol).filter(Boolean)}
            aiAgentPct={distribution.aiAgentPct}
          />

          {/* Tab Navigation */}
          <div className="flex border-b border-stone-200/60 gap-1 overflow-x-auto pb-px">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 whitespace-nowrap px-4 py-3 text-[11px] font-medium uppercase tracking-wider transition-colors duration-300 border-b-2 ${
                    isActive
                      ? 'border-[#2540EB] text-[#2540EB]'
                      : 'border-transparent text-ink-muted hover:text-[#0C1424]'
                  }`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                        isActive
                          ? 'bg-[#2540EB]/10 text-[#2540EB]'
                          : 'bg-stone-200/60 text-ink-muted'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab Views */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <SelectedTokens
                positions={portfolioPositions}
                portfolioAddress={vaultPortfolio?.address}
                onAddFunds={() => setIsInvestModalOpen(true)}
                tokenConfig={tokenConfig}
              />
              {hasAiAgent && (
                <CashReserve
                  aave={{
                    collateral: aiCapital?.collateral || '0',
                    debt: '0',
                    healthFactor: aiCapital ? 'N/A' : 'Unavailable',
                  }}
                  accountAddress={aiCapital?.address}
                  tokenBalances={aiCapital ? { USDT: aiCapital.usdt, aCelUSDT: aiCapital.aCelUSDT } : null}
                  onAddFunds={() => setIsInvestModalOpen(true)}
                  latestDecision={latestDecision}
                />
              )}
            </div>
          )}

          {activeTab === 'tokens' && (
            <div className="space-y-8">
              <SelectedTokens
                positions={portfolioPositions}
                portfolioAddress={vaultPortfolio?.address}
                onAddFunds={() => setIsInvestModalOpen(true)}
                tokenConfig={tokenConfig}
              />
            </div>
          )}

          {activeTab === 'reserve' && (
            <div className="space-y-8">
              <CashReserve
                aave={{
                  collateral: aiCapital?.collateral || '0',
                  debt: '0',
                  healthFactor: aiCapital ? 'N/A' : 'Unavailable',
                }}
                accountAddress={aiCapital?.address}
                tokenBalances={aiCapital ? { USDT: aiCapital.usdt, aCelUSDT: aiCapital.aCelUSDT } : null}
                onAddFunds={() => setIsInvestModalOpen(true)}
                latestDecision={latestDecision}
              />
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-8">
              <ProtectionLog />
            </div>
          )}
        </main>

        {/* Sidebar — right column, desktop only, sticky inside its column */}
        <div className="hidden lg:flex flex-col w-[340px] shrink-0">
          <div className="sticky top-6 h-[calc(100vh-120px)] rounded-2xl border border-stone-200/60 shadow-lg shadow-[#0C1424]/[0.03] overflow-hidden">
            <DecisionsSidebar decisions={[
              // 1. Redis decisions (invest executions from BullMQ) — highest priority
              ...redisDecisions.map((d: any) => ({
                id: `redis-${d.id}`,
                timestamp: d.timestamp,
                action: d.action,
                asset: d.contractAddress
                  ? `${d.contractAddress.slice(0, 6)}...${d.contractAddress.slice(-4)}`
                  : null,
                amount: null,
                reason: d.reason,
                confidence: 0,
                level: 'bot',
                executed: d.status === 'confirmed' ? 1 : 0,
                status: d.status,
                tx_hash: d.txHash,
                result: '',
              })),
              // 2. PostgreSQL bot activity (deposits, invests, failures)
              ...(botActivity as any[])
                .filter((a: any) => {
                  // Skip if already in redisDecisions by tx_hash
                  const tx = a.tx_hash;
                  if (!tx) return true;
                  return !redisDecisions.some((d: any) => d.txHash === tx);
                })
                .map((a: any) => ({
                  id: 2000 + a.id,
                  timestamp: a.timestamp,
                  action: a.action,
                  asset: a.asset_symbol || a.asset,
                  amount: a.balance || a.estimated_value,
                  reason: a.reason || '',
                  confidence: a.confidence || 0,
                  level: 'bot',
                  executed: a.tx_hash ? 1 : 0,
                  result: '',
                  tx_hash: a.tx_hash,
                })),
              // 3. PostgreSQL decisions (AI agent LLM decisions)
              ...(decisions as any[])
                .filter((d: any) => {
                  const tx = d.tx_hash;
                  if (!tx) return d.action !== 'hold';
                  return !(botActivity as any[]).some((a: any) => a.tx_hash === tx) &&
                         !redisDecisions.some((r: any) => r.txHash === tx);
                }),
              // 4. PostgreSQL trades
              ...(trades as any[])
                .filter((t: any) => {
                  const tx = t.tx_hash;
                  if (!tx) return true;
                  return !(botActivity as any[]).some((a: any) => a.tx_hash === tx) &&
                         !(decisions as any[]).some((d: any) => d.tx_hash === tx) &&
                         !redisDecisions.some((r: any) => r.txHash === tx);
                })
                .map((t: any) => ({
                  id: 1000 + t.id,
                  timestamp: t.timestamp,
                  action: t.action,
                  asset: t.asset,
                  amount: t.amount,
                  reason: t.reason || '',
                  confidence: t.confidence || 0,
                  level: t.level || 'alto',
                  executed: 1,
                  result: '',
                  tx_hash: t.tx_hash,
                })),
            ].sort((a: any, b: any) => {
              const ta = typeof a.timestamp === 'number' ? a.timestamp : parseInt(a.timestamp, 10);
              const tb = typeof b.timestamp === 'number' ? b.timestamp : parseInt(b.timestamp, 10);
              return tb - ta;
            })} />
          </div>
        </div>
      </div>

      <InvestModal
        isOpen={isInvestModalOpen}
        onClose={() => setIsInvestModalOpen(false)}
        tokenConfig={tokenConfig}
        distribution={distribution}
        vaultAddress={contractAddress || null}
      />

      {/* Footer */}
      <footer className="mt-12 border-t border-stone-200/60 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 sm:flex-row">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#2540EB]" />
            <span className="text-[11px] font-medium uppercase tracking-wider text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>
              Vigi · Live on-chain · Displaying in USD
            </span>
          </div>
          <p className="text-[11px] text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>
            Automated wealth management with stop-loss protection.
          </p>
        </div>
      </footer>
    </div>
  );
}
