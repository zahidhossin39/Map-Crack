# Antigravity scheduled task: daily lead run (test)

- **Name:** Map Crack – no-website lead run (TEST)
- **Schedule:** weekdays 8:00 → cron `0 8 * * 1-5` (give each teammate a different time, e.g. 8:00 and 8:30)
- **Project / folder:** any (the online server needs no repo)
- **State:** OFF until the first manual run works

## Prompt

Run the no-website-leads skill once, as a test.
Use the map-crack MCP tools to find leads and Google Sheets (Composio) to write them.
Limits for this test run: 1 row from the Areas tab, at most 3 leads.
Start with get_team_info and use its sheet link. If there is no sheet link and no "Map Crack Leads" spreadsheet, create it with the headers from the skill and add the row "Leeds | roofer" to Areas, then continue.
Never edit or delete existing rows. Stop and report if any tool errors or no Google key is left today.
Finish with a 3-line report: leads added, area used, Google calls left today.
