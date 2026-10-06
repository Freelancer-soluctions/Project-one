# Dependency Review (SCA / Dependency-Scan) — Implementación Profesional / Enterprise

> Verificado 2026-09-25 — referencias oficiales comprobadas (`docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review`, `github.com/actions/dependency-review-action`, `docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file`; URLs rotas corregidas: `.../rest/dependency-graph/dependency-review` vs `.../rest/dependency-graph/dependency-review` — uso la segunda válida; `.../working-with-dependabot/grouping-dependabot-version-updates` → 404; uso `configuration-options-for-the-dependabot.yml-file`).

---

## 1. Contexto y ubicación en pipeline

**SCA = Software Composition Analysis**. Analiza dependencias de terceros (vulnerabilidades CVE + licencias). Es una capa separada en el pipeline de CI/CD, distinta de SAST (código fuente) y secret-scanning (gitleaks). En `project-one` vive como **substage 2C Security** (`prebuild-security-complete.needs`) junto a `secrets`; bloquea merge si encuentra vulnerabilidades moderadas o mayores.

Referencia pipeline: `docs/ci-cd-pipeline-empresarial.md` §23.5 fila `Dependency Review (security.yml — vuln+license en PR)` — **nota histórica**: ahora vive **inline en `ci.yml`** (job `dependency-review` L765-787), no en `security.yml`. `security.yml` conserva `dependency-scan` (Trivy SCA) como capa separada.

Estado actual verificado (repo, 2026-09-25):

```
ci.yml: dependency-review (L765)  → blocking, no continue-on-error, needs prebuild-security-complete
security.yml: dependency-scan (Trivy fs, SARIF, exit-code 1) → deshabilitado (disabled_manually) pero activo post secret-scanning
scheduled-security.yml: gitleaks-full-scan (audit) → activo
```

Taxonomía `quality-gates.md` §2: **fila `dependency-review` PRESENTE** (taxonomía `blocking (PR)`, change `dependency-review`, 2026-09-25), misma variante que la fila `secrets`. Los datos de `docs/CONTEXT-CICD.md` §9.3.5 y `docs/pre-merge-gates-governance.md` §4.12 confirman el gate; el §4.12 corregido ya no afirma que el default de la acción es `high` (es `low`).

---

## 2. Referencias oficiales (2026-09-25)

| Fuente                                             | URL                                                                                                                                            | Estado / Nota clave                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| About dependency review — GitHub Docs              | `https://docs.github.com/en/code-security/supply-chain-security/understanding-your-software-supply-chain/about-dependency-review`              | ✅ 200 OK; diferencia diff PR; requiere dependency graph; disponible repos públicos + privados con GHAS                                                                                                                                                                                                                                                                     |
| Dependency review REST API                         | `https://docs.github.com/en/rest/dependency-graph/dependency-review`                                                                           | ✅ 200 OK (la ruta `.../interact-with-dependency-review` en el brief es 404); campos: `vulnerabilities[].severity`, `vulnerabilities[].advisory_ghsa_id`, `vulnerabilities[].scope`, `license`; `compare/{basehead}`; header `2026-03-10`; 403 si privado sin GHAS                                                                                                          |
| Configure dependency review action — GitHub Docs   | `https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-dependency-review-action` | ✅ Verificado; opciones `fail-on-severity`, `vulnerability-check`, `license-check`, `allow-ghsas`, `comment-summary-in-pr`, `config-file`                                                                                                                                                                                                                                   |
| Action README (`actions/dependency-review-action`) | `https://github.com/actions/dependency-review-action`                                                                                          | ✅ Verificado 2026-09-25; defaults: `fail-on-severity=low`, `fail-on-scopes=[runtime]`, `license-check=true`, `vulnerability-check=true`, `allow-ghsas=[]`; outputs JSON + `comment-content`; requiere `pull-requests: write`; NO emite SARIF (salida texto/JSON, no SARIF); `deny-licenses`/`allow-licenses` mutuamente excluyentes; `filter` por `names`, `groups` (purl) |
| Dependabot — version updates config                | `https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/configuration-options-for-the-dependabot.yml-file`             | ✅ 200 OK (la ruta `.../grouping-dependabot-version-updates` del brief es 404); `groups`, `schedule`, `cooldown-hours`, `open-pr`                                                                                                                                                                                                                                           |
| Dependabot — working with                          | `https://docs.github.com/en/code-security/dependabot/working-with-dependabot`                                                                  | ✅ Redirige al hub de "Securing your supply chain"; referencia general                                                                                                                                                                                                                                                                                                      |

> **Corrección de URLs rotas (note para futuro)**: `.../rest/dependency-graph/dependency-review` (REST) funciona; `.../interact-with-dependency-review` no; `.../grouping-dependabot-version-updates` no; reemplazo por `configuration-options-for-the-dependabot.yml-file`.

---

## 3. Implementación en `project-one` (verificado en repo)

### 3.1 Job actual (`ci.yml` L765-787)

```yaml
dependency-review:
  name: Dependency Review
  runs-on: ubuntu-latest
  timeout-minutes: 10
  if: github.event_name == 'pull_request'
  permissions:
    contents: read
    pull-requests: write
    security-events: write
  steps:
    - uses: actions/checkout@v5
    - name: Run dependency review
      uses: actions/dependency-review-action@v5
      with:
        fail-on-severity: moderate
        allow-ghsas: ''
        vulnerability-check: true
        license-check: true
```

Observaciones verificadas:

- **Bloqueante por defecto**: `continue-on-error` no definido → `false`; si falla → `prebuild-security-complete` ve `failure` → bloquea `ci-complete` → **merge bloqueado**.
- **No está en `required_status_checks` ruleset** (solo governance checks: 4 requeridos; `dependency-review` es check de PR-run pero NO required por ruleset — coherente con `quality-gates.md` §2 donde aparece como `Gate bloqueante` pero no tiene `*` en required).
- **Permisos**: `pull-requests: write` (ejercido por `comment-summary-in-pr: on-failure`, change `dependency-review`) + `security-events: write` (**declarado, NO ejercido** — la acción no emite SARIF; se mantiene por simetría con los demás jobs de seguridad y por si se añade subida SARIF futura. El SARIF de vulnerabilidades de dependencias lo produce Trivy, ver §4.6).
- **Severity**: `moderate` es más estricto que default (`low`) → cualquier vulnerabilidad ≥ moderate bloquea PR. Es política adecuada para enterprise (no `low` — evita ruido; no `high` — podría dejar pasar moderadas críticas en librerías transitivas).
- **Scopes**: **decisión documentada (change `dependency-review`, task 4.1): se MANTIENE el default `runtime`** — `development` NO está incluido. Las devDependencies del repo son tooling de build/test; activar `development` sin un PR de prueba podría bloquear PRs de actualización de tooling. La línea `# fail-on-scopes: runtime, development` queda comentada en `ci.yml` como recordatorio; revisar tras un PR controlado. Hoy una vulnerabilidad en una devDependency **no bloquea**.
- **License**: `license-check: true` sin `allow-licenses`/`deny-licenses` → **NO impone política de licencias** (solo imprime `unlicensed` / `NOASSERTION`; `unresolved` falla solo cuando hay lista de allow/deny). **Gap**: política de licencias no documentada ni configurada.
- **Waivers**: `allow-ghsas: ""` vacío → ninguna excepción documentada; `deny-packages` / `deny-groups` (purl) no configurados.
- **Comment**: `comment-summary-in-pr: on-failure` configurado (change `dependency-review`) → el resumen de hallazgos se publica como comentario en el PR solo cuando el gate falla, ejerciendo `pull-requests: write`. En PRs de forks el comentario puede fallar (permisos del token) — aceptado: el job sigue fallando por los hallazgos; si resultara ruidoso, degradar a `never` solo para forks.
- **No SARIF**: la acción no genera SARIF; SARIF de vulnerabilidades de dependencias viene de Trivy (`security.yml` job `dependency-scan`) con `upload-sarif@v4` categoría `trivy`. **Separación correcta**.

### 3.2 Integración con agregador (`prebuild-security-complete`)

`ci.yml` L1246-1264 (después de ajustes `secret-scanning`):

```yaml
prebuild-security-complete:
  needs:
    - dependency-review # <-- bloqueante
    - secrets # <-- bloqueante (post secret-scanning)
```

- Si `dependency-review` falla → `contains(needs.*.result, 'failure')` → exit 1 → substage 2C falla → `ci-complete` falla → **merge bloqueado**.
- Es coherente con la taxonomía `blocking` de `quality-gates.md`.

---

## 4. Buenas prácticas enterprise / profesionales

### 4.1 Severity thresholds y políticas de bloqueo

| Política                     | `fail-on-severity`  | Cuándo usar                                                                                              | Riesgo                                                                    |
| ---------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Enterprise (recomendado)** | `moderate`          | Bloquea vulnerabilidades con impacto real (inyección, XSS, RCE); permite `low` (informativo, no bloquea) | Equilibrado: no bloquea por cada CVSS 3.1 `low` en librerías transitorias |
| **Strict (alta seguridad)**  | `high` o `critical` | Solo bloquea severidades altas; útil si hay muchas `moderate` en `devDependencies` inactivas             | Puede dejar pasar `moderate` en `runtime` activo                          |
| **Baseline / audit**         | `low`               | Todos los findings bloquean; requiere `continue-on-error: true` + ruleset o revisión manual              | Alto ruido; solo si hay baseline limpio y proceso de remediación semanal  |

**Nota crítica**: el default de `actions/dependency-review-action` es **`low`** (no `high` como afirma `docs/pre-merge-gates-governance.md` §4.12, que contiene inexactitud — corregido por inspección de `src/schemas.ts`). El proyecto usa `moderate`, que es más estricto que default, coherente con política enterprise.

### 4.2 Licencias — política configurada (change `dependency-review`, 2026-09-25)

El repo usa **`deny-licenses` (lista negra)** — decisión D2 del change (externalizada 2026-09-30 a `.github/license-policy.yml`, consumida vía input `config-file`):

```yaml
# ci.yml — job dependency-review (with:)
license-check: true
config-file: .github/license-policy.yml
```

```yaml
# .github/license-policy.yml — fuente única ejecutable (también la lee scancode-license-pr-diff)
deny-licenses:
  - GPL-3.0
  - AGPL-3.0
  - SSPL-1.0
  - CC-BY-NC-4.0
```

**Fuente canónica de la política:** [`docs/learning/license-policy.md`](./license-policy.md) (change `license-compliance`) — deny-list, regla allow/deny mutuamente excluyente, waivers, decisión `fail-on-scopes` y validación local.

**Justificación de la lista:**

- `GPL-3.0` / `AGPL-3.0` / `SSPL-1.0`: copyleft fuerte de red — riesgo si el repo dejara de ser público.
- `CC-BY-NC-4.0`: no comercial, incompatible con uso productivo.
- ~~`Proprietary`~~ (eliminada 2026-09-29): NO es un identificador SPDX válido — la acción valida
  la config al arrancar y falla con `Invalid license(s) in deny-licenses` antes de escanear
  dependencias. Además, las licencias privadas llegan a la Dependency Graph como
  `Other`/`NOASSERTION` y una deny-list no puede matchearlas: las cubre la capa ScanCode
  PR-diff (`scancode-license-pr-diff`). Ver `docs/learning/license-policy.md` §1.
- Alineada con `LICENSE_DENY_LIST` de `scripts/generate-security-digest.mjs` (familia GPL/LGPL/AGPL, documentado en `docs/security/SECURITY.md`).

**Por qué deny y no allow:** `allow-licenses` (lista blanca: `MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, CC0-1.0, Unlicense, MPL-2.0`) es más estricta pero falla ante cualquier licencia no listada — incluidas `NOASSERTION`/desconocidas. En el árbol actual hay ~5 paquetes sin campo `license` (ej. `khroma`, `callsite`), lo que rompería un allow-list de inmediato. La lista negra no falla ante licencias desconocidas (aceptado y documentado como trade-off; migrar a `allow-licenses` si se quiere strict). `deny-licenses` y `allow-licenses` son **mutuamente excluyentes** — exactamente uno de los dos.

**Validación local (ejecutada 2026-09-25, árbol limpio respecto de la lista):**

```bash
npm ls --depth=0 --json | jq '.dependencies | to_entries[] | .value.license'
# npm >= 11 no expone license en --json; alternativa:
node -e "const fs=require('fs');for(const d of fs.readdirSync('node_modules')){try{const p=JSON.parse(fs.readFileSync('node_modules/'+d+'/package.json'));if(/GPL|AGPL|SSPL|CC-BY-NC/i.test(p.license||''))console.log(d,p.license)}catch{}}"
```

Hallazgo conocido (no viola la lista): los paquetes transitivos `@img/sharp-win32-x64` (`Apache-2.0 AND LGPL-3.0-or-later`) y `expand-template` (`MIT OR WTFPL`) llegan vía `omniroute` (devDependency raíz). `LGPL-3.0` y `WTFPL` NO están en la deny-list; si se endureciera hacia LGPL, `omniroute` dejaría de pasar el gate.

- Si se quiere solo audit (no bloqueo), usar `continue-on-error: true` + `warn-only: true` (no bloquea, solo comenta) — descartado: el gate ya es blocking por diseño.

### 4.3 Waivers / excepciones documentadas (`allow-ghsas`)

```yaml
with:
  allow-ghsas: >
    GHSA-1234-5678-9012, GHSA-abcd-efgh-ijkl
```

Requisitos enterprise:

- Cada waiver debe tener **issue tracking** (GitHub Issue con referencia al advisory, fecha de remediación, responsable, justificación técnica).
- No usar `allow-ghsas: "*"` ni lista genérica.
- Actualizar `allow-ghsas` periódicamente (cada mes o tras cada nuevo advisory): eliminar waivers vencidos.
- Documentar en `docs/learning/dependency-review.md` o `docs/security/waivers.md`.

### 4.4 Dependabot — actualización y agrupamiento (reducción de ruido)

El repo tiene `.github/dependabot.yml` (verificado en investigación previa del research):

```yaml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
      day: 'monday'
      time: '03:00'
    open-pull-requests-limit: 10
    groups:
      dev-dependencies:
        patterns:
          [
            'eslint*',
            'prettier*',
            'typescript*',
            'vitest*',
            '@testing-library/*',
            '@types/*',
          ]
        update-types: ['minor', 'patch']
    ignore:
      - dependency-name: 'react'
      - dependency-name: 'react-dom'
```

Buenas prácticas adicionales:

- **Grupo `dev-dependencies`** ya existe; sugerir agregar grupo `security-patches` (solo `patch` de paquetes con CVE conocido) para responder rápido a advisories críticos sin afectar `minor`/`major`.
- `cooldown-hours: 24` (o `48`) evita PR saturación.
- `open-pr-limit` actual `10` es razonable; para repos grandes > 50 deps, subir a 20 o agrupar más.
- Dependabot se integra con `dependency-review-action`: si Dependabot crea PR con actualización, `dependency-review` valida que no introduzca nuevas vulnerabilidades.

### 4.5 SCA local (antes de PR)

Recomendación para desarrolladores:

```bash
npm audit --json          # vulnerabilidades del árbol actual
npm audit fix --dry-run     # qué cambiaría sin modificar
pnpm audit                 # equivalente para pnpm
```

Para proyecto con `pnpm` o `yarn`, usar el equivalente. Validar antes de abrir PR evita fallos de `dependency-review`.

### 4.6 SARIF / Code Scanning — separación Trivy vs dependency-review (dos capas complementarias)

`dependency-review-action@v5` **NO emite SARIF** (solo JSON/texto). SARIF de vulnerabilidades de dependencias debe venir de **Trivy** (`security.yml` job `dependency-scan`) con `format: sarif`, `category: trivy`, `upload-sarif@v4`.

**Las dos capas son COMPLEMENTARIAS, no duplicadas (change `dependency-review`, task 5.2):**

| Capa                        | Workflow / job                                         | Alcance                                                                                                     | Salida                                                      | Momento                        |
| --------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------ |
| **dependency-review**       | `ci.yml` job `dependency-review` (inline, substage 2C) | **Diff del PR** sobre el árbol npm: dependencias nuevas/actualizadas + sus licencias; advisory DB de GitHub | Texto/JSON (+ comentario en PR con `on-failure`); SIN SARIF | `pull_request` (blocking)      |
| **Trivy `dependency-scan`** | `security.yml` job `dependency-scan`                   | **Filesystem completo**: lockfiles + paquetes de OS del contenedor (CVE filesystem + OS)                    | SARIF (`category: trivy`) a Code Scanning                   | PR/push (según `security.yml`) |

Por qué no se elimina ninguna: Trivy ve el árbol completo (incluido lo ya aprobado y los paquetes de OS) y produce el SARIF para Code Scanning; `dependency-review` ve solo el delta del PR (no genera ruido sobre vulnerabilidades preexistentes) e impone la política de licencias. Taxonomía de referencia: `docs/learning/quality-gates.md` §2 y `docs/CONTEXT-CICD.md` §9.3.5.

---

## 5. Roadmap / mejoras para `project-one`

| Prioridad                                               | Tarea                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Referencia / archivo                         | Impacto                               |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- | ------------------------------------- |
| **P0** (ya hecho por `secret-scanning`)                 | Habilitar `security.yml` + `scheduled-security.yml`; wire `secrets` a `prebuild-security-complete`; fix `notify-failure`; bump gitleaks v8.30.1                                                                                                                                                                                                                                                                                                                                                        | `docs/learning/secret-scanning.md`; `ci.yml` | R1 operativo (gate PR-time secrets)   |
| **P0 — HECHO (change `dependency-review`, 2026-09-25)** | Fila `dependency-review` en `quality-gates.md` §2 (taxonomía `blocking (PR)`) + tabla resumen §4.4                                                                                                                                                                                                                                                                                                                                                                                                     | `docs/learning/quality-gates.md`             | Coherencia docs/pipeline              |
| **P1 — HECHO (change `dependency-review`, 2026-09-25)** | Política de licencias configurada: `deny-licenses: GPL-3.0, AGPL-3.0, SSPL-1.0, CC-BY-NC-4.0` en `.github/license-policy.yml` (alineada con `LICENSE_DENY_LIST`; desde 2026-09-30 el job la consume vía `config-file` — la clave inline `deny-licenses` de la acción estaba deprecated, issue #938); validación local documentada arriba (§4.2). **Corrección 2026-09-29**: se eliminó `Proprietary` — no es identificador SPDX válido y la acción rechaza la config en arranque (fail-fast), ver §4.2 | `ci.yml` job `dependency-review`             | Licencias copyleft bloqueadas en PR   |
| **P1 — HECHO (change `dependency-review`, 2026-09-25)** | `comment-summary-in-pr: on-failure` configurado (ejerce `pull-requests: write`)                                                                                                                                                                                                                                                                                                                                                                                                                        | `ci.yml` job `dependency-review`             | Hallazgos visibles en el PR           |
| **P1 — DECISIÓN TOMADA (change `dependency-review`)**   | `fail-on-scopes`: se MANTIENE default `runtime` (decisión + justificación comentada en `ci.yml` y §3.1); revisar `development` tras PR de prueba                                                                                                                                                                                                                                                                                                                                                       | `ci.yml` (comentario) / §3.1                 | Decisión explícita y auditable        |
| **P1**                                                  | Documentar `allow-ghsas` (waivers) con issues vinculados; actualizar semestralmente                                                                                                                                                                                                                                                                                                                                                                                                                    | `docs/security/waivers.md` (propuesto)       | Cumplimiento / auditoría              |
| **P2**                                                  | Validar en PR de prueba: comentario publicado en fallo + política de licencias sin falsos positivos; evaluar `fail-on-scopes: runtime, development`                                                                                                                                                                                                                                                                                                                                                    | PR de prueba                                 | Confirmación empírica del gate        |
| **P2**                                                  | Integrar Dependabot `groups` + `cooldown-hours`; agregar grupo `security-patches`                                                                                                                                                                                                                                                                                                                                                                                                                      | `.github/dependabot.yml`                     | Reducción de ruido de actualizaciones |

---

## 6. Conclusión

`dependency-review` es un **gate de seguridad blockchain** (bloquea merge por vulnerabilidades y licencias) implementado en `ci.yml` como substage 2C (`prebuild-security-complete`). Está bien configurado para blocking (`fail-on-severity: moderate`, `continue-on-error: false`, `vulnerability-check` + `license-check`). Los gaps empresariales restantes son: **(a)** política de licencias no definida; **(b)** waivers no documentados; **(c)** fila faltante en `quality-gates.md`; **(d)** `comment-summary-in-pr` no usado; **(e)** `development` scope no considerado; **(f)** `security-events: write` no usado por la acción (no es error, solo oportunidad de integración futura con SARIF si la acción lo soportara).

Referencia canónica: `docs/learning/dependency-review.md` (este archivo), `docs/learning/quality-gates.md` (taxonomía), `docs/CONTEXT-CICD.md` §9.3.5, `.github/workflows/ci.yml` L765-787.
