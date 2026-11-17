import { NextRequest, NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/serverApiKey';
import { xraySite, Blocked } from '@/lib/server/siteFetch';

export async function GET(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 });
  }
  const raw = req.nextUrl.searchParams.get('url')?.trim();
  if (!raw) return NextResponse.json({ error: 'url required' }, { status: 400 });
  try {
    const { finalUrl, ...xray } = await xraySite(raw);
    void finalUrl;
    return NextResponse.json(xray);
  } catch (e) {
    if (e instanceof Blocked) return NextResponse.json({ error: 'blocked url' }, { status: 400 });
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }
}
