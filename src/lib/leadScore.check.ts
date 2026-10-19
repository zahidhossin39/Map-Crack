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
