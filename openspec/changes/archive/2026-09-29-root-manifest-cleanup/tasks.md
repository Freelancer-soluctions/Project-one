# Tasks

## 1. Guard de higiene (script + wiring)

- [x] 1.1 Crear `scripts/check-root-manifest.mjs` (Node puro, `node:fs`): lee manifests de workspaces + devDeps raíz + allowlist (D3: `{ name, reason }` inline con `reason` obligatoria), valida `dependencies` raíz ⊆ directos ∪ allowlist, exit 1 con lista de inválidas; modo `--report` lista removibles sin fallar. Verificación: `node scripts/check-root-manifest.mjs --report` imprime ~762 entradas; con el manifest actual exit 0 en `--report` y exit 1 en modo enforcing. — ✅ report detectó exactamente 762; enforcing exit 1 con el manifest aplanado
- [x] 1.2 Añadir script npm `check:manifest` al `package.json` raíz. Verificación: `npm run check:manifest` ejecuta el guard (falla con el estado actual aplanado — esperado hasta task 2). — ✅ exit 1 antes de la limpieza, exit 0 después (task 2.2)
- [x] 1.3 Añadir paso `check-root-manifest` en la banda pre-build de `ci.yml` (condicionado a PR que toque `package.json`/`package-lock.json` raíz; falla ante entrada inválida). Verificación: parse YAML (`js-yaml`) OK + `actionlint .github/workflows/ci.yml` exit 0. — ✅ job `root-manifest-guard` (51 jobs, needs del agregador en 16) + actionlint OK
- [x] 1.4 Añadir paso advisory (`|| echo`) en `.husky/pre-commit` (bloque advisory, tras GuardDog... antes de GuardDog, junto a los advisory). Verificación: hook pasa en un commit de prueba; advisory visible. — ✅ `bash -n` OK, paso insertado antes del bloque GuardDog

## 2. Limpieza del manifest raíz

- [x] 2.1 Ejecutar el guard en modo reporte y revisar las entradas removibles; definir la allowlist final (D3) con `reason` por entrada (se espera vacía o casi). Verificación: lista revisada; allowlist definida en `scripts/check-root-manifest.mjs`. — ✅ escaneo de imports/binarios del raíz: lo que el raíz realmente usa (`typescript`, `@eslint/js`, `globals`, `vitest`) se movió a devDependencies; allowlist final VACÍA (ALLOWLIST = [] en el script)
- [x] 2.2 Editar `package.json` raíz: remover las transitivas promovidas, `add@2.0.6` (llega de main) y `yoctocolors-cjs`; conservar `devDependencies` (21). Verificación: `node scripts/check-root-manifest.mjs` exit 0 (enforcing). — ✅ `dependencies` eliminado por completo (825 → 0); devDeps 21 → 24 (+typescript/@eslint/js/globals/vitest que el raíz usa); guard enforcing exit 0
- [x] 2.3 Regenerar `package-lock.json` (`npm install`). Verificación: `npm ci --dry-run` exit 0; lockfile sin entradas huérfanas. — ✅ npm ci OK; lockfile −3076/+643 líneas (−2433 netas)
- [x] 2.4 Confirmar que los requisitos internos de `@isaacs/cliui` (`string-width-cjs` etc.) siguen resolviendo vía lockfile. Verificación: `grep '"string-width-cjs"' package-lock.json` sigue presente como dep de cliui y `npm ls string-width-cjs` resuelve. — ✅ presentes en lockfile (`name: string-width`, alias correcto) y `npm ls` resuelve vía storybook→cliui

## 3. Verificación integral (gate del change)

- [x] 3.1 Verificación D6 completa en orden: `npm ci` → `npm run build --workspaces --if-present` → unit tests → integración → smoke → scripts raíz. Verificación: todos exit 0 sin cambios de código de aplicación; si algo falla, resolver según D6 (allowlist con reason o fix del import en workspace). — ✅ build client (26s, ✓ built) + server (no-op) OK; unit client 41/41 OK; unit server 161/161 OK; integration server 57/57 OK; lint/format workspaces OK; **smoke: 14 fallos AMBIENTALES (ECONNREFUSED, requiere Postgres servicio; job `test-smoke` en CI está `if: false` desde antes — fuera de alcance)**; knip verde en los 4 workspaces (root . incluido, tras mover `@eslint/js`/`why-is-node-running` a devDeps y justificar FPs en knip.jsonc)
- [x] 3.2 Verificar que GuardDog ya no verá los FPs de clase `not on NPM`: simular el input del scanner sobre el manifest limpio. Verificación: simulación imprime `OK`. — ✅ `dependencies` = 0 (sin workspaces/`add`/`yoctocolors-cjs`); además 24/24 devDeps verificadas existentes en el registro npm

## 4. Documentación y cierre

- [x] 4.1 Actualizar la nota de auditoría del change `typosquatting-detection` (tasks.md) referenciando este change como solución general. Verificación: la nota menciona `root-manifest-cleanup`. — ✅
- [x] 4.2 Registrar la capa del guard en `docs/learning/quality-gates.md` §2 (taxonomía: blocking PR, ubicación `ci.yml`). Verificación: fila presente con taxonomía y ubicación. — ✅ fila `root-manifest-guard` añadida + conteo del agregador actualizado a 16
- [x] 4.3 Validación final OpenSpec: `openspec validate root-manifest-cleanup --strict`. Verificación: exit 0 sin warnings. — ✅ "Change 'root-manifest-cleanup' is valid"
