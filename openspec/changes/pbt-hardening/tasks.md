# Tasks: pbt-hardening

## 1. Invariantes de dominio

- [x] 1.1 Crear propiedad de stock ≥ 0 sobre `stockCreateSchema` (Joi, ya parcialmente cubierto en schemas.properties). Nota: no existe helper real de stock/inventory; el guard es el schema. → `apps/server/tests/unit/properties/domain.properties.unit.test.ts`: se genera `quantity`/`minimum`/`maximum` en `[-1000, 1000]` y se afirma que **todo candidato aceptado** cumple `>= 0` (create y patch), más rechazo explícito de negativos.
- [x] 1.2 (ACOTADO a schema validation) Idempotencia check-in/out de asistencia: `attendance/service.ts` no tiene lógica de idempotencia (ni clave de deduplicación ni guard de "ya fichado"), así que se acota al contrato que el SUT real garantiza hoy: `workedHours > 0`, `entryTime`/`exitTime` ≤ 5 caracteres, `employeeId` entero, patch no vacío. Implementar idempotencia de servicio queda fuera de alcance de este change.
- [x] 1.3 Verificar que mutar el SUT rompe las propiedades. Evidencia: `min(0)` → `min(-1000)` en `stock.joi.ts` hace fallar 2 propiedades con `Counterexample: [-1,0,null]`; `price * quantity` → `price + quantity` en `sumLineItems` hace fallar 3 propiedades del cliente.

## 2. SUT real

- [x] 2.1 Reapuntar paginación a `src/utils/pagination/**` (importar helper real).
- [x] 2.2 Reapuntar `money` a cálculo monetario real del repo (no conmutatividad genérica). → `apps/client/src/utils/money.js` (`sumLineItems`) es ahora el helper compartido por `SalesDialog` y `PurchaseDialog` (antes duplicado en ambos); `apps/server/tests/unit/properties/money.properties.unit.test.ts` (conmutatividad genérica de `bigInt`) se elimina y su reemplazo es `apps/client/src/properties/money.properties.unit.test.js`, que ejercita `sumLineItems` **y** `currencyFormatter` (es-MX/MXN).

## 3. Propiedades negativas

- [x] 3.1 Añadir propiedades de rechazo (valores inválidos → error) en schemas server y client. → server: `domain.properties.unit.test.ts` (stock negativo, patch vacío, horas no positivas, times > 5 chars); client: `schemas.properties.unit.test.js` (password < 6 / > 16, email no válido, campos obligatorios en blanco, `startDate` no-`Date`).

## 4. Artefacto en fallo

- [x] 4.1 Añadir `actions/upload-artifact` (if: failure()) al job `property-tests`.
- [x] 4.2 Añadir reporter junit/json al job.
- [x] 4.3 Añadir task de setup files: honrar env vars `PBT_SEED` y `PBT_NUMRUNS` (override sobre defaults 42/1000 CI, 100 local) en `apps/server/tests/setupTest.ts` y `apps/client/tests/setup/setupTest.js`.

## 5. Sync de specs

- [x] 5.1 Actualizar delta spec `property-based-testing` a postura blocking. → Purpose ("wiring CI advisory" → blocking) y el escenario `aggregator contract preserved`, que afirmaba que `property-tests` llega como check advisory y no como input del agregador (falso desde 2026-10-29).
- [x] 5.2 Actualizar main spec `ci-prebuild-substage-structure` (quitar `continue-on-error: true`). → Ya cumplía: §prebuild-tests-complete declara `property-tests` como miembro **blocking** y su `continue-on-error` retirado el 2026-10-29. Sin cambios.
- [x] 5.3 `openspec sync pbt-hardening` (o manual). → `openspec/specs/pbt-hardening/spec.md` creado a mano (el CLI no tiene subcomando `sync`; el sync es agent-driven). **Nota para el archivo**: los `ADDED` del delta ya existen en el main spec, así que `openspec archive pbt-hardening` debe correrse con `--skip-specs`.

## 6. Gaps de CI del PRD PBT (G2, G4, G5, G6, G7)

- [x] 6.1 (G2) Añadir step en `property-tests` (ci.yml) que escriba seed/ruta/counterexample en `$GITHUB_STEP_SUMMARY` al fallar. → `scripts/ci/pbt-failure-summary.mjs` parsea los reportes `json` de Vitest y publica una tabla Markdown.
- [x] 6.2 (G4) Añadir regla de pureza en `eslint.config.js` (`no-restricted-globals`/`no-restricted-syntax`) para `*.properties.unit.test.*` (prohibir `Math.random`, `Date.now`, red). → bloque `(6c)`: `Math.random`, `Date.now`, `fetch`, `XMLHttpRequest`, `axios`.
- [x] 6.3 (G5) Configurar `maxSkipsPerRun` explícito (ej. 50) en `fc.configureGlobal` de ambos setup files.
- [x] 6.4 (G6) Añadir casilla al Pre-merge Checklist de `.github/PULL_REQUEST_TEMPLATE.md`: "Si este PR corrige un hallazgo de propiedades, el contraejemplo está como `examples:` o test de ejemplo".
- [x] 6.5 (G6) Empezar a usar `examples:` en las propiedades existentes. → paginación (limit 0 / desbordado / negativos), stock (fronteras), money (ley multiplicativa con 0.1 × 3) y `currencyFormatter` (0.1 + 0.2, 1.005, -0.005).
- [x] 6.6 (G7) Crear job programado (semanal) que corra `test:pbt` con semilla aleatoria (`PBT_SEED`), numRuns 1000-10000, límite de tiempo, y cree issue en fallo (advisory por diseño del PRD). → `.github/workflows/pbt-nightly.yml` (martes 04:50 UTC, `PBT_NUMRUNS=5000`, `timeout-minutes: 12`, issue reutilizado/comentado con la semilla).
- [x] 6.7 `openspec validate pbt-hardening --strict` exit 0. → OK con `--type change` (el nombre ahora también resuelve al main spec, así que el flag de tipo es obligatorio).

## 7. Cierre

- [x] 7.1 `npm run test:pbt` verde. → client 18 tests / server 17 tests, exit 0.
- [x] 7.2 `openspec validate pbt-hardening --strict` exit 0.
- [ ] 7.3 Archivar `property-based-testing-adoption` (si no archivado). → `openspec validate property-based-testing-adoption --strict` ya pasa (se completó el bloque `MODIFIED` de `Visual substage delimitation`, que omitía el escenario `Metadata job is not advertised in the 2A header` y habría bloqueado el archive). El archive en sí queda pendiente de petición explícita.
- [ ] 7.4 Archivar este change (usar `--skip-specs`: su delta ya está en `openspec/specs/pbt-hardening/`). Pendiente de petición explícita.
