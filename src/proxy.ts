import { NextResponse, type NextRequest } from 'next/server';

// Locks the whole site (pages and /api) behind one password once it's on the internet.
// Without it, anyone with the URL could read and change your leads in Turso and run
// searches on your Google bill. Unset SITE_PASSWORD (local dev) = no lock.
// shortcut: one shared password via the browser's Basic Auth prompt. Fine for one user;
// add real accounts if other people ever need their own logins.
export function proxy(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.next();

  const header = req.headers.get('authorization') || '';
  const [scheme, encoded] = header.split(' ');
  if (scheme === 'Basic' && encoded) {
    const decoded = atob(encoded);
    const given = decoded.slice(decoded.indexOf(':') + 1); // any username, password must match
    if (given === password) return NextResponse.next();
  }

  return new NextResponse('Password required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Map Crack", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
