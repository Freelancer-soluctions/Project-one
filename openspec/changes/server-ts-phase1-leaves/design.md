# Design

> Change hijo de `server-typescript-migration` (Fase 1 — hojas del grafo). Hereda las decisiones 1-9 del padre (nodenext, noEmit, allowJs, checkJs:false hasta Fase 4, tsx endgame, imports `.js` permanentes). Este design solo añade decisiones propias del lote de hojas.

## Decisión 1 — Selección de archivos: la lista del padre, verificada contra el grafo

La task 2.1 del padre enumera el alcance: `config/db|dotenv|cors|aws/*`, `common/crypto/*`, `logger/*`, `utils/constants/enums`, `schemas/*`. Verificado con análisis de imports relativos (grep `from '\.\.?/` sobre los 208 archivos de `src/`, 2026-10-15):

| Grupo              | Archivos                                                                        | Hoja pura?                      |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------------- |
| config             | `dotenv`, `aws/secret-manager.client`                                           | ✅ sin imports relativos        |
| config             | `cors` (→`./dotenv.js`), `aws/secrets` (→`./secret-manager.client.js`)          | ❌ dependen de otros del change |
| config             | `db` (→`../middleware/encription-prisma-middleware.js`)                         | ❌ dependencia FUERA del change |
| crypto             | `hashValue` ✅ · `index` (`export * from './hashValue.js'`) ❌                  | mixto                           |
| logger             | `dev`, `uat`, `production` ✅ · `index` (→3 loggers + `../config/dotenv.js`) ❌ | mixto                           |
| constantes/schemas | `enums`, `joiSchemas/joi`, 22 `*.joi.js`, `event-rsvp`                          | ✅ 25 hojas puras               |

**Total: 36 archivos** (31 hojas puras + 4 dependientes internos + 1 dependiente externo). Alternativa descartada: incluir TODAS las hojas puras del grafo (`utils/csrftoken`, `utils/multer`, `utils/prisma/sanitizePrismaMessage`, `utils/responses&Errors/*`, `middleware/*` standalone, `socket/*`) — rompería el boundary de fases del padre (middleware/socket = Fase 3; responses&Errors los consume middleware/controladores = Fases 2-3).

## Decisión 2 — Orden de lotes por dependencia (3 lotes)

```
Lote 1 (31 hojas puras)  →  Lote 2 (4 dependientes internos)  →  Lote 3 (db, dependiente externo)
```

- **Lote 1**: `dotenv`, `aws/secret-manager.client`, `crypto/hashValue`, `logger/{dev,uat,production}`, `utils/constants/enums`, `utils/joiSchemas/joi`, 22 `*.joi.js`, `events/schemas/event-rsvp`. Sub-lotes de commit: un archivo = un commit (protocolo padre).
- **Lote 2** (sus dependencias ya son `.ts`): `config/cors`, `config/aws/secrets`, `common/crypto/index`, `logger/index`.
- **Lote 3**: `config/db` — único archivo que importa un `.js` que este change NO convierte (`middleware/encription-prisma-middleware.js`). Con `allowJs: true` TS resuelve e infiere; sin emit no hay riesgo runtime. Se convierte al final y su task registra el estado.

**Por qué no un solo mega-lote:** el protocolo exige gates verdes verificables por unidad de avance; 3 lotes = 3 puntos de rollback claros sin inflar el número de verificaciones completas.

## Decisión 3 — Tipado de dominio: `as const`/unions, NO `enum` TS

Los `enums.js` y constantes se tipan con `as const` + union types derivados (`typeof KEY[keyof typeof KEY]`), nunca `enum` TS runtime. Razón: el endgame del padre (decisión 9) evalúa compatibilidad futura con type-stripping nativo (`erasableSyntaxOnly` prohíbe enums); sembrar `enum`s hoy crearía deuda de reescritura en Fase 3+. Compatibilidad de consumidores: los valores exportados NO cambian (mismo objeto JS), solo se añaden tipos — cero churn en los 389 imports.

## Decisión 4 — Firma de dotenv: `(key: EnvKey) => string` sin validación runtime

`dotenv.js` gana su firma tipada con `EnvKey` = unión de las keys realmente leídas hoy (`NODE_ENV`, `AWS_ENDPOINT_URL`, `SECRET_NAME`, `REDIS_URL`, `ENABLE_SMOKE_ROUTE`, `AWS_REGION`, ... — extraídas de los 20 accesos `process.env` de `src/`, medidos en la Fase A). NO se añade validación runtime (zod/env-schema) — eso es un change de seguridad aparte; aquí solo tipos. El fallback de `process.env[key]` devuelve `string | undefined` internamente → la firma pública mantiene el comportamiento actual (el change no rompe a los 6 consumidores de dotenv).

## Decisión 5 — JSDoc: traducción selectiva, muerte del comentario convertido

Regla (c) del padre aplica hoy a 0 archivos con `@typedef` (verificado: 0 en `src/`). Al convertir cada archivo: los `@param`/`@returns` que dupliquen una firma TS ya expresada se **eliminan**; los que documenten invariantes no expresables en tipos (side effects, órdenes de llamada) se **conservan**. Sin `any` nuevo; `unknown` + narrowing donde el JS era implícito.

## Decisión 6 — Verificación por lote: 4 gates, sin excepciones

Tras CADA lote (no por archivo — coste ~10s por corrida, 3 corridas totales): `npm run type-check` (raíz), `npm run lint --workspace=server-express`, `cd apps/server && npm run test:unit`, `npm run depcruise:server`. Si un gate falla, el lote NO avanza. `test:integration` y Docker build quedan fuera (DB/daemon no disponibles localmente — cobertura en CI del PR). El smoke `.ts` del parser eslint ya no es necesario (Fase 0b lo verificó).

## Decisión 7 — Registro de progreso y trazabilidad

Al cierre: (1) contador de `docs/CONTEXT-CICD.md` §12.2 pasa de `0/236` a `36/236 (Fase 1)`; (2) task 1.8 del padre se anota con el delta; (3) task 2.1 del padre se marca `[x]` en el mismo commit que crea este change; (4) este change NO se archiva hasta que sus tasks estén 100% `[x]` y los gates verdes — el cierre del padre (secciones 5-7) es posterior e independiente.
