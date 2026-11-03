# Tasks: git-permissions-hardening

## Configuration Edits

- [x] 1.1 Open `opencode.jsonc` and locate `agent.orchestrator.permission` (currently `"bash": "ask"`)
- [x] 1.2 Replace `"bash": "ask"` with the `permission.bash` object from design.md D1 (15 patterns: 6 allow + 9 deny, per design D1/D2 ordering). Design D1/D2 is authoritative — not the shorter proposal bullet list.

## Verification

- [x] 2.1 Verify the `permission.bash` object matches design.md D1 pattern list exactly (verified: 6 allow + 8 deny + 1 ask = 15 keys; the design's "9 deny" label counts the ask entry)
- Omitted 2.2 — Test a safe command executes without approval prompt. Reason: permission prompts only exist in an interactive OpenCode session; they cannot be exercised headlessly.
- Omitted 2.3 — Test destructive commands are DENIED. Reason: needs an interactive session to observe the prompt/deny decision; the first-match-wins mapping is verified statically by 2.1/2.6 instead.
- Omitted 2.4 — Test unmatched commands prompt for approval. Reason: interactive-only; the `"*": "ask"` catch-all is verified statically.
- Omitted 2.5 — Regression: `/commit-all` end-to-end. Reason: requires an orchestrator session and a real commit; not run in this batch.
- [x] 2.6 Verify pattern syntax against `docs/opencode/opencode-guide.md` §3.4/§8.1/§8.2

## Commit

- [x] 3.1 Stage changes and create Conventional Commit: `feat(permissions): add bash permission patterns to orchestrator agent` (commit `e77bd25e`, signed + DCO signoff, only the `permission.bash` hunk staged)
