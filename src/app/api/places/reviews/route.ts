import { NextRequest, NextResponse } from 'next/server';
import { placesCaller } from '@/lib/serverApiKey';
import { mineReviews } from '@/lib/reviewIntel';

const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

// Place Details with only `reviews` in the mask: billed as Enterprise + Atmosphere (~$25 / 1,000).
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id || !PLACE_ID_PATTERN.test(id)) {
    return NextResponse.json({ error: 'Invalid place id.' }, { status: 400 });
  }

  const caller = placesCaller(req);
  if ('error' in caller) {
    return NextResponse.json({ error: 'Review service unavailable.' }, { status: 503 });
  }

  try {
    const data = await caller.call(`/places/${id}`, { fieldMask: 'reviews' });
    return NextResponse.json(mineReviews(data.reviews || []));
  } catch (e: any) {
    console.error('Places reviews lookup failed:', e?.status, e?.message);
    return NextResponse.json({ error: 'Reviews not available.' }, { status: e?.status || 502 });
  }
}
