# PBT Candidate Analysis (2026-11-06)

Análisis del repositorio para identificar candidatos a Property-Based Testing (fast-check).

## Infraestructura PBT existente

- fast-check instalado en `apps/server` y `apps/client` (devDeps).
- Setup global: `numRuns: CI ? 1000 : 100`, `seed: 42` (solo CI).
- Property tests existentes (12 `fc.assert` en 4 archivos):
  - `apps/server/tests/unit/properties/schemas.properties.unit.test.ts` (5)
  - `apps/server/tests/unit/properties/logic.properties.unit.test.ts` (4)
  - `apps/server/tests/unit/properties/money.properties.unit.test.ts` (1)
  - `apps/client/src/properties/schemas.properties.unit.test.js` (2)
- Gate blocking en `property-tests` job (ci.yml), en `prebuild-tests-complete.needs`.

## Candidatos por capa

### Alta prioridad — Utils (server + client)

| #   | Archivo                                                    | Función                 | Invariante                                                              |
| --- | ---------------------------------------------------------- | ----------------------- | ----------------------------------------------------------------------- |
| 1   | `apps/server/src/utils/pagination/pagination.ts`           | `getSafePagination`     | `1 ≤ take ≤ 100`, `skip ≥ 0`, entero, page=1 ⇒ skip=0                   |
| 2   | `apps/server/src/utils/prisma/sanitizePrismaMessage.ts`    | `sanitizePrismaMessage` | idempotencia, unknown ⇒ DEFAULT_SAFE, código conocido ⇒ mensaje mapeado |
| 3   | `apps/client/src/utils/pickDirty.js`                       | `pickDirty`             | solo claves dirty, recursión, array ⇒ data[key], inválido ⇒ `{}`        |
| 4   | `apps/client/src/lib/utils.js`                             | `cn`                    | determinismo, twMerge idempotencia                                      |
| 5   | `apps/client/src/modules/products/utils/barcode.js`        | `generateRandomBarcode` | longitud exacta, solo dígitos, padding                                  |
| 6   | `apps/client/src/modules/products/utils/currencyFormat.js` | formatter MXN           | 2 decimales (semi-puro, Intl)                                           |

### Alta prioridad — Parsers

| #   | Archivo                                                | Función             | Invariante                                                          |
| --- | ------------------------------------------------------ | ------------------- | ------------------------------------------------------------------- |
| 7   | `apps/server/src/modules/notes/utils/mentionParser.ts` | `parseMentions`     | posiciones coherentes, sin solapamiento, `null/undefined/''` ⇒ `[]` |
| 8   | `apps/server/src/modules/notes/utils/mentionParser.ts` | `extractMentionIds` | IDs únicos, `null` ⇒ `[]`, dedup, orden estable (async, semi-puro)  |
| 9   | `apps/client/src/utils/jwt-decode.js`                  | `getUserFromToken`  | token inválido ⇒ error object (no null)                             |

### Media prioridad — Schemas (Joi + Zod)

- Server: todos los `*.joi.ts` en `apps/server/src/modules/*/schemas/` (21 archivos + `src/utils/joiSchemas/joi.ts`).
- Client: todos los `modules/*/utils/schema.js` (22 archivos).
- Patrón: valid ⇒ no error; inválido ⇒ error.

### Media prioridad — Services / State machines

| #   | Archivo                                          | Función                                                | Invariante                                                  |
| --- | ------------------------------------------------ | ------------------------------------------------------ | ----------------------------------------------------------- |
| 10  | `apps/server/src/modules/events/stateMachine.ts` | `canTransition`, `getAllowedNextStates`                | solo transiciones en `validTransitions`, unknown ⇒ false/[] |
| 11  | `apps/server/src/modules/events/service.ts`      | `timeStrToDate`, `formatTime`, `validateEventModality` | round-trip `formatTime(timeStrToDate(x)) === x`             |
| 12  | settings patch-display                           | merge/patch                                            | propiedades de merge                                        |

### Baja prioridad — Store / Reducers

| #   | Archivo             | Función                    | Invariante                                                                 |
| --- | ------------------- | -------------------------- | -------------------------------------------------------------------------- |
| 13  | `authSlice` reducer | `updateAuthData`, `logout` | `logout` ⇒ `user=null`, `isAuth=false`, `isError=false`, `errorMessage=''` |
| 14  | `settingsSlice`     | setters                    | carga/error                                                                |

### Criterio de testabilidad

- **Pura**: sin side effects, sin I/O, sin DB → candidata directa.
- **Semi-pura**: depende de entorno inyectable/mokeable (sessionStorage, cheerio, Intl) → candidata con mocks.
- **Async-DB dependiente**: excluida del PBT directo (DAOs, servicios con Prisma).

### Estrategia

- Archivos: `*.properties.unit.test.*` (server: `tests/unit/properties/`, client: `src/properties/` o colocado).
- `numRuns`: 100 local / 1000 CI, `seed: 42` en CI.
- Gate: blocking (ya implementado en `property-tests` job).
- Seeds reproducibles en CI; local sin seed para exploración.
