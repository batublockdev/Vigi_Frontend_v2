'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, User, Coins, Shield, PieChart,
  Wallet, AlertCircle, Plus, Minus, Info, TrendingUp, Gem, Globe
} from 'lucide-react';
import { ALL_TOKENS, INVESTOR_TYPES, CHAIN_COLORS } from '@/lib/tokens';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield, TrendingUp, Gem, Globe,
};

interface TokenConfig {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  color: string;
  chain: string;
  stopLossPct: number;
  takeProfitPct: number;
  allocationPct: number;
}

interface UserProfile {
  name: string;
  tokens: TokenConfig[];
  depositAmount: string;
  depositToken: string;
  createdAt: string;
}

const STEPS = [
  { id: 1, label: 'Nombre', icon: User },
  { id: 2, label: 'Perfil', icon: Shield },
  { id: 3, label: 'Tokens', icon: Coins },
  { id: 4, label: 'Risk', icon: AlertCircle },
  { id: 5, label: 'Distrib.', icon: PieChart },
  { id: 6, label: 'Resumen', icon: Wallet },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [tokenConfigs, setTokenConfigs] = useState<Record<string, { stopLossPct: number; takeProfitPct: number; allocationPct: number }>>({});
  const [saved, setSaved] = useState(false);
  const [infoToken, setInfoToken] = useState<string | null>(null);
  const [investorType, setInvestorType] = useState<string | null>(null);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [tokenPage, setTokenPage] = useState(0);
  const [riskPage, setRiskPage] = useState(0);
  const TOKENS_PER_PAGE = 8;
  const RISK_PER_PAGE = 6;

  useEffect(() => {
    const stored = localStorage.getItem('vigi_user_profile');
    if (stored) {
      try {
        const profile: UserProfile = JSON.parse(stored);
        setName(profile.name);
        setSelectedTokens(profile.tokens.map(t => t.symbol));
        const configs: Record<string, any> = {};
        profile.tokens.forEach(t => {
          configs[t.symbol] = { stopLossPct: t.stopLossPct, takeProfitPct: t.takeProfitPct, allocationPct: t.allocationPct };
        });
        setTokenConfigs(configs);
      } catch (e) {}
    }
  }, []);

  const selectedTokenObjs = ALL_TOKENS.filter(t => selectedTokens.includes(t.symbol));
  const totalAllocation = selectedTokenObjs.reduce((sum, t) => sum + (tokenConfigs[t.symbol]?.allocationPct || 0), 0);

  const canProceed = () => {
    switch (step) {
      case 1: return name.trim().length >= 2;
      case 2: return investorType !== null;
      case 3: return selectedTokens.length >= 1;
      case 4: return selectedTokens.every(s => { const c = tokenConfigs[s]; return c && c.stopLossPct > 0 && c.takeProfitPct > 0; });
      case 5: return Math.abs(totalAllocation - 100) < 0.01;
      case 6: return true;
      default: return false;
    }
  };

  const handleSave = () => {
    const profile: UserProfile = {
      name: name.trim(),
      tokens: selectedTokenObjs.map(t => ({
        symbol: t.symbol, name: t.name, address: t.address, decimals: t.decimals, color: t.color, chain: t.chain,
        stopLossPct: tokenConfigs[t.symbol]?.stopLossPct || 5,
        takeProfitPct: tokenConfigs[t.symbol]?.takeProfitPct || 10,
        allocationPct: tokenConfigs[t.symbol]?.allocationPct || 0,
      })),
      depositAmount: '', depositToken: 'USDT',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('vigi_user_profile', JSON.stringify(profile));
    setSaved(true);
  };

  const nextStep = () => step < 6 && setStep(step + 1);
  const prevStep = () => step > 1 && setStep(step - 1);

  useEffect(() => {
    if (step === 5 && selectedTokens.length > 0) {
      const equal = Math.floor(100 / selectedTokens.length);
      const rem = 100 - equal * selectedTokens.length;
      const nc = { ...tokenConfigs };
      selectedTokens.forEach((sym, i) => {
        if (!nc[sym] || nc[sym].allocationPct === 0) nc[sym] = { ...nc[sym], allocationPct: equal + (i === 0 ? rem : 0) };
      });
      setTokenConfigs(nc);
    }
    if (step === 4) setRiskPage(0);
  }, [step]); // eslint-disable-line

  const handleAllocationChange = (changed: string, newValue: number) => {
    const clamped = Math.max(0, Math.min(100, newValue));
    const others = selectedTokens.filter(s => s !== changed);
    const currentOthers = others.reduce((sum, s) => sum + (tokenConfigs[s]?.allocationPct || 0), 0);
    const remaining = 100 - clamped;
    const nc = { ...tokenConfigs };
    if (others.length === 0) { nc[changed] = { ...nc[changed], allocationPct: 100 }; }
    else if (currentOthers === 0) {
      const eq = Math.floor(remaining / others.length);
      const r = remaining - eq * others.length;
      others.forEach((s, i) => { nc[s] = { ...nc[s], allocationPct: eq + (i === 0 ? r : 0) }; });
      nc[changed] = { ...nc[changed], allocationPct: clamped };
    } else {
      const ratio = remaining / currentOthers;
      let alloc = 0;
      others.forEach((s) => { const rd = Math.floor((tokenConfigs[s]?.allocationPct || 0) * ratio); alloc += rd; nc[s] = { ...nc[s], allocationPct: rd }; });
      const dust = remaining - alloc;
      if (others.length > 0) { const last = others[others.length - 1]; nc[last] = { ...nc[last], allocationPct: (nc[last].allocationPct || 0) + dust }; }
      nc[changed] = { ...nc[changed], allocationPct: clamped };
    }
    setTokenConfigs(nc);
  };

  const tokensToShow = showAllTokens ? ALL_TOKENS : ALL_TOKENS.filter(t => {
    const type = INVESTOR_TYPES.find(it => it.id === investorType);
    return type && type.tokens.includes(t.symbol);
  });
  const totalPages = Math.ceil(tokensToShow.length / TOKENS_PER_PAGE);
  const paginatedTokens = tokensToShow.slice(tokenPage * TOKENS_PER_PAGE, (tokenPage + 1) * TOKENS_PER_PAGE);

  return (
    <div className="h-screen bg-[#F5F5F4] text-[#0C1424] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="shrink-0 border-b border-stone-200/60 bg-[#F5F5F4]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative flex h-7 w-7 items-center justify-center">
              <div className="absolute inset-0 rounded-md bg-[#0C1424]" />
              <div className="absolute inset-[3px] rounded-sm border border-[#2540EB]/40" />
              <span className="relative text-white text-[9px] font-black tracking-tight">V</span>
            </div>
            <span className="text-xs font-bold tracking-tight text-[#0C1424]" style={{ fontFamily: 'var(--font-inter)' }}>Vigi Protocol</span>
          </Link>
          <Link href="/" className="text-[10px] font-medium uppercase tracking-wider text-ink-muted hover:text-[#2540EB] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>Volver</Link>
        </div>
      </div>

      {/* Progress bar */}
      <div className="shrink-0 mx-auto max-w-4xl w-full px-6 pt-5 pb-3">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isDone = step > s.id;
            const isActive = step === s.id;
            return (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${isDone ? 'border-[#2540EB] bg-[#2540EB] text-white' : isActive ? 'border-[#2540EB] bg-white text-[#2540EB]' : 'border-stone-200 bg-white text-stone-300'}`}>
                    {isDone ? <Check className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                  </div>
                  <span className={`text-[9px] font-medium uppercase tracking-wider ${isActive || isDone ? 'text-[#0C1424]' : 'text-stone-300'}`} style={{ fontFamily: 'var(--font-inter)' }}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`flex-1 h-px mx-2 mb-5 transition-all duration-300 ${step > s.id ? 'bg-[#2540EB]' : 'bg-stone-200'}`} />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden mx-auto max-w-4xl w-full px-6 pb-3">
        <div className="h-full flex flex-col">

          {/* STEP 1: Nombre */}
          {step === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#2540EB]" style={{ fontFamily: 'var(--font-inter)' }}>Bienvenido a Vigi</span>
                <h1 className="font-serif-display text-3xl sm:text-4xl font-medium tracking-tight text-[#0C1424] mt-3 mb-2">Empecemos por ti</h1>
                <p className="text-xs text-ink-light max-w-sm mx-auto" style={{ fontFamily: 'var(--font-inter)' }}>Vigi configura tu portafolio de inversion automatico. Primero, dime tu nombre.</p>
              </div>
              <div className="w-full max-w-sm">
                <label className="block text-[10px] font-medium uppercase tracking-wider text-ink-muted mb-2" style={{ fontFamily: 'var(--font-inter)' }}>Tu nombre</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Batu" autoFocus
                  className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-[#0C1424] placeholder-stone-300 outline-none transition focus:border-[#2540EB] focus:ring-2 focus:ring-[#2540EB]/10"
                  style={{ fontFamily: 'var(--font-inter)' }}
                  onKeyDown={(e) => e.key === 'Enter' && canProceed() && nextStep()} />
              </div>
            </div>
          )}

          {/* STEP 2: Tipo de inversor */}
          {step === 2 && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-4">
                <h2 className="font-serif-display text-2xl font-medium tracking-tight text-[#0C1424] mb-1">Que tipo de inversor eres, {name}?</h2>
                <p className="text-xs text-ink-light" style={{ fontFamily: 'var(--font-inter)' }}>Segun tu perfil te mostraremos una lista de tokens adecuada.</p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pb-2">
                  {INVESTOR_TYPES.map((type) => {
                    const Icon = ICON_MAP[type.icon] || Shield;
                    const isSelected = investorType === type.id;
                    return (
                      <button key={type.id}
                        onClick={() => {
                          setInvestorType(type.id); setShowAllTokens(false);
                          const nc = { ...tokenConfigs };
                          type.tokens.forEach(sym => { if (!nc[sym]) nc[sym] = { stopLossPct: 5, takeProfitPct: 10, allocationPct: 0 }; });
                          setSelectedTokens(type.tokens); setTokenConfigs(nc);
                        }}
                        className={`flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-all duration-200 ${isSelected ? 'border-[#2540EB] bg-[#2540EB]/5' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${isSelected ? 'bg-[#2540EB] text-white' : 'bg-stone-100 text-stone-400'}`}><Icon className="h-4 w-4" /></div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-semibold text-[#0C1424]" style={{ fontFamily: 'var(--font-inter)' }}>{type.label}</div>
                          <div className="text-[10px] text-ink-muted mt-0.5 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>{type.desc}</div>
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {type.tokens.slice(0, 4).map(sym => <span key={sym} className="text-[8px] font-medium uppercase tracking-wider text-ink-muted bg-stone-100 rounded px-1.5 py-0.5">{sym}</span>)}
                            {type.tokens.length > 4 && <span className="text-[8px] font-medium text-ink-muted">+{type.tokens.length - 4}</span>}
                          </div>
                        </div>
                        {isSelected && <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2540EB] mt-1"><Check className="h-2.5 w-2.5 text-white" /></div>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Tokens */}
          {step === 3 && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-4">
                <h2 className="font-serif-display text-2xl font-medium tracking-tight text-[#0C1424] mb-1">Tus tokens</h2>
                <p className="text-xs text-ink-light" style={{ fontFamily: 'var(--font-inter)' }}>Lista basada en tu perfil. Puedes añadir mas si quieres.</p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pb-2">
                  {paginatedTokens.map((token) => {
                    const isSelected = selectedTokens.includes(token.symbol);
                    return (
                      <div key={token.symbol} className="relative">
                        <button
                          onClick={() => {
                            if (isSelected) setSelectedTokens(selectedTokens.filter(s => s !== token.symbol));
                            else { setSelectedTokens([...selectedTokens, token.symbol]); if (!tokenConfigs[token.symbol]) setTokenConfigs({ ...tokenConfigs, [token.symbol]: { stopLossPct: 5, takeProfitPct: 10, allocationPct: 0 } }); }
                          }}
                          className={`w-full flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all duration-200 ${isSelected ? 'border-[#2540EB] bg-[#2540EB]/5' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: token.color }}>{token.symbol.slice(0, 2)}</div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-[#0C1424] truncate" style={{ fontFamily: 'var(--font-inter)' }}>{token.symbol}</div>
                              <div className="text-[9px] text-ink-muted truncate" style={{ fontFamily: 'var(--font-inter)' }}>{token.name}</div>
                            </div>
                            {isSelected && <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2540EB]"><Check className="h-2.5 w-2.5 text-white" /></div>}
                          </div>
                          {/* Chain badge */}
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-medium uppercase tracking-wider rounded px-1.5 py-0.5 text-white" style={{ backgroundColor: CHAIN_COLORS[token.chain] || '#999' }}>{token.chain}</span>
                            <span className="text-[8px] text-ink-muted uppercase">{token.category}</span>
                          </div>
                        </button>
                        <button onClick={() => setInfoToken(infoToken === token.symbol ? null : token.symbol)} className="absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full text-stone-300 hover:text-[#2540EB] transition-colors"><Info className="h-3 w-3" /></button>
                        {infoToken === token.symbol && (
                          <div className="absolute z-20 top-9 right-0 w-60 rounded-xl border border-stone-200 bg-white shadow-lg p-3 text-left">
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className="text-xs font-semibold text-[#0C1424]" style={{ fontFamily: 'var(--font-inter)' }}>{token.symbol}</span>
                              <span className="text-[9px] font-medium uppercase tracking-wider rounded px-1.5 py-0.5 text-white" style={{ backgroundColor: CHAIN_COLORS[token.chain] || '#999' }}>{token.chain}</span>
                            </div>
                            <div className="text-[10px] text-ink-muted mb-1.5 leading-relaxed" style={{ fontFamily: 'var(--font-inter)' }}>{token.desc}</div>
                            <div className="text-[9px] text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>Category: {token.category} · Decimals: {token.decimals}</div>
                            <div className="text-[9px] text-ink-muted mt-1" style={{ fontFamily: 'var(--font-inter)' }}>{token.address.slice(0, 10)}...{token.address.slice(-8)}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Pagination controls */}
                <div className="flex items-center justify-between mt-2 pb-2">
                  <div className="flex items-center gap-2">
                    {!showAllTokens ? (
                      <button onClick={() => { setShowAllTokens(true); setTokenPage(0); }} className="flex items-center gap-1.5 rounded-xl border border-dashed border-stone-300 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-ink-muted hover:border-[#2540EB] hover:text-[#2540EB] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                        <Plus className="h-3.5 w-3.5" /><span>Añadir mas</span>
                      </button>
                    ) : (
                      <button onClick={() => { setShowAllTokens(false); setTokenPage(0); }} className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-ink-muted hover:text-[#0C1424] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                        <span>Solo recomendados</span>
                      </button>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTokenPage(Math.max(0, tokenPage - 1))}
                        disabled={tokenPage === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-[#2540EB] hover:text-[#2540EB] transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[10px] font-medium text-ink-muted tabular-nums" style={{ fontFamily: 'var(--font-inter)' }}>
                        {tokenPage + 1} / {totalPages}
                      </span>
                      <button
                        onClick={() => setTokenPage(Math.min(totalPages - 1, tokenPage + 1))}
                        disabled={tokenPage === totalPages - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-[#2540EB] hover:text-[#2540EB] transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0 flex items-center gap-2 pt-3 border-t border-stone-200/60 text-[10px] text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>
                <span className="h-1.5 w-1.5 rounded-full bg-[#2540EB]" /><span>{selectedTokens.length} seleccionado{selectedTokens.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          )}

          {/* STEP 4: Risk — tabla con paginacion */}
          {step === 4 && (() => {
            const riskTotalPages = Math.ceil(selectedTokenObjs.length / RISK_PER_PAGE);
            const riskPaginated = selectedTokenObjs.slice(riskPage * RISK_PER_PAGE, (riskPage + 1) * RISK_PER_PAGE);
            return (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-3">
                <h2 className="font-serif-display text-2xl font-medium tracking-tight text-[#0C1424] mb-1">Configura tu riesgo</h2>
                <p className="text-xs text-ink-light" style={{ fontFamily: 'var(--font-inter)' }}>Stop Loss = max % a perder. Take Profit = % de ganancia para vender.</p>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                {/* Header */}
                <div className="shrink-0 grid grid-cols-[1fr_90px_90px] gap-2 px-3 pb-2 border-b border-stone-200">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>Token</span>
                  <span className="text-[9px] font-medium uppercase tracking-wider text-red-500 text-center" style={{ fontFamily: 'var(--font-inter)' }}>Stop Loss</span>
                  <span className="text-[9px] font-medium uppercase tracking-wider text-green-600 text-center" style={{ fontFamily: 'var(--font-inter)' }}>Take Profit</span>
                </div>
                {/* Rows */}
                <div className="flex-1 overflow-hidden">
                  <div className="h-full">
                    {riskPaginated.map((token) => {
                      const config = tokenConfigs[token.symbol] || { stopLossPct: 5, takeProfitPct: 10, allocationPct: 0 };
                      return (
                        <div key={token.symbol} className="grid grid-cols-[1fr_90px_90px] gap-2 items-center px-3 py-2 border-b border-stone-100 hover:bg-stone-50/50 transition">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: token.color }}>{token.symbol.slice(0, 2)}</div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-[#0C1424] truncate" style={{ fontFamily: 'var(--font-inter)' }}>{token.symbol}</span>
                                <span className="text-[7px] font-medium uppercase tracking-wider rounded px-1 py-0.5 text-white shrink-0" style={{ backgroundColor: CHAIN_COLORS[token.chain] || '#999' }}>{token.chain}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="flex items-center rounded-lg border border-stone-200 overflow-hidden">
                              <button onClick={() => setTokenConfigs({ ...tokenConfigs, [token.symbol]: { ...config, stopLossPct: Math.max(1, config.stopLossPct - 1) } })} className="px-1.5 py-1 text-stone-400 hover:bg-stone-50 transition"><Minus className="h-2.5 w-2.5" /></button>
                              <input type="number" min="1" max="50" value={config.stopLossPct} onChange={(e) => setTokenConfigs({ ...tokenConfigs, [token.symbol]: { ...config, stopLossPct: Math.min(50, Math.max(1, parseFloat(e.target.value) || 1)) } })} className="w-8 text-center text-[11px] font-semibold text-[#0C1424] outline-none" style={{ fontFamily: 'var(--font-inter)' }} />
                              <button onClick={() => setTokenConfigs({ ...tokenConfigs, [token.symbol]: { ...config, stopLossPct: Math.min(50, config.stopLossPct + 1) } })} className="px-1.5 py-1 text-stone-400 hover:bg-stone-50 transition"><Plus className="h-2.5 w-2.5" /></button>
                            </div>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="flex items-center rounded-lg border border-stone-200 overflow-hidden">
                              <button onClick={() => setTokenConfigs({ ...tokenConfigs, [token.symbol]: { ...config, takeProfitPct: Math.max(1, config.takeProfitPct - 1) } })} className="px-1.5 py-1 text-stone-400 hover:bg-stone-50 transition"><Minus className="h-2.5 w-2.5" /></button>
                              <input type="number" min="1" max="100" value={config.takeProfitPct} onChange={(e) => setTokenConfigs({ ...tokenConfigs, [token.symbol]: { ...config, takeProfitPct: Math.min(100, Math.max(1, parseFloat(e.target.value) || 1)) } })} className="w-8 text-center text-[11px] font-semibold text-[#0C1424] outline-none" style={{ fontFamily: 'var(--font-inter)' }} />
                              <button onClick={() => setTokenConfigs({ ...tokenConfigs, [token.symbol]: { ...config, takeProfitPct: Math.min(100, config.takeProfitPct + 1) } })} className="px-1.5 py-1 text-stone-400 hover:bg-stone-50 transition"><Plus className="h-2.5 w-2.5" /></button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Pagination controls */}
                {riskTotalPages > 1 && (
                  <div className="shrink-0 flex items-center justify-between pt-3 border-t border-stone-200/60">
                    <div className="flex items-center gap-2 text-[10px] text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2540EB]" />
                      <span>{selectedTokens.length} tokens · config {riskPage + 1}-{Math.min((riskPage + 1) * RISK_PER_PAGE, selectedTokenObjs.length)} de {selectedTokenObjs.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setRiskPage(Math.max(0, riskPage - 1))}
                        disabled={riskPage === 0}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-[#2540EB] hover:text-[#2540EB] transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[10px] font-medium text-ink-muted tabular-nums" style={{ fontFamily: 'var(--font-inter)' }}>
                        {riskPage + 1} / {riskTotalPages}
                      </span>
                      <button
                        onClick={() => setRiskPage(Math.min(riskTotalPages - 1, riskPage + 1))}
                        disabled={riskPage === riskTotalPages - 1}
                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-[#2540EB] hover:text-[#2540EB] transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })()}


          {/* STEP 5: Distribucion — lista compacta sin scroll */}
          {step === 5 && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-3">
                <h2 className="font-serif-display text-2xl font-medium tracking-tight text-[#0C1424] mb-1">Distribuye tu capital</h2>
                <p className="text-xs text-ink-light" style={{ fontFamily: 'var(--font-inter)' }}>Mueve los sliders. El total siempre suma 100%.</p>
              </div>
              {/* Barra visual + total */}
              <div className="shrink-0 rounded-xl border border-stone-200 bg-white px-4 py-2.5 mb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-medium uppercase tracking-wider text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>Total</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { const eq = Math.floor(100 / selectedTokens.length); const r = 100 - eq * selectedTokens.length; const nc = { ...tokenConfigs }; selectedTokens.forEach((sym, i) => { nc[sym] = { ...nc[sym], allocationPct: eq + (i === 0 ? r : 0) }; }); setTokenConfigs(nc); }} className="text-[9px] font-medium uppercase tracking-wider text-[#2540EB] hover:text-[#0C1424] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>Equitativo</button>
                    <span className="text-xs font-bold text-green-600" style={{ fontFamily: 'var(--font-inter)' }}>{totalAllocation}%</span>
                  </div>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden bg-stone-100">
                  {selectedTokenObjs.map((token) => { const pct = tokenConfigs[token.symbol]?.allocationPct || 0; if (pct === 0) return null; return <div key={token.symbol} style={{ width: `${pct}%`, backgroundColor: token.color }} className="transition-all duration-200" />; })}
                </div>
              </div>
              {/* Lista compacta de sliders */}
              <div className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full overflow-y-auto">
                  {selectedTokenObjs.map((token) => {
                    const config = tokenConfigs[token.symbol] || { stopLossPct: 5, takeProfitPct: 10, allocationPct: 0 };
                    return (
                      <div key={token.symbol} className="flex items-center gap-3 px-2 py-1.5 border-b border-stone-100 hover:bg-stone-50/50 transition">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-bold text-white" style={{ backgroundColor: token.color }}>{token.symbol.slice(0, 2)}</div>
                        <span className="text-[11px] font-semibold text-[#0C1424] w-16 shrink-0 truncate" style={{ fontFamily: 'var(--font-inter)' }}>{token.symbol}</span>
                        <span className="text-[7px] font-medium uppercase tracking-wider rounded px-1 py-0.5 text-white shrink-0" style={{ backgroundColor: CHAIN_COLORS[token.chain] || '#999' }}>{token.chain}</span>
                        <input type="range" min="0" max="100" value={config.allocationPct} onChange={(e) => handleAllocationChange(token.symbol, parseInt(e.target.value))} className="flex-1 accent-[#2540EB] cursor-pointer min-w-0" />
                        <span className="text-[11px] font-bold text-[#0C1424] tabular-nums w-10 text-right shrink-0" style={{ fontFamily: 'var(--font-inter)' }}>{config.allocationPct}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 6: Resumen */}
          {step === 6 && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="text-center mb-4">
                <span className="text-[10px] font-medium uppercase tracking-wider text-green-600" style={{ fontFamily: 'var(--font-inter)' }}>Todo listo</span>
                <h2 className="font-serif-display text-2xl font-medium tracking-tight text-[#0C1424] mt-2 mb-1">Tu portafolio, {name}</h2>
                <p className="text-xs text-ink-light" style={{ fontFamily: 'var(--font-inter)' }}>Revisa antes de guardar. Podras editar mas adelante.</p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                  <div className="bg-[#0C1424] px-5 py-3.5 flex items-center justify-between">
                    <div><div className="text-[9px] font-medium uppercase tracking-wider text-stone-400" style={{ fontFamily: 'var(--font-inter)' }}>Perfil</div><div className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-inter)' }}>{name}</div></div>
                    <div className="text-right"><div className="text-[9px] font-medium uppercase tracking-wider text-stone-400" style={{ fontFamily: 'var(--font-inter)' }}>Tokens</div><div className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-inter)' }}>{selectedTokens.length}</div></div>
                  </div>
                  <div className="divide-y divide-stone-100">
                    {selectedTokenObjs.map((token) => {
                      const config = tokenConfigs[token.symbol];
                      return (
                        <div key={token.symbol} className="flex items-center justify-between px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: token.color }}>{token.symbol.slice(0, 2)}</div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-[#0C1424]" style={{ fontFamily: 'var(--font-inter)' }}>{token.symbol}</span>
                                <span className="text-[8px] font-medium uppercase tracking-wider rounded px-1 py-0.5 text-white" style={{ backgroundColor: CHAIN_COLORS[token.chain] || '#999' }}>{token.chain}</span>
                              </div>
                              <div className="flex items-center gap-2 text-[9px] text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>
                                <span className="text-red-500">SL {config?.stopLossPct}%</span><span className="text-green-600">TP {config?.takeProfitPct}%</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-bold text-[#0C1424]" style={{ fontFamily: 'var(--font-inter)' }}>{config?.allocationPct}%</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="bg-stone-50 px-5 py-3 flex items-center justify-between text-[10px]" style={{ fontFamily: 'var(--font-inter)' }}>
                    <span className="text-ink-muted">Total</span><span className="font-bold text-green-600">{totalAllocation}%</span>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-[#2540EB]/20 bg-[#2540EB]/5 px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <Wallet className="h-4 w-4 text-[#2540EB] shrink-0 mt-0.5" />
                    <div><div className="text-xs font-semibold text-[#0C1424] mb-0.5" style={{ fontFamily: 'var(--font-inter)' }}>Proximo paso: Conectar wallet</div><p className="text-[10px] text-ink-light" style={{ fontFamily: 'var(--font-inter)' }}>Despues de guardar, podras conectar MetaMask para depositar y activar la gestion automatica.</p></div>
                  </div>
                </div>
              </div>
              <div className="shrink-0 pt-3">
                {!saved ? (
                  <button onClick={handleSave} className="w-full rounded-xl bg-[#0C1424] hover:bg-[#1A2235] active:scale-[0.98] transition-all text-white text-xs font-semibold py-3.5" style={{ fontFamily: 'var(--font-inter)' }}>Guardar mi perfil</button>
                ) : (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3"><Check className="h-4 w-4 text-green-600" /><span className="text-xs font-semibold text-green-700" style={{ fontFamily: 'var(--font-inter)' }}>Perfil guardado localmente</span></div>
                    <div className="flex gap-2.5">
                      <button onClick={() => router.push('/dashboard')} className="flex-1 rounded-xl bg-[#0C1424] hover:bg-[#1A2235] active:scale-[0.98] transition-all text-white text-xs font-semibold py-3" style={{ fontFamily: 'var(--font-inter)' }}>Ver Dashboard</button>
                      <button onClick={() => router.push('/')} className="flex-1 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 active:scale-[0.98] transition-all text-[#0C1424] text-xs font-semibold py-3" style={{ fontFamily: 'var(--font-inter)' }}>Inicio</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Navigation */}
      {!(step === 6 && saved) && (
        <div className="shrink-0 border-t border-stone-200/60 bg-[#F5F5F4]">
          <div className="mx-auto max-w-4xl flex items-center justify-between px-6 py-3">
            <button onClick={prevStep} disabled={step === 1} className="flex items-center gap-1.5 text-[10px] font-medium text-ink-muted hover:text-[#0C1424] transition-colors disabled:opacity-30 disabled:cursor-not-allowed" style={{ fontFamily: 'var(--font-inter)' }}>
              <ArrowLeft className="h-3.5 w-3.5" /><span>Anterior</span>
            </button>
            {step < 6 && (
              <button onClick={nextStep} disabled={!canProceed()} className="flex items-center gap-1.5 rounded-xl bg-[#0C1424] hover:bg-[#1A2235] active:scale-[0.98] transition-all text-white text-[10px] font-semibold px-5 py-2.5 disabled:opacity-30 disabled:cursor-not-allowed" style={{ fontFamily: 'var(--font-inter)' }}>
                <span>Siguiente</span><ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
