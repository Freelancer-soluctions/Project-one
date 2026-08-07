## Context

El proyecto es un monorepo ERP (Express + React) con npm workspaces. Ya existe infraestructura CI/CD con workflows en GitHub Actions, pero los gates de calidad no son vinculantes.

**Estado actual:**

- `quality.yml`: Workflow reusable que corre lint + format check en client y server. NO bloquea PRs porque ESLint no tiene `--max-warnings 0` y el exit code del paso no se evalúa como fail.
- `.husky/pre-commit`: Ejecuta SAST (Semgrep) y secret scanning (Gitleaks) en paralelo. NO ejecuta lint-staged.
- `lint-staged`: Configurado en `package.json` root con reglas para ESLint + Prettier en `*.{js,ts,cjs,mjs,json,jsonc}`. Dependencia instalada (`lint-staged@^16.2.7`).
- Coverage: Scripts `test:coverage` existen en ambos workspaces pero nunca se han ejecutado ni documentado.
- `eslintConfig` legacy en `apps/server/package.json`: Extiende `standard` pero ESLint 9 flat config (`eslint.config.js` root) lo ignora. Dead config que puede confundir.

**Contexto del proyecto:**

- Monorepo con workspaces: client (React/Vite), server (Express/Prisma), e2e (Playwright)
- CI actual: quality.yml, ci.yml (tests comentados), security.yml
- ESLint 9 flat config vía `eslint.config.js` root con `js.configs.recommended`; server legacy `eslintConfig` extendía `standard`
- Cambio `ci-test-integration` necesita coverage baselines de este change

## Goals / Non-Goals

**Goals:**

1. Hacer ESLint gate bloqueante en CI — errores de lint bloquean merge de PRs
2. Reactivar lint-staged en pre-commit con `npm exec lint-staged` (no `npx`)
3. Medir y documentar coverage baselines actuales (client + server) en cicd-plan.md §14.5
4. Investigar y resolver legacy `eslintConfig` en server package.json

**Non-Goals:**

- Configurar coverage thresholds en Vitest (se hará en `ci-test-integration`)
- Modificar reglas de ESLint existentes (solo gate)
- Agregar nuevos workflows CI
- Corregir errores de lint en todo el codebase (solo lo necesario para activar gate)

## Decisions

### D1: Mecanismo de fail para ESLint en CI

**Decisión:** Agregar `--max-warnings 0` al script `lint` en ambos workspaces.
**Alternativas:** `--quiet`, exit code check en YAML, `maxWarnings: 0` en eslint.config.
**Rationale:** Flag estándar de ESLint que convierte warnings en errors. Funciona con Legacy y Flat Config. Retorna exit code non-zero si hay advertencias o errores.
**Tradeoff:** Si el código base tiene warnings, lint empezará a fallar inmediatamente. Mitigación: pre-flight discovery step antes de aplicar flag.

### D2: Integración de lint-staged en pre-commit

**Decisión:** Agregar `npm exec lint-staged` al inicio del hook `.husky/pre-commit`, antes de SAST/secrets.
**Alternativas:** `npx lint-staged` (descartado por Windows spawn loop), paralelo (descartado por race condition con autofix).
**Rationale:** lint-staged modifica archivos (autofix ESLint + Prettier). Checks pesados deben correr sobre código ya formateado. `npm exec` evita el bug de Windows spawn loop.

### D3: Estrategia de ejecución de lint-staged

**Decisión:** Usar `npm exec lint-staged` (no `npx`) en el hook.
**Rationale:** `npm exec` es cross-platform y evita el Windows spawn loop bug. lint-staged está en devDependencies del root. Alternativa: bin directo `node_modules/.bin/lint-staged`.

### D4: Documentación de Coverage Baselines

**Decisión:** Ejecutar `npm run test:coverage` en client y server, registrar métricas en `docs/cicd-plan-implementacion.md` como nueva sección §14.5 "Coverage Baselines (Jul 2026)".
**Ubicación exacta:** Después de §14 (Próximos pasos concretos), antes de §15 (Referencias).
**Rationale:** Las métricas actuales son necesarias para configurar thresholds realistas en `ci-test-integration`. Cambio `ci-quality-gates` DEBE aplicarse antes que `ci-test-integration`.

### D5: Hardening de quality.yml

**Decisión:** No modificar `quality.yml` directamente. El fail se logra vía D1: `npm run lint` con `--max-warnings 0` retorna non-zero → GitHub Actions falla el paso.
**Rationale:** GitHub Actions por defecto falla en cualquier paso con exit code != 0. No hay necesidad de `fail-on: error` explícito.

### D6: Server Legacy eslintConfig

**Decisión:** Investigar `eslintConfig` en `apps/server/package.json`. ESLint 9 con flat config (`eslint.config.js`) ignora campos `eslintConfig` en package.json. Si hay reglas `standard` que no se aplican, evaluar:

- Opción A: Agregar `standard` rules al root `eslint.config.js` bajo `files: ['apps/server/**/*.js']`
- Opción B: Remover el campo legacy y documentar que root flat config gobierna ambos workspaces
  **Rationale:** Dead config es confuso para mantenedores y puede dar falsa sensación de seguridad.

### D7: Dependency Ordering

**Decisión:** Este cambio (`ci-quality-gates`) DEBE completarse antes que `ci-test-integration` porque las coverage baselines alimentan los thresholds del segundo.
**Rationale:** Sin baselines, los thresholds en ci-test-integration se configurarían sin datos reales.

## Risks / Trade-offs

- **[R1: Lint existente puede tener errores]** → Pre-flight discovery (Task 0.1): medir warnings actuales ANTES de aplicar `--max-warnings 0`
- **[R2: lint-staged puede ralentizar commits]** → Solo opera sobre staged files (< 1s para pocos archivos). `npm exec` es rápido.
- **[R3: Coverage baselines pueden ser pobres]** → Propósito es documentar punto de partida. Thresholds se ajustan en ci-test-integration.
- **[R4: Windows compat lint-staged]** → `npm exec lint-staged` evita spawn loop. Shebang `#!/usr/bin/env sh`.
- **[R5: Server legacy eslintConfig ignorado]** → D6 requiere investigación. Si `standard` rules son importantes, migrar a flat config.

## Migration Plan

1. Pre-flight: ejecutar `npm run lint --workspaces` SIN flag, capturar warning count
2. Modificar scripts `lint`: agregar `--max-warnings 0`
3. Investigar/remover `eslintConfig` legacy en server package.json
4. Modificar `.husky/pre-commit`: agregar `npm exec lint-staged` al inicio
5. Ejecutar `npm run test:coverage` en client + server, registrar baselines en cicd-plan.md §14.5
6. Verificar que CI quality workflow falle correctamente
7. Verificar que lint-staged se ejecuta en pre-commit

## Open Questions

- ¿Existen errores de lint actuales en el código base? → Pre-flight responde
- ¿El server usa ESLint config legacy (`.eslintrc.json`) o flat config? → Tiene `eslintConfig` en package.json, ignorado por flat config
- ¿lint-staged debe ejecutar `npm run format` o `prettier --write` directamente? → Config actual usa `npm run format`
- ¿Las reglas `standard` que extendía el server son necesarias? → Decidir en D6

## Cross-Platform Considerations

- Windows 10/11 con Git Bash (MSYS2) como shell por defecto
- Usar `npm exec lint-staged` en lugar de `npx` (evita Windows spawn loop)
- Hooks `.husky/` mantienen shebang `#!/usr/bin/env sh`
- ESLint flat config funciona igual en Windows y Linux
