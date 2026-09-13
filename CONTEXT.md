# Context

Glossary for Map Crack. Terms here have one agreed meaning; use them in code, UI copy and conversation.

## Prospect

Any business returned by a map search. Not yet judged. Most prospects never become leads.

## Lead

A prospect worth contacting. Two kinds, and they are sold differently:

- **Greenfield lead** — no website at all. Pitch: we build you one.
- **Redesign lead** — has a website, but it is weak. Pitch: we rebuild it.

## Presence

What a prospect has online. Drives pin colour. Exactly one applies:

- **No website** — Google lists no website. A greenfield lead.
- **Social page only** — the listed website is a social or link-in-bio page
  (Instagram, Facebook, Linktree, Carrd, Square Site, Bio.site). Treated as having
  no real site. A greenfield lead.
- **No real domain** — the site sits on a builder's own subdomain
  (`x.lovable.app`, `x.wixsite.com`, `x.godaddysites.com`). The business never
  bought a domain, so it has not committed. A redesign lead.
- **Website** — a real site on its own domain. Not a lead on presence alone.

A prospect matching both *social page only* and *no real domain* is **social page only**;
that classification is older and already meaningful to the user.

## Builder

The platform a site is built with — WordPress, Squarespace, Wix, Shopify, Lovable.
Shown as a label only. A builder is **not** a judgement: good and bad sites exist on
every platform. Only *no real domain* (above) is a lead signal.

## Selected

A prospect the user has hand-picked while browsing the map. A star, set by the user,
meaning "save this for later".

**Selected is independent of Pipeline status.** A prospect stays selected after it
becomes *Talking* or *Client*; otherwise the saved list would empty itself as the user
works through it.

## Pipeline status

How far a conversation has progressed. Exactly one, set by the user:

`none` → `talking` → `client`, or `nogo` at any point.

Distinct from **Selected**: *selected* means "I picked this"; *talking* means
"I have contacted them".

## Explore mode

- **Pin mode** — drop a pin, search a radius around it.
- **Roam mode** — scan the visible map as the user pans.

In both modes results **accumulate** across searches, so the user can sweep an area and
collect prospects. A *Clear* action empties them. This exists because Google caps every
search at 20 results with no pagination, so more prospects only ever come from more
searches.
