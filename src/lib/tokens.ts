// ============ TOKENS MULTICHAIN ============
// Celo (Chain ID 42220), BNB Chain (56), Base (8453)
// Robinhood no tiene blockchain propia — sus assets son accesibles via wallet en Base/ETH

export type TokenCategory = 'crypto' | 'wrapped' | 'stable' | 'fiat' | 'commodity' | 'defi' | 'rwa' | 'meme' | 'ai' | 'gaming' | 'stock';

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  color: string;
  category: TokenCategory;
  chain: 'Celo' | 'BNB' | 'Base' | 'Robinhood';
  chainId: number;
  desc: string;
}

// Colores por chain para referencia visual
export const CHAIN_COLORS: Record<string, string> = {
  Celo: '#FBCC5C',
  BNB: '#F0B90B',
  Base: '#0052FF',
  Robinhood: '#00C805',
};

export const ALL_TOKENS: TokenInfo[] = [
  // ============ CELO ============
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', address: '0x8aC2901Dd8A1F17a1A4768A6bA4C3751e3995B2D', decimals: 8, color: '#F7931A', category: 'crypto', chain: 'Celo', chainId: 42220, desc: 'Bitcoin tokenizado en Celo.' },
  { symbol: 'WETH', name: 'Wrapped Ether', address: '0xD221812de1BD094f35587EE8E174B07B6167D9Af', decimals: 18, color: '#627EEA', category: 'crypto', chain: 'Celo', chainId: 42220, desc: 'Ether envuelto para DeFi en Celo.' },
  { symbol: 'CELO', name: 'Celo Native', address: '0x471EcE3750Da237f93B8E339c536989b8978a438', decimals: 18, color: '#FBCC5C', category: 'crypto', chain: 'Celo', chainId: 42220, desc: 'Token nativo de Celo. Gas y staking.' },
  { symbol: 'USDC', name: 'USD Coin', address: '0xcebA9300f2b948710d2653dD7B07f33A8B32118C', decimals: 6, color: '#2775CA', category: 'stable', chain: 'Celo', chainId: 42220, desc: 'Stablecoin de Circle. 1 USDC = 1 USD.' },
  { symbol: 'USDT', name: 'Tether USD', address: '0x48065fbBE25f71C9282ddf5e1cD6D6A887483D5e', decimals: 6, color: '#26A17B', category: 'stable', chain: 'Celo', chainId: 42220, desc: 'Stablecoin de Tether. 1 USDT = 1 USD.' },
  { symbol: 'wBRL', name: 'Wrapped Real', address: '0xD76f5Faf6888e24D9F04Bf92a0c8B921FE4390e0', decimals: 18, color: '#00A859', category: 'fiat', chain: 'Celo', chainId: 42220, desc: 'Real brasileño tokenizado via Ripio.' },
  { symbol: 'wARS', name: 'Wrapped Peso AR', address: '0x0DC4F92879B7670e5f4e4e6e3c801D229129D90D', decimals: 18, color: '#75AADB', category: 'fiat', chain: 'Celo', chainId: 42220, desc: 'Peso argentino tokenizado via Ripio.' },
  { symbol: 'EURm', name: 'Euro Minted', address: '0xD8763CBa276a3738E6DE85b4b3bF5FDed6D6cA73', decimals: 18, color: '#003399', category: 'fiat', chain: 'Celo', chainId: 42220, desc: 'Euro minteado en Celo por Stability.' },
  { symbol: 'CHFm', name: 'Swiss Franc Minted', address: '0xb55a79F398E759E43C95b979163f30eC87Ee131D', decimals: 18, color: '#FF0000', category: 'fiat', chain: 'Celo', chainId: 42220, desc: 'Franco suizo minteado en Celo.' },
  { symbol: 'GBPm', name: 'Pound Minted', address: '0xCCF663b1fF11028f0b19058d0f7B674004a40746', decimals: 18, color: '#012169', category: 'fiat', chain: 'Celo', chainId: 42220, desc: 'Libra esterlina minteada en Celo.' },
  { symbol: 'TetherGold', name: 'Tether Gold', address: '0xaf37E8B6C9ED7f6318979f56Fc287d76c30847ff', decimals: 6, color: '#D4AF37', category: 'commodity', chain: 'Celo', chainId: 42220, desc: 'Oro respaldado fisicamente. 1 XAUt = 1 oz.' },
  { symbol: 'SUSHI', name: 'SushiToken', address: '0xD15EC721C2A896512Ad29C671997DD68f9593226', decimals: 18, color: '#FA52A0', category: 'defi', chain: 'Celo', chainId: 42220, desc: 'Token de gobernanza de SushiSwap.' },
  { symbol: 'ETHIX', name: 'EthicToken', address: '0x9995cc8F20Db5896943Afc8eE0ba463259c931ed', decimals: 18, color: '#00B894', category: 'defi', chain: 'Celo', chainId: 42220, desc: 'Token de EthicFinance.' },
  { symbol: 'PLASTIK', name: 'Plastik Token', address: '0x27cd006548dF7C8c8e9fdc4A67fa05C2E3CA5CF9', decimals: 18, color: '#2ECC71', category: 'defi', chain: 'Celo', chainId: 42220, desc: 'Token de Plastic Finance.' },

  // ============ BNB CHAIN ============
  { symbol: 'BNB', name: 'BNB Native', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#F0B90B', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Token nativo de BNB Chain. Gas y staking.' },
  { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, color: '#F0B90B', category: 'wrapped', chain: 'BNB', chainId: 56, desc: 'BNB envuelto para DEX trading en PancakeSwap.' },
  { symbol: 'BTCB', name: 'BTCB Token', address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', decimals: 18, color: '#F7931A', category: 'wrapped', chain: 'BNB', chainId: 56, desc: 'Binance-pegged Bitcoin en BNB Chain.' },
  { symbol: 'ETH-BNB', name: 'Ethereum (BSC)', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18, color: '#627EEA', category: 'wrapped', chain: 'BNB', chainId: 56, desc: 'Binance-pegged Ethereum en BSC.' },
  { symbol: 'USDT-BNB', name: 'Tether USD (BSC)', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, color: '#26A17B', category: 'stable', chain: 'BNB', chainId: 56, desc: 'USDT en BSC. Usa 18 decimals (no 6).' },
  { symbol: 'USDC-BNB', name: 'USD Coin (BSC)', address: '0x8AC76A51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18, color: '#2775CA', category: 'stable', chain: 'BNB', chainId: 56, desc: 'USDC en BSC. Usa 18 decimals (no 6).' },
  { symbol: 'DAI-BNB', name: 'Dai Stablecoin (BSC)', address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18, color: '#F5AC37', category: 'stable', chain: 'BNB', chainId: 56, desc: 'MakerDAO Dai en BNB Chain.' },
  { symbol: 'CAKE', name: 'PancakeSwap', address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', decimals: 18, color: '#D1884F', category: 'defi', chain: 'BNB', chainId: 56, desc: 'Token de gobernanza de PancakeSwap DEX.' },
  { symbol: 'LINK-BNB', name: 'Chainlink (BSC)', address: '0xF8A0BF9cF54dB92A173330313729e480f4e4d21c', decimals: 18, color: '#2A5ADA', category: 'defi', chain: 'BNB', chainId: 56, desc: 'Chainlink LINK en BNB Chain.' },
  { symbol: 'XVS', name: 'Venus', address: '0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63', decimals: 18, color: '#E84142', category: 'defi', chain: 'BNB', chainId: 56, desc: 'Venus protocol governance en BSC.' },
  { symbol: 'AAVE-BNB', name: 'Aave (BSC)', address: '0xFB5c347585b539a6Ad9f6Fc9D6c5f6c7d2e4d70b', decimals: 18, color: '#B6509E', category: 'defi', chain: 'BNB', chainId: 56, desc: 'Aave lending protocol en BNB Chain.' },
  { symbol: 'PAXG', name: 'PAX Gold', address: '0x1e21a4e7307038f0D8a6E5804265e80a65636321', decimals: 18, color: '#D4AF37', category: 'commodity', chain: 'BNB', chainId: 56, desc: 'Oro tokenizado. 1 PAXG = 1 oz troy.' },

  // ============ BASE ============
  { symbol: 'ETH-Base', name: 'Ethereum (Base)', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#627EEA', category: 'crypto', chain: 'Base', chainId: 8453, desc: 'ETH nativo de Base (L2 de Coinbase).' },
  { symbol: 'WETH-Base', name: 'Wrapped Ether (Base)', address: '0x4200000000000000000000000000000000000006', decimals: 18, color: '#627EEA', category: 'wrapped', chain: 'Base', chainId: 8453, desc: 'WETH canonico en Base.' },
  { symbol: 'cbBTC', name: 'Coinbase Wrapped BTC', address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', decimals: 8, color: '#F7931A', category: 'wrapped', chain: 'Base', chainId: 8453, desc: 'Coinbase wrapped Bitcoin. 1:1 BTC.' },
  { symbol: 'cbETH', name: 'Coinbase Staked ETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22', decimals: 18, color: '#0052FF', category: 'wrapped', chain: 'Base', chainId: 8453, desc: 'Coinbase staked ETH (liquid staking).' },
  { symbol: 'USDC-Base', name: 'USD Coin (Base)', address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', decimals: 6, color: '#2775CA', category: 'stable', chain: 'Base', chainId: 8453, desc: 'USDC nativo de Base. 6 decimals.' },
  { symbol: 'DAI-Base', name: 'Dai Stablecoin (Base)', address: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', decimals: 18, color: '#F5AC37', category: 'stable', chain: 'Base', chainId: 8453, desc: 'MakerDAO Dai en Base.' },
  { symbol: 'EURC', name: 'EURC', address: '0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42', decimals: 6, color: '#003399', category: 'stable', chain: 'Base', chainId: 8453, desc: 'Circle Euro Coin. 1 EURC = 1 EUR.' },
  { symbol: 'AERO', name: 'Aerodrome Finance', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631', decimals: 18, color: '#0052FF', category: 'defi', chain: 'Base', chainId: 8453, desc: 'Aerodrome DEX — el DEX principal de Base.' },
  { symbol: 'CBDOGE', name: 'Coinbase Wrapped DOGE', address: '0xcbD06E5A2B0C65597161de254AA074E489dEb510', decimals: 8, color: '#C2A633', category: 'wrapped', chain: 'Base', chainId: 8453, desc: 'Coinbase wrapped Dogecoin.' },
  { symbol: 'cbXRP', name: 'Coinbase Wrapped XRP', address: '0xcb585250f852C6c6bf90434AB21A00f02833a4af', decimals: 6, color: '#23292F', category: 'wrapped', chain: 'Base', chainId: 8453, desc: 'Coinbase wrapped XRP.' },
  { symbol: 'DEGEN', name: 'Degen', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', decimals: 18, color: '#FF4D00', category: 'meme', chain: 'Base', chainId: 8453, desc: 'Degen token (ecosistema Farcaster).' },
  { symbol: 'VIRTUAL', name: 'Virtuals Protocol', address: '0x0b3e328455c4059EEb9e3f84b5543F74E24e7E1b', decimals: 18, color: '#00FFFF', category: 'ai', chain: 'Base', chainId: 8453, desc: 'Virtuals Protocol — AI agents en Base.' },
  { symbol: 'MORPHO', name: 'Morpho', address: '0x51e6f27E4098a3Dd118248606d597f57Bb2c2c2c', decimals: 18, color: '#0066FF', category: 'defi', chain: 'Base', chainId: 8453, desc: 'Morpho lending protocol.' },
  { symbol: 'COMP-Base', name: 'Compound (Base)', address: '0x9e1028F5F1D5eDE59748FFceE5532509976840E0', decimals: 18, color: '#00D395', category: 'defi', chain: 'Base', chainId: 8453, desc: 'Compound governance en Base.' },

  // ============ ROBINHOOD — CRIPTOS ============
  // Robinhood no tiene blockchain propia. Estas son criptos disponibles para trading.
  // Accesibles via Robinhood Wallet en ETH/Base/Solana.
  { symbol: 'SOL', name: 'Solana', address: '0x0000000000000000000000000000000000000000', decimals: 9, color: '#9945FF', category: 'crypto', chain: 'Robinhood', chainId: 0, desc: 'Solana — L1 de alta velocidad. Trading via Robinhood.' },
  { symbol: 'XRP', name: 'XRP', address: '0x0000000000000000000000000000000000000000', decimals: 6, color: '#23292F', category: 'crypto', chain: 'Robinhood', chainId: 0, desc: 'Ripple XRP. Trading via Robinhood.' },
  { symbol: 'ADA', name: 'Cardano', address: '0x0000000000000000000000000000000000000000', decimals: 6, color: '#0033AD', category: 'crypto', chain: 'Robinhood', chainId: 0, desc: 'Cardano ADA. Trading via Robinhood.' },
  { symbol: 'AVAX', name: 'Avalanche', address: '0x0000000000000000000000000000000000000000', decimals: 9, color: '#E84142', category: 'crypto', chain: 'Robinhood', chainId: 0, desc: 'Avalanche AVAX. Trading via Robinhood.' },
  { symbol: 'DOT', name: 'Polkadot', address: '0x0000000000000000000000000000000000000000', decimals: 10, color: '#E6007A', category: 'crypto', chain: 'Robinhood', chainId: 0, desc: 'Polkadot DOT. Trading via Robinhood.' },
  { symbol: 'ATOM', name: 'Cosmos', address: '0x0000000000000000000000000000000000000000', decimals: 6, color: '#2E3148', category: 'crypto', chain: 'Robinhood', chainId: 0, desc: 'Cosmos Hub ATOM. Trading via Robinhood.' },
  { symbol: 'LTC', name: 'Litecoin', address: '0x0000000000000000000000000000000000000000', decimals: 8, color: '#345D9D', category: 'crypto', chain: 'Robinhood', chainId: 0, desc: 'Litecoin LTC. Trading via Robinhood.' },
  { symbol: 'DOGE', name: 'Dogecoin', address: '0x0000000000000000000000000000000000000000', decimals: 8, color: '#C2A633', category: 'meme', chain: 'Robinhood', chainId: 0, desc: 'Dogecoin DOGE. Trading via Robinhood.' },
  { symbol: 'SHIB', name: 'Shiba Inu', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#FFA409', category: 'meme', chain: 'Robinhood', chainId: 0, desc: 'Shiba Inu SHIB. Trading via Robinhood.' },
  { symbol: 'PEPE', name: 'Pepe', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#3D9C3D', category: 'meme', chain: 'Robinhood', chainId: 0, desc: 'Pepe meme coin. Trading via Robinhood.' },
  { symbol: 'FET', name: 'Artificial Superintelligence', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#0B0E2C', category: 'ai', chain: 'Robinhood', chainId: 0, desc: 'FET — AI protocol. Trading via Robinhood.' },
  { symbol: 'WLD', name: 'Worldcoin', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#000000', category: 'ai', chain: 'Robinhood', chainId: 0, desc: 'Worldcoin WLD — World ID. Trading via Robinhood.' },
  { symbol: 'RENDER', name: 'Render', address: '0x0000000000000000000000000000000000000000', decimals: 8, color: '#CF2E5A', category: 'ai', chain: 'Robinhood', chainId: 0, desc: 'Render — GPU compute network. Trading via Robinhood.' },
  { symbol: 'ARB', name: 'Arbitrum', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#28A0F0', category: 'defi', chain: 'Robinhood', chainId: 0, desc: 'Arbitrum ARB — L2 governance. Trading via Robinhood.' },
  { symbol: 'OP', name: 'Optimism', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#FF0420', category: 'defi', chain: 'Robinhood', chainId: 0, desc: 'Optimism OP — L2 governance. Trading via Robinhood.' },
  { symbol: 'NEAR', name: 'NEAR Protocol', address: '0x0000000000000000000000000000000000000000', decimals: 24, color: '#00EC97', category: 'crypto', chain: 'Robinhood', chainId: 0, desc: 'NEAR Protocol. Trading via Robinhood.' },
  { symbol: 'SUI', name: 'Sui', address: '0x0000000000000000000000000000000000000000', decimals: 9, color: '#4DA2FF', category: 'crypto', chain: 'Robinhood', chainId: 0, desc: 'Sui L1. Trading via Robinhood.' },
  { symbol: 'SEI', name: 'Sei', address: '0x0000000000000000000000000000000000000000', decimals: 6, color: '#9E1F19', category: 'crypto', chain: 'Robinhood', chainId: 0, desc: 'Sei L1. Trading via Robinhood.' },
  { symbol: 'HYPE', name: 'Hyperliquid', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#50D2C1', category: 'defi', chain: 'Robinhood', chainId: 0, desc: 'Hyperliquid perp DEX. Trading via Robinhood.' },
  { symbol: 'ONDO', name: 'Ondo', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#1E3A8A', category: 'defi', chain: 'Robinhood', chainId: 0, desc: 'Ondo RWA protocol. Trading via Robinhood.' },
  { symbol: 'ENA', name: 'Ethena', address: '0x0000000000000000000000000000000000000000', decimals: 18, color: '#00FF87', category: 'defi', chain: 'Robinhood', chainId: 0, desc: 'Ethena synthetic dollar protocol. Trading via Robinhood.' },

  // ============ ROBINHOOD — STOCKS ============
  // Stocks tradicionales disponibles en Robinhood (off-chain, no tokenizados)
  { symbol: 'AAPL', name: 'Apple Inc.', address: '0x0000000000000000000000000000000000000000', decimals: 0, color: '#A2AAAD', category: 'stock', chain: 'Robinhood', chainId: 0, desc: 'Apple Inc. (NASDAQ: AAPL). Trading via Robinhood.' },
  { symbol: 'TSLA', name: 'Tesla Inc.', address: '0x0000000000000000000000000000000000000000', decimals: 0, color: '#CC0000', category: 'stock', chain: 'Robinhood', chainId: 0, desc: 'Tesla Inc. (NASDAQ: TSLA). Trading via Robinhood.' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', address: '0x0000000000000000000000000000000000000000', decimals: 0, color: '#00A4EF', category: 'stock', chain: 'Robinhood', chainId: 0, desc: 'Microsoft (NASDAQ: MSFT). Trading via Robinhood.' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', address: '0x0000000000000000000000000000000000000000', decimals: 0, color: '#76B900', category: 'stock', chain: 'Robinhood', chainId: 0, desc: 'NVIDIA (NASDAQ: NVDA). Trading via Robinhood.' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', address: '0x0000000000000000000000000000000000000000', decimals: 0, color: '#FF9900', category: 'stock', chain: 'Robinhood', chainId: 0, desc: 'Amazon (NASDAQ: AMZN). Trading via Robinhood.' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', address: '0x0000000000000000000000000000000000000000', decimals: 0, color: '#4285F4', category: 'stock', chain: 'Robinhood', chainId: 0, desc: 'Google/Alphabet (NASDAQ: GOOGL). Trading via Robinhood.' },
  { symbol: 'META', name: 'Meta Platforms', address: '0x0000000000000000000000000000000000000000', decimals: 0, color: '#0668E1', category: 'stock', chain: 'Robinhood', chainId: 0, desc: 'Meta/Facebook (NASDAQ: META). Trading via Robinhood.' },
  { symbol: 'SPY', name: 'S&P 500 ETF', address: '0x0000000000000000000000000000000000000000', decimals: 0, color: '#1A1A1A', category: 'stock', chain: 'Robinhood', chainId: 0, desc: 'SPDR S&P 500 ETF (NYSEARCA: SPY). Trading via Robinhood.' },
  { symbol: 'QQQ', name: 'Invesco QQQ ETF', address: '0x0000000000000000000000000000000000000000', decimals: 0, color: '#0D3880', category: 'stock', chain: 'Robinhood', chainId: 0, desc: 'Invesco QQQ — Nasdaq 100 ETF. Trading via Robinhood.' },
  { symbol: 'VOO', name: 'Vanguard S&P 500', address: '0x0000000000000000000000000000000000000000', decimals: 0, color: '#96151D', category: 'stock', chain: 'Robinhood', chainId: 0, desc: 'Vanguard S&P 500 ETF (NYSEARCA: VOO). Trading via Robinhood.' },
];

// ============ TIPOS DE INVERSOR ============
// Cada tipo filtra tokens especificos de ALL_TOKENS
export const INVESTOR_TYPES = [
  {
    id: 'conservative',
    label: 'Conservador',
    desc: 'Prioriza estabilidad. Stablecoins, fiat y ETFs amplios.',
    icon: 'Shield',
    tokens: ['USDC', 'USDT', 'wBRL', 'wARS', 'EURm', 'TetherGold', 'USDC-Base', 'USDT-BNB', 'DAI-BNB', 'DAI-Base', 'EURC', 'SPY', 'VOO'],
  },
  {
    id: 'balanced',
    label: 'Balanceado',
    desc: 'Mezcla de crypto bluechip, stablecoins y stocks top. Riesgo moderado.',
    icon: 'TrendingUp',
    tokens: ['WBTC', 'WETH', 'CELO', 'USDC', 'USDT', 'cbBTC', 'cbETH', 'ETH-Base', 'BNB', 'BTCB', 'USDC-Base', 'AAPL', 'MSFT', 'VOO'],
  },
  {
    id: 'aggressive',
    label: 'Agresivo',
    desc: 'Maximiza retornos. Crypto, DeFi, AI y stocks de alto crecimiento.',
    icon: 'Gem',
    tokens: ['WBTC', 'WETH', 'CELO', 'SUSHI', 'CAKE', 'AERO', 'DEGEN', 'VIRTUAL', 'MORPHO', 'XVS', 'SOL', 'FET', 'RENDER', 'TSLA', 'NVDA'],
  },
  {
    id: 'global',
    label: 'Global',
    desc: 'Exposicion a multiples monedas fiat, commodities y mercados del mundo.',
    icon: 'Globe',
    tokens: ['EURm', 'CHFm', 'GBPm', 'wBRL', 'wARS', 'TetherGold', 'PAXG', 'EURC', 'USDC', 'USDC-Base', 'SPY', 'QQQ'],
  },
];
