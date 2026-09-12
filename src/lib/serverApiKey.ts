import { NextRequest } from 'next/server';

let warned = false;

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

function isSameOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  // Same-origin fetches from the browser may omit Origin entirely; only reject a mismatch.
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get('host');
  } catch {
    return false;
  }
}
