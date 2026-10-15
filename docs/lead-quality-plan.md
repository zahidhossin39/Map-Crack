# Lead Quality Plan

Goal: fewer, better leads, ready to **cold call** first and **DM** second.
Offer: new sites, redesigns, local SEO/GBP, AI voice agent/chatbot, CRM. $500–$2k. US/UK/AU/CA.

Sources: 4 Gemini research runs (2026-10-16) + audit of this codebase.

---

## 1. What a quality lead is

A lead is good when all four are true:

| Test | Means | How we see it |
|---|---|---|
| **Reachable** | Owner answers the phone, not a receptionist or head office | Owner-run niche, not a chain, mobile number (UK `07`, AU `04`) |
| **Can pay** | Has steady revenue | 25–150 reviews, rating 3.8–4.8, operational |
| **Feels pain** | Losing money to a gap you fix | No site / social-only / dead site, slow mobile, reviews say "no one answered" |
| **Big job value** | One saved customer pays your fee | Trades (roofing, HVAC, plumbing, restoration, garage door), auto body, med spa |

What's wrong today: the app only asks "has a website?". A no-site laundromat with 3 reviews ranks the same as a no-site roofer with 80 reviews. The second one is worth 10× more.

## 2. Niches, ranked for calling

- **Tier 1** — roofing, HVAC, plumbing, electrician, restoration, tree service, pest control. Phone-driven, big tickets, owner's cell is often the listed number.
- **Tier 2** — auto body/repair, garage door, locksmith, movers, landscaping, cleaning.
- **Tier 3** — med spa, salon, barber, nail, gym (better via Instagram DM than calls).
- **Low** — restaurants, cafés, retail (low margins, busy staff).
- **Avoid for calls** — dentists, lawyers, chains, franchises, schools, government, hospitals (gatekeepers or no purchase authority).

## 3. Signals worth scoring

**From data we already fetch (free to use):**
- No website / social-only / no real domain (already detected)
- Dead `*.business.site` link: Google shut these down in 2024, so the listing points to a broken page. Strong lead, not detected yet.
- Review-count sweet spot 25–150 = established, no agency yet
- **Growth-hungry**: rating ≥ 4.7 with < 40 reviews, so they're good at the work but have no review system. Pitch the CRM/review engine.
- Rating 3.5–4.2 = reputation pressure
- No opening hours on the listing = neglected Google profile, so pitch GBP/SEO
- Few photos (< 5) = neglected profile
- Open evenings/weekends or 24h = after-hours calls, so pitch the AI voice agent
- `businessStatus != OPERATIONAL` means drop it

**From fetching their website once (free, server-side):**
- HTTPS broken / plain http, no mobile viewport, copyright year ≥ 2 years old
- Builder (Wix/GoDaddy/Squarespace/WordPress)
- **Ad pixels** (Meta pixel, Google Ads `AW-` tag) = already spending money on ads. Best redesign/voice-agent buyer.
- No booking widget, no chat widget, no `tel:` link
- **Instagram / Facebook / LinkedIn links + emails**, which feed the DM step

**From reviews (Places "Atmosphere" fields, ~$25 per 1,000, fetch per lead only):**
- Text like "no one answered", "straight to voicemail", "never called back". This is the best AI voice agent lead there is.
- Last review > 6 months old = dormant profile
- Note: the Places API does **not** expose owner replies, so "owner replies to reviews" can't be scored without scraping.

## 4. Ideas you didn't ask for (ranked by quality ÷ effort)

1. **Reasons become the opener.** Each scoring reason turns straight into a call line: *"You've got 48 five-star reviews but no website button on Google. Is that on purpose?"* The score explains itself, and the caller doesn't have to think.
2. **Call-window badge.** Show the lead's local time and whether it's a good moment for their niche (trades 7–8:30am / 4:30–6pm, salons 8–9am, restaurants 2–4pm). Calling at the right time can do more for connect rate than any filter.
3. **Missed-call test log.** You call after hours, then mark "rang out / voicemail full / no text-back". That's the strongest AI-agent opener: *"I called you at 6:15 yesterday and it rang out."*
4. **Dead `business.site` sweep.** A one-line check that turns up urgent, almost guaranteed redesign leads.
5. **Receptionist job ads** (Indeed / Google Jobs): the business has budgeted ~$40k for a person, and you pitch an AI agent instead. Needs a paid API (SerpApi), so do it later.
6. **Ad spenders with slow sites** (Ads Transparency Center + PageSpeed). Proven budget. The pixel check above is a free proxy for this.
7. **New business registrations** (UK Companies House stream is free; AU ASIC; some US states). Greenfield bundle buyers. Separate tool, so do it later.

## 5. Compliance (the tool should warn you)

- **US**: live B2B calls are OK 8am–9pm local. Cold **SMS** or **AI-voice** calls to mobiles need written consent (TCPA, FCC 2024 ruling). Mobile numbers on the DNC list are presumed personal.
- **UK**: check TPS/CTPS. Sole traders count as consumers, so a mobile number on TPS means no call.
- **AU**: weekdays 9am–8pm, Saturday 9am–5pm, no Sundays. Cold SMS is banned (Spam Act).
- **CA**: B2B calls are exempt from the DNCL but follow calling hours. Cold SMS is banned (CASL).
- So: **call, don't text or robo-dial**, and never cold-call people with the AI agent you sell.

---

## 6. Build plan (proposed)

**Phase 1: Lead Score, no new API cost**
- `src/lib/leadScore.ts`: score 0–100 plus a list of reasons, built from niche tier, presence, review/rating bands, growth-hungry, dead business.site, hours/photos, operational gate, chain blocklist, mobile number (UK/AU).
- Sort by score, add a "Hot only" filter, put a score chip on cards/pins, show reasons + suggested opener in the detail modal, and add score/reasons to the CSV.
- Call-window badge (lead's local time + niche's good hours).

**Phase 2: Website X-ray, on demand, free**
- `/api/xray?url=`: one GET → SSL, viewport, copyright year, builder, booking/chat/`tel:`, ad pixels, social links, emails, dead site. Its results feed the score.

**Phase 3: Review mining, on demand, ~$0.025 per lead**
- Fetch `reviews` for one place → phone-complaint and website-complaint matches, last review age.

**Phase 4: Caller card + missed-call log**
- One screen per lead with phone, local time, score reasons, opener, socials, and a missed-call test result saved with pipeline status.

**Later (paid APIs / separate tools):** receptionist job ads, ad-transparency check, Companies House new businesses, TPS/DNC scrubbing.
