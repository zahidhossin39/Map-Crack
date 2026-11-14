// Team access for the online MCP server. Each person gets their own token, so you can see
// who found what and switch off one person without touching anyone else.
// Only a SHA-256 hash of each token is stored: a leaked database can't be used to log in.

import { getDb } from './db';

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
}

function newToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return 'mc_' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function listMembers() {
  const c = await getDb();
  const rs = await c.execute('SELECT name, created_at FROM team_members ORDER BY created_at');
  return rs.rows.map((r) => ({ name: String(r.name), created_at: Number(r.created_at) }));
}

/** Creates a member (or a new token for an existing one). The token is shown once, never stored. */
export async function issueToken(name: string): Promise<string> {
  const token = newToken();
  const c = await getDb();
  await c.execute({
    sql: 'INSERT INTO team_members (name, token_hash, created_at) VALUES (?, ?, ?) ON CONFLICT(name) DO UPDATE SET token_hash = excluded.token_hash',
    args: [name, await sha256(token), Date.now()],
  });
  return token;
}

export async function removeMember(name: string) {
  const c = await getDb();
  await c.execute({ sql: 'DELETE FROM team_members WHERE name = ?', args: [name] });
}

/** Member name for a bearer token, or null. */
export async function memberForToken(token: string): Promise<string | null> {
  if (!token.startsWith('mc_')) return null;
  const c = await getDb();
  const rs = await c.execute({ sql: 'SELECT name FROM team_members WHERE token_hash = ?', args: [await sha256(token)] });
  return rs.rows[0] ? String(rs.rows[0].name) : null;
}

// Shared settings every agent reads (today: the team's Google Sheet link).
export async function getSetting(key: string): Promise<string> {
  const c = await getDb();
  const rs = await c.execute({ sql: 'SELECT value FROM team_settings WHERE key = ?', args: [key] });
  return rs.rows[0] ? String(rs.rows[0].value) : '';
}

export async function setSetting(key: string, value: string) {
  const c = await getDb();
  await c.execute({
    sql: 'INSERT INTO team_settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    args: [key, value],
  });
}
