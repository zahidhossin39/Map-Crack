import { NextRequest, NextResponse } from 'next/server';
import { placesCaller } from '@/lib/serverApiKey';
import { formatPlace, PLACE_FIELDS } from '@/lib/formatPlace';

const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

// Fresh data for one saved lead, used by the 7-day recheck. Phone + website put this in the
// Place Details Enterprise SKU (~$20 / 1,000), so callers cap how many they ask for.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !PLACE_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid place id.' }, { status: 400 });
  }

  const caller = placesCaller(req);
  if ('error' in caller) {
    return caller.error === 'cross-origin'
      ? NextResponse.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 })
      : NextResponse.json({ error: 'Details service unavailable.' }, { status: 503 });
  }

  try {
    // Photos skipped: saved copies don't keep them.
    const raw = await caller.call(`/places/${id}`, { fieldMask: PLACE_FIELDS.filter((f) => f !== 'photos').join(',') });
    return NextResponse.json(formatPlace(raw));
  } catch (e: any) {
    console.error('Place Details lookup failed:', e?.status, e?.message);
    return NextResponse.json({ error: 'Place details not available.' }, { status: e?.status || 502 });
  }
}
