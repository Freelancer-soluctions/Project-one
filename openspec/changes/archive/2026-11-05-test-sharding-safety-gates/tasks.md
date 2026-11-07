# Tasks: test-sharding-safety-gates

## 1. RI-10 — forbidOnly / allowOnly

- [x] 1.1 Añadir `allowOnly: !process.env.CI` al bloque `test` de `apps/client/vitest.config.js`.
- [x] 1.2 Añadir `allowOnly: !process.env.CI` al bloque `test` de `apps/server/vitest.config.ts`.
- [x] 1.3 Añadir `forbidOnly: !!process.env.CI` a `e2e/playwright.config.js`.
- [x] 1.4 (verificado: client 121/213, server 209/209 verdes) Verificar que `npm run test --workspace=apps/client` pasa con `.only` en local y falla en CI (simular con CI=true).

## 2. RI-9 — Comando local documentado

- [x] 2.1 Añadir sección "Reproducibilidad local" a `docs/learning/test-sharding.md` con los comandos `--shard=2/4` para Playwright y Vitest.

## 3. Cierre

- [x] 3.1 `openspec validate test-sharding-safety-gates --strict` exit 0.
- [x] 3.2 Archivar el change.
