// End-to-end check: starts the MCP server the way an agent does and calls every tool.
// Uses ~6 real Google calls. Run: npx tsx mcp/selftest.ts
import path from 'node:path';
import assert from 'node:assert';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = path.resolve(__dirname, '..');
process.loadEnvFile(path.join(root, '.env.local'));

// Runs against the same server an agent starts. Uses ~6 Google calls from the key pool.

async function main() {
  const { forgetLeads, releaseArea } = await import('@/lib/mcp/leads');
  const { readStore } = await import('@/lib/server/store');
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'), '--tsconfig', path.join(root, 'tsconfig.json'), path.join(root, 'mcp', 'server.ts')],
    env: { ...process.env, MAP_CRACK_MEMBER: 'selftest' } as Record<string, string>,
    stderr: 'inherit',
  });
  const client = new Client({ name: 'selftest', version: '1.0.0' });
  await client.connect(transport);

  const call = async (name: string, args: Record<string, unknown>) => {
    const r: any = await client.callTool({ name, arguments: args });
    const text = r.content[0].text;
    if (r.isError) throw new Error(`${name} failed: ${text}`);
    return JSON.parse(text);
  };

  const tools = (await client.listTools()).tools.map((t) => t.name).sort();
  assert.deepStrictEqual(tools, ['claim_area', 'find_new_leads', 'get_competitors', 'get_review_pain', 'get_team_info', 'list_leads', 'update_lead']);
  console.log('tools:', tools.join(', '));

  const info = await call('get_team_info', {});
  assert.strictEqual(info.you, 'selftest');
  console.log(`team: you=${info.you}, calls left today ${info.google_calls_today.calls_left}`);

  const area = 'Leeds';
  const claim = await call('claim_area', { area, niche: 'roofer' });
  assert.strictEqual(claim.claimed, true);
  const first = await call('find_new_leads', { area, niche: 'roofer', limit: 3 });
  console.log(`find #1: ${first.new_leads.length} leads, ${first.scanned} scanned, ${first.google_calls} calls`);
  first.new_leads.forEach((l: any) => console.log(`  ${l.lead_score}  ${l.name} | ${l.phone} | ${l.presence}`));
  assert.ok(first.new_leads.length > 0, 'expected at least one no-website roofer');
  for (const l of first.new_leads) {
    assert.ok(!l.presence.startsWith('website'), 'no-website filter leaked');
    assert.strictEqual(l.found_by, 'selftest');
    assert.ok(l.map_crack_url.includes(`?focus=${l.place_id}`), 'missing Map Crack link');
  }
  const stars = await readStore('pindrop_selected_ids');
  const saved = await readStore<any>('pindrop_saved_leads');
  for (const l of first.new_leads) {
    assert.ok(stars[l.place_id] && saved[l.place_id]?.business?.name === l.name, 'lead not starred on the website');
  }
  console.log('stars: every new lead is starred on the website');

  const second = await call('find_new_leads', { area, niche: 'roofer', limit: 3 });
  const overlap = second.new_leads.filter((l: any) => first.new_leads.some((f: any) => f.place_id === l.place_id));
  assert.strictEqual(overlap.length, 0, 'same lead returned twice');
  console.log(`find #2: ${second.new_leads.length} different leads (no repeats)`);

  const lead = first.new_leads[0];
  const pain = await call('get_review_pain', { place_id: lead.place_id });
  console.log(`reviews: ${pain.reviews_sampled} sampled, ${pain.cant_reach_complaints.length} cant-reach complaints`);

  const comp = await call('get_competitors', { place_id: lead.place_id });
  console.log(`competitors: ${comp.competitors.map((c: any) => `${c.name} (${c.review_count})`).join(', ')}`);
  comp.verified_gap_lines.slice(0, 3).forEach((g: string) => console.log(`  gap: ${g}`));

  await call('update_lead', { place_id: lead.place_id, status: 'researched', research: 'selftest card' });
  const listed = await call('list_leads', { status: 'researched', area: 'Leeds' });
  assert.ok(listed.leads.some((l: any) => l.place_id === lead.place_id && l.research === 'selftest card'));
  console.log(`list: found the updated lead; Google calls today ${listed.google_calls_today.used}, ${listed.google_calls_today.calls_left} left`);

  await client.close();
  // Clean up so the self-test doesn't use up real leads or leave stars behind.
  await forgetLeads([...first.new_leads, ...second.new_leads].map((l: any) => l.place_id));
  await releaseArea(area, 'roofer');
  console.log('selftest OK (test leads removed)');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
