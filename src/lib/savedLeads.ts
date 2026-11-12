import { persist } from '@/lib/cloudSync';
import { BusinessPlace } from '@/types/business';

// Full copies of the businesses you starred, so your list survives reloads, Clear and new
// searches. The star itself still lives in selection.ts (pindrop_selected_ids); this store
// is the data behind it, keyed by the same place id.

export interface LeadChange {
  field: string;
  from: string;
  to: string;
  at: number;
}

export interface SavedLead {
  business: BusinessPlace;
  savedAt: number;
  checkedAt: number; // last time Google's data was compared with this copy
  notes: string;
  changes: LeadChange[]; // newest first, capped
}

const KEY = 'pindrop_saved_leads';
export const SAVED_LEADS_CHANGED_EVENT = 'pindrop_saved_leads_changed';
export const RECHECK_AFTER_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_CHANGES = 20;

// Fields worth telling you about when they change. Label = what the sheet shows.
const WATCHED: [string, (b: BusinessPlace) => string][] = [
  ['Name', (b) => b.name || ''],
  ['Phone', (b) => b.nationalPhoneNumber || ''],
  ['Website', (b) => b.websiteURI || ''],
  ['Address', (b) => b.formattedAddress || ''],
  ['Status', (b) => b.businessStatus || ''],
  ['Category', (b) => b.primaryTypeDisplayName || ''],
  ['Rating', (b) => (b.rating ? b.rating.toFixed(1) : '')],
  ['Reviews', (b) => String(b.userRatingCount || 0)],
  ['Hours', (b) => (b.regularOpeningHours?.weekdayDescriptions || []).join(' | ')],
];

/** Photos and reviews are big and expire, so they are not kept. */
function slim(b: BusinessPlace): BusinessPlace {
  const { photos, reviews, distanceMeters, ...rest } = b;
  void photos; void reviews; void distanceMeters;
  return rest;
}

export function diffBusiness(oldB: BusinessPlace, newB: BusinessPlace, at: number): LeadChange[] {
  return WATCHED.flatMap(([field, get]) => {
    const from = get(oldB);
    const to = get(newB);
    return from === to ? [] : [{ field, from, to, at }];
  });
}

export function getAllSavedLeads(): Record<string, SavedLead> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(all: Record<string, SavedLead>) {
  try {
    persist(KEY, all);
    window.dispatchEvent(new CustomEvent(SAVED_LEADS_CHANGED_EVENT));
  } catch (e) {
    console.warn('Failed to store saved leads:', e);
  }
}

export function saveLead(b: BusinessPlace): void {
  const all = getAllSavedLeads();
  const now = Date.now();
  const prev = all[b.id];
  all[b.id] = {
    business: slim(b),
    savedAt: prev?.savedAt ?? now,
    checkedAt: now,
    notes: prev?.notes ?? '',
    changes: prev?.changes ?? [],
  };
  write(all);
}

export function removeSavedLead(id: string): void {
  const all = getAllSavedLeads();
  if (!all[id]) return;
  delete all[id];
  write(all);
}

export function setLeadNotes(id: string, notes: string): void {
  const all = getAllSavedLeads();
  if (!all[id]) return;
  all[id].notes = notes;
  write(all);
}

/**
 * Compare fresh Google data with saved copies and record what changed. Only ids that are
 * starred are touched. Free when the data came from a search we already paid for.
 * Returns how many saved leads were updated.
 */
export function refreshSavedLeads(
  fresh: BusinessPlace[],
  selectedIds: Record<string, true>,
  force = false // manual recheck: always stamp checkedAt
): number {
  const all = getAllSavedLeads();
  const now = Date.now();
  let touched = 0;
  for (const b of fresh) {
    if (!selectedIds[b.id]) continue;
    const prev = all[b.id];
    if (!prev) {
      // Starred before full copies were kept (or restored from a backup): fill it in now.
      all[b.id] = { business: slim(b), savedAt: now, checkedAt: now, notes: '', changes: [] };
      touched++;
      continue;
    }
    const changes = diffBusiness(prev.business, b, now);
    // Skip the database write when nothing changed and the copy was checked recently.
    if (!force && !changes.length && now - prev.checkedAt < 24 * 60 * 60 * 1000) continue;
    all[b.id] = {
      ...prev,
      business: slim(b),
      checkedAt: now,
      changes: [...changes, ...prev.changes].slice(0, MAX_CHANGES),
    };
    touched++;
  }
  if (touched) write(all);
  return touched;
}

/** Saved leads that are past the recheck window. */
export function isStale(lead: SavedLead, now = Date.now()): boolean {
  return now - lead.checkedAt > RECHECK_AFTER_MS;
}

/** Fresh Place Details for one saved lead, via our server route. Null when the call failed. */
export async function fetchPlaceDetails(id: string): Promise<BusinessPlace | null> {
  try {
    const res = await fetch(`/api/places/details?id=${encodeURIComponent(id)}`, {
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
