## Why

The repository currently exhibits ~391 phantom line-ending diffs (LF↔CRLF) on Windows. Prettier is configured with `"endOfLine": "lf"` (Prettier 3.x default) and always writes LF, while the absence of `.gitattributes` and `.editorconfig` means effective `core.autocrlf=true` comes only from the system gitconfig — index blobs hold CRLF while the working tree gets LF, producing whole-file phantom diffs on every commit. The intended LF convention is already documented (oldReadme.md:310-312) but was never enforced at the git/editor layer. This change makes LF the repo-level contract so diffs become minimal and stable across all platforms.

## What Changes

- Add root `.gitattributes` declaring `* text=auto eol=lf` with explicit `text eol=lf` entries for code/text file types and explicit `text eol=crlf` for Windows shell scripts (`.bat`, `.cmd`, `.ps1`), plus `binary` markers for image/font assets
- Add root `.editorconfig` declaring `end_of_line = lf` (overridden to `crlf` for `.bat`/`.cmd`/`.ps1`), `utf-8` charset, `insert_final_newline = true`, `trim_trailing_whitespace = true` (disabled for `*.md`), `indent_style = space`, `indent_size = 2`
- Keep `.prettierrc` `"endOfLine": "lf"` unchanged (deliberate gate decision: `lf`, not `auto` — `auto` reintroduces CRLF on Windows)
- Retarget lint-staged to run Prettier/ESLint on staged-only files (lint-staged appends the staged file list to the command), removing the whole-workspace `npm run format` churn amplifier
- Land the change as 3 atomic Conventional Commits: (A) `chore: scope lint-staged to staged-only files` — root package.json tooling only; (B) `chore: normalize line endings to LF via .gitattributes/.editorconfig` — config files + `git add --renormalize .` + objective `git diff --cached --ignore-space-at-eol` check, committed with the single justified one-time exception (see design D5); (C) `docs: document line-ending convention` — docs/code-style.md
- Update `docs/code-style.md` to document the `.editorconfig` + `.gitattributes` + `endOfLine=lf` convention

## Capabilities

### New Capabilities

<!-- None. This is a pure tooling/config change with no runtime behavior change.
     `.openspec.yaml` sets `skip_specs: true` — no delta specs are created. -->

### Modified Capabilities

<!-- None. No existing spec-level REQUIREMENTS change. -->

## Impact

- **Repo config**: New root `.gitattributes` and `.editorconfig` files
- **Tooling**: `lint-staged` config in root `package.json` only retargeted to staged-only files; no more `npm run format` inside lint-staged
- **Formatting**: `.prettierrc` `endOfLine: "lf"` is kept as-is — no change
- **Docs**: `docs/code-style.md` updated with the line-ending convention
- **Git history**: Three atomic commits (tooling → renormalize → docs); one-time large renormalization diff on commit B; blobs of prior commits are NOT rewritten (history preserved); never recurs
- **Platforms**: Windows devs no longer see phantom LF/CRLF diffs; `.bat`/`.cmd`/`.ps1` remain CRLF for cmd.exe compatibility
- **No runtime/database/API changes**: No application code, endpoints, or schemas are modified
