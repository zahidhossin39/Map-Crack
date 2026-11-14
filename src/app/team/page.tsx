'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Copy, KeyRound, Loader2, Plus, RotateCcw, Sheet, Trash2, Users } from 'lucide-react';

interface PoolKey {
  id: string;
  label: string;
  owner: string;
  key: string;
  daily_cap: number;
  used_today: number;
  cooling_until: number | null;
  last_error: string | null;
  from_env: boolean;
}
interface TeamData {
  pool: { day: string; keys: PoolKey[]; calls_left_today: number; used_today: number };
  members: { name: string; created_at: number }[];
  sheet_url: string;
  mcp_url: string;
  default_cap: number;
  max_keys: number;
}

async function api(body: Record<string, unknown>) {
  const res = await fetch('/api/team', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Failed (${res.status})`);
  return data;
}

const time = (t: number) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function CopyBox({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="relative">
      <pre className="text-[11px] bg-slate-900 text-slate-100 rounded-md p-3 pr-16 overflow-x-auto whitespace-pre">{text}</pre>
      <button
        onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 1500); })}
        className="absolute top-2 right-2 flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20"
      >
        {done ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {done ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const [sheet, setSheet] = useState('');
  const [newKey, setNewKey] = useState({ label: '', owner: '', key: '', daily_cap: '' });
  const [memberName, setMemberName] = useState('');
  const [issued, setIssued] = useState<{ name: string; token: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Failed to load');
      setData(d);
      setSheet(d.sheet_url || '');
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (label: string, body: Record<string, unknown>, after?: (r: any) => void) => {
    setBusy(label);
    setError('');
    try {
      const r = await api(body);
      after?.(r);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const card = 'border border-slate-200 rounded-lg p-4 bg-white';
  const input = 'text-sm border border-slate-300 rounded-md px-2 py-1.5 outline-none focus:border-emerald-500';
  const btn = 'flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40';

  const agentConfig = issued && data
    ? JSON.stringify({ mcpServers: { 'map-crack': { serverUrl: data.mcp_url, headers: { Authorization: `Bearer ${issued.token}` } } } }, null, 2)
    : '';

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2 px-4 py-2.5 max-w-5xl mx-auto">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700">
            <ArrowLeft className="w-4 h-4" /> Map
          </Link>
          <Link href="/sheet" className="text-sm font-semibold text-slate-600 hover:text-emerald-700 ml-2">Sheet</Link>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <h1 className="text-sm font-bold">Team &amp; keys</h1>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 space-y-4">
        {error && <div className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">{error}</div>}
        {!data && !error && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin" /> Loading…</div>}

        {data && (
          <>
            {/* Shared sheet */}
            <section className={card}>
              <h2 className="flex items-center gap-2 font-bold text-sm"><Sheet className="w-4 h-4 text-emerald-600" /> Team Google Sheet</h2>
              <p className="text-xs text-slate-500 mt-1">Every agent writes to this sheet. Share it (Editor) with each teammate's Google account.</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <input value={sheet} onChange={(e) => setSheet(e.target.value)} placeholder="https://docs.google.com/spreadsheets/d/…" className={`${input} flex-1 min-w-[260px]`} />
                <button disabled={busy === 'sheet' || sheet === data.sheet_url} onClick={() => act('sheet', { action: 'set_sheet', url: sheet })} className={btn}>Save</button>
              </div>
            </section>

            {/* Key pool */}
            <section className={card}>
              <div className="flex flex-wrap items-baseline gap-2">
                <h2 className="flex items-center gap-2 font-bold text-sm"><KeyRound className="w-4 h-4 text-emerald-600" /> Google API keys</h2>
                <span className="text-xs text-slate-500">
                  {data.pool.used_today} calls used today • {data.pool.calls_left_today} left across all keys (resets midnight Pacific)
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Used top to bottom. When a key reaches its daily cap or Google refuses it, the next one takes over, and the
                refused key rests: 2 min for a per-minute limit, until midnight Pacific for a daily quota, 6 h for a key error.
                Each key bills its owner's Google account, and the cap is how much of it the team may use per day.
              </p>

              <div className="overflow-x-auto mt-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-left text-slate-500 border-b border-slate-200">
                      <th className="py-1.5 pr-2">#</th><th className="pr-2">Name</th><th className="pr-2">Owner</th><th className="pr-2">Key</th>
                      <th className="pr-2">Today</th><th className="pr-2">Daily cap</th><th className="pr-2">Status</th><th />
                    </tr>
                  </thead>
                  <tbody>
                    {data.pool.keys.map((k, i) => {
                      const capped = k.used_today >= k.daily_cap;
                      return (
                        <tr key={k.id} className="border-b border-slate-100 align-top">
                          <td className="py-2 pr-2 text-slate-400">{i + 1}</td>
                          <td className="pr-2 font-semibold">{k.label}</td>
                          <td className="pr-2">{k.owner || '—'}</td>
                          <td className="pr-2 font-mono">{k.key}</td>
                          <td className="pr-2">{k.used_today}</td>
                          <td className="pr-2">
                            <input
                              type="number"
                              min={0}
                              defaultValue={k.daily_cap}
                              onBlur={(e) => Number(e.target.value) !== k.daily_cap && act('cap', { action: 'update_key', id: k.id, daily_cap: e.target.value })}
                              className="w-20 border border-slate-300 rounded px-1.5 py-0.5"
                            />
                          </td>
                          <td className="pr-2 max-w-[260px]">
                            {k.cooling_until ? (
                              <span className="text-amber-700">Resting until {time(k.cooling_until)}{k.last_error ? ` — ${k.last_error}` : ''}</span>
                            ) : capped ? (
                              <span className="text-slate-500">At cap for today</span>
                            ) : (
                              <span className="text-emerald-700">Active</span>
                            )}
                          </td>
                          <td className="whitespace-nowrap text-right">
                            {k.cooling_until && (
                              <button title="Try this key again now" onClick={() => act('wake', { action: 'update_key', id: k.id, wake: true })} className="p-1 text-slate-500 hover:text-emerald-700"><RotateCcw className="w-3.5 h-3.5" /></button>
                            )}
                            {!k.from_env && (
                              <button title="Remove key" onClick={() => confirm(`Remove "${k.label}" from the pool?`) && act('rm', { action: 'remove_key', id: k.id })} className="p-1 text-slate-500 hover:text-rose-700"><Trash2 className="w-3.5 h-3.5" /></button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {!data.pool.keys.length && <tr><td colSpan={8} className="py-3 text-slate-500">No keys yet.</td></tr>}
                  </tbody>
                </table>
              </div>

              {data.pool.keys.length < data.max_keys && (
                <form
                  className="flex flex-wrap gap-2 mt-3"
                  onSubmit={(e) => {
                    e.preventDefault();
                    act('add', { action: 'add_key', ...newKey, daily_cap: newKey.daily_cap === '' ? undefined : newKey.daily_cap }, () =>
                      setNewKey({ label: '', owner: '', key: '', daily_cap: '' })
                    );
                  }}
                >
                  <input value={newKey.label} onChange={(e) => setNewKey({ ...newKey, label: e.target.value })} placeholder="Name, e.g. Sam's key" className={`${input} w-36`} />
                  <input value={newKey.owner} onChange={(e) => setNewKey({ ...newKey, owner: e.target.value })} placeholder="Owner" className={`${input} w-28`} />
                  <input value={newKey.key} onChange={(e) => setNewKey({ ...newKey, key: e.target.value })} placeholder="AIza…" type="password" autoComplete="off" className={`${input} flex-1 min-w-[200px] font-mono`} />
                  <input value={newKey.daily_cap} onChange={(e) => setNewKey({ ...newKey, daily_cap: e.target.value })} placeholder={`Cap (${data.default_cap})`} type="number" min={0} className={`${input} w-24`} />
                  <button disabled={!newKey.key || busy === 'add'} className={btn}>
                    {busy === 'add' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />} Add key
                  </button>
                </form>
              )}
              <p className="text-[11px] text-slate-400 mt-2">
                The key is tested with a free Google call before it's saved. Only the first and last 4 characters are ever shown again.
                The key needs Places API (New) enabled and no website restriction (calls come from the server).
              </p>
            </section>

            {/* Teammates */}
            <section className={card}>
              <h2 className="flex items-center gap-2 font-bold text-sm"><Users className="w-4 h-4 text-emerald-600" /> Teammates' agents</h2>
              <p className="text-xs text-slate-500 mt-1">
                Each person gets a token for the online Map Crack server. Their agent shares the same lead memory, so nobody is
                ever handed a business someone else already got.
              </p>

              <ul className="mt-3 divide-y divide-slate-100 text-sm">
                {data.members.map((m) => (
                  <li key={m.name} className="flex items-center gap-2 py-1.5">
                    <span className="font-semibold">{m.name}</span>
                    <span className="text-xs text-slate-400">since {new Date(m.created_at).toLocaleDateString()}</span>
                    <button onClick={() => act('tok', { action: 'add_member', name: m.name }, (r) => setIssued({ name: r.name, token: r.token }))} className="ml-auto text-xs text-slate-500 hover:text-emerald-700">New token</button>
                    <button onClick={() => confirm(`Remove ${m.name}? Their agent stops working right away.`) && act('rmm', { action: 'remove_member', name: m.name })} className="text-xs text-slate-500 hover:text-rose-700">Remove</button>
                  </li>
                ))}
                {!data.members.length && <li className="py-1.5 text-xs text-slate-500">Nobody yet. Add yourself first, then your teammate.</li>}
              </ul>

              <form
                className="flex gap-2 mt-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  act('member', { action: 'add_member', name: memberName }, (r) => {
                    setIssued({ name: r.name, token: r.token });
                    setMemberName('');
                  });
                }}
              >
                <input value={memberName} onChange={(e) => setMemberName(e.target.value)} placeholder="Name, e.g. Zaid" className={`${input} w-48`} />
                <button disabled={!memberName.trim() || busy === 'member'} className={btn}><Plus className="w-3.5 h-3.5" /> Add teammate</button>
              </form>

              {issued && (
                <div className="mt-4 border border-amber-300 bg-amber-50 rounded-md p-3 space-y-2">
                  <p className="text-xs font-semibold text-amber-900">
                    Token for {issued.name}. It is shown only now; send it privately. In Antigravity, paste this into
                    Settings → MCP → raw config (mcp_config.json), then restart:
                  </p>
                  <CopyBox text={agentConfig} />
                  <button onClick={() => setIssued(null)} className="text-xs text-amber-900 underline">I've saved it, hide</button>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
