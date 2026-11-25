/**
 * /api/portfolio/[contractAddress] — Lee la config de tokens directamente
 * del contrato StockWallet deployado en BNB Chain.
 *
 * Retorna: assets con allocation %, stop loss %, take profit %, y positions.
 */

import { NextRequest, NextResponse } from 'next/server';

// Siempre ejecutar en runtime: los balances on-chain cambian con cada movimiento del vault.
// Sin esto, Vercel cachea la respuesta y el dashboard muestra datos congelados.
export const dynamic = 'force-dynamic';
export const revalidate = 0;
import { createPublicClient, http, formatUnits, parseAbi, type Address } from 'viem';
import { bsc } from 'viem/chains';

// BNB Chain RPC — public nodes are rate-limited from Vercel servers
// Use a reliable endpoint, with env override for premium RPCs
const BSC_RPC = process.env.BSC_RPC_URL || 'https://bsc-rpc.publicnode.com';

const ABI = parseAbi([
  'function assets(uint256 index) view returns (address)',
  'function assetConfig(address) view returns (uint256 allocationBps, uint16 stopLossBps, uint16 takeProfitBps)',
  'function assetPosition(address) view returns (uint256 amount, uint256 invested)',
  'function gasToken() view returns (address)',
  'function balanceOf(address) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
]);

// Storage slots para variables private del contrato StockWallet
// Layout (después de OpenZeppelin Ownable slot 0 + AccessControl slot 1):
// slot 2: adgent (address)
// slot 3: adgentContract (address)
// slot 4: gasFee (uint256, BPS)
// slot 5: slippageBps (uint256, BPS)
// slot 6: gasToken (address)
// slot 7: adgentPercentage (uint256, BPS)
const GAS_FEE_SLOT = '0x4';
const ADGENT_PERCENTAGE_SLOT = '0x7';

// Token metadata para mostrar nombres legibles
const TOKEN_META: Record<string, { symbol: string; name: string; decimals: number }> = {
  '0x55d398326f99059ff775485246999027b3197955': { symbol: 'USDT', name: 'Tether USD', decimals: 18 },
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': { symbol: 'USDC', name: 'USD Coin', decimals: 18 },
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': { symbol: 'BTCB', name: 'Bitcoin (BSC)', decimals: 18 },
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8': { symbol: 'ETH', name: 'Ethereum (BSC)', decimals: 18 },
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': { symbol: 'WBNB', name: 'Wrapped BNB', decimals: 18 },
  '0x1fa4a73a3f0133f0025378af00236f3abdee5d63': { symbol: 'NEAR', name: 'NEAR Protocol', decimals: 18 },
  '0x1ba42e5193dfa8b03d15dd1b86a3113bbbef8eeb': { symbol: 'ZEC', name: 'Zcash', decimals: 18 },
  '0x9b8e987e6fec8cf1380c4dca7071e2c7853aeea1': { symbol: 'FXLon', name: 'iShares China Large-Cap ETF', decimals: 18 },
};

const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955' as Address;

export async function GET(
  _req: NextRequest,
  { params }: { params: { contractAddress: string } }
) {
  try {
    const contractAddress = params.contractAddress as Address;

    if (!contractAddress || !contractAddress.startsWith('0x')) {
      return NextResponse.json({ error: 'Invalid contract address' }, { status: 400 });
    }

    // Try multiple RPCs if the first one fails
    let client = createPublicClient({
      chain: bsc,
      transport: http(BSC_RPC),
    });

    // Helper: try reading contract, fallback to alternate RPCs
    async function readWithFallback<T>(fn: () => Promise<T>): Promise<T> {
      try {
        return await fn();
      } catch (err: any) {
        // Try alternate RPCs
        const fallbacks = ['https://rpc.ankr.com/bsc', 'https://bsc-dataseed-1.binance.org', 'https://bsc-dataseed.binance.org'];
        for (const rpc of fallbacks) {
          try {
            client = createPublicClient({ chain: bsc, transport: http(rpc) });
            return await fn();
          } catch {
            continue;
          }
        }
        throw err;
      }
    }

    // Leer gasToken
    const gasToken = await readWithFallback(() =>
      client.readContract({
        address: contractAddress,
        abi: ABI,
        functionName: 'gasToken',
      })
    );

    // Leer gasFee y adgentPercentage desde storage slots (son private, no hay getter público)
    const gasFeeRaw = await readWithFallback(() =>
      client.getStorageAt({ address: contractAddress, slot: GAS_FEE_SLOT })
    );
    const adgentPctRaw = await readWithFallback(() =>
      client.getStorageAt({ address: contractAddress, slot: ADGENT_PERCENTAGE_SLOT })
    );
    const gasFeeBps = Number(BigInt(gasFeeRaw as `0x${string}`));
    const adgentPercentageBps = Number(BigInt(adgentPctRaw as `0x${string}`));
    // Tokens percentage = TOTAL_PERCENTAGE (10000) - gasFee - adgentPercentage
    const tokensPercentageBps = 10000 - gasFeeBps - adgentPercentageBps;

    // Leer assets del contrato (index 0 hasta que revierta)
    const assets: any[] = [];
    for (let i = 0; i < 20; i++) {
      try {
        const tokenAddr = await readWithFallback(() =>
          client.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'assets',
            args: [BigInt(i)],
          })
        );

        const [allocationBps, stopLossBps, takeProfitBps] = await readWithFallback(() =>
          client.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'assetConfig',
            args: [tokenAddr],
          })
        );

        const [amount, invested] = await readWithFallback(() =>
          client.readContract({
            address: contractAddress,
            abi: ABI,
            functionName: 'assetPosition',
            args: [tokenAddr],
          })
        );

        // Metadata del token
        const meta = TOKEN_META[tokenAddr.toLowerCase()] || {};
        let symbol: string = meta.symbol || '';
        let decimals: number = meta.decimals || 0;

        // Si no tenemos metadata, leer del token on-chain
        if (!symbol) {
          try {
            symbol = await client.readContract({
              address: tokenAddr,
              abi: ABI,
              functionName: 'symbol',
            });
          } catch {
            symbol = 'UNKNOWN';
          }
        }
        if (!decimals) {
          try {
            decimals = await client.readContract({
              address: tokenAddr,
              abi: ABI,
              functionName: 'decimals',
            });
          } catch {
            decimals = 18;
          }
        }

        // Leer balance real del token en el contrato
        let balance = '0';
        try {
          const rawBalance = await readWithFallback(() =>
            client.readContract({
              address: tokenAddr,
              abi: ABI,
              functionName: 'balanceOf',
              args: [contractAddress],
            })
          );
          balance = formatUnits(rawBalance, decimals);
        } catch {
          // Si falla, dejar 0
        }

        // BPS → porcentajes legibles
        // allocationBps: 2000 = 20% → /100
        // stopLossBps: 9000 = threshold (90% of invested) → loss = (10000 - 9000) / 100 = 10%
        // takeProfitBps: 11000 = 110% of invested → profit = (11000 - 10000) / 100 = 10%
        const allocationPct = Number(allocationBps) / 100;
        const stopLossPct = (10000 - Number(stopLossBps)) / 100;
        const takeProfitPct = (Number(takeProfitBps) - 10000) / 100;

        assets.push({
          address: tokenAddr,
          symbol,
          name: meta.name || symbol,
          decimals,
          allocationPct,
          stopLossPct,
          takeProfitPct,
          balance,
          invested: formatUnits(invested, decimals),
          amount: formatUnits(amount, decimals),
        });
      } catch {
        // Se acabaron los assets
        break;
      }
    }

    // Leer balance USDT del contrato
    let usdtBalance = '0';
    try {
      const rawUsdt = await readWithFallback(() =>
        client.readContract({
          address: USDT_BSC,
          abi: ABI,
          functionName: 'balanceOf',
          args: [contractAddress],
        })
      );
      usdtBalance = formatUnits(rawUsdt, 18);
    } catch {
      // ignore
    }

    return NextResponse.json({
      contractAddress,
      gasToken,
      assets,
      usdtBalance,
      // Distribution config (leída de storage slots privados)
      gasFeeBps,
      adgentPercentageBps,
      tokensPercentageBps,
      // Porcentajes legibles
      gasFeePct: gasFeeBps / 100,
      adgentPercentagePct: adgentPercentageBps / 100,
      tokensPercentagePct: tokensPercentageBps / 100,
    });
  } catch (error: any) {
    console.error('[portfolio] Error:', error.message);
    return NextResponse.json(
      { error: error.message || 'Failed to read portfolio from contract' },
      { status: 500 }
    );
  }
}
