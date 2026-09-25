# Design

## Context

`apps/server` (Express + Prisma + socket.io, npm workspaces, ESM puro) suma 228 archivos JS (~29k líneas en `src/`, 24 módulos con convención uniforme `controller/dao/routes/schemas/service`). La investigación canónica `docs/learning/typescript-migration-server.md` verificó las condiciones favorables: **389/389 imports relativos terminan en `.js`** (convención exacta de `moduleResolution: nodenext`), ~2.556 anotaciones JSDoc que `checkJs` puede verificar hoy, ESM sin un solo `require()`, y un job `server-typecheck` en `ci.yml` (L538) con `if: false` y el mensaje "TypeCheck: no-op until TS migration" — la migración estaba anticipada por la arquitectura.

El constraint dominante es no romper la ejecución en ningún momento: el server corre en AWS vía PM2 (`ecosystem.config.js` → `src/bin/index.js`) y no hay build step hoy (`npm run build` es no-op). Cualquier estrategia que introduzca una fase de compilación obligatoria (emit a `dist/`, rewrite masivo de imports, strict de golpe) multiplicaría el riesgo y el tiempo de migración.

## Goals / Non-Goals

**Goals:**

- Fase 0 completa en este change: infraestructura TS que permite empezar a convertir archivos en commits individuales y revertibles
- Gate de typecheck activo en CI antes de que exista el primer `.ts` (protege desde la primera conversión)
- Cobertura `.ts` en TODO el toolchain (eslint, knip, dep-cruiser, vitest, lint-staged, prettier) para que ningún archivo convertido quede fuera de los gates de calidad
- Protocolo de conversión documentado y aplicable por cualquier dev sin decisiones ad-hoc

**Non-Goals:**

- Convertir cualquier archivo de código (Fases 1–3, changes separados)
- Activar `strict` o sus flags (Fase 3, un flag por PR)
- Emitir `dist/` o introducir build step (Node ejecuta los `.js` nativos; vitest compila `.ts` con esbuild)
- Reescribir imports a `.ts` (los `.js` actuales son la convención correcta para `nodenext`)
- Migrar `docs/schemas.js` (2.868 líneas de JSDoc OpenAPI en strings — sin ganancia de tipos; evaluación aparte en Fase 3)
- Tocar `apps/client` (ya soporta TS nativamente)

## Decisions

### 1. Estrategia strangler fig con `noEmit` (no build step)

**Decision:** `tsconfig.json` con `allowJs: true`, `noEmit: true`, `module: nodenext`, `moduleResolution: nodenext`, `strict: false`, `incremental: true`. TypeScript SOLO verifica; Node sigue ejecutando los `.js` nativos, y vitest compila los `.ts` de test con esbuild.

**Rationale:** es la única estrategia que garantiza ejecución sin romper en cada commit. Sin `dist/`, no hay doble fuente de verdad ni scripts de arranque que cambiar (PM2/nodemon siguen apuntando a `src/bin/index.js`). Los 389 imports con `.js` son exactamente lo que `nodenext` exige, así que convertir un archivo NO requiere tocar los imports de sus consumidores (TS resuelve `.js` → `.ts` automáticamente al verificar).

**Alternatives considered:**

- **Build step con emit a `dist/`** — runtime más "clásico" para TS, pero introduce dist/, cambia scripts dev/start/PM2, crea dos fuentes del código y rompe la ejecución si el build se olvida. Coste alto, ganancia nula hoy.
- **Migración big-bang (228 archivos en un PR)** — historial y blame destruidos, revisión imposible, rollback global. Descartada por el propio tamaño del workspace.
- **JSDoc-only (sin TS)** — no da archivos `.ts` ni `strict`; el objetivo del equipo es TS real.

### 2. `checkJs: true` con gate de decisión (tarea 1.3)

**Decision:** arrancar con `checkJs: true` en el tsconfig y medir el volumen de errores baseline sobre los 228 archivos JS con `tsc --noEmit`. Si el volumen bloquea razonablemente el gate (umbral de decisión: >~200 errores o errores en archivos que nadie va a convertir pronto), se apaga a `checkJs: false` y queda como flag de endurecimiento de Fase 3. La decisión se registra en tasks.md con el número exacto.

**Rationale:** `checkJs` es la vía más rápida para que los ~2.556 JSDoc existentes produzcan verificación real sin convertir nada — pero el volumen de errores heredados es impredecible sin medir. La medición empírica evita tanto un baseline roto como renunciar prematuramente a la verificación de los JS existentes.

**Alternatives considered:**

- **`checkJs: false` desde el inicio** — pierde gratis toda la verificación de los JSDoc; solo se justifica si la medición lo impone.
- **`checkJs: true` incondicional + `// @ts-nocheck` masivo** — convierte la deuda en comentarios invisibles y sin fecha de expiración; peor que apagar el flag.

### 3. Gate CI antes del primer `.ts`

**Decision:** habilitar `server-typecheck` (quitar `if: false`) en esta Fase 0, ejecutando `npx tsc --noEmit` desde `apps/server`. El baseline debe quedar verde ANTES de habilitar el job (orden de tareas 1.3 → 1.4).

**Rationale:** si el gate se añade después del primer archivo convertido, el primer commit `.ts` puede romper CI por errores nunca vistos. Invertir el orden hace que la primera conversión nazca protegida. El job ya existe en el workflow con ese propósito explícito en su mensaje.

**Alternatives considered:**

- **Gate solo local (`tsc` en pre-commit)** — no protege contra pushes directos ni aplica a toda la rama en PR; el estándar del repo es gate en CI.
- **`continue-on-error: true` temporal** — convierte el gate en decorativo y normaliza ignorarlo.

### 4. Cobertura de toolchain primero (tarea 1.2)

**Decision:** todos los globs/reglas de tooling se amplían a `.ts` en Fase 0, ANTES de convertir el primer archivo: eslint (bloques backend y complexity), scripts `lint`/`format` de `apps/server`, `knip.jsonc` (sección server), `.dependency-cruiser.cjs`, `vitest.config.js`, `lint-staged` (raíz).

**Rationale:** si el tooling se amplía a la vez que se convierten archivos, cada PR de conversión arrastra cambios de configuración y el riesgo se mezcla. Ampliándolo antes, la primera conversión es un `git mv` + tipos, nada más. Además, el tooling ampliado sobre un codebase 100% JS es verificación gratuita de que nada se rompe (cero archivos `.ts` hoy = cero findings nuevos).

**Alternatives considered:**

- **Ampliar por-phase a medida que se convierte** — mezcla riesgos de config y código; un PR de módulo podría dejar archivos `.ts` sin lintear/knip/dep-cruiser silenciosamente.

### 5. Protocolo de conversión por archivo

**Decision:** (a) un archivo = un commit (o un módulo de 5 archivos cuando el patrón esté rodado); (b) `git mv` + tipar firmas públicas — los imports de consumidores no se tocan; (c) el `@typedef` del archivo convertido muere en el mismo commit → `types.ts` del módulo o interfaces inline; (d) sin `any` nuevo; `unknown` + narrowing o `TODO(types)` tracked; (e) `@ts-nocheck` solo como excepción justificada con fecha de expiración; (f) validación del commit: `npx tsc --noEmit` + lint + tests del módulo + smoke de arranque.

**Rationale:** protocolo uniforme = revisión rápida y riesgo plano. La regla (c) evita la doble fuente de verdad de tipos, el modo de fallo clásico de las migraciones strangler.

**Alternatives considered:**

- **Codemod masivo** — rompe blame; ya descartada.
- **Convertir módulos completos siempre** — para módulos de 5 archivos con patrón uniforme es razonable a partir del segundo o tercer módulo; el protocolo lo permite explícitamente (regla (a)).

### 6. `@types/*` centralizadas en Fase 0

**Decision:** instalar en Fase 0 el set completo detectado en la investigación: `@types/express`, `@types/jsonwebtoken`, `@types/bcrypt`, `@types/swagger-jsdoc`, `@types/swagger-ui-express`, más las que el baseline `tsc` demande (candidatas: `@types/knex` si se decide tipar knex, o mantener su excepción knip). Como devDeps de `apps/server`.

**Rationale:** Fase 1 convierte `config/db.ts` y necesitará los tipos de Prisma/Express desde el primer commit; instalarlas aquí hace la Fase 1 pura conversión de código.

**Alternatives considered:**

- **Instalar `@types/*` por fase según necesidad** — cada instalación es un commit de dependencias mezclado con conversión de código; peor para revertir.

## Risks / Trade-offs

| Riesgo                                               | Impacto                          | Mitigación                                                                            |
| ---------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------- |
| `checkJs` revela miles de errores heredados          | Baseline roto, gate CI bloqueado | Gate de decisión tarea 1.3 (umbral explícito); fallback `checkJs: false` registrado   |
| Habilitar el gate falla por errores pre-existentes   | CI rojo en Fase 0                | Orden de tareas: baseline verde ANTES de habilitar el job                             |
| Tooling ampliado introduce findings en `.ts` futuros | Ruido en la primera conversión   | Cobertura se amplía con 0 archivos `.ts` — verificación gratuita hoy                  |
| `tsc --noEmit` ralentiza CI                          | Feedback más lento               | `incremental: true` + cache de node_modules existente; medición en tarea 1.5          |
| Mix JS/TS confunde la resolución en runtime          | Servidor no arranca              | `noEmit` (Node ejecuta `.js` nativo); smoke de arranque en el protocolo de conversión |
| Doble fuente de tipos (JSDoc + types.ts)             | Tipos divergentes                | Regla (c) del protocolo: `@typedef` muere en el commit de conversión                  |
| Deuda oculta bajo `@ts-nocheck`                      | La migración se estanca          | Solo excepción justificada con expiración, tracked en el change                       |
