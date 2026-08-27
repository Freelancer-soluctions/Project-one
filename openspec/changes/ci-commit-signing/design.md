## Context

El repositorio usa feature branches (`feature/*`) que se mergean a `main`. No existe `openspec/project.md`. El CI/CD ya está endurecido (SAST/SCA/SBOM/secret scanning) pero el Stage 1 — Source no verifica integridad de autoría. Esta versión consolida el change `commit-signing` previo con decisiones cerradas en grill-me (D1–D8). Ver motivación en proposal.md → Why.

Restricciones del usuario:

- Branching: feature/_ → main. Ruleset `Require signed commits` SOLO en main; feature/_ sin protección remota.
- Firma efectiva exigida a nivel PR vía job `verify-signatures` (pull_request cubre SOLO los commits nuevos del rango base..head) + merge_group.
- `commit.gpgsign=true` global → commits nuevos en features salen firmados automáticamente.

## Goals / Non-Goals

**Goals**

- Firma SSH ed25519 dedicada para devs, verificable por GitHub (Verified).
- Verificación CI por GitHub REST API (no `git log %G?` en runner).
- Migrar `release.yml` para no romper enforcement.
- Enforcement futuro en main vía ruleset + required check.

**Non-Goals**

- Reescribir historial legacy (D6).
- gitsign / S/MIME (D1).
- Hook Husky obligatorio de firma (D8).
- Cambiar remote HTTPS→SSH.
- Firma manual de Dependabot / enforcement en forks externos.

## Decisions

### D1 — Clave SSH ed25519 dedicada

Se usa `id_ed25519_projectERP` (passphrase, separada de clave auth). gitsign descartado (GitHub UI=Unverified, issue sigstore/gitsign#40); S/MIME descartado (sin PKI); GPG alternativo mayor fricción en Windows.

### D2 — Migración de release.yml vía GitHub App

`release.yml` es el ÚNICO workflow que rompe enforcement: `changesets/action@v2` hace `git push` con `GITHUB_TOKEN` (contents:write) y produce commits NO firmados por el dev → con Require signed commits ON en main serían rechazados (evidencia: el código del action usa `git push`, no la REST API). Los otros 6 workflows son SAFE (release.yml es el único que commitea). Se migra usando una GitHub App con su propia SSH signing key + `actions/create-github-app-token`; (fallback si App indisponible: (a) pausar releases hasta restaurar App — preferido; o (b) firmar en runner con SSH signing key dedicada de emergencia importada vía secret — requiere su .pub registrada como Signing Key previamente).

**Resolución pragmática (C1):** NO se eliminan F3/G4/R8/D2 aún. El planner exige verificación empírica de la premisa antes de asumir el bloqueo. Por tanto se añade como PRIMER task de G4 un **GATE (4.0)**: crear rama de prueba con un commit vía el flujo de `changesets/action` (o un push equivalente con GITHUB_TOKEN) contra una rama protegida temporal con "Require signed commits" ON; capturar el error exacto.

- SI los commits resultan Verified/aceptados → marcar G4/R8/D2 como _not-needed_ y saltar a F5 (enforcement).
- SI son rechazados → proceder con 4.1+ (migración real vía GitHub App).

**Procedimiento ejecutable por humano (GitHub App SSH signing):**

1. Crear GitHub App dedicada y descargar su private key PEM (`APP_PRIVATE_KEY` — secreto de autenticación JWT, NO la clave de firma).
2. Generar un par SSH ed25519 **separado** para la App (`APP_SSH_KEY` / `APP_SSH_PUB`) — esta es la signing key de la App, distinta de `APP_PRIVATE_KEY`.
3. Registrar `APP_SSH_PUB` como **Signing Key** en Settings de la cuenta/organización dueña vinculada a la App.
4. Permisos mínimos de la App: `contents: write` + `pull-requests: write`.
5. En el workflow: `actions/create-github-app-token` con `APP_ID` + `APP_PRIVATE_KEY` para generar el token; luego configurar git en el runner con la SSH signing key de la App (`user.signingkey` → `APP_SSH_PUB`, `user.name`/`user.email` de la App), y pasar el token a `changesets/action` para que el version commit + Release PR queden Verified.

**NOTA (D2 — GATE 4.0):** Comportamiento exacto de firma según mecanismo (git push vs REST API) se determina empíricamente en GATE 4.0; el fallback no depende de firmas automáticas de GitHub.

**Corrección D9 (2026-08-26):** La premisa de D2 sobre `git push` es incorrecta para changesets. `changesets/action@v2` usa REST API por defecto, no `git push`. Ver D9 para el análisis completo.

**Resolución GATE 4.0 (2026-08-22):** Estado condicional → **CONFIRMADO** por spike empírico ejecutado por git-manager. Evidencia: push de commit sin firmar autenticado con `GITHUB_TOKEN` (author actions@github.com, %G?=N) contra rama de prueba `feature/signing-gate-test` protegida por ruleset temporal `required_signatures` fue RECHAZADO con `GH013: Repository rule violations found — Commits must have verified signatures` / `! [remote rejected] ... (push declined due to repository rule violations)`. Ref remota permaneció en SHA de main. Limpieza verificada: DELETE 204, rama eliminada, cero residuales. Conclusión: G4/R8/D2 se confirman NECESARIOS — proceder con 4.1+ (migración GitHub App).

### D3 — Ruleset estricto + bypass Admin

Ruleset `Require signed commits` en main con bypass de rol Admin para emergencias.

### D4 — Verificación CI por GitHub REST API

Se usa `verification.verified` de la REST API. NUNCA `git log %G?` en el runner sin `allowedSignersFile` → produciría falsos N para firmas SSH. El job verifica SOLO los commits nuevos del PR (scoping base..head, ver R-PS1); tolera `verification: null` (ver R-PS3) y aplica anti-stale retry (ver R-PS2).

### D5 — Job verify-signatures en Stage 2 PRE-Build

Job en `ci.yml` Stage 2 PRE-Build, triggers `pull_request` + `merge_group`, allow-list de bots (dependabot[bot], github-actions[bot] si verified=true), añadido a `ci-complete.needs`, marcado required status check. El job evalúa SOLO el rango base..head del PR (no la historia previa).

NOTA (M4): el repositorio NO tiene merge queue configurada, por lo que el evento `merge_group` no se dispara hoy; el trigger se añade future-proof (inerte) y la verificación en merge_group es condicional a que se habilite la merge queue (ver R7 en spec ci-verification).

### D6 — No reescribir legacy

Los 374 commits legacy no se reescriben; enforcement solo aplica a commits futuros. El job CI tampoco evalúa la historia previa al PR (R-PS1).

### D7 — Clave signing separada de auth

Mínimo privilegio y revocación independiente.

### D8 — Mecanismo local: commit.gpgsign=true global

Sin hook Husky obligatorio de firma.

### D9 — Changesets API mode: SSH signing config es dead code

**Hallazgo (2026-08-26):** `changesets/action@v2` usa REST API por defecto (`push-with-git-cli: false`). Cuando pusha vía API, GitHub auto-firma los commits con la GPG key de web-flow (id `4AEE18F83AFDEB23`). El ruleset `Require signed commits` acepta firmas web-flow (verified=true). La config SSH en release.yml (gpg.format, signingkey, commit.gpgsign) era dead code: nunca se ejecutaba porque changesets no usa `git push` localmente.

**Corrección a D2:** El GATE 4.0 (spike de 2026-08-22) probó `git push` con GITHUB_TOKEN → rechazado. Pero el spike testó el mecanismo equivocado: changesets no usa `git push`, usa REST API. El resultado del spike (rechazado) era correcto para `git push` pero irrelevante para el comportamiento real de changesets. La migración vía GitHub App (D2) sigue siendo necesaria por el token (APP_ID + APP_PRIVATE_KEY), pero la SSH signing key de la App (APP_SSH_KEY/APP_SSH_PUB) NO es necesaria para release.yml.

**Non-functional even in git-cli mode:** la config SSH solo escribía la clave PÚBLICA (`APP_SSH_PUB`) a `/tmp/github_app_signing_key.pub` — nunca provisionaba la clave PRIVADA en ssh-agent. Sin la privada, la firma SSH es imposible.

**Ref:** `openspec/changes/ci-release-workflow-signing/design.md`

## Post-Staging Resolution (2026-08-22)

Resolución de defectos de diseño y quirks descubiertos empíricamente durante la validación en staging (run `32559337513`, PR #93). Documenta las 4 decisiones derivadas de la evidencia real.

### R-PS1 — Scoping del job a base..head (exclusión de historia previa)

**Defecto descubierto:** en staging el job verificó TODOS los commits incluidos en el PR (~176 en PR #93), de los cuales ~175 son históricos de julio SIN firmar (previos al registro de la signing key `2026-08-21T19:49`). Esto producía falsos negativos masivos sobre historia que el job no debe evaluar.

**Decisión:** el job verifica SOLO los commits introducidos por el PR, obtenidos vía compare endpoint `GET /repos/{owner}/{repo}/compare/{base.sha}...{head.sha}`. La historia previa al PR queda EXPLÍCITAMENTE excluida. La enforcement server-side del ruleset `Require signed commits` cubre lo nuevo; el job es defense-in-depth sobre los commits nuevos del PR.

**Evidencia:** run `32559337513`, PR #93, ~175 commits legacy de julio sin firma (signing key registrada 2026-08-21T19:49).

### R-PS2 — Anti-stale: confirmación individual antes de fallar

**Quirk descubierto:** el endpoint `GET /repos/{owner}/{repo}/pulls/{n}/commits` puede devolver `.verification` stale o `null` para commits recién pusheados, mientras `GET /repos/{owner}/{repo}/commits/{sha}` individual ya reporta `verified: true` con `reason: "valid"`.

**Decisión:** la clasificación negativa del bulk DEBE confirmarse con consulta individual antes de marcarse como failed, con un límite razonable (p.ej. 5 reintentos por run).

**Evidencia:** diagnósticos de staging — discrepancia entre bulk y endpoint individual para commits recién pusheados.

### R-PS3 — Tolerancia a nulls en verification/reason

**Hallazgo:** commits sin firma retornan `verification: null` / `reason: null` (no siempre el string `"unsigned"`). Los filtros deben tolerar `null` y tratarlo como "no verificado" sin romper el parseo.

**Decisión:** los filtros del job tratan `null` como no verificado; no asumen string `"unsigned"`.

**Evidencia:** respuestas de la API en staging para commits sin firma.

### R-PS4 — Práctica de proceso: validación YAML local antes de pushear

**Hallazgo:** 2 ciclos commit+push+CI desperdiciados por startup failures evitables en workflows.

**Decisión:** los cambios a `.github/workflows/*.yml` requieren validación YAML local (`python -c "import yaml; yaml.safe_load(open(...))"`, `node js-yaml`, o `actionlint`) ANTES de pushear.

**Evidencia:** 2 ciclos de CI fallidos por errores de parseo YAML evitables durante la validación staging.

## Risks / Trade-offs

- [Risk] `release.yml` sin migrar bloquea releases → Mitigación: F3 (migrar, SOLO si GATE 4.0 determina necesario) antes de F5 (enforcement).
- [Risk] squash-merge en UI bloqueado salvo autor (dev único = autor, OK) → Mitigación: documentar.
- [Risk] forks externos sin clave bloqueados por verify → Mitigación: limitación conocida, documentada en docs.
- [Risk] `allowed_signers` mal formateado rompe verificación local → Mitigación: documentar sintaxis exacta en docs/commit-signing.md.
- [Risk] Job verifica historia previa del PR (falsos negativos masivos) → Mitigación: scoping base..head vía compare endpoint (R-PS1); el job evalúa SOLO commits nuevos del PR.
- [Risk] Endpoint bulk stale produce falsos negativos en commits recién pusheados → Mitigación: anti-stale retry con consulta individual (R-PS2, 5 reintentos/run).
- [Risk] Commits sin firma retornan `verification: null` y rompen el parseo → Mitigación: filtros tolerantes a nulls (R-PS3).
- [Risk] Startup failures por YAML inválido desperdician ciclos CI → Mitigación: validación YAML local obligatoria antes de pushear (R-PS4).

- [Risk] Premisa de bloqueo de `release.yml` no verificada empíricamente → Mitigación: GATE 4.0 valida el comportamiento real contra una rama protegida temporal con Require signed commits ON antes de comprometer la migración; si el push con GITHUB*TOKEN resulta aceptado/Verified, G4/R8/D2 se marcan \_not-needed* (C1).

## Migration Plan (Rollout F0–F5)

- **F0 — Docs + prep**: verificar git >= 2.34 manualmente. Salida: entorno documentado.
- **F1 — Firma local**: commits dev Verified en GitHub. Salida: commit de prueba Verified.
- **F2 — CI verify no-blocking → blocking**: job informativo primero, luego required check. Salida: PR con commit no verificado falla. El job aplica scoping base..head (R-PS1), anti-stale retry (R-PS2) y tolerancia a nulls (R-PS3).
- **F3 — Migrar release.yml** (CONDICIONAL al GATE 4.0): version commit Verified vía App SSH. F3 es CONDICIONAL al resultado del GATE 4.0: si los commits resultan aceptados/Verified → F3/G4 se marcan _not-needed_ y se salta directo a F5 (F4/vigilant mode ya ejecutado como task 2.2); si son rechazados → se ejecuta la migración vía App. Salida: Release PR Verified.
- **F4 — Vigilant mode ON**: legacy marca Unverified. Salida: commits legacy visibles como Unverified.
- **F5 — Ruleset enforcement en main**: push sin firma rechazado. Salida: push sin firma rechazado con error claro.

**Rollback**: desactivar el ruleset (F5) restaura push sin firma; el job CI puede volver a fail-open.

## Verification Log (Remote Audit — 2026-08-25, this session)

Auditoria remota de solo-lectura via `gh api` (sin flag de almacenamiento) sobre el ruleset de produccion `Require signed commits` (id 21227644). Hallazgos:

- **Ruleset activo**: enforcement=active, target=branch, conditions ref include ~DEFAULT_BRANCH (main). rules=[deletion, non_fast_forward, required_signatures, required_status_checks]. bypass_actors=[] (ninguno — sin bypass excepto los implicitos del rol Admin via D3).
- **required_signatures presente**: el ruleset exige firmas verificadas en main (R9, F5).
- **required_status_checks bindea "Verify Commit Signatures"**: el contexto "Verify Commit Signatures" aparece en `required_status_checks.contexts` del ruleset.
- **CAVEAT de binding por job NAME**: GitHub bindea el required status check al campo `name:` del job (no a un id interno). El job `verify-signatures` declara `name: "Verify Commit Signatures"` en ci.yml; un rename del job SIN actualizar el ruleset romperia el binding (required check dangling). Hazard documentado en comentario de ci.yml (~linea 291, justo encima del job).
- **Integridad del required check**: el job `verify-signatures` tuvo `continue-on-error: true` removido ESTA session (era linea 292 en ci.yml) — ver tasks.md 3.5. Sin esto, el job no garantizaria fallo de merge, invalidando la proteccion del ruleset.

Estado de tareas G5 tras auditoria: 5.1 y 5.2 VERIFIED (checkbox + nota); 5.3 (push-rejection test) queda UNCHECKED pendiente de validacion por el usuario.

## Open Questions

- ¿El dev único actual es siempre el autor de los squash-merges? (asumido sí; si cambia, documentar excepción en allow-list de bots / CODEOWNERS).
