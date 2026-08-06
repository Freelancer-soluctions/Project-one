## Context

See proposal.md - Why for motivation. Current state: no `.gitattributes`, no `.editorconfig`; effective `core.autocrlf=true` comes only from the system gitconfig (`C:\Program Files\Git\etc\gitconfig`). Index blobs hold CRLF while Prettier (`.prettierrc` `endOfLine: "lf"`) writes LF to the working tree, producing ~391 whole-file phantom diffs. `npm run format` runs whole-workspace Prettier globs, and lint-staged re-triggers that glob on every commit. Branch `feature/ai-setup` is un-merged, making this an ideal low-risk moment to renormalize.

## Goals / Non-Goals

**Goals:**

- Make LF the repo-level contract enforced at the git and editor layers, independent of any developer's local gitconfig
- Eliminate phantom LF↔CRLF diffs so `git status`/`git diff` show only real changes
- Keep Windows shell scripts (`.bat`/`.cmd`/`.ps1`) as CRLF for cmd.exe compatibility
- Preserve git history (do not rewrite prior commits' blobs)
- Remove the whole-workspace churn amplifier from lint-staged

**Non-Goals:**

- Not rewriting historical commit blobs (history preserved)
- Not changing `.prettierrc` `endOfLine` value (kept `lf`)
- Not introducing `core.autocrlf=false` as a substitute (not portable)
- No runtime, database, API, or application-code changes

## Decisions

**D1 — Add root `.gitattributes` as the repo-level contract.**
`* text=auto eol=lf` plus explicit `text eol=lf` entries for `.js/.jsx/.ts/.tsx/.cjs/.mjs/.json/.md/.css/.yml/.yaml/.prisma`, explicit `text eol=crlf` for `.bat/.cmd/.ps1`, and `binary` for `.png/.jpg/.jpeg/.ico/.woff/.woff2`.

- Rationale: `.gitattributes` is the portable, repo-level contract that overrides any local `core.autocrlf`. `eol=lf` forces LF in the working tree regardless of platform.
- Alternatives considered: relying on `core.autocrlf=true` (rejected — machine-local, not portable, and is the current source of the bug); `core.autocrlf=false` (rejected — not portable, per-developer).

**D2 — Add root `.editorconfig` for editor consistency.**
`root = true`; `[*]` with `charset = utf-8`, `end_of_line = lf`, `insert_final_newline = true`, `trim_trailing_whitespace = true`, `indent_style = space`, `indent_size = 2`; `[*.md]` disables `trim_trailing_whitespace`; `[*.{bat,cmd,ps1}]` sets `end_of_line = crlf`.

- Rationale: aligns editors with the git contract so files are authored as LF from the start, preventing re-introduction of CRLF.

**D3 — Keep `.prettierrc` `endOfLine: "lf"` (gate decision).**

- Rationale: `lf` is the correct gate. `auto` would reintroduce CRLF on Windows because Prettier would detect the platform default. No change to `.prettierrc`.

**D4 — Retarget lint-staged to staged-only files.**
Replace the `npm run format` / `npm run lint` invocations (which re-trigger the whole-workspace globs) with direct Prettier/ESLint commands that lint-staged appends the staged file list to:

```json
"lint-staged": {
  "*.{js,jsx,ts,tsx,cjs,mjs,json,jsonc,md}": "prettier --write",
  "*.{js,jsx,cjs,mjs}": "eslint --fix --max-warnings 0"
}
```

- Rationale: lint-staged passes the staged file paths as arguments, so only changed files are formatted/linted — eliminating the whole-workspace churn amplifier on every commit.
- `jsonc` is restored to the Prettier glob (it was split out and only ran `npm run format`). The ESLint rule is scoped to `js/jsx` per the actual workspace ESLint setup; `ts/tsx` are dropped because no TS parser exists in this repo (verified: zero `.ts`/`.tsx` files). `d.cts`/`d.mts` are intentionally NOT added to the Prettier glob — no TypeScript/declaration files exist, so they would be dead configuration.

**D5 — Renormalize in a 2-commit sequence: config files committed first (normal hooks), then mechanical renormalize with a JUSTIFIED one-time `--no-verify` exception.**
The renormalize fires only after `.gitattributes` lands in HEAD (committed), because git applies checkout/attribute filters against HEAD's attribute set, not against staged-but-uncommitted content. A single combined commit (the original approach) is therefore impossible: `git add --renormalize .` would no-op against an already-LF index (git auto-normalized on prior `add` under `core.autocrlf=true`), and force-checkout patterns (`git checkout-index --force --all`) write raw blobs without applying eol filters. The workflow is:

1. **B6a** — `git add .gitattributes .editorconfig` → `git commit -m "chore: add .gitattributes and .editorconfig for LF normalization"` (hooks run normally; these files are not in the lint-staged Prettier/ESLint globs, so no `--no-verify` needed).
2. **B6b** — `git add --renormalize .` (now fires because HEAD has the new attributes) → verify `git diff --cached --ignore-space-at-eol` is empty → `git commit --no-verify -m "chore: normalize line endings to LF via .gitattributes/.editorconfig"`.

- The renormalize commit B6b MUST use `git commit --no-verify` as a JUSTIFIED, ONE-TIME exception: the staged-only lint-staged hook (`eslint --fix --max-warnings 0`, per D4) would fail on or mutate the ~818-file mechanical renormalize commit. This is the ONLY commit in the change using `--no-verify`; all other commits (including B6a) run hooks normally.
- Rationale: proves renormalize purity (hooks would inject formatting changes into the mechanical diff) and avoids hook-injected content changes.
- `git add --renormalize .` updates index and working tree only; it does NOT rewrite prior commits' blobs, so history is preserved. Conventional commit type must be `chore` to satisfy commitlint `@commitlint/config-conventional`.

## Risks / Trade-offs

- [One-time large diff on the renormalize commit] → Cosmetic and never recurs; it is the point of the change. Reviewers should expect a large but mechanical diff.
- [`* text=auto eol=lf` would break `.bat`/`.cmd`/`.ps1` for cmd.exe] → Explicit `text eol=crlf` overrides are declared for those extensions.
- [Local `core.autocrlf=false` used as a substitute] → Rejected in design; `.gitattributes` is the portable repo-level contract.
- [`git add --renormalize .` accidentally rewriting history] → It only touches index/working tree, not prior commit blobs; history is preserved.
- [Editors re-introducing CRLF] → Mitigated by `.editorconfig` (D2) and Prettier `endOfLine: lf` (D3).
- [Commit rejected by commitlint if type is wrong] → Use `chore:` per `@commitlint/config-conventional`.
- [lint-staged hook fails on or mutates the ~818-file renormalize commit] → Mitigated by the JUSTIFIED one-time `--no-verify` exception (D5, applied to B6b only); all other commits in the 2-commit B6 sequence (B6a config commit) run hooks normally. The 2-commit split is required because `git add --renormalize .` only fires after `.gitattributes` lands in HEAD — see D5 for the structural rationale.
