// ============ TOKENS BNB CHAIN (BSC — Chain ID 56) ============
// Basado en ConstantsBnb.sol de stockwallet
// Todos los tokens usan 18 decimals en BSC (excepto DOGE: 8, FLOKI: 9)

export type TokenCategory = 'crypto' | 'wrapped' | 'stable' | 'defi' | 'rwa' | 'stock' | 'meme' | 'commodity' | 'portfolio';

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string;
  decimals: number;
  color: string;
  category: TokenCategory;
  chain: 'BNB';
  chainId: number;
  desc: string;
}

export const CHAIN_COLORS: Record<string, string> = {
  BNB: '#F0B90B',
};

export const MAX_TOKENS = 6;

// ============================================================
//   TOKENS PEGGED DE BINANCE
// ============================================================

export const ALL_TOKENS: TokenInfo[] = [
  // --- Stablecoins ---
  { symbol: 'USDT', name: 'Tether USD (BSC)', address: '0x55d398326f99059fF775485246999027B3197955', decimals: 18, color: '#26A17B', category: 'stable', chain: 'BNB', chainId: 56, desc: 'Binance-Peg USDT. Stablecoin de Tether en BSC. 18 decimals.' },
  { symbol: 'USDC', name: 'USD Coin (BSC)', address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', decimals: 18, color: '#2775CA', category: 'stable', chain: 'BNB', chainId: 56, desc: 'Binance-Peg USDC. Stablecoin de Circle en BSC. 18 decimals.' },
  { symbol: 'DAI', name: 'Dai Stablecoin (BSC)', address: '0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3', decimals: 18, color: '#F5AC37', category: 'stable', chain: 'BNB', chainId: 56, desc: 'Binance-Peg DAI. MakerDAO Dai en BNB Chain.' },

  // --- Crypto majors pegged ---
  { symbol: 'BTCB', name: 'BTCB Token', address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', decimals: 18, color: '#F7931A', category: 'wrapped', chain: 'BNB', chainId: 56, desc: 'Binance-pegged Bitcoin en BNB Chain.' },
  { symbol: 'ETH', name: 'Ethereum (BSC)', address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', decimals: 18, color: '#627EEA', category: 'wrapped', chain: 'BNB', chainId: 56, desc: 'Binance-pegged Ethereum en BSC.' },
  { symbol: 'WBNB', name: 'Wrapped BNB', address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', decimals: 18, color: '#F0B90B', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Wrapped BNB para DEX trading en PancakeSwap/Uniswap.' },
  { symbol: 'LINK', name: 'Chainlink (BSC)', address: '0xF8A0BF9cF54Bb92F17374d9e9A321E6a111a51bD', decimals: 18, color: '#2A5ADA', category: 'defi', chain: 'BNB', chainId: 56, desc: 'Binance-Peg Chainlink. Oracle network.' },
  { symbol: 'MATIC', name: 'Polygon (BSC)', address: '0xCC42724C6683B7E57334c4E856f4c9965ED682bD', decimals: 18, color: '#8247E5', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg MATIC/POL. Polygon governance.' },
  { symbol: 'AAVE', name: 'Aave (BSC)', address: '0xfb6115445Bff7b52FeB98650C87f44907E58f802', decimals: 18, color: '#B6509E', category: 'defi', chain: 'BNB', chainId: 56, desc: 'Binance-Peg Aave. Lending protocol governance.' },
  { symbol: 'DOT', name: 'Polkadot (BSC)', address: '0x7083609fCE4d1d8Dc0C979AAb8c869Ea2C873402', decimals: 18, color: '#E6007A', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg DOT. Polkadot governance.' },
  { symbol: 'ADA', name: 'Cardano (BSC)', address: '0x3EE2200Efb3400fAbB9AacF31297cBdD1d435D47', decimals: 18, color: '#0033AD', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg ADA. Cardano governance.' },
  { symbol: 'XRP', name: 'XRP (BSC)', address: '0x1D2F0da169ceB9fC7B3144628dB156f3F6c60dBE', decimals: 18, color: '#23292F', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg XRP. Ripple.' },
  { symbol: 'LTC', name: 'Litecoin (BSC)', address: '0x4338665CBB7B2485A8855A139b75D5e34AB0DB94', decimals: 18, color: '#345D9D', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg LTC. Litecoin.' },
  { symbol: 'BCH', name: 'Bitcoin Cash (BSC)', address: '0x8fF795a6F4D97E7887C79beA79aba5cc76444aDf', decimals: 18, color: '#0AC18E', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg BCH. Bitcoin Cash.' },
  { symbol: 'SOL', name: 'Solana (BSC)', address: '0x570A5D26f7765Ecb712C0924E4De545B89fD43dF', decimals: 18, color: '#9945FF', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg SOL. Solana L1.' },
  { symbol: 'ATOM', name: 'Cosmos (BSC)', address: '0x0Eb3a705fc54725037CC9e008bDede697f62F335', decimals: 18, color: '#2E3148', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg ATOM. Cosmos Hub.' },
  { symbol: 'NEAR', name: 'NEAR Protocol (BSC)', address: '0x1Fa4a73a3F0133f0025378af00236f3aBDEE5D63', decimals: 18, color: '#00EC97', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg NEAR. NEAR Protocol L1.' },
  { symbol: 'FIL', name: 'Filecoin (BSC)', address: '0x0D8Ce2A99Bb6e3B7Db580eD848240e4a0F9aE153', decimals: 18, color: '#0090FF', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg FIL. Filecoin storage network.' },
  { symbol: 'UNI', name: 'Uniswap (BSC)', address: '0xBf5140A22578168FD562DCcF235E5D43A02ce9B1', decimals: 18, color: '#FF007A', category: 'defi', chain: 'BNB', chainId: 56, desc: 'Binance-Peg UNI. Uniswap governance.' },
  { symbol: 'ZEC', name: 'Zcash (BSC)', address: '0x1Ba42e5193dfA8B03D15dd1B86a3113bbBEF8Eeb', decimals: 18, color: '#F4B728', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg ZEC. Zcash privacy coin.' },
  { symbol: 'COMP', name: 'Compound (BSC)', address: '0x52CE071Bd9b1C4B00A0b92D298c512478CaD67e8', decimals: 18, color: '#00D395', category: 'defi', chain: 'BNB', chainId: 56, desc: 'Binance-Peg COMP. Compound governance.' },
  { symbol: 'SUSHI', name: 'SushiToken (BSC)', address: '0x947950BcC74888a40Ffa2593C5798F11Fc9124C4', decimals: 18, color: '#FA52A0', category: 'defi', chain: 'BNB', chainId: 56, desc: 'Binance-Peg SUSHI. SushiSwap governance.' },
  { symbol: 'DOGE', name: 'Dogecoin (BSC)', address: '0xbA2aE424d960c26247Dd6c32edC70B295c744C43', decimals: 8, color: '#C2A633', category: 'meme', chain: 'BNB', chainId: 56, desc: 'Binance-Peg DOGE. 8 decimals.' },
  { symbol: 'SHIB', name: 'Shiba Inu (BSC)', address: '0x2859e4544C4bB03966803b044A93563Bd2D0DD4D', decimals: 18, color: '#FFA409', category: 'meme', chain: 'BNB', chainId: 56, desc: 'Binance-Peg SHIB.' },
  { symbol: 'FTM', name: 'Fantom (BSC)', address: '0xAD29AbB318791D579433D831ed122aFeAf29dcfe', decimals: 18, color: '#13B5EC', category: 'crypto', chain: 'BNB', chainId: 56, desc: 'Binance-Peg FTM. Fantom L1.' },
  { symbol: 'PEPE', name: 'Pepe (BSC)', address: '0x25d887Ce7a35172C62FeBFD67a1856F20FaEbB00', decimals: 18, color: '#3D9C3D', category: 'meme', chain: 'BNB', chainId: 56, desc: 'Binance-Peg PEPE.' },
  { symbol: 'FLOKI', name: 'Floki (BSC)', address: '0xfb5B838b6cfEEdC2873aB27866079AC55363D37E', decimals: 9, color: '#F9A826', category: 'meme', chain: 'BNB', chainId: 56, desc: 'Binance-Peg FLOKI. 9 decimals.' },

  // --- ETH staking ---
  { symbol: 'WBETH', name: 'Wrapped Beacon ETH', address: '0xa2E3356610840701BDf5611a53974510Ae27E2e1', decimals: 18, color: '#0052FF', category: 'wrapped', chain: 'BNB', chainId: 56, desc: 'Wrapped Beacon ETH. Staking liquido de Binance.' },

  // ============================================================
  //   ONDO FINANCE — RWA TOKENS
  // ============================================================
  { symbol: 'USDY', name: 'U.S. Dollar Yield', address: '0x608593d17A2decBbc4399e4185bE4922F97eD32E', decimals: 18, color: '#1E3A8A', category: 'rwa', chain: 'BNB', chainId: 56, desc: 'Ondo USDY. Rendimiento de T-Bills de EE.UU.' },
  { symbol: 'USDon', name: 'Ondo USD Stablecoin', address: '0x1f8955E640Cbd9abc3C3Bb408c9E2E1f5F20DfE6', decimals: 18, color: '#0066FF', category: 'stable', chain: 'BNB', chainId: 56, desc: 'Ondo USD. Stablecoin de Ondo Finance.' },

  // --- Ondo Portfolios ---
  { symbol: 'BRAINon', name: 'AI Leaders Portfolio', address: '0x0574e53f8214d0402C8388B4402113a74354d1b0', decimals: 18, color: '#7C3AED', category: 'portfolio', chain: 'BNB', chainId: 56, desc: 'Ondo AI Leaders Portfolio. RWA token.' },
  { symbol: 'YLD5on', name: '5% Targeted Income', address: '0x0Cfd1030E2431E0fA15D4cc3F3E43076FE93F8f9', decimals: 18, color: '#10B981', category: 'portfolio', chain: 'BNB', chainId: 56, desc: 'Ondo 5% Targeted Income. RWA token.' },
  { symbol: 'YLD8on', name: '8% Targeted Income', address: '0x2f20d5dfbAFfa3e6351E06B8b18059747CD7ee72', decimals: 18, color: '#059669', category: 'portfolio', chain: 'BNB', chainId: 56, desc: 'Ondo 8% Targeted Income. RWA token.' },
  { symbol: 'BLKGRWon', name: 'BlackRock High Growth', address: '0xE4Bd77247671746CaA3119E9FEAA146F8a4EE237', decimals: 18, color: '#000000', category: 'portfolio', chain: 'BNB', chainId: 56, desc: 'Ondo BlackRock High Growth Portfolio.' },
  { symbol: 'BLKDIGon', name: 'BlackRock Diversified Growth', address: '0xe658C62195f32bc53226e7E2642e3D76B4382FB8', decimals: 18, color: '#1A1A1A', category: 'portfolio', chain: 'BNB', chainId: 56, desc: 'Ondo BlackRock Diversified Growth.' },
  { symbol: 'BLKHIon', name: 'BlackRock High Income', address: '0xf78155dC15B838b7577002bc53bBe1041cA48622', decimals: 18, color: '#333333', category: 'portfolio', chain: 'BNB', chainId: 56, desc: 'Ondo BlackRock High Income Portfolio.' },
  { symbol: 'SPYSHIELDon', name: 'S&P 500 Capital Shielded', address: '0x5821C1EcbC33341709EF1Dd01FE1A8145BC248A8', decimals: 18, color: '#4B0082', category: 'portfolio', chain: 'BNB', chainId: 56, desc: 'Ondo S&P 500 Capital Shielded. Proteccion de capital.' },
  { symbol: 'BIG5on', name: 'Big 5 Core Allocation', address: '0xbA4530bf12EE2741154685D857B99FEe2B9b538B', decimals: 18, color: '#6366F1', category: 'portfolio', chain: 'BNB', chainId: 56, desc: 'Ondo Big 5 Core Allocation. 5 assets principales.' },
  { symbol: 'MAG7Xon', name: 'Magnificent 7 + Crypto', address: '0x50436eC45316A98E72b03Ead5752E8543f11ec09', decimals: 18, color: '#FF6B6B', category: 'portfolio', chain: 'BNB', chainId: 56, desc: 'Ondo Magnificent 7 + Crypto Portfolio.' },

  // ============================================================
  //   ONDO FINANCE — STOCK / ETF TOKENS
  // ============================================================
  { symbol: 'AAPLon', name: 'Apple (Ondo)', address: '0x390a684EF9cADE28A7AD0DFa61AB1Eb3842618c4', decimals: 18, color: '#A2AAAD', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Apple Inc. tokenizado via Ondo Finance.' },
  { symbol: 'TSLAon', name: 'Tesla (Ondo)', address: '0x2494b603319d4D9F9715c9f4496d9E0364B59d93', decimals: 18, color: '#CC0000', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Tesla Inc. tokenizado via Ondo Finance.' },
  { symbol: 'NVDAon', name: 'NVIDIA (Ondo)', address: '0xA9eE28C80f960B889dFbd1902055218cBa016F75', decimals: 18, color: '#76B900', category: 'stock', chain: 'BNB', chainId: 56, desc: 'NVIDIA Corp. tokenizado via Ondo Finance.' },
  { symbol: 'MSFTon', name: 'Microsoft (Ondo)', address: '0x6Bfe75D1ad432050eA973C3A3DcD88F02e2444C3', decimals: 18, color: '#00A4EF', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Microsoft Corp. tokenizado via Ondo Finance.' },
  { symbol: 'GOOGLon', name: 'Alphabet (Ondo)', address: '0x091FC7778e6932d4009B087B191D1EE3bac5729A', decimals: 18, color: '#4285F4', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Alphabet/Google Class A tokenizado via Ondo.' },
  { symbol: 'AMZNon', name: 'Amazon (Ondo)', address: '0x4553cFe1C09f37f38b12dC509F676964e392F8Fc', decimals: 18, color: '#FF9900', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Amazon.com tokenizado via Ondo Finance.' },
  { symbol: 'METAon', name: 'Meta Platforms (Ondo)', address: '0xD7dF5863A3e742F0c767768cDfcb63f09E0422f6', decimals: 18, color: '#0668E1', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Meta/Facebook tokenizado via Ondo Finance.' },
  { symbol: 'NFLXon', name: 'Netflix (Ondo)', address: '0x7048F5227b032326cC8DBC53cF3FdDD947a2c757', decimals: 18, color: '#E50914', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Netflix tokenizado via Ondo Finance.' },
  { symbol: 'SPYon', name: 'SPDR S&P 500 ETF (Ondo)', address: '0x6a708EAD771238919D85930b5a0f10454E1C331a', decimals: 18, color: '#1A1A1A', category: 'stock', chain: 'BNB', chainId: 56, desc: 'SPDR S&P 500 ETF tokenizado via Ondo.' },
  { symbol: 'QQQon', name: 'Invesco QQQ ETF (Ondo)', address: '0x0cdE6936d305d5B34667fC46425E852efd73559a', decimals: 18, color: '#0D3880', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Invesco QQQ Nasdaq 100 ETF via Ondo.' },
  { symbol: 'IBITon', name: 'iShares Bitcoin Trust (Ondo)', address: '0x68B07cEf227Cea1b2b6683921C8c825cd5C69Ec7', decimals: 18, color: '#F7931A', category: 'stock', chain: 'BNB', chainId: 56, desc: 'iShares Bitcoin Trust (BlackRock BTC ETF) via Ondo.' },
  { symbol: 'JPMon', name: 'JPMorgan Chase (Ondo)', address: '0x317bF42b43A394860718266Dec445DCC9FD9dA49', decimals: 18, color: '#117ACA', category: 'stock', chain: 'BNB', chainId: 56, desc: 'JPMorgan Chase tokenizado via Ondo Finance.' },
  { symbol: 'BABAon', name: 'Alibaba (Ondo)', address: '0xd5964f3fcee8D649995AB88F04b8982539c282D2', decimals: 18, color: '#FF6A00', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Alibaba Group tokenizado via Ondo Finance.' },
  { symbol: 'COINon', name: 'Coinbase (Ondo)', address: '0xf8589b526FdD65F7F301c605a6e04F0F1b4B3620', decimals: 18, color: '#0052FF', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Coinbase Global tokenizado via Ondo Finance.' },
  { symbol: 'MSTRon', name: 'MicroStrategy (Ondo)', address: '0x7313EA16493b2f55054Df0131A3A14B043ec8992', decimals: 18, color: '#000000', category: 'stock', chain: 'BNB', chainId: 56, desc: 'MicroStrategy tokenizado via Ondo Finance.' },
  { symbol: 'PLTRon', name: 'Palantir (Ondo)', address: '0x9351AbD19f42101dD36025E495B98E910b255d78', decimals: 18, color: '#003A70', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Palantir Technologies tokenizado via Ondo.' },
  { symbol: 'HOODon', name: 'Robinhood (Ondo)', address: '0x19601179A60f55Ff6636F5D1A8b6671053Bd60a8', decimals: 18, color: '#00C805', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Robinhood Markets tokenizado via Ondo Finance.' },
  { symbol: 'GMEon', name: 'GameStop (Ondo)', address: '0xdABb9afF4cf02f26D2014e4cA9f94aC6fe6572a3', decimals: 18, color: '#CC0000', category: 'stock', chain: 'BNB', chainId: 56, desc: 'GameStop Corp tokenizado via Ondo Finance.' },
  { symbol: 'RDDTon', name: 'Reddit (Ondo)', address: '0x4DA12f47578ef89c76179b760C778E70b668f80b', decimals: 18, color: '#FF4500', category: 'stock', chain: 'BNB', chainId: 56, desc: 'Reddit Inc. tokenizado via Ondo Finance.' },
  { symbol: 'SPCXon', name: 'SpaceX (Ondo)', address: '0xd0a58BC9D88D3FF48C0294Cb7e45937d0E41A928', decimals: 18, color: '#0033FF', category: 'stock', chain: 'BNB', chainId: 56, desc: 'SpaceX tokenizado via Ondo Finance.' },
  { symbol: 'FXLon', name: 'iShares China Large-Cap ETF (Ondo)', address: '0x9b8E987e6fEc8Cf1380C4dcA7071e2C7853AEEA1', decimals: 18, color: '#DE2910', category: 'stock', chain: 'BNB', chainId: 56, desc: 'iShares China Large-Cap ETF tokenizado via Ondo Finance.' },
];

// ============================================================
//   TIPOS DE INVERSOR — BNB CHAIN
// ============================================================
export const INVESTOR_TYPES = [
  {
    id: 'conservative',
    label: 'Conservador',
    desc: 'Prioriza estabilidad. Stablecoins, yield tokens y portfolios de bajo riesgo.',
    icon: 'Shield',
    tokens: ['USDT', 'USDC', 'DAI', 'USDY', 'USDon', 'YLD5on', 'SPYSHIELDon', 'BLKHIon'],
  },
  {
    id: 'balanced',
    label: 'Balanceado',
    desc: 'Mezcla de crypto bluechip, stablecoins y stocks top. Riesgo moderado.',
    icon: 'TrendingUp',
    tokens: ['BTCB', 'ETH', 'WBNB', 'USDT', 'USDC', 'LINK', 'AAPLon', 'MSFTon', 'SPYon', 'IBITon'],
  },
  {
    id: 'aggressive',
    label: 'Agresivo',
    desc: 'Maximiza retornos. Crypto, DeFi, memes y stocks de alto crecimiento.',
    icon: 'Gem',
    tokens: ['BTCB', 'ETH', 'SOL', 'SUSHI', 'PEPE', 'FLOKI', 'TSLAon', 'NVDAon', 'COINon', 'MSTRon', 'RDDTon', 'SPCXon'],
  },
  {
    id: 'global',
    label: 'Global RWA',
    desc: 'Exposicion a assets del mundo real: stocks, ETFs, commodities y portfolios Ondo.',
    icon: 'Globe',
    tokens: ['USDY', 'SPYon', 'QQQon', 'IBITon', 'AAPLon', 'TSLAon', 'NVDAon', 'GOOGLon', 'AMZNon', 'METAon', 'NFLXon', 'MAG7Xon', 'BIG5on', 'BLKGRWon', 'FXLon'],
  },
];
