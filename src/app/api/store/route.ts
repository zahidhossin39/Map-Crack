import { NextRequest, NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/serverApiKey';
import { SYNCED_KEYS } from '@/lib/cloudSync';
import { hasDb } from '@/lib/server/db';
import { readStores, patchStore } from '@/lib/server/store';

function guard(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 });
  if (!hasDb()) return NextResponse.json({ error: 'Turso is not configured.' }, { status: 503 });
  return null;
}

const isObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/** Every synced store, as { key: jsonString }. */
export async function GET(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  try {
    return NextResponse.json(await readStores());
  } catch (e: any) {
    console.error('store GET failed:', e?.message);
    return NextResponse.json({ error: 'Database read failed.' }, { status: 502 });
  }
}

/**
 * Change entries in one store. Body: { key, set: { id: value }, del: [id] }.
 * Returns the merged store so the browser also picks up other people's changes.
 * An old tab sending { key, value } (whole store) is merged without deletes, so it can't wipe anything.
 */
export async function POST(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  try {
    const body = await req.json();
    const { key } = body;
    if (!SYNCED_KEYS.includes(key)) return NextResponse.json({ error: 'Unknown store.' }, { status: 400 });

    let set: Record<string, unknown> = {};
    let del: string[] = [];
    if (typeof body.value === 'string') {
      const whole = JSON.parse(body.value);
      if (isObject(whole)) set = whole;
    } else {
      if (body.set !== undefined && !isObject(body.set)) return NextResponse.json({ error: 'Invalid set.' }, { status: 400 });
      set = body.set || {};
      del = Array.isArray(body.del) ? body.del.filter((d: unknown): d is string => typeof d === 'string') : [];
    }
    if (JSON.stringify(set).length > 4_000_000) return NextResponse.json({ error: 'Write too large.' }, { status: 413 });

    const merged = await patchStore(key, { set, del });
    return NextResponse.json({ ok: true, value: merged });
  } catch (e: any) {
    console.error('store POST failed:', e?.message);
    return NextResponse.json({ error: 'Database write failed.' }, { status: 502 });
  }
}
