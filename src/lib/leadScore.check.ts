// Run: npx tsx src/lib/leadScore.check.ts
import assert from 'node:assert';
import { scoreLead, callWindow, HOT_SCORE } from './leadScore';

const base = { id: 'x', location: { lat: 0, lng: 0 }, hasWebsite: false, nationalPhoneNumber: '07700 900123', businessStatus: 'OPERATIONAL' };
const roofer = { ...base, name: 'Smith Roofing', primaryType: 'roofing_contractor', internationalPhoneNumber: '+44 7700 900123', rating: 4.6, userRatingCount: 60 };
const laundromat = { ...base, name: 'Suds', primaryType: 'laundry', hasWebsite: true, websiteURI: 'https://suds.com', rating: 4, userRatingCount: 3 };

assert.ok(scoreLead(roofer).score >= HOT_SCORE, 'roofer, no site, 60 reviews should be hot');
assert.ok(scoreLead(laundromat).score < 30, 'laundromat with site should be cold');
assert.strictEqual(scoreLead({ ...roofer, businessStatus: 'CLOSED_PERMANENTLY' }).score, 0);
assert.strictEqual(scoreLead({ ...roofer, name: 'Roto-Rooter Plumbing' }).score, 0);
assert.match(scoreLead({ ...roofer, hasWebsite: true, websiteURI: 'https://smith.business.site' }).reasons.join(), /business\.site/);
// 12:00 UTC Tuesday, lead at UTC-5 = 7:00 local → trades window
assert.ok(callWindow({ ...roofer, utcOffsetMinutes: -300 }, new Date('2026-10-20T12:00:00Z'))!.good);
assert.ok(!callWindow({ ...roofer, utcOffsetMinutes: 0 }, new Date('2026-10-20T12:00:00Z'))!.good);
assert.strictEqual(callWindow(roofer), null);
console.log('leadScore OK', scoreLead(roofer));

// --- X-ray detectors + scoring ---
import { detectSignals, DEAD_XRAY } from './xray';
const html = `<html><head><script src="https://connect.facebook.net/en_US/fbevents.js"></script></head>
<body><a href="https://www.facebook.com/joesplumbing/">fb</a><a href="https://www.facebook.com/sharer/sharer.php?u=x">share</a>
<a href="mailto:joe@joesplumbing.com">mail</a><img src="logo@2x.png"> © 2019 Joe's Plumbing <script src="//static.wixstatic.com/x.js"></script></body></html>`;
const x = detectSignals(html, 'http://joesplumbing.com/');
assert.deepStrictEqual(x.adPixels, ['Meta']);
assert.deepStrictEqual(x.socials, ['https://www.facebook.com/joesplumbing']);
assert.deepStrictEqual(x.emails, ['joe@joesplumbing.com']);
assert.strictEqual(x.copyrightYear, 2019);
assert.strictEqual(x.builder, 'Wix');
assert.ok(!x.mobileViewport && !x.https && !x.dead);
assert.ok(detectSignals('<p>This domain is for sale!</p>', 'https://a.com').dead);

const withSite = { ...roofer, hasWebsite: true, websiteURI: 'http://joesplumbing.com' };
const scored = scoreLead(withSite, x);
assert.ok(scored.score > scoreLead(withSite).score, 'x-ray pain should raise score');
assert.match(scored.opener, /Meta ads/);
assert.match(scoreLead(withSite, DEAD_XRAY).reasons.join(), /Website is down/);
console.log('xray OK', scored.score, scored.reasons);

// --- review mining ---
import { mineReviews } from './reviewIntel';
const now = new Date('2026-10-20T00:00:00Z');
const r = (t: string, d = '2026-01-01T00:00:00Z') => ({ text: { text: t }, publishTime: d });
const intel = mineReviews([
  r('Great work but I called three times and nobody picked up, had to leave a voicemail.'),
  r('Could not get through on the phone for days.'),
  r('Their website was down so I could not see prices.'),
  r('Fantastic plumber, fixed my leak fast. Would call again!'),
], now);
assert.strictEqual(intel.sampled, 4);
assert.strictEqual(intel.phoneComplaints.length, 2, 'two phone complaints');
assert.strictEqual(intel.siteComplaints.length, 1);
assert.strictEqual(intel.lastReviewDays, 292);
assert.strictEqual(mineReviews([r('Answered right away, super friendly.')], now).phoneComplaints.length, 0);
const rs = scoreLead(roofer, null, intel);
assert.match(rs.opener, /couldn't get through/);
assert.ok(rs.reasons.some((x) => /unanswered calls/.test(x)) && rs.reasons.some((x) => /No new reviews/.test(x)));
console.log('reviews OK', intel.phoneComplaints);

// --- niche matching: whole words, types before name ---
import { nicheTier } from './leadScore';
const tier = (name: string, primaryType = '', types: string[] = []) =>
  nicheTier({ ...base, name, primaryType, types } as any);
assert.strictEqual(tier('Main Street Diner', 'restaurant'), 'low', '"Street" is not "tree"');
assert.strictEqual(tier('Best Buy', 'electronics_store'), 'low', '"electronics" is not "electric"');
assert.strictEqual(tier('Space Coast Realty', 'real_estate_agency'), 'other', '"Space" is not "spa"');
assert.strictEqual(tier('Liverpool Books', 'book_store'), 'low', '"Liverpool" is not pool service');
assert.strictEqual(tier('Smith Electric'), 'trades', 'name fallback still works');
assert.strictEqual(tier('Ace HVAC & Heating', 'point_of_interest'), 'trades');
assert.strictEqual(tier('Joe the Barber', 'barber_shop'), 'beauty');
assert.strictEqual(tier('Bright Smiles', 'dentist'), 'gatekeeper');
console.log('niche OK');
