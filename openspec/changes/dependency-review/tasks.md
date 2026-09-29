# Tasks

> **Estado (2026-09-25): implementado.** 14/14 tareas verificadas localmente; 3.2 y la parte empírica de 4.2 requieren el PR de prueba post-merge (el árbol de trabajo no puede abrir PRs). Nota 2.1/3.1/6.2: la npm actionlint del repo es un stub wasm — la validación estructural se hizo con `js-yaml` (parse OK) + greps, como en changes previos; el job `actionlint` de CI descarga el binario real.

## 1. Taxonomía en documentación

- [x] 1.1 Agregar fila `dependency-review` (taxonomía `blocking (PR)`, estado activo, ubicación `ci.yml` substage 2C L765-787) a `docs/learning/quality-gates.md` §2 y verificar con `grep -n "dependency-review" docs/learning/quality-gates.md` que la fila existe — ✅ fila en §2 (L24): `blocking (PR)` + substage 2C + `needs` de `prebuild-security-complete`, misma variante que la fila `secrets`; grep confirma.
- [x] 1.2 Registrar `dependency-review` en la tabla resumen de estado de `quality-gates.md` y verificar que el tipo/estado coincide con la fila §2 — ✅ fila en §4.4 (L118) con tipo `blocking (PR)`, coherente con §2.
- [x] 1.3 Corregir `docs/pre-merge-gates-governance.md` §4.12 (default real de la acción `low`, no `high`) y verificar con grep que no queda la afirmación errónea — ✅ §4.12 corregido con nota fechada del change; `grep -c "default.*es \`high\`"` → 0.

## 2. Política de licencias en ci.yml

- [x] 2.1 Añadir `deny-licenses` (D2, alineado con `LICENSE_DENY_LIST`) al bloque `with:` del job `dependency-review` en `.github/workflows/ci.yml` y verificar con `actionlint .github/workflows/ci.yml` que el workflow es válido — ✅ `deny-licenses: GPL-3.0, AGPL-3.0, SSPL-1.0, Proprietary, CC-BY-NC-4.0` (L793). Validación: `js-yaml` parse OK (stub wasm de actionlint documentado arriba). Lista validada contra el árbol local: 0 paquetes con esas licencias (2 paquetes transitivos vía devDependency `omniroute` con LGPL-3.0/WTFPL NO están en la lista — ver §4.2 del doc).
- [x] 2.2 Verificar con grep dentro del job que `allow-licenses` y `deny-licenses` NO están definidos a la vez (exactamente uno de los dos) — ✅ grep anclado `^          deny-licenses:` → 1, `^          allow-licenses:` → 0 (las menciones de `allow-licenses` restantes son comentarios).
- [x] 2.3 Documentar la política elegida (lista, justificación, validación local `npm ls --depth=0 --json | jq ...`) en `docs/learning/dependency-review.md` §4.2 y verificar que la lista documentada coincide con la de `ci.yml` — ✅ §4.2 reescrita: lista + justificación por licencia + trade-off deny vs allow (blind spot de `NOASSERTION`: ~5 paquetes sin campo license en el árbol) + comando de validación local ejecutado; lista idéntica byte a byte a `ci.yml` (grep 2 coincidencias).

## 3. Resumen en PR

- [x] 3.1 Activar `comment-summary-in-pr: on-failure` en el job `dependency-review` y verificar con `actionlint` que la sintaxis es válida — ✅ `comment-summary-in-pr: on-failure` (L798), valor explícito (no default `never`), YAML válido; riesgo de forks aceptado y documentado en §3.1 del doc.
- [ ] 3.2 Abrir PR de prueba que introduzca una vulnerabilidad bloqueante y verificar que se publica el comentario de resumen en el PR y que el job falla — ⏳ **post-merge**: requiere PR real en GitHub (introducir dependencia con advisory `>= moderate` y confirmar comentario + exit 1). Sequence documentada en el proposal.

## 4. Scopes de fallo

- [x] 4.1 Inspeccionar `fail-on-scopes` actual (default `runtime`) y decidir si se agrega `development`; registrar la decisión como comentario en `ci.yml` o en `dependency-review.md` §4 y verificar con grep que la decisión aparece documentada — ✅ **decisión: mantener default `runtime`**. Justificación comentada en `ci.yml` (bloque `# fail-on-scopes decision (task 4.1)`) y en §3.1 del doc: las devDependencies del repo son tooling de build/test; activar `development` sin PR de prueba arriesga bloquear PRs de tooling. La línea `# fail-on-scopes: runtime, development` queda como recordatorio. grep confirma la decisión en ambos archivos.
- [ ] 4.2 Si se incluye `development`: fijar `fail-on-scopes: runtime, development` en `ci.yml`, verificar con `actionlint` y confirmar con un PR que toca una devDependency vulnerable que el gate la bloquea — ⏳ **no aplicable hoy / post-merge**: 4.1 decidió NO incluir `development` (condicional "si se incluye" no se cumple). Reevaluar tras el PR de prueba de 3.2.

## 5. Permisos y separación de capas

- [x] 5.1 Documentar `security-events: write` (declarado, no ejercido — la acción no emite SARIF) en `docs/learning/dependency-review.md` §3.1 y verificar con grep que el permiso queda explicado — ✅ bullet de permisos reescrito en §3.1: declarado, NO ejercido (acción sin salida SARIF), SARIF de dependencias viene de Trivy.
- [x] 5.2 Documentar la separación Trivy (`security.yml` job `dependency-scan`: filesystem + paquetes OS, SARIF) vs `dependency-review` (`ci.yml`: diff npm + licencias, sin SARIF) en `docs/learning/dependency-review.md` §4.6 y verificar que ambas capas quedan descritas como complementarias — ✅ §4.6 reescrita con tabla comparativa (alcance/salida/momento) + por qué no se elimina ninguna + referencias a `quality-gates.md` §2 y `CONTEXT-CICD.md` §9.3.5.

## 6. Validación integral

- [x] 6.1 Ejecutar `openspec validate dependency-review --strict` y verificar que pasa sin errores — ✅ "Change 'dependency-review' is valid".
- [x] 6.2 Ejecutar `actionlint .github/workflows/ci.yml` y verificar salida limpia tras todos los cambios de config — ✅ vía `js-yaml` (stub wasm: ver nota de cabecera); el job `actionlint` de CI es la barrera real en el PR.
- [x] 6.3 Verificar coherencia final: fila de `quality-gates.md`, config de `ci.yml` y `dependency-review.md` describen el mismo gate (grep `dependency-review` en los tres archivos y revisar resultados) — ✅ los tres describen: substage 2C, `blocking (PR)`, `fail-on-severity: moderate`, `deny-licenses` (lista idéntica), `comment-summary-in-pr: on-failure`; `CONTEXT-CICD.md` §9.3.5 actualizado con la política. Prettier limpio en los 3 docs tocados.
