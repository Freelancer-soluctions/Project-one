# SCA Dependency Lockfile Scan — Implementación Profesional / Enterprise

> Verificado 2026-09-26 — referencias oficiales comprobadas (`docs.npmjs.com`, `docs.snyk.io`, `github.com/actions/dependency-review-action`, `aquasecurity.github.io/trivy`, `docs.github.com/en/code-security/dependabot`). Implementación previa consultada: [`docs/learning/dependency-review.md`](./dependency-review.md) (§3.1 `ci.yml` L765), [`docs/learning/license-compliance.md`](./license-compliance.md) (§3 tabla 3 capas), `.github/workflows/ci.yml` (`dependency-review` L765-787), `.github/workflows/security.yml` (`dependency-scan` Trivy + job `sbom` — **re-habilitados 2026-09-25**, API `state: active`, change `secret-scanning`; nota `SECURITY.md` de `disabled_manually` fechada 2026-09-23 = desactualizada, ver `docs/CONTEXT-CICD.md` L27).
>
> **Nota:** este documento cubre el análisis de **vulnerabilidades en lockfiles** (CVE por dependencia resuelta), no licencias (eso vive en `license-compliance.md` / `license-policy.md`). El pipeline actual tiene `dependency-review` (manifest PR-time, blocking) + Trivy filesystem (`security.yml` `dependency-scan`, activo desde 2026-09-25 en modo audit `continue-on-error: true`); falta capa sistemática de **lockfile audit** (full repo + PR delta del lockfile) — `npm audit` no corre en ningún workflow activo (solo en `ci-enterprise.yml`, workflow `disabled_manually`).

---

## 1. Contexto y ubicación en pipeline

**SCA = Software Composition Analysis**. Analiza _qué_ dependencias se resuelven y _qué CVE_ llevan. Hay tres fuentes de datos distintas:

| Fuente                             | Archivo / Dato                       | Qué revela                         | Cobertura actual (`project-one`)                                                                            | Gap                                                                                              |
| ---------------------------------- | ------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Manifest** (`package.json`)      | Declaración directa                  | Intención de dependencias          | `dependency-review-action@v5` (`ci.yml` L765)                                                               | No resuelve versiones transitivas; ignora `node_modules` resuelto                                |
| **Lockfile** (`package-lock.json`) | Resolución exacta + árbol transitive | CVE reales en versiones instaladas | ❌ **No auditado sistemáticamente** (solo `npm audit` en `ci-enterprise.yml`, workflow `disabled_manually`) | `npm audit` / `snyk` no configurados en workflows activos; `dependabot.yml` YA existe (ver §3.3) |
| **Filesystem / node_modules**      | Archivos físicos de librería         | Código fuente + licencia + CVE     | Trivy `security.yml` `dependency-scan` (✅ activo desde 2026-09-25, audit mode)                             | Requiere `npm ci`; más lento; no es lockfile puro; `continue-on-error: true` no bloquea          |

Referencia pipeline: `docs/ci-cd-pipeline-empresarial.md` §23.3 `Stage 2` (`Security`); `docs/learning/dependency-review.md` §3.1 (job `dependency-review` blocking `moderate`, `deny-licenses` L795, `comment-summary-in-pr: on-failure`); `docs/learning/quality-gates.md` §2 (fila `dependency-review`: `blocking (PR)`).

---

## 2. Referencias oficiales verificadas (2026-09-26)

| Fuente / URL                 | Estado                                                                                                                            | Nota clave / Corrección                                                                                                                                                                                                                                                           |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm audit` CLI              | ✅ `docs.npmjs.com/cli/v11/commands/npm-audit` 200                                                                                | `npm audit` (lockfile integrado); `npm audit fix`; `--audit-level=low\|moderate\|high`; `--json`; `--production` (ignora dev). No requiere `package-lock.json` explícito si `npm ci` ya resuelto.                                                                                 |
| Snyk CLI / GitHub App        | ✅ `docs.snyk.io/developer-tools/snyk-cli/overview` 200                                                                           | `snyk test` (lockfile + manifest); `snyk monitor` (baseline); `--severity-threshold=high`; `snyk-to-html`; GitHub App emite PR checks (`Snyk Security`). Requiere `SNYK_TOKEN`.                                                                                                   |
| Dependabot config            | ✅ `docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file` 200 | `groups` (agrupación), `schedule` (`weekly` / `daily`), `open-pr-limit`, `ignore`. No es scan de CVE en CI, es actualización automática + alertas. Complementario, no reemplazo.                                                                                                  |
| Dependency Review Action     | ✅ `github.com/actions/dependency-review-action` 200                                                                              | Solo manifiesto PR diff (`compare/{basehead}`); no lee `package-lock.json` completo; `fail-on-severity: moderate`; `license-check: true`; `deny-licenses`. Ver `docs/learning/dependency-review.md` §3.1.                                                                         |
| Trivy filesystem scan (`fs`) | ✅ `aquasecurity.github.io/trivy/latest/` 200                                                                                     | `trivy fs --scanners vuln --format sarif --output trivy.sarif`; cubre `node_modules` + `package-lock.json`; requiere `node_modules` presente o `npm ci`. `security.yml` lo tiene (✅ activo desde 2026-09-25, API `state: active`, modo audit `continue-on-error: true`, ver §4). |
| OWASP Dependency-Check       | ✅ `owasp.org/www-project-dependency-check/` 200 (v13.0, flagships 2026)                                                          | CLI / Maven / Gradle + GitHub Actions; descarga NVD + CPE/CVE evidence + XML/JSON; más pesado; usado en entornos con política estricta de evidence. Complementario; no adoptar en `project-one` (Trivy + `npm audit` cubren el caso).                                             |

---

## 3. Técnicas profesionales / enterprise para lockfile audit

### 3.1 `npm audit` (lockfile nativo, sin credenciales extra)

```bash
# Full repo — evidencia semanal / audit
npm ci              # garantiza lockfile resuelto idéntico
npm audit --audit-level=moderate --json > audit-report.json
npm audit fix --dry-run  # preview de remediación
```

- **Entrada:** `package-lock.json` (resuelto por `npm ci` en CI, no en local si no hay lockfile actualizado).
- **Salida:** JSON con `vulnerabilities` (key por paquete), `metadata`, `advisories`; `exit 1` si nivel excedido.
- **Enterprise:** output `audit-report.json` → artifact 90d (`scheduled-security.yml`); integración con `upload-artifact`; `continue-on-error: true` para fase 1 (advisory) → `false` fase 2.
- **Limitación:** solo cubre `npm`; no cubre `yarn`/`pnpm` sin adaptación; no emite SARIF nativamente (transformar a SARIF requiere script intermedio o usar Trivy/Snyk para SARIF).

### 3.2 `snyk test` (SCA profesional, baseline + PR)

```bash
# PR-time / local pre-commit
snyk test --severity-threshold=high --json-file-output=snyk.json
# Weekly full repo + monitor
snyk monitor --org=project-one --project-name=monorepo
```

- **Entrada:** `package-lock.json` + `package.json`; requiere `SNYK_TOKEN` (secret).
- **Salida:** JSON / HTML; PR checks (`Snyk Security`); `severity` + `fix-info`; `sarif` posible vía `snyk-to-html` + transformación.
- **Enterprise:** baseline `monitor` permite comparar delta (`snyk test --baseline`); `fail-on-scopes` no aplica (Snyk cubre `runtime` + `development` por diseño); `ignore` documentado (`.snyk` policy file).
- **Limitación:** requiere token + organización; no es open-source puro; integración nativa con GitHub PR checks (mejor que `npm audit` para gate de merge).

### 3.3 `dependabot.yml` (actualización automática + alerta) — **YA EXISTE en `project-one`**

`.github/dependabot.yml` verificado (npm + github-actions + docker; `weekly` lunes 03:00 UTC; `groups.dev-dependencies`; `open-pull-requests-limit: 10`; `ignore` semver-major de react/react-dom):

```yaml
# .github/dependabot.yml (existente, verificado 2026-09-26)
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '03:00'
      timezone: 'UTC'
    open-pull-requests-limit: 10 # clave oficial (NO `open-pr-limit`)
    groups:
      dev-dependencies:
        patterns:
          [
            'eslint*',
            'prettier*',
            'typescript*',
            'vitest*',
            '@testing-library*',
            '@types*',
          ]
        update-types: ['minor', 'patch']
  # + ecosistemas "github-actions" (raíz) y "docker" (/apps/server), idem schedule
```

- **Entrada:** `package-lock.json`; actúa por repositorio, no por PR.
- **Salida:** PRs automáticos (`dependabot`); alertas en Security tab; `package-lock.json` actualizado.
- **Enterprise:** `groups` ya existe (evita ruido); `schedule: weekly` alinea con `scheduled-security.yml` (lunes 03:00); ajuste propuesto = grupo `security-patches` (solo `patch`) + `cooldown` (default 3 días desde 2024; `default-days` configurable) — ver `dependency-review.md` §4.4.
- **Limitación:** no bloquea merge por CVE existente (solo actualiza); es prevención, no gate. Complementario a `npm audit` / `snyk`.

### 3.4 Lockfile differences (relevante para monorepo `project-one`)

| Lockfile            | Manager   | Característica clave para audit                                          | Recomendación para `project-one`             |
| ------------------- | --------- | ------------------------------------------------------------------------ | -------------------------------------------- |
| `package-lock.json` | npm (v9+) | Resuelve árbol completo; `lockfileVersion: 3`; determinista con `npm ci` | ✅ Actual; usar `npm audit` + `npm ci` en CI |
| `yarn.lock`         | Yarn      | `resolutions`; determinista; `yarn audit` nativo                         | N/A en repo (no usado)                       |
| `pnpm-lock.yaml`    | pnpm      | `lockfileVersion: '6.0'`; `pnpm audit` nativo; `shameban`                | N/A en repo                                  |

---

## 4. Implementación previa (`project-one`) — estado verificado

| Capa / Job                               | Ubicación                                          | Estado 2026-09-26                                                                                                                                           | Qué hace                                                                                                | Qué NO hace (gap respecto a lockfile audit profesional)                                                                |
| ---------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `dependency-review`                      | `.github/workflows/ci.yml` L765                    | ✅ Activo, `moderate`, `deny-licenses` L795, `comment-summary-in-pr: on-failure`                                                                            | Manifest diff PR-time; bloquea ≥moderate; comento PR                                                    | No lee `package-lock.json`; ignora dependencias transitivas no cambiadas en manifest                                   |
| `security.yml` `dependency-scan` (Trivy) | `.github/workflows/security.yml`                   | ✅ **Activo desde 2026-09-25** (API `state: active`, change `secret-scanning`); Trivy `@0.36.0`, SARIF artifact 90d + `upload-sarif@v4` (`category: trivy`) | Filesystem completo (`npm ci` + lockfile + OS); CVE + SARIF + job `sbom` (`anchore/sbom-action@0.24.0`) | Modo audit (`continue-on-error: true`) → **no bloquea**; no distingue delta del PR; no hace `npm audit` (advisory npm) |
| `scheduled-security.yml`                 | `.github/workflows/scheduled-security.yml`         | ✅ Activo desde 2026-09-25; `gitleaks-full-scan` + `scancode-license-audit` (sem.)                                                                          | Audit semanal de secrets + licencia archivo (evidence 90d)                                              | No incluye `npm audit` / lockfile audit semanal (**gap real de este doc**)                                             |
| `ci-enterprise.yml` (referencia)         | — (archivo **retirado**)                           | ⛔ Ya no existe en el repo ni en el registro de workflows (`CONTEXT-CICD.md` §5.9)                                                                          | Job `Dependency Audit`: `npm audit --audit-level=high` (L117) — referencia histórica                    | Precedente de patrón; no ejecutable; threshold `high` (menos estricto que `moderate` propuesto)                        |
| `.github/dependabot.yml`                 | `.github/dependabot.yml`                           | ✅ Activo (config; corre vía GitHub `dependabot-updates`)                                                                                                   | Updates semanales npm/actions/docker + grupos                                                           | No es gate de CVE (prevención); D4 pasa a "ajustar" no "configurar"                                                    |
| `prebuild-security-complete`             | `.github/workflows/ci.yml` **L1465** (needs L1469) | ✅ Agrega `dependency-review` + `secrets`                                                                                                                   | Gate de merge que requiere ambos                                                                        | No exige lockfile audit adicional                                                                                      |
| `docs/learning/dependency-review.md`     | `docs/learning/dependency-review.md`               | ✅ Documentado (2026-09-25)                                                                                                                                 | Política, referencias, taxonomía, corrections URLs                                                      | No cubre `npm audit` / `snyk` / `dependabot` como capas separadas                                                      |

---

## 5. Patrón recomendado (enterprise / professional) — integración con existente

No reemplazar `dependency-review` (es manifest PR-time, rápido, bloqueante). Añadir **3 capas adicionales** para cubrir lockfile audit:

### 5.1 Pre-commit / local (shift-left, rápido)

```bash
# .husky/pre-commit (o script local)
npm ci && npm audit --audit-level=moderate --json > .tmp/audit-local.json || true  # advisory local
```

- **Tiempo:** segundos.
- **Blocking:** no (advisory); solo informa al desarrollador antes de `git commit`.
- **Artefacto:** `.tmp/audit-local.json` (no subido; ignorado por `.gitignore`).

### 5.2 PR-time — lockfile delta (cierre gap `dependency-review` para archivos resueltos)

```yaml
# .github/workflows/ci.yml — nuevo job o paso en dependency-review existente
lockfile-audit:
  name: Lockfile Audit (PR delta)
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  needs: repo-discovery
  steps:
    - uses: actions/checkout@v5
    - run: npm ci
    # Fase 1 (advisory): npm audit ya sale con exit !=0 si hay hallazgos >=
    # audit-level (docs.npmjs.com npm-audit §Exit Code) — no hace falta parsear
    # JSON con scripts intermedios. Se captura el reporte sin fallar el step.
    - name: Run npm audit (reporte, fase 1 advisory)
      id: audit
      continue-on-error: true
      run: npm audit --audit-level=moderate --json > audit-report.json
    - name: Upload artifact (14d)
      if: always()
      uses: actions/upload-artifact@v7
      with:
        name: lockfile-audit-pr
        path: audit-report.json
        retention-days: 14
        if-no-files-found: warn
    # Fase 2 (bloqueante, tras 2-4 sem sin falsos positivos): sustituir
    # continue-on-error: true por fallo real — el exit code nativo basta:
    - name: Fail gate (fase 2 — bloqueante)
      if: steps.audit.outcome == 'failure'
      run: exit 1
```

- **Entrada:** `package-lock.json` + `npm ci` (resuelve idéntico a CI).
- **Salida:** `audit-report.json` (artifact 14d); `exit 1` si hallazgos.
- **Coherencia:** usa `npm` nativo; no requiere token; se integra con `prebuild-security-complete.needs` si se quiere bloqueante en fase 2.

### 5.3 Semanal / full repo — evidencia 90d + compliance

```yaml
# .github/workflows/scheduled-security.yml — extender existente
lockfile-audit-weekly:
  name: Lockfile Audit Weekly
  runs-on: ubuntu-latest
  if: github.event_name == 'schedule'  # o workflow_dispatch
  steps:
    - uses: actions/checkout@v5
    - uses: actions/setup-node@v4
      with: node-version-file: '.nvmrc'
    - run: npm ci
    # Fase 1 (advisory): mismo patrón que §5.2 y que el audit-mode de
    # scheduled-security.yml (continue-on-error + artifact)
    - name: Run npm audit (semanal, fase 1 advisory)
      continue-on-error: true
      run: npm audit --audit-level=moderate --json > audit-weekly.json
    - name: Upload evidence (90d)
      if: always()
      uses: actions/upload-artifact@v7
      with:
        name: lockfile-audit-weekly
        path: audit-weekly.json
        retention-days: 90
        if-no-files-found: warn
    - name: Trivy filesystem supplementary (SARIF)
      continue-on-error: true   # audit mode, idéntico a security.yml dependency-scan
      uses: aquasecurity/trivy-action@0.36.0
      with:
        scan-type: fs
        scan-ref: .
        format: sarif
        output: trivy-vuln.sarif
    - name: Upload SARIF
      uses: github/codeql-action/upload-sarif@v4
      if: always()
      with:
        sarif_file: trivy-vuln.sarif
    # SBOM (evidencia compliance) — misma acción/tag que el job `sbom` de security.yml
    - name: SBOM (SPDX)
      uses: anchore/sbom-action@v0.24.0
      with:
        output-file: sbom-project-one.json
    - name: Upload SBOM (90d)
      if: always()
      uses: actions/upload-artifact@v7
      with:
        name: sbom-weekly
        path: sbom-project-one.json
        retention-days: 90
        if-no-files-found: warn
```

- **Coherencia:** alinea con `scancode-license-audit` (semanal, 90d, `continue-on-error: true` fase 1); evidencia SPDX/SARIF para SOC2/ISO 27001.
- **Versions pinnadas = repo real (2026-09-26):** `actions/upload-artifact@v7`, `aquasecurity/trivy-action@0.36.0`, `github/codeql-action/upload-sarif@v4`, `anchore/sbom-action@v0.24.0` (los mismos tags de `security.yml`/`scheduled-security.yml`; nada de `@master` ni tags obsoletos).
- **Paso SBOM añadido:** `anchore/sbom-action` genera `sbom-project-one.json` → artifact 90d, reflejando el job `sbom` de `security.yml` (SBOM + evidencia SOC2/ISO 27001 junto al SARIF y al JSON de `npm audit`).
- **Gap cubierto:** `npm audit` da CVE de lockfile; Trivy da SARIF + filesystem completo; `dependabot.yml` previene futuras introducciones.

---

## 6. Limitaciones y riesgos (corporativo / enterprise)

| Riesgo                                                                     | Impacto                         | Mitigación (documentada o propuesta)                                                                                                                                          |
| -------------------------------------------------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm audit` solo cubre `npm`; `yarn`/`pnpm` no                             | Monorepo podría migrar          | Documentar `yarn audit` / `pnpm audit` equivalentes; usar `trivy fs` como capa independiente de manager                                                                       |
| `npm audit` no emite SARIF nativo                                          | SOC2 / evidencia requiere SARIF | Complementar con Trivy (`security.yml` `dependency-scan`) o transformar JSON → SARIF vía script (`scripts/convert-audit-to-sarif.mjs`)                                        |
| `package-lock.json` puede ser desactualizado (dev no corrió `npm install`) | Falsos negativos en PR          | En CI siempre `npm ci`; en local pre-commit `npm ci` + `npm audit`; `dependabot.yml` mantiene actualizado                                                                     |
| Dependabot PRs pueden ser ruidosos (muchos grupos)                         | Fatiga del equipo               | `groups` + `exclude-patterns`; `open-pr-limit: 10`; `schedule: weekly`; no bloquear merge por Dependabot (es actualización, no gate)                                          |
| Token `SNYK_TOKEN` / `FOSSA_API_KEY` para Snyk/FOSSA                       | Secret rotation, acceso         | Usar `secrets.SNYK_TOKEN`; rotar 90d; no exponer en logs; `security-events: write` solo si se usa SARIF / PR comment                                                          |
| `scancode` (archivo de librería) ≠ `npm audit` (lockfile CVE)              | Confusión de capas              | Documentar claramente: `license-compliance.md` = archivo + licencia; `sca-dependency-lockfile-scan.md` = CVE resuelto por lockfile; `dependency-review.md` = manifest PR-time |

---

## 7. Decisiones para `project-one` (coherentes con cambios existentes)

1. **D1 — No reemplazar `dependency-review` (L765):** manifest PR-time es rápido y bloqueante; se mantiene.
2. **D2 — Añadir `lockfile-audit` PR-time (fase 1 advisory):** `npm audit --json` + artifact 14d; `continue-on-error: true`; **FASE 2 blocking activa desde 2026-11-10** (sin COE a nivel job ni en el step de audit).
3. **D3 — Extender `scheduled-security.yml` con `lockfile-audit-weekly`:** evidencia 90d; `npm audit` + `trivy fs` (SARIF); alinea con `scancode-license-audit`.
4. **D4 — Ajustar `.github/dependabot.yml` existente (NO crear el archivo):** ya está activo (npm + github-actions + docker, `weekly` lunes 03:00 UTC, `groups.dev-dependencies`, `open-pull-requests-limit: 10` — ver §3.3); el ajuste se limita a añadir grupo `security-patches` (solo `patch`) + `cooldown`/`default-days`; prevención, no gate; complementario.
5. **D5 — Pre-commit local (opcional, fase 1):** `npm audit --audit-level=moderate` en `.husky/pre-commit`; advisory; sin artifact.
6. **D6 — Validación local antes de merge:** `npm ci && npm audit` debe pasar sin hallazgos `≥ moderate`; si falla → corregir `package-lock.json` (remediación o actualización) antes de merge; no usar `npm audit fix --force` sin revisión humana.

---

## 8. Fuentes (verificadas esta sesión)

- `docs.npmjs.com/cli/v11/commands/npm-audit` (200) — CLI reference, `audit-level`, `--json`, `fix`
- `docs.snyk.io/developer-tools/snyk-cli/overview` (200) — Snyk CLI, `test`, `monitor`, `severity-threshold`
- `github.com/actions/dependency-review-action` (200) — manifest-only, `fail-on-severity`, `deny-licenses`
- `docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file` (200) — `groups`, `schedule`, `open-pr-limit`
- `aquasecurity.github.io/trivy/latest/` (200) — `trivy fs --scanners vuln --format sarif`
- `owasp.org/www-project-dependency-check/` (200, v13.0 — OWASP Flagships 2026) — OWASP Dependency-Check: CLI/Maven/Gradle + GitHub Actions, NVD + evidencia CPE/CVE (citado en §2); complementario, no adoptar en `project-one` (Trivy + `npm audit` cubren el caso)
- Referencias internas: `docs/learning/dependency-review.md`; `docs/learning/license-compliance.md`; `docs/learning/license-policy.md`; `docs/learning/quality-gates.md`; `.github/workflows/ci.yml` L765-787; `.github/workflows/security.yml`; `.github/workflows/scheduled-security.yml`

---

## 9. Estado del documento

- Creado: `docs/learning/sca-dependency-lockfile-scan.md` (2026-09-26)
- Revisión: `docs/learning/dependency-review.md` (2026-09-25) — coherencia confirmada; no duplicado (este cubre lockfile/CVE, aquel cubre manifest + política licencia + referencias corregidas)
- Siguiente paso propuesto (fuera de este doc): crear artifacts de implementación (`ci.yml` paso `lockfile-audit`; `scheduled-security.yml` extensión) y **ajustar** `.github/dependabot.yml` existente (grupo `security-patches` + `cooldown`; no crear el archivo, ver §7 D4); validar `npm audit` local en `project-one`; comparar `audit-report.json` vs `trivy-vuln.sarif` para evidencia enterprise.
- **IMPLEMENTADO (change `sca-lockfile-compliance`, 2026-09-26):** job `lockfile-audit` en `ci.yml` (FASE 1 advisory, artifact `lockfile-audit-pr` 14d, **sin `npm ci`** — el audit lee `package-lock.json` directamente) + job `lockfile-audit-weekly` en `scheduled-security.yml` (artifact 90d + SBOM `npm sbom` 90d, **sin nuevo Trivy** — el CVE filesystem semanal ya corre en `security.yml` `dependency-scan`, `category: trivy`) + capa local advisory en `.husky/pre-commit` (`.tmp/audit-local.json`) + `.github/dependabot.yml` ajustado (grupo `security-patches` con `applies-to: security-updates` + `cooldown.default-days: 7`); filas en `quality-gates.md` §2/§4.4 (taxonomía `prevención` para dependabot).
- **Separación de capas — typosquatting (change `typosquatting-detection`, 2026-09-28):** la capa de GuardDog (`typosquat-guarddog`/`guarddog-weekly`, política única en `scripts/guarddog-verify.sh`) es **complementaria, no duplicada**: `npm audit`/`lockfile-audit` cubren CVEs **con advisory DB** (0-day sin CVE = fuera de alcance), mientras GuardDog cubre **typosquat/malicious-package por metadatos + YARA** (similitud de nombre con paquetes populares, dependency confusion, homoglyphs, install scripts) — señales que la advisory DB no emite. Ambas corren sobre el mismo manifiesto con categorías SARIF distintas (`lockfile-audit` JSON vs `guarddog` SARIF) y sin solape de reglas.
- **Bloqueos de validación local (2026-09-26):**
  1. `scancode` NO está instalado en PATH (`scancode: command not found`) → la validación de la capa de licencias usa la imagen Docker pinnada `aboutcode/scancode-toolkit:32.5.0` (requiere `docker pull`).
  2. `scan-list.txt` NO existe en el repo (0 matches) → no se crea: la lista de escaneo PR-diff se genera en runtime con `git diff --name-only --diff-filter=ACMR` (Added/Copied/Modified/Renamed).
  3. `npm audit` no emite SARIF nativo → la evidencia SARIF sale de Trivy (`security.yml` `dependency-scan`, `upload-sarif@v4`) o de un transformador JSON→SARIF propio; el JSON de `npm audit` se conserva como artifact (90d semanal / 14d PR).
- **TRIAJE `npm audit` 90 → 15 (2026-09-27, change `sca-lockfile-compliance` task 5.1b, aprobado por usuario; sin `npm audit fix --force`):**

  | Métrica                     | Antes (2026-09-26) | Después (2026-09-27) |
  | --------------------------- | ------------------ | -------------------- |
  | Total hallazgos             | 90                 | **15**               |
  | ≥ moderate                  | 85                 | **14**               |
  | critical / high / mod / low | 5 / 29 / 51 / 5    | 2 / 2 / 10 / 1       |

  **Rondas de remediación** (resolución con `npm@12` vía `npx npm@12 install --package-lock-only` — el arbiter de npm 10.9.8 crashea en este árbol con `Cannot read properties of null (reading 'edgesOut')`; `--legacy-peer-deps` también necesario en un paso):
  1. **Tiptap familia unificada 3.22/3.23 mixta → 3.31.3** (`apps/client`, 12 paquetes + `@tiptap/pm`): los peers exactos de tiptap exigen una sola versión del family — 90 → 56 hallazgos (−34 moderate).
  2. **Non-breaking batch** (`npm update ... --legacy-peer-deps`): vitest family → 4.1.11 (3 critical), next → 16.3.6, axios, js-cookie, postcss, react-router, express, joi, mermaid, hono, flatted, query-string, @babel/core, decode-uri-component, colord, @humanfs/node — 56 → 45 (crit 5 → 2).
  3. **Majors aprobados**: `omniroute` 3.8.49 → 3.8.50 (devDep), `markdownlint-cli` 0.45.0 → 0.49.1 (arrastra js-yaml ~5.2/minimatch ~10.2.5/smol-toml ~1.7 → limpia glob@11, minimatch@10, js-yaml@4, smol-toml, markdown-it@14 moderates), `uuid` 9 → 14 (sin imports en código fuente; unifica con mermaid/omniroute), `deepmerge-ts` 7 → 8, `esbuild` 0.27.3 → 0.28.2, `@prisma/language-server` `^31.11.0` → pin `31.0.7766` (la advisory marca vulnerable `>=31.0.7775` — el fix de npm es un pin a la build previa; devDep del servidor) — 45 → 17.
  4. **In-range + dedupe refresh**: `vite` root `6.4.2` → `^7.3.6` + server `7.3.1` → `^7.3.6` (vulnerable `7.0.0 - 7.3.3`), quill `2.0.3` → pin `2.0.2` (downgrade aprobado: 2.0.3 introdujo la XSS en HTML export; no existe 2.0.4), `onnxruntime-node` (root copy 1.24.3 → 1.30.0 vía refresh), `js-yaml@3.15.1` (depcheck) → 3.15.2, `brace-expansion` 1.1.x/2.1.0 → 1.1.18/2.1.4, `@huggingface/transformers` → 4.3.0 (transitivo de omniroute; limpia adm-zip/sharp nested) — 17 → 15.

  **Waivers (15 hallazgos → 2 causas raíz, issues de tracking creados 2026-09-27: [#131](https://github.com/Freelancer-soluctions/Project-one/issues/131) omniroute, [#132](https://github.com/Freelancer-soluctions/Project-one/issues/132) storybook):**

  | Causa raíz                  | Hallazgos heredados                                                                                                                                            | Severidad                             | Justificación del waiver                                                                                                                                                                                  |
  | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `omniroute@3.8.50` (devDep) | `omniroute` (RCE ACP, critical), `next@16.3.1` (RCE ×2, critical), `onnxruntime-node` + `adm-zip` (high), `dompurify@3.4.13` (moderate), `monaco-editor` (low) | 2 critical, 2 high, 1 moderate, 1 low | Dependencia de tooling IA sin fix disponible upstream (3.8.50 = latest; su pin `next@16.3.1` es interno). No corre en producción. FASE 2 del gate requerirá fix upstream o override/exclusión documentada |
  | `storybook@9.1.20` (devDep) | 8 paquetes `@storybook/*` (moderate), `@vitest/mocker@3.2.4` elevado desde `storybook@9.1` (moderate)                                                          | 9 moderate                            | Fix solo en `storybook@10.x` (migración mayor futura; 9.2.0 stable no existe aún — solo alphas vulnerables). No corre en producción                                                                       |

- **TRIAJE `npm audit` 66 → 54 (2026-11-12, sin `--force`):** el gate llevaba rojo en cada PR desde la deriva de advisories. `omniroute` 3.8.50 → **3.8.53** (patch; elimina los critical de `omniroute`/`next` y los high de `adm-zip`/`onnxruntime-node`) + overrides `launch-editor@^2.14.2`, `shell-quote@^1.12.0`, `dompurify@^3.4.17` (nested de `monaco-editor`): **68 → 54**, critical **6 → 1**, high **21 → 15**. El residual no tiene fix forward seguro: `npm audit fix`/`npm update` crashean en este árbol (`Cannot read properties of null (reading 'edgesOut')` — bug del arborist de npm 10.9.8), y las "recomendaciones" de `fixAvailable` para `@lhci/cli`, `typescript-eslint`, `markdownlint-cli` o `depcheck` son **downgrades**. Quedan mayores pendientes: `storybook@9.1.20` → `@vitest/mocker@3.2.4` (fix en 9.1.21/10.x; npm no resuelve 9.1.21 en este workspace, requiere `npm ci` limpio desde un lock regenerado), `body-parser` 2.x (Express 5), `vite` 8, `zod` 4 (`shadcn-ui`), cadena Lighthouse/`@lhci/cli`.

- **TRIAJE `npm audit` 54 → 23 (2026-11-13, sin `--force`):** con el lockfile regenerado desde cero (los overrides con clave de rango parent-scoped no reescriben copias anidadas en el lock, y el árbol queda `invalid` hasta un `npm ci` limpio) se cierran los hallazgos que sí tenían fix forward: `storybook` 9.1.20 → **10.6.7** (el advisory crítico solo tiene fix en 10.1.0; 9.2.0 stable no existe) + `@chromatic-com/storybook` 5.6.0, `@storybook/addon-styling-webpack` 3.0.2, y vitest family 4.1.11 → **4.1.12** — Storybook 10 ya no arrastra `@vitest/mocker@3.2.4` (causa del critical). Overrides nuevos: `qs@^6.17.1`, `ip-address@10.7.6`, `markdown-it@14.3.3`, `smol-toml@1.9.1`, `fast-uri@3.1.9`, `decode-uri-component@0.5.1`, `katex@0.19.1`, y parent-scoped `@tailwindcss/typography > postcss-selector-parser@6.1.5`, `markdownlint-cli > js-yaml@5.5.0`, `@joshwooding/vite-plugin-react-docgen-typescript > glob@14.0.6`, `omniroute > body-parser@2.4.0`, `omniroute`/`@fission-ai/openspec > zod@4.6.7`; bumps `shadcn-ui@^0.9.5`, `@lhci/cli@^0.16.1`, client `vite@^6.4.6`. Resultado: **54 → 23**, critical **1 → 0**, high **15 → 10**, moderate **30 → 13**, low **8 → 0**.
  **Residual (23) y por qué no se toca:** `typescript-eslint` 8.72.2 es la última publicada y sigue dentro del rango vulnerable (fix inexistente); la cadena Lighthouse/`@lhci` (`lighthouse@13.6.0` latest, `puppeteer-core`/`basic-ftp` sin versión corregida) solo baja con el "fix" de npm a `@lhci/cli@0.13.0`, un downgrade; `depcheck`, `eslint-plugin-storybook`, `@stryker-mutator/*` y `@vitest/eslint-plugin` tampoco tienen fix forward; `zod` es dependencia **runtime directa** de `apps/client` (`^3.23.8`, 23 schemas + `zod-i18n`), así que el fix real es migrar a zod 4 — cambio de comportamiento en formato de errores, fuera de un triaje de lockfile.

  **Notas**: (1) Todas las waivers están en cadenas **devDependency/tooling** — con `fail-on-scopes: runtime` (default, `license-policy.md` §4) el gate FASE 2 no las evaluaría como runtime; el riesgo declarado ahí aplica. (2) Los 15 residuales vuelven a entrar al radar con: omniroute > 3.8.50, storybook 9.2.0 stable / 10.x, `@vitest/mocker` ≥ fix. (3) `dompurify@3.4.8` nested de monaco y `monaco-editor@0.56` no tienen fix (monaco 0.57 existe pero lo trae omniroute `^0.56`). (4) Lockfile reconciliado con `node_modules` vía `npx npm@12 install`; tests verdes post-fix: client 30/30, server unit 161/161. (5) Lección de ecosistema: la migration SB8→SB9 elimina `@storybook/addon-essentials` y `addon-interactions` (absorbidos por core), `@storybook/blocks` y `@storybook/test` (no existen @9; `addon-docs` expone `./blocks`), y exige `@chromatic-com/storybook@^4` + `@storybook/addon-styling-webpack@^2`. (6) MDX fix aplicado: `Configure.mdx` importa `Meta` desde `@storybook/addon-docs/blocks` (antes `@storybook/blocks`).

---

## 10. Promoción a blocking, OSV-Scanner PR-time y calibración (change `sca-lockfile-compliance`, 2026-11-10)

- **Promoción**: `lockfile-audit` es **blocking** desde 2026-11-10 (`Security: Lockfile Audit`): sin job-COE ni step-COE, `npm audit --audit-level=moderate` sale 1 con hallazgos y el job tiñe el agregador `prebuild-security-complete` (una de las 9 entradas). Un fallo de red/registro también bloquea (fail-closed: no se distingue "sin hallazgos" de "no auditado").
- **OSV-Scanner PR-time (advisory, FASE 1)** — task 1.3: step `scan -L package-lock.json --format=sarif --output-file=osv-scanner.sarif` con **binario pinneado v2.5.0 + SHA-256** (`edcfc41d…24e0c`, verificado contra el asset del release), gated a `needs.repo-discovery.outputs.lockfile == 'true'`, `continue-on-error: true`, SARIF subido con `category: osv-scanner` e incluido en el artifact `lockfile-audit-pr` (14d). Se evita `google/osv-scanner-action@v2.5.0`: su `action.yml` raíz no declara `runs:` y la action anidada cambia de CLI entre minors. Cobertura multi-ecosistema (npm/yarn/pnpm/bun) sobre el mismo lockfile; **complementa** `npm audit`, no lo sustituye.
- **Lockfile obligatorio** — task 1.2: el job gana el step `Verify lockfile updated with manifest changes`; con `manifests == true` (raíz/sub-workspaces/e2e) y `lockfile != true` emite `::error::` y `exit 1` (remediación: `npm install --package-lock-only`). Los flags `manifests`/`lockfile` viven en `repo-discovery` (`dorny/paths-filter@v4`) y se propagan como outputs; en `merge_group`/`workflow_dispatch` resuelven `true` (contrato de suite completa). El job sigue corriendo en **todos** los PRs: el audit del lockfile commiteado es cobertura continua barata; lo diff-aware es el guard y el step OSV.
- **Calibración (tasks 2.1-2.3)**: ventana advisory **2026-09-29 → 2026-11-10**, reconstruida con `gh api` sobre los 117 PR runs del workflow: **116/116** ejecuciones del job `Security: Lockfile Audit (advisory, FASE 1)` terminaron `success`; **0 fallos de job** y **0 falsos positivos** registrados en `security/exceptions.yml`. _Límite honesto_: en FASE 1 el step tenía COE, así que `success` de job no distingue "sin hallazgos" de "hallazgos no bloqueantes"; la clasificación por hallazgo es manual y, si aplica, se registra como excepción (≤ 90 días).
- **Limitación OSV (task 5.2)**: OSV-Scanner consulta OSV DB (30+ fuentes) y emite SARIF con CVSS, pero **no** calcula EPSS, KEV ni reachability. El triaje de explotabilidad sigue siendo manual: cruzar con FIRST EPSS + CISA KEV (`docs/runbooks/security/cve-triage.md`); triaje completo = Snyk (comercial), fuera de alcance de este change.
- **Rollback**: revertir el commit del job completo. `lockfile-audit` está en `prebuild-security-complete.needs`, así que el revert debe quitar también esa entrada (el agregador es estricto con `needs` desconocidos/saltados).
- **Ventana de promoción del step OSV**: abierta el 2026-11-10 — bitácora, criterios y evidencia por run en **§11** de este documento.

---

## 11. Bitácora de calibración OSV-Scanner — ventana de promoción a blocking

**Estado:** 🟡 ABIERTA · **Inicio:** 2026-11-10 · **Cierre objetivo:** 2026-11-24 (14 días) · **Gate afectado:** step `OSV-Scanner lockfile scan (advisory, SARIF)` del job `lockfile-audit` en `.github/workflows/ci.yml` (`continue-on-error: true` en el step y en el upload del SARIF).

El step nace advisory por diseño (change `sca-lockfile-compliance`, FASE 1) y la promoción a blocking exige la ventana de calibración de 2–4 semanas de `docs/learning/quality-gates.md` §7, aplicada aquí con la misma disciplina: un run no se anota hasta que OSV **realmente se ejecuta** (PR que toca `package-lock.json`), no cuando el job se salta el step por el guard.

### 11.1 Criterios de cierre (promoción a blocking)

- [ ] Ventana de **≥ 14 días** desde 2026-11-10 y **≥ 5 runs con OSV ejecutado** (`lockfile` cambiado), no solo PRs abiertos.
- [ ] **0 fallos de infraestructura** del step (checksum, descarga del binario, `--output-file`), con el artifact `lockfile-audit-pr` presente en todos esos runs.
- [ ] **100 % de los hallazgos triados** con una de estas etiquetas: `sin hallazgos` · `corregido (PR #N)` · `waiver #N (≤ 90 días)` · `FP (motivo)`.
- [ ] Ningún falso positivo reiterado sin clasificar en `security/exceptions.yml`; si lo hay, el cierre se pospone y se registra el motivo.
- [ ] Decisión documentada en el PR que quita el `continue-on-error: true` del step (y del upload del SARIF), con enlace a esta bitácora.

### 11.2 Registro de ejecuciones

| Fecha      | Run ID | PR  | OSV ejecutado | Resultado del step | Hallazgos (crit/high/mod/low) | Triaje / acción                                                                                                                                                                                                      |
| ---------- | ------ | --- | ------------- | ------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-10 | —      | —   | No            | —                  | —                             | **Apertura de la ventana.** El step solo existe en el árbol de trabajo (sin commit) → CI no lo ha ejecutado: 0 runs elegibles. La primera fila se anota en el primer PR que toque `package-lock.json` tras el merge. |

**Límite honesto:** mientras el step tenga COE, el resultado del **job** no distingue "sin hallazgos" de "hallazgos no bloqueantes". La evidencia se toma del SARIF/artifact (`osv-scanner.sarif`), no del color del job ni del exit code del step.

### 11.3 Cómo registrar un run

```bash
# 1) Runs de PR del workflow (id, fecha, rama, conclusión)
gh api --paginate "repos/{owner}/{repo}/actions/workflows/ci.yml/runs?event=pull_request&per_page=100" \
  --jq '.workflow_runs[] | [.id, .created_at, .head_branch, .conclusion] | @tsv'

# 2) ¿Corrió OSV en ese run? (el step solo se ejecuta si el PR toca el lockfile)
gh run view <run-id> --log --job "Security: Lockfile Audit" | grep -E "OSV|osv-scanner"

# 3) Evidencia: SARIF del artifact (14d) — ausente si OSV no se ejecutó
gh run download <run-id> -n lockfile-audit-pr -D .tmp/osv-evidence

# 4) Hallazgos agregados (Code Scanning, categoría osv-scanner)
gh api "repos/{owner}/{repo}/code-scanning/analyses?tool_name=OSV-Scanner&per_page=20" \
  --jq '.[] | [.created_at, .results_count] | @tsv'
```

### 11.4 Promoción y rollback

- **Promoción (al cerrar §11.1):** quitar `continue-on-error: true` del step `OSV-Scanner lockfile scan (advisory, SARIF)`, renombrar el step sin `(advisory, ...)`, actualizar las filas de `docs/learning/quality-gates.md` §2/§4.4 y §10 de este documento, y enlazar esta bitácora en el PR. Con el step bloqueante, cualquier hallazgo OSV (exit code 1) tiñe `lockfile-audit` y el agregador `prebuild-security-complete`. El `continue-on-error` del **upload** del SARIF se mantiene a propósito: un fallo de `security-events` (p. ej. PR desde fork) es de infraestructura y no debe bloquear un merge; la señal bloqueante es el scan, no la publicación.
- **Rollback:** reponer `continue-on-error: true` en el step y en el upload **con causa registrada en esta bitácora** (fecha, run, motivo). No se toca `npm audit`, que ya es blocking: OSV es la capa complementaria, no la única.
