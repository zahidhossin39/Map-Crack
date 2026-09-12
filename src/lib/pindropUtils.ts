import { BusinessPlace, LeadStatus } from '@/types/business';
export type { LeadStatus };

// List of social networks, bio link providers, and social platforms
export const SOCIAL_DOMAINS = [
  'instagram.com',
  'instagr.am',
  'facebook.com',
  'fb.me',
  'fb.com',
  'tiktok.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'linktr.ee',
  'linkin.bio',
  'beacons.ai',
  'campsite.bio',
  'carrd.co',
  'bio.site',
  'snipfeed.co',
  'threads.net',
  'youtube.com',
  'youtu.be',
  'pinterest.com',
  'yelp.com',
  'wa.me',
  't.me',
  'glossgenius.com',
  'square.site',
  'booksy.com',
  'setmore.com',
  'fresha.com',
  'vagaro.com',
];

/**
 * Checks if a business's website URI points to a social page or link-in-bio service
 * instead of an official standalone website.
 *
 * Matches on the hostname only. A substring match over the whole URL misclassifies
 * legitimate sites — 'x.com' would match remax.com/fedex.com, 't.me' would match
 * restaurant.menu, and any tracking query like ?utm_source=instagram.com would match too.
 */
export function isSocialPageOnly(url?: string | null): boolean {
  if (!url) return false;
  const raw = url.trim();
  if (!raw) return false;
  try {
    const host = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`).hostname
      .toLowerCase()
      .replace(/^www\./, '');
    return SOCIAL_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

export interface MapKeyItem {
  key: string;
  label: string;
  description: string;
  color: string;
  dotBg: string;
}

/**
 * Exact Map Key items matching pindrop.host (Screenshot 2)
 */
export const MAP_KEY_ITEMS: MapKeyItem[] = [
  {
    key: 'no_website',
    label: 'No website',
    description: 'A business with no site yet. Tap it to build one.',
    color: '#f59e0b',
    dotBg: 'bg-amber-500',
  },
  {
    key: 'social_page_only',
    label: 'Social page only',
    description: 'Only an Instagram, Facebook or link-in-bio page. No real site.',
    color: '#ec4899',
    dotBg: 'bg-pink-500',
  },
  {
    key: 'website',
    label: 'Website',
    description: 'This business already has a site.',
    color: '#10b981',
    dotBg: 'bg-emerald-500',
  },
];

const STORAGE_KEY = 'pindrop_lead_statuses';

/**
 * Retrieve the saved lead status for a specific business ID
 */
export function getLeadStatus(id: string): LeadStatus {
  if (typeof window === 'undefined') return 'none';
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return 'none';
    const parsed = JSON.parse(raw);
    return parsed[id] || 'none';
  } catch {
    return 'none';
  }
}

/**
 * Retrieve all saved lead statuses
 */
export function getAllLeadStatuses(): Record<string, LeadStatus> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/**
 * Save or update the lead status for a specific business ID
 */
export function setLeadStatus(id: string, status: LeadStatus): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    if (status === 'none') {
      delete parsed[id];
    } else {
      parsed[id] = status;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    // Dispatch custom event for real-time reactive sync across components
    window.dispatchEvent(
      new CustomEvent('pindrop_lead_status_changed', {
        detail: { id, status },
      })
    );
  } catch (e) {
    console.warn('Failed to update lead status:', e);
  }
}

export type BusinessPinCategory =
  | 'no_website'
  | 'social_page_only'
  | 'website'
  | 'talking'
  | 'client'
  | 'nogo';

export interface PinVisualConfig {
  category: BusinessPinCategory;
  label: string;
  badgeText: string;
  badgeClass: string;
  auraColor: string;
  pinGradient: string;
  labelBorderClass: string;
  labelTextClass: string;
  dotColor: string;
}

/**
 * Calculate pin visual representation based on user pipeline status or online presence
 */
export function getBusinessPinVisuals(
  business: BusinessPlace,
  overrideStatus?: LeadStatus
): PinVisualConfig {
  const status = overrideStatus ?? business.leadStatus ?? 'none';

  // 1. Pipeline Overrides
  if (status === 'client') {
    return {
      category: 'client',
      label: 'Client',
      badgeText: 'CLIENT',
      badgeClass: 'bg-purple-500/25 text-purple-300 border-purple-500/50',
      auraColor: 'bg-purple-400',
      pinGradient: 'from-purple-500 to-indigo-600',
      labelBorderClass: 'border-purple-500/40 text-purple-200 group-hover:border-purple-400',
      labelTextClass: 'text-purple-400',
      dotColor: '#a855f7',
    };
  }

  if (status === 'talking') {
    return {
      category: 'talking',
      label: 'Talking (In Progress)',
      badgeText: 'TALKING',
      badgeClass: 'bg-blue-500/25 text-blue-300 border-blue-500/50',
      auraColor: 'bg-blue-400',
      pinGradient: 'from-blue-500 to-sky-600',
      labelBorderClass: 'border-blue-500/40 text-blue-200 group-hover:border-blue-400',
      labelTextClass: 'text-blue-400',
      dotColor: '#3b82f6',
    };
  }

  if (status === 'nogo') {
    return {
      category: 'nogo',
      label: 'No-go (Skipped)',
      badgeText: 'NO-GO',
      badgeClass: 'bg-red-500/25 text-red-300 border-red-500/50',
      auraColor: 'bg-red-400',
      pinGradient: 'from-red-500 to-rose-600',
      labelBorderClass: 'border-red-500/40 text-red-200 group-hover:border-red-400',
      labelTextClass: 'text-red-400',
      dotColor: '#ef4444',
    };
  }

  // 2. Default State: Based on online presence
  // Check if business has no website
  if (!business.hasWebsite || !business.websiteURI || business.websiteURI.trim() === '') {
    return {
      category: 'no_website',
      label: 'No website',
      badgeText: 'NO WEBSITE',
      badgeClass: 'bg-amber-500/25 text-amber-300 border-amber-500/50',
      auraColor: 'bg-amber-400',
      pinGradient: 'from-amber-400 to-orange-500',
      labelBorderClass: 'border-amber-500/40 text-amber-200 group-hover:border-amber-400',
      labelTextClass: 'text-amber-400',
      dotColor: '#f59e0b',
    };
  }

  // Check if business has only a social media page or link-in-bio
  if (isSocialPageOnly(business.websiteURI)) {
    return {
      category: 'social_page_only',
      label: 'Social page only',
      badgeText: 'SOCIAL PAGE ONLY',
      badgeClass: 'bg-pink-500/25 text-pink-300 border-pink-500/50',
      auraColor: 'bg-pink-400',
      pinGradient: 'from-pink-500 to-rose-500',
      labelBorderClass: 'border-pink-500/40 text-pink-200 group-hover:border-pink-400',
      labelTextClass: 'text-pink-400',
      dotColor: '#ec4899',
    };
  }

  // Has a real website
  return {
    category: 'website',
    label: 'Website',
    badgeText: 'HAS WEBSITE',
    badgeClass: 'bg-emerald-500/25 text-emerald-300 border-emerald-500/50',
    auraColor: 'bg-emerald-400',
    pinGradient: 'from-emerald-500 to-teal-600',
    labelBorderClass: 'border-emerald-500/40 text-emerald-200 group-hover:border-emerald-400',
    labelTextClass: 'text-emerald-400',
    dotColor: '#10b981',
  };
}