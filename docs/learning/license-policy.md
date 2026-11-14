# Política de Licencias (License Policy) — Fuente Canónica

> **Change `license-compliance` (2026-09-25).** Este documento es la **fuente única de verdad**
> de la política de licencias de `project-one`. La deny-list ejecutable (`.github/license-policy.yml`, gate PR), la constante
> `LICENSE_DENY_LIST` de `scripts/security/generate-security-digest.mjs` (digest semanal) y la
> evaluación del audit de ScanCode apuntan a la misma lista. Si alguna fuente diverge, **manda la
> de config ejecutable** (es la que consumen ambos gates); corregir las demás en el mismo PR.

> **Change `scancode-license` (2026-11-10):** deny-list CONFIRMADA contra el modelo de
> distribución SaaS del ERP (§1.1), triage de licencias `unknown` con SLA de 30 días (§3.1)
> y capa L2b `scancode-license-pr-diff` promovida a **blocking** (FASE 2).

---

## 1. Deny-list efectiva (gate PR)

Configurada en `.github/license-policy.yml` (única fuente ejecutable; consumida por `dependency-review` vía `config-file` y por `scancode-license-pr-diff` vía lectura directa):

```yaml
deny-licenses:
  - GPL-3.0
  - AGPL-3.0
  - SSPL-1.0
  - CC-BY-NC-4.0
```

| Licencia       | Por qué está denegada                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| `GPL-3.0`      | Copyleft fuerte: obligaría a liberar código propio si se distribuye                |
| `AGPL-3.0`     | Copyleft de red: dispara obligaciones por simple acceso vía red                    |
| `SSPL-1.0`     | Copyleft agravado de servicio (MongoDB): incompatibilidad práctica con SaaS propio |
| `CC-BY-NC-4.0` | No comercial: incompatible con uso productivo                                      |

### 1.1 Modelo de distribución del ERP — deny-list CONFIRMADA (change `scancode-license`, 2026-11-10)

**Decisión del owner (2026-11-10): el ERP se distribuye como SaaS (acceso por red; no hay
entrega de binarios, imágenes ni instalación on-prem a clientes).** La deny-list de
`.github/license-policy.yml` (fuente ejecutable) queda **confirmada** con el siguiente
racional por licencia (research §8.4 de `docs/research/prebuild-security-stage-analysis.md`:
GPL se activa con la distribución; AGPL también con el simple servicio por red):

- `AGPL-3.0` — **riesgo máximo bajo SaaS**: el copyleft de red (sección 13) obliga a liberar
  el código del servicio completo con el que los usuarios interactúan por red. Un solo archivo
  AGPL en el ERP contaminaría todo el servicio.
- `SSPL-1.0` — diseñada explícitamente contra el offering-as-a-service (MongoDB): su sección
  13 exige liberar todo el stack de servicio si se ofrece el software como servicio. Incompatible
  con SaaS propietario.
- `GPL-3.0` — bajo SaaS puro **no se activa** (no hay distribución de binarios). Se deniega de
  forma **conservadora**: (a) un cambio futuro del modelo (on-prem, imagen descargable, CLI de
  cliente) la activaría retroactivamente sobre todo el árbol; (b) cubre distribuciones
  accidentales (exportadores, artefactos descargables).
- `CC-BY-NC-4.0` — cláusula **NoComercial**: incompatible con un ERP productivo bajo cualquier
  modelo de distribución.

**Si el modelo de distribución cambia** (spec `scancode-license`, scenario "Distribution model
changes"): actualizar esta sección, revisar `.github/license-policy.yml` (p. ej. GPL-3.0 pasaría
de conservadora a crítica en on-prem) y tramitarlo vía PR con review de CODEOWNERS.

> **Nota SPDX (2026-09-29):** toda entrada de `deny-licenses` DEBE ser un identificador
> SPDX válido: la acción valida la config al arrancar (`validateLicenses` →
> `spdx-expression-parse`) y falla antes de analizar dependencias si hay un token
> inválido (`Invalid license(s) in deny-licenses`). `Proprietary` NO es un identificador
> SPDX (fue eliminado de la lista: rompía el gate de forma incondicional) y además sería
> inefectivo: las licencias custom/privadas llegan a la Dependency Graph como
> `Other`/`NOASSERTION`, que una deny-list no puede matchear. El software propietario
> se cubre en la capa **ScanCode PR-diff** (`scancode-license-pr-diff`, L2b), que analiza
> archivos del diff con detección de licencia por contenido.

**Alineación con el digest semanal:** `LICENSE_DENY_LIST` en
`scripts/security/generate-security-digest.mjs` usa la **familia GPL/LGPL/AGPL extendida**
(15 entradas: versiones base + variantes `-+` "or later" de GPL/AGPL + LGPL 1.0/2.0/2.1/3.0)
**más `SSPL-1.0` y `CC-BY-NC-4.0`** heredadas de esta deny-list (17 entradas totales), de modo
que el digest sea un **superconjunto** del gate PR como exige la spec
`openspec/specs/license-compliance`. El digest (advisory) alerta más amplio, el gate
PR (blocking) castiga solo las 4 anteriores. El digest omite deliberadamente `LGPL-2.0+`,
`LGPL-2.1+` y `LGPL-3.0+` para evitar sobre-bloqueo (decisión documentada en el change
`ci-scheduled-security`, tasks 4.2).

## 2. Regla allow/deny: mutuamente excluyentes

`actions/dependency-review-action` **no acepta ambas a la vez**: exactamente una de las dos
opciones puede estar definida en el job.

- **Elegida: `deny-licenses` (lista negra)** — una licencia desconocida o `NOASSERTION` no
  falla el gate. Razonable aquí: el árbol actual tiene ~5 paquetes sin campo `license`
  (ej. `khroma`, `callsite`), que romperían un allow-list de inmediato.
- **Alternativa `allow-licenses` (lista blanca)** — más estricta, falla ante cualquier
  licencia fuera de lista (`MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, 0BSD, CC0-1.0,
Unlicense, MPL-2.0` sería la candidata). **Trade-off documentado**: blind spot de
  `NOASSERTION`. Migrar solo si el repo endurece su postura (decisión explícita, no por
  defecto).

## 3. Waivers y excepciones

- **Vulnerabilidades puntuales**: `allow-ghsas` en el job `dependency-review` — hoy vacío
  (`allow-ghsas: ""`). Cada waiver futuro DEBE tener issue de tracking (advisory GHSA,
  justificación, fecha de remediación, responsable) y revisión periódica.
- **Excepciones de licencia**: no existe mecanismo automático. Cualquier excepción a la
  deny-list requiere: (1) issue con el análisis legal/técnico, (2) actualización de este
  documento, (3) PR que modifique `deny-licenses` (queda auditado por review del PR).
  No usar `warn-only: true` para "excepcionar": eso apagaría el gate completo.

### 3.1 Licencias `unknown` — triage con SLA de 30 días (change `scancode-license`, 2026-11-10)

Un `LicenseRef-scancode-unknown*` (ScanCode no puede determinar la licencia de un archivo)
**no bloquea por sí solo** — pero un warning que nadie revisa se convierte en ruido, así que
lleva SLA (spec `scancode-license`, "Unknown license triage rule"):

1. **Detección**: el evaluate step de `scancode-license-pr-diff` emite `::warning::` por cada
   unknown; el hallazgo queda en el artifact `pr-license-report.json` (14d) y en el log del job.
2. **Ticket obligatorio**: abrir un issue con el template
   `.github/ISSUE_TEMPLATE/unknown-license.yml` (label `security`). **El reloj de 30 días
   arranca en la primera detección** — fecha del run de CI que reporta el hallazgo, criterio
   clock-start de `security/SLA.md` §2 (NO la fecha del triaje; la reasignación de responsable
   no reinicia el reloj).
3. **Resolución**: identificar la licencia real (LICENSE/README del vendor, cabecera del
   archivo, SPDX del paquete) y corregir/atribuir el archivo, reemplazar la dependencia
   vendida, o documentar por qué es aceptable.
4. **Extensión de plazo**: SOLO vía entrada en `security/exceptions.yml` (`tool: scancode`,
   `scope: <ruta del archivo>`, `created`/`expires` ≤ created + 90 días, el ticket como
   `ticket:`). El evaluate step cruza los unknowns del diff contra las excepciones:
   **unknown todavía presente + excepción VENCIDA = PR bloqueado** (escalada "unresolved
   after 30 days" de la spec).
5. **Vigilancia de la edad sin excepción registrada**: el job PR es stateless (no puede medir
   la edad de un ticket); la cubren el audit semanal `scancode-license-audit` (repo completo,
   advisory) y la escalación de `security/SLA.md` §3 (`security-sla-at-risk` al 80%,
   `security-sla-breach` al vencer).

## 4. Scopes de fallo (`fail-on-scopes`)

**Decisión (change `dependency-review`, task 4.1, 2026-09-25): se mantiene el default
`runtime`.** La línea `# fail-on-scopes: runtime, development` queda comentada en `ci.yml`
como recordatorio.

- **Alcance efectivo hoy**: solo vulnerabilidades/licencias de dependencias **runtime**
  bloquean el PR.- **Riesgo declarado**: una devDependency con vulnerabilidad `>= moderate` o licencia de la deny-list **NO bloquea hoy** (el tooling de build/test queda fuera del gate).
- **Nota de triage (2026-09-27, change `sca-lockfile-compliance` task 5.1b)**: tras el triage `npm audit` (90 → 15 hallazgos; detalle en `sca-dependency-lockfile-scan.md` §9), los **15 residuales (14 ≥ moderate) viven en cadenas dev-only**: `omniroute` (con `next`, `onnxruntime-node`, `dompurify`, `monaco-editor` anidados) y `storybook@9.1` (7 paquetes SB + `@vitest/mocker` anidado) — ambos sin fix upstream. Con `fail-on-scopes: runtime` (default actual), el gate FASE 2 no los bloquearía; **si** se activa `development`, esos 15 hallazgos bloquearían todos los PRs sin remedio disponible. Condición adicional para revisar `fail-on-scopes`: resolver primero las 2 causas raíz (omniroute con fix upstream / override documentado; storybook 9.2.0 stable o 10.x).
- **Condición para revisar**: tras un PR de prueba controlada que confirme el comportamiento
  del comentario en PR y la política de licencias, evaluar activar
  `fail-on-scopes: runtime, development` (ver roadmap en `docs/learning/dependency-review.md`).

## 5. `security-events: write` — declarado, no ejercido

El job `dependency-review` declara `security-events: write`, pero
`actions/dependency-review-action` **NO emite SARIF** (su salida es texto/JSON). El permiso
queda como oportunidad futura, no como error: si algún día se quiere publicar hallazgos de
licencia en Security → Code scanning alerts, haría falta un **transformador propio**
SPDX/JSON → SARIF. Hoy el SARIF de dependencias del Security tab proviene de **Trivy**
(`security.yml` job `dependency-scan`, `category: trivy`). Tampoco FOSSA emite SARIF
(GitHub App de FOSSA = 2 status checks, sin PR comments).

## 6. Capas de cumplimiento (resumen)

| Capa                | Herramienta                                                                   | Qué analiza                                                                                                                | Modo                                                                                                     | Ubicación                                                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| L1 local (opcional) | ScanCode CLI                                                                  | licencia + copyright **por archivo**                                                                                       | advisory, manual                                                                                         | `.scancode.yml` + comando de §7                                                                                                                                         |
| L2 PR-time          | `dependency-review-action@v5`                                                 | manifiesto del diff PR (vuln + licencia declarada)                                                                         | **blocking**                                                                                             | `ci.yml` substage 2C                                                                                                                                                    |
| L2b PR-diff         | ScanCode en `ci.yml`                                                          | licencia + copyright **por archivo** del diff ACMR del PR                                                                  | **blocking** (FASE 2 activa 2026-11-10)                                                                  | `ci.yml` job `scancode-license-pr-diff` (artifact `pr-license-report.json` 14d)                                                                                         |
| L3 audit semanal    | ScanCode en cron                                                              | archivo de librerías del repo completo                                                                                     | advisory                                                                                                 | `scheduled-security.yml` job `scancode-license-audit` (artifact 90d)                                                                                                    |
| (CVE)               | Trivy                                                                         | CVE filesystem/OS — **no licencias**                                                                                       | advisory en schedule                                                                                     | `security.yml` `dependency-scan`                                                                                                                                        |
| L2 (CVE lockfile)   | `npm audit` (job `lockfile-audit`)                                            | CVE del lockfile resuelto (transitivos incluidos) — **no licencias**                                                       | blocking (FASE 2 activa 2026-11-10)                                                                      | `ci.yml` (artifact `lockfile-audit-pr` 14d); umbral `moderate`                                                                                                          |
| (IaC)               | Checkov (`checkov-iac`)                                                       | Configuración de infraestructura (Dockerfile/tf/k8s) — **no licencias ni CVE**                                             | advisory FASE 1 (soft-fail)                                                                              | `ci.yml` + `scheduled-security.yml` (`category: checkov-iac`); política `.checkov.yml`                                                                                  |     | (calidad Containerfile) | Hadolint (`containerfile-lint`) | Higiene/calidad del Dockerfile (ShellCheck, pin, capas) — **no licencias ni CVE ni policy IaC** | advisory FASE 1 | `ci.yml` + `scheduled-security.yml` (`category: hadolint[-weekly]`); política `.hadolint.yaml` |
| (pipeline config)   | actionlint + zizmor (`actionlint-advisory`/`zizmor-advisory`/`zizmor-weekly`) | Configuración de workflows de GitHub Actions (unpinned uses, inyección de expresiones, permisos) — **no licencias ni CVE** | blocking (FASE 2 activa 2026-11-10; zizmor scopeado a `unpinned-uses`, zizmor-weekly advisory scheduled) | `ci.yml` + `scheduled-security.yml` (`category: actionlint`/`zizmor`/`zizmor-weekly`); políticas `.github/actionlint.yaml` (bloqueante, intacta) + `.github/zizmor.yml` |
| (typosquatting)     | GuardDog (`typosquat-guarddog`/`guarddog-weekly`)                             | Typosquatting / dependency confusion / malicious packages (metadatos + YARA) — **no licencias ni CVE**                     | blocking (PR, FASE 2 activa 2026-11-10); `guarddog-weekly` advisory scheduled                            | `ci.yml` + `scheduled-security.yml` (`category: guarddog[-weekly]`); política única: wrapper `scripts/guarddog-verify.sh`                                               |

Las capas L2 y L2b evalúan la **misma deny-list**: ambas consumen la fuente ejecutable única
`.github/license-policy.yml` (`dependency-review` vía `config-file`; `scancode-license-pr-diff`
vía lectura directa validada en runtime — sin duplicar la lista ni scrapear el workflow).
`LicenseRef-scancode-unknown*` = warning + ticket con SLA de 30 días (§3.1); escala a
bloqueante solo con excepción vencida en `security/exceptions.yml`. Separación detallada:
`docs/learning/license-compliance.md` §3. Taxonomía completa: `docs/learning/quality-gates.md` §2.

## 7. Capa L1 — escaneo local con ScanCode (advisory, opcional)

Config en `.scancode.yml` (raíz). Invocación local:

```bash
# Instalación pinned (ScanCode NO publica imagen Docker oficial — la antigua
# referencia `aboutcode/scancode-toolkit:32.5.0` no existe en Docker Hub; la doc
# oficial indica buildear desde el Dockerfile del repo):
uv tool install --python 3.12 "scancode-toolkit==32.5.0"
#   alternativa: pipx install --python python3.12 scancode-toolkit==32.5.0

scancode --license --copyright --only-findings --json-pp scancode-report.json .
```

- **Nunca `--csv`**: deprecado (scancode-toolkit issue #3043); usar `--json-pp` o `--spdx-tv`.
- **No hay hook bloqueante en `.husky/`**: ScanCode es lento sobre `node_modules/`; L1 es
  manual/opcional (verificación previa a introducir una dependencia vendida o dudosa). Un hook
  bloqueante futuro sería un change propio con `.scancode-ignore` afinado.
- **Fuentes canónicas**: `github.com/aboutcode-org/scancode-toolkit` +
  `scancode-toolkit.readthedocs.io` (no `scancode.io`, que no resuelve de forma estable).

## 8. Validación local de la política

```bash
# Vulnerabilidades del árbol actual (L2 aproximación local):
npm audit --json

# Licencias del árbol (escaneo de package.json instalados):
node -e "const fs=require('fs');for(const d of fs.readdirSync('node_modules')){try{const p=JSON.parse(fs.readFileSync('node_modules/'+d+'/package.json'));if(/GPL|AGPL|SSPL|CC-BY-NC/i.test(p.license||''))console.log(d,p.license)}catch{}}"

# ScanCode completo (L1): ver §7
```

Hallazgo conocido (2026-09-25, no viola la deny-list del gate): los paquetes transitivos
`@img/sharp-win32-x64` (`Apache-2.0 AND LGPL-3.0-or-later`) y `expand-template`
(`MIT OR WTFPL`) llegan vía `omniroute` (devDependency raíz). `LGPL-3.0` y `WTFPL` NO están
en la deny-list del gate PR; el digest semanal tampoco los bloquea (LGPL-3.0 sí está en
`LICENSE_DENY_LIST` → aparecerá como aviso en el digest).
