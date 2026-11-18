import { Pool } from 'pg';

// PostgreSQL pool — singleton pattern (Railway-compatible)
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set');
    }
    pool = new Pool({
      connectionString,
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      ssl: connectionString.includes('railway') || connectionString.includes('rlwy')
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }
  return pool;
}
