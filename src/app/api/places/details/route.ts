import { NextRequest, NextResponse } from 'next/server';
import { resolveServerKey } from '@/lib/serverApiKey';
import { formatPlace, PLACE_FIELDS } from '@/lib/formatPlace';

const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

// Fresh data for one saved lead, used by the 7-day recheck. Phone + website put this in the
// Place Details Enterprise SKU (~$20 / 1,000), so callers cap how many they ask for.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !PLACE_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid place id.' }, { status: 400 });
  }

  const { key, reason } = resolveServerKey(req);
  if (!key) {
    return reason === 'cross-origin'
      ? NextResponse.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 })
      : NextResponse.json({ error: 'Details service unavailable.' }, { status: 503 });
  }

  const res = await fetch(`https://places.googleapis.com/v1/places/${id}`, {
    headers: {
      'X-Goog-Api-Key': key,
      // Photos skipped: saved copies don't keep them.
      'X-Goog-FieldMask': PLACE_FIELDS.filter((f) => f !== 'photos').join(','),
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    console.error('Place Details lookup failed:', res.status, await res.text());
    return NextResponse.json({ error: 'Place details not available.' }, { status: res.status });
  }

  return NextResponse.json(formatPlace(await res.json()));
}
