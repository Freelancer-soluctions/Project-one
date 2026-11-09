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
export const swaggerOptions = {
  definition: {
    openapi: '3.1.0',
    info: { title: 'ERP API', version: '1.0.0' },
  },
  apis: [
    'src/modules/**/routes.ts',
    'src/docs/schemas.ts',
    // Schemas que completan los `$ref` de las rutas (change `ci-shifting-left`).
    'src/docs/schemas-*.ts',
  ],
};

export default swaggerOptions;
