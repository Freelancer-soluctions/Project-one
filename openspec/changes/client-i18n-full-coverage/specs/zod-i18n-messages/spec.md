## ADDED Requirements

### Requirement: Zod validation schemas SHALL use translatable messages via a runtime resolver
All Zod validation schemas SHALL use a runtime resolver helper to provide translatable validation messages instead of hard-coded strings.

#### Scenario: Zod schema uses runtime resolver for error messages
- **WHEN** a Zod schema defines a validation rule with an error message
- **THEN** the message SHALL be provided via a runtime resolver function that looks up the translation key at validation time

#### Scenario: Runtime resolver accesses i18n instance directly
- **WHEN** the runtime resolver function is called to get a validation message
- **THEN** it SHALL use the `i18n` instance directly (imported from the config) rather than using the React `useTranslation` hook

#### Scenario: Validation messages are resolved dynamically
- **WHEN** validation occurs in a different language context
- **THEN** the validation messages SHALL reflect the current language from the i18n instance

### Requirement: The runtime resolver SHALL use the i18n instance directly (not the React hook)
The translation resolver for Zod schemas SHALL import and use the i18n instance directly since Zod schema files are not React components and cannot use hooks.

#### Scenario: Schema file imports i18n directly
- **WHEN** a Zod schema file (e.g., `schema.js`) needs translation functionality
- **THEN** it SHALL import the i18n instance directly from `apps/client/src/config/i18n.js` or a wrapper helper

#### Scenario: Resolver function calls i18n.t() directly
- **WHEN** the runtime resolver needs to get a translated string
- **THEN** it SHALL call `i18n.t('key')` directly on the i18n instance, not using any React hooks

#### Scenario: No React hooks in schema files
- **WHEN** Zod schema files are inspected
- **THEN** they SHALL NOT contain any React hook calls (useTranslation, useI18n, etc.)

### Requirement: All existing hard-coded validation messages SHALL be migrated to translation keys
All Zod schemas currently using hard-coded strings (in English or Spanish) SHALL be updated to use translation keys.

#### Scenario: Hard-coded English messages are migrated
- **WHEN** a Zod schema contains hard-coded English messages (e.g., `'Client name is required.'`)
- **THEN** the message SHALL be replaced with a call to the runtime resolver using an appropriate translation key

#### Scenario: Hard-coded Spanish messages are migrated
- **WHEN** a Zod schema contains hard-coded Spanish messages (e.g., `'El SKU es obligatorio'`)
- **THEN** the message SHALL be replaced with a call to the runtime resolver using an appropriate translation key

#### Scenario: Auth module schemaMessages pattern is migrated
- **WHEN** the auth module's `schemaMessages.js` pattern is reviewed
- **THEN** it SHALL be migrated to use the new runtime resolver approach consistent with other modules

### Requirement: Validation message translation keys SHALL follow a consistent naming convention
Translation keys for Zod validation messages SHALL follow a predictable naming convention that identifies them as validation messages.

#### Scenario: Validation keys use zod prefix or namespace
- **WHEN** a translation key is created for a Zod validation message
- **THEN** it SHALL use a consistent prefix or namespace (e.g., `zod.fieldName.validationType` or `validation_fieldName_type`)

#### Scenario: Keys are added to both locale files
- **WHEN** new validation message keys are defined
- **THEN** they SHALL be added to both `en.json` and `es.json` with appropriate translations

#### Scenario: Key naming allows easy identification
- **WHEN** developers review the locale files
- **THEN** validation-related keys SHALL be distinguishable from other UI translation keys (e.g., using a `zod_` prefix or `validation.` namespace)
