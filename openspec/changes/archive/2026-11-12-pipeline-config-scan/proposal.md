# Proposal: pipeline-config-scan

## Contexto

Análisis de la configuración de pipelines en el repositorio `project-one` (monorepo Node/Express + React). Se identificaron áreas de mejora en la calidad de seguridad y cumplimiento de políticas. Estado verificado: `actionlint` v1.7.12 ya corre como job **bloqueante** en `ci.yml` (job `actionlint`, en `prebuild-quality-complete.needs`) con `.github/actionlint.yaml`; `zizmor` v1.30.1 **no está presente** (0 matches) y es el único scanner con el audit `unpinned-uses`. Nota de alcance verificada: `security.yml` **SÍ** tiene trigger `pull_request` — meter la capa ahí se rechaza por scope (SAST/SCA, no config scan) y colisión de categorías SARIF, no por falta de trigger (enmienda A5).

> **Auditoría técnica (2026-09-28, enmiendas A6-A8):** verificado contra las versiones pinned —
> (1) la generación SARIF de `actionlint` exige la plantilla oficial **versionada** en
> `.github/actionlint-sarif.tmpl` como contenido de `-format` (la pseudo-plantilla inline `{{template "sarif" .}}` produce 0 bytes con exit 0);
> (2) `.github/zizmor.yml` debe ser válido según `support/zizmor.schema.json` (mapa
> `policies: {"*": ref-pin}`, sin claves `output:`/`enabled:` inexistentes); (3) instalación de
> `actionlint` siempre vía download-script (los assets de release son `linux_amd64`). Detalles en
> design.md (Contexto + D2/D4) y tasks.md (A6-A9).

## Propósito

Crear un cambio `pipeline-config-scan` que añada capas de auditoría para detectar:

- Acciones no pinned en `.github/workflows/*.yaml` (unpinned-uses)
- Configuraciones de workflow inseguras
- Calidad de la configuración de los pipelines de GitHub Actions (SARIF auditable 14d/90d)

## Requisitos

1. **Actionlint Advisory (PR-time)** — Job advisory en `ci.yml` (`continue-on-error: true`, 14d) que genera SARIF `category: actionlint` con la plantilla oficial, misma versión pinned `1.7.12` que el job bloqueante.
2. **Zizmor Advisory (PR-time)** — Job advisory en `ci.yml` (14d) con SARIF `category: zizmor`, cubre `unpinned-uses`; instalación **fijada** (enmienda A4): `astral-sh/setup-uv` SHA-pinned + `uvx zizmor@1.30.1` + verificación de versión + salida `> zizmor.sarif` verificada no vacía (`test -s` + `jq -e`).
3. **Zizmor Weekly (scheduled)** — Job semanal en `scheduled-security.yml` (90d) con SARIF `category: zizmor-weekly`, misma instalación fijada, advisory (`continue-on-error: true`).
4. **Política `.github/zizmor.yml`** — Fichero **mínimo obligatorio** (enmienda A3, patrón `.checkov.yml`), consumido **incondicionalmente** por los 3 consumidores vía `-c` (sin guard `[ -f ]`); `.github/actionlint.yaml` intacto.
5. **Pre-commit Advisory** — Hook no bloqueante (fuera de `set -e`, protegido con `||`).
6. **Validación Local** — Prueba local obligatoria antes de merge (`actionlint ... && zizmor ...`, sin `--no-fail`).
7. **Documentación** — `quality-gates.md` §2/§4.4, `license-policy.md` §6, `pipeline-config-scan.md` §5.1/§5.2/§5.3/§5.4/§5.5/§5.6/§7/§9 (incluye corrección del ejemplo `rhysd/actionlint-action@master` → NO usar, enmienda A5).

## FASE 2 (diferida, enmiendas A1/A2)

La promoción a blocking (2-4 semanas sin falsos positivos) exige: **(a)** gating explícito para `zizmor-advisory` — `--format=sarif` fuerza exit 0, así que el paso bloqueante parsea el SARIF con `jq -e '.runs[0].results | length == 0'` (o run dual `--format plain --min-severity medium` como gate); **(b)** scope de bloqueo **solo step lint** en `actionlint-advisory` — `upload-sarif`/`upload-artifact` conservan `continue-on-error: true` a nivel step para que fallos de permisos (fork PR) no bloqueen. Tras eso, añadir a `prebuild-security-complete.needs` (ancla por nombre de job `prebuild-security-complete`) un job por vez.

## Artículos Generados

- `proposal.md` - Descripción general
- `specs/pipeline-config-scan/spec.md` - Requisitos detallados (7 requisitos + 16 escenarios)
- `design.md` - Decisiones D1-D7, diagrama de integración, riesgos, migración (8 pasos)
- `tasks.md` - 8 grupos secuenciales (1-8, grupo 8 = FASE 2)

## Criterios de Éxito

- `openspec validate pipeline-config-scan --strict` exit 0
- Sin duplicación con `security.yml` (Trivy), `checkov-iac` (checkov), `hadolint` (hadolint), `dependabot.yml`
- Categorías SARIF únicas: `trivy`, `codeql`, `semgrep`, `gitleaks`, `checkov-iac`, `hadolint` + nuevas `actionlint`, `zizmor`, `zizmor-weekly`
- `actionlint` bloqueante existente permanece intacto (anclado por nombre de job); `.github/actionlint.yaml` sin diff
- `.github/zizmor.yml` mínimo obligatorio commiteado en el mismo PR que los jobs
- `zizmor` no introduce duplicación con `containerfile-lint` ni `scan-list.txt` (no creado)
