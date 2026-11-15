// Online Map Crack MCP server. Any agent (Antigravity, Claude Code, Cursor) connects with
//   URL:    https://<site>/api/mcp
//   Header: Authorization: Bearer <token from the "Team & keys" page>
// Stateless: every request builds a fresh server, so it runs fine on Vercel functions.

import { NextRequest, NextResponse } from 'next/server';
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createMcpServer } from '@/lib/mcp/tools';
import { memberForToken } from '@/lib/server/team';
import { hasDb } from '@/lib/server/db';

export const maxDuration = 60; // find_new_leads can make 3 Google calls in a row

async function handle(req: NextRequest) {
  if (!hasDb()) return NextResponse.json({ error: 'Turso is not configured.' }, { status: 503 });

  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const who = token ? await memberForToken(token) : null;
  if (!who) {
    return NextResponse.json(
      { jsonrpc: '2.0', error: { code: -32001, message: 'Missing or wrong token. Get one on the Map Crack "Team & keys" page.' }, id: null },
      { status: 401 }
    );
  }

  const server = createMcpServer({ who, siteUrl: req.nextUrl.origin });
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true, // plain JSON replies, no long-lived stream
  });
  await server.connect(transport);
  try {
    return await transport.handleRequest(req);
  } finally {
    // Close after the response is built; nothing is kept between requests.
    queueMicrotask(() => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });
  }
}

export const POST = handle;

// Stateless server: no standalone SSE stream (GET) and no sessions to end (DELETE).
// Per the Streamable HTTP spec, 405 tells clients to just use POST. Without this, GET opened an
// empty stream that closed at once, and clients like Antigravity retried and then disconnected.
function notAllowed() {
  return NextResponse.json(
    { jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed. This server is stateless: use POST.' }, id: null },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
export const GET = notAllowed;
export const DELETE = notAllowed;
