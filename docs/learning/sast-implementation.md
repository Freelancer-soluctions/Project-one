# SAST (Static Application Security Testing) — Implementación Enterprise

## 1. Contexto y estado actual

El proyecto `project-one` implementa SAST en múltiples capas con diverso grado de efectividad:

### Capas SAST existentes (verificado código)

| Capa            | Herramienta                     | Workflow / Hook                             | Estado actual                            | Bloquea merge? | Notas                                                                    |
| --------------- | ------------------------------- | ------------------------------------------- | ---------------------------------------- | -------------- | ------------------------------------------------------------------------ |
| **L1 local**    | Semgrep + Gitleaks              | `.husky/pre-commit`                         | **Activo**                               | Sí             | `npm run sast:semgrep` + `npm run security:secrets` bloquean commit      |
| **L3 CI diff**  | Semgrep (OWASP Top 10 + custom) | `.github/workflows/ci.yml` job `sast`       | **Advisory** (`continue-on-error: true`) | No             | No en `ci-complete.needs`; solo reporting en PR                          |
| **L3 CI diff**  | Gitleaks (secret scanning)      | `.github/workflows/ci.yml` job `secrets`    | **Blocking** (técnicamente)              | Sí             | Paso OSS sin `continue-on-error`; wireado a `prebuild-security-complete` |
| **L3 CI SCA**   | Trivy + Dependency Review       | `.github/workflows/security.yml`            | **Deshabilitado** (`disabled_manually`)  | No             | Trivy filesystem scan; `dependency-review` activo en ci.yml              |
| **L3 CI full**  | CodeQL                          | `.github/workflows/security.yml` job `sast` | **Deshabilitado** (`disabled_manually`)  | No             | CodeQL init@v4 + analyze (javascript, actions)                           |
| **Full weekly** | Gitleaks (full-history)         | `.github/workflows/scheduled-security.yml`  | **Deshabilitado** (`disabled_manually`)  | No             | JSON/SARIF artifacts + `notify-failure` por `steps.*.outcome`            |
| **Full weekly** | CodeQL + Trivy + SBOM           | `.github/workflows/security.yml`            | **Deshabilitado** (`disabled_manually`)  | No             | Jobs `sast` (CodeQL), `dependency-scan` (Trivy), `sbom` (SBOM)           |

**Gap crítico**: Los workflows `security.yml` y `scheduled-security.yml` están `disabled_manually` → hoy NO se ejecuta SAST full-history ni análisis CodeQL profundo. La protección real depende de L1 local (pre-commit) + Semgrep diff en `ci.yml` (advisory).

### Estado de herramientas (verificado 2026-09-25)

- **Semgrep**: v1.176.1 en `ci.yml`; reglas custom en `.semgrep/rules/` (Prisma SSRF, prototype pollution, unsafe deserialization, etc.)
- **Gitleaks**: Pin `v8.22.1` (8 releases atrasado vs latest `v8.30.1`); proyecto en modo _feature complete_ (solo security patches); autor migrando a Betterleaks
- **CodeQL**: Acción `@v4` disponible; requiere `security-events: write`
- **Trivy**: Acción `@0.36.0` para escaneo filesystem
- **Dependency Review**: Acción `@v5` con `fail-on-severity: moderate`

## 2. Arquitectura SAST de 3 capas (enterprise)

### Capa L1: Pre-commit staged (CON diff)

- **Objetivo**: Feedback inmediato <2s para desarrolladores; bloquea commit local
- **Herramientas**:
  - Semgrep en modo _staged-only_ (archivos en índice git, no working tree)
  - Gitleaks en modo `git --pre-commit --staged` (solo staged)
  - _(Opcional)_ ESLint security plugins (`eslint-plugin-security`)
- **Configuración crítica**:
  - `--severity ERROR --error` (Semgrep): exit 1 si hay findings de severidad ERROR o superior
  - Sin `continue-on-error`: fallo inmediato bloquea hook
  - Allowlist local: `.semgrepignore`, comentarios `nosemgrep`, `.gitleaksignore`
- **Ventajas**:
  - Velocidad: solo staged → escaneo rápido (<1s para proyectos medianos)
  - Calidad: evita que findings entren al historial git
  - UX: error claro en commit, no en CI
- **Limitaciones**:
  - No ve archivos untracked (`.env local`, `*.pem sin commit`)
  - No ve historial completo (solo staged)
  - Requiere configuración por desarrollador (hook instalado)

### Capa L2: CI Pull Request (diff-scoped)

- **Objetivo**: Gate de PR que bloquea regresiones; feedback <2 min
- **Herramientas**:
  - Semgrep con `--baseline-commit=<base.sha>` (diff-scoped)
  - Gitleaks con `git --log-opts="base..head"` (diff PR)
  - Dependency Review con `fail-on-severity: moderate`
  - _(Opcional)_ CodeQL en PR (más lento pero cobertura profunda)
- **Configuración crítica**:
  - Semgrep: `--severity ERROR --error --metrics off` (exit 1 solo en findings ERROR+)
  - Gitleaks: paso OSS sin `continue-on-error` (blocking por defecto)
  - Dependency Review: `vulnerability-check: true`, `license-check: true`
  - Permisos: `contents: read`, `security-events: read` (para upload SARIF opcional)
- **Ventajas**:
  - Enfoque: solo cambios nuevos (no deuda histórica)
  - Velocidad: diff-scoped → escaneo rápido (60-90s para monorepo medio)
  - Bloqueo efectivo: impide merge de regresiones
  - Integración: upload SARIF a GitHub Code Scanning para visibilidad
- **Consideraciones de implementación**:
  - **No usar `continue-on-error: true`** si se quiere bloqueo real
  - Alternativa: mantener `continue-on-error: true` + step en agregador que evalúe `needs.<job>.result == 'failure'` y emita warning/SARIF
  - **Umbral de severidad**: configurar en GitHub ruleset `Required code scanning results` → umbral `High or higher` (equivalente a Semgrep `--severity ERROR`)

### Capa L3: Full-history / Weekly (audit)

- **Objetivo**: Detectar deuda histórica; generar issues de remediación; cumplimiento
- **Herramientas**:
  - Semgrep full scan (sin baseline)
  - Gitleaks full history (`git --log-opts="--all"`)
  - CodeQL completo en push a main + schedule semanal
  - Trivy filesystem + SBOM generation
  - Dependency Review full-history (si se requiere)
- **Configuración crítica**:
  - `continue-on-error: true` (modo audit): job nunca falla por findings
  - Artifact retention: JSON (30 días), SARIF (90 días), SBOM (365 días)
  - `notify-failure` basado en `steps.<id>.outcome == 'failure'` (no job-level failure)
  - Permisos ampliados: `security-events: write` (para upload SARIF)
- **Ventajas**:
  - Cobertura: 100% del código (incluye historial, untracked, dependencias)
  - Cumplimiento: evidencia para auditorías (SOC 2, ISO 27001)
  - Remediación: issues creados automáticamente para hallazgos confirmados
  - Tendencia: evolución de deuda técnica a lo largo del tiempo
- **Consideraciones de implementación**:
  - **Nunca bloquear releases**: deuda histórica requiere plan de remediación, no bloqueo inmediato
  - **Separar preocupaciones**: jobs de scan (con `continue-on-error: true`) + jobs de notificación (basados en `outcome`)
  - **Retención configurable**: ajustar según políticas de retención de la organización

## 3. Buenas prácticas para SAST efectivo

### 3.1 Gestión de falsos positivos (FP)

| Técnica                   | Herramientas                                                                   | Descripción                                                                |
| ------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| **Baseline**              | Semgrep `--baseline-commit`, Gitleaks `.gitleaksignore`, CodeQL SARIF baseline | Ignora findings existentes; solo reporta regresiones/new                   |
| **Allowlist por archivo** | `.semgrepignore`, `.gitleaksignore`, `nosemgrep`/`nosecrets` inline            | Excluye paths específicos o líneas marcadas                                |
| **Allowlist por regla**   | `--exclude-rule`, `targetRules` en allowlist global                            | Desactiva reglas específicas en ciertos archivos                           |
| **Severity thresholds**   | `--severity ERROR`, umbral en ruleset                                          | Solo considera findings de severidad alta+ (ERROR, High, Critical)         |
| **Pre-filter (keywords)** | `keywords` en reglas Gitleaks/Semgrep                                          | Prefiltro barato antes de regex (gran mejora de performance)               |
| **Entropy/secretGroup**   | Gitleaks `entropy` y `secretGroup`                                             | Reduce FPs en secrets genéricos mediante análisis de entropía              |
| **Path regex**            | `path` en reglas Semgrep/Gitleaks                                              | Limita regla a ciertos paths (ej. solo `src/` o solo `tests/`)             |
| **Stopwords**             | Allowlist `stopwords`                                                          | Ignora findings si contienen ciertas palabras (ej. "test", "example")      |
| **Validity checks**       | GitHub Secret Scanning validity                                                | Verifica si el secreto es válido antes de alertar (reduce FPs enormemente) |

### 3.2 Performance y escalabilidad

- **Semgrep**:
  - `-j/--jobs`: establecer a `0.85 x núcleos lógicos` (evita sobre-suscripción por GC)
  - `--timeout`: 5s por finding (ajustable)
  - `--max-target-bytes`: límite por archivo (evita爆炸 en archivos gigantes)
  - `--exclude`: patrones gitignore (`node_modules`, `dist`, `cobertura`, `*.min.js`)
  - Caché de imagen Docker: usar siempre la misma tag (`semgrep/semgrep:1.176.1`)
- **CodeQL**:
  - Matriz por lenguaje: paralelizar análisis por lenguaje (javascript, typescript, python, etc.)
  - `build-mode: none` para lenguajes interpretados (JS/TS) → evita pasos innecesarios de autobuild
  - `timeout-minutes`: 15-30 según complejidad del código
  - Evitar `autobuild` en monorepos complejos (preferir `manual` o `none`)
- **Sharding**:
  - Solo considerar si tiempo de scan > 10 minutos
  - Usar `matrix` en GitHub Actions para dividir por lenguaje o por módulo
  - Agregar job `coverage-merge-gate` si se usa sharding de tests (ver quality-gates.md)

### 3.3 Integración con GitHub ecosystem

- **Upload SARIF**:
  - Usar `github/codeql-action/upload-sarif@v4` (o versión latest)
  - `category`: único por herramienta y lenguaje (ej. `semgrep`, `codeql-js`, `trivy-scan`)
  - `sarif_file`: path al archivo SARIF generado
  - Permisos requeridos: `security-events: write` (y `contents: read` en repos privados)
- **Code Scanning alerts**:
  - Subida SARIF automáticamente crea alertas en pestaña Security → Code scanning alerts
  - Duplicados evitados por `partialFingerprints` en SARIF
  - Mismo categoría en mismo run → workflow falla (evitar subidas duplicadas)
- **Merge protection por severidad**:
  - Ir a Settings → Branches → Protection rules → Require code scanning results
  - Seleccionar tools: `Semgrep`, `CodeQL`, `Trivy`, etc.
  - Umbral de alerta: `Errors` (semgrep `--severity ERROR`) o `High or higher` (equivalente)
  - Aplica a ramas protegidas (main, develop, release/\*)
- **Dependabot + Scanner**:
  - Dependency Review para vulns en PR
  - Dependabot alerts para vulnerabilidades en dependencias (habilitar en Security → Alerts)
  - Ambas compatibles: Dependency Review bloquea PR por vulns nuevas; Dependabot avisa de deuda

### 3.4 Shifting left efectivo

1. **Primer línea de defensa**: L1 pre-commit blocking (Semgrep staged + Gitleaks staged)
   - Configura `.husky/pre-commit` para ejecutar ambos en paralelo
   - Cualquier exit != 0 bloquea commit
   - Incluir en documentación de onboarding: "Nunca hacer commit sin pasar pre-commit"

2. **Segunda línea de defensa**: L2 CI diff PR blocking (Sempreg diff-scoped + Gitleaks diff)
   - Convertir jobs advisory a blocking vía:
     - Opción A: Quitar `continue-on-error: true` + hacer job required en `ci-complete.needs`
     - Opción B: Mantener `continue-on-error: true` + configurar ruleset `Required code scanning results` con umbral de severidad
   - Recomendación: Opción B (menos acoplamiento, más flexible)
   - Validar con PR de prueba que introduce un finding real

3. **Tercera línea de defensa**: L3 full-history weekly (audit + remediation)
   - Rehabilitar workflows `security.yml` y `scheduled-security.yml`
   - Configurar `notify-failure` para crear issues en GitHub
   - Establecer proceso de triaje semanal (security champions + due dates)
   - Integrar con proyecto de deuda técnica (epics en Trello/Jira)

## 4. Recomendaciones específicas para project-one

### 4.1 Acciones inmediatas (sprint actual)

> **ACTUALIZADO (change `sast-weekly-scan`, 2026-09-25):** los items 1 y 3 están IMPLEMENTADOS; el item 2 (advisory → blocking) sigue siendo scope de `sast-governance-gate` F2 — ver §6.2 para el estado real.

1. **Rehabilitar workflows SAST deshabilitados** — ✅ HECHO ANTES (change `secret-scanning`, 2026-09-25):

   ```yaml
   # En .github/workflows/security.yml y scheduled-security.yml
   # Cambiar de `disabled_manually` a estado normal
   gh workflow enable .github/workflows/security.yml
   gh workflow enable .github/workflows/scheduled-security.yml
   ```

   Verificado por API (change `sast-weekly-scan`, task 1.1/1.2): ambos `state: active` — no se ejecutó `gh workflow enable` de nuevo.

2. **Convertir Semgrep CI de advisory a blocking**:
   - En `.github/workflows/ci.yml` job `sast`:
     - Quitar `continue-on-error: true`
     - Añadir a `ci-complete.needs` (junto a `prebuild-security-complete`, etc.)
     - O alternativa: mantener `continue-on-error: true` + configurar ruleset
   - Verificar que `ci-complete` falla si Semgrep encuentra findings ERROR+

3. **Añadir upload SARIF a Semgrep en ci.yml** — ✅ IMPLEMENTADO en `security.yml` (L3, no en ci.yml/L2): el change `sast-weekly-scan` añadió el job `semgrep-full-scan` semanal con `--sarif-output semgrep.sarif` + `upload-sarif@v4 category: semgrep` (la subida en el job L2 diff-scoped de `ci.yml` sigue pendiente, scope de `sast-governance-gate` F2):

   ```yaml
   - name: Semgrep scan
     id: semgrep-scan
     run: |
       semgrep scan --baseline-commit ${{ github.event.pull_request.base.sha }} \
         --config .semgrep/rules \
         --config p/owasp-top-ten \
         --config p/security-audit \
         --config p/secrets \
         --config p/nodejs \
         --config p/expressjs \
         --config p/react \
         --config p/xss \
         --severity ERROR \
         --error \
         --metrics off \
         --sarif-output semgrep.sarif
   - name: Upload Semgrep SARIF
     if: always()
     uses: github/codeql-action/upload-sarif@v4
     with:
       sarif_file: semgrep.sarif
       category: semgrep
   ```

4. **Actualizar `.gitleaks.toml` y actualizar pin**:
   - Bump Docker `zricethezav/gitleaks:v8.22.1` → `v8.30.1` en `ci.yml`
   - Aplicar los 7 fixes documentados en `docs/learning/secret-scanning.md` §4.2
   - Verificar con `gitleaks git --config .gitleaks.toml --redact --no-banner`

### 4.2 Medio plazo (sprints 2-3)

1. **Establecer baseline y estrategia de fail-on-new**:
   - Ejecutar scan full en rama `main` para crear baseline inicial
   - Configurar jobs para usar `--baseline-commit` con hash de `main` (o branch protection)
   - Monitorear findings nuevos únicamente (regresiones)

2. **Ampliar cobertura de reglas**:
   - Integrar `p/javascript` y `p/typescript` de Semgrep si benefician
   - Revisar reglas custom existentes contra OWASP Top 10 2021/2024
   - Añadir reglas para frameworks específicos (NestJS, Next.js si aplican)
   - Considerar packs de la comunidad (`p/dockerfile`, `p/kubernetes`, `p/terraform`)

3. **Configurar merge protection por severidad**:
   - En ruleset de rama `main`:
     - Activar `Require code scanning results`
     - Seleccionar tools: `semgrep`, `codeql`, `trivy`, `dependency-review`
     - Umbral: `High or higher` (equivalente a Semgrep `--severity ERROR`)
   - Validar que PR con finding High+ es bloqueado; PR con solo Info/Warn pasa

4. **Mejorar notebooks de remediación**:
   - Vincular alerts de Code Scanning a issues de GitHub automáticamente
   - Usar GitHub Actions para asignar issues a security champions
   - Integrar con proyecto de deuda técnica (estimación de esfuerzo, priorización)

### 4.3 Largo plazo (sprint 4+)

1. **Evaluar sustitución de Gitleaks**:
   - Dado estado _feature complete_ de Gitleaks, investigar:
     - Betterleaks (sucesor oficial del autor)
     - TruffleHog (alternativa popular con detección de alta entropía)
     - GitHub Secret Scanning nativo (gratis en públicos, costo en privados)
   - Mantener compatibilidad con `.gitleaksignore` si se cambia herramienta

2. **Implementar fuzzing y análisis dinámico ligero**:
   - Añadir paso de AFL/libFuzzer en CI para componentes críticos (parsers, serializadores)
   - Considerar paso rápido de OWASP ZAP en PRs (modo daemonset para spares)
   - Enfocar en endpoints públicos y parsers de entrada

3. **Integración con SDLC y gobernanza**:
   - Crear dashboard de tendencias (findings por semana, MTTR de security issues)
   - Reportar en revisiones de arquitectura (decisiones de diseño que afectan security)
   - Vincular a definición de "Definition of Done" (DoD) para user stories

## 5. Referencias oficiales verificadas (2026-09-25)

### 5.1 Semgrep

- CLI reference: https://docs.semgrep.dev/cli-reference.md
- Blocking and errors in CI: https://docs.semgrep.dev/semgrep-ci/configuring-blocking-and-errors-in-ci.md
- Findings in CI: https://docs.semgrep.dev/semgrep-ci/findings-ci.md
- Upload CI findings to GitHub: https://docs.semgrep.dev/kb/semgrep-ci/upload-ci-findings-to-github.md
- Sample CI configs: https://docs.semgrep.dev/semgrep-ci/sample-ci-configs
- Trigger diff scans env var: https://docs.semgrep.dev/kb/semgrep-ci/trigger-diff-scans-env-var

### 5.2 GitHub Code Scanning

- Upload SARIF file: https://docs.github.com/en/code-security/code-scanning/integrating-with-code-scanning/uploading-a-sarif-file-to-github
- Customizing advanced setup: https://docs.github.com/en/code-security/code-scanning/creating-an-advanced-setup-for-code-scanning/customizing-your-advanced-setup-for-code-scanning
- Set merge protection: https://docs.github.com/en/code-security/how-tos/find-and-fix-code-vulnerabilities/manage-your-configuration/set-merge-protection
- About code scanning alerts: https://docs.github.com/en/code-security/code-scanning/about-code-scanning-alerts

### 5.3 CodeQL

- CodeQL action README: https://raw.githubusercontent.com/github/codeql-action/main/README.md
- About CodeQL: https://codeql.github.com/
- Query help: https://codeql.github.com/docs/codeql-overview/query-help/
- Standard libraries: https://codeql.github.com/docs/codeql-overview/standard-libraries/

### 5.4 Gitleaks

- Official repository: https://github.com/gitleaks/gitleaks
- Config reference: https://github.com/gitleaks/gletees/blob/master/config/gitleaks.toml
- Deprecation notice: https://github.com/gitleaks/gitleaks#readme (feature complete notice)
- Action: https://github.com/gitleaks/gitleaks-action
- NOTE: El sitio gitleaks.com no resolvió (transport error); github.com es la fuente canónica

### 5.5 GitHub Actions & Security

- Workflow syntax: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- Contexts: https://docs.github.com/en/actions/learn-github-actions/contexts
- Encrypted secrets: https://docs.github.com/en/actions/security-for-github-actions/security-guides/using-encrypted-secrets-in-github-actions
- Permissions: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#permissions

### 5.6 OWASP & CWE

- OWASP Top 10 2021: https://owasp.org/www-project-top-ten/
- OWASP Top 10 2024: https://owasp.org/Top10/
- CWE Top 25: https://cwe.mitre.org/top25/archive/2023/2023_cwe_top25.html
- CWE-SANS Top 25: https://cwe.mitre.org/top25/archive/2023/2023_cwe_sans_top25.html

## 6. Notas de implementación en project-one

### 6.1 Lo que ya existe y funciona

- **L1 pre-commit**: `.husky/pre-commit` ejecuta `npm run sast:semgrep` y `npm run security:secrets` en paralelo; bloquea commit en exit != 0
- **Semgrep L3 diff**: Job `sast` en `ci.yml` corre scan diff-scoped con múltiples configs (OWASP Top 10, Node.js, Express, React, etc.) y reglas custom
- **Gitleaks L3 diff**: En `ci.yml` agregado recientemente (substage 2C) con wireado a `prebuild-security-complete.needs` (blocking técnicamente)
- **Reglas custom**: En `.semgrep/rules/` con tests fixtures en `.semgrep/rules/tests/` (excluidos de eslint via `eslint.config.js`)
- **Dependency Review**: Bloqueante por defecto en ci.yml (fail-on-severity: moderate, vuln + license check)
- **SARIF upload**: Ya existe para Trivy y CodeQL en `security.yml` (cuando esté habilitado)

### 6.2 Lo que falta o requiere ajuste

> **ACTUALIZADO (change `sast-weekly-scan`, 2026-09-25):** items 2 y 3 RESUELTOS; item 7 RESUELTO. Estado item a item:

1. **Semgrep L3 CI advisory → blocking**: El job `sast` tiene `continue-on-error: true` → no bloquea merge aunque encuentre findings — **Sigue pendiente: scope de `sast-governance-gate` F2** (Non-Goal explícito de `sast-weekly-scan`).
2. **Workflows deshabilitados**: ~~`security.yml` y `scheduled-security.yml` están `disabled_manually`~~ → **RESUELTO**: rehabilitados por `secret-scanning` (2026-09-25, verificado `state: active` por API). `security.yml` además tiene triggers `schedule` (cron `0 3 * * 1`) + `workflow_dispatch` + `merge_group` (D2).
3. **Upload SARIF Semgrep**: ~~Falta paso de subida~~ → **RESUELTO**: job `semgrep-full-scan` en `security.yml` sube `semgrep.sarif` con `upload-sarif@v4 category: semgrep`; CodeQL sube vía `analyze@v4 category: codeql` (sin upload separado); categorías únicas verificadas (`codeql`/`semgrep`/`trivy`/`gitleaks`).
4. **Umbral de severidad en ruleset**: Falta configurar `Required code scanning results` en rama `main` con umbral de High or higher — pendiente (aplica a L2, no al schedule advisory).
5. **Baseline gestionada**: No hay proceso para crear y mantener baseline de branch protection (main/release/\*) — pendiente (§4.2 medio plazo).
6. **Doble definición CodeQL**: Existe job `sast` en `security.yml` (v4) y otro desalineado en `ci-enterprise.yml` (v3 + autobuild) — pendiente de consolidación (follow-up documentado en el design del change).
7. **Falta merge_group**: ~~Los scans SAST no incluyen trigger `merge_group`~~ → **RESUELTO**: añadido a `security.yml` y `scheduled-security.yml` (task 2.1/2.2).

#### Triaje semanal (security champions) — proceso del change `sast-weekly-scan`

1. **Lunes 03:00 UTC**: cron dispara `scheduled-security.yml` (Gitleaks full) y `security.yml` (CodeQL + Semgrep full + Trivy + SBOM) sobre `main`.
2. **Evidencia**: SARIF → Security → Code scanning alerts (categorías `codeql`/`semgrep`/`trivy`/`gitleaks`); artifacts JSON 30d / SARIF 90d / SBOM 365d.
3. **Issue de auditoría**: si algún scan step falló (`steps.*.outcome == 'failure'` exportado como job output), `notify-failure` crea UN issue por workflow con marcador `[weekly-security-scan]` en el título; runs siguientes comentan en el issue abierto existente (dedupe, decisión del open question del design). Runs de `pull_request` no crean issues.
4. **Sesión de triaje**: los security champions revisan alerts + artifacts en la sesión semanal, priorizan por severidad/CVSS, asignan due dates (§3.4.3) y cierran falsos positivos con `.semgrepignore`/NAF (not-accessible) inline.
5. **Métrica**: el issue de auditoría queda como evidencia SOC 2 / ISO 27001 (capa L3 "nunca bloquear"); el estado de remediación se revisa el lunes siguiente.

### 6.3 Próximos pasos sugeridos (para @planner/@developer)

1. ~~**[Tarea inmediata]** Rehabilitar `security.yml` y `scheduled-security.yml` (`gh workflow enable`)~~ — HECHO (change `secret-scanning`, 2026-09-25)
2. **[Tarea inmediata]** Convertir job `sast` de `ci.yml` a blocking (quitar `continue-on-error: true` o configurar ruleset) — scope `sast-governance-gate` F2
3. ~~**[Tarea inmediata]** Añadir upload SARIF a Semgrep~~ — HECHO (change `sast-weekly-scan`: job `semgrep-full-scan` en `security.yml`, modo audit)
4. **[Tarea sprint]** Configurar merge protection por severidad en ruleset de rama `main`
5. ~~**[Tarea sprint]** Actualizar pin de Gitleaks a v8.30.1 y aplicar los 7 fixes de .gitleaks.toml~~ — HECHO (change `secret-scanning`)
6. **[Tarea sprint]** Evaluar reemplazo a futuro de Gitleaks por Betterleaks/TruffleHog
7. **[Post-merge `sast-weekly-scan`]** Ejecutar `workflow_dispatch` de prueba en ambos workflows; verificar artifacts (30/90/365d) + alerts en Security tab + issue de auditoría

## 7. Conclusión

Una arquitectura SAST efectiva requiere tres capas complementarias:

- **L1 Pre-commit**: Feedback inmediato <2s, bloquea commit local (ya implementado)
- **L2 CI PR**: Gate de regresiones <2min, bloquea merge de findings nuevos (requiere convertir advisory → blocking)
- **L3 Full-history**: Audit semanal, genera issues de remediación, nunca bloquea releases (requiere rehabilitar workflows)

Las herramientas ya están presentes en el repositorio (Semgrep, Gitleaks, CodeQL, Trivy, Dependency Review). Los gaps principales son de configuración (continuar-on-error, workflows deshabilitados, falta de SARIF upload) y de gobernanza (umbral de severidad en ruleset).

Con los cambios recomendados, project-one podrá:

- Bloquear commits con findings de seguridad en L1 (ya funciona)
- Bloquear PRs con regresiones de seguridad en L2 (requiere ajuste de configuración)
- Generar issues automáticos para deuda histórica en L3 (requiere habilitar workflows)
- Mantener velocidad de CI mediante diff-scoped y caching
- Tener visibilidad completa en GitHub mediante upload SARIF y Code Scanning alerts
- Cumplir con requisitos enterprise de seguridad continua (shift-left + shift-right)

La inversión requerida es principalmente de configuración y habilitación de workflows existentes, no de adquisición de nuevas herramientas.
