# Design

## Context

ESLint 9 llegó a EOL el 2026-08-06. El repo usa `eslint ^9.39.2`. ESLint 10.14.0 está disponible y compatible con Node ≥20.19 (repo engines ≥22.11). La política de actualización de herramientas exige: actualización mayor probada primero en job advisory paralelo, nunca en el mismo PR que código de producto, y regeneración/creación de baseline si cambian los hallazgos. No existe `eslint-suppressions.json` en el repo (verificación F26/B1); CODEOWNERS no cubre `eslint.config.*` ni `eslint-suppressions.json`.

## Goals / Non-Goals

**Goals:** Adoptar ESLint 10 sin poner `main` en rojo, con job advisory paralelo y promoción controlada.

**Non-Goals:** No cambiar reglas ni umbrales de política; solo fixes de compatibilidad (reglas renombradas/removidas, plugins incompatibles). No activar SonarQube ni tocar CODEOWNERS para eslint/knip (eso es `ci-quality-gates-blocking-hardening` P1.3; este change añade solo `eslint-suppressions.json`).

## Decisions

1. Job advisory `eslint-v10-advisory` con `continue-on-error: true` corre en paralelo al blocking de v9, sobre client/server/e2e.
2. **Mecanismo de instalación del advisory:** `npx --package eslint@10 eslint …` (no devDependency separada, porque el root manifest guard bloquearía un segundo `eslint` en el manifiesto raíz). La descarga se cachea vía `setup-monorepo` (que cachea `node_modules/.cache`). Los plugins del árbol instalado (v9) se resuelven contra eslint 10 en runtime; la incompatibilidad se detecta en el advisory.
3. Promoción solo cuando el advisory pase; versión fijada sin caret (sin `^`).
4. Crear o regenerar `eslint-suppressions.json` en el mismo PR de herramientas si cambian los hallazgos o si no existe (`npx eslint . --suppress-all` por workspace).
5. CODEOWNERS: añadir patrón `eslint-suppressions.json` (y verificar `eslint.config.*`) en `.github/CODEOWNERS`.
6. `quality-policy.md`: actualizar con la fecha de promoción (crear plantilla mínima si hardening no aterrizó).
7. El advisory NO entra en `needs` del agregador `prebuild-quality-complete` (queda exento de skipped=fail) para no bloquear merges por un gate advisory.

## Risks / Trade-offs

- Reglas renombradas/removidas en v10 pueden romper la config flat. Mitigación: advisory primero, fix en el mismo PR.
- Plugins con peer incompatible con ESLint 10 (react, react-hooks, storybook, security, jsx-a11y, @vitest/eslint-plugin, eslint-config-prettier, typescript-eslint) pueden romper el advisory. Mitigación: el advisory lo detecta; corregir peers en el mismo PR.
- `eslint-suppressions.json` no existe hoy: se crea en la promoción, no antes.
- CODEOWNERS/policy pueden no existir aún (dependen de hardening). Mitigación: crear plantilla mínima o declarar dependencia.

## Migration Plan

1. Añadir job advisory `eslint-v10-advisory` con `continue-on-error: true` usando `npx --package eslint@10`.
2. Ejecutar advisory y corregir config flat (reglas renombradas, plugins incompatibles).
3. Verificar que el advisory pasa.
4. Promover a dependencia principal (versión exacta, sin caret).
5. Actualizar `typescript-eslint` si es necesario para compatibilidad.
6. Actualizar lockfile.
7. Crear/regenerar `eslint-suppressions.json` si cambian los hallazgos (CODEOWNERS aprueba).
8. Añadir patrón CODEOWNERS para `eslint-suppressions.json`.
9. Retirar job advisory.
10. Actualizar `quality-policy.md` con la fecha de promoción.

## Open Questions

- Ninguna.
