# Design: pipeline-config-scan

## Contexto (Verificado)

- `actionlint` v1.7.12 YA implementado como job bloqueante en `ci.yml` (job `actionlint`, download-script pinned `1.7.12`, en `prebuild-quality-complete.needs`) + `.github/actionlint.yaml`
- `zizmor` v1.30.1 NO presente (0 matches); repo transferido a `zizmorcore/zizmor`
- Gap: `actionlint` no detecta acciones unpinned; `zizmor` sí (audit `unpinned-uses`)
- **Verificado contra las versiones pinned (2026-09-28):** (1) `actionlint -format '{{template "sarif" .}}'` NO funciona — no hay plantilla definida; produce **0 bytes con exit 0**; la plantilla oficial `testdata/format/sarif_template.txt` debe versionarse y pasarse **como contenido** de `-format`. (2) El esquema oficial de `.zizmor.yml` (`support/zizmor.schema.json`, `additionalProperties: false`) NO admite `output:` ni `enabled:`; `rules.unpinned-uses.config.policies` es un **mapa** `patrón → ref-pin|hash-pin` (semántica: define qué cuenta como suficientemente pinned — TODO se audita por defecto). (3) Los assets de release de actionlint son `linux_amd64` (no `Linux_x86_64`) → download-script es el mecanismo canónico.

## Decisiones D1-D7 (Coherentes con iac-scanning/sca-lockfile-compliance/containerfile-lint)

### D1 - Mantener actionlint bloqueante existente

Rechazo válido por scope: `security.yml` = SAST/SCA (Trivy category:trivy, CodeQL, semgrep) — no config scan de workflows. No reinyectar jobs en workflow con triggers/permissions propios. `security.yml` L5-6 SÍ tiene `pull_request`.

### D2 - Capa advisory actionlint (14d SARIF)

**Mecánica SARIF verificada en v1.7.12:** la plantilla oficial
(`testdata/format/sarif_template.txt`) NO es una plantilla Go definida (`{{define}}`), es un
**archivo de plantilla** cuyo contenido se pasa a `-format`. La forma inline
`-format '{{template "sarif" .}}'` produce **salida vacía con exit 0** (probado). Además, con
hallazgos el exit es 1 → el step de scan lleva `|| true` (el carácter advisory en FASE 1 lo da el
`continue-on-error: true` del job; FASE 2 instala el gating `jq` explícito).

```yaml
actionlint-advisory:
  name: ActionLint Advisory (SARIF artifact)
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  needs: repo-discovery
  permissions:
    contents: read
    security-events: write
  continue-on-error: true # FASE 1 advisory
  steps:
    - uses: actions/checkout@v5
      with:
        fetch-depth: 0
    - name: ActionLint (advisory, SARIF)
      run: |
        # misma instalación que el job bloqueante: download-script pinned (los assets
        # reales son actionlint_1.7.12_linux_amd64.tar.gz; el script resuelve SO/ARCH)
        bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.12
        # plantilla SARIF versionada en el repo (contenido de testdata/format/sarif_template.txt).
        # la forma inline `{{template "sarif" .}}` produce 0 bytes con exit 0 (verificado) →
        # se pasa el contenido del fichero versionado como -format.
        ./actionlint -no-color -config-file .github/actionlint.yaml \
          -format "$(cat .github/actionlint-sarif.tmpl)" .github/workflows/ > actionlint.sarif || true
        test -s actionlint.sarif || { echo 'actionlint.sarif vacio'; exit 1; }
        jq -e . actionlint.sarif > /dev/null || { echo 'SARIF no parseable'; exit 1; }
    - name: Upload SARIF (evidencia 14d)
      if: always()
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: actionlint.sarif
        category: actionlint
    - name: Upload SARIF artifact (14d advisory)
      if: always()
      uses: actions/upload-artifact@v7
      with:
        name: actionlint-report-pr
        path: actionlint.sarif
        retention-days: 14
        if-no-files-found: warn
```

La plantilla se versiona como `.github/actionlint-sarif.tmpl` (auditable, viaja en PR) en el
mismo PR que los jobs; `.github/actionlint.yaml` (política del bloqueante) no se toca.

### D3 - Capa advisory zizmor (PR-time 14d + semanal 90d SARIF)

```yaml
zizmor-advisory:
  name: Zizmor Advisory (unpinned-uses)
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  needs: repo-discovery
  permissions:
    contents: read
    security-events: write
  continue-on-error: true # FASE 1 advisory
  steps:
    - uses: actions/checkout@v5
    - uses: astral-sh/setup-uv@<SHA-completo> # A4: uv/uvx garantizado (ubuntu-latest NO trae uv); SHA-pinned, nunca @main/@v*
    - name: Zizmor (advisory, SARIF)
      run: |
        uvx zizmor@1.30.1 --version | grep -q '1.30.1' || { echo 'zizmor version mismatch'; exit 1; }
        uvx zizmor@1.30.1 --format=sarif -c .github/zizmor.yml .github/workflows/ > zizmor.sarif
        test -s zizmor.sarif || { echo 'zizmor.sarif vacio'; exit 1; }  # A4: SARIF no vacio antes de subir
        # FASE 2 (A1): gating explicito - parse SARIF con jq
        # jq -e '.runs[0].results | length == 0' zizmor.sarif || exit 1
    - name: Upload SARIF (evidencia 14d)
      if: always()
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: zizmor.sarif
        category: zizmor
    - name: Upload SARIF artifact (14d advisory)
      if: always()
      uses: actions/upload-artifact@v7
      with:
        name: zizmor-report-pr
        path: zizmor.sarif
        retention-days: 14
```

**A4 (instalacion fijada)**: `astral-sh/setup-uv` SHA-pinned + `uvx zizmor@1.30.1` con verificacion de version + salida redirigida `> zizmor.sarif` verificada no vacia (`test -s` + `jq -e .`). El semanal (grupo 3) replica la misma instalacion fijada con `> zizmor-weekly.sarif` y `-c .github/zizmor.yml` incondicional (A3).

### D4 - Política como código `.github/zizmor.yml`

**Esquema verificado** contra `support/zizmor.schema.json` (top-level `additionalProperties:
false`, solo `rules`): NO existen claves `output:` ni `enabled:`; `policies` es un **mapa**
`patrón → ref-pin|hash-pin` (fixtures upstream: `"*": ref-pin`, `"*": hash-pin`; existe el fixture
`invalid-wrong-policy-object.yml` para exactamente el error de lista). La semántica del mapa es
**qué cuenta como suficientemente pinned**, no a qué auditar — los audits se aplican a todo por
defecto. Formato y severidad mínima van por CLI (`--format=sarif`), no por config.

```yaml
# .github/zizmor.yml — mínimo obligatorio (válido según esquema oficial)
rules:
  unpinned-uses:
    config:
      policies:
        '*': ref-pin # FASE 1: @v5 tags suficientes; FASE 2: endurecer a hash-pin
        # endurecimiento progresivo por owner según ruido, p. ej.:
        # "actions/*": hash-pin
```

### D5 - Pre-commit Advisory (local)

```bash
# .husky/pre-commit (advisory, no bloqueante)
actionlint -config-file .github/actionlint.yaml .github/workflows/ || echo "[ACTIONLINT] Advisories only"
zizmor -c .github/zizmor.yml .github/workflows/ || echo "[ZIZMOR] Advisories only"
```

### D6 - Validación Local

```bash
actionlint -config-file .github/actionlint.yaml .github/workflows/ && zizmor -c .github/zizmor.yml .github/workflows/
# Si falla → corregir antes de merge; no usar --no-fail ni forzar merge sin revisión
```

### D7 - Transición FASE 1 → FASE 2 (2-4 semanas sin falsos positivos)

**FASE 1 (Advisory)**: `continue-on-error: true`; artefacto 14d PR; 90d semanal; no bloquea `prebuild-security-complete`.

**FASE 2 (Blocking gradual)**:

1. Parse SARIF con `jq -e '.runs[0].results | length == 0' zizmor.sarif` (gate explícito para zizmor)
2. Scope bloqueo SOLO step lint (actionlint-advisory: upload steps con `continue-on-error: true`)
3. Añadir jobs advisory a `prebuild-security-complete.needs` (anclado por nombre de job)
4. Retirar `continue-on-error: true` (o establecer `false`)

**Nota**: actionlint bloqueante ya existe en `prebuild-quality-complete.needs` (anclado por nombre). No mover a `prebuild-security-complete` (el gate de calidad vive en quality-complete; meter twin en security-complete rompe taxonomía por capas).

## Diagrama de Integración

```
.github/workflows/ci.yml
├── repo-discovery
├── dependency-review
├── lockfile-audit (L956)
├── checkov-iac
├── actionlint ← YA EXISTE (bloqueante, ancla por nombre de job)
├── actionlint-advisory (14d) ← NUEVO (FASE 1 advisory)
├── zizmor-advisory (14d) ← NUEVO (FASE 1 advisory)
└── prebuild-security-complete (ancla por nombre)
    ├── dependency-review ✓
    ├── secrets ✓
    ├── scancode-license-pr-diff ✓
    └── [FASE 2] actionlint-advisory + zizmor-advisory
```

## Risgos Documentados

| Riesgo                                                            | Impacto                                                     | Mitigación                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actionlint` SARIF requiere plantilla custom                      | Falta evidencia SARIF; dificultad para subir a Security tab | Plantilla oficial **versionada** en `.github/actionlint-sarif.tmpl` pasada como `-format "$(cat ...)"` (verificado: la forma inline `{{template "sarif" .}}` produce 0 bytes con exit 0); probar localmente con un workflow con hallazgo antes del primer run |
| `zizmor --format=sarif` fuerza exit 0 siempre                     | Se podría creer que pasó cuando hay findings high           | FASE 2: parse SARIF con `jq` (no depender exclusivamente del exit code)                                                                                                                                                                                       |
| `zizmor` unpinned-uses puede ser ruidoso con `@v*` sin SHA exacto | Falsos positivos; fatiga del equipo                         | Ajustar `.github/zizmor.yml` `rules.unpinned-uses.config.policies` para aceptar rangos de versiones (ej. `actions/checkout@v5` permite `v5.*`), o usar `ignore` específicos                                                                                   |
| Bloqueos heredados (scancode/docker/scan-list/npm audit)          | No afectan este change                                      | No tocar; documentar en separate changes                                                                                                                                                                                                                      |
| Storage/permisos/fork                                             | Coste de almacenamiento; pero cada uno < 50 KB              | `retention-days: 90`; usar `actions/upload-artifact` con nombres diferenciados                                                                                                                                                                                |
| Falta de `.github/zizmor.yml`                                     | CLI falla con `-c <inexistente>`                            | Fichero mínimo obligatorio (Opción A, coherente con `.checkov.yml`/`.hadolint.yaml` de cambios vecinos)                                                                                                                                                       |

## Migration Steps (8 pasos)

1. Crear `.github/zizmor.yml` mínimo-no-op (grupo 4)
2. Crear job `actionlint-advisory` en `ci.yml` (grupo 1)
3. Crear job `zizmor-advisory` en `ci.yml` (grupo 2)
4. Extender `scheduled-security.yml` con `zizmor-weekly` 90d (grupo 3)
5. Añadir pre-commit advisory (grupo 5)
6. Validación local (grupo 6)
7. Actualizar docs `quality-gates.md` + `license-policy.md` + `pipeline-config-scan.md` (grupo 7)
8. FASE 2 blocking gradual (tras 2-4 semanas sin falsos positivos): añadir jobs a `prebuild-security-complete.needs` + parse SARIF + quitar `continue-on-error`

## No Duplicación Confirmada

- `security.yml` Trivy (`category: trivy`) intacto
- `checkov-iac` (`category: checkov-iac`) intacto
- `hadolint` (`category: hadolint`) — propiedad de change `containerfile-lint`
- `dependabot.yml` no tocado
- `scan-list.txt` no creado
- `dependency-review` único (grep 1 match)
- Categorías SARIF: `actionlint`, `zizmor`, `zizmor-weekly` únicas (grep confirmado)
