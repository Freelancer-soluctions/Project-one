# Tasks

## 1. Configuration edits (opencode.jsonc)

- [x] 1.1 Edit `tool_output` in `opencode.jsonc`: set `max_lines` to 150 and `max_bytes` to 16384 (from 400 / 65536); verify the file shows the new values
- [x] 1.2 Uncomment the `build`, `plan`, and `general` agent stanzas in the `agent` block so each has `"disable": true`; verify three stanzas are no longer commented
- [x] 1.3 ~~In the `developer` agent permission block, set `webfetch` and `websearch` to `"deny"` (from `"allow"`); verify both lines read `"deny"`~~ **N/A — superseded by `single-main-agent`: the `developer` agent was retired and its block deleted from `opencode.jsonc`, so there is nothing to edit. Security intent satisfied vacuously (no developer agent; global `permission` already denies both).**

## 2. Verification

- [x] 2.1 Validate `opencode.jsonc` parses as JSONC with no errors (`opencode debug config` exits 0 and prints merged config); verify exit code 0
- [x] 2.2 Smoke test agent list: run `opencode debug agents` and confirm `build`, `plan`, and `general` are absent; verify output contains none of `"id": "build"`, `"id": "plan"`, `"id": "general"`
- [x] 2.3 ~~Smoke test developer permissions: run `opencode debug agents`, locate the `developer` entry, and confirm `webfetch` and `websearch` resolve to `deny`; verify both values~~ **N/A — superseded by `single-main-agent`. Re-verified instead: `opencode debug agents` output contains no `developer` entry (confirmed absent), which is the applicable check.**
- [x] 2.4 Smoke test tool_output: confirm `opencode debug config` (or file inspection) reports `max_lines: 150` and `max_bytes: 16384`; verify both values
- [x] 2.5 Regression: grep the repo for references to the `build`/`plan`/`general` agents and confirm no workflow or script depends on them; verify no breakage in eval/test smoke (if applicable)
