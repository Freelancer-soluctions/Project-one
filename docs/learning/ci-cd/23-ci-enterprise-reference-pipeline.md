# 23 — Pipeline enterprise de referencia: escala, SLSA L3 y future-proofing

> **Nivel Profesional · Guía 23**
> Esta guía cierra el nivel Profesional con el **salto de escala**: qué significa "pipeline enterprise", cómo se mide la
> escala de un pipeline sin autoengañarse con el número de workflows, qué es SLSA Level 3 y por qué este repo **no**
> está en ese nivel, qué es VEX y por qué un SBOM sin VEX produce ruido, dónde está el escaneo de IaC de verdad, y qué
> sería "future-proofing" para este proyecto.

> 🗑️ **El workflow de referencia `ci-enterprise.yml` está retirado.** Ya no existe en `.github/workflows/` ni en el
> registro de GitHub Actions (ver `docs/CONTEXT-CICD.md` §5.9). Como el archivo era el mejor espécimen didáctico del
> repo sobre **anti-patrones de portabilidad**, esta guía lo estudia a partir de los **snippets supervivientes** de las
> guías 02 (§7.1) y 09 (§6), no de un archivo que puedas abrir hoy.

## 🎯 Objetivos de aprendizaje

Al terminar esta guía serás capaz de:

1. **Medir la escala real** de un pipeline con comandos reproducibles (archivos, definiciones de job, workflows activos
   vs. `disabled_manually`) y explicar por qué "cuántos workflows tengo" no es una métrica de madurez.
2. **Explicar qué define a un pipeline enterprise** (los 14 stages del pipeline genérico) y compararlo con lo que este
   repo tiene **hoy**, número a número.
3. **Leer `ci-enterprise.yml` como espécimen** y reconocer sus cinco anti-patrones de portabilidad sin ejecutarlo.
4. **Ubicar el proyecto en SLSA** (qué nivel tiene de verdad) y enumerar los requisitos de Build L3 que le faltan.
5. **Explicar VEX** (sus cuatro statuses) y por qué un SBOM sin VEX genera ruido operativo en lugar de seguridad.
6. **Diseñar el siguiente incremento enterprise** de este repo: 3-5 items priorizados por riesgo y coste, incluyendo
   qué parte del "future-proofing" (Kubernetes, canary, feature flags, OpenTelemetry) merece la pena y qué parte no.

## 📋 Prerequisitos

- **Guía 06** (walkthrough de `ci.yml`): leer un workflow con `needs:`, `if:`, `steps:` y `outputs`.
- **Guía 09** (caching): el gotcha del `cache-dependency-path` es la mitad de la Parte B.
- **Guía 18** (SAST/SCA/SBOM): sin saber qué es un SBOM CycloneDX, la sección de VEX no se entiende.
- **Guía 22** (rulesets): los required status checks son el "contrato" que hace que la escala importe.

---

# PARTE A — La escala: cómo se mide y qué significa

## 1. Tres números que la gente confunde con uno

Cuando alguien dice "mi pipeline tiene 9 workflows" o "un pipeline enterprise tiene 30+ jobs", está mezclando tres
métricas distintas que se mueven por motivos distintos:

| Métrica                              | Qué cuenta                                         | Cómo se mide                                    | Por qué cambia                        |
| ------------------------------------ | -------------------------------------------------- | ----------------------------------------------- | ------------------------------------- |
| **Archivos de workflow**             | YAMLs presentes en `.github/workflows/`            | `ls .github/workflows/`                         | Añadir/borrar features, no madurez    |
| **Definiciones de job**              | Bloques bajo `jobs:` en todos los YAMLs            | `awk` sobre `jobs:` (ver Hands-on 1)            | Refactor, sharding, substages         |
| **Workflows activos (registro)**     | Los que GitHub ejecutaría si el trigger se dispara | `gh api repos/{owner}/{repo}/actions/workflows` | Toggle `disabled_manually`, no código |
| **Required status checks (ruleset)** | Los checks que **bloquean el merge**               | API del ruleset / branch protection             | Decisión de gobernanza                |

La confusión tiene consecuencias: un repo puede tener 15 archivos, 94 definiciones de job y **2 checks required**. Si
reportas "tengo 94 jobs" como prueba de madurez, estás midiendo inventario; si reportas "2 checks required" como prueba
de fragilidad, estás midiendo gobernanza. Ninguno de los dos es "madurez".

## 2. El inventario real de este repo (verificado)

> **Dato clave (verificado 2026-11-07 contra el filesystem de la rama):** `.github/workflows/` contiene **15 archivos**
> con **94 definiciones de job** en total; `ci.yml` solo tiene **57**. De esos 57, **16 llevan `if: false`** (existen,
> están documentados y no corren). El inventario de workflows **activos** es 9 (8 workflows + la config de Dependabot)
> y hay 4 `disabled_manually` — ver `docs/CONTEXT-CICD.md` §3.4/§5.9.

| Métrica                          | Valor              | Fuente de verdad                                    |
| -------------------------------- | ------------------ | --------------------------------------------------- |
| Archivos en `.github/workflows/` | 15                 | `ls .github/workflows/`                             |
| Definiciones de job (todos)      | 94                 | `awk` sobre `jobs:`                                 |
| Definiciones de job en `ci.yml`  | 57                 | ídem, acotado                                       |
| Jobs con `if: false` en `ci.yml` | 16                 | `grep -c "if: false"`                               |
| Workflows activos en el registro | 9 (8 + Dependabot) | API `actions/workflows` (§3.4, snapshot 2026-10-18) |
| `disabled_manually`              | 4                  | API `actions/workflows`                             |
| Checks required del ruleset      | 4                  | API del ruleset 21227644 (guía 22)                  |

**Lección de método**: cualquier frase del tipo "el pipeline tiene N workflows" **caduca a la semana** y casi siempre
confunde métricas. Cuando leas un número en un doc, pregúntate qué columna de la tabla de arriba está midiendo. Si el
doc no lo dice, el número no es verificable.

### 2.1 El drift de conteo: los archivos bajaron, los jobs subieron

El proyecto vivió un ciclo completo de "drift de conteo", que es el nombre técnico de _contar de memoria_:

| Momento                    | Qué pasó                                                                                    | Efecto en los números                       |
| -------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------- |
| Pre-cleanup (2026-08)      | Workflows heredados de otro layout: `quality.yml` reutilizable y `ci-enterprise.yml`        | "9 workflows" repetido en varios docs       |
| Consolidación (2026-08-28) | `quality.yml` eliminado (jobs inline `if: false` en `ci.yml`); `ci-enterprise.yml` retirado | Archivos ↓, jobs declarados en `ci.yml` ↑   |
| Hoy (2026-11-07)           | Se añadieron crons de coverage (×2), PBT y auditorías de orden                              | 15 archivos, 94 jobs, 9 activos, 4 disabled |

El detalle instructivo: **al consolidar, el número de archivos bajó y el de jobs subió**. Un observador que solo mire
"workflows" habría concluido que el pipeline se degradó, cuando en realidad se centralizó. Los `if: false` son deuda
**visible a propósito** — ver guía 24 §1.5.

## 3. Qué significa "enterprise" de verdad

`docs/ci-cd-pipeline-empresarial.md` describe el **pipeline genérico de 14 stages** (§2.3). Los 14 no son 14 jobs: son
14 _responsabilidades_ que un pipeline enterprise cubre explícitamente.

| Stage (doc empresarial §2.3) | ¿Lo tiene este repo? | Dónde                                                                    |
| ---------------------------- | -------------------- | ------------------------------------------------------------------------ |
| Source / commit              | ✅                   | Husky, commit signing, DCO, `pr-metadata.yml`                            |
| Build & unit test            | ✅                   | `ci.yml` substages 2A/2D, sharding (§testing-architecture)               |
| Static analysis              | ✅                   | `client-lint`, `server-lint`, `openspec-validate`, `docs:lint`           |
| Security (SAST/SCA/SBOM)     | ✅                   | `security.yml` + `ci.yml` substage 2C                                    |
| Artifact / packaging         | ✅ parcial           | `client-build`, `server-build`, Docker sólo en `deploy.yml` (`disabled`) |
| Integration / E2E            | ✅                   | `test-integration`, `test-smoke`, `e2e` (sharded)                        |
| Deploy staging / prod        | ⚠️ existe, apagado   | `deploy.yml` Phase 2 gated por `vars.AWS_ROLE_ARN` (0 environments)      |
| Release / versioning         | ⚠️ existe, apagado   | `release.yml` (Changesets)                                               |
| Observability / SLOs         | ❌                   | —                                                                        |
| Compliance / evidence        | ⚠️ parcial           | OpenSpec + archives + `CONTEXT-CICD.md`                                  |
| IaC scanning                 | ✅ advisory          | `checkov-iac` (ver Parte C §3)                                           |
| Supply-chain provenance      | ❌                   | Sin attestations ni cosign (ver Parte C §1)                              |
| Progressive delivery         | ❌                   | Sin canary ni flags (Parte C §4)                                         |
| Cost / performance           | ⚠️ parcial           | Coverage gate, mutation nightly, DORA informal                           |

> **Corrección al framing habitual**: la comparación "9 workflows vs 30+ jobs" es **obsoleta**. Este repo ya tiene 94
> definiciones de job y 57 en un solo workflow — más que muchos pipelines "enterprise" de 30 jobs. La brecha real no
> es _cuántos_ jobs tienes: es **qué capacidades** tienes (provenance verificable, VEX, entornos reales, despliegue
> progresivo). Ese es el marco de esta guía.

### 3.1 La escala tiene coste

Antes de "añadir stages", recuerda qué pagas por cada job nuevo (§26 del doc empresarial, "costo del pipeline"):

- **Minutos**: cada job es un runner arrancando; en un PR de un fichero de docs no quieres 57 jobs.
- **Latencia de feedback**: el camino crítico es lo que percibe quien revisa, no el total de jobs.
- **Superficie de mantenimiento**: cada `uses:` es una dependencia que se pudre (guía 21).
- **Ruido de señal**: 16 `if: false` son honestos porque están documentados; 20 jobs advisory sin gate son ruido.

---

# PARTE B — El espécimen: `ci-enterprise.yml` como referencia didáctica

## 1. Qué era

`ci-enterprise.yml` era un workflow llamado `'Fintech PR CI'` — un template de referencia de otro proyecto (con
`frontend/` + `backend/`), copiado a este monorepo. Estos son los snippets supervivientes:

```yaml
# Source (histórico, workflow retirado): ci-enterprise.yml (líneas 1-15), vía guía 02 §7.1
name: 'Fintech PR CI'

on:
  workflow_dispatch:
  workflow_call:

concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

permissions:
  contents: read
  pull-requests: write
  security-events: write

jobs:
  changes: ... # Job 1: paths-filter (frontend/backend ONLY)
  install: ... # Job 2: npm ci (needs: changes)
  lint: ... # Job 3: needs: install
  type-check: ... # Job 4: needs: install
  test: ... # Job 5: needs: install (coverage ≥ 80%)
  build: ... # Job 6: needs: test
  dependency-audit: # Job 7: needs: install (npm audit high)
  codeql: ... # Job 8: needs: install (CodeQL SAST)
```

Estructuralmente no es un mal pipeline: trigger correcto, `concurrency` por PR, permisos mínimos, DAG lineal legible.
El problema no era el diseño: era que **describía otro repo**.

## 2. Los dos snippets que revelan el fallo

El primero es el filtrado de cambios (guía 09 §6.3):

```yaml
# Source (histórico, workflow retirado): ci-enterprise.yml (job changes, líneas 27-34), vía guía 09 §6.3
with:
  filters: |
    frontend:
      - 'frontend/**'
    backend:
      - 'backend/**'
```

El segundo es el cache de npm (guía 09 §6.1):

```yaml
# Source (histórico, workflow retirado): ci-enterprise.yml (job install, líneas 43-51), vía guía 09 §6.1
- name: Setup Node
  uses: actions/setup-node@v4
  with:
    node-version-file: '.nvmrc'
    cache: 'npm'
    cache-dependency-path: |
      package-lock.json
      frontend/package-lock.json
      backend/package-lock.json
```

En este repo los lockfiles son **uno** (`package-lock.json`, hoisting de workspaces): `apps/client` y `apps/server` no
tienen lockfile propio, y `frontend/`/`backend/` no existen. Ambas cosas fallan **sin error visible**.

## 3. Los cinco anti-patrones de portabilidad

| #   | Anti-patrón                    | Síntoma observable                                                   | Cómo detectarlo                                |
| --- | ------------------------------ | -------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | **Paths fantasma**             | `cache-dependency-path` con rutas inexistentes                       | `ls` de cada path del `with:`                  |
| 2   | **Cache-miss silencioso**      | "Cache not found" en cada run; nunca hay hit                         | Logs de `setup-node`; hit rate 0%              |
| 3   | **Path filter muerto**         | `paths-filter` con patrones que nunca matchean → outputs `false`     | Outputs del job `changes` en los logs          |
| 4   | **Version drift del template** | `@v3`/`@v4` donde el resto del repo usa `@v4`/`@v5`                  | Guía 20; tabla de pins en `CONTEXT-CICD` §13.5 |
| 5   | **Trigger huérfano**           | `workflow_call` sin ningún caller; `workflow_dispatch` que nadie usa | `grep` del nombre del workflow en el repo      |

El más peligroso es el **2** combinado con el **3**: el workflow "pasa" en verde, todos sus jobs corren siempre (porque
los filtros nunca matchean y las condiciones dependen de outputs `false`), y la ausencia de cache multiplica el coste.
No hay nada rojo que te avise: es un pipeline que **da falsa sensación de cobertura**.

### 3.1 Por qué no se arregló y qué se hizo en su lugar

Se retiró (ver `docs/CONTEXT-CICD.md` §5.9). La lección de gobernanza es más útil que la de YAML: **un template
copiado sin adaptar tiene coste de mantenimiento y coste de señal**. Antes de importar un workflow "de referencia",
comprueba tres cosas: (1) los paths existen, (2) los actions pins coinciden con tu política, (3) el trigger tiene un
caller real. Si falla cualquiera, no es una referencia: es deuda.

## 4. Cómo leerlo hoy

| Quiero ver...                     | Ir a                                            |
| --------------------------------- | ----------------------------------------------- |
| Trigger, permisos y lista de jobs | Guía 02 §7.1                                    |
| Filtros muertos y cache-miss      | Guía 09 §6.1-§6.5 (con diagnóstico y ejercicio) |
| Estado del repo (retirado)        | `docs/CONTEXT-CICD.md` §5.9                     |
| Inventario vigente                | `docs/CONTEXT-CICD.md` §3.4                     |

---

# PARTE C — Los cuatro pilares enterprise que faltan

## 1. SLSA: dónde está este repo de verdad

SLSA (slsa.dev) mide **integridad de la cadena de suministro**. En SLSA v1.x los niveles de _Build_ son:

| Nivel        | Requisito                                                                                          | Qué impide                                               |
| ------------ | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **Build L1** | Existe provenance (builder, repo, digest del output)                                               | Nada; sólo da audit trail                                |
| **Build L2** | Build hosted + provenance **firmada por la plataforma**                                            | Un script comprometido no puede falsificar la provenance |
| **Build L3** | Entornos efímeros aislados, **hermetic** (sin red), provenance out-of-band, revisión de dos partes | Ni con control total del build config puedes falsificar  |

**Estado real del proyecto** (verificado 2026-11-07):

- `grep -rn "attestation|cosign|provenance|sigstore" .github/workflows/` → **0 resultados**. No hay
  `actions/attest`, ni firma de imágenes, ni verificación posterior.
- Hay SBOM CycloneDX (`anchore/sbom-action`, guía 18) y `dependency-review` en PR: eso te da **visibilidad**, no
  provenance verificable.
- Hay OIDC hacia AWS (`id-token: write`, guía 15) y commits firmados: **no** son SLSA Build. Confunden mucho porque
  los tres usan OIDC/Sigstore por debajo; SLSA Build mide **quién construyó qué artefacto**, no quién despliega.

**Posición honesta**: Build **L1** (hay SBOM y trazabilidad de runs, no hay provenance firmada). El camino a L2 es un
solo job (`actions/attest` con `id-token: write` + `attestations: write`, ver §25.2 del doc empresarial); el salto a L3
no es de YAML, es de **infraestructura**: runners aislados, builds hermetic y revisión de dos partes.

**Lo que falta para L3 en este repo, en concreto:**

1. Provenance firmada (L2 primero).
2. Build hermetic: `npm ci` con red abierta no lo es; requiere mirror/proxy controlado.
3. Aislamiento: runners efímeros con estado cero (hoy es hosted, pero el build comparte workspace con steps previos).
4. Revisión de dos partes en el camino de build: con un solo mantenedor **es estructuralmente imposible** — y eso es
   un dato de organización, no de CI.

## 2. VEX: el SBOM sin contexto produce ruido

Un SBOM dice **qué componentes** tienes. VEX (Vulnerability Exploitability eXchange) dice **si esas vulnerabilidades te
afectan**. Los cuatro statuses estándar (OpenVEX / CISA):

| Status                | Significa                                                        | Ejemplo en este repo                                        |
| --------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| `not_affected`        | El componente está presente pero la vulnerabilidad no se alcanza | CVE en una ruta de `devDependency` que no llega al bundle   |
| `affected`            | Sí te afecta; requiere acción                                    | CVE en una dependencia de runtime usada en producción       |
| `fixed`               | La versión desplegada ya lo resuelve                             | Bump aplicado por Dependabot; el SBOM aún lista la anterior |
| `under_investigation` | Aún sin juicio; el reloj corre                                   | CVE publicado hoy en una dep transitiva                     |

**Por qué importa aquí**: `security.yml` corre Trivy con `ignore-unfixed: true` y severidad `CRITICAL/HIGH`
(`exit-code: '1'`). Ese `ignore-unfixed` es una **política implícita** de "no me hables de lo que no puedo arreglar" —
una aproximación pobre a VEX: se expresa en flags del scanner, no en un documento que un auditor pueda leer, y no
distingue _no hay fix_ de _no me afecta_. Resultado típico: o el gate es ruidoso y se acaba poniendo advisory, o es
ciego. VEX es la tercera vía.

**Qué haría falta** (no implementado): un `openvex.json` versionado, `trivy --vex` en el scan, y referencia al VEX
desde el SBOM. Coste bajo, beneficio alto — pero requiere **juicio** caso a caso, que es precisamente lo que nadie
quiere hacer en un repo de un solo mantenedor. Ese es el motivo real de que casi nadie tenga VEX.

## 3. Escaneo de IaC: existe, y es advisory

El currículum antiguo decía que el job `iac-security` estaba "comentado en `security.yml`". **Eso ya no es cierto**
(verificado 2026-11-07): el escaneo de IaC vive en `ci.yml` como job **`checkov-iac`**:

```yaml
# Source: ../../../.github/workflows/ci.yml (job checkov-iac, líneas 1735-1763)
checkov-iac:
  name: 'Security: Checkov IaC (advisory, FASE 1)'
  needs: repo-discovery
  continue-on-error: true
  steps:
    - name: Run Checkov IaC scan (soft fail, SARIF)
      id: checkov-sarif
      uses: bridgecrewio/checkov-action@v12
      with:
        directory: .
        framework: dockerfile terraform kubernetes
        config_file: .checkov.yml
        output_format: sarif
        output_file_path: checkov-report.sarif
        soft_fail: true
```

Estado: **advisory** (`soft_fail: true` + `continue-on-error: true`, hallazgos con exit 0), SARIF como artifact en PR
(14 días) y upload a Code Scanning sólo en el run semanal (categoría `checkov-iac`). El gap real no es "no hay IaC
scanning": es que **no hay gate** — un Dockerfile inseguro no bloquea el merge. El `ci.yml` documenta la FASE 2 en un
comentario sobre el job (baseline `.checkov.baseline` para fail-on-new, quitar `soft_fail` tras 2-4 semanas de runs
limpios); ese baseline **todavía no existe** en el repo, sólo `.checkov.yml`, así que la FASE 2 está planificada y no
implementada.

Y hay un matiz de alcance: el repo tiene **un** Dockerfile (`apps/server/`) y **cero** manifiestos de Terraform o
Kubernetes. Los frameworks `terraform kubernetes` de checkov están escaneando un conjunto vacío: es capacidad latente,
no cobertura real. Cuando se añada IaC de verdad, el job ya está cableado — eso es _future-proofing_ barato y bien
hecho.

## 4. Future-proofing: qué merece la pena y qué no

"Future-proofing" suena a comprar opciones. En CI/CD cada opción tiene coste de mantenimiento inmediato. Criterio:
**sólo añadas lo que desbloquee un escenario con fecha**, no un escenario imaginable.

| Capacidad                  | Qué resuelve                                       | Coste hoy en este repo                                                     | Veredicto                                       |
| -------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------- | ----------------------------------------------- |
| **Kubernetes / EKS**       | Portabilidad y autoscaling de workloads            | `deploy.yml` Phase 2 ya apunta a **ECS Fargate**; 0 environments definidos | ❌ No. Duplicaría el CD sin dueño               |
| **Canary / blue-green**    | Reducir blast radius de un deploy                  | Requiere tráfico real y métricas de error por versión                      | ⏸️ Bloqueado: no hay prod desplegado            |
| **Feature flags**          | Desacoplar deploy de release                       | Añade dependencia de runtime + proveedor                                   | ⏸️ Sólo si hay releases continuos reales        |
| **OpenTelemetry**          | Trazas/métricas correlacionadas entre CI y runtime | Instrumentación de app + backend de telemetría                             | ✅ Sí, primero: sin señal no hay canary ni SLOs |
| **Attestations (SLSA L2)** | Verificabilidad del artefacto                      | ~1 job y 2 permisos                                                        | ✅ Sí: mejor ratio coste/beneficio del nivel    |
| **VEX**                    | Bajar ruido de vulnerabilidades                    | 1 documento + 1 flag                                                       | ✅ Sí, después de attestations                  |

La trampa del "pipeline enterprise" es implementar la columna izquierda entera (K8s + canary + flags) en un repo que no
tiene ni un entorno de producción desplegado. Eso no es madurez: es decorado. El doc empresarial lo dice sin rodeos en
§27 (_"Progressive Delivery y Costo de Retraso"_): la capacidad **se paga** antes de que exista el problema.

---

# PARTE D — Hands-on

## 1. Medir la escala sin autoengañarte

```bash
# 1. Archivos (métrica "inventario")
ls .github/workflows/ | wc -l

# 2. Definiciones de job por archivo (métrica "trabajo declarado")
for f in .github/workflows/*.yml; do
  n=$(awk '/^jobs:/{f=1;next} f&&/^  [a-zA-Z0-9_-]+:$/{c++} END{print c+0}' "$f")
  echo "$n  $(basename "$f")"
done | sort -rn

# 3. Jobs que no corren
grep -c "if: false" .github/workflows/ci.yml
```

**Respuesta esperada (2026-11-07)**: 15 archivos; `ci.yml` con 57 jobs; total 94; 16 `if: false`. Compáralo con el
número que diga cualquier doc y decide cuál de las cuatro métricas está usando.

## 2. Detectar paths fantasma en cualquier workflow

```bash
# Extrae los cache-dependency-path y comprueba si existen
grep -rn -A 3 "cache-dependency-path" .github/workflows/ | grep -oE "[a-zA-Z0-9_./-]+\.json" | sort -u |
  while read -r p; do [ -e "$p" ] && echo "OK      $p" || echo "FALTA   $p"; done
```

**Respuesta esperada**: todas `OK`. Cualquier `FALTA` es cache-miss garantizado (Parte B §3, anti-patrón 1 y 2).

## 3. Medir el drift de pins

```bash
grep -rhoE "actions/setup-node@v[0-9]+" .github/workflows/ | sort | uniq -c
grep -rhoE "dorny/paths-filter@v[0-9]+" .github/workflows/ | sort | uniq -c
```

**Respuesta esperada**: `setup-node` en dos versiones (`v4` sólo en `ci.yml`, `v5` en el resto → drift vigente);
`paths-filter` en **una** sola versión (`v4`) porque el `@v3` vivía en el workflow retirado. La comparación de estos dos
resultados es la lección: **retirar un workflow puede eliminar drift** sin tocar un solo `uses:`.

## 4. Auditar el nivel SLSA en dos comandos

```bash
grep -rn "attest\|cosign\|provenance\|sigstore" .github/workflows/ || echo "sin provenance firmada"
grep -rn "sbom-action\|cyclonedx" .github/workflows/ | head -3
```

**Respuesta esperada**: sin provenance firmada; SBOM presente. Conclusión razonada: **Build L1**, camino a L2 abierto.

## 5. Diseñar el siguiente incremento (ejercicio de juicio)

Elige **tres** items de la Parte C §4 y justifica cada uno con: (a) qué riesgo o escenario concreto desbloquea, (b)
coste estimado en horas, (c) qué se rompe si sale mal, (d) cómo se revierte. Criterio de aceptación: ningún item puede
tener como justificación "porque un pipeline enterprise lo tiene".

---

## ❓ FAQ

**¿"Enterprise" es sinónimo de más jobs?**
No. Es sinónimo de **capacidades verificables**: provenance firmada, gates que bloquean de verdad, entornos reales y
observabilidad. 94 definiciones de job sin attestations es menos enterprise que 12 con ellas.

**¿Merece la pena añadir `actions/attest` si no despliego nada?**
Sí, con matiz: te da L2 en minutos y te obliga a tener un artefacto identificable (SBOM o binario). El coste es casi
cero; el beneficio aparece el día que alguien pregunta "¿este binario salió de `main`?".

**¿Por qué no hay VEX en ningún repo que conozco?**
Porque el status `not_affected` requiere **juicio por CVE** y nadie lo prioriza. La salida habitual es `ignore-unfixed`
o `continue-on-error`: exactamente el estado de este repo.

**¿El escaneo de IaC cuenta si no hay IaC?**
No. `checkov-iac` escanea `dockerfile terraform kubernetes`; con cero manifiestos, dos tercios del alcance son vacío.
Es capacidad latente bien cableada, no cobertura.

**¿Puedo llegar a SLSA L3 en solitario?**
No en la práctica: L3 exige revisión de dos partes en el camino de build. Es un requisito **organizativo**, y por eso
SLSA se usa a menudo como argumento de staffing.

## 📖 Glosario

| Término              | Definición                                                                                         |
| -------------------- | -------------------------------------------------------------------------------------------------- |
| **SLSA**             | Supply-chain Levels for Software Artifacts; framework de integridad de la cadena de suministro     |
| **Provenance**       | Documento que registra quién construyó qué artefacto, desde qué commit y con qué builder           |
| **Hermetic build**   | Build sin acceso a red y sin estado compartido; requisito de SLSA Build L3                         |
| **Attestation**      | Declaración firmada sobre un artefacto (`actions/attest`), verificable con `gh attestation verify` |
| **SBOM**             | Software Bill of Materials; inventario de componentes (CycloneDX/SPDX)                             |
| **VEX**              | Vulnerability Exploitability eXchange; declara si una vulnerabilidad te afecta                     |
| **`soft_fail`**      | En checkov, reportar sin fallar el job (advisory); lo contrario de un gate                         |
| **`ignore-unfixed`** | Flag de Trivy que silencia CVEs sin fix disponible; política implícita, no VEX                     |
| **Future-proofing**  | Añadir capacidad antes de necesitarla; en CI/CD suele ser deuda disfrazada de previsión            |
| **Zombie workflow**  | Workflow que existe, tiene YAML válido y nunca corre (toggle off o filters muertos)                |

## ✅ Checklist de autoevaluación

- [ ] Sé nombrar las **cuatro** métricas de escala y decir cuál usa cada doc del repo.
- [ ] Puedo obtener "15 archivos / 94 jobs / 16 `if: false`" con tres comandos.
- [ ] Explico por qué la comparación "9 vs 30+ jobs" está obsoleta.
- [ ] Enumero los cinco anti-patrones de portabilidad y el síntoma observable de cada uno.
- [ ] Digo sin dudar en qué nivel SLSA está el proyecto y **por qué** OIDC a AWS no cuenta.
- [ ] Explico los cuatro statuses de VEX y el papel de `ignore-unfixed` como sustituto pobre.
- [ ] Distingo "hay escaneo de IaC" de "hay gate de IaC" en `checkov-iac`.
- [ ] Justifico por qué Kubernetes y canary **no** son la siguiente prioridad de este repo.

## 🧭 Navegación

| Dirección        | Guía                                                        |
| ---------------- | ----------------------------------------------------------- |
| Anterior         | [22 — Rulesets](./22-rulesets-guide.md)                     |
| Siguiente        | [24 — Infraestructura del DAG](./24-dag-infraestructura.md) |
| Índice del nivel | [Profesional](./profesional-README.md)                      |

**Referencias del repo**: [`docs/ci-cd-pipeline-empresarial.md`](../../ci-cd-pipeline-empresarial.md) (§2.3 los 14
stages, §25 supply chain, §26 DORA y coste, §27 progressive delivery), [`docs/CONTEXT-CICD.md`](../../CONTEXT-CICD.md)
(inventario §3.4/§5.9, pins §13.5), guías [02 §7.1](./02-github-actions-base.md) y [09 §6](./09-caching-y-performance.md).

## 📚 Fuentes

| Tema                | URL                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------ | --- | ------- | ----------------------- |
| SLSA spec v1.2      | https://slsa.dev/spec/v1.2/                                                                |
| SLSA levels         | https://slsa.dev/spec/v1.2/levels                                                          |
| GitHub Attestations | https://docs.github.com/en/actions/security-for-github-actions/using-artifact-attestations |
| `actions/attest`    | https://github.com/actions/attest                                                          |
| OpenVEX             | https://github.com/openvex/spec                                                            |     | Checkov | https://www.checkov.io/ |
| OpenTelemetry       | https://opentelemetry.io/docs/                                                             |
