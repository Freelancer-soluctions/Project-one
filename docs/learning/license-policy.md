# Política de Licencias (License Policy) — Fuente Canónica

> **Change `license-compliance` (2026-09-25).** Este documento es la **fuente única de verdad**
> de la política de licencias de `project-one`. La deny-list de `ci.yml` (gate PR), la constante
> `LICENSE_DENY_LIST` de `scripts/security/generate-security-digest.mjs` (digest semanal) y la
> evaluación del audit de ScanCode apuntan a la misma lista. Si alguna fuente diverge, **manda la
> config de `ci.yml`** (es el gate bloqueante); corregir las demás en el mismo PR.

---

## 1. Deny-list efectiva (gate PR)

Configurada en `.github/workflows/ci.yml` job `dependency-review`:

```yaml
deny-licenses: GPL-3.0, AGPL-3.0, SSPL-1.0, Proprietary, CC-BY-NC-4.0
```

| Licencia       | Por qué está denegada                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| `GPL-3.0`      | Copyleft fuerte: obligaría a liberar código propio si se distribuye                |
| `AGPL-3.0`     | Copyleft de red: dispara obligaciones por simple acceso vía red                    |
| `SSPL-1.0`     | Copyleft agravado de servicio (MongoDB): incompatibilidad práctica con SaaS propio |
| `Proprietary`  | Sin derecho auditado a redistribución/modificación                                 |
| `CC-BY-NC-4.0` | No comercial: incompatible con uso productivo                                      |

**Alineación con el digest semanal:** `LICENSE_DENY_LIST` en
`scripts/security/generate-security-digest.mjs` usa la **familia GPL/LGPL/AGPL extendida**
(15 entradas: versiones base + variantes `-+` "or later" de GPL/AGPL + LGPL 1.0/2.0/2.1/3.0).
Es un superconjunto intencional del gate PR: el digest (advisory) alerta más amplio, el gate
PR (blocking) castiga solo las 5 anteriores. El digest omite deliberadamente `LGPL-2.0+`,
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

| Capa                | Herramienta                                                                   | Qué analiza                                                                                                                | Modo                                               | Ubicación                                                                                                                                                               |
| ------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ----------------------- | ------------------------------- | ----------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------- |
| L1 local (opcional) | ScanCode CLI                                                                  | licencia + copyright **por archivo**                                                                                       | advisory, manual                                   | `.scancode.yml` + comando de §7                                                                                                                                         |
| L2 PR-time          | `dependency-review-action@v5`                                                 | manifiesto del diff PR (vuln + licencia declarada)                                                                         | **blocking**                                       | `ci.yml` substage 2C                                                                                                                                                    |
| L2b PR-diff         | ScanCode en `ci.yml`                                                          | licencia + copyright **por archivo** del diff ACMR del PR                                                                  | advisory (FASE 1) → blocking (FASE 2)              | `ci.yml` job `scancode-license-pr-diff` (artifact `pr-license-report.json` 14d)                                                                                         |
| L3 audit semanal    | ScanCode en cron                                                              | archivo de librerías del repo completo                                                                                     | advisory                                           | `scheduled-security.yml` job `scancode-license-audit` (artifact 90d)                                                                                                    |
| (CVE)               | Trivy                                                                         | CVE filesystem/OS — **no licencias**                                                                                       | advisory en schedule                               | `security.yml` `dependency-scan`                                                                                                                                        |
| L2 (CVE lockfile)   | `npm audit` (job `lockfile-audit`)                                            | CVE del lockfile resuelto (transitivos incluidos) — **no licencias**                                                       | advisory FASE 1 → blocking FASE 2                  | `ci.yml` (artifact `lockfile-audit-pr` 14d); umbral `moderate`                                                                                                          |
| (IaC)               | Checkov (`checkov-iac`)                                                       | Configuración de infraestructura (Dockerfile/tf/k8s) — **no licencias ni CVE**                                             | advisory FASE 1 (soft-fail)                        | `ci.yml` + `scheduled-security.yml` (`category: checkov-iac`); política `.checkov.yml`                                                                                  |     | (calidad Containerfile) | Hadolint (`containerfile-lint`) | Higiene/calidad del Dockerfile (ShellCheck, pin, capas) — **no licencias ni CVE ni policy IaC** | advisory FASE 1 | `ci.yml` + `scheduled-security.yml` (`category: hadolint[-weekly]`); política `.hadolint.yaml` |
| (pipeline config)   | actionlint + zizmor (`actionlint-advisory`/`zizmor-advisory`/`zizmor-weekly`) | Configuración de workflows de GitHub Actions (unpinned uses, inyección de expresiones, permisos) — **no licencias ni CVE** | advisory FASE 1 (zizmor-weekly advisory scheduled) | `ci.yml` + `scheduled-security.yml` (`category: actionlint`/`zizmor`/`zizmor-weekly`); políticas `.github/actionlint.yaml` (bloqueante, intacta) + `.github/zizmor.yml` |
| (typosquatting)     | GuardDog (`typosquat-guarddog`/`guarddog-weekly`)                             | Typosquatting / dependency confusion / malicious packages (metadatos + YARA) — **no licencias ni CVE**                     | advisory FASE 1                                    | `ci.yml` + `scheduled-security.yml` (`category: guarddog[-weekly]`); política única: wrapper `scripts/guarddog-verify.sh`                                               |

Las capas L2 y L2b evalúan la **misma deny-list**: el job `scancode-license-pr-diff`
lee la clave `deny-licenses` del job `dependency-review` en runtime (sin duplicar la
lista); `LicenseRef-scancode-unknown*` = warning permanente (nunca bloquea, ni en
FASE 2). Separación detallada: `docs/learning/license-compliance.md` §3. Taxonomía
completa: `docs/learning/quality-gates.md` §2.

## 7. Capa L1 — escaneo local con ScanCode (advisory, opcional)

Config en `.scancode.yml` (raíz). Invocación local:

```bash
# Docker (recomendado, sin instalar nada):
docker run --rm -v "$(pwd)":/project aboutcode/scancode-toolkit:32.5.0 \
  scancode --license --copyright --only-findings --json-pp scancode-report.json /project

# O con CLI instalada (pipx install scancode-toolkit):
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
