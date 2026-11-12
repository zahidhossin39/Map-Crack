import { persist } from '@/lib/cloudSync';
import { BusinessPlace, LeadStatus } from '@/types/business';
import { saveLead, removeSavedLead } from '@/lib/savedLeads';

const SELECTION_KEY = 'pindrop_selected_ids';
const STATUS_KEY = 'pindrop_lead_statuses';

export const SELECTION_CHANGED_EVENT = 'pindrop_selection_changed';

function readSet(): Record<string, true> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SELECTION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getAllSelectedIds(): Record<string, true> {
  return readSet();
}

/**
 * Stars or un-stars a business. Starring also keeps a full copy of it (savedLeads.ts) so it
 * stays on the map and in the sheet after a reload. Returns the new selected state.
 */
export function toggleSelected(business: BusinessPlace): boolean {
  if (typeof window === 'undefined') return false;
  const id = business.id;
  const current = readSet();
  const next = !current[id];
  if (next) saveLead(business);
  else removeSavedLead(id);

  if (next) current[id] = true;
  else delete current[id];

  try {
    persist(SELECTION_KEY, current);
    window.dispatchEvent(
      new CustomEvent(SELECTION_CHANGED_EVENT, { detail: { id, selected: next } })
    );
  } catch (e) {
    console.warn('Failed to update selection:', e);
  }
  return next;
}

/** Un-stars by id, for places that only have the id (the sheet's Remove button). */
export function unselect(id: string): void {
  const current = readSet();
  delete current[id];
  removeSavedLead(id);
  persist(SELECTION_KEY, current);
  window.dispatchEvent(new CustomEvent(SELECTION_CHANGED_EVENT, { detail: { id, selected: false } }));
}

export function clearSelection(): void {
  if (typeof window === 'undefined') return;
  persist(SELECTION_KEY, {});
  window.dispatchEvent(new CustomEvent(SELECTION_CHANGED_EVENT, { detail: {} }));
}

interface MarksBackup {
  version: 1;
  exportedAt: string;
  selected: string[];
  statuses: Record<string, LeadStatus>;
}

/** JSON backup of stars and statuses. Turso is the main copy; this is a manual extra. */
export function exportMarks(): void {
  if (typeof window === 'undefined') return;

  let statuses: Record<string, LeadStatus> = {};
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    if (raw) statuses = JSON.parse(raw);
  } catch {
    statuses = {};
  }

  const backup: MarksBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    selected: Object.keys(readSet()),
    statuses,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mapcrack-marks-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface RestoreResult {
  selected: number;
  statuses: number;
}

/** Merges a backup into what is already stored rather than replacing it. */
export function importMarks(fileText: string): RestoreResult {
  const parsed = JSON.parse(fileText) as Partial<MarksBackup>;
  if (!parsed || typeof parsed !== 'object') throw new Error('Not a backup file.');
  if (!Array.isArray(parsed.selected) || !parsed.statuses || typeof parsed.statuses !== 'object') {
    throw new Error('Backup file is missing its selected list or statuses.');
  }
  // Validate everything before writing anything, so a bad file can't half-restore.
  const VALID: LeadStatus[] = ['none', 'talking', 'client', 'nogo'];
  const incoming = Object.entries(parsed.statuses).filter(
    (e): e is [string, LeadStatus] => VALID.includes(e[1] as LeadStatus)
  );

  const selection = readSet();
  for (const id of parsed.selected) {
    if (typeof id === 'string') selection[id] = true;
  }
  persist(SELECTION_KEY, selection);

  let statuses: Record<string, LeadStatus> = {};
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    if (raw) statuses = JSON.parse(raw);
  } catch {
    statuses = {};
  }
  for (const [id, status] of incoming) {
    if (status === 'none') delete statuses[id];
    else statuses[id] = status;
  }
  persist(STATUS_KEY, statuses);

  window.dispatchEvent(new CustomEvent(SELECTION_CHANGED_EVENT, { detail: {} }));
  window.dispatchEvent(new CustomEvent('pindrop_lead_status_changed', { detail: {} }));

  return { selected: parsed.selected.length, statuses: incoming.length };
}
