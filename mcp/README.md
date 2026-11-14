# Map Crack MCP server

Lets any agent (Antigravity, Claude Code, Cursor) find local businesses with no website and get
verified facts for a cold call. Runs on your PC and reads keys from `.env.local`.

## Tools
| Tool | What it does | Google calls |
|---|---|---|
| `find_new_leads(area, niche, limit, no_website_only)` | New no-website leads with phone, score, opener, best call time. Never returns the same business twice. | 1-3 |
| `get_review_pain(place_id)` | Up to 5 reviews + "couldn't reach them" / website complaints | 1 |
| `get_competitors(place_id)` | Top nearby rivals that have a website + ready-made, verified gap lines | 1 |
| `update_lead(place_id, status, notes, research)` | Save progress | 0 |
| `list_leads(status, area)` | Saved leads + today's Google usage | 0 |

Leads and usage live in Turso tables `mcp_leads` and `mcp_usage`. Daily cap: 50 Google calls
(`MCP_DAILY_GOOGLE_CAP` in `.env.local` to change).

## Connect an agent
Command (use full paths outside this folder):

    node <repo>/node_modules/tsx/dist/cli.mjs --tsconfig <repo>/tsconfig.json <repo>/mcp/server.ts

- Claude Code: `.mcp.json` in the repo root already has it.
- Antigravity: add the same command under `mcpServers` in `~/.gemini/config/mcp_config.json`.

The daily workflow for the agent is the skill in `skill/no-website-leads/SKILL.md`.

## Test
`npm run mcp:test` starts the server and calls every tool (~8 Google calls, cleans up after).
