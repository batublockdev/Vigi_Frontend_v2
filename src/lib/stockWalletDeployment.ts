import {
  createWalletClient,
  custom,
  getAddress,
  type Address,
  type Hex,
  type Abi,
} from 'viem';

import { bsc } from 'viem/chains';

import {
  publicClient,
  BSC_TOKENS,
  UNISWAP_V3_FACTORY,
  UNIVERSAL_ROUTER,
  PERMIT2,
  UNISWAP_V3_QUOTER,
  V4_SCANNER
} from '@/lib/web3';

import StockWalletArtifact from '@/contracts/StockWallet.json';
import UniswapV4PoolScannerArtifact from '@/contracts/UniswapV4PoolScanner.json';

interface SelectedAsset {
  symbol: string;
  address: string;
  chainId: number;
  allocationPct: number;
  stopLossPct: number;
  takeProfitPct: number;
}

const ZERO_ADDRESS =
  '0x0000000000000000000000000000000000000000' as Address;

// BNB Chain
const UNISWAP_V4_QUOTER =
  '0x95C086d7fE28AdD842ee220fef225a777474d781' as Address;

const POOL_MANAGER =
  '0x28e2Ea090877bF75740558f6BFB36A5ffeE9e9dF' as Address;

const WBNB =
  '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c' as Address;

// Agente configurado en ConstantsBnb.sol
const ADGENT =
  '0xf43ea1700E117e9c456690514Db9C5b1405EC5E5' as Address;

const ADGENT_CONTRACT = '0xf43ea1700E117e9c456690514Db9C5b1405EC5E5' as Address;

const ADGENT_PERCENTAGE = 0n;

// --------------------------------------------------
// Helpers
// --------------------------------------------------

function getArtifact(artifact: any) {
  const rawBytecode = artifact.bytecode?.object;

  if (!rawBytecode || rawBytecode.includes('__')) {
    throw new Error(
      'El bytecode está vacío o contiene referencias de librerías sin enlazar.'
    );
  }

  const bytecode = (
    rawBytecode.startsWith('0x')
      ? rawBytecode
      : `0x${rawBytecode}`
  ) as Hex;

  return {
    abi: artifact.abi as Abi,
    bytecode,
  };
}

// --------------------------------------------------
// Construir configuración de activos
// --------------------------------------------------

function buildTokenAllocation(assets: SelectedAsset[]) {
  if (!assets.length) {
    throw new Error('Selecciona al menos un activo.');
  }

  const baseToken = BSC_TOKENS.USDT.address.toLowerCase();
  const seen = new Set<string>();

  const allocations = assets.map((asset) => {
    if (asset.chainId !== 56) {
      throw new Error(`${asset.symbol} no pertenece a BNB Chain.`);
    }

    const tokenAddress = getAddress(asset.address);
    const normalized = tokenAddress.toLowerCase();

    if (normalized === baseToken) {
      throw new Error('USDT es el token base y no puede ser un activo.');
    }

    if (seen.has(normalized)) {
      throw new Error(`Token duplicado: ${asset.symbol}`);
    }

    seen.add(normalized);

    if (
      asset.allocationPct <= 0 ||
      asset.stopLossPct <= 0 ||
      asset.takeProfitPct <= 0
    ) {
      throw new Error(`Configuración inválida para ${asset.symbol}.`);
    }

    // 1% = 100 basis points.
    const allocationBps = BigInt(
      Math.round(asset.allocationPct * 100)
    );

    // Ejemplo: pérdida máxima del 5% => 9500 BPS.
    const stopLossBps = 10000 - Math.round(
      asset.stopLossPct * 100
    );

    // Ejemplo: ganancia del 10% => 11000 BPS.
    const takeProfitBps = 10000 + Math.round(
      asset.takeProfitPct * 100
    );

    if (
      stopLossBps < 0 ||
      stopLossBps > 10000 ||
      takeProfitBps < 10000 ||
      takeProfitBps > 65535
    ) {
      throw new Error(`Stop Loss o Take Profit inválido: ${asset.symbol}`);
    }

    return {
      token: tokenAddress,
      configs: {
        allocationBps,
        stopLossBps,
        takeProfitBps,
      },
    };
  });

  const total = allocations.reduce(
    (sum, item) => sum + item.configs.allocationBps,
    0n
  );

  if (total !== 10000n) {
    throw new Error(
      `La distribución debe sumar 100%. Total: ${Number(total) / 100}%`
    );
  }

  return allocations;
}

// --------------------------------------------------
// Deploy StockWallet
// --------------------------------------------------

export async function deployStockWallet(
  provider: any,
  userAddress: Address,
  assets: SelectedAsset[]
) {
  const account = getAddress(userAddress);

  const walletClient = createWalletClient({
    account,
    chain: bsc,
    transport: custom(provider),
  });

  // Verificar red de MetaMask.
  const chainId = await walletClient.getChainId();

  if (chainId !== 56) {
    throw new Error('Conecta tu wallet a BNB Chain.');
  }

  if (publicClient.chain?.id !== 56) {
    throw new Error('El publicClient no está configurado para BNB Chain.');
  }

  const tokenAllocation = buildTokenAllocation(assets);



  const stockWalletArtifact = getArtifact(
    StockWalletArtifact
  );



  // ================================================
  // 1. DEPLOY STOCK WALLET
  // ================================================

  const stockWalletHash = await walletClient.deployContract({
    account,
    chain: bsc,
    abi: stockWalletArtifact.abi,
    bytecode: stockWalletArtifact.bytecode,
    args: [
      BSC_TOKENS.USDT.address,
      UNISWAP_V3_FACTORY,
      UNIVERSAL_ROUTER,
      PERMIT2,
      UNISWAP_V3_QUOTER,

      // Uniswap V4
      UNISWAP_V4_QUOTER,
      POOL_MANAGER,
      V4_SCANNER,

      // Agente
      ADGENT,
      ADGENT_CONTRACT,
      ADGENT_PERCENTAGE,

      // Configuración seleccionada por el usuario
      tokenAllocation,
    ],
  });

  const stockWalletReceipt =
    await publicClient.waitForTransactionReceipt({
      hash: stockWalletHash,
    });

  if (
    stockWalletReceipt.status !== 'success' ||
    !stockWalletReceipt.contractAddress
  ) {
    throw new Error('El deployment del StockWallet falló.');
  }

  const stockWalletAddress =
    stockWalletReceipt.contractAddress;

  // ================================================
  // 2. CONFIGURAR WBNB COMO TOKEN DE GAS
  // ================================================

  const gasTokenHash = await walletClient.writeContract({
    account,
    chain: bsc,
    address: stockWalletAddress,
    abi: stockWalletArtifact.abi,
    functionName: 'setGasToken',
    args: [WBNB],
  });

  const gasTokenReceipt =
    await publicClient.waitForTransactionReceipt({
      hash: gasTokenHash,
    });

  if (gasTokenReceipt.status !== 'success') {
    throw new Error('No se pudo configurar WBNB como token de gas.');
  }

  // ================================================
  // 3. RESULTADO
  // ================================================

  return {
    stockWalletAddress,

    transactions: {
      stockWallet: stockWalletHash,
      setGasToken: gasTokenHash,
    },

    blockNumbers: {
      stockWallet: stockWalletReceipt.blockNumber,
      setGasToken: gasTokenReceipt.blockNumber,
    },
  };
}