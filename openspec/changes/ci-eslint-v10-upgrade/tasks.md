# Tasks: ci-eslint-v10-upgrade

## Fase 1: Advisory

- [ ] Añadir job `eslint-v10-advisory` en `ci.yml` con `continue-on-error: true` ejecutando lint con ESLint 10 vía `npx --package eslint@10 eslint …`
- [ ] Ejecutar advisory y corregir reglas renombradas/removidas y plugins incompatibles en `eslint.config.js`
- [ ] Verificar que el advisory pasa
- [ ] Confirmar que el advisory NO entra en `needs` del agregador (exento de skipped=fail)

## Fase 2: Promoción

- [ ] Actualizar `eslint` y `@eslint/js` a 10.x exacto (sin caret) en `package.json`
- [ ] Actualizar `typescript-eslint` si es necesario para compatibilidad
- [ ] Actualizar lockfile
- [ ] Crear `eslint-suppressions.json` con `npx eslint . --suppress-all` por workspace si no existe; regenerar si cambian los hallazgos
- [ ] Añadir patrón `eslint-suppressions.json` (y verificar `eslint.config.*`) en `.github/CODEOWNERS`
- [ ] Actualizar `quality-policy.md` con la fecha de promoción (crear plantilla mínima si no existe)
- [ ] Retirar job advisory

## Validación

- [ ] `npm run lint` pasa con ESLint 10 en client/server/e2e
- [ ] `openspec validate --specs --strict` sin errores
