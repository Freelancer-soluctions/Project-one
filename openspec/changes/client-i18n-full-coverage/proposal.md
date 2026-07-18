## Why

The application apps/client has i18n partially implemented using i18next and react-i18next, but several business modules outside of components still contain hard-coded strings. Zod validation schemas also use static messages that are not translatable. This change normalizes i18n across the entire client, excluding the components directory.

## What Changes

- Scan and migrate hard-coded strings in business modules to translation keys
- Add translation keys for all Zod validation messages
- Extend existing locale files (EN/ES) with new keys per namespace
- Ensure fallback language (EN) and default language (ES) are properly configured

## Capabilities

### New Capabilities
- `i18n-business-modules`: Full i18n coverage for all business modules outside components (pages, hooks, features, routes, modules)
- `zod-i18n-messages`: Translatable Zod validation messages using a runtime resolver helper

### Modified Capabilities

## Impact

- Affects apps/client/src/ excluding components
- Zod schemas across modules will be updated
- Locale JSON files will be extended with new keys
