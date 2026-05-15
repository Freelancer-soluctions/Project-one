## Context

### Current i18n Architecture

The client application uses **i18next** with **react-i18next** for internationalization, initialized in `apps/client/src/config/i18n.js`.

**Configuration:**
- **Languages:** English (EN) as fallback, Spanish (ES) as default
- **Initialization:** Configured with `lng: 'es'` and `fallbackLng: 'en'`
- **Namespace structure:** Single flat namespace (`translation`) - no namespaced organization
- **Locale file location:** `apps/client/src/locale/en.json` and `apps/client/src/locale/es.json`

**Current Coverage:**
- **EN locale (`en.json`):** 382 lines with comprehensive coverage for most UI elements (news, notes, events, products, providers, warehouse, stock, sales, purchases, users, employees, attendance, payroll, vacation, permission, performance evaluation, expenses, settings)
- **ES locale (`es.json`):** Only 41 lines - severely incomplete! Only contains basic keys (news, status, search, add, clear, etc.) - missing most module translations

### Zod Schemas with Hard-Coded Messages

**22 schema files** found across all modules in `apps/client/src/modules/*/utils/schema.js`:

| Module | Hard-coded Messages | Language |
|--------|-------------------|----------|
| `notes` | 'Title is required.', 'Content note is required.' | EN |
| `users` | 'User name is required.', 'Invalid email format.', 'Telephone is required.', 'Birthday date is required.', 'Start date is required.', 'Social Security must be 9 characters.', 'Zipcode must be between 5 and 9 characters.', 'State is required', 'City is required', 'Status is required', 'Role is required' | EN |
| `products` | 'El SKU es obligatorio', 'El nombre no puede tener más de 80 caracteres', 'El nombre es obligatorio', 'Debe seleccionar una categoría', 'Debe seleccionar un estado', 'Debe seleccionar un provider', 'El precio es obligatorio', 'El precio debe ser un número positivo', 'El precio debe tener dos decimales', 'La descripción es obligatoria', 'Debe haber al menos un atributo' | **ES** |
| `providers` | 'Provider name is required.', 'Status is required.' | EN |
| `warehouse` | 'Name is required.', 'Status is required.' | EN |
| `stock` | 'Quantity is required.', 'Quantity cannot be negative.', 'Minimum quantity is required.', 'Maximum quantity is required.', 'Lot number cannot exceed 50 characters.', 'Unit measure is required.', 'Product is required.', 'Warehouse is required.' | EN |
| `sales` | 'Total is required.', 'Total cannot be negative.', 'Quantity is required.', 'Quantity must be greater than 0', 'Price is required.', 'Price cannot be negative' | EN |
| `purchase` | Same pattern as sales | EN |
| `clients` | 'Name is required.', 'Invalid email format.', 'Phone is required.', 'Address is required.' | EN |
| `employees` | 'Name is required.', 'Last name is required.', 'DNI is required.', 'Invalid email format.', 'Position is required.', 'Department is required.', 'Salary is required.' | EN |
| `events` | 'Title is required.', 'Description is required.', 'Speaker is required.', 'StartTIme is required.', 'EndTime is required.', 'Type is required' | EN |
| `expenses` | 'Description is required.', 'Category is required.' | EN |
| `payroll` | 'Month must be between 1 and 12.', 'Year must be 2000 or later.', 'Year cannot be later than {currentYear + 1}.' | EN |
| `performanceEvaluation` | 'Calification must be between 1 and 10.', 'Comments cannot exceed 200 characters.' | EN |
| `permission` | 'Reason is required.', 'Reason cannot exceed 500 characters.', 'Comments cannot exceed 1000 characters.' | EN |
| `vacation` | Uses `z.date()` with messages in schema | EN |
| `attendance` | (needs verification) | - |
| `auth` | Uses `schemaMessages.js` helper but still hard-coded: 'Por favor ingresa tu nombre.', 'You must enter your email.', 'Invalid email address.', 'You must enter your password.', 'Las contraseñas no coinciden.' | **Mixed EN/ES** |
| `clientOrder` | (needs verification) | - |
| `inventoryMovement` | 'Product is required', 'Warehouse is required' | EN |
| `providerOrder` | (needs verification) | - |
| `settingsProductCategories` | 'Description is required.', 'Name is required.', 'Code must be at most 3 characters.' | EN |

### Key Observations

1. **Inconsistent message languages:** Most schemas use English, but `products` module uses Spanish, and `auth` uses mixed languages
2. **No runtime translation:** Schemas are defined at module level where `t()` function (from `useTranslation`) is not available
3. **ES locale severely outdated:** Only 10% of EN keys have ES translations
4. **Flat namespace structure:** All keys in single `translation` namespace - not organized by module
5. **Auth module pattern:** Uses a `schemaMessages.js` helper file but messages are still hard-coded strings, not translation keys

## Goals / Non-Goals

**Goals:**
- Normalize i18n across all business modules outside components (pages, hooks, features, routes, modules)
- Make Zod validation messages translatable using a runtime resolver helper
- Extend existing locale structure with new keys per namespace (or well-organized flat keys)
- Maintain fallback to EN and default ES
- Complete the ES locale file to match EN coverage

**Non-Goals:**
- Changes to `apps/client/src/components/` (components already have i18n)
- Adding new languages beyond EN and ES
- Refactoring the existing i18n initialization (keep single namespace or organize by module - decision needed)
- Modifying the i18next configuration structure

## Decisions

### 1. Translation Key Structure

**Decision:** Use **module-prefixed flat keys** within the existing single `translation` namespace.

**Rationale:**
- Current setup uses a single flat namespace
- Changing to namespaced approach would require i18n config changes (Non-Goal)
- Module-prefixed keys provide organization without structural changes

**Pattern:**
```json
{
  "translation": {
    "notes_title_required": "Title is required.",
    "notes_content_required": "Content note is required.",
    "users_name_required": "User name is required.",
    "products_sku_required": "SKU is required."
  }
}
```

### 2. Zod Message Translation Approach

**Decision:** Create a **`createZodErrorMap()` helper** that integrates with i18next's `t()` function at runtime.

**Rationale:**
- Zod schemas are defined at module level, but `t()` from `useTranslation` is only available in React components
- Zod supports custom error maps via `z.setErrorMap()`
- We can create a helper that returns a function compatible with Zod's error map, using `i18n.t` (the direct i18n instance) which is available at module level after initialization

**Implementation Approach:**
```javascript
// apps/client/src/utils/zod-i18n-map.js
import i18n from 'i18next';

export function createZodErrorMap() {
  return (error, ctx) => {
    const ns = 'translation';
    
    // Map Zod error codes to translation keys
    const keyMap = {
      'too_small': `${ctx.data || 'field'}_min_length`,
      'too_big': `${ctx.data || 'field'}_max_length`,
      'invalid_type': `${ctx.data || 'field'}_invalid`,
      'invalid_string': `${ctx.data || 'field'}_invalid_format`,
      // ... more mappings
    };
    
    const key = keyMap[error.code] || `${ctx.data || 'field'}_invalid`;
    return i18n.t(key, { ns });
  };
}

// Usage in modules:
import { createZodErrorMap } from '@/utils/zod-i18n-map';
import { z } from 'zod';

z.setErrorMap(createZodErrorMap());

export const MySchema = z.object({...});
```

**Alternative considered:** `zod-i18n` library - rejected because it adds a dependency and we want more control over key structure.

### 3. Locale File Organization

**Decision:** Extend existing `en.json` and `es.json` files with new module-prefixed keys.

**Rationale:**
- Keeps current flat structure (no i18n config changes needed)
- Module-prefixed keys provide clear organization
- EN file is already comprehensive for UI - we're adding Zod message keys and completing ES

**ES Locale Completion Strategy:**
- Audit all EN keys and create corresponding ES translations
- Prioritize business modules (products, sales, purchases, warehouse, stock, users, etc.)
- Use consistent Spanish terminology across modules

### 4. Runtime Translation Resolution for Zod

**Decision:** Use `i18n.t` (direct i18next instance) instead of `t()` from `useTranslation()`.

**Rationale:**
- `i18n.t` is available at module level once i18n is initialized
- `useTranslation()` hook's `t` function is only available inside React components
- Zod schemas are often defined at module level (not inside components)
- The i18n instance is imported from the config file which ensures initialization order

**Implementation:**
```javascript
// In each schema file or a central setup file
import i18n from '@/config/i18n';
import { z } from 'zod';

// Set the error map once at app startup or before schema usage
z.setErrorMap((error, ctx) => {
  const translationKey = `zod_${ctx.data || 'field'}_${getErrorType(error.code)}`;
  return i18n.t(translationKey);
});
```

## Risks / Trade-offs

### Risk 1: Missing Hard-Coded Strings
**Risk:** Some hard-coded strings in business logic may be missed during migration.

**Mitigation:**
- Systematic scan using grep/search for string patterns in all modules outside components
- Create a comprehensive inventory of all user-facing strings
- Use the 22 identified schema files as a starting point
- Review each module's pages, hooks, and utils directories

### Risk 2: Breaking Existing Translations
**Risk:** Extending locale files could accidentally modify or break existing translation keys.

**Mitigation:**
- **Extend, not replace:** Only add new keys, never modify existing ones without explicit review
- Version control: All changes tracked in git for easy rollback
- Test after changes: Run the app and verify existing translations still work
- Use a script to validate JSON structure before and after

### Risk 3: Zod Translation Timing
**Risk:** Zod schemas are defined at module level, but i18n might not be fully initialized when schemas are imported.

**Mitigation:**
- Use `i18n.t` which is safe to call after initialization (returns key if not ready)
- Set Zod error map after i18n initialization in the app startup flow
- Consider lazy-loading schemas if timing issues occur
- Add fallback: if translation not found, return a default English message

### Risk 4: Inconsistent Spanish Terminology
**Risk:** Different modules might use different Spanish terms for the same concept (e.g., "Proveedor" vs "Provider").

**Mitigation:**
- Create a Spanish terminology glossary as part of this change
- Review all ES translations for consistency
- Use existing ES keys in `es.json` as the authoritative source for common terms
- Consider involving a Spanish speaker for review

### Risk 5: Large Locale File Size
**Risk:** Adding all Zod messages and completing ES translations could make locale files very large.

**Mitigation:**
- Monitor file sizes (currently en.json is 382 lines, manageable)
- Use module-prefixed keys for easy searching and maintenance
- Consider splitting only if files exceed 2000 lines (not expected)
- Current approach keeps things simple with single files

### Trade-off: Flat vs Namespaced Structure
**Decision:** Keeping flat structure (trade-off)

**Pros of flat (chosen):**
- No i18n config changes needed
- Simpler to implement
- Consistent with current setup

**Cons:**
- All keys in one file (can get large)
- Less isolated per module

**Alternative:** Namespaced approach would require i18n config changes (against Non-Goals).

### Trade-off: Dynamic vs Static Zod Messages
**Decision:** Dynamic using `i18n.t` (trade-off)

**Pros:**
- Fully translatable
- Runtime language switching works automatically

**Cons:**
- Slight performance overhead (function calls for each validation)
- Requires careful initialization timing

**Alternative:** Static keys with post-processing would be more complex and less maintainable.
