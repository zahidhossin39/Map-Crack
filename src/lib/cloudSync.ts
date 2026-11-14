// Mirrors the app's localStorage stores into Turso so marks survive a cleared browser and
// show up on other devices and for teammates. localStorage stays the fast local copy.
// Every store is an object keyed by place id. Only the entries that changed are sent, and
// the server merges them, so two people starring at the same time never wipe each other.

export const SYNCED_KEYS = [
  'pindrop_selected_ids',
  'pindrop_lead_statuses',
  'pindrop_xrays',
  'pindrop_review_intel',
  'pindrop_speed_scores',
  'pindrop_saved_leads',
];

type Store = Record<string, unknown>;

const timers: Record<string, ReturnType<typeof setTimeout>> = {};
// What Turso had the last time we talked to it, per store. Changes are diffed against this.
const lastSynced: Record<string, Store> = {};

function diff(before: Store, after: Store): { set: Store; del: string[] } {
  const set: Store = {};
  for (const [id, v] of Object.entries(after)) {
    if (JSON.stringify(before[id]) !== JSON.stringify(v)) set[id] = v;
  }
  const del = Object.keys(before).filter((id) => !(id in after));
  return { set, del };
}

async function send(key: string): Promise<void> {
  let local: Store = {};
  try {
    local = JSON.parse(localStorage.getItem(key) || '{}');
  } catch {
    return;
  }
  const { set, del } = diff(lastSynced[key] || {}, local);
  if (!Object.keys(set).length && !del.length) return;

  const res = await fetch('/api/store', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, set, del }),
    keepalive: true, // still sends if the tab closes right after a click
  });
  if (!res.ok) throw new Error(`store write ${res.status}`);
  const { value } = await res.json();
  lastSynced[key] = value;
  // Take in teammates' changes too, unless more local edits are already queued.
  if (!timers[key]) {
    const merged = JSON.stringify(value);
    if (merged !== localStorage.getItem(key)) {
      localStorage.setItem(key, merged);
      window.dispatchEvent(new StorageEvent('storage'));
    }
  }
}

/** Write to localStorage now and to Turso shortly after (bursts of clicks become one write). */
export function persist(key: string, data: unknown): void {
  localStorage.setItem(key, JSON.stringify(data));
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => {
    delete timers[key];
    send(key).catch((e) => console.warn('Cloud save failed, kept locally:', e));
  }, 800);
}

/**
 * On startup: take Turso's copy of each store. A store Turso doesn't have yet is uploaded
 * from this browser, so the first run moves existing marks into the database.
 * Returns false when Turso is not set up, so the app just keeps using localStorage.
 */
export async function loadFromCloud(): Promise<boolean> {
  try {
    const res = await fetch('/api/store');
    if (!res.ok) return false;
    const remote: Record<string, string> = await res.json();
    for (const key of SYNCED_KEYS) {
      if (remote[key] !== undefined) {
        localStorage.setItem(key, remote[key]);
        try {
          lastSynced[key] = JSON.parse(remote[key]);
        } catch {
          lastSynced[key] = {};
        }
      } else {
        lastSynced[key] = {};
        const local = localStorage.getItem(key);
        if (local) persist(key, JSON.parse(local));
      }
    }
    // Every store listener already re-reads on 'storage', so one event refreshes the whole UI.
    window.dispatchEvent(new StorageEvent('storage'));
    return true;
  } catch {
    return false;
  }
}
