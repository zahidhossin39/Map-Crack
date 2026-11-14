// Backs the Team page: Google key pool, teammates' agent tokens, the shared sheet link.
// Behind the site password like every page, plus a same-origin check.

import { NextRequest, NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/serverApiKey';
import { hasDb } from '@/lib/server/db';
import { poolStatus, addKey, updateKey, removeKey, testKey, DEFAULT_CAP, MAX_KEYS } from '@/lib/server/googleKeys';
import { listMembers, issueToken, removeMember, getSetting, setSetting } from '@/lib/server/team';

function guard(req: NextRequest) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 });
  if (!hasDb()) return NextResponse.json({ error: 'Turso is not configured.' }, { status: 503 });
  return null;
}

const clean = (v: unknown, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const capOf = (v: unknown) => Math.max(0, Math.min(100_000, Math.floor(Number(v)) || 0));

export async function GET(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  try {
    return NextResponse.json({
      pool: await poolStatus(),
      members: await listMembers(),
      sheet_url: await getSetting('sheet_url'),
      mcp_url: `${req.nextUrl.origin}/api/mcp`,
      default_cap: DEFAULT_CAP,
      max_keys: MAX_KEYS,
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to load.' }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  const blocked = guard(req);
  if (blocked) return blocked;
  try {
    const b = await req.json();
    switch (b.action) {
      case 'add_key': {
        const key = clean(b.key, 200);
        if (!/^[A-Za-z0-9_-]{20,}$/.test(key)) return NextResponse.json({ error: 'That does not look like a Google API key.' }, { status: 400 });
        const problem = await testKey(key); // free call; catches typos and keys without Places API
        if (problem) return NextResponse.json({ error: `Google refused this key: ${problem}` }, { status: 400 });
        await addKey({ label: clean(b.label) || 'Key', owner: clean(b.owner), key, daily_cap: b.daily_cap === undefined ? DEFAULT_CAP : capOf(b.daily_cap) });
        return NextResponse.json({ ok: true });
      }
      case 'update_key':
        await updateKey(clean(b.id), {
          ...(b.daily_cap !== undefined ? { daily_cap: capOf(b.daily_cap) } : {}),
          ...(b.label ? { label: clean(b.label) } : {}),
          wake: Boolean(b.wake),
        });
        return NextResponse.json({ ok: true });
      case 'remove_key':
        await removeKey(clean(b.id));
        return NextResponse.json({ ok: true });
      case 'add_member': {
        const name = clean(b.name, 40);
        if (!/^[\w .'-]{2,40}$/.test(name)) return NextResponse.json({ error: 'Use 2-40 letters, numbers or spaces for the name.' }, { status: 400 });
        return NextResponse.json({ ok: true, name, token: await issueToken(name) });
      }
      case 'remove_member':
        await removeMember(clean(b.name, 40));
        return NextResponse.json({ ok: true });
      case 'set_sheet': {
        const url = clean(b.url, 300);
        if (url && !/^https:\/\/docs\.google\.com\/spreadsheets\//.test(url)) {
          return NextResponse.json({ error: 'Paste a Google Sheets link (https://docs.google.com/spreadsheets/...).' }, { status: 400 });
        }
        await setSetting('sheet_url', url);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed.' }, { status: 400 });
  }
}
