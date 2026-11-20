import { createPublicClient, createWalletClient, custom, http, parseAbi, formatUnits, parseUnits, Address, Hash } from 'viem';
import { bsc } from 'viem/chains';

// ============================================================
//   BNB CHAIN (BSC Mainnet) — Chain ID 56
//   Basado en ConstantsBnb.sol de stockwallet
// ============================================================

export const BSC_CHAIN_ID = 56;
export const BSC_RPC = 'https://bsc-dataseed.binance.org';

// StockWallet Vault en BNB Chain (pendiente deploy — placeholder por ahora)
export const DEPOSIT_VAULT_CONTRACT_ADDRESS: Address =
  (process.env.NEXT_PUBLIC_VAULT_CONTRACT_ADDRESS as Address) ||
  '0x0000000000000000000000000000000000000000'; // TODO: deploy StockWallet en BSC

// AI Capital Account en BNB Chain (pendiente deploy — placeholder por ahora)
export const AI_CAPITAL_ACCOUNT_ADDRESS: Address =
  '0x0000000000000000000000000000000000000000'; // TODO: deploy MinimalAccount en BSC

// Uniswap V3 en BNB Chain
export const UNISWAP_V3_FACTORY = '0xdB1d10011AD0Ff90774D0C6Bb92e5C5c8b4461F7';
export const UNIVERSAL_ROUTER = '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD';
export const PERMIT2 = '0x000000000022D473030F116dDEE9F6B43aC78BA3';
export const UNISWAP_V3_QUOTER = '0x78D78E420Da98ad378D7799bE8f4AF69033EB077';
export const V4_SCANNER = '0xB442ce9A9f3480a7Cad578296917649d9a451cc7';


// Tokens principales en BSC (18 decimals — importante: diferente a Ethereum)
export const BSC_TOKENS = {
  USDT: {
    address: '0x55d398326f99059fF775485246999027B3197955' as Address,
    decimals: 18,
  },
  USDC: {
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as Address,
    decimals: 18,
  },
  BTCB: {
    address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c' as Address,
    decimals: 18,
  },
  ETH: {
    address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' as Address,
    decimals: 18,
  },
  WBNB: {
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as Address,
    decimals: 18,
  },
} as const;

// Vault portfolio tokens (BSC) — los que el vault puede invertir
export const VAULT_PORTFOLIO_TOKENS = [
  { symbol: 'USDT', name: 'Tether USD (BSC)', address: '0x55d398326f99059fF775485246999027B3197955' as Address, decimals: 18, fallbackUsdPrice: 1 },
  { symbol: 'USDC', name: 'USD Coin (BSC)', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as Address, decimals: 18, fallbackUsdPrice: 1 },
  { symbol: 'BTCB', name: 'BTCB Token', address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c' as Address, decimals: 18 },
  { symbol: 'ETH', name: 'Ethereum (BSC)', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8' as Address, decimals: 18 },
  { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as Address, decimals: 18 },
] as const;

// Standard market exchange rate for Colombian Pesos (COP per USD / USDT)
export const USD_TO_COP_RATE = 4200;

// Tokens que se pueden depositar via InvestModal
export const DEPOSIT_TOKENS = {
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD (BSC)',
    address: '0x55d398326f99059fF775485246999027B3197955' as Address,
    decimals: 18, // BSC usa 18 decimals, no 6
    defaultCountry: 'CO',
    ripioToken: 'USDT',
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin (BSC)',
    address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d' as Address,
    decimals: 18,
    defaultCountry: 'CO',
    ripioToken: 'USDC',
  },
} as const;

export type SupportedDepositToken = keyof typeof DEPOSIT_TOKENS;

/**
 * Convert a token amount into Colombian Pesos (COP) for Ripio Ramp
 */
export function convertTokenToCOP(
  tokenSymbol: SupportedDepositToken,
  tokenAmount: number,
  brlRate = 5.05
): number {
  if (tokenAmount <= 0) return 50000; // Sensible default: 50,000 COP

  if (tokenSymbol === 'USDT' || tokenSymbol === 'USDC') {
    return Math.round(tokenAmount * USD_TO_COP_RATE);
  }
  return Math.round(tokenAmount * USD_TO_COP_RATE);
}

/**
 * Format Colombian Pesos (e.g. COP $ 210.000)
 */
export function formatCOP(copAmount: number): string {
  return `COP $ ${copAmount.toLocaleString('es-CO')}`;
}

/**
 * Generate Ripio Ramp URL with dynamic token, amount in COP for Colombia, chain, country, and wallet address
 */
export function buildRipioRampUrl(
  tokenSymbol: SupportedDepositToken,
  amount: number | string,
  walletAddress?: string | null,
  country: string = 'CO',
  brlRate = 5.05
): string {
  const token = DEPOSIT_TOKENS[tokenSymbol];
  const numTokenAmount = Math.max(0, parseFloat(String(amount || '0')) || 0);

  // In Ripio Ramp Colombia (country=CO), the amount MUST be expressed in Colombian Pesos (COP) for PSE
  let finalAmount: number;
  if (country === 'CO') {
    finalAmount = convertTokenToCOP(tokenSymbol, numTokenAmount, brlRate);
  } else {
    finalAmount = Math.round(numTokenAmount);
  }

  const params = new URLSearchParams({
    country: country || 'CO',
    chain: BSC_CHAIN_ID.toString(),
    token: token?.ripioToken || 'USDT',
    amount: finalAmount > 0 ? finalAmount.toString() : '50000',
  });

  if (walletAddress) {
    params.set('address', walletAddress);
  }

  return `https://ramp.ripio.com/onramp?${params.toString()}`;
}

export const publicClient = createPublicClient({
  chain: bsc,
  transport: http(BSC_RPC),
});

export const ERC20_ABI = parseAbi([
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]);

export const VAULT_DEPOSIT_ABI = parseAbi([
  'function depositAsset(address _token, uint256 _amount, bytes _path) external',
]);

/**
 * Creates a Viem WalletClient using injected window.ethereum / MetaMask
 */
export function getViemWalletClient(provider: any) {
  return createWalletClient({
    chain: bsc,
    transport: custom(provider),
  });
}

/**
 * Check on-chain token allowance for the deposit contract
 */
export async function fetchTokenAllowance(
  userAddress: Address,
  tokenAddress: Address,
  spenderAddress: Address = DEPOSIT_VAULT_CONTRACT_ADDRESS
): Promise<bigint> {
  try {
    return await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'allowance',
      args: [userAddress, spenderAddress],
    });
  } catch (err) {
    console.warn('Error reading token allowance:', err);
    return 0n;
  }
}

/**
 * Read the live on-chain token balance of a user on BNB Chain
 */
export async function fetchOnChainTokenBalance(
  userAddress: string,
  tokenSymbol: SupportedDepositToken
): Promise<number> {
  try {
    const token = DEPOSIT_TOKENS[tokenSymbol];
    if (!token || !userAddress) return 0;

    const rawBalance = await publicClient.readContract({
      address: token.address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress as Address],
    });

    const formatted = formatUnits(rawBalance, token.decimals);
    return parseFloat(formatted);
  } catch (err) {
    console.warn(`Could not read balance for ${tokenSymbol}:`, err);
    return 0;
  }
}
