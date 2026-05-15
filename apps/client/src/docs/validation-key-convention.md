# Validation Message Key Naming Convention

## Naming Convention

Use module-prefixed flat keys with a `zod.` namespace:
- Format: `zod.{module}.{field}.{validationType}`
- Example: `zod.auth.email.empty`, `zod.auth.password.minLength`

## Validation Types

- `empty` - Required field validation
- `invalid` - Invalid format (email, URL, etc.)
- `minLength` - Minimum length validation
- `maxLength` - Maximum length validation
- `min` - Minimum value validation
- `max` - Maximum value validation
- `email` - Email format validation
- `url` - URL format validation
- `pattern` - Regex pattern validation
- `refine` - Custom validation messages

## Module Prefixes

- `auth` - Authentication module
- `notes` - Notes module
- `users` - Users module
- `products` - Products module
- `providers` - Providers module
- `warehouse` - Warehouse module
- `stock` - Stock module
- `sales` - Sales module
- `purchase` - Purchase module
- `clients` - Clients module
- `employees` - Employees module
- `events` - Events module
- `expenses` - Expenses module
- `payroll` - Payroll module
- `performanceEvaluation` - Performance evaluation module
- `permission` - Permission module
- `vacation` - Vacation module
- `attendance` - Attendance module
- `inventoryMovement` - Inventory movement module
- `providerOrder` - Provider order module
- `clientOrder` - Client order module
- `settingsProductCategories` - Settings product categories module
- `news` - News module
- `settings` - Settings module
- `home` - Home module

## Examples

```json
zod.auth.email.empty: "You must enter your email."
zod.auth.email.invalid: "Invalid email address."
zod.auth.password.minLength: "You must enter at least {{count}} characters."
zod.auth.password.maxLength: "You must enter a maximum of {{count}} characters."
zod.products.sku.empty: "SKU is required."
zod.products.price.min: "Price must be at least {{count}}."
```

## Usage in Zod Schemas

```javascript
import { getZodMessage, getZodMinMaxMessage } from '@/utils/zod-i18n-map';

export const schema = z.object({
  email: z
    .string({ required_error: getZodMessage('zod.auth.email.empty') })
    .email({ message: getZodMessage('zod.auth.email.invalid') }),
  password: z
    .string({ required_error: getZodMessage('zod.auth.password.empty') })
    .min(6, { message: getZodMinMaxMessage('zod.auth.password.minLength', 6) })
    .max(16, { message: getZodMinMaxMessage('zod.auth.password.maxLength', 16) }),
});
```