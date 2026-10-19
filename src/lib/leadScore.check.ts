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
