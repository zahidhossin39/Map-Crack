// Mirrors the app's localStorage stores into Turso so marks survive a cleared browser and
// show up on other devices. localStorage stays the fast local copy; Turso is the backup.
// shortcut: whole-store, last-write-wins. Fine for one user; two devices editing at the
// same moment can overwrite each other. Upgrade to per-row writes if that ever happens.

export const SYNCED_KEYS = [
  'pindrop_selected_ids',
  'pindrop_lead_statuses',
  'pindrop_xrays',
  'pindrop_review_intel',
  'pindrop_speed_scores',
];

const timers: Record<string, ReturnType<typeof setTimeout>> = {};

/** Write to localStorage now and to Turso shortly after (bursts of clicks become one write). */
export function persist(key: string, data: unknown): void {
  const value = JSON.stringify(data);
  localStorage.setItem(key, value);
  clearTimeout(timers[key]);
  timers[key] = setTimeout(() => {
    fetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
      keepalive: true, // still sends if the tab closes right after a click
    }).catch((e) => console.warn('Cloud save failed, kept locally:', e));
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
      } else {
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
