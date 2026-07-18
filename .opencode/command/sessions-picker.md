---
description: List all root sessions and pick one to resume
---

List all root sessions and let the user pick which one to resume.

**IMPORTANT**: Do NOT execute `opencode -s` to switch sessions — that would end your own process. Instead, show the session ID and tell the user to run the command themselves.

## Workflow

1. **Fetch all root sessions**:
   ```bash
   opencode session list --format json -n 100
   ```

2. **Parse the JSON** and build a numbered list. For each session show:
   - Number
   - Title
   - Last updated date
   - Session ID (truncated is fine)

3. **Present the list** to the user with a clear prompt asking which session number they want to resume.

4. **When the user picks a number**, extract the session ID and display the exact command to run:
   ```bash
   opencode -s <session-id>
   ```
   
   Tell the user: "Run this command in your terminal to resume that session."

5. If there are no root sessions, inform the user.

## Format

Present sessions as a clean numbered list. Show the most recent first.

Example output format:

```
=== Your Sessions (22 total) ===

 1) Listing opencode sessions          May 29, 4:29 PM
 2) Filtro categoría por hashtags      May 29, 12:57 AM
 3) Websockets                         May 27, 9:45 PM
...
22) Trello card creation guide         May 17, 1:53 AM

Which session would you like to resume? (1-22, or q to quit)
```
