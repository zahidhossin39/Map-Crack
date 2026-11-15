# Antigravity scheduled task: daily lead run

- **Name:** Map Crack – daily no-website leads
- **Schedule:** weekdays 7:30 → cron `30 7 * * 1-5` (each teammate a different time, e.g. 7:30 and 8:00)
- **State:** OFF until you turn it on

## Prompt

Run the no-website-leads skill and follow its column rules exactly.
Use the map-crack MCP tools for leads and Google Sheets (Composio) to write to the sheet from get_team_info.
Work up to 2 rows from the Areas tab and add at most 6 new leads in total.

For every lead:
- Phone: the international number with country code, written as '+44 … (leading apostrophe).
- Fill Address, Rating and Reviews from find_new_leads.
- Run get_competitors and get_review_pain.
- Web search the business name + town for their Facebook, Instagram, TikTok, Checkatrade or Yelp page. Put their own page links in Socials (or "none found") and every URL you used in Sources.
- Write the call card from verified facts only.

Read the Leads header row first and match values to headers by name.
Only append rows. Never edit or delete existing rows, Status, Last called, Call outcome, Follow-up date or Notes, and don't change formatting.
Stop and report if a tool errors or no Google key is left today.
Finish with a 3-line report: leads added (names), areas done, Google calls left today.
