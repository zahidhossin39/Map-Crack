import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE, authToken } from '@/lib/siteAuth';

// Locks the whole site (pages, /api and the JS bundles, which carry the Maps key) behind one
// password once it's on the internet. Unset SITE_PASSWORD (local dev) = no lock.
// Logging in happens at /api/login: a plain HTML form with only a password box, which sets
// a cookie. Agents use /api/mcp with their own token instead.
const OPEN = ['/api/login', '/api/mcp', '/favicon.ico'];
// The agent skill is public instructions (no secrets), so teammates' agents can fetch it.
const OPEN_PREFIXES = ['/skills/'];

export async function proxy(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  if (OPEN.includes(pathname) || OPEN_PREFIXES.some((p) => pathname.startsWith(p))) return NextResponse.next();

  if (req.cookies.get(AUTH_COOKIE)?.value === (await authToken(password))) return NextResponse.next();

  // Pages go to the login form; API calls and files just get refused.
  if (req.method === 'GET' && !pathname.startsWith('/api/') && !pathname.startsWith('/_next/')) {
    const url = req.nextUrl.clone();
    url.pathname = '/api/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return new NextResponse('Login required', { status: 401 });
}
