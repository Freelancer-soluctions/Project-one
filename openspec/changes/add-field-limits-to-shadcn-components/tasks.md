# Tasks: add-field-limits-to-shadcn-components

## Phase 1: Configuration

### Task 1.1: Create Field Limits Configuration File
- [x] Create `apps/client/src/config/fieldLimits.js` with all field limits from Prisma schema
- [x] Export FIELD_LIMITS object with all modules and their field limits

## Phase 2: Implementation - Notes Module

### Task 2.1: Update NotesCreateDialog
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.notes.title} to title Input
- [x] Add characterLimit={FIELD_LIMITS.notes.content} to TiptapEditor (content)

## Phase 3: Implementation - Users Module

### Task 3.1: Update User Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.users.name} to name Input
- [x] Add maxLength={FIELD_LIMITS.users.email} to email Input
- [x] Add maxLength={FIELD_LIMITS.users.password} to password Input
- [x] Add maxLength={FIELD_LIMITS.users.address} to address Input
- [x] Add maxLength={FIELD_LIMITS.users.city} to city Input
- [x] Add maxLength={FIELD_LIMITS.users.document} to document Input
- [x] Add maxLength={FIELD_LIMITS.users.socialSecurity} to socialSecurity Input
- [x] Add maxLength={FIELD_LIMITS.users.state} to state Input
- [x] Add maxLength={FIELD_LIMITS.users.telephone} to telephone Input
- [x] Add maxLength={FIELD_LIMITS.users.zipcode} to zipcode Input

## Phase 4: Implementation - Products Module

### Task 4.1: Update Product Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.products.sku} to sku Input
- [x] Add maxLength={FIELD_LIMITS.products.name} to name Input
- [x] Add maxLength={FIELD_LIMITS.products.description} to description Textarea
- [x] Add maxLength={FIELD_LIMITS.products.barCode} to barCode Input

### Task 4.2: Update ProductCategories Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.productCategories.code} to code Input
- [x] Add maxLength={FIELD_LIMITS.productCategories.description} to description Input

### Task 4.3: Update ProductProviders Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.productProviders.code} to code Input
- [x] Add maxLength={FIELD_LIMITS.productProviders.name} to name Input
- [x] Add maxLength={FIELD_LIMITS.productProviders.contactName} to contactName Input
- [x] Add maxLength={FIELD_LIMITS.productProviders.contactEmail} to contactEmail Input
- [x] Add maxLength={FIELD_LIMITS.productProviders.contactPhone} to contactPhone Input
- [x] Add maxLength={FIELD_LIMITS.productProviders.address} to address Input

### Task 4.4: Update ProductAttributes Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.productAttributes.name} to name Input
- [x] Add maxLength={FIELD_LIMITS.productAttributes.description} to description Input

## Phase 5: Implementation - Events Module

### Task 5.1: Update Event Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.events.title} to title Input
- [x] Add maxLength={FIELD_LIMITS.events.description} to description Textarea
- [x] Add maxLength={FIELD_LIMITS.events.speaker} to speaker Input
- [x] Add maxLength={FIELD_LIMITS.events.startTime} to startTime Input
- [x] Add maxLength={FIELD_LIMITS.events.endTime} to endTime Input

## Phase 6: Implementation - Clients Module

### Task 6.1: Update Client Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.clients.name} to name Input
- [x] Add maxLength={FIELD_LIMITS.clients.email} to email Input
- [x] Add maxLength={FIELD_LIMITS.clients.phone} to phone Input
- [x] Add maxLength={FIELD_LIMITS.clients.address} to address Input

## Phase 7: Implementation - Employees Module

### Task 7.1: Update Employee Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.employees.name} to name Input
- [x] Add maxLength={FIELD_LIMITS.employees.lastName} to lastName Input
- [x] Add maxLength={FIELD_LIMITS.employees.dni} to dni Input
- [x] Add maxLength={FIELD_LIMITS.employees.phone} to phone Input
- [x] Add maxLength={FIELD_LIMITS.employees.email} to email Input
- [x] Add maxLength={FIELD_LIMITS.employees.address} to address Input
- [x] Add maxLength={FIELD_LIMITS.employees.position} to position Input
- [x] Add maxLength={FIELD_LIMITS.employees.department} to department Input
- [x] Add maxLength={FIELD_LIMITS.employees.salary} to salary Input

## Phase 8: Implementation - Other Modules

### Task 8.1: Update Warehouse Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.warehouse.name} to name Input
- [x] Add maxLength={FIELD_LIMITS.warehouse.description} to description Input
- [x] Add maxLength={FIELD_LIMITS.warehouse.address} to address Input

### Task 8.2: Update Stock Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.stock.lot} to lot Input

### Task 8.3: Update InventoryMovement Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.inventoryMovement.reason} to reason Textarea

### Task 8.4: Update News Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.news.description} to description Textarea

### Task 8.5: Update NoteColumns Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.noteColumns.title} to title Input
- [x] Add maxLength={FIELD_LIMITS.noteColumns.code} to code Input

### Task 8.6: Update Payroll Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.payroll.baseSalary} to baseSalary Input
- [x] Add maxLength={FIELD_LIMITS.payroll.extraHours} to extraHours Input
- [x] Add maxLength={FIELD_LIMITS.payroll.deductions} to deductions Input
- [x] Add maxLength={FIELD_LIMITS.payroll.totalPayment} to totalPayment Input

### Task 8.7: Update PerformanceEvaluation Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.performanceEvaluation.comments} to comments Textarea

### Task 8.8: Update Permission Forms
- [x] Import FIELD_LIMITS from '@/config/fieldLimits'
- [x] Add maxLength={FIELD_LIMITS.permission.type} to type Input

## Phase 9: Verification

### Task 9.1: Test All Forms
- [x] Verify maxLength attributes work correctly
- [x] Test that forms prevent exceeding character limits
- [x] Verify visual feedback for character limits

### Task 9.2: Code Review
- [x] Review all changes for consistency
- [x] Ensure all fields from schema are covered