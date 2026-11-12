'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Download, ExternalLink, Loader2, MapPin, RefreshCw, Search, Trash2 } from 'lucide-react';
import { LeadStatus } from '@/types/business';
import { loadFromCloud } from '@/lib/cloudSync';
import { getAllSelectedIds, unselect, SELECTION_CHANGED_EVENT } from '@/lib/selection';
import {
  SavedLead,
  getAllSavedLeads,
  setLeadNotes,
  refreshSavedLeads,
  fetchPlaceDetails,
  isStale,
  SAVED_LEADS_CHANGED_EVENT,
} from '@/lib/savedLeads';
import { getAllLeadStatuses, setLeadStatus } from '@/lib/pindropUtils';
import { scoreLead } from '@/lib/leadScore';
import { getAllXrays } from '@/lib/xray';
import { getAllReviewIntel } from '@/lib/reviewIntel';

const STATUS_LABEL: Record<LeadStatus, string> = { none: 'New', talking: 'Talking', client: 'Client', nogo: 'No-go' };
const STATUS_STYLE: Record<LeadStatus, string> = {
  none: 'bg-white text-slate-700',
  talking: 'bg-sky-50 text-sky-800',
  client: 'bg-emerald-50 text-emerald-800',
  nogo: 'bg-rose-50 text-rose-800',
};
const DAY = 86_400_000;

interface Row {
  id: string;
  lead: SavedLead | null; // null = starred before full copies were kept; fills in on recheck
  name: string;
  category: string;
  phone: string;
  website: string;
  address: string;
  rating: number | null;
  reviews: number;
  score: number | null;
  status: LeadStatus;
  notes: string;
  savedAt: number;
  checkedAt: number;
}

type SortKey = 'name' | 'category' | 'rating' | 'reviews' | 'score' | 'status' | 'savedAt' | 'checkedAt';

function ago(t: number): string {
  if (!t) return '—';
  const d = Math.floor((Date.now() - t) / DAY);
  if (d <= 0) return 'today';
  if (d === 1) return '1 day ago';
  if (d < 30) return `${d} days ago`;
  return new Date(t).toLocaleDateString();
}

function csvCell(v: string | number | null): string {
  return `"${String(v ?? '').replace(/"/g, '""')}"`;
}

export default function SheetPage() {
  const [selected, setSelected] = useState<Record<string, true>>({});
  const [saved, setSaved] = useState<Record<string, SavedLead>>({});
  const [statuses, setStatuses] = useState<Record<string, LeadStatus>>({});
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LeadStatus | 'all'>('all');
  const [changedOnly, setChangedOnly] = useState(false);
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'savedAt', dir: -1 });
  const [checking, setChecking] = useState<Record<string, true>>({});
  const [failed, setFailed] = useState<Record<string, true>>({});

  useEffect(() => {
    const sync = () => {
      setSelected(getAllSelectedIds());
      setSaved(getAllSavedLeads());
      setStatuses(getAllLeadStatuses());
    };
    sync();
    loadFromCloud(); // fires 'storage' when Turso's copy lands
    const events = [SELECTION_CHANGED_EVENT, SAVED_LEADS_CHANGED_EVENT, 'pindrop_lead_status_changed', 'storage'];
    events.forEach((e) => window.addEventListener(e, sync));
    return () => events.forEach((e) => window.removeEventListener(e, sync));
  }, []);

  const rows: Row[] = useMemo(() => {
    const xrays = getAllXrays();
    const intel = getAllReviewIntel();
    return Object.keys(selected).map((id) => {
      const lead = saved[id] ?? null;
      const b = lead?.business;
      return {
        id,
        lead,
        name: b?.name ?? '(waiting for data)',
        category: b?.primaryTypeDisplayName ?? '',
        phone: b?.nationalPhoneNumber ?? '',
        website: b?.websiteURI ?? '',
        address: b?.formattedAddress ?? '',
        rating: b?.rating ?? null,
        reviews: b?.userRatingCount ?? 0,
        score: b ? scoreLead(b, xrays[id], intel[id]).score : null,
        status: statuses[id] || 'none',
        notes: lead?.notes ?? '',
        savedAt: lead?.savedAt ?? 0,
        checkedAt: lead?.checkedAt ?? 0,
      };
    });
  }, [selected, saved, statuses]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const now = Date.now();
    return rows
      .filter((r) => statusFilter === 'all' || r.status === statusFilter)
      .filter((r) => !changedOnly || r.lead?.changes.some((c) => now - c.at < 7 * DAY))
      .filter(
        (r) =>
          !q ||
          [r.name, r.category, r.phone, r.address, r.website, r.notes].some((v) => v.toLowerCase().includes(q))
      )
      .sort((a, b) => {
        const x = a[sort.key] ?? -1;
        const y = b[sort.key] ?? -1;
        return (x < y ? -1 : x > y ? 1 : 0) * sort.dir;
      });
  }, [rows, query, statusFilter, changedOnly, sort]);

  const recheck = async (id: string) => {
    setChecking((p) => ({ ...p, [id]: true }));
    const fresh = await fetchPlaceDetails(id);
    if (fresh) refreshSavedLeads([fresh], getAllSelectedIds(), true);
    setFailed((p) => {
      const n = { ...p };
      if (fresh) delete n[id];
      else n[id] = true;
      return n;
    });
    setChecking((p) => {
      const n = { ...p };
      delete n[id];
      return n;
    });
  };

  const remove = (r: Row) => {
    if (window.confirm(`Remove "${r.name}" from your saved leads? Its notes go too.`)) unselect(r.id);
  };

  const exportCsv = () => {
    const head = ['Name', 'Category', 'Phone', 'Website', 'Address', 'Rating', 'Reviews', 'Lead Score', 'Status', 'Notes', 'Saved', 'Last checked', 'Latest change', 'Google Maps'];
    const lines = visible.map((r) =>
      [
        r.name, r.category, r.phone, r.website, r.address, r.rating, r.reviews, r.score,
        STATUS_LABEL[r.status], r.notes,
        r.savedAt ? new Date(r.savedAt).toISOString().slice(0, 10) : '',
        r.checkedAt ? new Date(r.checkedAt).toISOString().slice(0, 10) : '',
        r.lead?.changes[0] ? `${r.lead.changes[0].field}: ${r.lead.changes[0].from} -> ${r.lead.changes[0].to}` : '',
        r.lead?.business.googleMapsURI ?? '',
      ].map(csvCell).join(',')
    );
    const blob = new Blob([[head.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `mapcrack_saved_leads_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const COLS: { label: string; key?: SortKey; w: string }[] = [
    { label: 'Name', key: 'name', w: 'min-w-[220px]' },
    { label: 'Category', key: 'category', w: 'min-w-[130px]' },
    { label: 'Phone', w: 'min-w-[140px]' },
    { label: 'Website', w: 'min-w-[170px]' },
    { label: 'Address', w: 'min-w-[240px]' },
    { label: 'Rating', key: 'rating', w: 'min-w-[70px]' },
    { label: 'Reviews', key: 'reviews', w: 'min-w-[75px]' },
    { label: 'Score', key: 'score', w: 'min-w-[65px]' },
    { label: 'Status', key: 'status', w: 'min-w-[110px]' },
    { label: 'Notes', w: 'min-w-[240px]' },
    { label: 'Saved', key: 'savedAt', w: 'min-w-[95px]' },
    { label: 'Last checked', key: 'checkedAt', w: 'min-w-[120px]' },
    { label: 'What changed', w: 'min-w-[260px]' },
    { label: 'Actions', w: 'min-w-[150px]' },
  ];
  const letter = (i: number) => String.fromCharCode(65 + i);
  const cell = 'border-r border-b border-slate-200 px-2 py-1.5 align-top';

  return (
    <main className="min-h-screen bg-white text-slate-800 flex flex-col">
      {/* Toolbar */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
          <Link href="/" className="flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-emerald-700">
            <ArrowLeft className="w-4 h-4" /> Map
          </Link>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <div className="w-7 h-7 rounded bg-emerald-600 text-white grid place-items-center text-xs font-black">MC</div>
          <div className="mr-auto">
            <h1 className="text-sm font-bold leading-tight">Saved leads</h1>
            <p className="text-[11px] text-slate-500 leading-tight">
              {rows.length} saved • synced to your database • rechecked when you view their area after 7 days
            </p>
          </div>
          <label className="flex items-center gap-1.5 border border-slate-300 rounded-md px-2 py-1 focus-within:border-emerald-500">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone, notes…"
              className="text-xs outline-none w-48 bg-transparent"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as LeadStatus | 'all')}
            className="text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white"
          >
            <option value="all">All statuses</option>
            {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none">
            <input type="checkbox" checked={changedOnly} onChange={(e) => setChangedOnly(e.target.checked)} />
            Changed this week
          </label>
          <button
            onClick={exportCsv}
            disabled={!visible.length}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </header>

      {rows.length === 0 ? (
        <div className="flex-1 grid place-items-center text-center p-8">
          <div>
            <p className="font-semibold">No saved leads yet</p>
            <p className="text-sm text-slate-500 mt-1">
              On the map, hover a pin and press <b>Select</b>. It lands here with all its details.
            </p>
            <Link href="/" className="inline-block mt-4 text-sm font-semibold text-emerald-700 hover:underline">
              Back to the map
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-auto">
          <table className="border-separate border-spacing-0 text-xs">
            <thead className="sticky top-0 z-20">
              {/* Column letters, like a spreadsheet */}
              <tr className="bg-slate-100 text-slate-500 text-[10px]">
                <th className="sticky left-0 z-30 bg-slate-100 border-r border-b border-slate-300 w-10 min-w-[2.5rem]" />
                {COLS.map((c, i) => (
                  <th
                    key={c.label}
                    className={`border-r border-b border-slate-300 font-medium py-0.5 ${i === 0 ? 'sticky left-10 z-30 bg-slate-100' : ''}`}
                  >
                    {letter(i)}
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50">
                <th className="sticky left-0 z-30 bg-slate-100 border-r border-b border-slate-300 w-10 min-w-[2.5rem] text-[10px] text-slate-500 font-medium">
                  1
                </th>
                {COLS.map((c, i) => (
                  <th
                    key={c.label}
                    onClick={() =>
                      c.key && setSort((s) => ({ key: c.key!, dir: s.key === c.key ? ((s.dir * -1) as 1 | -1) : 1 }))
                    }
                    className={`${cell} ${c.w} text-left font-bold text-slate-700 bg-slate-50 whitespace-nowrap ${
                      c.key ? 'cursor-pointer hover:bg-slate-100' : ''
                    } ${i === 0 ? 'sticky left-10 z-30' : ''}`}
                  >
                    {c.label}
                    {sort.key === c.key && <span className="ml-1 text-emerald-600">{sort.dir === 1 ? '▲' : '▼'}</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((r, idx) => {
                const recent = r.lead?.changes.filter((c) => Date.now() - c.at < 30 * DAY) ?? [];
                const fresh = recent.some((c) => Date.now() - c.at < 7 * DAY);
                const rowBg = fresh ? 'bg-amber-50' : 'bg-white';
                const b = r.lead?.business;
                const closed = b?.businessStatus && b.businessStatus !== 'OPERATIONAL';
                return (
                  <tr key={r.id} className={`${rowBg} hover:bg-emerald-50/60`}>
                    <td className="sticky left-0 z-10 bg-slate-100 border-r border-b border-slate-300 w-10 min-w-[2.5rem] text-center text-[10px] text-slate-500">
                      {idx + 2}
                    </td>
                    <td className={`${cell} sticky left-10 z-10 ${rowBg} font-semibold`}>
                      <span className="text-amber-500 mr-1">★</span>
                      {r.name}
                      {closed && (
                        <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-bold">
                          {b!.businessStatus!.replace(/_/g, ' ').toLowerCase()}
                        </span>
                      )}
                    </td>
                    <td className={cell}>{r.category}</td>
                    <td className={`${cell} font-mono`}>
                      {r.phone ? <a href={`tel:${b?.internationalPhoneNumber || r.phone}`} className="text-emerald-700 hover:underline">{r.phone}</a> : <span className="text-slate-400">—</span>}
                    </td>
                    <td className={`${cell} max-w-[220px] truncate`}>
                      {r.website ? (
                        <a href={r.website} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline" title={r.website}>
                          {r.website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                        </a>
                      ) : b ? (
                        <span className="text-rose-600 font-semibold">No website</span>
                      ) : null}
                    </td>
                    <td className={cell}>{r.address}</td>
                    <td className={`${cell} text-right`}>{r.rating ? r.rating.toFixed(1) : '—'}</td>
                    <td className={`${cell} text-right`}>{b ? r.reviews : '—'}</td>
                    <td className={`${cell} text-right font-bold ${r.score !== null && r.score >= 70 ? 'text-orange-600' : ''}`}>
                      {r.score ?? '—'}
                    </td>
                    <td className={`${cell} p-0`}>
                      <select
                        value={r.status}
                        onChange={(e) => setLeadStatus(r.id, e.target.value as LeadStatus)}
                        className={`w-full h-full px-2 py-1.5 text-xs font-semibold outline-none cursor-pointer ${STATUS_STYLE[r.status]}`}
                      >
                        {(Object.keys(STATUS_LABEL) as LeadStatus[]).map((s) => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className={`${cell} p-0`}>
                      {r.lead ? (
                        <input
                          // Re-mount when the stored note changes elsewhere (another tab/device).
                          key={`${r.id}:${r.notes}`}
                          defaultValue={r.notes}
                          onBlur={(e) => e.target.value !== r.notes && setLeadNotes(r.id, e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
                          placeholder="Add a note…"
                          className="w-full px-2 py-1.5 text-xs outline-none bg-transparent focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:ring-inset"
                        />
                      ) : null}
                    </td>
                    <td className={`${cell} whitespace-nowrap text-slate-500`}>{ago(r.savedAt)}</td>
                    <td className={`${cell} whitespace-nowrap`}>
                      <span className={r.lead && isStale(r.lead) ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                        {r.lead ? ago(r.checkedAt) : 'never'}
                      </span>
                      {r.lead && isStale(r.lead) && <span className="ml-1 text-[9px] text-amber-700">(due)</span>}
                      {failed[r.id] && <div className="text-[10px] text-rose-600">Check failed</div>}
                    </td>
                    <td className={cell} title={recent.map((c) => `${c.field}: ${c.from || '—'} → ${c.to || '—'}`).join('\n')}>
                      {recent.length ? (
                        <div className="space-y-0.5">
                          {recent.slice(0, 2).map((c, i) => (
                            <div key={i} className="leading-snug">
                              <b>{c.field}</b>: <span className="line-through text-slate-400">{c.from || '—'}</span>{' '}
                              → <span className="text-slate-800">{c.to || '—'}</span>
                            </div>
                          ))}
                          {recent.length > 2 && <div className="text-slate-500">+{recent.length - 2} more</div>}
                        </div>
                      ) : (
                        <span className="text-slate-400">No changes</span>
                      )}
                    </td>
                    <td className={`${cell} whitespace-nowrap`}>
                      <div className="flex items-center gap-1">
                        {b && (
                          <Link href={`/?focus=${encodeURIComponent(r.id)}`} title="Show on the map" className="p-1 rounded hover:bg-emerald-100 text-emerald-700">
                            <MapPin className="w-3.5 h-3.5" />
                          </Link>
                        )}
                        {b?.googleMapsURI && (
                          <a href={b.googleMapsURI} target="_blank" rel="noreferrer" title="Open Google Maps profile" className="p-1 rounded hover:bg-sky-100 text-sky-700">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          onClick={() => recheck(r.id)}
                          disabled={!!checking[r.id]}
                          title="Recheck Google now"
                          className="p-1 rounded hover:bg-slate-100 text-slate-600 disabled:opacity-50"
                        >
                          {checking[r.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                        </button>
                        <button onClick={() => remove(r)} title="Remove from saved leads" className="p-1 rounded hover:bg-rose-100 text-rose-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {visible.length === 0 && <p className="p-6 text-sm text-slate-500">No saved leads match these filters.</p>}
        </div>
      )}
    </main>
  );
}
