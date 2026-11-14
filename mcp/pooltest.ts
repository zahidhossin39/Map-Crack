// Checks the key pool falls back: a broken key and a capped key sit in front of the real one.
// Uses 1-2 free Google calls (Text Search, IDs only). Run: npx tsx --tsconfig tsconfig.json mcp/pooltest.ts
import path from 'node:path';
import assert from 'node:assert';
process.loadEnvFile(path.resolve(__dirname, '..', '.env.local'));

async function main() {
  const { getDb } = await import('@/lib/server/db');
  const { googlePlaces, poolStatus, cooldownFor, pacificDay } = await import('@/lib/server/googleKeys');
  const c = await getDb();

  assert.strictEqual(cooldownFor(429, 'Quota exceeded for quota metric X per minute').ms, 120_000);
  assert.ok(cooldownFor(429, 'Quota exceeded ... per day').ms > 60_000);
  assert.strictEqual(cooldownFor(400, 'API key not valid. Please pass a valid API key.').ms, 6 * 3600_000);
  assert.strictEqual(cooldownFor(404, 'Not found').ms, 0);

  await poolStatus(); // makes sure the .env row exists
  const now = Date.now();
  await c.batch([
    { sql: "INSERT OR REPLACE INTO google_keys (id,label,owner,api_key,daily_cap,position,created_at) VALUES ('t-bad','test bad','t','AIzaThisIsNotARealKeyAtAll000000000',30,-2,?)", args: [now] },
    { sql: "INSERT OR REPLACE INTO google_keys (id,label,owner,api_key,daily_cap,position,created_at) VALUES ('t-capped','test capped','t','AIzaAlsoFakeButCapped00000000000000',1,-1,?)", args: [now] },
    { sql: "INSERT OR REPLACE INTO key_usage (key_id, day, calls) VALUES ('t-capped', ?, 1)", args: [pacificDay()] },
  ], 'write');
  try {
    const data = await googlePlaces('/places:searchText', { method: 'POST', fieldMask: 'places.id', body: { textQuery: 'cafe in Leeds', pageSize: 1 } });
    assert.ok(data.places?.length, 'fallback key returned nothing');
    const p = await poolStatus();
    const bad = p.keys.find((k) => k.id === 't-bad')!;
    const capped = p.keys.find((k) => k.id === 't-capped')!;
    assert.ok(bad.cooling_until && bad.last_error?.startsWith('Key refused'), 'bad key should be resting');
    assert.strictEqual(capped.used_today, 1, 'capped key should not have been used');
    console.log(`bad key resting until ${new Date(bad.cooling_until!).toISOString()} (${bad.last_error?.slice(0, 50)}…)`);
    console.log('capped key skipped; real key answered');

    // Second call must skip the resting key without asking Google again.
    const usedBefore = (await poolStatus()).keys.find((k) => k.id === 't-bad')!.used_today;
    await googlePlaces('/places:searchText', { method: 'POST', fieldMask: 'places.id', body: { textQuery: 'cafe in York', pageSize: 1 } });
    const usedAfter = (await poolStatus()).keys.find((k) => k.id === 't-bad')!.used_today;
    assert.strictEqual(usedAfter, usedBefore, 'resting key was tried again');
    console.log('resting key skipped on the next call');
    console.log('pooltest OK');
  } finally {
    await c.batch([
      "DELETE FROM google_keys WHERE id IN ('t-bad','t-capped')",
      "DELETE FROM key_usage WHERE key_id IN ('t-bad','t-capped')",
    ], 'write');
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
