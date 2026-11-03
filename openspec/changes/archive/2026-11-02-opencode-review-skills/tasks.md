# Tasks

## 1. Create review-spec skill (extracted from planner SDD mode)

- [x] 1.1 Create `.opencode/skills/review-spec/SKILL.md` with YAML frontmatter (name, description, license, metadata) and verify file exists and parses as valid frontmatter
- [x] 1.2 Populate review-spec body with spec-review checklist: read proposal.md (problem/solution clarity), read specs/ (requirements), read design.md (architecture soundness, missing components), read tasks.md (atomicity, correct order, missing steps), feasibility flagging, task amendments suggestions, and verify checklist items match the five planner review steps
- [x] 1.3 Add explicit "Load this skill when performing a specification review" usage note and verify the skill is discoverable via `skill` tool by name `review-spec`

## 2. Create review-code skill (extracted from reviewer.md)

- [x] 2.1 Create `.opencode/skills/review-code/SKILL.md` with YAML frontmatter and verify file exists
- [x] 2.2 Populate review-code body with the five base review dimensions (correctness, security baseline, performance, code quality, testing) extracted from reviewer.md sections 1-5, and verify no duplication of conditional deep-dives
- [x] 2.3 Include severity mapping (CRITICAL/HIGH/MEDIUM/LOW) and file+line evidence requirement for critical/high, and verify examples render correctly

## 3. Create conditional review-security skill

- [x] 3.1 Create `.opencode/skills/review-security/SKILL.md` with YAML frontmatter and verify file exists
- [x] 3.2 Populate with deep security checklist: SQL injection (Prisma usage), XSS (React sanitization), auth/authz checks, sensitive data exposure, input validation (Zod), CORS configuration, rate limiting, and verify all seven items present
- [x] 3.3 Document loading triggers (auth, input handling, DB/Prisma, secrets/env, CORS, rate limiting, new/changed deps) and default-load-when-uncertain rule, and verify triggers are explicit and unambiguous

## 4. Create conditional review-react skill

- [x] 4.1 Create `.opencode/skills/review-react/SKILL.md` with YAML frontmatter and verify file exists
- [x] 4.2 Populate with React checklist: functional components only, proper hook usage (deps, cleanup), no prop drilling (context/Redux), accessibility (ARIA, keyboard nav), error boundaries, and verify all five items present
- [x] 4.3 Document loading triggers (files under apps/client/, .tsx/.jsx, JSX/React imports) and verify trigger globs are concrete

## 5. Create conditional review-express skill

- [x] 5.1 Create `.opencode/skills/review-express/SKILL.md` with YAML frontmatter and verify file exists
- [x] 5.2 Populate with Express checklist: async/await with proper error handling, correct HTTP status codes, input validation middleware, proper request/response typing, database transactions where needed, and verify all five items present
- [x] 5.3 Document loading triggers (files under apps/server/ routes/middleware/controllers/services/DAOs) and verify trigger globs are concrete

## 6. Remove inlined checklists from prompts

- [x] 6.1 Edit `docs/opencode/prompts/reviewer.md`: replace `## STANDARD REVIEW CHECKLIST (All Modes)` block (sections 1-7) with a "Load on demand" section instructing to always load `review-code` and conditionally load `review-security`/`review-react`/`review-express` per their triggers, and verify the checklist text is gone but OpenSpec-mode flow and severity/output sections remain
- [x] 6.2 ~~Edit `docs/opencode/prompts/planner.md`: replace `Your Review Checklist` (5 items) with instruction to load `review-spec` skill when performing a specification review, and verify the rest of the prompt is unchanged~~ **Satisfied-by-replacement — `planner.md` was deleted by sibling change `merge-planner-into-reviewer` (planner merged into reviewer). The requirement is carried by `docs/opencode/prompts/reviewer.md:98` ("For a specification review, load `review-spec` instead of `review-code`").**
- [x] 6.3 Add compact-output rule to reviewer.md: verdict always; critical/high with file+line; medium/low only on explicit request (default empty, may summarize counts in details), and verify rule is present and unambiguous
- [x] 6.4 Add compact-output rule to researcher.md: verdict always; critical/high with file+line; medium/low only on explicit request (default empty, may summarize counts in details), and verify rule is present and unambiguous

## 7. Reactivate output-contracts plugin re-scoped to reviewer/researcher

- [x] 7.1 Uncomment `"./.opencode/plugins/output-contracts.ts"` in `opencode.jsonc` plugin list (line 6) and verify JSONC remains valid and plugin is listed
- [x] 7.2 Add early guard in `handleToolExecuteAfter` (both V1 and V2 paths share it) after `agentName` extraction: return early when `agentName` is not in `{reviewer, researcher}`, and verify non-scoped agents skip validation/silent-exit/audit
- [x] 7.3 Confirm the guard precedes `extractTaskResult` so no silent-exit-candidate entries are written for non-scoped agents, and verify via code inspection

## 8. Update tests and verify

- [x] 8.1 Update `output-contracts.test.ts` cases that use non-scoped agents (developer, spec-manager, planner) to use reviewer/researcher or assert skip behavior, and verify tests pass
- [x] 8.2 Run the plugin test suite (`vitest` on `.opencode/plugins/output-contracts.test.ts`) and verify all tests pass
- Omitted 8.3 — Run lint on changed files and verify no lint errors. Reason: root `eslint.config.js` does not cover `.opencode/**`; `eslint` reports `output-contracts.ts` as "File ignored because no matching configuration was supplied" and cannot parse the `.ts` test file (no TS parser in that scope). Formatting was verified instead with `prettier --check` (clean).
- Omitted 8.4 — Manual verification: delegate a review task and confirm reviewer loads review-code plus applicable conditional skills and emits compact output, and verify plugin logs only reviewer/researcher. Reason: requires a live OpenCode session with a real task delegation; not runnable headlessly.
