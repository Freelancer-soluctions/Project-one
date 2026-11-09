/**
 * Genera `openapi.yaml` a partir de las anotaciones `@openapi` de las rutas y
 * los schemas — change `ci-shifting-left`, capability `api-contract-linting`.
 *
 * Uso (desde `apps/server`): `npm run openapi:generate`
 *
 * El fichero generado se VERSIONA y es lo que lintan Spectral (`npm run lint:api`)
 * y el job `api-contract` de CI. Sin generador, el contrato sería una copia
 * manual condenada a divergir de las anotaciones.
 *
 * Normalización de paths: las anotaciones usan dos prefijos (`/v1/...` y
 * `/api/v1/...`) para el mismo montaje real (`app.use('/api/v1', routes)` en
 * `src/app.ts`). El generador unifica a `/api/v1/...` para que el contrato
 * refleje la URL real, sin tocar las anotaciones módulo a módulo.
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import swaggerJSDoc from 'swagger-jsdoc';
import { stringify } from 'yaml';
import { swaggerOptions } from '../src/docs/swagger-options.ts';

const HERE = dirname(fileURLToPath(import.meta.url));
const SERVER_ROOT = join(HERE, '..');
const OUTPUT = join(SERVER_ROOT, 'openapi.yaml');

const HEADER = `# GENERADO por scripts/generate-openapi.ts — NO editar a mano.
# Regenerar: cd apps/server && npm run openapi:generate
# Lint del contrato: npm run lint:api (Spectral, .spectral.yaml)
`;

const normalizePath = (path: string): string =>
  path.startsWith('/v1/') ? `/api${path}` : path;

const spec = swaggerJSDoc(swaggerOptions) as {
  paths?: Record<string, unknown>;
  [key: string]: unknown;
};

const rawPaths = spec.paths ?? {};
const normalizedPaths: Record<string, unknown> = {};

for (const [path, item] of Object.entries(rawPaths)) {
  const target = normalizePath(path);
  if (normalizedPaths[target]) {
    throw new Error(
      `Colisión de paths al normalizar: '${path}' y otro path ya ocupan '${target}'.`
    );
  }
  normalizedPaths[target] = item;
}

spec.paths = Object.fromEntries(
  Object.entries(normalizedPaths).sort(([a], [b]) => a.localeCompare(b))
);

writeFileSync(
  OUTPUT,
  HEADER + stringify(spec, { sortMapEntries: true }),
  'utf8'
);

const operationCount = Object.values(spec.paths).reduce(
  (acc, item) =>
    acc +
    Object.keys(item as Record<string, unknown>).filter((key) =>
      ['get', 'post', 'put', 'patch', 'delete'].includes(key)
    ).length,
  0
);

console.log(
  `✅ openapi.yaml generado: ${Object.keys(spec.paths).length} paths, ${operationCount} operaciones.`
);
