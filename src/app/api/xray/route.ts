import { NextRequest, NextResponse } from 'next/server';
import { lookup as dnsLookup, type LookupAddress } from 'node:dns';
import { isIP } from 'node:net';
import http from 'node:http';
import https from 'node:https';
import zlib from 'node:zlib';
import type { Readable } from 'node:stream';
import { detectSignals, DEAD_XRAY } from '@/lib/xray';
import { isSameOrigin } from '@/lib/serverApiKey';

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

class Blocked extends Error {}

// Checks the address the socket actually connects to, so DNS can't answer "public" for the
// check and "127.0.0.1" for the request (DNS rebinding).
const safeLookup: typeof dnsLookup = ((host: string, options: any, cb: any) => {
  dnsLookup(host, options, (err, address, family) => {
    if (err) return cb(err);
    const list: LookupAddress[] = Array.isArray(address) ? address : [{ address, family: family! }];
    if (list.some((a) => isPrivate(a.address))) return cb(new Blocked('private address'));
    cb(null, address, family);
  });
}) as typeof dnsLookup;

interface Page {
  status: number;
  location: string | null;
  html: string;
}

function get(url: URL): Promise<Page> {
  return new Promise((resolve, reject) => {
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(
      url,
      {
        lookup: safeLookup,
        timeout: 12000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MapCrackXray/1.0)',
          Accept: 'text/html',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      },
      (res) => {
        const status = res.statusCode || 0;
        const location = status >= 300 && status < 400 ? res.headers.location || null : null;
        if (location || status >= 400) {
          res.resume();
          return resolve({ status, location, html: '' });
        }
        const enc = res.headers['content-encoding'];
        const body: Readable =
          enc === 'br' ? res.pipe(zlib.createBrotliDecompress()) :
          enc === 'gzip' || enc === 'deflate' ? res.pipe(zlib.createUnzip()) : res;
        let html = '';
        body.setEncoding('utf8');
        body.on('data', (chunk: string) => {
          html += chunk;
          if (html.length >= MAX_BYTES) body.destroy();
        });
        body.on('close', () => resolve({ status, location: null, html }));
        body.on('error', () => resolve({ status, location: null, html }));
      }
    );
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.on('error', reject);
    req.end();
  });
}

function checkUrl(url: URL) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Blocked('bad protocol');
  // IP literals skip DNS, so safeLookup never sees them.
  const host = url.hostname.replace(/^\[|\]$/g, '');
  if (isIP(host) && isPrivate(host)) throw new Blocked('private address');
}

export async function GET(req: NextRequest) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: 'Cross-origin requests are not allowed.' }, { status: 403 });
  }

  const raw = req.nextUrl.searchParams.get('url')?.trim();
  if (!raw) return NextResponse.json({ error: 'url required' }, { status: 400 });

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }

  try {
    // Follow redirects by hand so every hop gets checked.
    for (let hop = 0; hop < 5; hop++) {
      checkUrl(url);
      const page = await get(url);
      if (page.location) {
        url = new URL(page.location, url);
        continue;
      }
      if (page.status >= 400) return NextResponse.json(DEAD_XRAY);
      return NextResponse.json(detectSignals(page.html, url.toString()));
    }
    return NextResponse.json(DEAD_XRAY); // redirect loop
  } catch (e) {
    if (e instanceof Blocked) return NextResponse.json({ error: 'blocked url' }, { status: 400 });
    // DNS failure, refused, timeout, bad TLS: to a customer, all the same dead site.
    return NextResponse.json(DEAD_XRAY);
  }
}
