# Next 16 / React 19 upgrade (commit 5a79935)

## Why
`npm audit --omit=dev` flagged critical advisories on Next 14.2.35 (including unauthenticated RCE on Windows-hosted servers) and a high one on Next's bundled postcss. The patched line is Next 16.

## What changed
- `next` 14.2 → 16.4.2, `react` / `react-dom` 18 → 19, `@types/react` / `@types/react-dom` → 19.
- `tsconfig.json` (auto-edited by `next build`): `jsx` is now `react-jsx`; `.next/dev/types/**/*.ts` added to `include`.
- No app code changes were needed: no route handler uses `params`, `cookies()` or `headers()` (the async APIs that broke in Next 15/16).
- `@vis.gl/react-google-maps` already supports React 19; left as is.
- `dev` script still binds to `127.0.0.1` (`next dev -H 127.0.0.1`), so the dev server isn't reachable from the network.

## Verified
- `npm audit --omit=dev`: 0 vulnerabilities.
- `npx tsc --noEmit`, `npx next build`, `npm run check`: all pass.
- Browser: map search returned businesses, lead detail modal opened, no console errors.
- Not tested in the browser: X-ray and review check (they compile in the build).

## Gotchas for later
- `next build` in Next 16 only lists `/` in its route table; the API routes still work (search ran fine).
- If you ever host this, keep the same-origin lock on the API routes and keep Next patched; the RCE advisory targeted exactly this kind of setup.
