import { NextRequest, NextResponse } from 'next/server';
import { resolveServerKey } from '@/lib/serverApiKey';

// Google photo resource names look like: places/<place_id>/photos/<photo_reference>
const PHOTO_NAME_PATTERN = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name');
  const maxWidth = Number(req.nextUrl.searchParams.get('w')) || 800;

  if (!name || !PHOTO_NAME_PATTERN.test(name)) {
    return NextResponse.json({ error: 'Invalid photo name.' }, { status: 400 });
  }

  const { key } = resolveServerKey(req);
  if (!key) {
    return NextResponse.json({ error: 'Photo service unavailable.' }, { status: 503 });
  }

  const url =
    `https://places.googleapis.com/v1/${name}/media` +
    `?maxWidthPx=${Math.min(Math.max(maxWidth, 1), 4800)}` +
    `&skipHttpRedirect=true&key=${key}`;

  const res = await fetch(url);
  if (!res.ok) {
    console.error('Places photo lookup failed:', res.status, await res.text());
    return NextResponse.json({ error: 'Photo not available.' }, { status: res.status });
  }

  // skipHttpRedirect returns JSON containing a signed googleusercontent URL that carries
  // no API key, so the browser can be sent straight there.
  const { photoUri } = await res.json();
  if (!photoUri) {
    return NextResponse.json({ error: 'Photo not available.' }, { status: 502 });
  }

  return NextResponse.redirect(photoUri, {
    status: 307,
    headers: { 'Cache-Control': 'public, max-age=86400' },
  });
}
