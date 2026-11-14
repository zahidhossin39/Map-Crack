import { NextRequest } from 'next/server';
import { googlePlaces, googlePlacesWithKey, type GoogleInit } from '@/lib/server/googleKeys';
import { hasDb } from '@/lib/server/db';

let warned = false;

export type PlacesCall = (path: string, init: GoogleInit) => Promise<any>;

/**
 * How a website request reaches Google: the caller's own key (bring-your-own from the map's
 * settings), or the shared key pool, which falls back to teammates' keys when one runs out.
 * The pool is only for this app's own pages, so other sites can't use it as a free proxy.
 */
export function placesCaller(req: NextRequest, callerKey?: string): { call: PlacesCall } | { error: 'cross-origin' | 'missing' } {
  if (typeof callerKey === 'string' && callerKey.trim()) {
    const k = callerKey.trim();
    return { call: (path, init) => googlePlacesWithKey(k, path, init) };
  }
  if (!isSameOrigin(req)) return { error: 'cross-origin' };
  if (hasDb()) return { call: googlePlaces };
  // No database (local dev without Turso): just use the .env key.
  const { key } = resolveServerKey(req);
  if (!key) return { error: 'missing' };
  return { call: (path, init) => googlePlacesWithKey(key, path, init) };
}

/**
 * Resolves the Google API key for a server-side Places call.
 *
 * A caller-supplied key (bring-your-own, from Settings) is always honoured — it is the
 * user's own key and their own billing. The shared server key is only handed out to
 * same-origin requests, so the endpoints can't be used as a free Places proxy by other sites.
 */
export function resolveServerKey(
  req: NextRequest,
  callerKey?: string
): { key: string | null; reason?: string } {
  if (typeof callerKey === 'string' && callerKey.trim()) {
    return { key: callerKey.trim() };
  }

  const serverKey = process.env.GOOGLE_PLACES_SERVER_KEY?.trim();
  const publicKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();

  if (!serverKey && publicKey && !warned) {
    warned = true;
    console.warn(
      '[map-crack] GOOGLE_PLACES_SERVER_KEY is not set, falling back to ' +
        'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY. That key is embedded in the browser bundle and ' +
        'therefore cannot be referrer-restricted while it is also used server-side. ' +
        'Create a second, server-only key (IP-restricted, Places API only) and set ' +
        'GOOGLE_PLACES_SERVER_KEY.'
    );
  }

  const key = serverKey || publicKey || null;
  if (!key) return { key: null, reason: 'missing' };

  if (!isSameOrigin(req)) {
    return { key: null, reason: 'cross-origin' };
  }

  return { key };
}

/**
 * True only for requests made by this app's own pages. Browsers set Sec-Fetch-Site and pages
 * cannot forge it, so other websites are blocked. A request with neither header (curl, a script)
 * is rejected too. shortcut: a script can still fake both headers, so a public deploy needs
 * real auth or a rate limit on top.
 */
export function isSameOrigin(req: NextRequest): boolean {
  const site = req.headers.get('sec-fetch-site');
  if (site) return site === 'same-origin';
  const origin = req.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).host === req.headers.get('host');
  } catch {
    return false;
  }
}
