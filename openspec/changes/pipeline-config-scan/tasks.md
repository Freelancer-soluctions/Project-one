# Tasks

> **IMPLEMENTACIÓN (2026-09-28): grupos 1-7 completados y verificados** (evidencia por task).
> Extras ejecutados: plantilla SARIF probada end-to-end localmente (clean → exit 0 + SARIF válido;
> hallazgo → exit 1 + results poblado) y **primer run real de zizmor v1.30.1** vía uv local
> (90 hallazgos, exit 0, 0 unpinned-uses bajo `"*": ref-pin`; deuda: artipacked×52,
> template-injection×19, self-repository×14, excessive-permissions×4, github-app×1).
> Nota Windows: `actionlint` con argumento de directorio falla con exit 3 (quirk de path de Go en
> Windows); validación local por fichero o sin argumento (auto-discovery) — en runners Linux no
> aplica. Los pasos del hook pre-commit local usan auto-discovery (sin path) por portabilidad.
> Pendiente: grupo 8 (FASE 2, diferida) y task 4.2 (commit de prueba real, bloqueado por sesión
> sin commits).

> **Secuencia**: los grupos 1-3 tocan workflows en orden (PR → scheduled), 4-5 config/hook local,
> 6 validación previa al merge, 7 docs/cierre, 8 FASE 2 (diferida). Anclas **por nombre de job**
> (las L-refs de `ci.yml` cambian tras cada inserción). Regla transversal: **el job `actionlint`
> bloqueante (anclado por nombre de job), `.github/actionlint.yaml`, `security.yml` (`category: trivy`), `checkov-iac`
> (`category: checkov-iac`) y hadolint/`containerfile-lint` (`category: hadolint`) NO se tocan**;
> **no se crea `scan-list.txt`**; no se duplica `dependency-review`.
> **Enmiendas @planner (NEEDS CHANGES) aplicadas**: A1 gating FASE 2 (SARIF→`jq`/dual), A2 scope
> bloqueo solo step lint, A3 `.github/zizmor.yml` mínimo obligatorio (sin guards), A4 instalación
> fijada (`setup-uv` SHA + verificación de versión + `> zizmor.sarif` no vacío), A5 corrección de
> `pipeline-config-scan.md` §5.1 y premisa D1 (`security.yml` SÍ tiene `pull_request` L5-6).
> **Enmiendas @review (auditoría 2026-09-28, verificadas contra las versiones pinned) aplicadas**:
> **A6** — la plantilla SARIF de actionlint NO es una plantilla Go definida: `-format '{{template
"sarif" .}}'` produce **0 bytes con exit 0** (probado en v1.7.12) → la plantilla oficial se
> **versiona** como `.github/actionlint-sarif.tmpl` y se pasa como **contenido** de `-format
"$(cat ...)"`; el step de scan lleva `|| true` (con hallazgos el exit es 1). **A7** — el esquema
> oficial de `.zizmor.yml` (`support/zizmor.schema.json`) NO admite `output:` ni `enabled:`;
> `policies` es un **mapa** `patrón → ref-pin|hash-pin` (semántica: qué cuenta como pinned; todo
> se audita por defecto) → config mínimo `"*": ref-pin` en FASE 1. **A8** — assets de release de
> actionlint son `linux_amd64` (no `Linux_x86_64`) → download-script es el mecanismo canónico (D2
> usa el script, nunca curl artesanal). **A9** — L-refs eliminadas de spec/tasks (anclas por
> nombre de job; las L-numéricas de `ci.yml` cambian con cada inserción).

## 1. Job PR `actionlint-advisory` en `ci.yml` (SARIF + artifact 14d)

- [x] 1.1 Insertar el job `actionlint-advisory` en `.github/workflows/ci.yml` (banda pre-build, junto al bloqueante): `if: github.event_name == 'pull_request'`, `needs: repo-discovery`, `timeout-minutes: 5`, `continue-on-error: true`, `permissions: { contents: read, security-events: write }` (patrón `dependency-review`). — ✅ insertado tras el bloqueante; YAML parseado (ci.yml = 49 jobs)
- [x] 1.2 Steps del job: `actions/checkout@v5` (`fetch-depth: 0`), download-script **pinned `1.7.12`** (misma instalación que el job bloqueante — nunca `rhysd/actionlint-action@master` ni curl artesanal: los assets reales son `actionlint_1.7.12_linux_amd64.tar.gz`, enmienda A8), ejecución sobre `.github/workflows/` con salida SARIF vía la plantilla **versionada** `.github/actionlint-sarif.tmpl` pasada como contenido (`-format "$(cat .github/actionlint-sarif.tmpl)"`, enmienda A6 — la forma inline `{{template "sarif" .}}` produce 0 bytes con exit 0) y `|| true` en el step de scan (exit 1 = hallazgos; el advisory lo da el `continue-on-error` del job). — ✅ plantilla vendida del tag `v1.7.12` (2878 bytes) y probada end-to-end: repo limpio → exit 0 + SARIF válido (driver "GitHub Actions lint"); workflow roto de prueba → exit 1 + results poblado (`ruleId: expression`)
- [x] 1.3 Evidencia: `github/codeql-action/upload-sarif@v4` con **`category: actionlint`** (`if: always()`, guard `hashFiles('actionlint.sarif') != ''`) + `actions/upload-artifact` `name: actionlint-report-pr`, `retention-days: 14`, `if: always()`, `if-no-files-found: warn`. — ✅ presente; `grep -c "category: actionlint$"` = 1
- [x] 1.4 FASE 1 no bloquea: verificar `grep -c "actionlint-advisory:" ci.yml == 1`, que **no** aparece en `prebuild-quality-complete.needs` (sigue exigiendo solo el `actionlint` bloqueante) ni en `prebuild-security-complete.needs`, y que el job bloqueante `actionlint` + `.github/actionlint.yaml` están intactos (sin diff). — ✅ greps = 1/1/1; needs del agregador verificados por parse YAML; `git diff .github/actionlint.yaml` vacío

## 2. Job PR `zizmor-advisory` en `ci.yml` (gap `unpinned-uses`, 14d)

- [x] 2.1 Insertar el job `zizmor-advisory` en `ci.yml` (mismos anclajes que grupo 1): `if: pull_request`, `needs: repo-discovery`, `timeout-minutes: 5`, `continue-on-error: true`, `permissions: { contents: read, security-events: write }`. — ✅ insertado tras `actionlint-advisory`
- [x] 2.2 Instalación **fijada** (enmienda A4): `astral-sh/setup-uv` fijado por **SHA completo** (nunca `@main`/`@v*` — `ubuntu-latest` no garantiza `uv`), ejecución `uvx zizmor@1.30.1 --format=sarif -c .github/zizmor.yml .github/workflows/ > zizmor.sarif` (salida **redirigida a fichero**, nunca a stdout) y verificación de versión **antes** del scan (`zizmor --version` contiene `1.30.1`; si difiere → fallo del paso). Sin `zizmorcore/zizmor-action` sin fijar. — ✅ SHA real resuelto por API: `b75a909f75acd358c2196fb9a5f1299a9a8868a4` (tag v6.7.0); ambos jobs (PR + weekly) lo usan
- [x] 2.3 Evidencia: `upload-sarif` con **`category: zizmor`** (`if: always()`, guard `hashFiles('zizmor.sarif') != ''`) + artifact `zizmor-report-pr` `retention-days: 14`, `if: always()`, `if-no-files-found: warn`. — ✅ presente
- [x] 2.4 Verificar **SARIF no vacío y parseable** antes de subirlo (`test -s zizmor.sarif && jq -e . zizmor.sarif`), y cobertura del gap: el primer SARIF reporta `unpinned-uses` (y `unpinned-images`/`unpinned-tools`/`typosquat-uses` si aplica) mientras `actionlint` bloqueante no lo hace; `grep -c "zizmor-advisory:" ci.yml == 1`; fuera de ambos agregadores en FASE 1; categorías nuevas (`actionlint`, `zizmor`) sin colidir con `trivy`, `codeql`, `semgrep`, `gitleaks`, `checkov-iac`, `hadolint`. — ✅ greps OK; 10 categorías repo-wide todas únicas; primer run real: 90 hallazgos (0 unpinned-uses bajo `ref-pin` — el repo usa `@v5` tags), exit 0 (SARIF siempre exit 0, confirmado empíricamente)

## 3. Job semanal `zizmor-weekly` en `scheduled-security.yml` (advisory, 90d)

- [x] 3.1 Insertar el job `zizmor-weekly` en `.github/workflows/scheduled-security.yml` (clon del patrón `checkov-iac-weekly`): `timeout-minutes` acotado, `continue-on-error: true`, instalación fijada idéntica al grupo 2 (`astral-sh/setup-uv` SHA-pinned + `uvx zizmor@1.30.1` + verificación de versión), política **incondicional** `-c .github/zizmor.yml`, `--format=sarif > zizmor-weekly.sarif` con verificación `test -s` (enmiendas A3/A4). — ✅ insertado tras `containerfile-lint-weekly`; scheduled = 7 jobs
- [x] 3.2 Evidencia: `upload-sarif@v4` con **`category: zizmor-weekly`** (`if: always()` + guard `hashFiles('zizmor-weekly.sarif') != ''`, apoyado en `permissions.security-events: write` a nivel workflow) + artifact `name: zizmor-weekly`, `retention-days: 90`, `if: always()`, `if-no-files-found: warn`. — ✅ presente; permisos L10-12 verificados
- [x] 3.3 Integridad del workflow: `grep -c "zizmor-weekly:" scheduled-security.yml == 1`; sin `needs` de agregadores ni `required_status_checks`; jobs `gitleaks-full-scan`, `scancode-license-audit`, `lockfile-audit-weekly`, `checkov-iac-weekly` y `notify-failure` intactos (sin diff); validar vía `workflow_dispatch` antes del primer cron `0 3 * * 1`. — ✅ grep = 1; trigger `workflow_dispatch` ya existe (L6); jobs vecinos intactos (solo inserciones)

## 4. Política como código `.github/zizmor.yml` (mínimo obligatorio, patrón `.checkov.yml`)

- [x] 4.1 Crear `.github/zizmor.yml` **mínimo obligatorio en el MISMO PR que los jobs** (enmienda A3 — los grupos 2/3 ya usan `-c` incondicional) y **válido según el esquema oficial** (enmienda A7 — `support/zizmor.schema.json`, `additionalProperties: false`): SOLO `rules.unpinned-uses.config.policies` como **mapa** `patrón → ref-pin|hash-pin` (FASE 1: `"*": ref-pin` — los audits `unpinned-uses`/`unpinned-images`/`unpinned-tools`/`typosquat-uses` están activos por defecto, sin claves `enabled:` inexistentes; formato/severidad por CLI, sin clave `output:` inexistente). Endurecer el mapa (p. ej. `"actions/*": hash-pin`) solo si el ruido del primer SARIF lo permite. — ✅ creado (`"*": ref-pin` + comentarios de política); validado por el run real de zizmor 1.30.1 (parsea sin error)
- [x] 4.1b Crear `.github/actionlint-sarif.tmpl` en el mismo PR (enmienda A6): contenido exacto de `testdata/format/sarif_template.txt` del repo upstream pinned `v1.7.12` (verificado: NO es una plantilla Go definida — `-format '{{template "sarif" .}}'` produce 0 bytes con exit 0; el **contenido** del archivo sí genera SARIF válido con exit 1 ante hallazgos, probado localmente). — ✅ descargado del tag v1.7.12 (2878 bytes) y probado end-to-end (clean → exit 0 + SARIF válido; hallazgo → exit 1 + results)
- [x] 4.2 Los 3 consumidores referencian **incondicionalmente** `-c .github/zizmor.yml` (`zizmor-advisory` grupo 2, `zizmor-weekly` grupo 3, pre-commit/validación local grupos 5-6): **sin** guard `[ -f .github/zizmor.yml ]` (el fichero siempre existe tras checkout; su ausencia es error de implementación, no un modo "defaults"). — ✅ verificado en los 2 jobs (YAML) + pre-commit (grep)
- [x] 4.3 Verificar que **`.github/actionlint.yaml` no tiene diff** (política del gate bloqueante, schema `paths: {glob}: ignore` — no mezclar esquemas) y que los archivos nuevos viajan en un PR normal (auditable). — ✅ `git diff --stat` vacío para `.github/actionlint.yaml`; archivos nuevos untracked, listos para el PR

## 5. Capa pre-commit advisory en `.husky/pre-commit`

- [x] 5.1 Añadir tras los pasos advisory existentes (`lockfile`, `checkov`, `hadolint`) los pasos `actionlint -config-file .github/actionlint.yaml` y `zizmor -c .github/zizmor.yml .github/workflows/`, ambos con `|| echo "⚠️ ... advisory, no bloquea ..."` (el `-c` es incondicional: el fichero es obligatorio, grupo 4) — **fuera** de la cadena `set -e`, con su propia protección `||`. — ✅ añadidos tras hadolint; el paso de actionlint usa **auto-discovery sin path** (portabilidad Windows: `actionlint <dir>` falla con exit 3 por quirk de Go en Windows; sin argumento auto-descubre desde el repo root)
- [x] 5.2 Verificar que la cadena bloqueante (lint-staged + SAST + secrets) no cambia, que no se introduce ningún `exit 1` nuevo y que hallazgos o binarios fuera de PATH no interrumpen el commit. — ✅ simulación con PATH sin los binarios: ambos pasos degradan a warning y exit 0; el `git commit` real queda para la sesión de commits (task 4.2 del flujo de commits)
- [x] 5.3 Documentar en el propio bloque que el stub npm `actionlint@2.0.6` (WASM) no equivale al binario real `v1.7.12` de CI. — ✅ comentario inline en `.husky/pre-commit` (L47-48)

## 6. Validación local pre-merge (D6)

- [x] 6.1 Ejecutar la cascada canónica: `actionlint -config-file .github/actionlint.yaml` (auto-discovery) + `zizmor -c .github/zizmor.yml .github/workflows/` (versiones reales: `actionlint v1.7.12`, `zizmor v1.30.1` vía uvx). — ✅ actionlint exit 0 (9 workflows, per-file por quirk Windows con dir-args); zizmor exit 0 con 90 hallazgos advisory (deuda clasificada en §10 del doc; FASE 2 los abordará)
- [x] 6.2 Probar la plantilla SARIF de `actionlint` localmente (`actionlint -format "$(cat .github/actionlint-sarif.tmpl)"` — enmienda A6): salida no vacía y parseable ANTE HALLAZGOS (probado con workflow roto temporal: exit 1 + `results` poblado, `ruleId: expression`) y en repo limpio (exit 0, 16.5 KB de SARIF válido). Zizmor: `--format=sarif` fuerza exit 0 CONFIRMADO empíricamente (90 hallazgos, exit 0) — el gate `jq` es imprescindible en FASE 2.
- [x] 6.3 Greps de integridad pre-merge: `actionlint:` bloqueante presente 1× con diff vacío en `.github/actionlint.yaml`; `security.yml` (`category: trivy`) intacto; `checkov-iac`/`category: checkov-iac` intactos; hadolint/`category: hadolint` sin duplicar (dueño: `containerfile-lint`); **`scan-list.txt` no existe**; `dependency-review` sin cambios; parse YAML de `ci.yml` (49 jobs) y `scheduled-security.yml` (7 jobs) OK.
- [x] 6.4 Ejecutar `openspec validate pipeline-config-scan --strict` → exit 0 (y `openspec validate --specs --strict` sin regresiones: 117/117).

## 7. Documentación: `quality-gates.md`, `license-policy.md` y estado del doc

- [x] 7.1 Filas `actionlint-advisory` y `zizmor-advisory` añadidas en `quality-gates.md` §2 tras `containerfile-lint` (`advisory (PR, fase 1)`, job-COE, artifact 14d, FASE 2 con gating `jq`/step-COE y `prebuild-security-complete.needs`); incluye evidencia del primer run real de zizmor (90 hallazgos, exit 0) y la deuda por regla. — ✅ sin duplicar filas existentes
- [x] 7.2 Las 3 filas (`actionlint-advisory`, `zizmor-advisory`, `zizmor-weekly`) añadidas en §4.4, coherentes con §2 (§2 canónica). — ✅
- [x] 7.3 Capa "(pipeline config)" añadida en `license-policy.md` §6 (actionlint + zizmor — config de workflows, no licencias ni CVE; políticas `.github/actionlint.yaml` intacta + `.github/zizmor.yml` obligatoria). — ✅ §1-§5 sin cambios
- [x] 7.4 **Corrección de `docs/learning/pipeline-config-scan.md` §5.1/§5.2/§5.3/§5.4/§5.5/§5.6 y §7 (enmiendas A5 + A6 + A7 + re-revisión)**: (i) los ejemplos `rhysd/actionlint-action@master` (§5.1 y **§5.2 L125**) son acciones **unpinned — NO usar** (el propio `zizmor` los reportaría como `unpinned-uses` y contradice D2/D3) → sustituir por el download-script **pinned `1.7.12`** + plantilla `.github/actionlint-sarif.tmpl` como `-format "$(cat ...)"` (mismo patrón que el job bloqueante y el job advisory); (ii) en **§5.3**, `zizmorcore/zizmor-action@v0.6.4` es un **tag, no SHA** → sustituir por el patrón **SHA-pinned** del change (`astral-sh/setup-uv` fijado por SHA completo + `uvx zizmor@1.30.1`, grupos 2/3), `# config opcional: -c .github/zizmor.yml` → `-c` **incondicional/obligatorio** (A3) y `path: zizmor.json` (nunca generado) → `zizmor.sarif`; (iii) **el sample de `.github/zizmor.yml` en §5.4 es inválido según el esquema oficial** (enmienda A7: lista `policies` → mapa `"*": ref-pin`; sin `output:`; sin `enabled:`) → sustituir por el config válido de D4/task 4.1 y `.github/zizmor.yml` `opcional` → `mínimo obligatorio` en **§5.4** y en **§7 D4** (A3); (iv) flags `actionlint -f .github/actionlint.yaml` en **§5.5**, **§5.6** y **§7 D5** → `-config-file` (coherente con tasks 5.1/6.1 y D5/D6); (v) corregir la premisa D1: `security.yml` **SÍ tiene `pull_request` (L5-6, verificado)** — el rechazo de meter la capa ahí se justifica por scope (SAST/SCA, no config scan) y por colisión con `category: trivy`/`codeql`/`semgrep`, **no** por falta de trigger de PR.
- [x] 7.5 `docs/learning/pipeline-config-scan.md` §10 (nueva sección de correcciones) + §9: estado "investigación → implementado" (jobs `actionlint-advisory`/`zizmor-advisory`/`zizmor-weekly`, `.github/zizmor.yml` mínimo obligatorio, `.github/actionlint-sarif.tmpl` versionada, pre-commit advisory, validación local, `prebuild-security-complete.needs` sin cambios en FASE 1) + **§9: `.github/zizmor.yml` "si se desea" → "obligatorio"** (mínimo, A3 — tanto el `añadir .github/zizmor.yml si se desea` como la mención "opcional" de la revisión cruzada) + nota de `actionlint-weekly` como posibilidad futura (posible extensión tras el primer ciclo semanal de `zizmor-weekly`; el bloqueante `actionlint` ya cubre cada PR). — ✅ aplicado vía script `.tmp/fix-pipeline-doc.mjs` con aserciones contadas (11 reemplazos + apéndice §10); prettier + docs:lint sin violaciones nuevas
- [x] 7.6 Cierre: `openspec validate pipeline-config-scan --strict` → exit 0 tras los cambios de docs; `openspec list` muestra el change con 8 grupos; coherencia de taxonomía con `iac-scanning`/`sca-lockfile-compliance`/`containerfile-lint` (sin filas ni jobs duplicados; 10 categorías SARIF únicas).

## 8. FASE 2 blocking gradual (diferida: tras 2-4 semanas sin falsos positivos)

- [ ] 8.1 **Gating explícito de `zizmor-advisory` (enmienda A1)**: el paso bloqueante parsea el SARIF — `jq -e '.runs[0].results | length == 0' zizmor.sarif` (falla con hallazgos) — **O** run dual (`--format sarif` para evidencia + `--format plain --min-severity medium` como gate). Verificación obligatoria: PR de prueba con un hallazgo `medium+` → el job **falla**; nunca confiar en el exit code de `--format=sarif` (siempre 0).
- [ ] 8.2 **Scope de bloqueo solo step lint en `actionlint-advisory` (enmienda A2)**: quitar `continue-on-error: true` a nivel job y añadir `continue-on-error: true` **a nivel step** en `upload-sarif` y `upload-artifact` — un fallo de permisos (fork PR / Security tab) no marca el job; solo el step lint decide.
- [ ] 8.3 Añadir `actionlint-advisory` y/o `zizmor-advisory` al `needs` de `prebuild-security-complete` (anclado por nombre de job) **un job por vez** + actualizar filas `quality-gates.md` §2/§4.4 a `blocking (PR)`; rollback = un solo revert (re-añadir `continue-on-error` a nivel job + quitar la línea del `needs`); el `actionlint` bloqueante original no cambia de estado.
