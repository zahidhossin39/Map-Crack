// Review mining: what customers complain about in a lead's Google reviews.
// Google only returns up to 5 reviews per place, so a hit is strong evidence and a miss proves nothing.

export interface ReviewIntel {
  sampled: number;
  phoneComplaints: string[]; // short quotes
  siteComplaints: string[];
  lastReviewDays: number | null;
}

const PHONE =
  /(?:couldn'?t|could not|can'?t|cannot|unable to|hard to|impossible to|never)\s+(?:get through|reach|get (?:a )?hold of|contact|speak to|talk to|get anyone)|(?:no\s*one|nobody|never)\s+(?:answers?|answered|picks? up|picked up|called (?:me )?back|returned? (?:my )?calls?)|(?:didn'?t|did not|doesn'?t|does not|won'?t|wouldn'?t)\s+(?:answer|pick up|call (?:me )?back|return (?:my )?calls?)|straight to voicemail|voicemail (?:is |was )?full|left (?:a |several |multiple )?(?:voice)?(?:messages?|voicemails?)|rang (?:and rang|out)|busy signal/i;
const SITE =
  /(?:website|site|web page|online booking|booking (?:system|page)|link)\s+(?:is |was )?(?:down|broken|not working|didn'?t work|doesn'?t work|wouldn'?t load|outdated)|couldn'?t book online|no (?:website|online booking)/i;

interface RawReview {
  text?: { text?: string };
  originalText?: { text?: string };
  publishTime?: string;
}

function quote(text: string, re: RegExp): string {
  const m = re.exec(text);
  if (!m) return '';
  const start = Math.max(0, m.index - 40);
  const end = m.index + m[0].length + 40;
  return (start > 0 ? '…' : '') + text.slice(start, end).trim() + (end < text.length ? '…' : '');
}

export function mineReviews(reviews: RawReview[], now: Date = new Date()): ReviewIntel {
  const texts = reviews.map((r) => r.originalText?.text || r.text?.text || '');
  const times = reviews.map((r) => Date.parse(r.publishTime || '')).filter((t) => !isNaN(t));
  return {
    sampled: reviews.length,
    phoneComplaints: texts.filter((t) => PHONE.test(t)).map((t) => quote(t, PHONE)),
    siteComplaints: texts.filter((t) => SITE.test(t)).map((t) => quote(t, SITE)),
    lastReviewDays: times.length ? Math.floor((now.getTime() - Math.max(...times)) / 86_400_000) : null,
  };
}

// --- client cache, same shape as xray.ts ---

const KEY = 'pindrop_review_intel';
export const REVIEWS_CHANGED_EVENT = 'pindrop_reviews_changed';

export function getAllReviewIntel(): Record<string, ReviewIntel> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) || '{}');
  } catch {
    return {};
  }
}

export function setReviewIntel(id: string, intel: ReviewIntel): void {
  const all = getAllReviewIntel();
  all[id] = intel;
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent(REVIEWS_CHANGED_EVENT, { detail: { id } }));
  } catch (e) {
    console.warn('Failed to store review intel:', e);
  }
}

export async function fetchReviewIntel(placeId: string): Promise<ReviewIntel | null> {
  try {
    const res = await fetch(`/api/places/reviews?id=${encodeURIComponent(placeId)}`, {
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
