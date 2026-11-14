# Map Crack MCP server

Lets any agent (Antigravity, Claude Code, Cursor) find local businesses with no website and get
verified facts for a cold call. Built for a team: everyone shares one lead memory, so nobody is
handed a business a teammate already got.

## Tools
| Tool | What it does | Google calls |
|---|---|---|
| `get_team_info()` | Who you are, the team sheet link, calls left today | 0 |
| `claim_area(area, niche)` | Reserve a town + niche for 2 h so two agents don't work it at once | 0 |
| `find_new_leads(area, niche, limit, no_website_only)` | New no-website leads with phone, score, opener, best call time, Google Maps + Map Crack links. Stars them on the website. | 1-3 |
| `get_review_pain(place_id)` | Up to 5 reviews + "couldn't reach them" / website complaints | 1 |
| `get_competitors(place_id)` | Top nearby rivals that have a website + ready-made, verified gap lines | 1 |
| `update_lead(place_id, status, notes, research)` | Save progress | 0 |
| `list_leads(status, area)` | The team's leads + today's Google usage | 0 |

## Google keys
Every Google call (agents and the website) goes through the key pool on the **Team & keys** page
(`/team`). Keys are used top to bottom; one at its daily cap or refused by Google rests, and the
next takes over. The `.env` key is #1 (cap: `GOOGLE_DAILY_CAP`, default 300; editable on the page).

## Connect an agent
**Online (teammates, any computer):** on `/team`, add the person, copy the config it shows, put it in
their agent's MCP config (Antigravity: `~/.gemini/config/mcp_config.json`):

    { "mcpServers": { "map-crack": { "serverUrl": "https://map-crack.vercel.app/api/mcp",
      "headers": { "Authorization": "Bearer mc_..." } } } }

**Local (this PC, reads `.env.local`):**

    node <repo>/node_modules/tsx/dist/cli.mjs --tsconfig <repo>/tsconfig.json <repo>/mcp/server.ts

`.mcp.json` in the repo root already has it for Claude Code. `MAP_CRACK_MEMBER` sets your name.

The daily workflow for the agent is the skill in `skill/no-website-leads/SKILL.md`.

## Test
- `npm run mcp:test` starts the server and calls every tool (~8 Google calls, cleans up after).
- `npx tsx --tsconfig tsconfig.json mcp/pooltest.ts` checks key fallback (free calls only).
