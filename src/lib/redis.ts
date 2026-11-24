/**
 * Redis client singleton — reads bot data from Railway Redis.
 *
 * Data stored by the bot (BullMQ queues + snapshots):
 * - bull:execution-queue:* — invest execution jobs (status, txHash, timestamps)
 * - bull:evaluation-queue:* — market evaluation jobs (price snapshots)
 * - snapshot:56:* — latest price snapshots per token pair
 * - nonce:56:* — bot nonce tracking
 */

import { createClient, type RedisClientType } from 'redis';

let redisClient: RedisClientType | null = null;

export function getRedis(): RedisClientType {
  if (!redisClient) {
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL is not set');
    }
    redisClient = createClient({ url }) as RedisClientType;
    // Auto-connect on first use
    redisClient.on('error', (err: Error) => {
      console.error('[redis] error:', err.message);
    });
  }
  // If not connected, connect now
  if (!redisClient.isOpen) {
    // Fire and forget — callers should await getRedisReady()
    void redisClient.connect().catch((e: Error) => {
      console.error('[redis] connect failed:', e.message);
    });
  }
  return redisClient;
}

/**
 * Ensure Redis is connected before use.
 */
export async function getRedisReady(): Promise<RedisClientType> {
  const client = getRedis();
  if (!client.isOpen) {
    await client.connect();
  }
  return client;
}

// ============================================================
//   Types — BullMQ job structure as stored in Redis
// ============================================================

export interface BullMQJob {
  id: string;
  name: string;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  data: {
    walletId?: number;
    contractAddress?: string;
    chainId?: number;
    detectedAt?: number;
    marketId?: number;
    tokenIn?: string;
    tokenOut?: string;
    pricePerUnit?: string;
    fee?: number;
    source?: string;
    blockNumber?: string;
    timestamp?: number;
  };
  returnvalue: {
    status?: string;
    reason?: string;
    txHash?: string;
  } | null;
  opts?: {
    jobId?: string;
    removeOnComplete?: number;
    removeOnFail?: number;
    attempts?: number;
  };
}

export interface PriceSnapshot {
  marketId: number;
  tokenIn: string;
  tokenOut: string;
  pricePerUnit: string;
  fee: number;
  source: string;
  blockNumber: string;
  timestamp: number;
}

// ============================================================
//   Helpers — read invest decisions from BullMQ execution queue
// ============================================================

/**
 * Read all execution-queue jobs (invest decisions) from Redis.
 * Returns them sorted by timestamp descending (newest first).
 */
export async function getInvestDecisions(): Promise<BullMQJob[]> {
  const client = await getRedisReady();
  const keys = await client.keys('bull:execution-queue:invest-*');
  const jobs: BullMQJob[] = [];

  for (const key of keys) {
    // Skip meta/id/events/completed keys
    if (key.endsWith(':meta') || key.endsWith(':id') || key.endsWith(':events') || key.endsWith(':completed')) {
      continue;
    }
    const hash = await client.hGetAll(key);
    if (!hash || !hash.data) continue;

    const job: BullMQJob = {
      id: key.replace('bull:execution-queue:', ''),
      name: hash.name || 'unknown',
      timestamp: parseInt(hash.timestamp || '0', 10),
      processedOn: hash.processedOn ? parseInt(hash.processedOn, 10) : undefined,
      finishedOn: hash.finishedOn ? parseInt(hash.finishedOn, 10) : undefined,
      data: safeParse(hash.data, {}),
      returnvalue: safeParse(hash.returnvalue, null),
      opts: safeParse(hash.opts, undefined),
    };
    jobs.push(job);
  }

  // Sort by timestamp descending
  jobs.sort((a, b) => b.timestamp - a.timestamp);
  return jobs;
}

/**
 * Read all price snapshots from Redis.
 */
export async function getPriceSnapshots(): Promise<PriceSnapshot[]> {
  const client = await getRedisReady();
  const keys = await client.keys('snapshot:*');
  const snapshots: PriceSnapshot[] = [];

  for (const key of keys) {
    const raw = await client.get(key);
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as PriceSnapshot;
      snapshots.push(parsed);
    } catch {
      // skip malformed
    }
  }

  return snapshots;
}

/**
 * Read market evaluation jobs from Redis (latest prices being evaluated).
 */
export async function getMarketEvaluations(limit = 20): Promise<BullMQJob[]> {
  const client = await getRedisReady();
  const keys = await client.keys('bull:evaluation-queue:market-*');
  const jobs: BullMQJob[] = [];

  for (const key of keys) {
    if (key.endsWith(':meta') || key.endsWith(':id') || key.endsWith(':events') || key.endsWith(':completed')) {
      continue;
    }
    const hash = await client.hGetAll(key);
    if (!hash || !hash.data) continue;

    const job: BullMQJob = {
      id: key.replace('bull:evaluation-queue:', ''),
      name: hash.name || 'evaluate-market',
      timestamp: parseInt(hash.timestamp || '0', 10),
      processedOn: hash.processedOn ? parseInt(hash.processedOn, 10) : undefined,
      finishedOn: hash.finishedOn ? parseInt(hash.finishedOn, 10) : undefined,
      data: safeParse(hash.data, {}),
      returnvalue: safeParse(hash.returnvalue, null),
    };
    jobs.push(job);
  }

  jobs.sort((a, b) => b.timestamp - a.timestamp);
  return jobs.slice(0, limit);
}

// ============================================================
//   Utility
// ============================================================

function safeParse<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw || raw === 'null') return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Map token address to symbol for known BSC tokens.
 */
export const TOKEN_SYMBOLS: Record<string, string> = {
  '0x55d398326f99059ff775485246999027b3197955': 'USDT',
  '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d': 'USDC',
  '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c': 'BTCB',
  '0x2170ed0880ac9a755fd29b2688956bd959f933f8': 'ETH',
  '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c': 'WBNB',
  '0x1fa4a73a3f0133f0025378af00236f3abdee5d63': 'NEAR',
  '0x1ba42e5193dfa8b03d15dd1b86a3113bbbef8eeb': 'ZEC',
  '0x9b8e987e6fec8cf1380c4dca7071e2c7853aeea1': 'FXLon',
};
