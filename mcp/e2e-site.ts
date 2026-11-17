// One website lead end to end through the real MCP server: find -> check_website -> save_site_audit.
// Uses 1-3 Google calls. Run: npx tsx --tsconfig tsconfig.json mcp/e2e-site.ts
// Leaves the lead in place so you can see it on /redesign; pass --clean <place_id> to remove it.
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = path.resolve(__dirname, '..');
process.loadEnvFile(path.join(root, '.env.local'));

// Removes every lead this script's member found (no-website and website), plus their stars and redesign entries.
async function clean() {
  const { forgetLeads } = await import('@/lib/mcp/leads');
  const { patchStore } = await import('@/lib/server/store');
  const { getDb } = await import('@/lib/server/db');
  const c = await getDb();
  const r = await c.execute({ sql: 'SELECT place_id FROM mcp_leads WHERE found_by = ?', args: ['e2e-test'] });
  const ids = r.rows.map((row) => String(row.place_id));
  await forgetLeads(ids);
  if (ids.length) await patchStore('pindrop_redesign_leads', { del: ids });
  console.log('cleaned', ids.length, 'leads');
}

async function main() {
  if (process.argv.includes('--clean')) return clean();

  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'), '--tsconfig', path.join(root, 'tsconfig.json'), path.join(root, 'mcp', 'server.ts')],
    env: { ...process.env, MAP_CRACK_MEMBER: 'e2e-test' } as Record<string, string>,
    stderr: 'inherit',
  });
  const client = new Client({ name: 'e2e', version: '1.0.0' });
  await client.connect(transport);
  const call = async (name: string, args: Record<string, unknown>) => {
    const r: any = await client.callTool({ name, arguments: args });
    if (r.isError) throw new Error(`${name}: ${r.content[0].text}`);
    return JSON.parse(r.content[0].text);
  };

  const found = await call('find_new_leads', { area: 'Plano, TX', niche: 'painter', limit: 1 });
  const sites = found.website_leads || [];
  console.log(`no-website leads: ${found.leads?.length ?? 0}, website leads: ${sites.length}`);
  if (!sites.length) throw new Error('no website leads returned');

  const pending = await call('list_leads', { kind: 'site', status: 'found', limit: 200 });
  console.log('pending website leads listed:', pending.leads?.length ?? pending.count);

  const lead = sites[0];
  console.log('lead:', lead.name, lead.website, lead.place_id);
  const t = Date.now();
  const checks = await call('check_website', { place_id: lead.place_id });
  console.log(`check_website ${Math.round((Date.now() - t) / 1000)}s:`, JSON.stringify(checks.free_checks.failed), JSON.stringify(checks.automation));

  const saved = await call('save_site_audit', {
    place_id: lead.place_id,
    design_score: 5,
    problems: ['E2E TEST problem one', 'E2E TEST problem two'],
    pitch: 'Both',
    say: 'E2E test say line.',
    ask: 'E2E test ask line?',
    offer: 'E2E test offer line.',
    report: `# ${lead.name} — website audit\n**Score:** 5/10 · **Pitch:** Both\n\n## Measured\n- ${checks.free_checks.failed.join('\n- ') || 'nothing failed'}`,
    checks: checks.free_checks,
  });
  console.log('saved:', JSON.stringify(saved));
  console.log(JSON.stringify({ lead }));
  await client.close();
}

main().then(() => process.exit(0), (e) => { console.error(e); process.exit(1); });
