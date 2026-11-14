// Site login: one shared password, remembered in a cookie for 30 days.
// The cookie holds a hash of the password, not the password, and changes when the password
// does, so changing SITE_PASSWORD logs everyone out.

export const AUTH_COOKIE = 'mc_auth';
export const AUTH_MAX_AGE = 30 * 24 * 3600;

export async function authToken(password: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`map-crack-login:${password}`));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}
