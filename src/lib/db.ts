// DB DESCONECTADA — Onboarding local only
// No PostgreSQL connection. All data stays in localStorage.

export function getPool(): never {
  throw new Error('Database disconnected. Running in local-only mode.');
}
