# Field Limits Configuration Specification

## Purpose

Define los límites de longitud por campo para los componentes de UI del cliente (shadcn), centralizados en `FIELD_LIMITS` (`@/config/fieldLimits`), y su uso en formularios de filtros.

## Requirements

### Requirement: Field limits by module

La configuración `FIELD_LIMITS` SHALL definir un `maxLength` por campo para cada módulo del cliente, con los valores listados a continuación, y las validaciones de formulario SHALL consumir estos valores en lugar de literales sueltos.

#### Scenario: Users module

- **WHEN** se validan los campos del módulo Users, **THEN** los maxLength SHALL ser: name 100, email 254, password 100, address 250, city 35, document 128, socialSecurity 128, state 50, telephone 15, zipcode 9

#### Scenario: Notes module

- **WHEN** se validan los campos del módulo Notes, **THEN** los maxLength SHALL ser: title 50, content 2000, color 6

#### Scenario: NoteColumns module

- **WHEN** se validan los campos del módulo NoteColumns, **THEN** los maxLength SHALL ser: title 15, code 3

#### Scenario: News module

- **WHEN** se validan los campos del módulo News, **THEN** los maxLength SHALL ser: title 30, description 400

#### Scenario: Events module

- **WHEN** se validan los campos del módulo Events, **THEN** los maxLength SHALL ser: title 50, description 200, speaker 20, startTime 5, endTime 5

#### Scenario: Products module

- **WHEN** se validan los campos del módulo Products, **THEN** los maxLength SHALL ser: sku 16, name 80, description 2000, barCode 25

#### Scenario: ProductCategories module

- **WHEN** se validan los campos del módulo ProductCategories, **THEN** los maxLength SHALL ser: code 3, description 50

#### Scenario: ProductProviders module

- **WHEN** se validan los campos del módulo ProductProviders, **THEN** los maxLength SHALL ser: code 3, name 100, contactName 60, contactEmail 80, contactPhone 15, address 120

#### Scenario: ProductAttributes module

- **WHEN** se validan los campos del módulo ProductAttributes, **THEN** los maxLength SHALL ser: name 50, description 100

#### Scenario: Warehouse module

- **WHEN** se validan los campos del módulo Warehouse, **THEN** los maxLength SHALL ser: name 50, description 120, address 120

#### Scenario: Stock module

- **WHEN** se validan los campos del módulo Stock, **THEN** el maxLength SHALL ser: lot 50

#### Scenario: InventoryMovement module

- **WHEN** se validan los campos del módulo InventoryMovement, **THEN** el maxLength SHALL ser: reason 200

#### Scenario: Clients module

- **WHEN** se validan los campos del módulo Clients, **THEN** los maxLength SHALL ser: name 100, email 100, phone 15, address 120

#### Scenario: Employees module

- **WHEN** se validan los campos del módulo Employees, **THEN** los maxLength SHALL ser: name 100, lastName 100, dni 128, phone 15, email 100, address 120, position 100, department 100, salary 128

#### Scenario: Payroll module

- **WHEN** se validan los campos del módulo Payroll, **THEN** los maxLength SHALL ser: baseSalary 128, extraHours 128, deductions 128, totalPayment 128

#### Scenario: PerformanceEvaluation module

- **WHEN** se validan los campos del módulo PerformanceEvaluation, **THEN** el maxLength SHALL ser: comments 200

#### Scenario: Permission module

- **WHEN** se validan los campos del módulo Permission, **THEN** los maxLength SHALL ser: type 100, reason 500, comments 1000

#### Scenario: Search module

- **WHEN** se validan los campos del módulo Search, **THEN** el maxLength SHALL ser: searchTerm 100

#### Scenario: Expenses module

- **WHEN** se validan los campos del módulo Expenses, **THEN** el maxLength SHALL ser: description 255

#### Scenario: ProviderOrder module

- **WHEN** se validan los campos del módulo ProviderOrder, **THEN** el maxLength SHALL ser: notes 200

### Requirement: Filter forms use FIELD_LIMITS

Los formularios de filtros SHALL usar `FIELD_LIMITS` de la configuración centralizada, en particular `search.searchTerm: 100` en NotesFilters y EventFiltersForm.

#### Scenario: Migrated filter forms

- **WHEN** se renderiza un formulario de filtros, **THEN** SHALL usar `FIELD_LIMITS` de la configuración centralizada
- **WHEN** se limita la longitud del input de búsqueda, **THEN** SHALL aplicarse `search.searchTerm: 100` en NotesFilters y EventFiltersForm
- **THEN** los siguientes 10 formularios de filtros SHALL usar FIELD_LIMITS: UsersFiltersForm, EmployeesFiltersForm, ClientsFiltersForm, ProductsFiltersForm, WarehouseFiltersForm, StockFiltersForm, ProvidersFiltersForm, NewsFiltersForm, ExpensesFiltersForm, SettingsProductCategoriesFiltersForm
