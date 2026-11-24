'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Check, User, Coins, Shield, PieChart,
  Wallet, AlertCircle, Plus, Minus, Info, TrendingUp, Gem, Globe,
  Loader2,
} from 'lucide-react';
import { ALL_TOKENS, INVESTOR_TYPES, CHAIN_COLORS, MAX_TOKENS } from '@/lib/tokens';
import { MetaMaskLogo } from '@/components/CoinLogos';
import { deployStockWallet } from '@/lib/stockWalletDeployment';
import type { Address } from 'viem';

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
  walletAddress: string;
  tokens: TokenConfig[];
  depositAmount: string;
  depositToken: string;
  lastStep: number;
  createdAt: string;
  updatedAt: string;
}

const STEPS = [
  { id: 1, label: 'Wallet', icon: Wallet },
  { id: 2, label: 'Nombre', icon: User },
  { id: 3, label: 'Perfil', icon: Shield },
  { id: 4, label: 'Tokens', icon: Coins },
  { id: 5, label: 'Risk', icon: AlertCircle },
  { id: 6, label: 'Distrib.', icon: PieChart },
  { id: 7, label: 'Empezar', icon: Check },
];



// ---- MetaMask helpers ----
function getMetaMaskProvider(): any {
  if (typeof window === 'undefined') return null;
  const eth = (window as any).ethereum;
  if (!eth) return null;
  if (eth.providers && Array.isArray(eth.providers)) {
    const mm = eth.providers.find((p: any) => p.isMetaMask);
    if (mm) return mm;
  }
  return eth;
}

async function switchToBSC(provider: any): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x38' }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x38',
          chainName: 'BNB Smart Chain',
          nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
          rpcUrls: ['https://bsc-dataseed.binance.org'],
          blockExplorerUrls: ['https://bscscan.com'],
        }],
      });
    }
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isDeploying, setIsDeploying] = useState(false);
const [deploymentError, setDeploymentError] = useState<string | null>(null);
const [deploymentTx, setDeploymentTx] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [tokenConfigs, setTokenConfigs] = useState<Record<string, { stopLossPct: number; takeProfitPct: number; allocationPct: number }>>({});
  const [infoToken, setInfoToken] = useState<string | null>(null);
  const [investorType, setInvestorType] = useState<string | null>(null);
  const [showAllTokens, setShowAllTokens] = useState(false);
  const [tokenPage, setTokenPage] = useState(0);
  const [riskPage, setRiskPage] = useState(0);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false); // blocks auto-save during load
  const TOKENS_PER_PAGE = 8;
  const RISK_PER_PAGE = 6;

  // ---- Check DB for existing user (contract already deployed) ----
  const checkExistingUser = useCallback(async (addr: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/user/${addr}`);
      if (!res.ok) return false;
      const data = await res.json();
      if (data.exists && data.hasContract) {
        // Usuario ya tiene contrato deployado → guardar y redirigir
        localStorage.setItem('stockWalletAddress', data.contract.address);
        localStorage.setItem('vigi_user_wallet', addr.toLowerCase());
        router.push('/dashboard');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error checking existing user:', err);
      return false;
    }
  }, [router]);

  // ---- Load profile by wallet address (localStorage fallback) ----
  const loadProfile = useCallback((addr: string): number => {
    const key = `vigi_profile_${addr.toLowerCase()}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        const profile: UserProfile = JSON.parse(stored);
        setName(profile.name || '');
        setSelectedTokens(profile.tokens.map(t => t.symbol));
        const configs: Record<string, any> = {};
        profile.tokens.forEach(t => {
          configs[t.symbol] = {
            stopLossPct: t.stopLossPct,
            takeProfitPct: t.takeProfitPct,
            allocationPct: t.allocationPct,
          };
        });
        setTokenConfigs(configs);
        setProfileLoaded(true);
        return profile.lastStep || 2;
      } catch (e) {
        return 0;
      }
    }
    return 0;
  }, []);

  // ---- Save profile by wallet address ----
  const saveProfile = useCallback(() => {
    if (!walletAddress || isLoadingProfile) return;
    const selectedTokenObjs = ALL_TOKENS.filter(t => selectedTokens.includes(t.symbol));
    const key = `vigi_profile_${walletAddress.toLowerCase()}`;
    const existing = localStorage.getItem(key);
    const createdAt = existing
      ? (() => { try { return (JSON.parse(existing) as UserProfile).createdAt; } catch { return new Date().toISOString(); } })()
      : new Date().toISOString();

    const profile: UserProfile = {
      name: name.trim(),
      walletAddress,
      tokens: selectedTokenObjs.map(t => ({
        symbol: t.symbol, name: t.name, address: t.address, decimals: t.decimals, color: t.color, chain: t.chain,
        stopLossPct: tokenConfigs[t.symbol]?.stopLossPct || 5,
        takeProfitPct: tokenConfigs[t.symbol]?.takeProfitPct || 10,
        allocationPct: tokenConfigs[t.symbol]?.allocationPct || 0,
      })),
      depositAmount: '', depositToken: 'USDT',
      lastStep: step,
      createdAt,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify(profile));
  }, [walletAddress, name, selectedTokens, tokenConfigs, step, isLoadingProfile]);

  // ---- Auto-save on every change after wallet connected (but not while loading) ----
  useEffect(() => {
    if (walletAddress && !isLoadingProfile) {
      saveProfile();
    }
  }, [name, selectedTokens, tokenConfigs, step, walletAddress, isLoadingProfile, saveProfile]);

  // ---- Connect MetaMask ----
  const connectMetaMask = useCallback(async () => {
    setIsConnecting(true);
    setWalletError(null);
    try {
      const provider = getMetaMaskProvider();
      if (!provider) {
        setWalletError('MetaMask no encontrado. Instala la extension para continuar.');
        setIsConnecting(false);
        return;
      }
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No accounts authorized');

      const addr = accounts[0];
      setWalletAddress(addr);
      await switchToBSC(provider);

      // 1. Check DB — ¿usuario ya tiene contrato deployado?
      const exists = await checkExistingUser(addr);
      if (exists) return; // redirigió al dashboard

      // 2. No existe en DB → cargar profile local (localStorage)
      setIsLoadingProfile(true);
      setLoadingProfile(true);
      const lastStep = loadProfile(addr);
      setLoadingProfile(false);
      setTimeout(() => {
        setIsLoadingProfile(false);
        setStep(lastStep > 1 ? lastStep : 2);
      }, 0);
    } catch (err: any) {
      if (err.code === 4001) {
        setWalletError('Conexion cancelada.');
      } else {
        setWalletError(err.message || 'Error al conectar MetaMask');
      }
    } finally {
      setIsConnecting(false);
    }
  }, [loadProfile, checkExistingUser]);

  // ---- Check if already connected on mount ----
  useEffect(() => {
    const provider = getMetaMaskProvider();
    if (!provider) return;
    provider.request({ method: 'eth_accounts' }).then(async (accounts: string[]) => {
      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        setWalletAddress(addr);

        // 1. Check DB first — ¿usuario ya tiene contrato?
        const exists = await checkExistingUser(addr);
        if (exists) return; // redirigió al dashboard

        // 2. No existe en DB → cargar profile local
        setIsLoadingProfile(true);
        setLoadingProfile(true);
        const lastStep = loadProfile(addr);
        setLoadingProfile(false);
        setTimeout(() => {
          setIsLoadingProfile(false);
          setStep(lastStep > 1 ? lastStep : 2);
        }, 0);
      }
    }).catch(() => {});
  }, [loadProfile, checkExistingUser]);

  // ---- Listen for account changes ----
  useEffect(() => {
    const provider = getMetaMaskProvider();
    if (provider && provider.on) {
      const handleAccountsChanged = async (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          setWalletAddress(addr);

          // Check DB first — ¿usuario ya tiene contrato?
          const exists = await checkExistingUser(addr);
          if (exists) return; // redirigió al dashboard

          // No existe en DB → cargar profile local
          setIsLoadingProfile(true);
          setLoadingProfile(true);
          const lastStep = loadProfile(addr);
          setLoadingProfile(false);
          setTimeout(() => {
            setIsLoadingProfile(false);
            setStep(lastStep > 1 ? lastStep : 2);
          }, 0);
        } else {
          setWalletAddress(null);
          setStep(1);
        }
      };
      provider.on('accountsChanged', handleAccountsChanged);
      return () => {
        if (provider.removeListener) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
        }
      };
    }
  }, [loadProfile]);

  const selectedTokenObjs = ALL_TOKENS.filter(t => selectedTokens.includes(t.symbol));
  const totalAllocation = selectedTokenObjs.reduce((sum, t) => sum + (tokenConfigs[t.symbol]?.allocationPct || 0), 0);
  const maxTokensReached = selectedTokens.length >= MAX_TOKENS;

  const canProceed = () => {
    switch (step) {
      case 1: return walletAddress !== null;
      case 2: return name.trim().length >= 2;
      case 3: return investorType !== null;
      case 4: return selectedTokens.length >= 1 && selectedTokens.length <= MAX_TOKENS;
      case 5: return selectedTokens.every(s => { const c = tokenConfigs[s]; return c && c.stopLossPct > 0 && c.takeProfitPct > 0; });
      case 6: return Math.abs(totalAllocation - 100) < 0.01;
      case 7: return true;
      default: return false;
    }
  };

  const nextStep = () => step < 7 && setStep(step + 1);
  const prevStep = () => step > 1 && setStep(step - 1);

  // Auto-distribute allocation when entering step 6
  useEffect(() => {
    if (step === 6 && selectedTokens.length > 0) {
      const equal = Math.floor(100 / selectedTokens.length);
      const rem = 100 - equal * selectedTokens.length;
      const nc = { ...tokenConfigs };
      selectedTokens.forEach((sym, i) => {
        if (!nc[sym] || nc[sym].allocationPct === 0) nc[sym] = { ...nc[sym], allocationPct: equal + (i === 0 ? rem : 0) };
      });
      setTokenConfigs(nc);
    }
    if (step === 5) setRiskPage(0);
  }, [step]); // eslint-disable-line

  // ---- Allocation: simple set, no auto-rebalance ----
  const handleAllocationChange = (changed: string, newValue: number) => {
    const clamped = Math.max(0, Math.min(100, newValue));
    setTokenConfigs(prev => ({
      ...prev,
      [changed]: { ...prev[changed], allocationPct: clamped },
    }));
  };

  const tokensToShow = showAllTokens ? ALL_TOKENS : ALL_TOKENS.filter(t => {
    const type = INVESTOR_TYPES.find(it => it.id === investorType);
    return type && type.tokens.includes(t.symbol);
  });
  const totalPages = Math.ceil(tokensToShow.length / TOKENS_PER_PAGE);
  const paginatedTokens = tokensToShow.slice(tokenPage * TOKENS_PER_PAGE, (tokenPage + 1) * TOKENS_PER_PAGE);


const handleStart = async () => {
  try {
    setIsDeploying(true);

    const provider = (window as any).ethereum;

    if (!provider) {
      throw new Error('MetaMask no está instalada.');
    }

    const accounts = await provider.request({
      method: 'eth_requestAccounts',
    });

    const result = await deployStockWallet(
      provider,
      accounts[0] as Address,
      selectedTokenObjs.map((token) => ({
        symbol: token.symbol,
        address: token.address,
        chainId: token.chainId,
        allocationPct: tokenConfigs[token.symbol].allocationPct,
        stopLossPct: tokenConfigs[token.symbol].stopLossPct,
        takeProfitPct: tokenConfigs[token.symbol].takeProfitPct,
      }))
    );

    // Guardar direcciones para el dashboard.
    localStorage.setItem(
      'stockWalletAddress',
      result.stockWalletAddress
    );

    saveProfile();

    // Register onboarding in PostgreSQL so the bot picks up this wallet
    try {
      await fetch('/api/onboarding/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            name: name.trim(),
            walletAddress: accounts[0],
          },
          contract: {
            address: result.stockWalletAddress,
            chainId: 56,
            scannerAddress: undefined,
          },
          tokens: selectedTokenObjs.map((token) => ({
            symbol: token.symbol,
            address: token.address,
            allocationPct: tokenConfigs[token.symbol].allocationPct,
            stopLossPct: tokenConfigs[token.symbol].stopLossPct,
            takeProfitPct: tokenConfigs[token.symbol].takeProfitPct,
          })),
        }),
      });
    } catch (registerErr: any) {
      console.error('Failed to register in PostgreSQL:', registerErr.message);
      // Don't block the flow — the wallet is deployed, just not registered
    }

    router.push('/dashboard');

  } catch (error: any) {
    console.error('Deployment error:', error);
    alert(error.shortMessage || error.message || 'Error en el deployment.');
  } finally {
    setIsDeploying(false);
  }
};


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
          <div className="flex items-center gap-3">
            {walletAddress && (
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                <span className="text-[10px] font-mono font-bold text-amber-800">{walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}</span>
              </span>
            )}
            <Link href="/" className="text-[10px] font-medium uppercase tracking-wider text-ink-muted hover:text-[#2540EB] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>Volver</Link>
          </div>
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

          {/* STEP 1: Connect MetaMask */}
          {step === 1 && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#2540EB]" style={{ fontFamily: 'var(--font-inter)' }}>Bienvenido a Vigi</span>
                <h1 className="font-serif-display text-3xl sm:text-4xl font-medium tracking-tight text-[#0C1424] mt-3 mb-2">Conecta tu wallet</h1>
                <p className="text-xs text-ink-light max-w-sm mx-auto" style={{ fontFamily: 'var(--font-inter)' }}>Conecta MetaMask en BNB Chain para empezar. Tu progreso se guarda automaticamente por tu direccion.</p>
              </div>
              <div className="w-full max-w-sm space-y-3">
                <button
                  onClick={connectMetaMask}
                  disabled={isConnecting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50/70 hover:bg-orange-100/90 py-3.5 px-4 text-sm font-bold text-orange-950 transition active:scale-[0.98] shadow-xs disabled:opacity-60"
                >
                  <MetaMaskLogo className="h-5 w-5 shrink-0" />
                  <span>{isConnecting ? 'Conectando...' : 'Conectar MetaMask'}</span>
                </button>
                {walletError && (
                  <p className="text-[11px] text-rose-600 font-medium text-center px-1">{walletError}</p>
                )}
                {loadingProfile && (
                  <div className="flex items-center justify-center gap-2 text-[11px] text-ink-muted">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Cargando tu perfil...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Nombre */}
          {step === 2 && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="text-center mb-8">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[#2540EB]" style={{ fontFamily: 'var(--font-inter)' }}>Paso 2</span>
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

          {/* STEP 3: Tipo de inversor */}
          {step === 3 && (
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
                          // Pre-select up to MAX_TOKENS from the profile's token list
                          const tokensToSelect = type.tokens.slice(0, MAX_TOKENS);
                          const nc = { ...tokenConfigs };
                          tokensToSelect.forEach(sym => { if (!nc[sym]) nc[sym] = { stopLossPct: 5, takeProfitPct: 10, allocationPct: 0 }; });
                          setSelectedTokens(tokensToSelect); setTokenConfigs(nc);
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

          {/* STEP 4: Tokens (max 6) */}
          {step === 4 && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-4">
                <h2 className="font-serif-display text-2xl font-medium tracking-tight text-[#0C1424] mb-1">Tus tokens</h2>
                <p className="text-xs text-ink-light" style={{ fontFamily: 'var(--font-inter)' }}>
                 Selecciona maximo {MAX_TOKENS} tokens. <span className={`font-bold ${maxTokensReached ? 'text-red-500' : 'text-[#2540EB]'}`}>{selectedTokens.length}/{MAX_TOKENS}</span> seleccionados.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 pb-2">
                  {paginatedTokens.map((token) => {
                    const isSelected = selectedTokens.includes(token.symbol);
                    const isDisabled = !isSelected && maxTokensReached;
                    return (
                      <div key={token.symbol} className="relative">
                        <button
                          disabled={isDisabled}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedTokens(selectedTokens.filter(s => s !== token.symbol));
                            } else if (!maxTokensReached) {
                              setSelectedTokens([...selectedTokens, token.symbol]);
                              if (!tokenConfigs[token.symbol]) setTokenConfigs({ ...tokenConfigs, [token.symbol]: { stopLossPct: 5, takeProfitPct: 10, allocationPct: 0 } });
                            }
                          }}
                          className={`w-full flex flex-col items-start gap-2 rounded-xl border-2 p-3 text-left transition-all duration-200 ${isSelected ? 'border-[#2540EB] bg-[#2540EB]/5' : isDisabled ? 'border-stone-200 bg-stone-50 opacity-40 cursor-not-allowed' : 'border-stone-200 bg-white hover:border-stone-300'}`}>
                          <div className="flex items-center gap-2 w-full">
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white" style={{ backgroundColor: token.color }}>{token.symbol.slice(0, 2)}</div>
                            <div className="min-w-0 flex-1">
                              <div className="text-xs font-semibold text-[#0C1424] truncate" style={{ fontFamily: 'var(--font-inter)' }}>{token.symbol}</div>
                              <div className="text-[9px] text-ink-muted truncate" style={{ fontFamily: 'var(--font-inter)' }}>{token.name}</div>
                            </div>
                            {isSelected && <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2540EB]"><Check className="h-2.5 w-2.5 text-white" /></div>}
                          </div>
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
                        <Plus className="h-3.5 w-3.5" /><span>Ver todos</span>
                      </button>
                    ) : (
                      <button onClick={() => { setShowAllTokens(false); setTokenPage(0); }} className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-ink-muted hover:text-[#0C1424] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
                        <span>Solo recomendados</span>
                      </button>
                    )}
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                      <button onClick={() => setTokenPage(Math.max(0, tokenPage - 1))} disabled={tokenPage === 0} className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-[#2540EB] hover:text-[#2540EB] transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[10px] font-medium text-ink-muted tabular-nums" style={{ fontFamily: 'var(--font-inter)' }}>{tokenPage + 1} / {totalPages}</span>
                      <button onClick={() => setTokenPage(Math.min(totalPages - 1, tokenPage + 1))} disabled={tokenPage === totalPages - 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-[#2540EB] hover:text-[#2540EB] transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {maxTokensReached && (
                <div className="shrink-0 flex items-center gap-2 pt-2 border-t border-amber-200/60 text-[10px] text-amber-700" style={{ fontFamily: 'var(--font-inter)' }}>
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>Maximo {MAX_TOKENS} tokens alcanzado. Quita uno para agregar otro.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 5: Risk */}
          {step === 5 && (() => {
            const riskTotalPages = Math.ceil(selectedTokenObjs.length / RISK_PER_PAGE);
            const riskPaginated = selectedTokenObjs.slice(riskPage * RISK_PER_PAGE, (riskPage + 1) * RISK_PER_PAGE);
            return (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-3">
                <h2 className="font-serif-display text-2xl font-medium tracking-tight text-[#0C1424] mb-1">Configura tu riesgo</h2>
                <p className="text-xs text-ink-light" style={{ fontFamily: 'var(--font-inter)' }}>Stop Loss = max % a perder. Take Profit = % de ganancia para vender.</p>
              </div>
              <div className="flex-1 min-h-0 flex flex-col">
                <div className="shrink-0 grid grid-cols-[1fr_90px_90px] gap-2 px-3 pb-2 border-b border-stone-200">
                  <span className="text-[9px] font-medium uppercase tracking-wider text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>Token</span>
                  <span className="text-[9px] font-medium uppercase tracking-wider text-red-500 text-center" style={{ fontFamily: 'var(--font-inter)' }}>Stop Loss</span>
                  <span className="text-[9px] font-medium uppercase tracking-wider text-green-600 text-center" style={{ fontFamily: 'var(--font-inter)' }}>Take Profit</span>
                </div>
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
                {riskTotalPages > 1 && (
                  <div className="shrink-0 flex items-center justify-between pt-3 border-t border-stone-200/60">
                    <div className="flex items-center gap-2 text-[10px] text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>
                      <span className="h-1.5 w-1.5 rounded-full bg-[#2540EB]" />
                      <span>{selectedTokens.length} tokens · config {riskPage + 1}-{Math.min((riskPage + 1) * RISK_PER_PAGE, selectedTokenObjs.length)} de {selectedTokenObjs.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setRiskPage(Math.max(0, riskPage - 1))} disabled={riskPage === 0} className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-[#2540EB] hover:text-[#2540EB] transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <ArrowLeft className="h-3.5 w-3.5" />
                      </button>
                      <span className="text-[10px] font-medium text-ink-muted tabular-nums" style={{ fontFamily: 'var(--font-inter)' }}>{riskPage + 1} / {riskTotalPages}</span>
                      <button onClick={() => setRiskPage(Math.min(riskTotalPages - 1, riskPage + 1))} disabled={riskPage === riskTotalPages - 1} className="flex h-7 w-7 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-500 hover:border-[#2540EB] hover:text-[#2540EB] transition disabled:opacity-30 disabled:cursor-not-allowed">
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            );
          })()}

          {/* STEP 6: Distribucion */}
          {step === 6 && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="mb-3">
                <h2 className="font-serif-display text-2xl font-medium tracking-tight text-[#0C1424] mb-1">Distribuye tu capital</h2>
                <p className="text-xs text-ink-light" style={{ fontFamily: 'var(--font-inter)' }}>Asigna el porcentaje para cada token. El total debe sumar 100%.</p>
              </div>

              {/* Donut chart + Total */}
              <div className="shrink-0 flex items-center gap-4 rounded-xl border border-stone-200 bg-white px-5 py-4 mb-3">
                {/* Donut SVG */}
                <div className="relative shrink-0" style={{ width: 88, height: 88 }}>
                  <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                    <circle cx="44" cy="44" r="36" fill="none" stroke="#f5f5f4" strokeWidth="10" />
                    {(() => {
                      let offset = 0;
                      const circumference = 2 * Math.PI * 36;
                      return selectedTokenObjs.map((token) => {
                        const pct = tokenConfigs[token.symbol]?.allocationPct || 0;
                        if (pct === 0) return null;
                        const dash = (Math.min(pct, 100) / 100) * circumference;
                        const el = (
                          <circle
                            key={token.symbol}
                            cx="44" cy="44" r="36"
                            fill="none"
                            stroke={token.color}
                            strokeWidth="10"
                            strokeDasharray={`${dash} ${circumference}`}
                            strokeDashoffset={-offset}
                            className="transition-all duration-300"
                          />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span
                      className={`text-base font-bold tabular-nums ${totalAllocation > 100 ? 'text-red-500' : totalAllocation === 100 ? 'text-green-600' : 'text-[#0C1424]'}`}
                      style={{ fontFamily: 'var(--font-inter)' }}
                    >
                      {totalAllocation}%
                    </span>
                  </div>
                </div>

                {/* Leyenda + boton equitativo */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2.5">
                    {selectedTokenObjs.map((token) => {
                      const pct = tokenConfigs[token.symbol]?.allocationPct || 0;
                      return (
                        <div key={token.symbol} className="flex items-center gap-1">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: token.color }} />
                          <span className="text-[9px] font-medium text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>{token.symbol} {pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => {
                      const eq = Math.floor(100 / selectedTokens.length);
                      const r = 100 - eq * selectedTokens.length;
                      const nc = { ...tokenConfigs };
                      selectedTokens.forEach((sym, i) => {
                        nc[sym] = { ...nc[sym], allocationPct: eq + (i === 0 ? r : 0) };
                      });
                      setTokenConfigs(nc);
                    }}
                    className="rounded-lg bg-[#2540EB]/5 border border-[#2540EB]/10 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#2540EB] hover:bg-[#2540EB]/10 transition-colors"
                    style={{ fontFamily: 'var(--font-inter)' }}
                  >
                    Distribuir equitativo
                  </button>
                </div>
              </div>

              {/* Lista de tokens con input de % */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                <div className="space-y-2 pb-2">
                  {selectedTokenObjs.map((token) => {
                    const config = tokenConfigs[token.symbol] || { stopLossPct: 5, takeProfitPct: 10, allocationPct: 0 };
                    const pct = config.allocationPct;
                    return (
                      <div
                        key={token.symbol}
                        className="flex items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 hover:border-stone-300 transition"
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                          style={{ backgroundColor: token.color }}
                        >
                          {token.symbol.slice(0, 2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-[#0C1424]" style={{ fontFamily: 'var(--font-inter)' }}>
                            {token.symbol}
                          </div>
                          <div className="text-[9px] text-ink-muted truncate" style={{ fontFamily: 'var(--font-inter)' }}>
                            {token.name}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={pct}
                            onChange={(e) => handleAllocationChange(token.symbol, Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                            className="w-14 rounded-lg border border-stone-200 bg-stone-50 text-center text-sm font-bold text-[#0C1424] outline-none focus:border-[#2540EB] focus:bg-white py-1.5"
                            style={{ fontFamily: 'var(--font-inter)' }}
                          />
                          <span className="text-sm font-bold text-ink-muted">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Error si pasa de 100% */}
              {totalAllocation > 100 && (
                <div className="shrink-0 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-[11px] text-red-700" style={{ fontFamily: 'var(--font-inter)' }}>
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                  <span className="font-medium">La suma es {totalAllocation}%. Debe ser 100%. Reduce {totalAllocation - 100}%.</span>
                </div>
              )}

              {/* Aviso si falta para 100% */}
              {totalAllocation < 100 && totalAllocation > 0 && (
                <div className="shrink-0 flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-[11px] text-amber-700" style={{ fontFamily: 'var(--font-inter)' }}>
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-500" />
                  <span className="font-medium">Falta {100 - totalAllocation}% para completar 100%.</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 7: Resumen + Empezar */}
          {step === 7 && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="text-center mb-4">
                <span className="text-[10px] font-medium uppercase tracking-wider text-green-600" style={{ fontFamily: 'var(--font-inter)' }}>
                  {profileLoaded ? 'Bienvenido de vuelta' : 'Todo listo'}
                </span>
                <h2 className="font-serif-display text-2xl font-medium tracking-tight text-[#0C1424] mt-2 mb-1">Tu portafolio, {name || 'inversor'}</h2>
                <p className="text-xs text-ink-light" style={{ fontFamily: 'var(--font-inter)' }}>
                  {profileLoaded ? 'Tu perfil esta guardado. Puedes editar o empezar cuando quieras.' : 'Revisa tu configuracion. Todo se guarda automaticamente.'}
                </p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-0">
                {selectedTokenObjs.length > 0 ? (
                  <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden">
                    <div className="bg-[#0C1424] px-5 py-3.5 flex items-center justify-between">
                      <div>
                        <div className="text-[9px] font-medium uppercase tracking-wider text-stone-400" style={{ fontFamily: 'var(--font-inter)' }}>Perfil</div>
                        <div className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-inter)' }}>{name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[9px] font-medium uppercase tracking-wider text-stone-400" style={{ fontFamily: 'var(--font-inter)' }}>Tokens</div>
                        <div className="text-sm font-bold text-white" style={{ fontFamily: 'var(--font-inter)' }}>{selectedTokens.length}/{MAX_TOKENS}</div>
                      </div>
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
                            <div className="text-xs font-bold text-[#0C1424]" style={{ fontFamily: 'var(--font-inter)' }}>{config?.allocationPct || 0}%</div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="bg-stone-50 px-5 py-3 flex items-center justify-between text-[10px]" style={{ fontFamily: 'var(--font-inter)' }}>
                      <span className="text-ink-muted">Total</span><span className="font-bold text-green-600">{totalAllocation}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center">
                    <p className="text-xs text-ink-muted" style={{ fontFamily: 'var(--font-inter)' }}>No has seleccionado tokens todavia. Vuelve atras para configurar tu portafolio.</p>
                  </div>
                )}
                <div className="mt-3 rounded-xl border border-[#2540EB]/20 bg-[#2540EB]/5 px-4 py-3">
                  <div className="flex items-start gap-2.5">
                    <Wallet className="h-4 w-4 text-[#2540EB] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-semibold text-[#0C1424] mb-0.5" style={{ fontFamily: 'var(--font-inter)' }}>Wallet conectada</div>
                      <p className="text-[10px] text-ink-light font-mono" style={{ fontFamily: 'var(--font-inter)' }}>{walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}</p>
                      <p className="text-[10px] text-ink-light mt-1" style={{ fontFamily: 'var(--font-inter)' }}>Tu progreso se guarda automaticamente. Si vuelves a entrar con esta wallet, retomas donde lo dejaste.</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {/* Navigation — visible on all steps */}
      {step > 1 && (
        <div className="shrink-0 border-t border-stone-200/60 bg-[#F5F5F4]">
          <div className="mx-auto max-w-4xl flex items-center justify-between px-6 py-3">
            <button onClick={prevStep} className="flex items-center gap-1.5 text-[10px] font-medium text-ink-muted hover:text-[#0C1424] transition-colors" style={{ fontFamily: 'var(--font-inter)' }}>
              <ArrowLeft className="h-3.5 w-3.5" /><span>Anterior</span>
            </button>
            {step < 7 ? (
              <button onClick={nextStep} disabled={!canProceed()} className="flex items-center gap-1.5 rounded-xl bg-[#0C1424] hover:bg-[#1A2235] active:scale-[0.98] transition-all text-white text-[10px] font-semibold px-5 py-2.5 disabled:opacity-30 disabled:cursor-not-allowed" style={{ fontFamily: 'var(--font-inter)' }}>
                <span>Siguiente</span><ArrowRight className="h-3.5 w-3.5" />
              </button>
            ) : (
<button
  onClick={handleStart}
  disabled={isDeploying}
  className="flex items-center gap-1.5 rounded-xl bg-[#2540EB] text-white text-[10px] font-semibold px-5 py-2.5 disabled:opacity-50"
>
  {isDeploying ? (
    <>
      <Loader2 className="h-3.5 w-3.5 animate-spin" />
      Desplegando contrato...
    </>
  ) : (
    <>
      <span>Crear mi StockWallet</span>
      <Check className="h-3.5 w-3.5" />
    </>
  )}
</button>
            )}
            {deploymentError && (
  <p className="text-xs text-red-600 px-6 py-2">
    {deploymentError}
  </p>
)}
          </div>
        </div>
      )}
    </div>
  );
}
