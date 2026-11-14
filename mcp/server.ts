// Map Crack MCP server, local version (stdio). For teammates, use the online one at
// https://<your-site>/api/mcp with a token from the "Team & keys" page instead.
// Run: npx tsx mcp/server.ts   (reads keys from .env.local in the repo root)

import path from 'node:path';
import fs from 'node:fs';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// stdout carries the MCP protocol, so nothing else may print there. Logs go to stderr.
console.log = console.error;

const envFile = path.resolve(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

async function main() {
  // Imported after the env file loads, so the database and keys are visible.
  const { createMcpServer } = await import('@/lib/mcp/tools');
  const server = createMcpServer({
    who: process.env.MAP_CRACK_MEMBER || 'owner',
    siteUrl: process.env.MAP_CRACK_SITE_URL || 'https://map-crack.vercel.app',
  });
  await server.connect(new StdioServerTransport());
  console.error('Map Crack MCP server ready');
}

main().catch((e) => {
  console.error('Map Crack MCP server failed to start:', e);
  process.exit(1);
});
