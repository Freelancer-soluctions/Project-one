# Proposal

## Why

El DCO local hoy se **valida pero no se garantiza**: el trailer `Signed-off-by:` solo existe si el
desarrollador recuerda pasar `-s`. La creencia muy extendida de que `git config --global
commit.signoff true` añade el trailer automáticamente es un **mito** — git no tiene esa variable
(`git help --config` no la lista, `git commit` la ignora) y upstream la rechaza deliberadamente
para preservar el valor legal de un sign-off intencionado —, y este change la corrige en la
documentación del proyecto. Las capas de validación además detectan el problema tarde —
`commit-msg` rechaza el commit ya redactado (y antes `pre-push` lo redescubría al empujar,
duplicando el mismo hallazgo) — en lugar de completarlo por construcción. Es un flujo de "reparar
por fallo" contra una gobernanza que es **required y blocking** en CI (check `DCO` vía
`KineticCafe/actions-dco@v3.2.0` en `ci.yml`, ruleset 21227644): cuanto más tarde se detecta, más
caro es y más dependiente queda de la memoria del dev. Además no existe un doc canónico de DCO: el
conocimiento vive repartido entre `docs/learning/ci-cd/05-husky-git-hooks.md` y
`docs/learning/ci-cd/05b-commit-signing.md`, sin un punto de entrada transversal con citas a
fuentes oficiales.

**Por qué la validación DCO se mueve de `pre-push` a `commit-msg` (decisión del usuario; revierte
la D1 previa de "mantenerlo todo")**: el re-check de `pre-push` duplicaba la validación que
`commit-msg` ya hace en el momento más barato del ciclo, y pagaba en **cada** push una caminata
`git log` por commit del rango de push para una señal redundante — el `git fetch origin main` previo
**no** se elimina: los tests scoped dependen de `--changed origin/main`. Un commit creado
localmente ya está cubierto **por construcción**: `--no-verify` salta `pre-commit` y `commit-msg`
pero **nunca** suprime `prepare-commit-msg`, así que el auto-signoff se inyecta igualmente y la
ausencia de trailer se detecta en `commit-msg` en el propio momento del commit; el gate
autoritativo e inbypassable sigue siendo el check `DCO` de CI (KineticCafe, ruleset 21227644), que
además es el único que cubre los commits que no pasan por los hooks. **Riesgo residual aceptado**:
commits que entran en la historia local sin pasar por los hooks (cherry-pick de una rama ajena,
`HUSKY=0`, hooks deshabilitados, commits anteriores a este change, herramientas que bypassan hooks)
ya no se detectan en el push — solo CI los captura; este riesgo queda documentado en el doc canónico
de DCO.

## What Changes

- **Nuevo hook `.husky/prepare-commit-msg`**: añade el trailer `Signed-off-by: Name <email>`
  automáticamente e idempotentemente a todo commit **no-merge**, usando la identidad real de git
  como **committer** (`git var GIT_COMMITTER_IDENT` → nombre + email, en la forma canónica
  `Name <email>`, comportamentalmente idéntico a `git commit -s`, que firma como committer; fallback
  a la identidad de autor si el committer no es resoluble). Salta solo los merge commits (`$2` ==
  `merge`) y solo cuando el trailer ya está presente (nunca duplica; los orígenes
  `message`/`template`/`squash`/`commit` sí reciben signoff). Es un hook que **solo repara, nunca
  bloquea**: si no puede determinar la identidad o el fichero de mensaje, sale con `exit 0` sin
  tocar nada; implementado en sh/bash POSIX portable (Git Bash/MSYS2 en Windows, macOS y Linux).
- **`commit-msg` intacto en lógica y nuevo gate local único; `pre-push` pierde su capa DCO**: el check de
  presencia de `.husky/commit-msg` (merge skip por `^Merge `, match **case-sensitive**, presencia en
  el mensaje completo, **ANTES** de commitlint, `exit 1`) se preserva **byte-idéntico en lógica** y
  se convierte en el **único** gate local de DCO. El bloque de re-validación DCO de
  `.husky/pre-push` se **elimina por completo**: `pre-push` queda **sin** inspección de trailers
  `Signed-off-by:` y conserva **solo** el `git fetch origin main`, el guard de existencia de
  `origin/main` (los tests scoped dependen de `--changed origin/main`) y los tests scoped, que
  siguen bloqueando el push si fallan. Las únicas ediciones contenidas en `commit-msg` (D7) son
  **dos strings, sin cambio de comportamiento**: el **string de guidance** del error DCO (tarea
  5.8) — que hoy recomienda la no-op `git config --global commit.signoff true` — se sustituye por
  guidance accionable (`git commit -s` / `git commit --amend -s` + nota del auto-signoff), y el
  **comentario de cabecera** `# DCO check (L1)` pasa a la etiqueta de capa correcta (L2) según el
  modelo L0-L3 del design; la lógica DCO queda byte-idéntica. El auto-signoff es una
  capa aditiva, no un reemplazo; la convención explícita `git commit -S -s` sigue siendo válida y
  compatible (gracias a la idempotencia). El mecanismo real de signoff es `-s` + este hook + el gate
  de CI — la inexistente config `commit.signoff` no produce trailers y este change la desmiente.
- **Nuevo doc canónico `docs/learning/dco.md`** (español, transversal, con citas a fuentes oficiales;
  se redacta en la fase de APPLY, no ahora): qué es el DCO v1.1, DCO vs CLA, formato/mecánica del
  trailer `Signed-off-by`, contratos de los 3 hooks locales (`prepare-commit-msg`/`commit-msg`/
  `pre-push`), comparativa de herramientas de enforcement (KineticCafe, probot/dco, tim-actions/dco),
  pitfalls (commits web-flow, pérdida de trailers en squash, commits de bots) y el diseño en capas
  local→CI **sin capa DCO en `pre-push`**, incluyendo el riesgo residual de commits que entran en la
  historia local sin pasar por los hooks (solo cubiertos por CI). **Enlaza — sin duplicar —**
  `docs/learning/ci-cd/05-husky-git-hooks.md` y `docs/learning/ci-cd/05b-commit-signing.md`.
- **Corrección documental del mito `commit.signoff`** (solo documentación, en APPLY): se CORRIGEN
  las afirmaciones obsoletas de `docs/CONTEXT-CICD.md` (§10.5, que afirma que la config inyecta el
  trailer automáticamente; menciones adyacentes en §10.3/§10.4/§11.1; y la entrada de
  verificación del header) y se EXTIENDE `AGENTS.md` (bullet de commit-signing), que **omite el
  signoff por completo** — no menciona `commit.signoff` — y debe documentar el mecanismo real (`-s`
  - hook `prepare-commit-msg`) y la convención `git commit -S -s`. Son correcciones
    **documentales**: no deben alterar el comportamiento de ningún hook ni de CI.
- **Corrección de los docs que afirman que `pre-push` valida DCO** (solo documentación, en APPLY;
  alcance ampliado con aprobación del usuario): seis documentos afirman hoy que `pre-push`
  re-valida DCO y se corrigen en este change — `docs/learning/ci-cd/05e-pr-metadata-governance.md`
  (L133-137, obligatoria: un escenario MODIFIED del delta `local-commit-all-dco` la exige),
  `CONTRIBUTING.md:58`, `docs/learning/ci-cd/01-git-y-yaml.md:141`,
  `docs/learning/secret-scanning.md:157`, `docs/learning/test-impact-analysis.md:264` y
  `docs/analisis-producto-terminado-erp.md:207`. Intención: tras este change ningún doc commiteado
  afirma que `pre-push` realice validación DCO — el DCO local es `prepare-commit-msg` (añade) +
  `commit-msg` (valida, gate local único), con CI como backstop inbypasseable. Son correcciones
  **documentales**: ningún cambio de comportamiento (las tareas correspondientes las añade el
  artefacto `tasks.md`).
- **Sin cambios de CI**: el check `DCO` de CI (required + blocking, ruleset 21227644) y el merge
  squash de GitHub quedan exactamente como están; de los hooks locales solo cambian
  `prepare-commit-msg` (nuevo), `commit-msg` (dos strings: guidance + etiqueta de capa) y `pre-push` (pierde su bloque
  DCO) — `.husky/pre-commit` no cambia.

## Capabilities

### New Capabilities

- `dco-documentation`: base de conocimiento canónica de DCO — `docs/learning/dco.md` cubriendo qué es
  el DCO v1.1, DCO vs CLA, formato/mecánica del trailer `Signed-off-by`, contratos de los hooks git
  (`prepare-commit-msg`/`commit-msg`/`pre-push`), comparativa de herramientas de enforcement
  (KineticCafe, probot/dco, tim-actions/dco), pitfalls (commits web-flow, pérdida de trailers en
  squash, commits de bots) y el diseño de capas local→CI, citando fuentes oficiales.

### Modified Capabilities

- `local-dco-validation`: la capability ahora cubre **auto-signoff** — el nuevo hook
  `prepare-commit-msg` inyecta el trailer de forma automática e idempotente (identidad real de git,
  merge commits exentos, nunca bloquea, portable) — **y la eliminación de la capa DCO de
  `pre-push`**: el requirement _"pre-push hook re-validates DCO over pushed commit range"_ pasa a
  **REMOVED** (motivo: redundancia con `commit-msg` y coste por push de la caminata `git log` por el
  rango en cada push — el `git fetch origin main` se conserva por los scoped tests —; su migración
  documenta el riesgo residual que ahora asume solo CI). En su lugar, el ADDED
  _"commit-msg is the single local DCO validation gate"_ fija que `commit-msg` es el **único** gate
  local (lógica byte-idéntica; solo se corrigen dos strings de texto, D7 — guidance de error + etiqueta de capa del comentario) y el ADDED _"pre-push does
  not validate DCO"_ deja constancia de que `pre-push` solo conserva fetch + guard + tests scoped.
  El requirement _"Hook preserves existing commitlint behavior"_ pasa a **REMOVED** — pre-push ya no
  valida DCO, así que no queda orden DCO→vitest que preservar y sus dos escenarios de vitest se
  eliminan deliberadamente —; su cobertura sobreviviente se re-afirma en el nuevo ADDED _"commit-msg
  runs DCO validation before commitlint"_ (orden DCO antes de commitlint, con sus 2 escenarios de
  commitlint).
- `local-commit-all-dco`: solo cambia la **documentación** — el escenario del requirement _"docs
  reflect the /commit-all DCO rule"_ sobre `docs/learning/ci-cd/05e-pr-metadata-governance.md`
  referenciaba el re-check de `pre-push` como capa local L2; se actualiza a la realidad nueva:
  enforcement local = auto-signoff (`prepare-commit-msg`) + validación (`commit-msg`, gate único,
  sin re-check en `pre-push`), más la regla del prompt `/commit-all`, más CI KineticCafe (L3). Los
  requirements **comportamentales** de `/commit-all` (`git commit -S -s` en todo commit, nunca
  `--no-verify`) **no cambian**.

## Impact

- `.husky/prepare-commit-msg` — **nuevo** hook; Husky v9 lo registra solo vía `core.hooksPath` (el
  `"prepare": "husky"` existente de `package.json` no cambia).
- `.husky/commit-msg` — **lógica DCO intacta; ediciones contenidas (D7): dos strings — el string
  de guidance del error DCO (tarea 5.8) y el comentario de cabecera `# DCO check (L1)` con su
  etiqueta de capa corregida a L2** — merge skip, grep case-sensitive, `exit 1` y orden antes de
  commitlint quedan byte-idénticos; el guidance deja de recomendar la no-op `git config --global
commit.signoff true` y pasa a `git commit -s` / `git commit --amend -s` + nota del auto-signoff.
  Pasa a ser el **gate local único** de DCO; el fichero ya no queda byte-idéntico en su conjunto
  (solo su lógica DCO lo está).
- `.husky/pre-push` — **cambia: se elimina su bloque de validación DCO** (el re-check por commit del
  rango de push, líneas 16-49 del hook actual) — `pre-push` queda **sin** inspección de trailers
  `Signed-off-by:`. **Se conservan** el `git fetch origin main` y el guard de existencia de
  `origin/main`, porque los tests scoped se ejecutan con `--changed origin/main` y dependen de que
  esa referencia exista localmente y esté actualizada; los tests scoped siguen corriendo y siguen
  bloqueando el push si fallan.
- `docs/learning/dco.md` — doc canónico nuevo, redactado en APPLY; enlaza a
  `docs/learning/ci-cd/05-husky-git-hooks.md` y `docs/learning/ci-cd/05b-commit-signing.md`.
- `docs/CONTEXT-CICD.md` (§10.3–§10.5, §11.1 y header) — corrección **documental** del mito
  `commit.signoff` (APPLY); `AGENTS.md` (bullet de commit-signing) — extensión **documental**: omite
  el signoff por completo y debe documentar el mecanismo real y la convención `git commit -S -s`.
  Cero cambio de comportamiento en hooks o CI.
- Seis docs que afirman que `pre-push` valida DCO — corregidos (solo documentación, APPLY):
  `docs/learning/ci-cd/05e-pr-metadata-governance.md` (L133-137), `CONTRIBUTING.md:58`,
  `docs/learning/ci-cd/01-git-y-yaml.md:141`, `docs/learning/secret-scanning.md:157`,
  `docs/learning/test-impact-analysis.md:264` y `docs/analisis-producto-terminado-erp.md:207` —
  dejan de afirmar que `pre-push` realice validación DCO; tras el change ningún doc commiteado
  sostiene esa afirmación (el DCO local es `prepare-commit-msg` + `commit-msg`, con CI como
  backstop inbypasseable). Cero cambio de comportamiento.
- Specs: deltas en `specs/local-dco-validation/spec.md` (ADDED de auto-signoff + ADDED de
  `commit-msg` como gate local único y de `pre-push` sin validación DCO; ADDED del orden
  `commit-msg` DCO-antes-de-commitlint; REMOVED de _"Hook preserves existing commitlint behavior"_ y
  del re-check de `pre-push`) y `specs/dco-documentation/spec.md`
  (capability nueva); nuevo delta `specs/local-commit-all-dco/spec.md` (MODIFIED solo del escenario
  de docs sobre `05e-pr-metadata-governance.md`). Al archivar se crea
  `openspec/specs/dco-documentation/spec.md` y se extienden `openspec/specs/local-dco-validation/spec.md`
  y `openspec/specs/local-commit-all-dco/spec.md`.
- **Sin cambios**: CI (`KineticCafe/actions-dco@v3.2.0`, ruleset 21227644), `.husky/pre-commit`,
  capabilities `pre-commit-lint-staged`, `pre-push-scoped-testing`, `documentation-canónica-es` y
  las `commit-signing-*` (no tocadas por este change).
