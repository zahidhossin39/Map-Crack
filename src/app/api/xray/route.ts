import { NextRequest, NextResponse } from 'next/server';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { detectSignals, DEAD_XRAY } from '@/lib/xray';

const MAX_BYTES = 1_500_000;

// The server fetches a URL the client chose, so block anything that resolves to our own network (SSRF).
function isPrivate(ip: string): boolean {
  if (isIP(ip) === 6) {
    const v = ip.toLowerCase();
    if (v.startsWith('::ffff:')) return isPrivate(v.slice(7));
    return v === '::1' || v === '::' || v.startsWith('fc') || v.startsWith('fd') || v.startsWith('fe80');
  }
  const [a, b] = ip.split('.').map(Number);
  return a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127) || a >= 224;
}

async function assertPublic(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error('bad protocol');
  const host = url.hostname.replace(/^\[|\]$/g, '');
  const addrs = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (addrs.some((a) => isPrivate(a.address))) throw new Error('private address');
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url')?.trim();
  if (!raw) return NextResponse.json({ error: 'url required' }, { status: 400 });

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  try {
    // Follow redirects by hand so every hop gets the private-address check.
    await assertPublic(url);
    let res: Response | null = null;
    for (let hop = 0; hop < 5; hop++) {
      res = await fetch(url, {
        redirect: 'manual',
        signal: AbortSignal.timeout(12000),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MapCrackXray/1.0)', Accept: 'text/html' },
      });
      const next = res.status >= 300 && res.status < 400 ? res.headers.get('location') : null;
      if (!next) break;
      url = new URL(next, url);
      await assertPublic(url);
    }
    if (!res || res.status >= 400 || (res.status >= 300 && res.status < 400)) return NextResponse.json(DEAD_XRAY);

    const reader = res.body?.getReader();
    let html = '';
    const decoder = new TextDecoder();
    while (reader && html.length < MAX_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      html += decoder.decode(value, { stream: true });
    }
    reader?.cancel().catch(() => {});

    return NextResponse.json(detectSignals(html, url.toString()));
  } catch (e: any) {
    if (e?.message === 'private address' || e?.message === 'bad protocol') {
      return NextResponse.json({ error: 'blocked url' }, { status: 400 });
    }
    // DNS failure, refused, timeout, bad TLS: to a customer, all the same dead site.
    return NextResponse.json(DEAD_XRAY);
  }
}
