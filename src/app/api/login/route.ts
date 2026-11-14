// Password-only login page. Plain HTML with no JavaScript, so it loads before the locked
// bundles. GET shows the form, POST checks the password and sets the login cookie.

import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE, AUTH_MAX_AGE, authToken } from '@/lib/siteAuth';

// Only same-site paths, so the form can't be used to bounce people to another website.
const safeNext = (v: unknown) => (typeof v === 'string' && v.startsWith('/') && !v.startsWith('//') ? v : '/');

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function page(next: string, wrong: boolean) {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>Map Crack</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; min-height:100vh; display:grid; place-items:center; background:#0b1220; font-family:system-ui,sans-serif; color:#e2e8f0; }
  form { width:min(320px, calc(100vw - 32px)); background:#111a2e; border:1px solid #1f2a44; border-radius:14px; padding:24px; box-sizing:border-box; }
  .logo { width:40px; height:40px; border-radius:10px; background:#7c3aed; color:#fff; display:grid; place-items:center; font-weight:900; margin-bottom:12px; }
  h1 { font-size:18px; margin:0 0 16px; }
  input { width:100%; box-sizing:border-box; padding:10px 12px; border-radius:8px; border:1px solid #334155; background:#0b1220; color:#e2e8f0; font-size:15px; }
  input:focus { outline:2px solid #7c3aed; border-color:transparent; }
  button { margin-top:12px; width:100%; padding:10px; border:0; border-radius:8px; background:#7c3aed; color:#fff; font-weight:700; font-size:15px; cursor:pointer; }
  button:hover { background:#6d28d9; }
  .err { color:#fda4af; font-size:13px; margin:10px 0 0; }
</style></head><body>
<form method="post" action="/api/login">
  <div class="logo">MC</div>
  <h1>Map Crack</h1>
  <input type="password" name="password" placeholder="Password" autofocus required autocomplete="current-password">
  <input type="hidden" name="next" value="${esc(next)}">
  <button type="submit">Enter</button>
  ${wrong ? '<p class="err">Wrong password.</p>' : ''}
</form></body></html>`;
  return new NextResponse(html, { status: wrong ? 401 : 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

export async function GET(req: NextRequest) {
  return page(safeNext(req.nextUrl.searchParams.get('next')), false);
}

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const next = safeNext(form.get('next'));
  const password = process.env.SITE_PASSWORD;
  if (!password) return NextResponse.redirect(new URL(next, req.url), 303);
  if (form.get('password') !== password) return page(next, true);

  const res = NextResponse.redirect(new URL(next, req.url), 303);
  res.cookies.set(AUTH_COOKIE, await authToken(password), {
    httpOnly: true,
    secure: req.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    path: '/',
    maxAge: AUTH_MAX_AGE,
  });
  return res;
}
