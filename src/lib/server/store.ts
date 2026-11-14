// Website stores are JSON objects keyed by place id ({ id: value }). Writers send only the
// entries they changed, and the server merges them inside a transaction, so two people (or
// a person and an agent) editing at the same time never wipe each other's work.

import { getDb } from './db';

export type StorePatch = { set?: Record<string, unknown>; del?: string[] };

export async function readStores(): Promise<Record<string, string>> {
  const c = await getDb();
  const rs = await c.execute('SELECT key, value FROM store');
  return Object.fromEntries(rs.rows.map((r) => [String(r.key), String(r.value)]));
}

export async function readStore<T = unknown>(key: string): Promise<Record<string, T>> {
  const c = await getDb();
  const rs = await c.execute({ sql: 'SELECT value FROM store WHERE key = ?', args: [key] });
  try {
    return rs.rows[0] ? JSON.parse(String(rs.rows[0].value)) : {};
  } catch {
    return {};
  }
}

/** Apply set/delete to one store and return the merged result. */
export async function patchStore(key: string, patch: StorePatch): Promise<Record<string, unknown>> {
  const c = await getDb();
  const tx = await c.transaction('write');
  try {
    const rs = await tx.execute({ sql: 'SELECT value FROM store WHERE key = ?', args: [key] });
    let current: Record<string, unknown> = {};
    try {
      if (rs.rows[0]) current = JSON.parse(String(rs.rows[0].value)) || {};
    } catch {
      current = {};
    }
    for (const id of patch.del || []) delete current[id];
    Object.assign(current, patch.set || {});
    await tx.execute({
      sql: 'INSERT INTO store (key, value, updated) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated = excluded.updated',
      args: [key, JSON.stringify(current), Date.now()],
    });
    await tx.commit();
    return current;
  } catch (e) {
    await tx.rollback().catch(() => {});
    throw e;
  } finally {
    tx.close();
  }
}
