## ADDED Requirements

### Requirement: Re-enable strict silent-exit detection
The re-enable procedure SHALL restore the strict detection (envelope-less output triggers retry) and the Layer-2 observe-only plugin, so a future review/research session can evaluate the stricter behavior or apply an alternative root-cause fix.

#### Scenario: Restore the Layer-2 plugin
- **WHEN** a user wants to re-enable strict silent-exit detection
- **THEN** the user SHALL uncomment line 6 of `opencode.jsonc` to restore `"./.opencode/plugins/output-contracts.ts",`
- **AND** SHALL remove the `// Disabled 2026-08-02 ...` comment lines above it

#### Scenario: Restore the missing-envelope OR-criterion
- **WHEN** a user wants to re-enable strict detection
- **THEN** the user SHALL remove the HTML comment wrapper in `docs/opencode/prompts/orchestrator.md` (the lines between `<!-- DISABLED 2026-08-02 ...` and `-->`)
- **AND** SHALL restore the bullet `- The <task_result> body does not contain a valid <output-contract> envelope (opening tag missing or malformed)` as an active OR criterion
- **AND** SHALL remove the "Envelope-less responses" soft-failure fallback paragraph added just below

#### Scenario: Restart required for plugin load
- **WHEN** the plugin is restored in `opencode.jsonc`
- **THEN** opencode SHALL be restarted (plugins load at startup) for the change to take effect

#### Scenario: Optional root-cause fix
- **WHEN** re-enabling strict detection
- **THEN** the user MAY apply one of the alternative fixes (B/C/D) from the design document to address the root cause rather than only re-enabling the strict behavior
