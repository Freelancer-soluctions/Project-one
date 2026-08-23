## 1. Documentación y onboarding

- [ ] 1.1 Crear `docs/commit-signing-setup.md` con guía reproducible de setup SSH signing: generar clave ed25519 dedicada, registrarla en GitHub (Settings → SSH and GPG keys → tipo "Signing key"), configurar `git config --global gpg.format ssh`, `commit.gpgsign true`, `user.signingkey` (para SSH apunta a la clave PÚBLICA, ej. `~/.ssh/signing_key.pub`, NO a la privada), `gpg.ssh.allowedSignersFile = ~/.ssh/allowed_signers` (requerido para que `git log --show-signature` reporte "Good signature" localmente), y sección de troubleshooting (email no coincidente, "Good signature" ausente, clave no reconocida)
- [ ] 1.2 Incluir en `docs/commit-signing-setup.md` un onboarding checklist para nuevos devs: generar clave → subir a GitHub → configurar git → verificar con script → commit de prueba firmado (requisito spec `commit-signing-onboarding`)
- [ ] 1.3 Documentar en `docs/commit-signing-setup.md` la política de historial: baseline tag documental/auditable (branch protection no lo exime), sin reescritura de commits históricos (decisión D3)
- [ ] 1.4 Documentar en `docs/commit-signing-setup.md` la estrategia de bots: Dependabot y `github-actions[bot]` firman automáticamente vía GitHub; anti-patrón PAT de servicio + alternativa OIDC (decisión D4)
- [ ] 1.5 Documentar en `docs/commit-signing-setup.md` el rollback plan: cómo deshabilitar `require signed commits` y/o desmarcar el required check si enforcement bloquea producción (requisito spec `commit-signing-branch-protection`)

## 2. Scripts y hooks locales

- [ ] 2.1 Crear `scripts/setup/verify-signing-setup.sh` que verifique: clave SSH existe, `gpg.format = ssh`, `commit.gpgsign = true`, `user.signingkey` configurado, `gpg.ssh.allowedSignersFile` configurado (sin él `git log --show-signature` no puede verificar firmas SSH y el script reporta "FAIL: gpg.ssh.allowedSignersFile not configured"), y clave pública registrada como SIGNING key en GitHub vía API (NO `ssh -T git@github.com`, que solo confirma autenticación SSH, no que la clave sea signing key):
  ```bash
  local_pubkey=$(cat ~/.ssh/signing_key.pub)
  gh api user/ssh_signing_keys --jq '.[].key' | grep -q "$local_pubkey" \
    && echo "PASS: SSH signing key registered in GitHub" \
    || echo "FAIL: Key not registered as signing key. Upload: gh ssh-key add ~/.ssh/signing_key.pub --type signing"
  ```
  exit code 0 solo si todo pasa (requisito spec `commit-signing-local`)
- [ ] 2.2 Integrar warning no bloqueante de firma en `.husky/pre-commit` (v1 advisory): el hook ejecuta SOLO checks locales (presencia de `gpg.ssh.allowedSignersFile`, `user.signingkey`, `commit.gpgsign`) y muestra warning con enlace a `docs/commit-signing-setup.md` sin bloquear el commit; NO ejecuta `verify-signing-setup.sh` completo (incluye llamada de red a GitHub, 1-2s+ de latencia) — el script completo se ejecuta on-demand (requisito spec `commit-signing-local`)
- [ ] 2.3 Verificar que los hooks existentes (`commit-msg` commitlint, `pre-push` vitest) siguen funcionando con el nuevo warning (sin romper `lint-staged` ni los scans paralelos)

## 3. Baseline y enforcement en main

- [ ] 3.1 Crear baseline tag firmado en el commit actual de `main` (nombre propuesto `v1.0.0-commit-signing-baseline`) y documentarlo en `docs/commit-signing-setup.md` (requisito spec `commit-signing-branch-protection`). NOTA: esta task requiere que la firma SSH del implementador esté configurada (tasks 2.1/2.2 completadas) ANTES de crear el tag firmado.
- [ ] 3.2 Crear `.github/CODEOWNERS` si no existe (requisito de "Require review from Code Owners" en branch protection — NO es requisito de "require signed commits"; el orden de tareas se mantiene porque CODEOWNERS se configura junto con el resto de reglas de protección en 3.3) asignando owners por dominio (`apps/server/`, `apps/client/`, `e2e/`, `docs/`, `.github/`)
- [ ] 3.3 Configurar branch protection en `main` vía GitHub API con `gh` CLI preservando reglas existentes (PR requerido, sin push directo, sin force-push) — fase v2 (requisito spec `commit-signing-branch-protection`):
  1. GET del estado actual: `gh api repos/Freelancer-soluctions/Project-one/branches/main/protection`
  2. PUT del body completo preservando reglas existentes (PR requerido, sin push directo, sin force-push)
  3. Habilitar firmas obligatorias vía sub-endpoint dedicado (NOTA: `required_signatures` NO es un campo del body de PUT /branches/{branch}/protection — es un sub-endpoint separado; usarlo en el body falla con 422):
  ```bash
  # Habilitar firmas en main (sub-endpoint dedicado)
  gh api repos/Freelancer-soluctions/Project-one/branches/main/protection/required_signatures \
    --method POST \
    --field enabled=true
  ```

## 4. Verificación en CI

- [ ] 4.1 Crear job `commit-signature-verify` en workflow dedicado `commit-signature.yml` (NO gateado por `needs: changes`/path filtering — la verificación de firmas es independiente de qué paths cambiaron) que valide `commit.verification.verified == true` para todos los commits del PR vía GitHub API (fork-safe, a diferencia de `git rev-list`):

  ```yaml
  # steps del job commit-signature-verify
  - uses: actions/checkout@v4
    with:
      fetch-depth: 0

  - name: Verify commit signatures
    env:
      GH_TOKEN: ${{ github.token }}
    run: |
      COMMITS=$(gh api repos/${{ github.repository }}/pulls/${{ github.event.pull_request.number }}/commits \
        --paginate \
        --jq '.[] | {sha: .sha, verified: .commit.verification.verified, reason: .commit.verification.reason, author: .commit.author.name}')

      FAILED=$(echo "$COMMITS" | jq -r 'select(.verified == false) | "❌ \(.sha[0:7]) by \(.author): \(.reason)"')

      if [ -n "$FAILED" ]; then
        echo "❌ UNVERIFIED COMMITS DETECTED:"
        echo "$FAILED"
        exit 1
      fi
      echo "✅ All commits verified"
  ```

  Nota: `fetch-depth: 0` asegura que base...head tenga sentido; `gh api pulls/{n}/commits` es fork-safe (a diferencia de `git rev-list`); manejar rate limits con try/catch o fail-open en v1 (requisito spec `commit-signing-ci-verification`)

- [ ] 4.2 Implementar modo fail-open/fail-closed del job vía variable de workflow (fase 1: fail-open informativo; fase 3: fail-closed required check) reportando SHA(s) infractores con `reason` (requisito spec `commit-signing-ci-verification`)
- [ ] 4.3a En fase 3: marcar `commit-signature-verify` como required check en la branch protection de `main` vía API (mismo patrón `gh api` del task 3.3, actualizando `required_status_checks.contexts`)
- [ ] 4.3b Test del job: crear un PR con un fixture de commit sin firmar y verificar que el job `commit-signature-verify` falla (y que el PR queda bloqueado en fase 3)

## 5. Documentación de estado CI/CD y cierre

- [ ] 5.1 Marcar como "Implemented" la práctica de firma de commits en `docs/ci-cd-pipeline-empresarial.md` §3 Stage 1 Source (práctica 5) con fecha y referencia al change
- [ ] 5.2 Actualizar `docs/cicd-estado-actual.md` §5 Stage 1 con el nuevo gate de firma (pre-commit warning + branch protection + job CI)
- [ ] 5.3 Verificar en PR de implementación que no hay conflictos con `ci-supply-chain-security` (SBOM/dependency-review) ni con los workflows existentes (deploy/preview/release/security)
