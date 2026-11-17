'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, FileText, Globe, MapPin, Search, Trash2, X } from 'lucide-react';
import { loadFromCloud } from '@/lib/cloudSync';
import {
  type RedesignLead,
  getAllRedesignLeads,
  removeRedesignLead,
  setRedesignNotes,
  REDESIGN_CHANGED_EVENT,
} from '@/lib/redesignLeads';

type PitchFilter = 'all' | 'Redesign' | 'Automation' | 'Both';

const PITCH_STYLE: Record<string, string> = {
  Redesign: 'bg-blue-50 text-blue-800 ring-blue-600/20',
  Automation: 'bg-violet-50 text-violet-800 ring-violet-600/20',
  Both: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
};

function scoreStyle(s: number) {
  if (s <= 3) return 'bg-rose-100 text-rose-800';
  if (s <= 6) return 'bg-amber-100 text-amber-800';
  return 'bg-emerald-100 text-emerald-800';
}

const host = (u?: string | null) => (u || '').replace(/^https?:\/\/(www\.)?/, '').replace(/[/?#].*$/, '');

/** Tiny markdown view for the audit report: headings, bullets, bold. Escapes everything else. */
function Report({ md }: { md: string }) {
  const esc = (t: string) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]!);
  const inline = (t: string) => esc(t).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const html = md
    .split('\n')
    .map((line) => {
      const h = line.match(/^(#{1,4})\s+(.*)/);
      if (h) return `<h${Math.min(h[1].length + 1, 4)} class="font-semibold text-slate-900 mt-4 mb-1 ${h[1].length === 1 ? 'text-lg' : 'text-base'}">${inline(h[2])}</h${Math.min(h[1].length + 1, 4)}>`;
      const li = line.match(/^\s*[-*]\s+(.*)/);
      if (li) return `<li class="ml-5 list-disc">${inline(li[1])}</li>`;
      return line.trim() ? `<p class="mt-1">${inline(line)}</p>` : '';
    })
    .join('');
  return <div className="text-[15px] leading-7 text-slate-700" dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function RedesignPage() {
  const [leads, setLeads] = useState<Record<string, RedesignLead>>({});
  const [query, setQuery] = useState('');
  const [pitch, setPitch] = useState<PitchFilter>('all');
  const [open, setOpen] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => setLeads(getAllRedesignLeads());
    sync();
    loadFromCloud().finally(() => {
      sync();
      const id = new URLSearchParams(window.location.search).get('lead');
      if (id) setOpen(id);
    });
    window.addEventListener(REDESIGN_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(REDESIGN_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return Object.values(leads)
      .filter((l) => pitch === 'all' || l.audit.pitch === pitch)
      .filter((l) => !q || [l.business.name, l.business.nationalPhoneNumber, l.business.formattedAddress, l.notes].join(' ').toLowerCase().includes(q))
      .sort((a, b) => a.audit.design_score - b.audit.design_score || b.savedAt - a.savedAt);
  }, [leads, query, pitch]);

  const lead = open ? leads[open] : null;

  return (
    <main className="h-screen overflow-y-auto select-text bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200">
        <nav aria-label="Main" className="flex items-center gap-1 px-4 h-14 max-w-6xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100">
            <ArrowLeft className="w-4 h-4" aria-hidden /> Map
          </Link>
          <Link href="/sheet" className="inline-flex items-center min-h-[40px] px-3 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100">Sheet</Link>
          <span aria-current="page" className="inline-flex items-center min-h-[40px] px-3 rounded-lg text-sm font-medium text-blue-800 bg-blue-50">Redesign</span>
          <Link href="/team" className="inline-flex items-center min-h-[40px] px-3 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100">Team &amp; keys</Link>
        </nav>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Redesign &amp; automation leads</h1>
          <p className="text-sm text-slate-600 mt-1">
            Businesses that have a website, audited by an agent. Worst sites first. Blue pins on the map.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-3 min-h-[40px] focus-within:border-blue-500 flex-1 min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400" aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, phone, address, notes" aria-label="Search leads" className="text-sm outline-none w-full bg-transparent" />
          </label>
          <div role="tablist" aria-label="Pitch" className="flex bg-white border border-slate-300 rounded-lg p-1">
            {(['all', 'Redesign', 'Automation', 'Both'] as PitchFilter[]).map((p) => (
              <button
                key={p}
                role="tab"
                aria-selected={pitch === p}
                onClick={() => setPitch(p)}
                className={`px-3 min-h-[32px] rounded-md text-sm font-medium cursor-pointer ${pitch === p ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                {p === 'all' ? `All (${Object.keys(leads).length})` : p}
              </button>
            ))}
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
            <p className="font-semibold text-slate-900">No redesign leads yet</p>
            <p className="text-sm text-slate-600 mt-1">They appear here after an agent run audits businesses that already have a website.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows.map((l) => {
              const b = l.business;
              const a = l.audit;
              return (
                <li key={b.id} className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className={`w-14 h-14 rounded-xl grid place-items-center shrink-0 ${scoreStyle(a.design_score)}`} title="Design score out of 10">
                      <span className="text-xl font-bold tabular-nums">{a.design_score}</span>
                    </div>
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-bold text-slate-900">{b.name}</h2>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ring-1 ring-inset ${PITCH_STYLE[a.pitch]}`}>{a.pitch}</span>
                      </div>
                      <p className="text-[15px] font-semibold text-emerald-800 mt-0.5">{b.internationalPhoneNumber || b.nationalPhoneNumber || 'No phone'}</p>
                      <p className="text-sm text-slate-500">
                        {b.formattedAddress} · {b.rating ? `${b.rating.toFixed(1)} ★` : 'no rating'} · {b.userRatingCount || 0} reviews · found by {l.foundBy}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => setOpen(b.id)} className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer">
                        <FileText className="w-4 h-4" aria-hidden /> Full report
                      </button>
                      {b.websiteURI && (
                        <a href={b.websiteURI} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50">
                          <Globe className="w-4 h-4" aria-hidden /> {host(b.websiteURI)}
                        </a>
                      )}
                      <Link href={`/?focus=${encodeURIComponent(b.id)}`} className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50">
                        <MapPin className="w-4 h-4" aria-hidden /> Map
                      </Link>
                      {b.googleMapsURI && (
                        <a href={b.googleMapsURI} target="_blank" rel="noopener noreferrer" aria-label="Open in Google Maps" className="inline-flex items-center gap-1.5 min-h-[40px] px-3 rounded-lg text-sm font-medium border border-slate-300 hover:bg-slate-50">
                          <ExternalLink className="w-4 h-4" aria-hidden /> Google
                        </a>
                      )}
                      {confirmRemove === b.id ? (
                        <span className="inline-flex items-center gap-1">
                          <button onClick={() => setConfirmRemove(null)} className="min-h-[40px] px-3 rounded-lg text-sm border border-slate-300 cursor-pointer">Cancel</button>
                          <button onClick={() => { removeRedesignLead(b.id); setConfirmRemove(null); }} className="min-h-[40px] px-3 rounded-lg text-sm font-semibold text-rose-700 border border-rose-200 hover:bg-rose-50 cursor-pointer">Remove</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmRemove(b.id)} aria-label={`Remove ${b.name}`} title="Remove" className="w-10 h-10 grid place-items-center rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer">
                          <Trash2 className="w-4 h-4" aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top problems</p>
                      <ol className="list-decimal ml-5 mt-1 space-y-0.5 text-[15px] text-slate-800">
                        {a.problems.map((p) => <li key={p}>{p}</li>)}
                      </ol>
                    </div>
                    <div className="space-y-2 text-[15px]">
                      <p><span className="text-xs font-semibold uppercase tracking-wide text-slate-500 mr-2">Say</span><strong className="text-slate-900">{a.say}</strong></p>
                      <p><span className="text-xs font-semibold uppercase tracking-wide text-slate-500 mr-2">Ask</span><span className="text-indigo-900">{a.ask}</span></p>
                      <p><span className="text-xs font-semibold uppercase tracking-wide text-slate-500 mr-2">Offer</span><strong className="text-emerald-800">{a.offer}</strong></p>
                    </div>
                  </div>

                  <label className="block mt-3">
                    <span className="sr-only">Notes for {b.name}</span>
                    <input
                      key={`${b.id}:${l.notes}`}
                      defaultValue={l.notes}
                      onBlur={(e) => e.target.value !== l.notes && setRedesignNotes(b.id, e.target.value)}
                      placeholder="Notes (saved when you click away)"
                      className="w-full text-sm border border-slate-200 rounded-lg px-3 min-h-[38px] outline-none focus:border-blue-500"
                    />
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {lead && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label={`Audit report for ${lead.business.name}`}>
          <button className="absolute inset-0 bg-slate-900/40 cursor-default" aria-label="Close report" onClick={() => { setOpen(null); window.history.replaceState(null, '', '/redesign'); }} />
          <div className="relative w-full max-w-2xl h-full overflow-y-auto bg-white shadow-2xl p-6">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl grid place-items-center shrink-0 ${scoreStyle(lead.audit.design_score)}`}>
                <span className="text-lg font-bold">{lead.audit.design_score}</span>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">{lead.business.name}</h2>
                <p className="text-sm text-slate-500">
                  Audited {new Date(lead.audit.audited_at).toLocaleDateString()} by {lead.audit.audited_by} · {host(lead.business.websiteURI)}
                </p>
              </div>
              <button onClick={() => { setOpen(null); window.history.replaceState(null, '', '/redesign'); }} aria-label="Close report" className="w-10 h-10 grid place-items-center rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-2">
              <Report md={lead.audit.report || 'No report text.'} />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
