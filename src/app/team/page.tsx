'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { InlineError, type TeamData } from '@/components/Team/ui';
import KeysSection from '@/components/Team/KeysSection';
import SheetSection from '@/components/Team/SheetSection';
import TeamSection from '@/components/Team/TeamSection';

function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 tabular-nums mt-1">{value}</p>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
  );
}

export default function TeamPage() {
  const [data, setData] = useState<TeamData | null>(null);
  const [error, setError] = useState('');

  const reload = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      const d = await res.json();
      if (!res.ok) throw new Error(d.error || 'Could not load team settings.');
      setData(d);
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const nav = 'inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500';
  const activeKeys = data?.pool.keys.filter((k) => !k.cooling_until && k.used_today < k.daily_cap).length ?? 0;

  return (
    // The body is overflow:hidden for the map, so this page scrolls inside its own container.
    <main className="h-screen overflow-y-auto select-text bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <nav aria-label="Main" className="flex items-center gap-1 px-4 h-14 max-w-4xl mx-auto">
          <Link href="/" className={`${nav} text-slate-600 hover:text-slate-900 hover:bg-slate-100`}>
            <ArrowLeft className="w-4 h-4" aria-hidden /> Map
          </Link>
          <Link href="/sheet" className={`${nav} text-slate-600 hover:text-slate-900 hover:bg-slate-100`}>Sheet</Link>
          <span aria-current="page" className={`${nav} text-emerald-800 bg-emerald-50`}>Team &amp; keys</span>
        </nav>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Team &amp; keys</h1>
          <p className="text-sm text-slate-600 mt-1">Shared Google keys, the team sheet, and who can connect an agent.</p>
        </div>

        {error && <InlineError>{error}</InlineError>}

        {!data && !error && (
          <div className="flex items-center gap-2 text-sm text-slate-500" role="status">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Loading…
          </div>
        )}

        {data && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Stat label="Calls left today" value={data.pool.calls_left_today} hint={`${data.pool.used_today} used · resets midnight Pacific`} />
              <Stat label="Keys ready" value={`${activeKeys} / ${data.pool.keys.length}`} hint={`Up to ${data.max_keys} keys`} />
              <Stat label="Teammates" value={data.members.length} hint={data.members.length ? data.members.map((m) => m.name).join(', ') : 'None yet'} />
            </div>
            <KeysSection data={data} reload={reload} />
            <SheetSection data={data} reload={reload} />
            <TeamSection data={data} reload={reload} />
          </>
        )}
      </div>
    </main>
  );
}
