## Context

El proyecto es un ERP empresarial (monorepo con Express + React). Ya existe infraestructura de testing pero faltan componentes críticos:

**Estado actual:**

- Unit tests: Vitest configurado en client y server (~30 test files)
- Integration: Vitest + Supertest en server
- E2E: Playwright configurado pero SIN tests implementados
- Documentación: docs/testing-architecture.md incomplete (falta smoke, regression, priorities)

**Contexto del proyecto:**

- Solo un desarrollador
- 30+ módulos en el ERP (usuarios, empleados, ventas, payroll, inventario, etc.)
- Objetivo: terminar desarrollo y escalar
- Sin usuarios reales aún (simular como si los hubiera)

## Goals / Non-Goals

**Goals:**

1. Implementar 5-7 tests E2E con Playwright para flujos críticos
2. Crear smoke tests para verificación post-deploy
3. Establecer suite de regression testing
4. Actualizar documentación de testing
5. Definir prioridades de testing por módulos del ERP

**Non-Goals:**

- Contract testing (sin múltiples consumers)
- Mutation testing (recursos limitados)
- Performance testing con k6 (sin usuarios reales)
- Tests para TODOS los módulos (solo los críticos)

## Decisions

### D1: Herramienta E2E

**Decisión:** Playwright (ya configurado)
**Alternativas:** Cypress, Puppeteer
**Rationale:** Configuración existente, mejor soporte para múltiples browsers, integración con CI

### D2: Estructura de tests E2E

**Decisión:**tests/e2e/specs/ con subdirectorios por módulo
**Rationale:** Organizado por área de negocio, escalable

### D3: Smoke tests como scripts npm

**Decisión:** Scripts en package.json que ejecutan tests seleccionados
**Alternativas:** Docker healthchecks, CI pipeline
**Rationale:** Simple, ejecutable manualmente o en CI

### D4: Priorización de módulos

**Decisión:** Tres niveles de prioridad basados en riesgo
**Rationale:**有限的 recursos = máximo impacto

```
CRÍTICO (dinero): sale, payroll, purchase, clientOrder, users
ALTO (negocio): inventoryMovement, stock, products, employees, attendance, vacation, permission
NORMAL (support): news, notes, events, settings, clients, providers
```

## Risks / Trade-offs

- [R1: Tests E2E son fragiles] → Mitigation: Mantener solo 5-7 tests core, actualizar cuando el UI cambie
- [R2: Tiempo de ejecución E2E] → Mitigation: Ejecutar solo en CI, no en pre-commit local
- [R3: Cobertura insuficiente] → Mitigation: Focus en módulos críticos primero
- [R4: Maintenance load] → Mitigation: Documentar patrones y mantener nombres consistentes

## Migration Plan

1. Crear estructura de archivos E2E
2. Implementar primer test (login)
3. Agregar 4-6 tests más progresivamente
4. Agregar scripts de smoke a package.json
5. Configurar pre-commit para regression
6. Actualizar documentación

## Open Questions

- ¿Cuántos E2E tests iniciales? Propuesta: 5-7 flows
- ¿Ejecutar E2E en pre-commit o solo en CI? Propuesta: CI only
- ¿Usar datos reales o fixtures en E2E? Propuesta: Fixtures controlados

## Cross-Platform Considerations

- Windows 10/11 con Git Bash (MSYS2) como shell por defecto
- Scripts npm deben evitar `npx` (`.cmd` shim problemático que no propaga EOF)
- Path operations usar `path.posix` o `path.join` (no raw concat con `/`)
- Husky hooks usar `#!/usr/bin/env sh` shebang (no bash-specific)
- Scripts npm considerar `cross-env` para variables de entorno cross-platform

### D5: Eliminación de `npx` en scripts npm

**Decisión:** Usar bins directos (`vitest run`, `playwright test`).
**Rationale:** npm resuelve `node_modules/.bin/` automáticamente en lifecycle scripts; `npx` es redundante y peligroso en Windows porque introduce `cmd.exe` intermediario que no propaga EOF.

### D6: Delegación idiomática a workspaces

**Decisión:** El root `test`, `test:unit`, `test:integration`, `test:e2e` deben usar `npm run X --workspace=<name>` en lugar de `npx vitest --config apps/X/vitest.config.js`.
**Rationale:** Idiomático npm workspaces, garantiza CWD correcto, evita intermediarios de proceso.
**Alternativas:** `concurrently` (paralelo), `nx run` (requiere migrar a Nx).

### D7: Pool Vitest explícito 'forks' con singleFork condicional (CI-only)

**Decisión:** Agregar `pool: 'forks'` en apps/server/vitest.config.js incondicionalmente. SingleFork se habilita CONDICIONALMENTE solo en CI: `poolOptions: { forks: { singleFork: process.env.CI === 'true' } }`.
**Rationale:** Vitest 4.x default es forks, pero explicitarlo + singleFork condicional reduce procesos hijos a 1 en CI (ideal Windows CI), preservando paralelismo en dev local.
**Tradeoff:** singleFork pierde aislamiento entre tests, pero solo aplica en CI. En desarrollo local se mantiene paralelismo para velocidad.

### D8: hanging-process reporter

**Decisión:** Agregar `reporters: ['default', 'hanging-process']` en ambos vitest.config.js.
**Rationale:** Detecta handles abiertos cuando vitest no puede cerrar, facilita diagnóstico futuro. Vitest built-in, no requiere deps nuevas.

### D9: Eliminación de projects anidados en client vitest.config.js

**Decisión:** Remover `projects: [{unit}, {integration}]` del apps/client/vitest.config.js y unificar bajo un único include pattern.
**Rationale:** El root estaba pasando `--project=unit` externo a un config que YA tiene projects internos → ambigüedad en Vitest 4.x sobre interpretación del flag. Simplifica mental model.

### D10: Integración de why-is-node-running como tool de diagnóstico

**Decisión:** Agregar script `test:debug` en root que use `node --import why-is-node-running/include`. El paquete `why-is-node-running` DEBE agregarse como devDependency formal en `apps/server/package.json` y `apps/client/package.json` (ver task 8.1).
**Rationale:** La dependencia actual en `docs/opencode/prompts/contracts/node_modules/` es frágil (puede desaparecer en clean-install). Moverla a devDeps de los workspaces garantiza persistencia y sigue las convenciones del monorepo.

### D11: Estandarización de timeouts globales

**Decisión:** Agregar `testTimeout: 30000`, `hookTimeout: 15000`, `teardownTimeout: 5000` en vitest.shared.js.
**Rationale:** Previene tests colgados indefinidamente, fail-fast principle.

### D12: Refactor de husky hooks para eliminar npx

**Decisión:** Auditoría directa del filesystem confirma que el directorio `.husky/` SÍ EXISTE con hooks funcionales:
- `.husky/pre-commit` (26 líneas) — Ejecuta `npm run sast:semgrep` (Semgrep SAST) + `npm run security:secrets` (Gitleaks). NO usa `npx` directo — ok.
- `.husky/pre-push` (22 líneas) — Ejecutaba `npx vitest run --changed origin/main --config apps/X/vitest.config.js` para server y client. **CAUSA DIRECTA de spawn loop en Windows al hacer git push**.
- `.husky/commit-msg` (1 línea) — Ejecutaba `npx --no-install commitlint --edit $1`. **CAUSA DIRECTA de spawn loop en Windows al commitear**.
- `.husky/_/` — Infraestructura interna husky 9.x (17 archivos).

Los hooks `pre-push` y `commit-msg` usaban `npx`, lo cual CONTRADICE D5 (eliminar npx) y perpetuaba el bug de Windows spawn loop NO SOLO al ejecutar `npm run test` sino TAMBIÉN al hacer `git push` y `git commit`. **Refactor aplicado**: reemplazado `npx vitest` por `vitest` (bin directo), `npx --no-install commitlint` por `commitlint`. Las funcionalidades de seguridad (Semgrep, Gitleaks) se preservan intactas (ya no usaban npx).

**Acciones ejecutadas:**
1. ✅ `.husky/pre-push`: reemplazado `npx vitest` por `vitest` (bin directo desde `node_modules/.bin/`)
2. ✅ `.husky/commit-msg`: reemplazado `npx --no-install commitlint` por `commitlint` (bin directo)
3. ✅ `.husky/pre-commit`: verificado — no usa `npx`, no requiere cambio
4. ✅ Funcionalidades de seguridad (Semgrep, Gitleaks) preservadas

**Rationale:** Husky 9.x está correctamente instalado. Los hooks funcionaban pero spawn loop en Windows se gatillaba al hacer git push o commit. Refactor elimina el problema y es consistente con D5. Actualizar también `pre-push` para alinear con D6 (delegación `--workspace`) en futuro iteration.
