// One Turso connection for every server-side feature (website store, agent tools, key pool,
// team tokens). Tables are created on first use, so a fresh database just works.

import { createClient, type Client } from '@libsql/client';

let db: Client | null = null;
let ready: Promise<void> | null = null;

const TABLES = [
  // Website stores: one JSON object per key, edited entry by entry (see store.ts).
  'CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated INTEGER NOT NULL)',
  // Every business an agent has been handed, so nobody gets the same one twice.
  `CREATE TABLE IF NOT EXISTS mcp_leads (
    place_id TEXT PRIMARY KEY, name TEXT NOT NULL, area TEXT, niche TEXT,
    status TEXT NOT NULL, notes TEXT NOT NULL DEFAULT '', research TEXT NOT NULL DEFAULT '',
    business TEXT NOT NULL, found_at INTEGER NOT NULL, updated_at INTEGER NOT NULL)`,
  // Google keys in the fallback pool. The .env key is row 'env' with an empty api_key.
  `CREATE TABLE IF NOT EXISTS google_keys (
    id TEXT PRIMARY KEY, label TEXT NOT NULL, owner TEXT NOT NULL DEFAULT '',
    api_key TEXT NOT NULL, daily_cap INTEGER NOT NULL, position INTEGER NOT NULL,
    cooldown_until INTEGER NOT NULL DEFAULT 0, last_error TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL)`,
  'CREATE TABLE IF NOT EXISTS key_usage (key_id TEXT NOT NULL, day TEXT NOT NULL, calls INTEGER NOT NULL, PRIMARY KEY (key_id, day))',
  // People whose agents may use the online MCP server. Only a hash of each token is kept.
  'CREATE TABLE IF NOT EXISTS team_members (name TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL)',
  'CREATE TABLE IF NOT EXISTS team_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)',
  // Which town + niche an agent is working on right now, so two runs don't pick the same one.
  `CREATE TABLE IF NOT EXISTS area_claims (
    area_key TEXT PRIMARY KEY, area TEXT NOT NULL, niche TEXT NOT NULL,
    claimed_by TEXT NOT NULL, claimed_at INTEGER NOT NULL)`,
];

// Columns added after the first release. ALTER fails when the column exists, which is fine.
const COLUMNS = ["ALTER TABLE mcp_leads ADD COLUMN found_by TEXT NOT NULL DEFAULT ''"];

async function migrate(c: Client) {
  await c.batch(TABLES, 'write');
  for (const sql of COLUMNS) {
    try {
      await c.execute(sql);
    } catch {
      /* already there */
    }
  }
}

export function hasDb(): boolean {
  return Boolean(process.env.TURSO_DATABASE_URL?.trim());
}

export async function getDb(): Promise<Client> {
  if (!db) {
    const url = process.env.TURSO_DATABASE_URL?.trim();
    if (!url) throw new Error('TURSO_DATABASE_URL is not set.');
    db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN?.trim() });
    ready = migrate(db).catch((e) => {
      ready = null; // let the next call retry instead of failing forever
      db = null;
      throw e;
    });
  }
  await ready;
  return db!;
}
