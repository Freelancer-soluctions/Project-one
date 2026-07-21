---
description: Create an Architecture Decision Record (ADR) for an existing change, capturing a significant architectural decision
---

Create an Architecture Decision Record (ADR) for a change that has already been explored and proposed.

I'll create an ADR that:
- documents the decision made, the alternatives considered, and its consequences
- lives outside the change folder so it persists after the change is archived
- stays in `Proposed` status until @reviewer accepts it during `/opsx-verify`

This command does not decide whether an ADR is needed — that decision is made by @orchestrator or @planner before this command is delegated. `/opsx-adr` only executes the creation.

---

**Input**: The argument after `/opsx-adr` is the change name (kebab-case) this decision belongs to. Optionally, `--supersedes <adr-id>` if this decision replaces a previously accepted ADR.

**Steps**

1. **If no input provided, ask which change this ADR belongs to**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "Which change is this architectural decision for? Provide the change name."

   **IMPORTANT**: Do NOT proceed without a valid, existing change name — an ADR cannot be created standalone, only against an already-explored change.

2. **Verify the change has enough context to justify an ADR**
```bash
   openspec status --change "<name>" --json
```
   Confirm the `proposal` and `design` artifacts both show `status: "done"`. If either is missing or pending, halt and report:
   > "ADR requires a completed design before it can be created — run /opsx-propose first."

3. **Confirm the schema supports ADRs**

   Parse the `artifacts` array from step 2. If `adr` is not listed, halt and report:
   > "This project's schema doesn't define an ADR artifact. Switch to the spec-driven-with-adr schema in openspec/config.yaml."

4. **Get ADR instructions**
```bash
   openspec instructions adr --change "<name>" --json
```
   Parse:
   - `context`, `rules`: constraints for you (never copied into the output file)
   - `template`: structure to use for the ADR
   - `instruction`: schema-specific guidance for this artifact type
   - `outputPath`: where to write it (outside `changes/`, under `openspec/adr/`)
   - `dependencies`: `proposal.md` and `design.md` — read these for context before writing

5. **If `--supersedes <adr-id>` was provided**
   - Read the referenced prior ADR at its existing path for context
   - Reference it in the new ADR's "Supersedes" section
   - Do NOT edit the prior ADR's content or status here — the actual status change on the prior ADR happens during `/opsx-verify`, when @reviewer accepts the new one

6. **Create the ADR file**
   - Use `template` as the structure — fill in its sections
   - Ground `Context` in the problem statement from `proposal.md`
   - Ground `Decision` and `Alternatives Considered` in the approach discussion from `design.md`
   - Set `Status: Proposed`
   - Show brief progress: `"Created adr"`

7. **Show final status**
```bash
   openspec status --change "<name>"
```

**Output**

After creating the ADR, summarize:
- ADR file path and the change it belongs to
- Status: `Proposed`
- Prompt: "Ready for @reviewer to accept during `/opsx-verify`."

**Artifact Creation Guidelines**

- Follow the `instruction` field from `openspec instructions adr` for what the ADR should contain
- Read `proposal.md` and `design.md` before writing — the ADR is grounded in the change, never invented independently
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file — never copy them into the output
- Never set `Status` to anything other than `Proposed` on creation — acceptance is a review-time decision, not a creation-time one

**Guardrails**
- Never create an ADR for a change without a completed `design.md`
- Never overwrite an existing ADR for this change without `--supersedes` — if one exists, ask the user whether to supersede it
- Never modify a prior ADR's content or status when superseding — only reference it in the new file
- Verify the ADR file exists after writing before reporting success