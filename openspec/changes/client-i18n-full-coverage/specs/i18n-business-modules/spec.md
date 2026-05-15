## ADDED Requirements

### Requirement: Business modules SHALL use translation keys for user-facing text
All business modules outside the components directory SHALL use i18n translation keys via `useTranslation` hook or `t()` function for all user-facing text instead of hard-coded strings.

#### Scenario: Pages display translated text using translation keys
- **WHEN** a page component in `apps/client/src/modules/*/pages/` renders user-facing text
- **THEN** the text SHALL be rendered using a translation key (e.g., `t('some_key')`) rather than a hard-coded string

#### Scenario: Hard-coded strings are replaced with translation keys
- **WHEN** a module contains hard-coded strings in JavaScript/JSX files outside the components directory
- **THEN** those strings SHALL be replaced with calls to the translation function using appropriate keys

#### Scenario: Non-component files use translation keys
- **WHEN** files such as hooks, utilities, or services outside the components directory contain user-facing text
- **THEN** they SHALL use translation keys via the appropriate i18n mechanism

### Requirement: Each module SHALL have corresponding translation keys in both EN and ES locale files
Each business module that requires translations SHALL have its keys added to both `apps/client/src/locale/en.json` and `apps/client/src/locale/es.json` files.

#### Scenario: New translation keys are added to both locale files
- **WHEN** a new user-facing string is added to a business module
- **THEN** the corresponding translation key SHALL be added to both `en.json` and `es.json` with appropriate English and Spanish translations

#### Scenario: Translation keys follow existing structure
- **WHEN** translation keys are added for a module
- **THEN** they SHALL be placed inside the `translation` object in both locale files, following the existing flat key-value structure

#### Scenario: Module-specific keys are identifiable
- **WHEN** multiple modules require translation keys
- **THEN** keys SHALL use a consistent naming convention that allows identifying which module they belong to (e.g., `moduleName_keyName`)

### Requirement: Missing translation keys SHALL fall back to EN
The i18n system SHALL use the existing configuration where `fallbackLng` is set to `'en'`, ensuring that missing keys in the current language default to English.

#### Scenario: Missing ES key falls back to EN
- **WHEN** a translation key exists in `en.json` but not in `es.json` and the current language is Spanish
- **THEN** the English translation SHALL be displayed as a fallback

#### Scenario: Missing key in both languages
- **WHEN** a translation key does not exist in either `en.json` or `es.json`
- **THEN** the key itself SHALL be displayed as per i18next default behavior

#### Scenario: Fallback configuration is preserved
- **WHEN** the i18n configuration in `apps/client/src/config/i18n.js` is reviewed
- **THEN** the `fallbackLng` SHALL remain set to `'en'` and SHALL NOT be modified by this change

### Requirement: The system SHALL use the existing i18next and react-i18next setup
The change SHALL leverage the existing i18n infrastructure without introducing new i18n libraries or fundamentally changing the configuration.

#### Scenario: Existing i18n config is used
- **WHEN** implementing translation keys in business modules
- **THEN** the existing `i18n` instance from `apps/client/src/config/i18n.js` SHALL be used

#### Scenario: useTranslation hook is used in React components
- **WHEN** a React component in a business module needs translations
- **THEN** it SHALL use the `useTranslation` hook from `react-i18next` as already configured

#### Scenario: No new i18n dependencies are added
- **WHEN** the change is implemented
- **THEN** no new i18n-related npm packages SHALL be added to `apps/client/package.json`
