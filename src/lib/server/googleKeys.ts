// Google key pool. Every server-side Places call goes through here. Keys are tried in order;
// a key is skipped while it is at its own daily cap or cooling down after Google refused it,
// and the next key takes over. So when your key runs out, a teammate's key keeps the run going.
//
// Why a daily cap per key: Google never stops on its own at the free limit, it just bills.
// The cap is how each owner decides how much of their key the team may use per day.

import { getDb } from './db';

const PLACES = 'https://places.googleapis.com/v1';
export const MAX_KEYS = 20;
export const DEFAULT_CAP = 30;

export class GoogleError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Google's daily quotas reset at midnight Pacific time, so caps follow the same day. */
export function pacificDay(at = Date.now()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(at);
}

function msToPacificMidnight(at = Date.now()): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles', hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(at).map((p) => [p.type, p.value])
  );
  const passed = ((Number(parts.hour) % 24) * 3600 + Number(parts.minute) * 60 + Number(parts.second)) * 1000;
  return 24 * 3600 * 1000 - passed + 60_000; // +1 min of slack
}

function envKey(): string {
  return (process.env.GOOGLE_PLACES_SERVER_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
}

function envCap(): number {
  return Number(process.env.GOOGLE_DAILY_CAP) || Number(process.env.MCP_DAILY_GOOGLE_CAP) || 300;
}

let envRowReady = false;

/** The .env key shows up in the pool as the first key, so the website works with zero setup. */
async function ensureEnvRow() {
  if (envRowReady || !envKey()) return;
  const c = await getDb();
  await c.execute({
    sql: `INSERT OR IGNORE INTO google_keys (id, label, owner, api_key, daily_cap, position, created_at)
          VALUES ('env', 'Server key (.env)', 'owner', '', ?, 0, ?)`,
    args: [envCap(), Date.now()],
  });
  envRowReady = true;
}

interface KeyRow {
  id: string;
  label: string;
  owner: string;
  api_key: string;
  daily_cap: number;
  position: number;
  cooldown_until: number;
  last_error: string;
}

async function loadKeys(): Promise<KeyRow[]> {
  await ensureEnvRow();
  const c = await getDb();
  const rs = await c.execute('SELECT * FROM google_keys ORDER BY position, created_at');
  return rs.rows.map((r) => ({
    id: String(r.id),
    label: String(r.label),
    owner: String(r.owner),
    api_key: r.id === 'env' ? envKey() : String(r.api_key),
    daily_cap: Number(r.daily_cap),
    position: Number(r.position),
    cooldown_until: Number(r.cooldown_until),
    last_error: String(r.last_error),
  })).filter((k) => k.api_key);
}

/** Count one call against a key, or return false if that key is at its cap today. */
async function reserve(k: KeyRow): Promise<boolean> {
  const c = await getDb();
  const rs = await c.execute({
    sql: `INSERT INTO key_usage (key_id, day, calls) VALUES (?, ?, 1)
          ON CONFLICT(key_id, day) DO UPDATE SET calls = calls + 1 WHERE calls < ?
          RETURNING calls`,
    args: [k.id, pacificDay(), k.daily_cap],
  });
  return rs.rows.length > 0 && k.daily_cap > 0;
}

/** How long to rest a key after Google refused it. 0 = not the key's fault, don't switch. */
export function cooldownFor(status: number, message: string): { ms: number; why: string } {
  const m = message.toLowerCase();
  if (status === 429) {
    if (m.includes('per minute')) return { ms: 2 * 60_000, why: 'Google per-minute limit' };
    if (m.includes('per day')) return { ms: msToPacificMidnight(), why: 'Google daily quota used up' };
    return { ms: 15 * 60_000, why: 'Google rate limit' };
  }
  if (status === 403 || (status === 400 && m.includes('api key'))) {
    // Bad key, API not enabled, billing off, or a key restriction. The owner has to fix it.
    return { ms: 6 * 3600_000, why: `Key refused: ${message.slice(0, 160)}` };
  }
  return { ms: 0, why: '' };
}

async function rest(k: KeyRow, ms: number, why: string) {
  const c = await getDb();
  await c.execute({
    sql: 'UPDATE google_keys SET cooldown_until = ?, last_error = ? WHERE id = ?',
    args: [Date.now() + ms, why, k.id],
  });
}

async function callWith(key: string, path: string, init: GoogleInit) {
  const res = await fetch(`${PLACES}${path}`, {
    method: init.method || 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': init.fieldMask },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const text = await res.text();
  if (!res.ok) {
    let msg = text;
    try {
      msg = JSON.parse(text)?.error?.message || text;
    } catch {
      /* keep raw */
    }
    throw new GoogleError(res.status, msg);
  }
  return JSON.parse(text);
}

export interface GoogleInit {
  method?: 'GET' | 'POST';
  fieldMask: string;
  body?: unknown;
}

/**
 * One Places API call through the pool. Tries each usable key in order and moves on when a
 * key is capped, cooling down, or refused by Google. Throws when no key can make the call.
 */
export async function googlePlaces(path: string, init: GoogleInit): Promise<any> {
  const keys = await loadKeys();
  if (!keys.length) throw new GoogleError(503, 'No Google key: add one on the Settings page or set GOOGLE_PLACES_SERVER_KEY.');

  const now = Date.now();
  let capped = 0;
  let cooling = 0;
  let nextFree = Infinity;
  for (const k of keys) {
    if (k.cooldown_until > now) {
      cooling++;
      nextFree = Math.min(nextFree, k.cooldown_until);
      continue;
    }
    if (!(await reserve(k))) {
      capped++;
      continue;
    }
    try {
      const data = await callWith(k.api_key, path, init);
      if (k.last_error) await rest(k, 0, ''); // recovered: clear the old error
      return data;
    } catch (e) {
      if (!(e instanceof GoogleError)) throw e;
      const { ms, why } = cooldownFor(e.status, e.message);
      if (!ms) throw e; // bad request, not found, etc. Another key would fail the same way.
      await rest(k, ms, why);
      cooling++;
      nextFree = Math.min(nextFree, now + ms);
      console.warn(`[keys] ${k.label} resting ${Math.round(ms / 60000)} min: ${why}`);
    }
  }
  const when = Number.isFinite(nextFree) ? ` Next key frees up at ${new Date(nextFree).toISOString().slice(11, 16)} UTC.` : '';
  throw new GoogleError(
    429,
    `No Google key left today: ${capped} at their daily cap, ${cooling} cooling down.${when} Add a key or raise a cap on the Settings page.`
  );
}

/** A browser-supplied key (bring-your-own from the map's settings) skips the pool. */
export async function googlePlacesWithKey(key: string, path: string, init: GoogleInit) {
  return callWith(key, path, init);
}

// --- managing the pool (Settings page) ---

export function maskKey(key: string): string {
  return key.length > 8 ? `${key.slice(0, 4)}…${key.slice(-4)}` : '••••';
}

export async function poolStatus() {
  const keys = await loadKeys();
  const c = await getDb();
  const day = pacificDay();
  const rs = await c.execute({ sql: 'SELECT key_id, calls FROM key_usage WHERE day = ?', args: [day] });
  const used = Object.fromEntries(rs.rows.map((r) => [String(r.key_id), Number(r.calls)]));
  const now = Date.now();
  const list = keys.map((k) => ({
    id: k.id,
    label: k.label,
    owner: k.owner,
    key: maskKey(k.api_key),
    daily_cap: k.daily_cap,
    used_today: used[k.id] || 0,
    cooling_until: k.cooldown_until > now ? k.cooldown_until : null,
    last_error: k.last_error || null,
    from_env: k.id === 'env',
  }));
  const usable = list.filter((k) => !k.cooling_until);
  return {
    day,
    keys: list,
    calls_left_today: usable.reduce((n, k) => n + Math.max(0, k.daily_cap - k.used_today), 0),
    used_today: list.reduce((n, k) => n + k.used_today, 0),
  };
}

/** Free check that a key works: Text Search asking only for place IDs costs nothing. */
export async function testKey(key: string): Promise<string | null> {
  try {
    await callWith(key, '/places:searchText', { method: 'POST', fieldMask: 'places.id', body: { textQuery: 'cafe in London', pageSize: 1 } });
    return null;
  } catch (e: any) {
    return e?.message || 'Key test failed.';
  }
}

export async function addKey(input: { label: string; owner: string; key: string; daily_cap: number }) {
  const c = await getDb();
  const keys = await loadKeys();
  if (keys.length >= MAX_KEYS) throw new Error(`The pool holds up to ${MAX_KEYS} keys.`);
  if (keys.some((k) => k.api_key === input.key)) throw new Error('That key is already in the pool.');
  const id = crypto.randomUUID();
  const position = keys.reduce((m, k) => Math.max(m, k.position), 0) + 1;
  await c.execute({
    sql: `INSERT INTO google_keys (id, label, owner, api_key, daily_cap, position, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [id, input.label, input.owner, input.key, input.daily_cap, position, Date.now()],
  });
  return id;
}

export async function updateKey(id: string, patch: { daily_cap?: number; label?: string; wake?: boolean }) {
  const c = await getDb();
  if (patch.daily_cap !== undefined) await c.execute({ sql: 'UPDATE google_keys SET daily_cap = ? WHERE id = ?', args: [patch.daily_cap, id] });
  if (patch.label) await c.execute({ sql: 'UPDATE google_keys SET label = ? WHERE id = ?', args: [patch.label, id] });
  if (patch.wake) await c.execute({ sql: "UPDATE google_keys SET cooldown_until = 0, last_error = '' WHERE id = ?", args: [id] });
}

export async function removeKey(id: string) {
  if (id === 'env') throw new Error('The .env key is set on the server; remove it there.');
  const c = await getDb();
  await c.batch([
    { sql: 'DELETE FROM google_keys WHERE id = ?', args: [id] },
    { sql: 'DELETE FROM key_usage WHERE key_id = ?', args: [id] },
  ], 'write');
}
