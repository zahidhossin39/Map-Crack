import { LeadStatus } from '@/types/business';

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

export function isSelected(id: string): boolean {
  return readSet()[id] === true;
}

/** Returns the new selected state so callers can update optimistically. */
export function toggleSelected(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const current = readSet();
  const next = !current[id];

  if (next) current[id] = true;
  else delete current[id];

  try {
    localStorage.setItem(SELECTION_KEY, JSON.stringify(current));
    window.dispatchEvent(
      new CustomEvent(SELECTION_CHANGED_EVENT, { detail: { id, selected: next } })
    );
  } catch (e) {
    console.warn('Failed to update selection:', e);
  }
  return next;
}

export function clearSelection(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SELECTION_KEY, JSON.stringify({}));
  window.dispatchEvent(new CustomEvent(SELECTION_CHANGED_EVENT, { detail: {} }));
}

interface MarksBackup {
  version: 1;
  exportedAt: string;
  selected: string[];
  statuses: Record<string, LeadStatus>;
}

/**
 * Marks live only in this browser's localStorage, so they vanish with cleared site data.
 * Backup/restore is the whole safety net — there is no server copy.
 */
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
  if (!Array.isArray(parsed.selected) || typeof parsed.statuses !== 'object') {
    throw new Error('Backup file is missing its selected list or statuses.');
  }

  const selection = readSet();
  for (const id of parsed.selected) {
    if (typeof id === 'string') selection[id] = true;
  }
  localStorage.setItem(SELECTION_KEY, JSON.stringify(selection));

  let statuses: Record<string, LeadStatus> = {};
  try {
    const raw = localStorage.getItem(STATUS_KEY);
    if (raw) statuses = JSON.parse(raw);
  } catch {
    statuses = {};
  }
  const incoming = parsed.statuses as Record<string, LeadStatus>;
  for (const [id, status] of Object.entries(incoming)) {
    statuses[id] = status;
  }
  localStorage.setItem(STATUS_KEY, JSON.stringify(statuses));

  window.dispatchEvent(new CustomEvent(SELECTION_CHANGED_EVENT, { detail: {} }));
  window.dispatchEvent(new CustomEvent('pindrop_lead_status_changed', { detail: {} }));

  return { selected: parsed.selected.length, statuses: Object.keys(incoming).length };
}
