---
description: 'Propose an OpenSpec change from completed RE artifacts (handoff)'
---

Propose an OpenSpec change using the completed requirements engineering artifacts as input.

**Planning boundary**: This workflow creates planning artifacts only. Do not edit project code. After the planning artifacts are complete, stop. Wait for a new user request to start the apply workflow.

**Input**: The argument after `/opsx-propose-from-re` is either:

- Two tokens: `<modulo> <feature>` (e.g., `notifications po-rejection-notification`)
- One token: a kebab-case change name (e.g., `add-po-rejection-notification`) — in this case, ask the user to confirm the module and feature, or derive them from the change name.

**Provided arguments**: $ARGUMENTS

**Steps**

1. **Load the `re-handoff` skill** — it contains the verification gates, mapping guidance, and process for bridging RE artifacts to OpenSpec.

2. **Parse arguments** — extract module and feature from the arguments:
   - If 2 tokens provided: use them as `<modulo>` and `<feature>`.
   - If 1 token provided: ask the user whether it is the change name. If yes, derive module and feature from the change name (strip prefix like `add-`, `fix-`, etc.) and confirm with the user. If no, ask for the missing module/feature pair.
   - If 0 tokens provided: ask the user for `<modulo>` and `<feature>`.

3. **Verify RE artifacts** (DoR gate) — check that all mandatory artifacts exist at `docs/requirements/<modulo>/<feature>/`:
   - `feature-brief.md` (obligatorio)
   - `business-rules.md` (obligatorio)
   - `user-story-bdd.md` (obligatorio)
   - `definition-of-ready.md` (obligatorio)
   - `nfr.md` (obligatorio — al menos críticos)
   - `traceability-matrix.md` (obligatorio — seed)
   - `adr-NNNN-<titulo>.md` (condicional — solo si hubo decisión arquitectural)
   - Sign-off (en Feature Brief o DoR — obligatorio)

   If any mandatory artifact is missing, stop and inform the user which one is missing and which skill to use to complete it.

4. **Read all RE artifacts** — load Feature Brief, Business Rules, User Story BDD, DoR, NFR, RTM, ADR (if exists), and any conditional artifacts (threat-model, compliance-matrix, spikes, uat-plan, bpmn, domain-model, data-dictionary, rfc, c4).

5. **Present summary** — show the user a summary of the RE artifacts and the mapping RE→OpenSpec (as defined in the `re-handoff` skill).

6. **Confirm with user** — ask: "¿Procedo a crear el change OpenSpec `<change-name>` con estos artefactos?" Wait for confirmation.

7. **Create the change** — once confirmed, invoke the `openspec-propose` workflow with the change name and the RE artifacts as context. The propose workflow will:
   - Run `openspec new change "<change-name>"`
   - Generate `proposal.md` (from Feature Brief + RN-xxx + Non-goals + Impact + Stakeholders)
   - Generate `specs/<cap>/spec.md` (from BDD scenarios → delta specs with RN-xxx references)
   - Generate `design.md` (referencing ADR + API design + rollback + NFR + threat model + condicionales)
   - Generate `tasks.md` (atomic tasks ≤2h with verification section)

8. **Verify post-creation** — check that all OpenSpec artifacts exist and contain the mapped RE content. Run `openspec validate --strict` if applicable.

9. **Update Trello** — delegate to `@project-manager` to update the story card with `OpenSpec: openspec/changes/<change-name>/`.

**Output**

After completing all steps, summarize:

- Change name and location
- List of OpenSpec artifacts created with brief descriptions
- Mapping from RE artifacts to OpenSpec artifacts
- Conditional artifacts included
- What's ready: "All artifacts needed for implementation are ready."
- Prompt: "Run `/opsx-apply` when ready to implement."

**Guardrails**

- Do NOT create the change if any mandatory RE artifact is missing (DoR gate).
- Do NOT duplicate RE content in OpenSpec artifacts — reference, don't copy.
- Do NOT implement the change or start the apply workflow. Stop after artifacts are presented.
- If a change with that name already exists, ask if user wants to continue it or create a new one.
