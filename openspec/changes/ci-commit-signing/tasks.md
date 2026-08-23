## 1. Setup local (G1)

- [x] 1.1 Verificar `git >= 2.34` (`git --version`) — requisito para SSH signing nativo (F0)
- [x] 1.2 Generar clave ed25519 dedicada `id_ed25519_projectERP` con passphrase (separada de clave auth): `ssh-keygen -t ed25519 -f ~/.ssh/id_ed25519_projectERP -C "projectERP-signing"` (D1, D7)
- [x] 1.3 Configurar git (4 flags): `git config --global gpg.format ssh`, `git config --global user.signingkey ~/.ssh/id_ed25519_projectERP.pub`, `git config --global commit.gpgsign true`, `git config --global gpg.ssh.allowedSignersFile ~/.ssh/allowed_signers` (R1, D8)
- [x] 1.4 Crear `~/.ssh/allowed_signers` con sintaxis exacta `<email> namespaces="git" <clave-pub>` y validar formato (mal formato rompe verificación local — R12)
- [x] 1.5 Validar: crear commit de prueba con `-S` y ejecutar `git log --show-signature` → debe mostrar "Good git signature" (R1, R2)

## 2. GitHub config (G2)

- [x] 2.1 [MANUAL] Subir clave pública como Signing Key: `gh ssh-key add ~/.ssh/id_ed25519_projectERP.pub --type signing` (o Settings → SSH and GPG keys → tipo "Signing key") (R3)
- [x] 2.2 [MANUAL] Activar vigilant mode en GitHub (Settings → SSH and GPG keys → Vigilant mode) — legacy marca Unverified (R4, F4)

## 3. CI verify job (G3)

- [x] 3.1 Añadir job `verify-signatures` en `.github/workflows/ci.yml` Stage 2 PRE-Build con triggers `pull_request` y `merge_group` (R5, R7, D5)
- [x] 3.2 Implementar lógica de verificación vía GitHub REST API (`verification.verified`) con `jq` + allow-list de bots (dependabot[bot], github-actions[bot] si verified=true); NUNCA `git log %G?` sin allowedSignersFile en runner. El job SHALL declarar `permissions: contents: read` y consultar exactamente: `GET /repos/{owner}/{repo}/pulls/{n}/commits` y `GET /repos/{owner}/{repo}/commits/{ref}` (campo `verification.verified`) (R5, R6, D4, m3)
- [x] 3.3 [NON-BLOCKING] Desplegar el job en modo no-blocking: `continue-on-error: true` con salida de reporte informativo (F2 fase 1 — fail-open) (R5, D5)
- [x] 3.4 Añadir `verify-signatures` a `needs` de `ci-complete` (D5)
- [ ] 3.5 [BLOCKING FLIP] Tras validar en staging, eliminar `continue-on-error` para volver el job blocking (F2 fase 2) (R5, D5)
  > NOTA (post-staging hardening 2026-08-22): scoping base..head + anti-stale retry + null tolerance validados en staging (run 32559337513, PR #93). Cubierto por 3.2/3.5; no anade tareas.

## 4. Release.yml migration (G4)

- [x] 4.0 [GATE] Verificar empíricamente la premisa de bloqueo contra una rama de prueba, resolviendo la dependencia circular con 5.1 mediante un ruleset TEMPORAL (no el de producción): (i) crear ruleset TEMPORAL 'Require signed commits' scoped a rama de prueba `feature/signing-gate-test`; (ii) ejecutar spike (commit vía `changesets/action` o push equivalente con `GITHUB_TOKEN`) contra dicha rama; (iii) capturar resultado/error exacto; (iv) ELIMINAR ruleset temporal; (v) decisión: G4 not-needed vs proceder. SI los commits resultan Verified/aceptados → marcar G4/R8/D2 como _not-needed_ y saltar a F5. SI son rechazados → proceder con 4.1+ (C1, D2)
  - → VEREDICTO: GITHUB_TOKEN_COMMIT_REJECTED=true → migración GitHub App CONFIRMADA necesaria (proceder 4.1+)
- [ ] 4.1 [MANUAL] Crear GitHub App dedicada: (a) crear la App y descargar su private key PEM (`APP_PRIVATE_KEY` — secreto de autenticación JWT, distinto de la signing key); (b) generar par SSH ed25519 separado para la App (`APP_SSH_KEY` / `APP_SSH_PUB` — signing key de la App); (c) registrar `APP_SSH_PUB` como Signing Key en Settings de la cuenta/org dueña vinculada a la App; (d) permisos mínimos de la App: `contents: write` + `pull-requests: write` (D2, M2, m1)
- [ ] 4.2 Añadir secrets `APP_ID`, `APP_PRIVATE_KEY`, `APP_SSH_KEY`, `APP_SSH_PUB` (repo o environment) y usar `actions/create-github-app-token` con `APP_ID` + `APP_PRIVATE_KEY` para generar el token de la App (D2, R8, M2)
- [ ] 4.3 Configurar git en el runner con la SSH signing key de la App: `user.name`/`user.email` de la App, `user.signingkey` apuntando a `APP_SSH_PUB`, y pasar el token a `changesets/action` para que el version commit + Release PR queden Verified (fallback si App indisponible: (a) pausar releases hasta restaurar App — preferido; o (b) firmar en runner con SSH signing key dedicada de emergencia importada vía secret — requiere su .pub registrada como Signing Key previamente) (R8, F3, M2)

## 5. Enforcement (G5)

- [ ] 5.1 [MANUAL] Crear ruleset `Require signed commits` apuntando SOLO a `main` con bypass Admin (emergencias); feature/\* sin protección remota (R9, D3, F5)
- [ ] 5.2 [MANUAL] Marcar `verify-signatures` como required status check en el ruleset de `main` (R5, D5, F2) — ejecutar TRAS 5.1 porque el ruleset debe existir antes de adjuntar el check. NOTA: los rulesets soportan required status checks de forma nativa (regla 'Require status checks to pass'); NO usar branch protection clásica (coherente con D3).
- [ ] 5.3 Validar rechazo: intentar push sin firma a `main` → debe rechazarse con error claro `! [remote rejected] main -> main (push declined)` (R10)

## 6. Documentation (G6)

- [x] 6.1 Crear `docs/commit-signing.md` con onboarding reproducible (Windows/MSYS2), sintaxis exacta de `allowed_signers`, y sección de troubleshooting (error típico `! [remote rejected] main -> main (push declined)`) (R11, R12)
- [x] 6.2 Añadir sección de firma de commits en `AGENTS.md` raíz (R11)
- [x] 6.3 [key-lifecycle] Documentar en `docs/commit-signing.md` el runbook de rotación/revocación de claves: (dev) generar nueva ed25519, añadir `.pub` como Signing Key adicional, actualizar `user.signingkey` + `allowed_signers`, solapar hasta cero commits recientes sin verificar, luego revocar la vieja; y procedimiento equivalente para las claves de la GitHub App (R13, M3)

## Acceptance Criteria (por grupo)

- **setup-local**: `git log --show-signature` muestra "Good git signature" en commit de prueba (R1, R2)
- **github-config**: clave visible como Signing Key; commits Verified; legacy Unverified bajo vigilant mode (R3, R4)
- **ci-verification**: PR con commit no verificado falla el job; bots allow-list si verified=true; merge_group cubierto (condicional a merge queue); PR sin commits nuevos pasa (skip) (R5, R6, R7, m5)
- **ci-migration**: version commit + Release PR Verified vía App SSH (o GATE 4.0 determina not-needed) (R8)
- **enforcement**: push sin firma a main rechazado con error claro (R9, R10)
- **documentation**: onboarding reproducible documentado; troubleshooting presente; runbook de rotación documentado (R11, R12, R13)

## Out of Scope (explícito)

- Reescritura de los 374 commits legacy (enforcement solo futuro, D6)
- Uso de gitsign o S/MIME (D1)
- Cambio de remote HTTPS→SSH
- Firma de commits de Dependabot (se aceptan vía allow-list si verified=true, no se firman manualmente)
- Enforcement en forks externos (limitación conocida, documentada)
- Hook Husky obligatorio de firma (D8: mecanismo es commit.gpgsign=true global)
- **Rotación de claves**: IN-SCOPE (R13 / task 6.3) — NO es out-of-scope
- **Firma de tags de release**: out-of-scope — `tag.gpgsign true` cubre tags locales del dev; los tags empujados por changesets quedan fuera del alcance (m2)
- **Merge queue setup**: out-of-scope — el trigger `merge_group` se añade future-proof pero el repo no tiene merge queue configurada hoy (M4, m6)
