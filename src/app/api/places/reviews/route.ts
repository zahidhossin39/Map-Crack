import { NextRequest, NextResponse } from 'next/server';
import { resolveServerKey } from '@/lib/serverApiKey';
import { mineReviews } from '@/lib/reviewIntel';

const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

// Place Details with only `reviews` in the mask: billed as Enterprise + Atmosphere (~$25 / 1,000).
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !PLACE_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid place id.' }, { status: 400 });
  }

  const { key } = resolveServerKey(req);
  if (!key) {
    return NextResponse.json({ error: 'Review service unavailable.' }, { status: 503 });
  }

  const res = await fetch(`https://places.googleapis.com/v1/places/${id}`, {
    headers: { 'X-Goog-Api-Key': key, 'X-Goog-FieldMask': 'reviews' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) {
    console.error('Places reviews lookup failed:', res.status, await res.text());
    return NextResponse.json({ error: 'Reviews not available.' }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(mineReviews(data.reviews || []));
}
