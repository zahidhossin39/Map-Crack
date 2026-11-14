# Antigravity scheduled task: daily lead run

- **Name:** Map Crack – daily no-website leads
- **Schedule:** weekdays 7:30 → cron `30 7 * * 1-5` (each teammate a different time, e.g. 7:30 and 8:00)
- **State:** OFF until you turn it on

## Prompt

Run the no-website-leads skill.
Use the map-crack MCP tools for leads and Google Sheets (Composio) to write to the sheet from get_team_info.
Work up to 2 rows from the Areas tab and add at most 6 new leads in total.
For each lead do the full research: competitors, review complaints, and a web search for their Facebook / Instagram / Checkatrade page (keep every URL in Sources).
Only append rows. Never edit or delete existing rows, Status, Follow-up date or Notes, and don't change formatting.
Stop and report if a tool errors or no Google key is left today.
Finish with a 3-line report: leads added (names), areas done, Google calls left today.
