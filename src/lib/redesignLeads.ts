import { persist } from '@/lib/cloudSync';
import type { BusinessPlace } from '@/types/business';

// Businesses that HAVE a website, audited by an agent and worth pitching a redesign or
// automation. Written by the agent's save_site_audit tool; shown on /redesign and as blue pins.

export interface SiteAudit {
  design_score: number;
  problems: string[];
  pitch: 'Redesign' | 'Automation' | 'Both';
  say: string;
  ask: string;
  offer: string;
  report: string;
  checks: Record<string, unknown> | null;
  audited_at: number;
  audited_by: string;
}

export interface RedesignLead {
  business: BusinessPlace;
  audit: SiteAudit;
  foundBy: string;
  savedAt: number;
  notes: string;
}

const KEY = 'pindrop_redesign_leads';
export const REDESIGN_CHANGED_EVENT = 'pindrop_redesign_changed';

export function getAllRedesignLeads(): Record<string, RedesignLead> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

function write(all: Record<string, RedesignLead>) {
  persist(KEY, all);
  window.dispatchEvent(new CustomEvent(REDESIGN_CHANGED_EVENT));
}

export function removeRedesignLead(id: string): void {
  const all = getAllRedesignLeads();
  delete all[id];
  write(all);
}

export function setRedesignNotes(id: string, notes: string): void {
  const all = getAllRedesignLeads();
  if (!all[id]) return;
  all[id].notes = notes;
  write(all);
}
