# Design

## Context

Ver `proposal.md` — _Why_ para la motivación (H1-H8 del PRD §1 y el drift de la spec vigente). Este documento
fija el **cómo** y las restricciones que condicionan la implementación.

Estado verificado del repo el **2026-10-19** (read-only, sin modificaciones):

| Superficie                                        | Estado real                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.husky/pre-commit`                               | `lint-staged` (bloqueante) → `sast:semgrep` + `security:secrets` **en paralelo** (bloqueantes) → 8 pasos advisory (audit, checkov, hadolint, actionlint, zizmor, manifest, guarddog)                                                                                                                                                                              |
| `.husky/pre-push`                                 | `git fetch origin main --depth=1` → guard de `origin/main` → gate de firma `%G?` contra `allowed_signers` (§10.7) → tests scoped (`npm run test:changed --workspace=apps/{server,client}`). **Sin re-check DCO** (eliminado 2026-10-19; `commit-msg` es el único gate local de DCO)                                                                               |
| `.husky/prepare-commit-msg`                       | auto-signoff DCO idempotente, no suprimible por `--no-verify`, siempre `exit 0`                                                                                                                                                                                                                                                                                   |
| `ci.yml` job `sast` (L409-424)                    | `name: 'Governance: SAST (Semgrep)'`, `if: github.event_name == 'pull_request'`, `continue-on-error: true`, `timeout-minutes: 15`, `permissions: contents: read`, `docker run … semgrep/semgrep:1.176.1 semgrep scan --baseline-commit <base_sha> --config .semgrep/rules + 9 packs --exclude ×8 --severity ERROR --error --metrics off`. Fuera de todo agregador |
| `prebuild-governance-complete.needs` (L2424-2428) | `verify-signatures`, `commit-lint`, `pr-title-lint`, `dco` → destino de FASE 2                                                                                                                                                                                                                                                                                    |
| `ci-complete.needs` (L2527-2534)                  | 4 agregadores de substage + `verify-signatures`, `zombie-workflow-guard`, `repo-discovery`                                                                                                                                                                                                                                                                        |
| `scripts/security/semgrep-staged.ps1`             | `$files` calculado y no usado; sin `--error`; `semgrep/semgrep:latest`; 98 `--config "r/…"` con **93 únicas** (5 duplicados); `pwsh` + Docker obligatorios                                                                                                                                                                                                        |
| `scripts/security/semgrep.ps1`                    | idénticos 98/93 y `latest`; su comentario de cabecera apunta a `docs/security/semgrep-rules.md` (no existe)                                                                                                                                                                                                                                                       |
| `package.json` raíz                               | `sast:semgrep` (PowerShell) y `sast:semgrep:full`; workspaces `apps/*` + `e2e`; paquetes `server-express` / `client-react`                                                                                                                                                                                                                                        |
| `.semgrep/`                                       | `.semgrep.yml` (regla `no-console-log` WARNING, packs comentados) + `rules/` con 5 reglas custom y 10 fixtures                                                                                                                                                                                                                                                    |
| Docs                                              | `docs/security/segremp-rules.md` (typo en el nombre) es el archivo real; `docs/learning/quality-gates.md` §7 es la **ventana ÚNICA** de calibración (abierta 2026-10-03), y §2 es el registro canónico advisory/blocking                                                                                                                                          |

## Goals / Non-Goals

**Goals:**

- Un solo camino de ejecución de SAST para local y CI: mismo script, misma versión pineada, mismos packs, mismas
  exclusiones, mismo filtro de severidad y misma base de comparación (RF-PAR-01..06).
- Que el gate local dé feedback útil sin poder bloquear por causas ajenas al código (Docker apagado, timeout, sin
  red) — RF-FAIL-02 y RNF-04.
- Que el CI sea el punto de enforcement: `sast` deja de ser decorativo y se gradúa a bloqueante con criterio
  escrito (RF-CI-03/04).
- Cerrar la deuda de artefactos muertos: `semgrep-staged.ps1` y el npm script `sast:semgrep` desaparecen
  (RF-CLN-01), y el `pre-commit` deja de ejecutar SAST (RF-PC-01/RF-CLN-02).

**Non-Goals:**

- Sustituir o reemplazar el escaneo SAST completo (on-demand `sast:semgrep:full`): se conserva **tal cual**, solo
  deduplicado y con la versión pineada.
- Bindear `Governance: SAST (Semgrep)` como required status check del ruleset 21227644: FASE 2 llega hasta el
  agregador de governance, no al ruleset (requeriría un change de gobernanza propio).
- Cablear un "early-abort" con `needs` hacia los jobs caros de quality/security (declarado no-objetivo en el
  PRD §2).
- Vendorizar en `.semgrep/rules` las reglas `r/...` no cubiertas por los packs: se audita la cobertura (tarea
  1.4) y, si aparecen huecos críticos, se deciden en un change posterior.
- Añadir detección de nuevos `nosemgrep` en el diff (no-objetivo del PRD §2).
- Garantizar enforcement desde el hook: `git push --no-verify` / `HUSKY=0` lo anulan por diseño.

## Decisions

### D1 — Los secretos van en `pre-commit`; SAST va en `pre-push` (PRD D1)

Un secreto commiteado exige reescribir historia y rotar credenciales, así que se detecta en el punto más temprano
posible: el escaneo es **staged-only** y barato. SAST, en cambio, necesita un **baseline** para no bloquear por
hallazgos antiguos: en `pre-commit` solo se pueden pasar archivos completos, y un `--baseline-commit` no tiene
sentido contra el índice. En `pre-push` sí existe `origin/main`, exactamente la misma base que usa el CI
(`--baseline-commit`).

**Alternativas descartadas:** (a) SAST en ambos hooks — el hook de commit bloquearía por deuda ajena y duplicaría
escaneos; (b) SAST solo en CI — se pierde el 80% del valor del shift-left y el dev se entera del hallazgo minutos
después en lugar de segundos; (c) secretos también en `pre-push` — tarde: el commit ya está en el historial local.

### D2 — Un único script Node `scripts/sast-diff.mjs` (PRD D2)

Node ya está en el stack y corre igual en Windows (Git Bash/MSYS2) y en `ubuntu-latest` (RNF-01). El mecanismo
alternativo —mantener el PowerShell y escribir un gemelo bash para el CI— garantiza divergencia a medio plazo: es
exactamente el fallo que este change corrige (dos implementaciones, dos versiones, dos bases de comparación).

**Alternativas descartadas:** (a) dos scripts gemelos (`ps1` + `sh`); (b) una GitHub Action propia invocada
también desde el hook — añade superficie y una capa de indirección para algo que son ~100 líneas de Node; (c) mover
la lógica a npm scripts con `--` flags — imposible de testear y de mantener en lockstep con el CI.

### D3 — Local fail-open, CI fail-closed (PRD D3)

El hook es **feedback**, el CI es **enforcement**. Si Docker está apagado (o no hay red, o el escaneo excede el
timeout), un gate local fail-closed impediría pushear por un problema de entorno, no de código — y el coste real
lo paga el equipo entero. El CI no tiene esa excusa: allí la herramienta siempre debe estar disponible, así que un
fallo de herramienta es un fallo de la pipeline.

Matriz de decisión. La **única** diferencia de configuración entre modos es el valor de `--baseline-commit`
(local: `git merge-base origin/main HEAD`; CI: `github.event.pull_request.base.sha`). Versión, packs, exclusiones y
filtro de severidad son idénticos, por eso la tabla comparte todo salvo las dos últimas columnas.

| Resultado de Semgrep                   | Clasificación           | Modo `local`                       | Modo `ci` (FASE 1)                                                               |
| -------------------------------------- | ----------------------- | ---------------------------------- | -------------------------------------------------------------------------------- |
| exit `0`                               | sin hallazgo bloqueante | ✅ continúa                        | ✅ step verde                                                                    |
| exit `1`                               | hallazgo ERROR nuevo    | 🛑 bloquea el push                 | ❌ step falla; con `continue-on-error` el merge **no** se bloquea (en FASE 2 sí) |
| exit ≠ `0`,`1`                         | herramienta rota        | ⚠️ avisa y **deja pasar**          | ❌ step falla y el job se reporta fallido (fail-closed en ambas fases)           |
| no arranca (Docker/imagen/red)         | herramienta rota        | ⚠️ avisa y **deja pasar**          | ❌ step falla                                                                    |
| timeout excedido                       | herramienta rota        | ⚠️ avisa y **deja pasar**          | ❌ step falla                                                                    |
| working tree sucio                     | skip por contrato       | ⚠️ avisa y **deja pasar**          | n/a — el skip **no** se aplica (checkout limpio)                                 |
| diff sin `.js/.jsx/.cjs/.mjs/.ts/.tsx` | skip por contrato       | ⚠️ avisa (skip)                    | n/a — el skip de idioma **no** se aplica (el CI siempre analiza)                 |
| `SAST_MODE` sin definir en un runner   | configuración inválida  | n/a (el default `local` sí aplica) | ❌ falla pidiendo la variable explícita                                          |

**Fallo de step vs fallo de gate (H-2).** En FASE 1 ambos son el mismo evento de step, pero **no** el mismo efecto:
el step falla y el job se reporta fallido, mientras el merge sigue permitido porque `continue-on-error: true` está
vigente. El enforcement real empieza en FASE 2, cuando se retira esa clave y `sast` entra en
`prebuild-governance-complete.needs`. Confundir ambos planos haría creer que FASE 1 ya bloquea.

**Alternativas descartadas:** (a) fail-closed en local — bloqueos por entorno y `--no-verify` sistemático, que
destruye el resto de la cadena local; (b) fail-open también en CI — convierte el gate en decorativo, que es
precisamente el estado actual (H8).

### D4 — Un solo change; FASE 1 ahora y FASE 2 diferida dentro del mismo change (PRD D4)

Decisión cerrada con el usuario: A+B+C del PRD §8 se implementan **en un único change**, y el job `sast` se gradúa
en dos fases **dentro** de él. El change queda **abierto 2-4 semanas** (ventana de calibración), con el criterio de
graduación escrito en el propio YAML. RF-CI-04 se especifica como requirement con **tareas diferidas marcadas
explícitamente**, no como out-of-scope: así el compromiso queda trazable en la spec y no se pierde al archivar.

**Alternativas descartadas:** (a) dividir en dos changes (A/B/C) — el hook y el CI comparten el script, así que el
change del CI no puede existir sin el script, y partir el hook en dos deja una ventana con el `pre-commit`
corriendo el SAST roto que se está eliminando; (b) activar el bloqueo directamente (salta FASE 1) — bloquea merges
con falsos positivos sin evidencia previa; (c) dejar RF-CI-04 fuera de alcance — pierde la trazabilidad del
compromiso y contradice la convención FASE 1/FASE 2 del repo.

### D5 — Lista `r/...` solo para el escaneo completo; hook y CI usan packs (decisión cerrada, excepción documentada a RF-PAR-04)

RF-PAR-04 exige que el conjunto de reglas se defina en **una sola fuente**: la cumplen el hook y el CI, que
consumen los packs desde `scripts/sast-diff.mjs`. `scripts/security/semgrep.ps1` (`sast:semgrep:full`) queda como
**excepción deliberada y documentada**: conserva su lista de 93 reglas `r/...` para el escaneo completo on-demand,
deduplicada y con la misma versión pineada. La razón es de coste: 93 `--config "r/..."` implican una petición al
registro por regla, lo que es inviable en un hook (medido como H5 del PRD) pero aceptable en un escaneo manual que
ocurre a demanda. Eliminarlo sin sustituto dejaría al equipo sin escaneo completo.

**Alternativas descartadas:** (a) migrar también el full scan a packs — cambia la semántica del escaneo on-demand
y puede alterar su baseline de hallazgos sin necesidad; (b) eliminar `semgrep.ps1` y `sast:semgrep:full` —
pérdida de capacidad, no la pide ningún requisito; (c) mantener la lista `r/...` también en el hook — es la causa
raíz de H5.

### D6 — Paridad de veredicto: mismo diff, mismo resultado (RF-PAR-06)

La paridad se consigue por construcción, no por disciplina: un solo script, una constante de versión, una lista de
packs, una lista de exclusiones, un filtro de severidad. Lo único que difiere es la política de fallos (D3). La
**base** de comparación también difiere por diseño, y **debe** diferir: `git merge-base origin/main HEAD` en
local frente a `github.event.pull_request.base.sha` en CI, ambas pasadas vía `--baseline-commit`. El contrato es
_mismo diff → mismo veredicto_, no _mismo estado de rama → mismo veredicto_. El merge base es además la elección
local _correcta_, no un compromiso: si `main` avanzó desde que se abrió la rama —o el `--depth=1` del fetch no trajo
el commit base exacto— usar `origin/main` a secas atribuiría al cambio hallazgos introducidos por terceros,
rompiendo RF-PP-02. Divergencias admitidas: 1) la clasificación "herramienta rota" en un solo lado; 2) hallazgos
presentes en una baseline y ausentes en la otra, que cada lado declara junto al commit de baseline que usó.

### D7 — Skip por working tree sucio: mitiga la verificación 1 del PRD §6 (supuesto resuelto)

El PRD §6 deja como verificación previa no comprobada si `--baseline-commit` exige un working tree limpio en
Semgrep 1.176.1. **Supuesto adoptado y resuelto por diseño:** sí puede comportarse de forma inesperada con un
árbol sucio (el baseline se resuelve por commit, mientras Semgrep analiza el _working tree_, de modo que los
cambios sin commitear no están en el baseline y podrían reportarse como nuevos). En lugar de resolverlo con una
prueba empírica bloqueante, el contrato lo neutraliza: **RF-PP-04** obliga a saltar el escaneo, con aviso visible,
cuando el working tree está sucio. Con esa guarda, la interacción no puede producir un veredicto falso y el
comportamiento exacto de Semgrep deja de ser determinante para la corrección del gate. La cobertura queda en el CI,
que evalúa el diff del PR sobre un checkout limpio.

### D8 — Documentación: renombrar `segremp-rules.md` a `semgrep-rules.md`

El archivo real es `docs/security/segremp-rules.md` (typo) y el PRD lo nombra como `semgrep-rules.md`. Se decide
**renombrar** y arrastrar las referencias, en lugar de conservar el typo:

- Las **cabeceras de los propios scripts** (`semgrep-staged.ps1` L3, `semgrep.ps1` L3) ya apuntan a
  `docs/security/semgrep-rules.md`, que hoy **no existe**: el nombre correcto es el que el código cree usar.
- Solo hay **4 referencias entrantes** al nombre con typo, todas mecánicas y verificadas: `.markdownlintignore`
  L122, `docs/security/security-enterprise-guide.md` L18/L38/L4484 y `oldReadme.md` L503.
- `git mv` preserva la historia y la atomicidad es trivial de garantizar en un solo commit.

**Restricción operativa:** el renombrado y la edición de `.markdownlintignore` L122 **deben ir en el mismo
commit**. Si se renombra sin actualizar el ignore, el job advisory `docs-validation` (markdownlint) empieza a
lintear un archivo excluido por defecto y genera ruido; si se actualiza el ignore sin renombrar, la entrada queda
apuntando a un archivo inexistente.

**Alternativa descartada:** conservar `segremp-rules.md` y corregir solo las cabeceras de los scripts —
perpetúa un nombre roto en la documentación canónica de reglas y contradice el PRD.

### D9 — Evidencia de calibración: artifact de 14 días y criterio en el YAML

En FASE 1 el job no bloquea, así que la única forma de acumular evidencia es **reteniendo el resultado**: artifact
con `retention-days: 14`, subido con `if: always()` y con `if-no-files-found: warn` para que una corrida limpia no
rompa el step. Los 14 días siguen la convención del repo para artifacts advisory de PR (`lockfile-audit`,
`checkov-iac`, `containerfile-lint`, `actionlint-advisory`, `zizmor-advisory`, `typosquat-guarddog`). No se sube
SARIF: el requirement _No SARIF upload in governance gate_ sigue vigente y no se toca en este change.

### D10 — El criterio de graduación vive en el YAML y en la ventana ÚNICA

RF-CI-03 exige que el criterio esté escrito en el workflow. Además, `docs/learning/quality-gates.md` §7 declara una
**ventana de calibración ÚNICA** (abierta 2026-10-03): los changes que aportan evidencia a esa ventana **editan
esa misma sección en lockstep** y **no abren una segunda**. Este change se somete a esa convención: añade su
criterio a la sección §7 existente y no crea una sección nueva.

### D11 — FASE 2 llega al agregador de governance, no al ruleset

RF-CI-04 especifica FASE 2 como: quitar `continue-on-error` y añadir `sast` a
`prebuild-governance-complete.needs`. Consecuencias que deben quedar explícitas:

- **`ci-complete.needs` no se toca.** Pero `ci-complete` depende de `prebuild-governance-complete`, así que en
  FASE 2 un fallo de `sast` hará fallar `CI Complete` de forma **transitiva**. Es el efecto buscado, y por eso el
  requirement _No ci-complete coupling_ se matiza en la spec delta en vez de darse por inalterado.
- **El ruleset 21227644 no se toca.** Si en el futuro se quisiera bindear el check, el nombre exacto es
  `Governance: SAST (Semgrep)` (§3.2/§9.3.9 de `docs/CONTEXT-CICD.md`); renombrarlo rompería el binding en
  silencio. Esa decisión (y el coste de un check required) excede este change.
- **Reversibilidad:** volver a FASE 1 es restaurar `continue-on-error: true` y quitar `sast` de `needs`.

### D12 — Orden de etapas en `pre-push` (decisión cerrada)

Orden obligatorio: (1) `git fetch origin main --depth=1`, (2) guard de `origin/main`, (3) gate de firma de commits
(`%G?` contra `allowed_signers`), (4) **SAST diff-scoped (nuevo)**, (5) tests scoped. SAST va **después** de la
firma y **antes** de los tests: si SAST bloquea, los tests no se pagan (ahorro real, porque el escaneo es más
barato que la suite scoped). El fetch no se mueve: el escaneo necesita `origin/main` como baseline y el hook ya lo
garantiza. **No se reintroduce el re-check DCO** eliminado el 2026-10-19: `commit-msg` es el único gate local de
DCO y duplicarlo añadía un `git log` por commit en cada push sin cobertura nueva.

### D13 — Baseline local: merge base, no `origin/main` a secas (H-3)

`--baseline-commit` se pasa en **ambos** modos; lo que cambia es su valor. En local es
`git merge-base origin/main HEAD`: si `main` avanzó desde que se creó la rama, o si el `git fetch --depth=1` no trajo
el commit base exacto, usar `origin/main` directamente atribuiría al cambio hallazgos introducidos por terceros y
rompería RF-PP-02 (que prohíbe bloquear por hallazgos preexistentes). El merge base es por tanto la lectura correcta
del requisito, no una aproximación. La divergencia con CI (`github.event.pull_request.base.sha`) es real y se
**declara**: cada lado reporta el commit de baseline que usó, y la spec lo cubre con un escenario en _Diff-scoped
scan against a baseline commit_ y otro en _Same diff yields the same verdict_.

### D14 — Coherencia con el requirement vigente _Docker image pinned to specific tag_

La spec main de `sast-governance-gate` exige que la imagen `semgrep/semgrep` esté pinada a una versión concreta
(`1.176.1`) y que no se use un tag flotante. Ese requirement **no entra** en la lista MODIFIED porque tras este
change sigue siendo verdadero: el pin no desaparece, solo cambia de lugar — pasa del comando inline del YAML a la
constante única del script compartido, y el full scan (`semgrep.ps1`) debe usar el mismo valor. Tampoco contradice al
ADDED _Single pinned Semgrep version_, que lo refuerza (una sola ocurrencia en el repo). Se deja constancia aquí y no
se toca la spec, para no abrir un MODIFIED innecesario.

### D15 — Implementación del timeout en Node y limpieza del contenedor huérfano

El timeout se implementa con `child_process.spawn` más un temporizador propio (`setTimeout` → `kill`), no con
`spawnSync`: solo el primero permite cortar el proceso en vuelo. Al vencer se mata el proceso **y** se ejecuta una
limpieza del contenedor con `docker rm -f` sobre el nombre fijado al lanzar (`--name`), de modo que no queden
contenedores huérfanos entre pushes. El vencimiento se clasifica como **herramienta rota** y pasa por la política de
fallos del modo (aviso en local, fallo en CI): es la clase de fallo que no debe bloquear el push.

### D16 — Alcance declarado del delta y docs vecinos (M-2)

Insertar una etapa en `pre-push` cambia de facto el contrato de la capability `pre-push-scoped-testing`, así que este
change **declara el delta** (`specs/pre-push-scoped-testing/spec.md`: MODIFIED de _Pre-push hook runs scoped tests_,
con sus tres scenarios intactos más dos nuevos) en lugar de dejar la spec main contradiciendo al hook. En la misma
pasada se registran dos documentos desalineados:

- `openspec/specs/ci-secret-scanning/spec.md` (§Notes) cita Semgrep `p/secrets` dentro del job SAST como capa de
  protección de secretos. Sigue siendo cierto (el job no desaparece, cambia de implementación), pero al moverse SAST
  fuera del `pre-commit` la nota debe repartir los roles: Gitleaks staged en `pre-commit`, SAST diff-scoped en
  `pre-push` y CI. Se corrige en la tarea 7.8.
- `docs/pre-merge-gates-governance.md` afirma que el job `sast` no está en `ci.yml`. Es drift previo verificado y se
  corrige en la misma tarea 7.8.

`docs/ci-cd-pipeline-empresarial.md` está citado en `docs/CONTEXT-CICD.md` §8 como **NO modificar** (fuente
conceptual del curso): su referencia obsoleta a `sast:semgrep` se marca como histórica en la tarea 7.5 y el archivo
**no** se edita.

### D17 — Presupuesto del peor caso (cold cache)

El objetivo de <60 s del `pre-push` (RF-PP-06) se mide en el **peor caso**, no en el tibio: caché Docker fría
(`docker pull` de `semgrep/semgrep:1.176.1`) más la primera resolución de los 9 packs, que es la situación real de
una máquina nueva o de un dev que no ha usado el hook en días. La medición se registra junto a la tarea 3.4 y su
resultado alimenta la sección §7.5.3 de `docs/testing-architecture.md`, que documenta el presupuesto de la etapa de
CI y ahora también el de la etapa local. Si el peor caso excede el presupuesto, la mitigación ya está en el diseño
(fail-open por timeout, sin bloqueo) y el número se documenta en vez de ocultarse.

**Re-medición 2026-10-20 (post-review):** con el árbol ya crecido, Windows + Docker Desktop e imagen
**cacheada**, el scan tarda **135 s** (clon limpio), **149 s** (linked worktree) y **207 s** (worktree con la máquina cargada por otro proceso) sobre 385 archivos / 81
reglas; el mismo diff en `ubuntu-latest` tarda **22.7 s**. El timeout local de 60 s, por tanto, **no era
un presupuesto sino un interruptor**: cortaba scans correctos y los degradaba a `tool-broken` →
fail-open, es decir, el gate local no bloqueaba nada. RF-PP-06 pide un _objetivo_ <60 s, no un techo de
ejecución, así que `LOCAL_TIMEOUT_MS` pasa a **300 s** (red de seguridad) y el objetivo de 60 s se
documenta como **no alcanzado en Windows con Docker Desktop**, con esta medición como evidencia.
También se corrigió que el script no funcionaba dentro de un `git worktree` (el git dir vive fuera del
bind mount → "not a git repository" → fail-open silencioso): ahora monta el common dir y pasa
`GIT_DIR=<common>/worktrees/<name>`, `GIT_COMMON_DIR`, `GIT_WORK_TREE` y un `[safe] directory` efímero.

### D18 — El reporte de CI es el input real del artifact

El artifact de 14 días (RF-CI-02) necesitaba una fuente concreta: el modo `ci` escribe **siempre**
`.tmp/sast-report.json` (findings con regla, severidad, archivo y línea, más el modo resuelto y el commit de
baseline), también en corridas limpias, de modo que `upload-artifact` nunca se quede sin input — y por eso sigue
llevando `if-no-files-found: warn` como red de seguridad. El veredicto no depende del reporte: si no se puede
escribir, el exit code sigue reflejando el resultado del escaneo y el problema se reporta en la salida.

## Risks / Trade-offs

| Riesgo                                                                                                            | Mitigación                                                                                                                                                                                                                                                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| El push se bloquea por un hallazgo ERROR nuevo y el equipo percibe fricción en el loop local                      | Escaneo diff-scoped contra `origin/main` (no bloquea deuda antigua), skip cuando el diff no toca `.js/.jsx/.cjs/.mjs/.ts/.tsx`, skip con working tree sucio, fail-open ante herramienta rota, y escape visible (`git push --no-verify` / `HUSKY=0`). La remediación se imprime en el propio bloqueo                                                                                                                      |
| El escaneo diff-scoped en local excede el presupuesto de 60 s (descarga de packs, arranque de contenedor)         | Timeout propio en el script que degrada a fallo abierto con aviso (RNF-03/04); medición en la corrida de verificación; el presupuesto se documenta junto al hook                                                                                                                                                                                                                                                         |
| Latencia del `pre-commit` por encima de 5 s (RF-SEC-04) al capturar la salida en vez de streamearla               | El escaneo staged corre sobre el índice, sin recorrer historia, y el presupuesto se verifica con el commit de referencia antes de cerrar la tarea                                                                                                                                                                                                                                                                        |
| Divergencia sutil entre hook y CI pese al script único (variables de entorno, rutas, Docker en ubuntu vs Windows) | La paridad es explícita como requirement con escenario de comparación sobre un diff de referencia (RF-PAR-06) y una tarea de verificación que ejecuta ambos modos                                                                                                                                                                                                                                                        |
| FASE 2 aplicada antes de tiempo o sin evidencia                                                                   | El criterio de graduación está escrito en el YAML y las tareas FASE 2 están marcadas como diferidas; la spec tiene un escenario explícito de "no aplicar FASE 2 antes del criterio"                                                                                                                                                                                                                                      |
| Un fallo de herramienta en CI (exit ≠ 0,1) se confunde con un hallazgo y se tria como falso positivo              | El contrato de exit codes separa "hallazgo" de "herramienta rota" y el modo `ci` falla cerrado con un mensaje distinguible (RF-FAIL-01/03)                                                                                                                                                                                                                                                                               |
| Renombrar `segremp-rules.md` rompe el ignore de markdownlint o deja enlaces colgando                              | Atomicidad obligatoria en un solo commit (renombrado + `.markdownlintignore` L122 + 3 referencias en `security-enterprise-guide.md` + `oldReadme.md`), con verificación por grep de que no queda ninguna referencia al nombre antiguo                                                                                                                                                                                    |
| El escaneo completo se degrada al deduplicar la lista `r/...`                                                     | La deduplicación no cambia el conjunto de reglas (93 únicas de 98 entradas); la tarea de deduplicado verifica que el conjunto efectivo es idéntico antes y después                                                                                                                                                                                                                                                       |
| Perder cobertura de reglas al pasar el hook de la lista `r/...` a los packs                                       | Auditoría de cobertura explícita (tarea 1.4) que compara las 93 reglas `r/...` contra `p/owasp-top-ten`, `p/security-audit`, `p/secrets`, `p/nodejs`, `p/expressjs`, `p/react`, `p/xss`, `p/sql-injection`, `p/command-injection` y registra los huecos; los huecos críticos ya cubiertos por las 5 reglas custom de `.semgrep/rules` se documentan, y los no cubiertos se escalan como candidatos a un change posterior |

## Migration Plan

1. **FASE 1 (ahora, en un PR).** Se implementa el script, se reordena `pre-push`, se limpia `pre-commit`, se
   apunta el job `sast` al script conservando `continue-on-error: true` y se añade el artifact de 14 días y el
   comentario con el criterio de graduación. Los hooks toman efecto para cada dev al hacer `npm install` / `git
pull` (Husky v9 ya está configurado con `prepare: husky`); no hay migración de datos ni de configuración de
   máquina.
2. **Ventana de calibración (2-4 semanas, change abierto).** Cada corrida del job `sast` acumula evidencia en su
   artifact. El criterio vive en el YAML y en la sección §7 de `docs/learning/quality-gates.md` (misma ventana, no
   una nueva).
3. **FASE 2 (diferida, mismo change).** Quitar `continue-on-error` y añadir `sast` a
   `prebuild-governance-complete.needs`. Actualizar en lockstep la fila de `quality-gates.md` §2 y el §9.3.9 de
   `docs/CONTEXT-CICD.md`.
4. **Rollback.** FASE 2 → FASE 1: restaurar `continue-on-error: true` y quitar `sast` de `needs`. Rollback total
   del gate local: borrar la etapa SAST de `.husky/pre-push` (el hook conserva sus otras etapas intactas) y
   `HUSKY=0 git push` como escape individual inmediato. El artifact y el script pueden quedar sin uso sin afectar
   al CI, porque el job volvería a la lista de packs anterior solo revirtiendo un comando.

## Open Questions

- **Huecos de cobertura de las reglas `r/...` frente a los packs.** La auditoría (tarea 1.4) puede revelar reglas
  sin equivalente en los packs. La decisión de vendorizarlas en `.semgrep/rules/` o descartarlas es del PRD §7.2 y
  **no cambia el diseño ni las specs**: si aparecen huecos críticos, entran como reglas custom versionadas con
  fixtures (camino ya previsto por la capability) o se escalan a un change posterior. Por eso queda como pregunta
  abierta y no como decisión.
- **Umbral exacto de "sin falsos positivos triados"** en el criterio de graduación (RF-CI-03 fija "2-4 semanas",
  no un número de corridas limpias consecutivas). El YAML escribirá el criterio operacional concreto durante la
  implementación de la tarea FASE 1; no altera specs ni tareas.
