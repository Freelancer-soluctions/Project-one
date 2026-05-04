# Guía de Referencia - Documentación JSDoc

Esta guía proporciona ejemplos y patrones para documentar funciones en controller, service y dao layers siguiendo el estándar establecido.

## Patrones de Referencia

### 1. Controller Layer (Express Request/Response)

#### Patrón Básico - Controller con req/res

```javascript
/**
 * Handle user sign-up.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.body - Request body containing user registration data
 * @param {string} req.body.email - User email address
 * @param {string} req.body.password - User password
 * @param {string} req.body.name - User display name
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Creates new user account and returns user object
 */
export const signUp = handleCatchErrorAsync(async (req, res) => {
  // implementation
});
```

#### Patrón con req.params

```javascript
/**
 * Get a client by ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.params - Request parameters
 * @param {string} req.params.id - Client ID from URL
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns client data
 */
export const getClientById = handleCatchErrorAsync(async (req, res) => {
  // implementation
});
```

#### Patrón con req.userId (autenticado)

```javascript
/**
 * Retrieve the user session.
 * Gets current user session data based on authenticated user ID.
 *
 * @param {Object} req - The HTTP request object.
 * @param {string} req.userId - Authenticated user ID from token verification
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns user session data including profile information
 */
export const session = handleCatchErrorAsync(async (req, res) => {
  // implementation
});
```

#### Patrón con req.cookies

```javascript
/**
 * Refresh the user token.
 * Rotates refresh token and generates new access token for continued session.
 *
 * @param {Object} req - The HTTP request object.
 * @param {Object} req.cookies - Request cookies containing refresh token
 * @param {string} req.cookies.jwt - HTTP-only refresh token cookie
 * @param {Object} res - The HTTP response object.
 * @returns {Promise<void>} Returns new access token and updates refresh token cookie
 */
export const refreshToken = handleCatchErrorAsync(async (req, res) => {
  // implementation
});
```

### 2. Service Layer (Lógica de Negocio)

#### Patrón con objeto de datos completo

```javascript
/**
 * Create a new product in the database.
 *
 * @param {number} userId - The ID of the user creating the product.
 * @param {Object} data - The data for the new product.
 * @param {string} data.sku - The unique SKU of the product (max 16 characters).
 * @param {string} data.name - The name of the product (max 80 characters).
 * @param {number} data.productCategoryId - The ID of the product category.
 * @param {number} data.productProviderId - The ID of the product provider.
 * @param {number} data.price - The price of the product (decimal with 2 decimal places).
 * @param {number} data.cost - The cost of the product (decimal with 2 decimal places).
 * @param {number} data.stock - The initial stock quantity (integer, min 0).
 * @param {string} data.description - The product description (max 2000 characters).
 * @param {number} data.productStatusId - The ID of the product status.
 * @param {string} [data.barCode] - The optional barcode of the product (max 25 characters).
 * @returns {Promise<Object>} The created product.
 */
export const createOne = async (userId, data) => {
  // implementation
};
```

#### Patrón con filtros y paginación

```javascript
/**
 * Get all products from the database with optional filters.
 *
 * @param {Object} params - The parameters for filtering products.
 * @param {string} name - The name filter.
 * @param {string} productProviderCode - The product provider code filter.
 * @param {string} productCategoryCode - The product category code filter.
 * @param {string} statusCode - The status code filter.
 * @param {number} limit - Filter by limit
 * @param {number} page - Filter by page
 * @returns {Promise<Array>} A list of products matching the filters.
 */
export const getAllProducts = async ({
  name,
  productProviderCode,
  productCategoryCode,
  statusCode,
  limit,
  page,
}) => {
  // implementation
};
```

#### Patrón con ID y objeto de datos

```javascript
/**
 * Update an existing product in the database by its ID.
 *
 * @param {number} userId - The ID of the user updating the product.
 * @param {number} id - The ID of the product to update.
 * @param {Object} data - The updated data for the product.
 * @param {string} data.statusCode - The updated status code of the product.
 * @returns {Promise<Object>} The updated product.
 */
export const updateById = async (userId, id, data) => {
  // implementation
};
```

#### Patrón simple con ID

```javascript
/**
 * Delete a product from the database by its ID.
 *
 * @param {number} id - The ID of the product to delete.
 * @returns {Promise<Object>} The result of the deletion.
 */
export const deleteById = async (id) => {
  // implementation
};
```

### 3. DAO Layer (Acceso a Datos)

#### Patrón con filtros opcionales

```javascript
/**
 * Get all sales with optional filters
 * @param {Object} filters - Optional filters for the query
 * @param {number} [filters.clientId] - Filter by client ID
 * @param {Date} [filters.startDate] - Filter by start date
 * @param {Date} [filters.endDate] - Filter by end date
 * @param {number} [filters.minTotal] - Filter by minimum total
 * @param {number} [filters.maxTotal] - Filter by maximum total
 * @param {number} take - take to filter by
 * @param {number} skip - skip to filter by
 * @returns {Promise<Array>} List of sales with their related data
 */
export const getAllSales = async (filters = {}, take, skip) => {
  // implementation
};
```

#### Patrón con objeto de datos completo

```javascript
/**
 * Create a new sale with details
 * @param {Object} data - Sale data
 * @param {number} data.clientId - Client ID
 * @param {number} data.total - Total amount
 * @param {Array} data.details - Array of sale details
 * @param {number} data.createdBy - User ID who created the sale
 * @returns {Promise<Object>} Created sale with related data
 */
export const createSale = async (data) => {
  // implementation
};
```

#### Patrón con ID y objeto de datos (update)

```javascript
/**
 * Update a sale by ID
 * @param {number} id - Sale ID
 * @param {Object} data - Updated sale data
 * @param {number} [data.clientId] - Client ID
 * @param {number} [data.total] - Total amount
 * @param {Array} [data.details] - Array of sale details
 * @param {number} data.updatedBy - User ID who updated the sale
 * @returns {Promise<Object>} Updated sale with related data
 */
export const updateSaleById = async (id, data) => {
  // implementation
};
```

## Documentación de Errores (@throws)

### Error genérico para validación

```javascript
/**
 * Get all employees with optional filters
 * @param {Object} filters - Optional filters for the query
 * @returns {Promise<Array>} List of employees
 * @throws {Error} When pagination parameters are missing or invalid
 */
export const getAllEmployees = async (filters) => {
  const { take, skip } = getSafePagination({
    page: filters.page,
    limit: filters.limit,
  });

  if (!take || take <= 0) {
    throw new Error('Pagination is required');
  }
  return getAllEmployeesDao(filters, take, skip);
};
```

### ClientError para errores HTTP

```javascript
/**
 * Sign up a new user.
 *
 * @param {Object} user - The user object containing user details.
 * @returns {Promise<Object>} An object containing the access token and user details.
 * @throws {ClientError} When email is already registered (400)
 * @throws {ClientError} When password is too weak (400)
 */
export const signUp = async (user) => {
  // validation
  if (!validatePasswordStrength(user.password)) {
    throw new ClientError(
      'La contraseña es demasiado débil. Intenta con una más segura.',
      400
    );
  }
  
  const emailExists = await getUserRegisteredByEmail(user.email);
  if (Object.keys(emailExists).length) {
    throw new ClientError('Este correo ya esta registrado.', 400);
  }
  // implementation
};
```

## Ejemplos de Uso (@example)

### Ejemplo para función con parámetros complejos

```javascript
/**
 * Get all products from the database with optional filters.
 *
 * @param {Object} params - The parameters for filtering products.
 * @param {string} name - The name filter.
 * @param {string} productProviderCode - The product provider code filter.
 * @param {string} productCategoryCode - The product category code filter.
 * @param {string} statusCode - The status code filter.
 * @param {number} limit - Filter by limit
 * @param {number} page - Filter by page
 * @returns {Promise<Array>} A list of products matching the filters.
 * 
 * @example
 * // Get products with filters
 * const products = await getAllProducts({
 *   name: 'Laptop',
 *   productProviderCode: 'DELL',
 *   productCategoryCode: 'ELEC',
 *   statusCode: 'ACTIVE',
 *   limit: 20,
 *   page: 1
 * });
 */
export const getAllProducts = async ({
  name,
  productProviderCode,
  productCategoryCode,
  statusCode,
  limit,
  page,
}) => {
  // implementation
};
```

## Reglas Generales

1. **Siempre documentar:**
   - Todos los parámetros con sus tipos
   - Propiedades específicas de objetos (no solo "Object")
   - Tipo de retorno con Promise
   - Errores lanzados con @throws

2. **Usar tipos específicos:**
   - `{string}` para strings
   - `{number}` para números
   - `{Object}` para objetos
   - `{Array}` para arrays
   - `{Promise<Object>}` para promesas que retornan objetos
   - `{Promise<Array>}` para promesas que retornan arrays
   - `{Promise<void>}` para funciones que no retornan nada

3. **Parámetros opcionales:**
   - Usar corchetes: `[paramName]`
   - Ejemplo: `@param {string} [data.barCode] - Optional barcode`

4. **Descripciones:**
   - Ser concisos pero claros
   - Incluir restricciones cuando sea relevante (max length, min value, etc.)
   - Explicar qué hace la función, no cómo lo hace

5. **Orden de parámetros:**
   - Primero los parámetros simples (id, userId, etc.)
   - Luego los objetos complejos (data, filters, params)
   - Finalmente los parámetros de Express (req, res) en controllers

6. **@throws:**
   - Documentar todos los errores que la función puede lanzar
   - Incluir el tipo de error y cuándo se lanza
   - Para ClientError, incluir el código de estado HTTP

7. **@example:**
   - Incluir solo para funciones con patrones de uso no triviales
   - Mostrar ejemplos reales de cómo llamar a la función
   - Usar datos de ejemplo realistas
