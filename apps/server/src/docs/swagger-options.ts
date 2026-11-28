/**
 * Opciones de swagger-jsdoc — fuente única del contrato OpenAPI del server.
 *
 * Corrección (change `ci-shifting-left`, capability `api-contract-linting`):
 * los globs apuntaban a `src/components/**` y `src/docs/*.js`, rutas que ya no
 * existen desde la migración a `src/modules/**`; el resultado era un documento
 * con los schemas pero SIN paths. Ahora apunta a los ficheros reales, así que
 * `GET /api/v1/docs.json` describe la API de verdad y el generador versionado
 * (`scripts/generate-openapi.ts` → `openapi.yaml`) parte de esta misma config.
 */
/**
 * Tags globales del contrato. `spectral:oas` exige que todo tag usado por una
 * operación esté declarado aquí (`operation-tag-defined`). Al mantener una
 * única lista se evita repetir el warning en cada módulo.
 */
const globalTags = [
  { name: 'Attendance', description: 'Asistencia de empleados' },
  {
    name: 'ClientOrders',
    description: 'Órdenes de cliente y conversión a venta',
  },
  { name: 'Clients', description: 'Clientes' },
  { name: 'Departments', description: 'Catálogo de departamentos' },
  { name: 'Employees', description: 'Empleados' },
  { name: 'Events', description: 'Eventos y asistentes' },
  { name: 'Expenses', description: 'Gastos operativos' },
  { name: 'Inventory Movements', description: 'Movimientos de inventario' },
  { name: 'News', description: 'Noticias internas' },
  { name: 'Payroll', description: 'Nómina' },
  {
    name: 'Performance Evaluations',
    description: 'Evaluaciones de desempeño',
  },
  { name: 'Permissions', description: 'Permisos y licencias' },
  { name: 'Positions', description: 'Catálogo de puestos de trabajo' },
  {
    name: 'ProviderOrders',
    description: 'Órdenes a proveedores y conversión a compra',
  },
  { name: 'Providers', description: 'Proveedores' },
  { name: 'Purchases', description: 'Compras' },
  { name: 'Sales', description: 'Ventas' },
  { name: 'Settings', description: 'Configuración del sistema' },
  {
    name: 'Settings Product Categories',
    description: 'Categorías de producto',
  },
  { name: 'Stock', description: 'Inventario por almacén' },
  { name: 'Users', description: 'Usuarios del sistema' },
  { name: 'Vacation', description: 'Vacaciones' },
  { name: 'Warehouse', description: 'Almacenes' },
];

export const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: { title: 'ERP API', version: '1.0.0' },
    tags: globalTags,
  },
  apis: [
    'src/modules/**/routes.ts',
    'src/docs/schemas.ts',
    // Schemas que completan los `$ref` de las rutas (change `ci-shifting-left`).
    'src/docs/schemas-shift-left.ts',
  ],
};

export default swaggerOptions;
