import { persist } from '@/lib/cloudSync';
// Website X-ray: one fetch of a lead's homepage, read for sales signals.
// detectSignals is pure so it can run on the server and in the self-check.

export interface Xray {
  dead: boolean; // unreachable, error status, or parked domain
  https: boolean;
  mobileViewport: boolean;
  copyrightYear: number | null;
  builder: string | null;
  booking: string | null;
  chat: string | null;
  telLink: boolean;
  adPixels: string[];
  socials: string[];
  emails: string[];
}

const BUILDERS: [string, RegExp][] = [
  ['Wix', /wix\.com|wixstatic\.com/i],
  ['Squarespace', /squarespace/i],
  ['GoDaddy', /godaddy|secureserver\.net|img1\.wsimg\.com/i],
  ['Shopify', /cdn\.shopify\.com/i],
  ['Webflow', /webflow/i],
  ['Weebly', /weebly/i],
  ['WordPress', /wp-content|wordpress/i],
];
const BOOKING: [string, RegExp][] = [
  ['Calendly', /calendly\.com/i], ['Acuity', /acuityscheduling\.com/i], ['Fresha', /fresha\.com/i],
  ['Mindbody', /mindbodyonline\.com/i], ['Vagaro', /vagaro\.com/i], ['Booksy', /booksy\.com/i],
  ['Setmore', /setmore\.com/i], ['Square Appointments', /squareup\.com\/appointments|square\.site/i],
  ['Jobber', /getjobber\.com/i], ['Housecall Pro', /housecallpro\.com/i], ['ServiceTitan', /servicetitan\.com/i],
  ['OpenTable', /opentable\.com/i],
];
const CHAT: [string, RegExp][] = [
  ['Tidio', /tidio/i], ['Intercom', /intercom\.io/i], ['Crisp', /crisp\.chat/i], ['Drift', /driftt?\.com/i],
  ['tawk.to', /tawk\.to/i], ['LiveChat', /livechatinc\.com/i], ['Podium', /podium\.com/i],
  ['Birdeye', /birdeye\.com/i], ['HubSpot chat', /js\.hs-scripts\.com|hubspot/i],
];
const PIXELS: [string, RegExp][] = [
  ['Meta', /fbevents\.js|fbq\(\s*['"]init/i],
  ['Google Ads', /AW-\d{6,}|googleadservices\.com/i],
  ['TikTok', /analytics\.tiktok\.com/i],
];
const PARKED = /domain (is|may be) for sale|buy this domain|this domain is parked|parked free|domain has expired|account suspended/i;

const first = (list: [string, RegExp][], html: string) => list.find(([, re]) => re.test(html))?.[0] ?? null;

export function detectSignals(html: string, finalUrl: string): Xray {
  const years = Array.from(html.matchAll(/(?:©|&copy;|copyright)[^<]{0,40}?((?:19|20)\d\d)(?:\s*[-–]\s*((?:19|20)\d\d))?/gi))
    .flatMap((m) => [m[1], m[2]].filter(Boolean).map(Number));

  const socials = Array.from(
    new Set(
      Array.from(html.matchAll(/href=["'](https?:\/\/(?:www\.)?(?:facebook|instagram|linkedin|tiktok|x|twitter|youtube)\.com\/[^"'?#\s]+)/gi))
        .map((m) => m[1].replace(/\/$/, ''))
        .filter((u) => !/sharer|share\.php|intent\/|\/plugins\/|\/tr$|\/dialog\//i.test(u))
    )
  ).slice(0, 6);

  const emails = Array.from(
    new Set(
      Array.from(html.matchAll(/[\w.+-]+@[\w-]+\.[\w.-]*[a-z]{2,}/gi))
        .map((m) => m[0].toLowerCase())
        .filter((e) => !/\.(png|jpe?g|gif|svg|webp)$|example\.|@(?:your)?domain\.|@email\.com|^(?:user|name|your(?:name|email)?)@|sentry|wixpress|godaddy|@2x/i.test(e))
    )
  ).slice(0, 3);

  return {
    dead: PARKED.test(html.slice(0, 20000)),
    https: finalUrl.startsWith('https:'),
    mobileViewport: /<meta[^>]+name=["']?viewport/i.test(html),
    copyrightYear: years.length ? Math.max(...years) : null,
    builder: first(BUILDERS, html),
    booking: first(BOOKING, html),
    chat: first(CHAT, html),
    telLink: /href=["']tel:/i.test(html),
    adPixels: PIXELS.filter(([, re]) => re.test(html)).map(([n]) => n),
    socials,
    emails,
  };
}

export const DEAD_XRAY: Xray = {
  dead: true, https: false, mobileViewport: false, copyrightYear: null, builder: null,
  booking: null, chat: null, telLink: false, adPixels: [], socials: [], emails: [],
};

// --- client cache, same shape as pagespeed.ts ---

const XRAY_KEY = 'pindrop_xrays';
export const XRAY_CHANGED_EVENT = 'pindrop_xray_changed';

export function getAllXrays(): Record<string, Xray> {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(localStorage.getItem(XRAY_KEY) || '{}');
  } catch {
    return {};
  }
}

export function setXray(id: string, xray: Xray): void {
  const all = getAllXrays();
  all[id] = xray;
  try {
    persist(XRAY_KEY, all);
    window.dispatchEvent(new CustomEvent(XRAY_CHANGED_EVENT, { detail: { id } }));
  } catch (e) {
    console.warn('Failed to store xray:', e);
  }
}

/** Returns null when our own route failed (not the same as the site being dead). */
export async function fetchXray(url: string): Promise<Xray | null> {
  try {
    const res = await fetch(`/api/xray?url=${encodeURIComponent(url)}`, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
