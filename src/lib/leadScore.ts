import { BusinessPlace } from '@/types/business';
import { isSocialPageOnly, isNoRealDomain } from '@/lib/pindropUtils';

// Weights come from docs/lead-quality-plan.md. Tuned for cold-calling owner-run businesses.

export interface LeadScore {
  score: number; // 0–100
  reasons: string[];
  opener: string;
}

export const HOT_SCORE = 70;

type Tier = 'trades' | 'auto' | 'beauty' | 'low' | 'gatekeeper' | 'other';

// Matched against primaryType, types and name, because Places has no type for HVAC, roofing etc. on many listings.
const TIER_PATTERNS: [Tier, RegExp][] = [
  ['gatekeeper', /dentist|dental|lawyer|attorney|law_firm|hospital|school|university|church|government|city_hall|bank/i],
  ['trades', /roof|hvac|heating|air.?condition|plumb|electric|restoration|water.?damage|tree|pest|exterminat|septic|drain|foundation/i],
  ['auto', /car_repair|auto|collision|body.?shop|transmission|garage.?door|locksmith|mover|moving|landscap|lawn|clean|paint|contractor|remodel|fenc|concrete|pool/i],
  ['beauty', /med.?spa|spa|salon|barber|nail|beauty|lash|brow|tattoo|gym|fitness|yoga|chiropract|massage|physiotherap|veterinar/i],
  ['low', /restaurant|cafe|coffee|bakery|bar|food|meal|store|shop|laundr|dry_clean|convenience|gas_station|atm|parking/i],
];

const TIER_POINTS: Record<Tier, number> = { trades: 25, auto: 18, beauty: 12, other: 8, low: 0, gatekeeper: 0 };

const CHAINS = /mcdonald|starbucks|subway|walmart|target|cvs|walgreens|7-eleven|roto-rooter|servicemaster|servpro|jiffy lube|midas|meineke|great clips|supercuts|h&r block|state farm|allstate|anytime fitness|planet fitness|chase|wells fargo|tesco|boots|specsavers|greggs|costa/i;

export function nicheTier(b: BusinessPlace): Tier {
  const hay = [b.primaryType, ...(b.types || []), b.name].join(' ');
  return TIER_PATTERNS.find(([, re]) => re.test(hay))?.[0] ?? 'other';
}

// UK 07 and AU 04 numbers are mobiles, which usually means the owner answers.
function isMobile(b: BusinessPlace): boolean {
  return /^\+44 ?7|^\+61 ?4/.test(b.internationalPhoneNumber || '');
}

export function scoreLead(b: BusinessPlace): LeadScore {
  const reasons: string[] = [];
  const name = b.name;
  const rating = b.rating ?? 0;
  const count = b.userRatingCount ?? 0;

  if (b.businessStatus && b.businessStatus !== 'OPERATIONAL') {
    return { score: 0, reasons: ['Not operating'], opener: '' };
  }
  if (CHAINS.test(name)) {
    return { score: 0, reasons: ['Chain or franchise: no local buyer'], opener: '' };
  }

  let score = 0;
  const tier = nicheTier(b);
  score += TIER_POINTS[tier];
  if (tier === 'trades') reasons.push('High-ticket trade: phone-driven');
  if (tier === 'auto') reasons.push('Local service: owner often answers');
  if (tier === 'gatekeeper') reasons.push('Gatekeeper niche: hard to reach owner');
  if (tier === 'low') reasons.push('Low-ticket niche');

  const url = b.websiteURI?.trim();
  let opener = '';
  const reviewBit = count ? `${count} reviews on Google` : 'a Google listing';
  if (!url) {
    score += 30;
    reasons.push('No website');
    opener = `Saw you've got ${reviewBit} but no website button. Is that on purpose, or just been on the back burner?`;
  } else if (/business\.site/i.test(url)) {
    score += 28;
    reasons.push('Dead Google business.site link');
    opener = `Your Google listing links to a business.site page, and Google shut those down, so customers clicking "Website" hit a dead page. Did you know?`;
  } else if (isSocialPageOnly(url)) {
    score += 25;
    reasons.push('Social page as website');
    opener = `Your Google listing sends people to a social page instead of a website. Has that been costing you calls from people who want to see your work first?`;
  } else if (isNoRealDomain(url)) {
    score += 20;
    reasons.push('No own domain');
    opener = `Noticed your site's on a free builder address, not your own domain. Was that meant to be temporary?`;
  }

  if (!b.nationalPhoneNumber && !b.internationalPhoneNumber) {
    score -= 20;
    reasons.push('No phone listed');
  } else if (isMobile(b)) {
    score += 10;
    reasons.push('Mobile number: likely the owner');
  }

  if (count >= 25 && count <= 150) {
    score += 15;
    reasons.push('Established: 25–150 reviews');
  } else if (count >= 10 && count < 25) {
    score += 8;
  } else if (count > 300) {
    score -= 5;
    reasons.push('300+ reviews: may already have an agency');
  }

  if (rating >= 4.7 && count >= 8 && count < 40) {
    score += 10;
    reasons.push('Great rating, few reviews: needs a review system');
    opener ||= `You're at ${rating.toFixed(1)} stars but only ${count} reviews. Your work's clearly good, so are you asking every customer for one?`;
  } else if (rating >= 3.5 && rating < 4.2 && count >= 10) {
    score += 5;
    reasons.push('Rating under pressure');
  }

  if (!b.regularOpeningHours?.weekdayDescriptions?.length) {
    score += 5;
    reasons.push('No hours on Google profile');
  }

  opener ||= `Quick one: when someone calls after hours, what happens to that call right now?`;
  return { score: Math.max(0, Math.min(100, score)), reasons, opener };
}

// Good hours to reach the owner, per niche (local time, 24h). From the outreach research.
const CALL_WINDOWS: Record<Tier, [number, number][]> = {
  trades: [[7, 8.5], [16.5, 18]],
  auto: [[8, 9], [15.5, 16.5]],
  beauty: [[8.25, 9.25], [13, 14]],
  low: [[9.5, 10.5], [14, 16]],
  gatekeeper: [[8, 9], [16, 17]],
  other: [[9, 11], [14, 16]],
};

export interface CallWindow {
  localTime: string;
  good: boolean;
  label: string;
}

/** Lead's local time and whether now is a good moment to call. Null when Google gave no timezone. */
export function callWindow(b: BusinessPlace, now: Date = new Date()): CallWindow | null {
  if (b.utcOffsetMinutes == null) return null;
  const local = new Date(now.getTime() + b.utcOffsetMinutes * 60_000);
  const hour = local.getUTCHours() + local.getUTCMinutes() / 60;
  const day = local.getUTCDay();
  const windows = CALL_WINDOWS[nicheTier(b)];
  const fmt = (h: number) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  const good = day !== 0 && day !== 6 && windows.some(([s, e]) => hour >= s && hour < e);
  return {
    localTime: fmt(hour),
    good,
    label: windows.map(([s, e]) => `${fmt(s)}–${fmt(e)}`).join(', '),
  };
}
