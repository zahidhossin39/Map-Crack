import { NextRequest, NextResponse } from 'next/server';
import { createClient, type Client } from '@libsql/client';
import { isSameOrigin } from '@/lib/serverApiKey';
import { SYNCED_KEYS } from '@/lib/cloudSync';

let db: Client | null = null;
let ready: Promise<unknown> | null = null;

function getDb(): Client | null {
  const url = process.env.TURSO_DATABASE_URL?.trim();
  if (!url) return null;
  if (!db) {
    db = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN?.trim() });
    ready = db.execute('CREATE TABLE IF NOT EXISTS store (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated INTEGER NOT NULL)');
  }
  return db;
}

function guard(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 });
  if (!getDb()) return NextResponse.json({ error: 'Turso is not configured.' }, { status: 503 });
  return null;
}

/** Every synced store, as { key: jsonString }. */
export async function GET(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  try {
    await ready;
    const rs = await db!.execute('SELECT key, value FROM store');
    return NextResponse.json(Object.fromEntries(rs.rows.map((r) => [r.key as string, r.value as string])));
  } catch (e: any) {
    console.error('store GET failed:', e?.message);
    return NextResponse.json({ error: 'Database read failed.' }, { status: 502 });
  }
}

/** Replace one store. Body: { key, value } where value is the JSON string localStorage holds. */
export async function POST(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  try {
    const { key, value } = await req.json();
    if (!SYNCED_KEYS.includes(key) || typeof value !== 'string' || value.length > 4_000_000) {
      return NextResponse.json({ error: 'Invalid store write.' }, { status: 400 });
    }
    JSON.parse(value); // reject anything that is not JSON
    await ready;
    await db!.execute({
      sql: 'INSERT INTO store (key, value, updated) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated = excluded.updated',
      args: [key, value, Date.now()],
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('store POST failed:', e?.message);
    return NextResponse.json({ error: 'Database write failed.' }, { status: 502 });
  }
}
