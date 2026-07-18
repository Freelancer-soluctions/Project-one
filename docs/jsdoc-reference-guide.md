# JSDoc Reference Guide

> **Team Reference for JSDoc Documentation Standards**
>
> This guide establishes the standard patterns for documenting JavaScript code with JSDoc throughout the project.
> All developers should follow these patterns to ensure consistent, maintainable, and well-documented code.

---

## Table of Contents

1. [Controller Function Pattern](#controller-function-pattern)
2. [Service Function Pattern](#service-function-pattern)
3. [DAO Function Pattern](#dao-function-pattern)
4. [@throws Documentation Pattern](#throws-documentation-pattern)
5. [@example Documentation Pattern](#example-documentation-pattern)
6. [Module List](#module-list)
7. [Priority Classification](#priority-classification)
8. [Exclusions](#exclusions)

---

## Controller Function Pattern

Controllers handle HTTP requests and responses. Document all request parameters, body properties, and response behavior.

### Standard Controller Example

```javascript
/**
 * Creates a new user account.
 *
 * @param {Object} req - The HTTP request object
 * @param {Object} req.body - The request body containing user data
 * @param {string} req.body.email - User email address (must be unique)
 * @param {string} req.body.password - User password (will be hashed)
 * @param {string} req.body.firstName - User's first name
 * @param {string} req.body.lastName - User's last name
 * @param {number} req.body.roleId - ID of the assigned role
 * @param {Object} req.params - URL parameters
 * @param {number} req.params.id - Resource ID (when applicable)
 * @param {number} req.userId - Authenticated user ID extracted from JWT token
 * @param {Object} req.cookies - Request cookies
 * @param {string} req.cookies.refreshToken - Refresh token for session management
 * @param {Object} req.safeQuery - Validated and sanitized query parameters
 * @param {number} req.safeQuery.page - Page number for pagination
 * @param {number} req.safeQuery.limit - Number of items per page
 * @param {string} req.safeQuery.sortBy - Field to sort by
 * @param {Object} res - The HTTP response object
 * @returns {Promise<void>} Sends JSON response with created user or error
 * @throws {ClientError} When email is already registered (400)
 * @throws {ClientError} When validation fails (400)
 */
async function createUser(req, res) {
  // Implementation...
}
```

### Key Points for Controllers

- Always document `req` and `res` objects
- Break down `req.body`, `req.params`, `req.query` with specific properties
- Use `req.safeQuery` for validated query parameters (our project convention)
- Use `req.userId` for authenticated user context from JWT
- Document cookie usage when applicable
- Specify return type as `Promise<void>` (controllers send responses, not return data)
- Document all possible `ClientError` throws with status codes

---

## Service Function Pattern

Services contain business logic. Document all input parameters and return types explicitly.

### Standard Service Example

```javascript
/**
 * Creates a new client in the system.
 *
 * @param {Object} data - The client data
 * @param {string} data.name - Client company or person name
 * @param {string} data.email - Client email address
 * @param {string} data.phone - Client phone number
 * @param {string} data.address - Client physical address
 * @param {string} [data.taxId] - Optional tax identification number
 * @param {string} [data.notes] - Optional notes about the client
 * @param {boolean} [data.isActive=true] - Whether the client is active
 * @param {number} data.createdBy - ID of the user creating the client
 * @returns {Promise<Object>} The newly created client object
 * @returns {Promise<Object>} { id: number, name: string, email: string, ... }
 * @throws {Error} When validation fails (missing required fields)
 * @throws {ClientError} When email is already registered (400)
 */
async function createClient(data) {
  // Implementation...
}
```

### Service with Multiple Parameters

```javascript
/**
 * Retrieves a paginated list of products with optional filtering.
 *
 * @param {Object} filters - Filter criteria
 * @param {string} [filters.search] - Search term for product name/description
 * @param {number} [filters.categoryId] - Filter by category ID
 * @param {number} [filters.minPrice] - Minimum price filter
 * @param {number} [filters.maxPrice] - Maximum price filter
 * @param {boolean} [filters.isActive] - Filter by active status
 * @param {Object} pagination - Pagination parameters
 * @param {number} pagination.page - Page number (starts at 1)
 * @param {number} pagination.limit - Items per page (max 100)
 * @param {string} [pagination.sortBy='name'] - Field to sort by
 * @param {string} [pagination.sortOrder='asc'] - Sort direction ('asc' or 'desc')
 * @returns {Promise<Array<Object>>} Array of product objects
 * @throws {Error} When pagination parameters are missing or invalid
 * @throws {ClientError} When category ID does not exist (404)
 */
async function getProducts(filters, pagination) {
  // Implementation...
}
```

### Key Points for Services

- Document the `data` or `params` object with all properties
- Use brackets `[paramName]` for optional parameters
- Specify exact return type: `Promise<Object>`, `Promise<Array>`, etc.
- Document both `Error` (validation) and `ClientError` (business logic) throws
- Include a second `@returns` with the object structure for complex returns

---

## DAO Function Pattern

Data Access Objects interact directly with the database (via Prisma). Document all query parameters and return types.

### Standard DAO Example (Find by ID)

```javascript
/**
 * Finds a user by their unique ID.
 *
 * @param {Object} where - Query conditions
 * @param {number} where.id - The user ID to search for
 * @param {Object} [options] - Additional query options
 * @param {Array<string>} [options.select] - Fields to select
 * @param {Array<string>} [options.include] - Relations to include
 * @returns {Promise<Object|null>} The user object or null if not found
 */
async function findUserById(where, options = {}) {
  // Implementation with Prisma...
}
```

### DAO with Pagination

```javascript
/**
 * Retrieves a paginated list of sales records.
 *
 * @param {Object} where - Filter conditions
 * @param {number} [where.userId] - Filter by user ID who made the sale
 * @param {Date} [where.startDate] - Filter sales after this date
 * @param {Date} [where.endDate] - Filter sales before this date
 * @param {string} [where.status] - Filter by sale status
 * @param {number} take - Number of records to retrieve (pagination)
 * @param {number} skip - Number of records to skip (pagination)
 * @param {Object} [orderBy] - Sorting configuration
 * @param {string} [orderBy.field='createdAt'] - Field to sort by
 * @param {string} [orderBy.direction='desc'] - Sort direction
 * @returns {Promise<Array<Object>>} Array of sale objects with relations
 */
async function findManySales(where, take, skip, orderBy = {}) {
  // Implementation with Prisma...
}
```

### DAO Create/Update Example

```javascript
/**
 * Creates a new inventory movement record.
 *
 * @param {Object} data - The inventory movement data
 * @param {number} data.productId - ID of the product
 * @param {number} data.warehouseId - ID of the warehouse
 * @param {string} data.type - Movement type ('in', 'out', 'adjustment')
 * @param {number} data.quantity - Quantity moved (positive number)
 * @param {string} [data.reason] - Reason for the movement
 * @param {number} data.performedBy - ID of the user performing the movement
 * @returns {Promise<Object>} The created inventory movement record
 */
async function createInventoryMovement(data) {
  // Implementation with Prisma...
}
```

### Key Points for DAOs

- Use `where` parameter for filter conditions with specific properties
- Always document `take` and `skip` for paginated queries
- Return types: `Promise<Object>`, `Promise<Array>`, `Promise<Object|null>`
- DAO functions typically don't throw business logic errors (let service handle that)

---

## @throws Documentation Pattern

Use `@throws` to document all possible errors that a function may throw.

### Basic @throws Examples

```javascript
/**
 * Validates pagination parameters.
 *
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @throws {Error} When pagination parameters are missing or invalid
 */
function validatePagination(page, limit) {
  if (!page || !limit) {
    throw new Error('Pagination parameters (page, limit) are required');
  }
  if (page < 1 || limit < 1) {
    throw new Error('Pagination parameters must be positive numbers');
  }
}
```

### @throws with ClientError Examples

```javascript
/**
 * Registers a new user account.
 *
 * @param {Object} userData - User registration data
 * @param {string} userData.email - User email
 * @param {string} userData.password - User password
 * @returns {Promise<Object>} Created user object
 * @throws {ClientError} When email is already registered (400)
 * @throws {ClientError} When password does not meet requirements (400)
 * @throws {ClientError} When role ID is invalid (400)
 */
async function registerUser(userData) {
  // Check if email exists
  const existing = await userDAO.findByEmail(userData.email);
  if (existing) {
    throw new ClientError('Email is already registered', 400);
  }
  // ...
}
```

### @throws with Multiple Error Types

```javascript
/**
 * Updates an employee's information.
 *
 * @param {number} employeeId - The employee ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated employee object
 * @throws {Error} When validation fails (missing required fields)
 * @throws {ClientError} When employee is not found (404)
 * @throws {ClientError} When email is already in use by another employee (400)
 * @throws {ClientError} When department ID does not exist (400)
 */
async function updateEmployee(employeeId, updateData) {
  // Implementation...
}
```

### @throws Documentation Rules

| Error Type | When to Use | Status Code |
|------------|------------|-------------|
| `Error` | Validation errors, missing parameters, invalid types | N/A (or 500) |
| `ClientError` | Business logic errors, not found, conflicts | 400, 404, 409, etc. |

---

## @example Documentation Pattern

Use `@example` to provide usage examples for functions.

### Simple Example

```javascript
/**
 * Calculates the total amount for a sale including tax.
 *
 * @param {number} subtotal - The sale subtotal
 * @param {number} taxRate - The tax rate (e.g., 0.16 for 16%)
 * @returns {number} The total amount
 * @example
 * // Calculate total with 16% tax
 * const total = calculateTotal(100, 0.16);
 * console.log(total); // 116
 */
function calculateTotal(subtotal, taxRate) {
  return subtotal + (subtotal * taxRate);
}
```

### Complex Example with Object Parameters

```javascript
/**
 * Creates a new purchase order.
 *
 * @param {Object} orderData - The purchase order data
 * @param {number} orderData.providerId - ID of the provider
 * @param {Array<Object>} orderData.items - Array of items to purchase
 * @param {number} orderData.items[].productId - Product ID
 * @param {number} orderData.items[].quantity - Quantity to purchase
 * @param {number} orderData.items[].unitPrice - Unit price
 * @param {string} [orderData.notes] - Optional order notes
 * @param {number} orderData.createdBy - ID of the user creating the order
 * @returns {Promise<Object>} The created purchase order with items
 * @example
 * // Create a new purchase order with two items
 * const order = await createPurchaseOrder({
 *   providerId: 123,
 *   items: [
 *     { productId: 1, quantity: 10, unitPrice: 25.50 },
 *     { productId: 5, quantity: 5, unitPrice: 100.00 }
 *   ],
 *   notes: 'Urgent order for project X',
 *   createdBy: 456
 * });
 * console.log(order.id); // 789
 * console.log(order.totalAmount); // 755.00
 */
async function createPurchaseOrder(orderData) {
  // Implementation...
}
```

### Example with Async/Await

```javascript
/**
 * Authenticates a user and returns a JWT token.
 *
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Token and user data
 * @example
 * // Authenticate user and handle the result
 * try {
 *   const authResult = await authenticateUser('user@example.com', 'password123');
 *   console.log('Token:', authResult.token);
 *   console.log('User:', authResult.user);
 * } catch (error) {
 *   console.error('Authentication failed:', error.message);
 * }
 */
async function authenticateUser(email, password) {
  // Implementation...
}
```

### @example Best Practices

1. Keep examples concise but complete
2. Show both input and expected output
3. Include error handling in examples for async functions
4. Use realistic values in examples
5. Comment the example code to explain what it does

---

## Module List

The following **24 modules** exist in `apps/server/src/modules/`:

| # | Module Name | Description |
|---|-------------|-------------|
| 1 | `attendance` | Employee attendance tracking |
| 2 | `auth` | Authentication and authorization |
| 3 | `clientOrder` | Client order management |
| 4 | `clients` | Client management |
| 5 | `employees` | Employee management |
| 6 | `events` | Event management |
| 7 | `expenses` | Expense tracking |
| 8 | `inventoryMovement` | Inventory movement tracking |
| 9 | `news` | News/articles management |
| 10 | `notes` | Notes management |
| 11 | `payroll` | Payroll processing |
| 12 | `performanceEvaluation` | Employee performance evaluations |
| 13 | `permission` | Permission management |
| 14 | `products` | Product management |
| 15 | `providerOrder` | Provider order management |
| 16 | `providers` | Provider management |
| 17 | `purchase` | Purchase management |
| 18 | `sales` | Sales management |
| 19 | `security` | Security settings and logs |
| 20 | `settings` | Application settings |
| 21 | `stock` | Stock management |
| 22 | `users` | User management |
| 23 | `vacation` | Vacation request management |
| 24 | `warehouse` | Warehouse management |

---

## Priority Classification

Modules are classified by priority to help focus documentation and testing efforts.

### Priority High (Core Business)

These modules are critical to the core business operations and should be documented first.

| Module | Priority | Reason |
|--------|----------|--------|
| `auth` | High | Authentication is required for all operations |
| `users` | High | User management is foundational |
| `clients` | High | Clients are essential for sales operations |
| `products` | High | Products are the core business entity |

### Priority Medium (Business Operations)

These modules handle day-to-day business operations.

| Module | Priority | Reason |
|--------|----------|--------|
| `sales` | Medium | Core sales operations |
| `purchase` | Medium | Core purchasing operations |
| `stock` | Medium | Inventory management |
| `inventoryMovement` | Medium | Stock movement tracking |
| `employees` | Medium | Employee management |
| `payroll` | Medium | Payroll processing |
| `attendance` | Medium | Attendance tracking |
| `vacation` | Medium | Vacation management |
| `performanceEvaluation` | Medium | Performance review process |

### Priority Low (Management & Config)

These modules handle auxiliary functions and configuration.

| Module | Priority | Reason |
|--------|----------|--------|
| `providers` | Low | Provider management |
| `providerOrder` | Low | Provider order processing |
| `clientOrder` | Low | Client order processing |
| `expenses` | Low | Expense tracking |
| `events` | Low | Event management |
| `news` | Low | News/articles |
| `notes` | Low | Notes management |
| `settings` | Low | Application configuration |
| `permission` | Low | Permission management |
| `security` | Low | Security settings |
| `warehouse` | Low | Warehouse management |

---

## Exclusions

The following files/patterns are **excluded** from JSDoc documentation requirements:

### Route Files

- **Files**: `routes.js` (or similar route definition files)
- **Reason**: These files use **Swagger/OpenAPI** documentation instead of JSDoc
- **Documentation Method**: Use OpenAPI/Swagger annotations and schema definitions

Example of what NOT to do in routes.js:
```javascript
// ❌ DON'T use JSDoc in routes.js
/**
 * @param {Object} req
 * @param {Object} res
 */
router.post('/users', userController.create);
```

Instead, use Swagger documentation in the route or controller for API spec generation.

---

## Quick Reference Cheat Sheet

### Common JSDoc Tags

| Tag | Purpose | Example |
|-----|---------|---------|
| `@param` | Function parameter | `@param {string} name - Description` |
| `@returns` | Return value | `@returns {Promise<Object>}` |
| `@throws` | Possible errors | `@throws {ClientError} When...` |
| `@example` | Usage example | `@example // code here` |
| `@type` | Variable type | `@type {number}` |
| `@typedef` | Custom type | `@typedef {Object} User` |
| `@property` | Object property | `@property {string} name` |
| `@async` | Async function | `@async` |

### Type Annotation Quick Reference

| Syntax | Meaning |
|--------|---------|
| `{string}` | String type |
| `{number}` | Number type |
| `{boolean}` | Boolean type |
| `{Object}` | Generic object |
| `{Array}` | Generic array |
| `{Array<string>}` | Array of strings |
| `{Object\|null}` | Object or null |
| `{Promise<void>}` | Promise that resolves to undefined |
| `{Promise<Object>}` | Promise that resolves to an object |
| `{string\|number}` | String or number |

---

## Enforcement

- All new code must follow these JSDoc patterns
- Pull requests missing proper JSDoc will be flagged in review
- Use this guide as reference during code reviews
- Update this guide when new patterns emerge

---

*Last updated: 2026-05-03*
