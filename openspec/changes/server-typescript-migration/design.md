# Design

## Context

`apps/server` (Express + Prisma + socket.io, npm workspaces, ESM puro) suma 228 archivos JS (~29k líneas en `src/`, 24 módulos con convención uniforme `controller/dao/routes/schemas/service`). La investigación canónica `docs/learning/typescript-migration-server.md` verificó las condiciones favorables: **389/389 imports relativos terminan en `.js`** (convención exacta de `moduleResolution: nodenext`), ~2.556 anotaciones JSDoc que `checkJs` puede verificar hoy, ESM sin un solo `require()`, y un job `server-typecheck` en `ci.yml` (L538) que **ya está activo** — el change `quality-gates` lo habilitó con el comando real, sin `if: false` ni placeholder.

El constraint dominante es no romper la ejecución en ningún momento: el server corre en AWS vía PM2 (`ecosystem.config.js` → `src/bin/index.js`) y no hay build step hoy (`npm run build` es no-op). Cualquier estrategia que introduzca una fase de compilación obligatoria (emit a `dist/`, rewrite masivo de imports, strict de golpe) multiplicaría el riesgo y el tiempo de migración.

**Estado heredado del change absorbido `typescript-strict-check` (eliminado):** planeaba la otra mitad del viaje —adopción gradual de flags `strict` con orden de coste, scripts `type-check`, `lint-staged` para `*.ts` y doc con referencias `typescriptlang.org`— pero sus tasks 1.x (tsconfigs, scripts, activación del job) y 5.x (CI) quedaron **stale**: el árbol ya las cumple (creadas por `quality-gates`, verificadas 2026-10-01: ambos `tsconfig.json` presentes con `checkJs: false`, script `type-check` en raíz, `server-typecheck` sin `if: false`, `lint-staged` ya procesa `*.{js,jsx,ts,tsx,cjs,mjs}` con prettier + eslint + depcruise). Su valor no-duplicado es el **orden de adopción de flags**, que este change toma como Fase 4.

## Goals / Non-Goals

**Goals:**

- Fase 0 completada y verificada en este change: infraestructura TS (existente por `quality-gates`) evaluada contra el objetivo `checkJs` + cobertura `.ts` de todo el toolchain
- Gate de typecheck activo en CI (ya consumado) y baseline verde mantenido mientras crece la cobertura
- Protocolo de conversión documentado y aplicable por cualquier dev sin decisiones ad-hoc
- **Dueño único del orden de adopción de flags `strict`** (Fase 4, absorbido): cheap → familia → `useUnknownInCatchVariables` → `noUncheckedIndexedAccess`, un flag por paso con baseline medible

**Non-Goals:**

- Convertir archivos en este change (Fases 1–3, changes separados ya esbozados en tasks 2.x–4.x)
- Emitir `dist/` o introducir build step (Node ejecuta los `.js` nativos; vitest compila `.ts` con esbuild)
- Reescribir imports a `.ts` (los `.js` actuales son la convención correcta para `nodenext`)
- Migrar `docs/schemas.js` (2.868 líneas de JSDoc OpenAPI en strings — sin ganancia de tipos; evaluación aparte en Fase 3)
- Tocar `apps/client` (ya soporta TS nativamente) salvo la verificación de su job `client-typecheck`, que ya está activo
- Big-bang `strict: true` (prohibido por la spec absorbida `config-correctness`)

## Decisions

### 1. Estrategia strangler fig con `noEmit` (no build step)

**Decision:** `tsconfig.json` con `allowJs: true`, `noEmit: true`, `module: nodenext`, `moduleResolution: nodenext`, `strict` ausente, `incremental: true`. TypeScript SOLO verifica; Node sigue ejecutando los `.js` nativos, y vitest compila los `.ts` de test con esbuild.

**Rationale:** es la única estrategia que garantiza ejecución sin romper en cada commit. Sin `dist/`, no hay doble fuente de verdad ni scripts de arranque que cambiar (PM2/nodemon siguen apuntando a `src/bin/index.js`). Los 389 imports con `.js` son exactamente lo que `nodenext` exige, así que convertir un archivo NO requiere tocar los imports de sus consumidores (TS resuelve `.js` → `.ts` automáticamente al verificar).

**Alternatives considered:**

- **Build step con emit a `dist/`** — runtime más "clásico" para TS, pero introduce dist/, cambia scripts dev/start/PM2, crea dos fuentes del código y rompe la ejecución si el build se olvida. Coste alto, ganancia nula hoy.
- **Migración big-bang (228 archivos en un PR)** — historial y blame destruidos, revisión imposible, rollback global. Descartada por el propio tamaño del workspace.
- **JSDoc-only (sin TS)** — no da archivos `.ts` ni `strict`; el objetivo del equipo es TS real.

### 2. `checkJs` con gate de decisión (tarea 1.3)

**Decision:** el árbol parte de `checkJs: false` (estado `quality-gates`). Este change mide el volumen de errores con `checkJs: true` sobre los 228 archivos JS con `tsc --noEmit` y decide: si el volumen es asumible (umbral de decisión: ≤~200 errores y sin bloquear archivos que nadie convertirá pronto), se activa `checkJs: true` y los JSDoc existentes producen verificación real gratis; si no, se queda `checkJs: false` y se reevalúa al inicio de la Fase 4. La decisión se registra en tasks.md con el número exacto.

**Rationale:** la medición empírica evita tanto un baseline roto como renunciar prematuramente a la verificación de los JSDoc existentes. Difiere del diseño original solo en el punto de partida (el tsconfig ya existe).

**Alternatives considered:**

- **`checkJs: true` incondicional + `// @ts-nocheck` masivo** — convierte la deuda en comentarios invisibles y sin fecha de expiración; peor que apagar el flag.

### 3. Gate CI ya activo: verificar, no re-habilitar

**Decision:** el job `server-typecheck` ya corre `npx tsc --noEmit` como quality gate (hecho por `quality-gates`). Este change NO vuelve a tocar su `if` ni su comando: solo verifica (a) que el paso no lleva fallback `|| echo` que enmascare fallos, (b) que el baseline se mantiene verde cuando `checkJs` o el toolchain se amplían, y (c) que `client-typecheck` está igualmente activo. El orden histórico "baseline verde antes de gate" ya se consumió.

**Rationale:** re-planificar la activación crearía tasks que el árbol ya cumple (el mismo drift stale que motivó absorber `typescript-strict-check`).

**Alternatives considered:**

- **Volver a la versión original del plan** — re-eliminar `if: false` que ya no existe = tarea vacía.
- **`continue-on-error: true` temporal** — convierte el gate en decorativo y normaliza ignorarlo.

### 4. Cobertura de toolchain primero (tarea 1.2)

**Decision:** todos los globs/reglas de tooling se amplían a `.ts` ANTES de convertir el primer archivo: eslint (bloques backend y complexity), scripts `lint`/`format` de `apps/server`, `knip.jsonc` (sección server), `.dependency-cruiser.cjs`, `vitest.config.js`, `lint-staged` (raíz).

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

### 7. Adopción gradual de flags `strict` como Fase 4 (absorbido de `typescript-strict-check`)

**Decision:** el endurecimiento strict es la Fase 4 de ESTE change, con orden obligatorio de coste creciente: (1) cheap opt-ins `noImplicitReturns` + `noFallthroughCasesInSwitch`; (2) familia `strict` en orden `noImplicitAny` → `strictNullChecks` (junto a `strictBindCallApply`, `strictFunctionTypes`, `strictPropertyInitialization`); (3) `useUnknownInCatchVariables` (parte de la familia, pero paso propio para el middleware de errores de Express); (4) `noUncheckedIndexedAccess` SIEMPRE al final (DAOs, `process.env`, `req.body`). Cada paso: activar el flag → medir delta de errores `tsc --noEmit` contra el baseline → resolver a 0 → commit. Prohibido: `strict: true` de una sola vez mientras queden flags del orden sin adoptar; flags de strictness pasados solo por CLI en scripts/CI (la fuente única es `tsconfig.json`).

**Rationale:** cada flag es un PR revertible con baseline medible; el orden acota el radio de cada explosión de errores (`noUncheckedIndexedAccess` es el más caro sobre DAOs y `req.body`, por eso cierra). Unificarlo con la migración elimina el change duplicado y evita que dos changes "activen strict" con órdenes distintos.

**Alternatives considered:**

- **`strict: true` de golpe** — miles de errores en un PR; el propio change absorbido lo prohibía y su spec lo hace explícito.
- **Fase 4 en un change aparte** — re-crea el solape de dueños que esta unificación elimina; el orden es inseparable de la conversión (convierte → tipa → endurece).

### 8. lint-staged `*.ts` y doc lockstep (absorbidos)

**Decision:** `lint-staged` raíz mantiene el glob `*.{js,jsx,ts,tsx,cjs,mjs}` (prettier ya cubre `ts`; eslint y depcruise ya listan `ts` en sus globs — verificado 2026-10-01): la tarea solo VERIFICA que el pipeline aplica a un `.ts` staged y que no exige un typecheck completo de proyecto en el hot path (eso es de `type-check` y CI). Doc: `docs/learning/typescript-strict-check.md` se actualiza al estado implementado (por este change) citando `typescriptlang.org/tsconfig/strict`, `/tsconfig/` y `docs/handbook/tsconfig-json.html` como referencias normativas, cross-linked con `typescript-migration-server.md`.

**Rationale:** el contrato absorbido se cumple con verificación en vez de implementación (mismo patrón que la decisión 3).

**Alternatives considered:**

- **Añadir `tsc --noEmit` a lint-staged** — typecheck completo por commit = hot path lento; la spec absorbida lo prohíbe explícitamente.

## Risks / Trade-offs

| Riesgo                                                        | Impacto                                      | Mitigación                                                                              |
| ------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------------------- |
| `checkJs: true` revela miles de errores heredados             | Baseline roto, gate CI bloqueado             | Gate de decisión tarea 1.3 (umbral explícito); fallback `checkJs: false` registrado     |
| Tooling ampliado introduce findings en `.ts` futuros          | Ruido en la primera conversión               | Cobertura se amplía con 0 archivos `.ts` — verificación gratuita hoy                    |
| `tsc --noEmit` ralentiza CI                                   | Feedback más lento                           | `incremental: true` + cache de node_modules existente; medición en tarea 1.5            |
| Mix JS/TS confunde la resolución en runtime                   | Servidor no arranca                          | `noEmit` (Node ejecuta `.js` nativo); smoke de arranque en el protocolo de conversión   |
| Doble fuente de tipos (JSDoc + types.ts)                      | Tipos divergentes                            | Regla (c) del protocolo: `@typedef` muere en el commit de conversión                    |
| Deuda oculta bajo `@ts-nocheck`                               | La migración se estanca                      | Solo excepción justificada con expiración, tracked en el change                         |
| Un flag strict rompe el gate verde a mitad de Fase 4          | CI rojo en un paso                           | Delta de errores a 0 por flag antes del commit; un flag = un PR revertible (decisión 7) |
| Referencias colgantes tras eliminar `typescript-strict-check` | Specs/docs apuntando a un change inexistente | Xrefs auditados (tarea 6.x); archive/ queda como historia inmutable                     |
