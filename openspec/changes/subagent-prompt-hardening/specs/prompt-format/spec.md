## MODIFIED Requirements

### Requirement: OUTPUT CONTRACT positioned as last substantive section
**MODIFIED: Requirement cambiado de "before REMEMBER" a "última sección sustantiva antes de sign-off"**

Every agent prompt SHALL contain a `## OUTPUT CONTRACT` section positioned as the LAST substantive section before sign-off. Short sign-off sections like `## REMEMBER` (brief reminder block) MAY appear after `## OUTPUT CONTRACT`.

#### Scenario: OUTPUT CONTRACT positioned as last substantive section
- **WHEN** reviewing an agent prompt file at `docs/opencode/prompts/<agent>.md`
- **THEN** it MUST contain a `## OUTPUT CONTRACT` section
- **AND** no other SUBSTANTIVE top-level section (`## SELF-VALIDATION`, `## Guardrails Layer 4`, etc.) SHALL follow the OUTPUT CONTRACT section
- **AND** only short sign-off sections (e.g., `## REMEMBER` brief reminder block, typically <10 lines) MAY appear after OUTPUT CONTRACT

#### Scenario: SELF-VALIDATION and Guardrails Layer 4 positioned before OUTPUT CONTRACT
- **WHEN** a prompt has `## SELF-VALIDATION`, `## Guardrails Layer 4 (Pre-Execution Prevention)`, and `## OUTPUT CONTRACT` sections
- **THEN** `## SELF-VALIDATION` and `## Guardrails Layer 4` MUST appear BEFORE `## OUTPUT CONTRACT`
- **Reason**: Lost-in-the-middle effect (Liu et al. 2023, Attention Basin ACL 2026) — the OUTPUT CONTRACT must be near the end of the prompt for maximum recency weight. Sections that validate or guard execution are substantive and should not push OUTPUT CONTRACT toward the middle.

#### Scenario: Missing OUTPUT CONTRACT section
- **WHEN** an agent prompt has no `## OUTPUT CONTRACT` heading
- **THEN** the coverage gate reports a violation

#### Scenario: REMEMBER brief reminder after OUTPUT CONTRACT (deprecated legacy rule superseded)
- **WHEN** a prompt has both `## OUTPUT CONTRACT` and `## REMEMBER` sections
- **THEN** `## REMEMBER` MAY appear AFTER `## OUTPUT CONTRACT` provided it is a brief sign-off block (typically <10 lines, no substantive instructions)
- **Reason**: Previous rule required "OUTPUT CONTRACT before REMEMBER" — this is SUPERSEDED. The new rule treats REMEMBER as a short sign-off, not a substantive section. Lost-in-the-middle effect dictates that OUTPUT CONTRACT (the most important instruction) should be at the end.
