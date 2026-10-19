# Map Crack updates report

This report covers the research and the three build phases. The aim of the work is to find better leads for cold calling and social DMs. Before, the app treated every business with no website as equally good. Now each business gets a score that says how good a lead it is and why.

## Research (before building)

Four Gemini research runs looked at:

1. What makes a local business a good lead.
2. Which Google Places data can show that.
3. How to cold call and DM local owners, plus the calling laws in the USA, UK, Australia and Canada.
4. Lead sources most agencies miss.

The findings are in `docs/lead-quality-plan.md`. The short version is that a good lead passes four tests:

- The owner picks up the phone. Small owner-run trades do, while chains and dentists have receptionists who block calls.
- The business has money. 25 to 150 reviews usually means a steady, established business.
- The business has a problem you can fix, such as no website, a broken site, or customers complaining that nobody answers the phone.
- One saved customer pays your fee. A $8,000 roof job covers a $1,000 website many times over.

## Phase 1: lead score, reasons, opener and call time

### What you see in the app

- Each business in the leads list has a score from 0 to 100. Red means 70 or higher (hot), orange means 50 to 69, and grey means below 50.
- The list is sorted best lead first, so you can call from the top down.
- The filter menu has a new option, "Hot leads only (70+)". It also hides the hot leads' map pins that don't pass.
- A green "Call now" badge appears when it is a good time to call that business in its own time zone. It only shows on leads scoring 50 or more.
- Opening a business shows a "Lead score" box with the score, the reasons behind it, the business's local time, the best hours to call, and a suggested first line to say on the call.
- The CSV export has three new columns: Lead Score, Why, and Opener.

### How the score is worked out

| Signal | Points |
|---|---|
| Closed business, or a chain such as Target or Roto-Rooter | Score is 0 |
| High-ticket trade (roofing, HVAC, plumbing, electrical, tree, pest) | +25 |
| Local service (auto repair, garage door, locksmith, cleaning, landscaping) | +18 |
| Beauty and fitness (salon, spa, barber, gym) | +12 |
| Other businesses | +8 |
| Restaurants and shops, or dentists and lawyers | +0 |
| No website | +30 |
| Website is an old Google business.site link (Google shut these down) | +28 |
| Website is only a Facebook or Instagram page | +25 |
| Website has no domain of its own (for example a wixsite.com address) | +20 |
| UK or Australian mobile number, which the owner usually answers | +10 |
| No phone number | -20 |
| 25 to 150 reviews | +15 |
| 10 to 24 reviews | +8 |
| More than 300 reviews (may already have an agency) | -5 |
| Rating 4.7 or higher with fewer than 40 reviews (good work, no review system) | +10 |
| Rating between 3.5 and 4.2 | +5 |
| No opening hours on the Google profile | +5 |

The final score is kept between 0 and 100.

### Best call times used for the "Call now" badge

Times are the business's local time, Monday to Friday only.

- Trades: 7:00 to 8:30 and 16:30 to 18:00
- Auto and local services: 8:00 to 9:00 and 15:30 to 16:30
- Beauty and fitness: 8:15 to 9:15 and 13:00 to 14:00
- Restaurants and shops: 9:30 to 10:30 and 14:00 to 16:00
- Everything else: 9:00 to 11:00 and 14:00 to 16:00

To know the local time, the app now asks Google for each place's time zone offset (`utcOffsetMinutes`). This adds no cost, because the search already pays for that tier.

### Changes made during testing

- The first version showed "Call now" on every lead, including worthless ones. It now shows only on leads scoring 50 or more.
- A "Few photos" rule was removed. Google returned 0 photos for every place, so the rule would have flagged every business.

## Phase 2: website X-ray

### What you see in the app

When a business has a real website, the detail box shows an "X-ray website" button. Clicking it loads the homepage once and reports:

- Whether the site is dead. This covers a site that won't load, an error page, an expired domain, or a "domain for sale" page.
- Whether it uses HTTPS. Without it, browsers show "Not secure".
- Whether it fits a phone screen.
- The copyright year in the footer, which hints at when the site was last updated.
- What it was built with, such as Wix, Squarespace, GoDaddy, WordPress or Shopify.
- Whether it has an online booking tool (Calendly, Jobber, Housecall Pro, Fresha and others) or a chat widget.
- Whether it runs Meta, Google Ads or TikTok tracking pixels, which means the business pays for ads.
- Links to its Facebook, Instagram, LinkedIn, TikTok, X or YouTube pages, for DMs.
- Up to three email addresses found on the page.

The app saves the result in your browser, so a re-scan is needed only if you want fresh data. The CSV export has three new columns: Socials, Emails, and Ad Pixels.

### How X-ray changes the score

| Finding | Points |
|---|---|
| Website is dead | +28 |
| Running ads (has a marketing budget) | +12 |
| Not mobile-friendly | +12 |
| No HTTPS | +8 |
| Copyright year two or more years old | +6 |
| No booking tool and no chat | +5 |

The opener changes to match the finding. A business paying for ads with a site that doesn't fit a phone gets this line: "You're paying for Meta ads, but your site doesn't fit a phone screen, which is where most of that traffic lands."

### Safety

The server fetches a web address that comes from the browser. Without a guard, someone could use that to reach machines inside your own network. The X-ray refuses any address that points to a private or local network, and it checks again after every redirect. Testing confirmed that `localhost` and `127.0.0.1` are blocked.

### Changes made during testing

A placeholder email (`user@domain.com`) came through from a real site. The app now filters out template emails like that.

## Phase 3: review mining

### What you see in the app

The detail box has a "Check reviews" button. It asks Google for that one business's reviews (about $0.025 per business) and looks for:

- Complaints about phone calls, such as "nobody picked up", "straight to voicemail", "couldn't get through" or "never called back".
- Complaints about the website or online booking, such as "website was down" or "couldn't book online".
- How many days since the last review.

Matching review quotes show in the box and go into a new CSV column, Review Complaints.

### How reviews change the score

| Finding | Points |
|---|---|
| A review complains about unanswered calls | +15 |
| A review complains about the website or booking | +8 |
| No new reviews in 6 months or more | +5 |

A phone complaint replaces any other opener, because it is proof from their own customers: "One of your Google reviews says they couldn't get through on the phone. How many calls do you think slip past when you're on a job?" This is the strongest opening for selling an AI voice agent.

### Known problem

Your current Google API key gets no review text back. Google returned ratings but no reviews, even for places with over 2,000 reviews. The code works, and the self-checks pass, but the button will find nothing until review data is turned on for the key. When that happens, the app shows "Google returned no review text for this place" instead of claiming no complaints were found.

To fix it, check in Google Cloud Console that the key's project uses pay-as-you-go billing for Places API (New). Review data is a higher-priced tier that some plans leave out.

Google also returns at most 5 reviews per place. A complaint found is real evidence, but finding none proves nothing.

## Files changed

New files:

- `src/lib/leadScore.ts` works out the score, reasons, opener and call time.
- `src/lib/xray.ts` reads a homepage for signals and saves results.
- `src/app/api/xray/route.ts` is the server route that fetches a website safely.
- `src/lib/reviewIntel.ts` searches reviews for complaints and saves results.
- `src/app/api/places/reviews/route.ts` is the server route that gets reviews from Google.
- `src/lib/leadScore.check.ts` holds the self-checks. Run it with `npx tsx src/lib/leadScore.check.ts`.
- `docs/lead-quality-plan.md` is the research summary and plan.

Changed files:

- `src/lib/businessFilters.ts` sorts by score and adds the hot filter.
- `src/app/page.tsx`, `src/components/Map/MapContainer.tsx` and `src/components/Search/PindropTopBar.tsx` add the hot filter switch.
- `src/components/Sidebar/PindropLeadsDrawer.tsx` adds the score chip and "Call now" badge.
- `src/components/Detail/BusinessDetailModal.tsx` adds the lead score box, X-ray button and review button.
- `src/lib/exportUtils.ts` adds the new CSV columns.
- `src/app/api/places/nearby/route.ts`, `src/app/api/places/search/route.ts` and `src/types/business.ts` add the time zone offset.

## Commits

1. `add lead quality research and build plan`
2. `add lead score, reasons, call opener and call-window badge; sort by score and Hot filter`
3. `add website X-ray: on-demand site scan feeding lead score, opener and CSV`
4. `add review mining: on-demand check for missed-call and website complaints`

None of these are pushed to GitHub yet.

## Limits to know about

- The list re-sorts after an X-ray or review check only when you next change a filter or search. The score chip itself updates right away.
- The niche is guessed from Google's category and the business name, so some businesses land in the wrong tier.
- The chain list is short and hand-written. Unknown chains will still score.
- The mobile-number bonus only works for UK and Australian numbers. US and Canadian numbers don't show whether they are mobile without a paid lookup.

## Not built yet (Phase 4 and later)

- A caller card that shows everything for one lead on one screen, with a place to log a missed-call test ("I called at 6:15 pm and it rang out").
- Finding businesses that are hiring a receptionist, a strong sign they would buy an AI voice agent. This needs a paid jobs API.
- Checking the Google Ads Transparency Center for businesses paying for ads.
- New business registrations from UK Companies House and similar sources.
- Checking numbers against the US Do Not Call, UK TPS and Australian Do Not Call registers.
