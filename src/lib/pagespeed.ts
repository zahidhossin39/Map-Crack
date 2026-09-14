const SPEED_KEY = 'pindrop_speed_scores';

export const SPEED_CHANGED_EVENT = 'pindrop_speed_changed';

function readScores(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(SPEED_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getAllSpeedScores(): Record<string, number> {
  return readScores();
}

export function setSpeedScore(id: string, score: number): void {
  if (typeof window === 'undefined') return;
  const current = readScores();
  current[id] = score;
  try {
    localStorage.setItem(SPEED_KEY, JSON.stringify(current));
    window.dispatchEvent(new CustomEvent(SPEED_CHANGED_EVENT, { detail: { id, score } }));
  } catch (e) {
    console.warn('Failed to store speed score:', e);
  }
}

/**
 * One mobile PageSpeed check. Returns the performance score 0-100, or null on any
 * failure (bad key, unreachable site, rate limit) — the caller treats null as "unknown".
 */
export async function fetchPageSpeedMobile(url: string, apiKey: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&category=performance&key=${apiKey}`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const score = data?.lighthouseResult?.categories?.performance?.score;
    if (typeof score !== 'number' || isNaN(score)) return null;
    return Math.round(score * 100);
  } catch {
    return null;
  }
}
