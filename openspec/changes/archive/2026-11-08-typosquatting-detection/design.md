# Design

## Context

Ver `proposal.md` — Why. Estado verificado 2026-09-28 (fuente: `docs/learning/typosquatting-detection.md`):

- `ci.yml`: `repo-discovery` (banda pre-build), `actionlint` bloqueante (ancla por nombre de job), `dependency-review`, `lockfile-audit`, `checkov-iac`, `containerfile-lint`, `actionlint-advisory`/`zizmor-advisory` (change `pipeline-config-scan`), `prebuild-security-complete` (`needs: [dependency-review, secrets, scancode-license-pr-diff]`, ancla por nombre). `grep -rni "guarddog|socket" .github/workflows/ package.json` → **0 matches** de herramienta (sin capa de typosquatting).
- `security.yml`: `dependency-scan` Trivy (`category: trivy`, CVE/secretos) + `sast` (CodeQL) + `semgrep-full-scan`. **Intocado por este change.**
- `scheduled-security.yml`: `gitleaks-full-scan` (`category: gitleaks`, 30d), `scancode-license-audit` (90d), `lockfile-audit-weekly` (90d), `checkov-iac-weekly` (90d, `category: checkov-iac`), `containerfile-lint-weekly` (90d, `category: hadolint-weekly`), `notify-failure`.
- `.husky/pre-commit`: `set -e` al inicio + bloque advisory con `npm audit`, `checkov`, `hadolint`, `actionlint` y `zizmor` — todos protegidos con `||` y fuera de la cadena; el nuevo paso va tras `zizmor`.
- Herramienta elegida: **GuardDog v3.2.0** (DataDog, Apache-2.0, OSS, sin cuenta ni API key; SARIF **solo** en `verify`; `--output-format=json` en todos los comandos; sandbox Landlock/Seatbelt obligatorio por defecto — **no existe en Windows: solo soporta Windows vía Docker**; devDeps excluidas por defecto vía `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false`). **No soporta ficheros de configuración**: la configuración oficial son **variables de entorno** + flags CLI → la política como código de este repo es un **wrapper versionado** `scripts/guarddog-verify.sh` (ver D5). **No existe** `DataDog/guarddog-action` (404) → workflow inline con `astral-sh/setup-uv` **SHA-pinned** (`b75a909f75acd358c2196fb9a5f1299a9a8868a4`, v6.7.0 — mismo pin que los jobs zizmor hermanos; `@v7` sería un tag móvil, prohibido por la regla A4 del repo) + `uvx guarddog==3.2.0` con verificación de versión + `github/codeql-action/upload-sarif@v4` (repo usa @v4, no el @v3 del ejemplo oficial). Reglas verificadas en RULES.md@v3.2.0: `threat.metadata.typosquatting`, `threat-npm-dependency-confusion`, `threat-runtime-obfuscation-unicode`, `deceptive_author`, `unclaimed_maintainer_email_domain`, `risky_new_dependency`, `provenance_regression`, `threat-npm-preinstall-script` (**no existe** `new_install_script` en v3.2.0).
- Alternativa descartada para FASE 1: **Socket CLI** (`@socketsecurity/cli@1.2.1` / `socketcli`) → requiere cuenta + `SOCKET_SECURITY_API_KEY` + cuota, **sin SARIF nativo en CLI** (solo `--json`/`--markdown`), `issueRules` deprecado en `socket.yml` v2 → capa opcional posterior con decisión de negocio.

## Goals / Non-Goals

**Goals:**

- Cero gap de **typosquatting / dependency confusion**: detección por metadatos + YARA sobre `package.json`, con evidencia SARIF auditable (14d PR / 90d semanal).
- Shift-left en 3 niveles: pre-commit advisory → PR advisory → auditoría semanal 90d.
- Política como código versionada (wrapper `scripts/guarddog-verify.sh`); evolución `advisory` → `blocking` sin rework (misma taxonomía que `pipeline-config-scan`, `iac-scanning`, `sca-lockfile-compliance`, `containerfile-lint`).
- Coste marginal ~0: job de pocos segundos, sin runner dedicado, sin credenciales, sin dependencia de `build`.
- Separación de capas explícita y documentada frente a Trivy, `dependency-review`, `lockfile-audit` y Checkov (cero duplicación).

**Non-Goals:**

- Bloquear PRs en FASE 1 (taxonomía `quality-gates.md`: blocking solo tras 2-4 semanas sin FP).
- Reemplazar o modificar `security.yml` (Trivy), `dependency-review`, `lockfile-audit`, `checkov-iac`, `hadolint`, `scancode-*`, `dependabot.yml` ni `package.json`.
- Adoptar Socket en FASE 1 (requiere cuenta/API key/cuota y no emite SARIF nativo).
- Cubrir CVEs (Trivy/npm audit), licencias (scancode) o SAST (CodeQL/Semgrep) — GuardDog no es esa capa.
- Crear `scan-list.txt` ni tocar `apps/**` (código de aplicación).

## Decisions

### Diagrama — integración en `ci.yml` y `scheduled-security.yml`

```
ci.yml (pull_request)                              scheduled-security.yml (cron existente)
┌───────────────────────────────────────────────┐  ┌──────────────────────────────────────────┐
│ repo-discovery                                │  │ gitleaks-full-scan     (30d, advisory)  │
│      │                                        │  │ scancode-license-audit (90d, advisory)  │
│      ├─► sast / Semgrep diff                  │  │ lockfile-audit-weekly  (90d, advisory)  │
│      ├─► dependency-review                    │  │ checkov-iac-weekly     (90d, advisory)  │
│      ├─► secrets                              │  │ containerfile-lint-weekly (90d)         │
│      ├─► scancode-license-pr-diff            │  │ guarddog-weekly (NUEVO, 90d, advisory)   │
│      ├─► lockfile-audit                       │  │   continue-on-error: true, uvx          │
│      ├─► checkov-iac / containerfile-lint     │  │   guarddog==3.2.0 npm verify (SARIF)    │
│      └─► typosquat-guarddog (NUEVO) ◄─PARAL.  │  │   category: guarddog-weekly, artifact   │
│            continue-on-error: true (FASE 1),  │  │   90d (re-evaluación semanal con datos  │
│            setup-uv SHA-pinned (v6.7.0) +     │  │   frescos de top-packages)              │
│            uvx guarddog==3.2.0 (verif. ver.), │  │ notify-failure                          │
│            wrapper → guarddog.sarif,          │  └──────────────────────────────────────────┘
│            category: guarddog, artifact 14d   │
│            (sin dependencia de build)         │  .husky/pre-commit (L1, advisory)
│      ▼                                        │  (scripts/guarddog-verify.sh ||
│ prebuild-security-complete                    │   true — fuera de la cadena set -e)
│   needs: [dependency-review, secrets,         │
│           scancode-license-pr-diff]           │  scripts/guarddog-verify.sh (policy-as-code)
│   FASE 2: + typosquat-guarddog                │
│   (tras 2-4 semanas sin FP)                   │
└───────────────────────────────────────────────┘
```

Alineado con `docs/ci-cd-pipeline-empresarial.md` **§23.3** (Stage 2 `Security`, pre-build, en paralelo: SAST + SCA + IaC + Pipeline Config Scan + capa transversal de supply-chain) y con la taxonomía `docs/learning/quality-gates.md`. `typosquat-guarddog` compite en la misma banda paralela que `dependency-review` y `lockfile-audit`, sin tocar ninguna dependencia existente.

### D1 — No reemplazar capas existentes

Capa exclusiva **typosquat / malicious package (metadata + YARA)**. _Alternativas_: (a) meter GuardDog en `security.yml` → rechazada: corre en `push`/`schedule`, no PR-time, y mezclaría `category` con `category: trivy`; (b) añadir scanners a Trivy o activar `dependency-review` sobre typosquat → rechazado: Trivy = CVE/secretos, dependency-review = manifiesto PR (duplicaría capas); (c) confiar en `npm audit` → rechazado: no cubre 0-day sin CVE. **Intocables**: `security.yml`, `dependency-review`, `lockfile-audit`, `checkov-iac`, `hadolint`, `dependabot.yml`, `package.json`.

### D2 — 3 capas: L1 local (pre-commit advisory), L2 PR (`typosquat-guarddog` advisory), L3 audit (`guarddog-weekly` 90d)

Misma estructura que `sca-lockfile-compliance`, `iac-scanning` y `containerfile-lint`: el hallazgo llega al dev en el commit, en el PR y como evidencia semanal. L1 usa `|| true` **fuera** de la cadena `set -e` (reporte en `.tmp/guarddog.sarif`); L2 usa `continue-on-error: true` **a nivel job** (actions/toolkit#581 → el agregador ve `success`), artifact 14d `guarddog-report-pr`, `if: always()`; L3 usa artifact 90d `guarddog-weekly` y `category: guarddog-weekly`. Diff-scope OBLIGATORIO si se filtrara por archivos: `git diff --name-only --diff-filter=ACMR base head` (`scan-list.txt` prohibido); en FASE 1 el job corre siempre sobre `package.json` (un manifiesto, segundos).

### D3 — Taxonomía `advisory` → `blocking` y `quality-gates.md` como registro único

**FASE 1**: `continue-on-error: true` + artifact 14d/90d + categorías únicas `guarddog`/`guarddog-weekly` + **fuera** de `prebuild-security-complete.needs`. **FASE 2** (tras 2-4 semanas sin FP): quitar `continue-on-error`, añadir `typosquat-guarddog` al `needs` de `prebuild-security-complete` (anclado **por nombre de job**; el agregador ya interpreta `needs.*.result` con `always()`, sin rediseño) y actualizar la fila en `quality-gates.md` §2/§4.x. **Retroceso**: un solo revert (re-añadir el flag y quitar la línea del `needs`). _Ruido previsto_: `threat.metadata.typosquatting` flaggea paquetes cuyo **nombre es similar** a uno popular → exclusiones justificadas en `scripts/guarddog-verify.sh` antes de promover.

### D4 — Complementariedad, cero duplicación (separación de capas)

- **GuardDog** = nombres similares a paquetes populares + dependency confusion + homoglyphs + install scripts (metadatos + YARA) → **este change**.
- **Trivy** (`security.yml`, `category: trivy`) = CVE + secretos → **intocado**; NO se le añaden scanners de typosquat.
- **dependency-review** = vulnerabilidad/licencia del manifiesto PR → **intocado**; no detecta typosquat de 0-day sin CVE.
- **lockfile-audit / npm audit** = CVEs del lockfile → **intocado**; los advisories ya cubiertos NO se duplican.
- **checkov-iac / hadolint / actionlint / zizmor / scancode** = IaC, calidad Dockerfile, config de pipelines, licencias → ajenos a esta capa.
- Taxonomía documentada en `quality-gates.md`: **GuardDog = typosquat (metadata + YARA) · Trivy = CVE/secretos · dependency-review = manifiesto PR · lockfile-audit = CVE lockfile · Checkov = IaC · Hadolint = calidad Dockerfile · CodeQL/Semgrep = SAST**. Sin cambios en `deny-licenses`/`allow-licenses` (GuardDog no es gate de licencias; Apache-2.0).

### D5 — Policy-as-code en el wrapper `scripts/guarddog-verify.sh` (GuardDog NO soporta config file)

**Corrección verificada (2026-09-28):** GuardDog **no** soporta ficheros de configuración — la
configuración oficial son **variables de entorno** (`GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES`,
`GUARDDOG_TOP_PACKAGES_CACHE_LOCATION`, …) y flags CLI (`--rules`/`--exclude-rules`). Un
`.guarddog.yml` sería un fichero muerto que ningún componente consume. Por eso la política como
código de este repo es un **wrapper versionado y ejecutable** `scripts/guarddog-verify.sh`:

- Fija `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false` (política de devDeps) y los
  `--exclude-rules` selectivos **con justificación por regla en comentarios** (qué, por qué, hasta
  cuándo) — mismo espíritu que `.checkov.yml`/`.hadolint.yaml`, pero sobre el mecanismo que la
  herramienta sí soporta.
- Expone un único punto de invocación para los 3 consumidores: los jobs de CI lo llaman igual que
  el pre-commit y la validación local → cero flags de política dispersos en workflows, cero
  desviación entre capas.
- CODEOWNERS sobre el script = review obligatorio de cambios de política. Los cambios viajan en
  PR (auditable).

Si en el futuro se adopta Socket, la política equivalente es `socket.yml` **v2** (`version: 2`
obligatorio, `triggerPaths: [package.json, package-lock.json]` → solo ahí PR alerts, ideal
monorepo). Pre-commit advisory **siempre** fuera de la cadena `set -e` (nunca escala a blocking —
regla "deuda histórica no bloquea commits", misma figura que `npm audit`/`checkov`/`hadolint` en
`.husky/pre-commit`).

```bash
# .husky/pre-commit — L1 advisory (ejemplo; fuera de la cadena set -e, tras zizmor)
(bash scripts/guarddog-verify.sh > .tmp/guarddog.sarif) || echo "⚠️  guarddog no disponible o findings — advisory, no bloquea (política: scripts/guarddog-verify.sh, reporte: .tmp/guarddog.sarif)"
```

### D6 — Validación local obligatoria antes de merge

```bash
bash scripts/guarddog-verify.sh > .tmp/guarddog.sarif   # wrapper = política única (D5)
jq -e '.runs[0].results | length == 0' .tmp/guarddog.sarif
```

Hallazgos → corregir el manifiesto o excluir la regla con justificación versionada en `scripts/guarddog-verify.sh` (auditable en el diff); **sin** `--no-fail`, **sin** `--no-sandbox` y sin forzar merge sin revisión. Misma figura D6 que `sca-lockfile-compliance`/`iac-scanning`/`containerfile-lint`. Requiere red (registry npm) y `uv`/`uvx` en PATH (solo macOS/Linux nativo; Windows vía Docker).

## Risks / Trade-offs

- **`verify` requiere red (descarga del registry) + sandbox por defecto** → runner sin salida a registry npm o sandbox caído = job falla. Mitigación: verificar conectividad del runner ubuntu-latest (ya la usa `lockfile-audit`); sandbox activo por defecto **es** el comportamiento seguro (mitiga CVE-2022-23530/31, CVE-2026-22870/871) → **no** usar `--no-sandbox`; FASE 1 advisory + `if: always()` en uploads para que la evidencia exista aunque falle.
- **SARIF solo en `verify`** (issue upstream "Support SARIF output in scan commands") → usar **`verify`** (nunca `scan`/`ci`) en las 3 capas; para gating FASE 2 parsear el SARIF con `jq` (JSON nativo disponible en todos los comandos como alternativa).
- **Falsos positivos** (la regla `threat.metadata.typosquatting` flaggea paquetes cuyo **nombre es similar** a un paquete popular — no es el concepto de "pin exacto" de zizmor; FP gestionados upstream en discussions #177) → FASE 1 advisory acumula ruido; ajustar `--exclude-rules` en `scripts/guarddog-verify.sh` **antes** de promover a blocking (D3).
- **Datos de top-packages** (la regla de typosquatting los usa para comparar nombres) → los runners de GitHub son **efímeros**: no existe cache persistente entre runs; cada ejecución descarga datos frescos. La cadencia semanal de `guarddog-weekly` aporta re-evaluación periódica de la superficie (nuevos paquetes publicados, cambios de popularidad), no "refresco de cache".
- **devDeps excluidas por defecto** → gap si hay dependencias de desarrollo críticas; documentar la exclusión o añadir `--include-dev-dependencies` de forma explícita en el wrapper/jobs.
- **Categorías SARIF duplicadas** → `guarddog` (PR) y `guarddog-weekly` (semanal), únicas frente a `trivy`/`codeql`/`semgrep`/`gitleaks`/`checkov-iac`/`hadolint`/`hadolint-weekly`; grep de unicidad tras implementar.
- **`upload-sarif` exige `security-events: write`** → declararlo a nivel **job** en `ci.yml` (patrón `dependency-review`/`containerfile-lint`); en `scheduled-security.yml` ya está a nivel workflow.
- **Evidencia SARIF parcial/corrupta** (`verify` necesita red y puede morir a medias) → mismo patrón que los jobs zizmor: `|| true` en el step de scan + `test -s` (no vacío) + `jq -e .` (parseable) antes de subir + guard `hashFiles(...) != ''` en el upload; `if: always()` en uploads para que la evidencia exista aunque el scan falle.
- **Sin GitHub Action oficial** (`DataDog/guarddog-action` → 404) → workflow inline con `setup-uv` SHA-pinned (v6.7.0) + `uvx guarddog==3.2.0` (pin exacto con verificación de versión, nunca `latest`); `actionlint` valida el workflow en CI.
- **Storage/permisos/fork** → artefactos < 50 KB; `retention-days: 14` (PR) y `90` (semanal) con nombres diferenciados (`guarddog-report-pr`, `guarddog-weekly`).
- **Socket opcional** → exige cuenta + token + cuota, sin SARIF nativo, `issueRules` deprecated → documentado como capa posterior con decisión de negocio; **no** bloquea FASE 1 (GuardDog sin credenciales).

## Migration Plan

1. **`scripts/guarddog-verify.sh`** (policy-as-code, D5): `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false` + `--exclude-rules` selectivas con justificación (FASE 1: ninguna excluida por defecto) — consumido por CI, pre-commit y validación local; CODEOWNERS sobre el script.
2. **Capa L1 — pre-commit advisory** en `.husky/pre-commit` (bloque advisory, tras `zizmor`): paso `bash scripts/guarddog-verify.sh > .tmp/guarddog.sarif` protegido con `|| echo`, fuera de la cadena `set -e`, y actualización del resumen final advisory ("lockfile + IaC + Containerfile + pipeline config + typosquat").
3. **Capa L2 — job `typosquat-guarddog` en `ci.yml`**: tras `zizmor-advisory`, `if: github.event_name == 'pull_request'`, `needs: repo-discovery`, `timeout-minutes: 10`, `continue-on-error: true`, `permissions: {contents: read, security-events: write}`, pasos `actions/checkout@v5` → `astral-sh/setup-uv@b75a909f…` (SHA v6.7.0) → verificación de versión (`uvx guarddog==3.2.0 --version`) → `bash scripts/guarddog-verify.sh > guarddog.sarif` (`|| true`, `test -s`, `jq -e .`) → `upload-sarif@v4` con `category: guarddog` (`if: always() && hashFiles(...) != ''`) → artifact `guarddog-report-pr` 14d (`if: always()`, `if-no-files-found: warn`).
4. **Capa L3 — job `guarddog-weekly` en `scheduled-security.yml`**: patrón `checkov-iac-weekly`/`containerfile-lint-weekly` (`continue-on-error: true`, SARIF `category: guarddog-weekly`, artifact `guarddog-weekly` 90d, sin agregador); su ejecución semanal aporta re-evaluación periódica con datos frescos de top-packages (runners efímeros: sin cache persistente).
5. **Validación local (D6)**: `bash scripts/guarddog-verify.sh > .tmp/guarddog.sarif` + `jq -e '.runs[0].results | length == 0'` sobre `package.json` antes de merge (solo macOS/Linux: en Windows GuardDog v3.2.0 requiere Docker); `actionlint` sobre ambos workflows y `openspec validate typosquatting-detection --strict`.
6. **Docs de gobernanza**: filas `typosquat-guarddog` (`advisory (PR, fase 1)` → `blocking (PR)`) y `guarddog-weekly` (`advisory (scheduled)`) en `docs/learning/quality-gates.md` §2 y §4.x; capa "(typosquatting)" en `docs/learning/license-policy.md` §6 (GuardDog no es gate de licencias).
7. **Docs de estado y separación de capas**: `docs/learning/typosquatting-detection.md` §8 (implementado + pendientes) y nota de separación de capas en `docs/learning/sca-dependency-lockfile-scan.md` (GuardDog typosquat ≠ npm audit CVE).
8. **FASE 2 (diferida) + rollback**: tras 2-4 semanas de runs sin FP → quitar `continue-on-error`, añadir `typosquat-guarddog` a `prebuild-security-complete.needs` (ancla por nombre), actualizar `quality-gates.md`. Rollback: re-añadir `continue-on-error` y quitar la línea del `needs` (FASE 2) o revert del commit del job (FASE 1); ningún estado intermedio rompe el agregador.

## Open Questions

- **Adopción de Socket CLI** (GitHub App gratis si el repo es OSS, o `socket ci` con `SOCKET_SECURITY_API_KEY`): requiere decisión de cuenta/cuota y conversión JSON→SARIF si se quiere Code Scanning. No bloquea FASE 1 (GuardDog cubre la capa sin credenciales) y no cambia los requisitos de este change → se decide en un change posterior si procede.
- **`--include-dev-dependencies`**: decidir si las devDeps entran en el alcance del escaneo (hoy excluidas por defecto vía `GUARDDOG_NPM_INCLUDE_DEV_DEPENDENCIES=false` en el wrapper) al revisar los primeros runs de FASE 1.
