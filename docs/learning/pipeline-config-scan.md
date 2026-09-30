# Pipeline Config Scan (actionlint / zizmor) — Unpinned Actions — Implementación Profesional / Enterprise

> Verificado 2026-09-28 — referencias oficiales comprobadas (`github.com/rhysd/actionlint`, `github.com/zizmorcore/zizmor`, `docs.zizmor.sh`). Estado del repo verificado: `actionlint` ya implementado como job bloqueante en `ci.yml` (L659‑673) con `.github/actionlint.yaml` policy‑as‑code; `zizmor` no presente (0 matches). Implementación previa consultada: [`docs/learning/dependency-review.md`](./dependency-review.md) (§2 referencias oficiales corregidas); [`docs/learning/iac-scanning.md`](./iac-scanning.md) (IaC Scanning); [`docs/learning/sca-dependency-lockfile-scan.md`](./sca-dependency-lockfile-scan.md) (Lockfile CVE); [`docs/learning/containerfile-lint.md`](./containerfile-lint.md) (Hadolint Dockerfile lint). Proyecto: monorepo `project-one` (Node/Express + React); `security.yml` activa `dependency-scan` Trivy + `sbom`; `ci.yml` L765 `dependency-review`; `scheduled-security.yml` `scancode-license-audit`; `prebuild-security-complete` L1465 `needs [dependency-review, secrets, scancode-license-pr-diff]`.
>
> **Nota:** Este documento cubre el escáner de configuración de pipelines (GitHub Actions) para detectar acciones unpinned, usos de expresiones inseguras y configuraciones no recomendadas, no código fuente (SAST) ni dependencias (SCA) ni IaC. Es capa transversal de `DevSecOps` (§20 pipeline).

---

## 1. Contexto y ubicación en pipeline

**Pipeline Config Scan** = análisis estático de los archivos de workflow de GitHub Actions (`.github/workflows/*.yaml`) para identificar:

- **Acciones unpinned** (uses: `actions/checkout` sin `@v*` o con `@master/@main` sin SHA fijo).
- **Usos de expresiones inseguras** (expresión `${{ ... }}` que puede inyectar código, ej. `${{ github.event.issue.title }}` sin sanitizar).
- **Acciones con versiones desactualizadas** (comparación con `npm outdated`-like pero para GitHub Actions).
- **Configuración no recomendada** (permisos excesivos, `pull-requests: write` innecesario, `timeout-minutes` demasiado alto, etc.).

En `docs/ci-cd-pipeline-empresarial.md` §23.3 `Stage 2` (`Security`): SAST + SCA + IaC van en paralelo (pre‑build). El escáner de configuración de pipelines se ubica en la misma capa de **seguridad pre‑build**, junto a `dependency-review` (manifest PR‑time) y `security.yml` `dependency‑scan` (Trivy filesystem). No reemplaza a ninguno; es complementario.

Estado verificado (`project-one`):

- `.github/workflows/ci.yml`: job `actionlint` (L659‑673) **blocking** en `prebuild-quality-complete.needs` (L1450), usa `download-actionlint.bash` pinned `v1.7.12`.
- `.github/actionlint.yaml`: política como código (ignores de `SC2086`, `SC2129`, etc.).
- `package.json`: stub `actionlint: 2.0.6` (WASM, no valida de verdad).
- `zizmor`: 0 matches en `.github/workflows/`; solo mención en `docs/ci-cd-pipeline-empresarial.md` L2854 (roadmap).
- Directorios `.github/workflows/`: 9 workflows activos (`ci.yml`, `ci-enterprise.yml`, `deploy.yml`, `opencode-review.yml`, `preview.yml`, `release.yml`, `scheduled-security.yml`, `security-digest.yml`, `security.yml`).

---

## 2. Referencias oficiales verificadas (2026‑09‑28)

| Fuente / URL                                   | Estado                                                                 | Nota clave / Corrección                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- | ----- | -------------------------------------- | --- | ------ | ------------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| actionlint (`github.com/rhysd/actionlint`)     | ✅ 200 HTML                                                            | CLI `actionlint` (Go); flags `-color, -config-file, -debug, -format, -ignore, -init-config, -no-color, -oneline, -pyflakes, -shellcheck, -verbose, -stdin-filename, -version`; **no existe `--severity-level`** (premisa errónea). `-format` es **Go template**: JSON → `-format '{{json .}}'`; SARIF → plantilla custom en `testdata/format/sarif_template.txt` (ej. `-format '{{template "sarif" .}}'`). Config: `.github/actionlint.yaml | yml` (`-init‑config`); esquema `paths: {glob}: ignore: [regex]`+`self‑hosted‑runner.labels`+`config‑variables`. Exit codes 0/1/2/3. Integración oficial: download‑script (`bash <(curl https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash) 1.7.12`), Docker `rhysd/actionlint:latest`, pre‑commit hook `rhysd/actionlint`, `reviewdog`. |
| zizmor (`github.com/zizmorcore/zizmor`)        | ✅ 200 HTML — **repo transferido** a `zizmorcore/zizmor` (redirección) | Última **v1.30.1** (2026‑09‑09). CLI `zizmor [OPTIONS] <INPUT>...` (sin subcomando `check`). Flags: `--format plain                                                                                                                                                                                                                                                                                                                         | json                                                                                                                                                                                                                                                                                                                                                                          | json‑v1 | sarif | github`, `--min‑severity informational | low | medium | high`, `--persona auditor | pedantic | regular`, `-c/--config`(archivo`zizmor.yml`), `--offline`, `--fix`. Exit codes 11‑14 por severidad (11 info … 14 high); **`--format=sarif`fuerza exit 0** siempre. Integración oficial: Action`zizmorcore/zizmor-action@…# v0.6.4`(SHA‑pin ejemplo) o manual`uvx zizmor@1.30.1 --format=sarif . > results.sarif`+`upload‑sarif`con`category: zizmor`. Pre‑commit hook `zizmorcore/zizmor‑pre‑commit`. |
| Comparativa actionlint vs zizmor               | —                                                                      | **actionlint**: valida sintaxis YAML, expresiones, usos de acciones (pero **no detecta acciones unpinned** directamente; depende de reglas internas). **zizmor**: incluye auditoría específica `unpinned‑uses` (detecta `@master/@main` y sin SHA), `unpinned‑images`, `unpinned‑tools`, `typosquat‑uses`. Ambos soportan SARIF (actionlint vía plantilla custom, zizmor nativo).                                                           |
| `docs/zizmor.sh/configuration/`                | ✅ 200                                                                 | Esquema `zizmor.yml`: `rules`, `policies`, `unpinned-uses.config.policies` (lista de acciones a considerar unpinned), `unpinned-images`, `unpinned-tools`, `typosquat-uses`, `output.format`, `output.min-severity`.                                                                                                                                                                                                                        |
| `github.com/rhysd/actionlint/releases/latest`  | ✅ 200 JSON                                                            | Release `v1.7.12` (2026‑03‑30).                                                                                                                                                                                                                                                                                                                                                                                                             |
| `github.com/zizmorcore/zizmor/releases/latest` | ✅ 200 JSON                                                            | Release `v1.30.1` (2026‑09‑09).                                                                                                                                                                                                                                                                                                                                                                                                             |

---

## 3. Diferencia técnica: SAST vs SCA vs IaC vs Pipeline Config Scan

| Capa                                         | Herramienta ejemplo                               | Qué analiza                                              | Fuente de datos                               | Salida                                                        | Uso en `project‑one` hoy                                                                                          | Gap de config scan                                                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SAST** (código fuente)                     | Semgrep (`p/javascript`, `p/typescript`) / CodeQL | Código de aplicación (JS/TS)                             | `apps/client/src`, `apps/server/src`          | JSON / SARIF / issues                                         | `security.yml` `sast` (**CodeQL**) + `semgrep‑full‑scan` (Semgrep weekly)                                         | No cubre `.github/workflows/*.yaml`                                                                                                                                    |
| **SCA** (dependencias)                       | Trivy / `npm audit` / ScanCode                    | Librerías de terceros (CVE + licencia)                   | `package‑lock.json`, `node_modules`           | SARIF (`trivy`), JSON (`npm audit`), `--json‑pp` (`scancode`) | `security.yml` `dependency‑scan`; `scheduled‑security.yml` `scancode‑license‑audit`; `ci.yml` `dependency‑review` | No cubre acciones unpinned ni expresiones inseguras en workflows                                                                                                       |
| **IaC** (infraestructura)                    | `checkov`, `tfsec`, `kics`                        | Configuración de despliegue                              | `terraform/`, `k8s/`, `Dockerfile`, `pulumi/` | JSON / SARIF / CLI / PR comment                               | **❌ NO implementado** (pero `checkov‑iac` ya añadido por change `sca‑lockfile‑compliance`)                       | No cubre workflows de GitHub Actions                                                                                                                                   |
| **Pipeline Config Scan** (acciones unpinned) | **actionlint** / **zizmor**                       | Workflows de GitHub Actions (`.github/workflows/*.yaml`) | `.github/workflows/*.yaml`                    | JSON / SARIF (actionlint via plantilla, zizmor nativo)        | **actionlint**: job ya bloqueante en `ci.yml` (L659‑673); **zizmor**: 0 matches                                   | **gap**: zizmor no implementado; acción única `unpinned‑uses` detectada por zizmor; acciónlint ya operativo (pero solo como job bloqueante, sin capa advisory semanal) |

> **Conclusión:** `actionlint` ya está presente como job bloqueante (FASE 2). El gap real es: (1) **capa advisory** de `actionlint` en pre‑commit (local) y artefacto SARIF opcional para visibilidad, (2) **capa `zizmor`** como complemento advisory para detectar acciones unpinned y otros audits que `actionlint` no cubre directamente.

---

## 4. Herramientas — comparación profesional

| Característica                     | actionlint                                                                                                                                        | zizmor                                                                                           | Observación para `project‑one`                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | --- | ---------------- | --------------------------------------------------------------------------------------- |
| **Lenguaje / framework**           | Go (binario single‑file)                                                                                                                          | Rust (binario single‑file)                                                                       | Ambos ligeros, sin dependencias externas.                                                              |
| **Reglas (policies)**              | ~150+ reglas integradas (expresiones, usos de acciones, etc.)                                                                                     | ~20 auditorías (unpinned‑uses, unpinned‑images, unpinned‑tools, typosquat‑uses, etc.)            | zizmor más focalizado en _unpinned_; actionlint más amplio en expresiones y mejores prácticas de YAML. |
| **Salida**                         | JSON (vía plantilla Go `{{json .}}`), SARIF (vía plantilla custom `testdata/format/sarif_template.txt`), checkstyle (no built‑in), salida legible | JSON, JSON‑v1, sarif, github, plain (nativos)                                                    | zizmor SARIF nativo; actionlint requiere plantilla custom (pero sencilla).                             |
| **Integración GitHub Action**      | download‑script (bash) o Docker `rhysd/actionlint:latest`                                                                                         | Action oficial `zizmorcore/zizmor‑action@…` (SHA‑pin) o `uvx zizmor@1.30.1`                      | Ambas disponibles; actionlint ya está en el repo como job bloqueante.                                  |
| **Continuación en error (fase 1)** | `continue‑on‑error: true` (nivel job)                                                                                                             | `continue‑on‑error: true` (nivel job)                                                            | Ambos soportan advisory → blocking gradual.                                                            |
| **Evidence / artefact**            | `upload‑artifact` (JSON / SARIF / 14d)                                                                                                            | `upload‑artifact` / `upload‑sarif` (90d)                                                         | Alineado con `scheduled‑security.yml` (90d) y `ci.yml` (14d).                                          |
| **Pre‑commit / local**             | `actionlint -config-file .github/actionlint.yaml                                                                                                  |                                                                                                  | echo` (advisory)                                                                                       | `zizmor -c .github/zizmor.yml .github/workflows/ |     | echo` (advisory) | Recomendado `actionlint` por ya estar integrado; `zizmor` como capa adicional advisory. |
| **Cosmética / ruido**              | Medio (muchas reglas, pero configurables vía `.actionlint.yaml`)                                                                                  | Bajo‑medio (pocos auditorías, pero `unpinned‑uses` puede ser ruidoso si muchas acciones sin pin) | Requiere `ignore` selectivo en ambos para reducir ruido.                                               |

**Recomendación para `project‑one`:** Mantener `actionlint` como job bloqueante (ya está) y añadir una **capa advisory** de `actionlint` en pre‑commit y artefacto SARIF opcional. Añadir `zizmor` como **capa advisory complementaria** (semanal 90d, `continue‑on‑error: true`, SARIF `category: zizmor`) para cubrir el gap de `unpinned‑uses` y otros audits que `actionlint` no detecta directamente. No reemplazar `actionlint` bloqueante; sólo añadir capas advisory.

---

## 5. Implementación empresarial / profesional — patrones

### 5.1 Pipeline (pre‑build, shift‑left)

```yaml
# .github/workflows/ci.yml — job actionlint ya existe (L659‑673) como bloqueante.
# Añadir una capa advisory opcional (no bloqueante) para artefacto SARIF y visibilidad.
actionlint-advisory:
  name: ActionLint Advisory (SARIF artifact)
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  needs: repo-discovery
  permissions:
    contents: read
    security-events: write  # si se sube SARIF
  steps:
    - uses: actions/checkout@v5
      with:
        fetch-depth: 0
    - name: ActionLint (advisory, artefact SARIF)
      VER NOTA A8 ABAJO — rhysd/actionlint-action@master es UNPINNED y NO se usa
      with:
        # Usar plantilla SARIF custom (ej. testdata/format/sarif_template.txt)
        # o bien generar JSON y convertir vía script interno.
        format: sarif   # se requiere una plantilla; se puede usar -format '{{template \"sarif\" .}}'
        # Si la action no acepta format directamente, usar el download‑script y luego convertir.
      # Alternativa: usar el download‑script y luego un step de conversión a SARIF.
    - name: Upload SARIF (evidencia, 14d advisory)
      if: always()
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: actionlint.sarif   # o el nombre generado
    - name: Upload JSON artifact (14d advisory)
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: actionlint-report-pr
        path: actionlint.json   # o .sarif si se mantiene
        retention-days: 14
```

- **Fase 1 (advisory)**: `continue‑on‑error: true` implícito (job no bloqueante porque no está en `prebuild‑security‑complete.needs`). Artefacto 14d PR; feedback al PR vía PR comment (opcional, requiere script que publie comentario con los hallazgos). No bloquea `prebuild‑security‑complete`.

### 5.2 Semanal / full repo (auditoría, evidencia 90d)

```yaml
# .github/workflows/scheduled-security.yml — extender existente (L105 scancode‑license‑audit)
actionlint‑advisory‑weekly:
  name: ActionLint Advisory Weekly
  runs-on: ubuntu-latest
  if: github.event_name == 'schedule'
  steps:
    - uses: actions/checkout@v5
    - name: ActionLint Weekly (advisory, artefact SARIF)
      VER NOTA A8 ABAJO — rhysd/actionlint-action@master es UNPINNED y NO se usa
      with:
        format: sarif   # plantilla custom
    - name: Upload evidencia (90d)
      uses: actions/upload-artifact@v4
      with:
        name: actionlint‑weekly
        path: actionlint.sarif
        retention-days: 90
    - name: Upload SARIF (90d)
      if: always()
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: actionlint.sarif
```

- **Coherencia con `scancode‑license‑audit`**: ambos semanales, 90d, `continue‑on‑error: true`; no duplican (uno analiza calidad de workflows, otro licencia de archivos fuente).

### 5.3 zizmor como capa advisory complementaria (detecta unpinned‑uses)

```yaml
# .github/workflows/ci.yml — job zizmor advisory (no bloqueante)
zizmor‑advisory:
  name: Zizmor Advisory (unpinned‑uses, etc.)
  runs-on: ubuntu-latest
  if: github.event_name == 'pull_request'
  needs: repo-discovery
  permissions:
    contents: read
    security-events: write  # si se sube SARIF
  steps:
    - uses: actions/checkout@v5
    - name: Zizmor (advisory, artefact SARIF)
      VER NOTA A8 ABAJO — v0.6.4 es tag; usar setup-uv SHA-pinned + uvx zizmor@1.30.1
      with:
        format: sarif
        min-severity: low   # o informational, según tolerancia
        config OBLIGATORIO: -c .github/zizmor.yml (A3) | formato/severidad por CLI, la clave output: no existe en el esquema (A7)
    - name: Upload SARIF (evidencia, 14d advisory)
      if: always()
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: zizmor.sarif
    - name: Upload JSON artifact (14d advisory)
      if: always()
      uses: actions/upload-artifact@v4
      with:
        name: zizmor-report-pr
        path: zizmor.sarif
        retention-days: 14
```

```yaml
# .github/workflows/scheduled-security.yml — job zizmor semanal advisory
zizmor‑advisory‑weekly:
  name: Zizmor Advisory Weekly
  runs-on: ubuntu-latest
  if: github.event_name == 'schedule'
  steps:
    - uses: actions/checkout@v5
    - name: Zizmor Weekly (advisory, artefact SARIF)
      VER NOTA A8 ABAJO — v0.6.4 es tag; usar setup-uv SHA-pinned + uvx zizmor@1.30.1
      with:
        format: sarif
        min-severity: low
    - name: Upload evidencia (90d)
      uses: actions/upload-artifact@v4
      with:
        name: zizmor‑weekly
        path: zizmor.sarif
        retention-days: 90
    - name: Upload SARIF (90d)
      if: always()
      uses: github/codeql-action/upload-sarif@v4
      with:
        sarif_file: zizmor.sarif
```

- **Fase 1 advisory**: `continue‑on‑error: true`; artefacto 14d PR / 90d semanal; no bloquea `prebuild‑security‑complete`.
- **Fase 2 blocking gradual**: tras 2‑4 semanas sin falsos positivos, añadir los jobs `actionlint‑advisory` y/o `zizmor‑advisory` a `prebuild‑security‑complete.needs` (L1465) y quitar `continue‑on‑error: true` (poner `continue‑on‑error: false` o simplemente eliminarlo) para que fallen si hallazgos > umbral.

### 5.4 Política como código (`.github/actionlint.yaml` y `.github/zizmor.yml`)

```yaml
# .github/actionlint.yaml — ya existe en el repo (policy‑as‑code)
paths:
  '**':
    ignore:
      - 'SC2086' # Quoted variable expansions
      - 'SC2129' # Consider using 'cmd | tail -n +1' instead of 'cmd | head -1 | tail -n +1'
      # adds más ignores según necesidad del repo
# opciones adicionales: self‑hosted‑runner.labels, config‑variables, etc.
```

```yaml
# .github/zizmor.yml — mínimo OBLIGATORIO (A3, patrón .checkov.yml), los 3 consumidores usan -c incondicionalmente
rules:
  unpinned‑uses:
    config:
      policies:
        - 'actions/checkout'
        - 'actions/setup‑node'
        - 'actions/upload‑artifact'
        # añadir más acciones según se desee considerar unpinned si no usan SHA fijo
  unpinned‑images:
    enabled: true
  unpinned‑tools:
    enabled: true
  typosquat‑uses:
    enabled: true
output:
  format: sarif
  min‑severity: low
```

### 5.5 Pre‑commit / local (shift‑left)

```bash
# .husky/pre‑commit (o script check local)
# Nota: no bloquear commit si hay deuda histórica; solo informativo
actionlint -config-file .github/actionlint.yaml .github/workflows/ || echo "[ACTIONLINT] Advisories only — see .github/actionlint.yaml"
zizmor -c .github/zizmor.yml .github/workflows/ || echo "[ZIZMOR] Advisories only — see .github/zizmor.yml"
```

- **No debe ser bloqueante** (`|| echo`) porque deuda histórica requiere remediación planificada (similar a `sast‑implementation.md` §3.1 L3 Full‑history).

### 5.6 Validación local antes de merge

```bash
# Verificar que no haya introducido nuevas advertencias de alto nivel
actionlint -config-file .github/actionlint.yaml .github/workflows/ && zizmor -c .github/zizmor.yml .github/workflows/
# Si alguno falla (exit != 0) → revisar y corregir antes de merge; no usar `‑‑no‑fail` ni forzar merge sin revisión.
```

---

## 6. Limitaciones y riesgos (corporativo)

| Riesgo                                                                                                                                            | Impacto                                                                                                                 | Mitigación / Documento                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `actionlint` ya bloqueante en `ci.yml` (L659‑673) → agregar más jobs puede aumentar tiempo de CI                                                  | Tiempo de CI ligeramente mayor; pero jobs advisory corren en paralelo con `repo‑discovery` DAG y no dependen de `build` | Mantener `actionlint‑advisory` y `zizmor‑advisory` como jobs independientes con `needs: repo‑discovery` y `timeout‑minutes: 10`; usar `continue‑on‑error: true` para evitar bloqueo en FASE 1.                                             |
| `zizmor` puede marcar muchas acciones como `unpinned‑uses` si el repo usa `@v*` pero sin SHA exacto (ej. `v5` vs `v5.0.0`)                        | Falsos positivos; fatiga del equipo                                                                                     | Ajustar `.github/zizmor.yml` `rules.unpinned‑uses.config.policies` para aceptar rangos de versiones (ej. `actions/checkout@v5` permite `v5.*`), o usar `ignore` específicos.                                                               |
| `actionlint` salida SARIF requiere plantilla custom; error en plantilla genera salida vacía o malformed                                           | Falta de evidencia SARIF; dificultad para subir a Security tab                                                          | Probar la plantilla localmente (`actionlint -f '{{template \"sarif\" .}}' .github/workflows/`); usar la plantilla oficial del repo (`testdata/format/sarif_template.txt`) si está disponible.                                              |
| `zizmor` `--format=sarif` fuerza exit 0 incluso si hay hallazgos de alta severidad → puede enmascarar problemas si se confía solo en el exit code | Se podría creer que pasó cuando hay findings high                                                                       | Siempre inspeccionar el archivo SARIF generado; no depender exclusivamente del exit code.                                                                                                                                                  |
| `scancode‑license‑audit` (semanal) + `actionlint‑weekly` + `zizmor‑weekly` = 3 artifacts 90d                                                      | Coste de almacenamiento; pero cada uno < 50 KB                                                                          | `retention‑days: 90`; usar `actions/upload‑artifact` con nombres diferenciados (`actionlint‑weekly`, `zizmor‑weekly`, `scancode‑license‑audit`).                                                                                           |
| No hay `Dockerfile` en algunos workflows → `zizmor` audit `unpinned‑images` puede estar vacío                                                     | No es riesgo, solo información                                                                                          | Mantener el audit para futuros workflows que usen imágenes.                                                                                                                                                                                |
| `actionlint` y `zizmor` son independientes; un PR con cambios en `.github/workflows/*.yaml` dispara ambos jobs                                    | Tiempo de CI; pero pre‑build paralelo (`repo‑discovery` DAG) mantiene rápido                                            | Ambos jobs son ligeros (<2 s cada uno); el overhead es mínimo.                                                                                                                                                                             |
| `checkov‑iac` ya escanea `Dockerfile` (framework `dockerfile`) → posible solapamiento con `hadolint` (ver cambio `containerfile‑lint`)            | Solapamiento de capacidades (IaC vs calidad Dockerfile)                                                                 | Documentar claramente: `checkov‑iac` = política de IaC (seguridad de infraestructura); `hadolint` = calidad de `Dockerfile` (best practices). Aquí, `actionlint` / `zizmor` = calidad de workflows GitHub Actions (no IaC, no Dockerfile). |

---

## 7. Decisiones propuestas para `project‑one` (coherentes con pipeline existente)

1. **D1 — Mantener `actionlint` como job bloqueante existente** (L659‑673) en `ci.yml`; no tocar su configuración ni su estado de bloqueo.
2. **D2 — Añadir capa advisory de `actionlint`** (job `actionlint‑advisory` en `ci.yml`, artefacto SARIF 14d PR, `continue‑on‑error: true`) para visibilidad y artefacto opcional.
3. **D3 — Añadir capa advisory de `zizmor`** (jobs `zizmor‑advisory` PR‑time y `zizmor‑advisory‑weekly` semanal, artefactos SARIF 14d/90d, `continue‑on‑error: true`) para detectar `unpinned‑uses` y otros audits que `actionlint` no cubre directamente.
4. **D4 — Política como código** (`.github/actionlint.yaml` ya existente; crear `.github/zizmor.yml` mínimo OBLIGATORIO (A3) de `zizmor`).
5. **D5 — Pre‑commit / local advisory** (`actionlint -config-file .github/actionlint.yaml … || echo` y `zizmor -c .github/zizmor.yml … || echo`).
6. **D6 — Validación local antes de merge** (`actionlint … && zizmor …`); si falla → corregir antes de merge; no usar `‑‑no‑fail` ni forzar merge sin revisión.
7. **FASE 2 blocking gradual** (tras 2‑4 semanas sin falsos positivos): añadir los jobs `actionlint‑advisory` y `zizmor‑advisory` a `prebuild‑security‑complete.needs` (L1465) y quitar `continue‑on‑error: true` (o establecer `continue‑on‑error: false`) para que fallen sólo en presencia de hallazgos nuevos (baseline limpio). Mantener el job `actionlint` bloqueante original (ya está en `prebuild‑quality‑complete.needs`).

> **Nota:** D2/D3 replican exactamente la taxonomía `quality‑gates.md` y los cambios `sca‑lockfile‑compliance` / `iac‑scanning`: `advisory` → `blocking` tras período sin falsos positivos y con baseline.

---

## 8. Fuentes (verificadas esta sesión / referencias internas)

- `github.com/rhysd/actionlint` (200 HTML); `actionlint` CLI flags, `.actionlint.yaml` esquema, `download‑actionlint.bash`, `rhysd/actionlint:latest`.
- `github.com/zizmorcore/zizmor` (200 HTML — redirect a `zizmorcore/zizmor`); `zizmor` CLI flags, `zizmor.yml` esquema, `zizmorcore/zizmor‑action@…`, `zizmorcore/zizmor‑pre‑commit`.
- `docs.zizmor.sh/configuration/` — esquema `zizmor.yml`.
- `github.com/rhysd/actionlint/releases/latest` (v1.7.12).
- `github.com/zizmorcore/zizmor/releases/latest` (v1.30.1).
- Referencias internas: `docs/learning/dependency‑review.md` (§2 referencias oficiales corregidas); `docs/learning/iac‑scanning.md` (IaC Scanning); `docs/learning/sca‑dependency‑lockfile‑scan.md` (Lockfile CVE); `docs/learning/containerfile‑lint.md` (Hadolint Dockerfile lint); `docs/ci‑cd‑pipeline‑empresarial.md` §23.3; `.github/workflows/ci.yml` L659‑673 (actionlint bloqueante); `.github/actionlint.yaml`; `.github/workflows/security.yml`; `.github/workflows/scheduled‑security.yml`.

---

## 9. Estado del documento

- Creado: `docs/learning/pipeline‑config‑scan.md` (2026‑09‑28)
- Revisión cruzada: coherente con `iac‑scanning.md` (patrones de FASE 1/2, artefactos 14d/90d, categoría SARIF única, política como código `.github/actionlint.yaml`, `.github/zizmor.yml` mínimo obligatorio); no duplica `dependency‑review.md` (manifest PR‑time) ni `license‑compliance.md` (archivo + licencia); complementa `sca‑dependency‑lockfile‑scan.md` (CVE lockfile) y `iac‑scanning.md` (IaC infra) con capa de calidad de workflows GitHub Actions.
- Siguiente paso propuesto (fuera de doc): crear los jobs `actionlint‑advisory` y `zizmor‑advisory` en `ci.yml`; crear los jobs semanal en `scheduled‑security.yml`; añadir `.github/zizmor.yml` (obligatorio, mínimo, A3) + `.github/actionlint-sarif.tmpl` versionada (A6); validar `prebuild‑security‑complete.needs`; documentar filas en `quality‑gates.md`; archivar `change` `pipeline‑config‑scan` si se activa.

---

## 10. Correcciones post-revisión (2026-09-28, change `pipeline-config-scan`, tasks 7.4/7.5)

> **Enmiendas A5-A8 aplicadas a este documento.** Los ejemplos de §5.1/§5.2/§5.3 marcados con
> "VER NOTA A8" contenían patrones que el propio `zizmor` reportaría como `unpinned-uses` y que
> contradicen D2/D3; la implementación real usa estos patrones (ver
> `openspec/changes/pipeline-config-scan/design.md` D2/D3):
>
> - **actionlint**: download-script pinned `1.7.12` (nunca `rhysd/actionlint-action@master` —
>   unpinned; los assets reales de release son `linux_amd64`, no `Linux_x86_64`, A8) + plantilla
>   SARIF **versionada** `.github/actionlint-sarif.tmpl` pasada como contenido de `-format
"$(cat ...)"` (A6: la pseudo-plantilla inline `{{template "sarif" .}}` produce 0 bytes con
>   exit 0 — verificado en v1.7.12) + `|| true` en el step de scan (con hallazgos exit 1) y
>   validación `test -s` + `jq -e .`.
> - **zizmor**: `astral-sh/setup-uv` **SHA-pinned** (`b75a909f75acd358c2196fb9a5f1299a9a8868a4`,
>   v6.7.0 — `ubuntu-latest` no garantiza `uv`) + `uvx zizmor@1.30.1` con verificación de versión
>   (nunca `zizmorcore/zizmor-action@v0.6.4` — es un tag, no SHA).
> - **`.github/zizmor.yml` (A7)**: el sample de §5.4 con `policies` como lista, `output:` y
>   `enabled:` es INVÁLIDO según `support/zizmor.schema.json` (`additionalProperties: false`).
>   Config mínimo válido: `rules.unpinned-uses.config.policies` como **mapa** `"*": ref-pin` (los
>   audits se activan por defecto; el mapa define qué cuenta como pinned). Format/severidad por CLI.
>   **Primer run real (2026-09-28, zizmor v1.30.1):** 90 hallazgos, exit 0 (SARIF siempre exit 0),
>   0 `unpinned-uses` bajo `ref-pin`; deuda: artipacked×52, template-injection×19,
>   self-repository×14, excessive-permissions×4, github-app×1.
> - **Flags (iv)**: `actionlint -f` → `-config-file` (§5.5/§5.6/§7 D5); `zizmor.json` (nunca
>   generado) → `zizmor.sarif`; política `opcional` → **mínimo obligatorio** (§5.4/§7 D4/§9, A3).
> - **Premisa D1 (A5)**: `security.yml` SÍ tiene trigger `pull_request`; el rechazo de alojar la
>   capa ahí es por scope (SAST/SCA) y colisión de categorías SARIF, no por falta de trigger.
> - **Jobs reales**: `actionlint-advisory` + `zizmor-advisory` en `ci.yml` (2D, advisory,
>   artifact 14d) y `zizmor-weekly` en `scheduled-security.yml` (artifact 90d);
>   `prebuild-security-complete.needs` sin cambios en FASE 1; el bloqueante `actionlint` intacto.
> - **Posibilidad futura**: job `actionlint-weekly` tras el primer ciclo semanal de
>   `zizmor-weekly` (el bloqueante ya cubre cada PR).

---
