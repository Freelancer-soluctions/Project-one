# Design — local-dco-auto-signoff

> Los delta specs de este change codifican **D1' y D2-D7** (hook `prepare-commit-msg`, exención de merge,
> idempotencia, identidad, nunca-bloquea, portabilidad POSIX, doc canónico). `docs/learning/dco.md`
> — y la corrección documental de **D6** sobre `docs/CONTEXT-CICD.md`/`AGENTS.md` — se redactan en
> la fase de **APPLY**, no en este change de diseño.

## Context

El DCO se validaba en tres puntos (dos hooks locales + CI) y no se garantizaba en ninguno: el
trailer `Signed-off-by:` solo existía si el desarrollador pasaba `-s` con memoria impecable. El
check `DCO` de CI (`KineticCafe/actions-dco@v3.2.0`, job `dco` de `ci.yml`, ruleset 21227644,
`bypass_actors: []`) es required y blocking — el único gate inbypasseable —, pero llega tarde:
`commit-msg` rechaza el commit ya redactado y el re-check de `pre-push` lo descubría al empujar,
duplicando en push la misma comprobación de presencia que `commit-msg` ya hizo al crear cada commit
(con coste por push: una caminata `git log` por commit del rango). Ambos hooks son de Husky v9 (vía
`core.hooksPath`, scripts POSIX sh; `HUSKY=0` los desactiva proceso-wide).

Este change añade el auto-signoff (`prepare-commit-msg`) y **consolida** la validación local:
`commit-msg` pasa a ser el único gate local (D1') y el bloque DCO de `pre-push` se elimina,
conservando en este último el `git fetch origin main` + el guard de existencia de `origin/main` y la
sección de scoped tests — el fetch es prerequisito del contrato `--changed origin/main` de los tests
(§10.6 de `docs/CONTEXT-CICD.md`) y NO se elimina junto con el bloque DCO. El check de CI permanece
sin cambios como backstop inbypasseable; el riesgo residual de la eliminación se documenta en
§Accepted residual risk.

Restricciones verificadas que moldean el diseño:

- `prepare-commit-msg <msg-file> [<source> [<sha>]]` corre tras preparar el mensaje por defecto y
  **antes** del editor; `$2` ∈ {message, template, merge, squash, commit}; `$3` = SHA de origen
  cuando `$2=commit` (`-c`/`-C`/`--amend`); puede editar el fichero in place; **NO se suprime con
  `--no-verify`** (solo `pre-commit` y `commit-msg` se suprimen) — razón por la que el auto-signoff
  vive aquí.
- `git interpret-trailers --in-place --trailer "..."` produce un bloque de trailers estrictamente
  parseable (necesario para el parser `strict` por defecto de KineticCafe: bloque final único, sin
  texto no-trailer después). **Deduplicación (verificado empíricamente, git 2.52.0.windows.1):** un
  trailer con valor **idéntico** NO se duplica (el conteo sigue en 1), pero uno con valor
  **distinto** SÍ se añade (el conteo pasa a 2) — por eso la previa con `grep` es la guarda cargada
  de idempotencia (ver D5).
- `commit.signoff` **no es una variable de git** (D6): no hay config nativa para automatizar el
  signoff; el hook es el único camino local fiable.
- KineticCafe toma la identidad del author **o** del committer, igual que `git commit -s`, que firma
  como COMMITTER. `-s` ≠ `-S` (attestación legal vs firma criptográfica; ortogonales).

El porqué completo está en `proposal.md` (Why); este documento cubre el cómo.

## Goals / Non-Goals

**Goals:**

- Que el trailer esté **garantizado por construcción** en todo commit no-merge, sin depender de la
  memoria del dev ni de config local de git.
- Idempotencia total: convivir sin duplicados con `-s` explícito, `--amend`, cherry-pick y rebase.
- Un hook que **solo repara, nunca bloquea** (exit 0 en todos los caminos — bajo `sh -e` esto solo
  se sostiene si todo comando con estatus no-cero posible va guardado, ver §Hook contract y
  §Pitfalls), portable POSIX.
- Corregir el mito `commit.signoff` en la documentación del proyecto (D6) y sentar el doc canónico
  `docs/learning/dco.md` (APPLY).
- Consolidar la validación local en `commit-msg` como **único gate local** (D1'): eliminar el bloque
  DCO duplicado de `pre-push` conservando en este último su `git fetch origin main`, su guard de
  `origin/main` y su sección de scoped tests intactos (contrato `--changed origin/main`, §10.6 de
  `docs/CONTEXT-CICD.md`), y preservar intacta la **lógica** de `commit-msg` (únicas excepciones
  contenidas: el string de guidance humano y la etiqueta del comentario de cabecera `# DCO check
(L1)` → `# DCO check (L2)`, D7 — sin cambio de comportamiento).

**Non-Goals:**

- No cambiar CI, el ruleset ni la bot policy de KineticCafe (ya está en `well-known` en este repo;
  este change solo documenta su estado activo, no lo modifica).
- No tocar la **lógica** de `.husky/pre-commit` ni `package.json`. Ediciones en `.husky` permitidas
  y exhaustivas (D1'/D7): (a) crear `.husky/prepare-commit-msg`; (b) eliminar SOLO el bloque DCO de
  `.husky/pre-push` (líneas 16-49) conservando `git fetch origin main`, el guard de `origin/main` y
  la sección de scoped tests byte-idénticos; (c) SOLO DOS strings de
  `.husky/commit-msg` (tarea 5.8, D7): el string de guidance humano y la etiqueta del comentario de
  cabecera `# DCO check (L1)` → `# DCO check (L2)` — la lógica DCO (merge skip, grep case-sensitive,
  `exit 1` y el orden antes de commitlint) queda byte-idéntica.
- No automatizar signoff en `git merge` (git no lo soporta; ambos enforcement tools exentan merge).
- No resolver los commits web-flow de GitHub (fuera del alcance de hooks de repo; pitfall
  documentado).
- No eliminar la convención `git commit -S -s`: sigue siendo válida y compatible (idempotencia).

## Decisions

- **D1' — Nuevo hook `.husky/prepare-commit-msg`; `commit-msg` es el ÚNICO gate local de validación
  y el bloque DCO de `pre-push` se ELIMINA** (dos ediciones contenidas en `commit-msg`, ambas texto: la guidance
  del error DCO y la etiqueta del comentario de cabecera `# DCO check (L1)` → `# DCO check (L2)`,
  D7/tarea 5.8 — su lógica DCO queda byte-idéntica; en `.husky/pre-push` se
  borra SOLO el bloque de re-check — líneas 16-49: su cabecera de comentario, el acumulador
  `DCO_FAILED`, el bucle `while read` de STDIN con su fallback de SHA nulo, la rama de fallo
  (`❌ DCO:` + `exit 1`) y el echo de éxito — conservando `git fetch origin main`, el guard de
  existencia de `origin/main` y la sección de scoped tests, que dependen del fetch vía `--changed
origin/main`).
  Rationale: (1) el re-check de `pre-push` duplicaba en push la misma comprobación de presencia que
  `commit-msg` ya hizo al crear cada commit — dos capas locales idénticas no son defense-in-depth
  adicional; (2) coste por push sin contrapartida: una caminata `git log` por commit del rango en
  cada `git push` (el `git fetch` previo se conserva igualmente por los scoped tests); (3) los
  commits creados localmente quedan cubiertos por construcción — `--no-verify` NO suprime
  `prepare-commit-msg`, así que el trailer existe antes de que `commit-msg` valide, y si este falla
  el commit nunca nace; (4) CI conserva el gate autoritativo e inbypasseable (ruleset 21227644) para
  lo que los hooks locales no alcanzan (§Accepted residual risk). Alternativas descartadas:
  (a) mantener las tres capas locales (la decisión D1 anterior) — duplicación de `commit-msg` y
  coste por push sin cobertura nueva; (b) mover toda la validación a `pre-push` — pierde el feedback
  en segundos y el orden DCO→commitlint; (c) envolver `git` o aliasar `commit`, o añadir `-s` vía
  alias/wrapper — frágil, no portable, no cubre `--amend`, `-C` ni los flujos con fuente de mensaje;
  (d) inyectar el trailer en `commit-msg` — se suprimiría con `--no-verify`, que es justo el hueco
  que el hook nuevo debe cubrir. Husky v9 registra el hook nuevo solo con existir el fichero bajo
  `core.hooksPath` (`"prepare": "husky"` ya instalado, sin cambios).

- **D2 — Exención SOLO para `$2 = "merge"`.** `message`/`template`/`squash`/`commit` SÍ reciben el
  trailer. Idempotente: nunca añadir si ya hay `Signed-off-by:`. Rationale: git no tiene flag de
  signoff para merge y las herramientas de enforcement exentan merge; `squash` y `--amend` son
  precisamente los flujos donde el trailer tiende a perderse. El `--amend` re-entra al hook
  (`$2=commit`) y se convierte en la vía de reparación retrógrada gracias al guard de idempotencia.

- **D4 (SUPUESTO / assumption — registrar como tal) — Identidad = committer.**
  `git var GIT_COMMITTER_IDENT`, quitando el sufijo ` <timestamp> <tz>`, da el canónico
  `Name <email>` — comportamentalmente idéntico a `git commit -s`, que firma como COMMITTER.
  Fallback: author ident; si no es resoluble → **exit 0 SIN editar** (nunca bloquear, nunca
  adivinar). Rationale: KineticCafe requiere nombre+email válidos y acepta identidad de author o
  committer, así que committer es compatible. **Assumption explícita:** que ningún flujo del repo
  dependa de que el trailer coincida estrictamente con el _author_ (lo haría inválido el probot
  `dcoapp/app`, que exige igualdad author==trailer; este repo no lo usa). Alternativa descartada:
  author ident como identidad primaria — no replica `-s` y divergiría de la convención
  `git commit -S -s` ya instalada.

- **D5 — Inyección con `git interpret-trailers --in-place --trailer "Signed-off-by: <Name>
<email>" "$1"`, NO `printf >>`.** Verificado empíricamente (git 2.52.0.windows.1): produce un
  bloque estrictamente parseable en mensaje sin body, con body, y con líneas en blanco finales
  (`--parse` round-tripea los tres). **Deduplicación (precisa):** `interpret-trailers` NO añade un
  segundo trailer cuando el valor es **idéntico** al existente (verificado: conteo 1), pero SÍ
  añade uno cuando el valor es **distinto** (verificado: conteo 2). Por eso el pre-check con `grep`
  sigue siendo la guarda cargada de idempotencia: es lo que garantiza "exactamente uno" en la
  combinación hook + `-s` explícito (git ejecuta `-s` ANTES de invocar al hook, así que el hook ve
  el trailer presente y sale sin inyectar). Alternativa descartada: `printf >>` — puede producir
  trailers que el parser `strict` de KineticCafe rechaza (bloque no separado / texto tras el
  bloque).

- **D3 — Doc canónico `docs/learning/dco.md` (APPLY) que ENLAZA, no duplica.**
  `05-husky-git-hooks.md` (mecánica de hooks) y `05b-commit-signing.md` (firma `-S` ed25519) se
  referencian; el doc nuevo cubre conocimiento DCO transversal: DCO v1.1 vs CLA, formato del
  trailer, contratos de los hooks con rol DCO (`prepare-commit-msg` + `commit-msg`), comparativa de
  enforcement, pitfalls y capas local→CI. Alternativa descartada: ampliar `05b` — mezclaría
  attestación legal (`-s`) con firma criptográfica (`-S`), que son ortogonales.

- **D6 — El mito `commit.signoff` se corrige (spec + APPLY).** `commit.signoff` NO es variable de
  git; el hook es el único camino de automatización local fiable. Ver sección crítica más abajo.

- **D7 — Corregir DOS strings de `.husky/commit-msg` (texto, no lógica): la guidance del error y la
  etiqueta del comentario de cabecera.** La línea
  ~14 del hook, al fallar el DCO, sugiere `git commit -s` **o** `git config --global commit.signoff
true` — la segunda es un no-op (D6): el propio hook difunde el mito. Se sustituye por guidance
  accionable: `git commit -s`, `git commit --amend -s`, y la nota de que el hook nuevo
  `prepare-commit-msg` añade el trailer automáticamente en commits nuevos. Además, el comentario de cabecera del hook
  pasa de `# DCO check (L1)` a `# DCO check (L2)` (etiqueta de capa correcta en el modelo L0-L3 de
  §Layer model: `commit-msg` es L2, no L1; comentario puro, sin efecto en la ejecución).
  **Invariante:** la lógica DCO de `commit-msg` (skip de merge `^Merge `, grep case-sensitive
  `Signed-off-by:`, `exit 1`, orden antes de commitlint) queda byte-idéntica; solo cambian DOS strings
  legibles — guidance + etiqueta de cabecera — (tarea 5.8). Afloja el Non-Goal "no tocar `commit-msg`" SOLO en esos dos strings, sin tocar comportamiento.

## Hook contract

Contrato exacto de `.husky/prepare-commit-msg` (pseudocódigo POSIX sh de referencia; la
implementación real de APPLY debe seguir su **semántica** — todos los guards, la cadena de
identidad y el `exit 0` final —, sin copiar ciegamente el texto: donde `tasks.md` §1 o este mismo
documento marcan evidencia empírica (patrón del `sed`, guard bajo `set -e`), esa evidencia manda
sobre el pseudocódigo):

```sh
#!/bin/sh
# .husky/prepare-commit-msg — auto-signoff DCO. SOLO repara, NUNCA bloquea (exit 0 en todo camino).
# Arg $1 = fichero de mensaje; $2 = source (message|template|merge|squash|commit|vacío);
# $3 = SHA de origen (solo cuando $2=commit). Permitido: editar $1 in place.

msg="$1"
src="$2"

# D2 — merge commits exentos (git no tiene signoff para merge; ambos tools los exentan).
[ "$src" = "merge" ] && exit 0

# Sin fichero legible no hay nada que reparar — salir sin tocar nada.
[ -n "$msg" ] && [ -f "$msg" ] && [ -r "$msg" ] || exit 0

# D5 — idempotencia: interpret-trailers no duplica un valor idéntico, pero SÍ añade uno distinto.
# El grep es la guarda cargada (cubre también el caso hook + `-s` explícito, que corre ANTES).
# Case-sensitive sobre el mensaje completo (misma semántica que commit-msg).
grep -q "Signed-off-by:" "$msg" && exit 0

# D4 (ASSUMPTION) — identidad: committer primero (equivale a `git commit -s`), luego author.
ident=$(git var GIT_COMMITTER_IDENT 2>/dev/null) || ident=""
[ -n "$ident" ] || ident=$(git var GIT_AUTHOR_IDENT 2>/dev/null) || ident=""

# Quitar el sufijo " <epoch> <tz>" para quedar en "Name <email>".
# PATRÓN CORRECTO: `s/ [0-9]+ [+-][0-9]{4}$//` — `git var` imprime `Name <email> <epoch> <tz>`
# SIN `>` tras el tz (verificado 2026-10-18, git 2.52.0.windows.1); un patrón con `>` final jamás
# matchea y el `case` de abajo fallaría en cerrado → hook no-op silencioso en cualquier máquina.
# `|| signoff=""` ES OBLIGATORIO: Husky despacha como `sh -e "$s"` (set -e); sin el guard, un
# fallo de proceso de sed/printf (status ≠0, no "sin match") abortaría el script ANTES del `case`
# y BLOQUEARÍA el commit, violando "solo repara, nunca bloquea".
signoff=$(printf '%s\n' "$ident" | sed -E 's/ [0-9]+ [+-][0-9]{4}$//') || signoff=""

# Fallback: si no resolvemos nombre+email válidos, NO se adivina — salir sin editar.
# commit-msg seguirá siendo quien rechace si el trailer falta (vía autoritativa intacta).
# El `case` matchea la cadena COMPLETA (no es un grep): el `>` final del patrón exige que la
# cadena TERMINE en `>` — por eso, sin el strip correcto, caería a `*) exit 0` (fail-closed).
case "$signoff" in
  *" <"*">") ;;   # forma "Name <email>" presente (la cadena termina en `>`)
  *) exit 0 ;;    # no resoluble: sin editar, exit 0
esac

# D5 — inyección: bloque de trailers estrictamente parseable para el parser strict de CI.
git interpret-trailers --in-place --trailer "Signed-off-by: $signoff" "$msg" 2>/dev/null || true
exit 0
```

Propiedades contractuales:

- **Merge skip:** solo `$2 = "merge"` sale temprano; todos los demás orígenes (incluido ninguno)
  reciben el trailer sujeto a idempotencia.
- **Idempotencia:** `grep "Signed-off-by:"` sobre el mensaje completo ANTES de inyectar; el guard
  absorbe `-s` explícito, `--amend` sobre commit ya firmado, y replay de mensajes con trailer.
- **Cadena de identidad:** `GIT_COMMITTER_IDENT` → `GIT_AUTHOR_IDENT` → no resoluble ⇒ exit 0 sin
  editar. Nunca identidad hardcodeada; refleja overrides `GIT_*_NAME`/`GIT_*_EMAIL` y
  `user.name`/`user.email` porque la resolución es de git.
- **Inyección:** siempre vía `git interpret-trailers --in-place --trailer`; nunca `printf >>`.
- **Exit 0 en todos los caminos:** legibilidad dudosa, git ausente, identidad irresoluble, fallo
  de proceso de `sed`/`printf`, interpret-trailers fallando — nada aborta el commit. El rechazo por
  trailer ausente vive SOLO en `commit-msg` (único gate local, D1') y en el check `DCO` de CI (L3).
- **Regla `set -e` (general, load-bearing del no-bloqueo):** Husky ejecuta el hook como `sh -e
"$s"`, así que **todo comando con un estatus no-cero posible en este hook debe ir guardado**
  (`|| signoff=""`, `|| ident=""`, `|| exit 0`, `|| true`). Un `cmd && exit 0`, un `A || B || C` o
  la condición de un `if` no necesitan guard extra (`set -e` no aplica a esas posiciones), pero una
  asignación con command-substitution sí, porque su estatus es el de la sustitución. Sin el guard,
  el primer fallo de proceso convertiría el "solo repara" en un bloqueo ANTES del `case`.

## Layer model

| Capa   | Mecanismo                                                                   | Punto                 | ¿Suprimible?                                                                     | Rol                                                                                                               |
| ------ | --------------------------------------------------------------------------- | --------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **L0** | Identidad git (`user.name`/`user.email`, overrides `GIT_*_IDENT`)           | dev                   | n/a                                                                              | Fuente del nombre+email del trailer                                                                               |
| **L1** | `prepare-commit-msg` auto-signoff                                           | dev, antes del editor | **NO por `--no-verify`** (solo pre-commit y commit-msg lo son); sí por `HUSKY=0` | Garantiza el trailer por construcción                                                                             |
| **L2** | `commit-msg` presencia DCO (case-sensitive, antes de commitlint)            | dev, al hacer commit  | Sí (`--no-verify`, `HUSKY=0`)                                                    | **Único gate local de validación**                                                                                |
| **L3** | CI `KineticCafe/actions-dco@v3.2.0` (ruleset 21227644, `bypass_actors: []`) | GitHub, en el PR      | **NO**                                                                           | Único gate inbypasseable; parser strict del trailer; backstop del riesgo residual local (§Accepted residual risk) |

> `pre-push` **no es una capa DCO** (D1'): su bloque de re-check se elimina en este change; el hook
> conserva `git fetch origin main` + guard de `origin/main` y la sección de scoped tests (contrato
> `--changed origin/main`, §10.6 de `docs/CONTEXT-CICD.md`), que no validan DCO.
>
> **Desambiguación de taxonomías (obligatoria en toda doc de APPLY; la pidió el reviewer):** esta
> sección usa el **modelo de capas DCO** L0-L3 (identidad → inyección → validación local → CI).
> `docs/CONTEXT-CICD.md` §11.1 usa una taxonomía DIFERENTE, de **tiempos de ejecución**: L1 pre-commit,
> L2 pre-push, L2.5 PR title, L3 CI. No confundirlas ni renumerar los tiers de tiempo: el tier L1 de
> §11.1 contiene las capas DCO locales L1 (`prepare-commit-msg`) y L2 (`commit-msg`); el tier L2 de
> §11.1 (pre-push) NO es capa DCO (D1'); el tier L2.5 es ajeno al DCO; y el tier L3 de §11.1 ES la capa
> DCO L3 (CI). Todo documento escrito en APPLY debe declarar ambos esquemas y este mapeo, sin tratar
> los tiers de tiempo como capas DCO ni viceversa.

**Qué redundancia es defense-in-depth genuina vs fricción (tras D1'):**

- **L1→L2 (genuina, no fricción):** no son duplicados — L1 inyecta, L2 valida. L2 protege el caso
  en que L1 degradó a no-editar (identidad irresoluble) y cualquier mensaje que llegue sin trailer
  aunque L1 corriera. Coste práctico: cero (grep).
- **L2→L3 (fricción mínima, aceptada por diseño shifting-left):** L3 repite la comprobación de
  presencia de L2 con autoridad (parser `strict`, posición e identidad del trailer). Esa
  duplicación es el propósito del modelo — feedback en segundos + red de seguridad inbypasseable —,
  no accidental.
- **Redundancia ELIMINADA (D1'):** el antiguo re-check de `pre-push` repetía sobre el rango
  pusheado la misma validación de presencia de `commit-msg`. Todo commit local ya pasó por L2 al
  nacer y `--no-verify` no suprime L1 (el trailer existe por construcción), así que solo añadía
  coste por push (caminata `git log` por commit del rango) sin cobertura nueva; su única cobertura
  real — commits que no pasaron por los hooks — queda como riesgo residual aceptado con backstop en
  L3 (§Accepted residual risk).
- **Única fricción real y su mitigación:** hook + `-s` explícito podrían duplicar el trailer —
  `-s` corre ANTES del hook, así que el hook lo ve presente y el guard `grep` (load-bearing, D5)
  sale sin inyectar; `interpret-trailers` no duplicaría un valor idéntico, pero añadiría uno
  distinto. Y las únicas capas que pueden desaparecer enteras son L1-L2 con `HUSKY=0` — aceptado
  porque L3 (CI) permanece inbypasseable.

## Accepted residual risk (D1')

Eliminar el re-check de `pre-push` (D1') significa que **los commits que entran al historial local
sin pasar por los hooks ya NO se detectan en el dev** — ni al hacer commit (`commit-msg` no corre o
nunca ve el mensaje) ni al empujar (el re-check ya no existe). Casos concretos, conscientemente
aceptados:

- cherry-pick o rebase de commits de una rama ajena cuyos mensajes carecen de trailer,
- `HUSKY=0` / hooks desactivados (`core.hooksPath` apuntando a otro sitio, `husky:disable`),
- commits anteriores a este change (historial existente sin trailer),
- tooling GUI que salta hooks,
- `--no-verify` combinado con identidad irresoluble (L1 sale sin editar y L2 está suprimido).

**Control compensador:** todos esos commits alcanzan CI, donde el check `DCO`
(`KineticCafe/actions-dco@v3.2.0`, required + blocking en el ruleset 21227644, `bypass_actors: []`)
los rechaza antes del merge. La detección se desplaza de "segundos, en el push" a "en el PR", pero
el gate inbypasseable no se pierde: solo se pierde el feedback más temprano.

**Trade-off aceptado conscientemente:** se cambia latencia de feedback (push → PR) por eliminar la
duplicación de `commit-msg` y su coste por push, manteniendo intacto el backstop CI. La
compensación estructural es que el 100 % de los commits creados en este clone reciben el trailer
por construcción (L1) y son validados al nacer (L2); los casos de arriba son exactamente los que L2
no ve, y para ellos L3 es el control. Debe documentarse como decisión en `docs/learning/dco.md`
(tarea 4.6) y en `docs/CONTEXT-CICD.md` §10.1/§10.3/§11.1 (tareas 5.2/5.3).

## Enforcement tool comparison

| Herramienta                                                                             | Punto de enforcement                                                                     | Bloquea                                      | Parsing / identidad                                                                                                                                                                                         | Bots / merge                                                                                | Nota                                                                                                                                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **KineticCafe/actions-dco@v3.2.0** (gate actual)                                        | CI: status check required + blocking, ruleset 21227644                                   | Sí, inbypasseable (`bypass_actors: []`)      | `git interpret-trailers`; `strict` por defecto (bloque final único, sin texto tras el bloque); `lenient` opcional; nombre+email válidos; identidad de author O committer; `exempt-authors`/`alias-signoffs` | `bot.policy`: `all` (default upstream) / `well-known` / `allowlist` / `none`; merge exentos | **Estado de este repo (verificado, `.github/workflows/ci.yml` job `dco` L397-402): YA `well-known` con `categories = ["dependency-updaters"]`** — no hay nada que endurecer; `all` es solo el default upstream de KineticCafe (nuance: un `.github/dco-check.toml` en la default branch sobrescribiría el `config:` del workflow) |
| **probot `dcoapp/app`**                                                                 | GitHub App sobre PRs                                                                     | Sí (con botón de override para write-access) | El más estricto: el email del trailer DEBE igualar al email del **author**                                                                                                                                  | Bots y merge exentos por defecto                                                            | Rompería con trailers de committer en cherry-pick; este repo no lo usa                                                                                                                                                                                                                                                            |
| **`tim-actions/dco`**                                                                   | CI: action                                                                               | Sí (falla el job)                            | Solo presencia, sin config documentada                                                                                                                                                                      | —                                                                                           | Mínimo, sin tunabilidad                                                                                                                                                                                                                                                                                                           |
| **GitLab push rule (15.5+)**                                                            | Server-side (push)                                                                       | Sí, solo admin                               | Regex única `Signed-off-by:.+<.+@.+>` — solo presencia                                                                                                                                                      | —                                                                                           | Referencia cross-ecosistema; no aplica a GitHub                                                                                                                                                                                                                                                                                   |
| **Hooks locales (este change)**                                                         | Dev: L1 auto-signoff + L2 validación (único gate local; sin re-check en `pre-push`, D1') | L2 sí; L1 nunca                              | grep presencia; committer→author                                                                                                                                                                            | Merge exentos (D2)                                                                          | Bypasseable con `--no-verify`/`HUSKY=0` salvo que L3 (CI) respalde (riesgo residual: §Accepted residual risk)                                                                                                                                                                                                                     |
| **git nativo** (`-s`, `rebase --signoff`, `am -s`, `format-patch -s`, `cherry-pick -s`) | Mecánica de trailers de git                                                              | n/a                                          | Signoff = **committer**; sin deduplicación garantizada en todos los flujos; sin flag de signoff para `git merge`                                                                                            | —                                                                                           | El hook replica esta semántica exacta; el guard `grep` cubre lo que git no garantiza                                                                                                                                                                                                                                              |

## Critical correction: the commit.signoff myth

**`commit.signoff` NO es una variable de configuración de git.** `git commit` la ignora y no
inyecta ningún trailer. Evidencia verificada (git 2.52.0.windows.1):

1. `git help --config` **no lista** `commit.signoff`.
2. En un repo desechable con `commit.signoff=true`, un commit **sin** `-s` produjo un mensaje
   **sin** `Signed-off-by`, mientras que el control **con** `-s` produjo
   `Signed-off-by: Test User <test@example.com>`.
3. Upstream (gitfaq, Junio Hamano): git "does not (and will not) have a configuration variable to
   enable the `--signoff` command line option by default" — deliberadamente, para **proteger el
   valor legal de la intención de sign-off**.
4. `format.signoff` sí existe pero aplica solo a `format-patch`/`am`/`send-email`, no a `git commit`.

- La documentación del proyecto está **equivocada** (`docs/CONTEXT-CICD.md`) o **incompleta**
  (`AGENTS.md`) y este change la corrige/extensiona. Ficheros exactos a tocar en APPLY:
  - `docs/CONTEXT-CICD.md` **§10.5** — afirma que `git config --global commit.signoff true`
    "inyecta automáticamente el trailer `Signed-off-by:`" en cada commit. Falso: es no-op.
  - `docs/CONTEXT-CICD.md` **§10.3**, **§10.4** y **§11.1** (tabla de capas shifting-left), más la
    entrada de verificación del header — repiten la convención como si funcionara. (§10.2 no
    contiene mención literal de `commit.signoff` — verificado —, así que no hay mito allí que corregir; su nota sobre
    `--no-verify` sí se actualiza al modelo nuevo — task 5.2 de `tasks.md`).
  - `AGENTS.md` — **no repite el mito: omite el signoff por completo** (no menciona
    `commit.signoff` ni la convención). No hay nada que corregir allí, sino un hueco que
    **EXTENDER**: la sección de convenciones de commit debe documentar el mecanismo real (`-s` +
    hook `prepare-commit-msg`) y la convención `git commit -S -s`.
  - `.husky/commit-msg` **línea ~14** — el guidance de error del propio hook recomienda
    `git config --global commit.signoff true` como alternativa al `-s`, propagando el mito dentro
    del hook. Corrección SOLO de DOS strings (D7, tarea 5.8): la guidance (`git commit -s` /
    `git commit --amend -s` + nota del auto-signoff vía `prepare-commit-msg`) y la etiqueta del
    comentario de cabecera `# DCO check (L1)` → `# DCO check (L2)`; lógica DCO byte-idéntica.
  - \*\*Seis docs que afirman que `pre-push` valida DCO — corrección documental aprobada en este change
    (solo texto, zero behaviour change; el barrido de `tasks.md` 5.6/5.9 debe cazar a los seis):
    `docs/learning/ci-cd/05e-pr-metadata-governance.md` (L133-137, OBLIGATORIO — scenario 1 MODIFIED
    del delta `local-commit-all-dco` —, tarea 5.9), `CONTRIBUTING.md:58`,
    `docs/learning/ci-cd/01-git-y-yaml.md:141`, `docs/learning/secret-scanning.md:157`,
    `docs/learning/test-impact-analysis.md:264` y `docs/analisis-producto-terminado-erp.md:207`
    (tarea 5.6).
- La corrección se codifica como requirement ADDED en
  `specs/dco-documentation/spec.md` ("Documentation correctly debunks the commit.signoff myth"),
  con escenarios: mito refutado con evidencia, docs obsoletos corregidos, y la convención nunca
  presentada como funcional.
- **Matiz legal a declarar explícitamente (no ocultar):** automatizar el sign-off debilita el
  argumento de "intención deliberada" que git upstream esgrime para negar `commit.signoff`. Se
  acepta conscientemente para un repo privado de equipo ya gobernado por el check CI required +
  blocking e inbypasseable (L3): la intención queda atestiguada por la identidad real del
  committer y por la validación autoritativa, no por un clic recordatorio. Debe documentarse como
  decisión en `docs/learning/dco.md`.

## Pitfalls and risks

- **Commits web-flow (GitHub UI) no corren hooks de repo** → no reciben auto-signoff local; GitHub
  no ofrece "commit and sign off" (GitLab sí). Mitigación: commits de reparación locales
  (`--amend`, revert) o exención/alias; documentado como pitfall.
- **Squash-merge puede perder trailers en `main`** (`squash_merge_commit_title=PR_TITLE` +
  `squash_merge_commit_message=COMMIT_MESSAGES`, gotcha de trailers multi-commit). La cláusula DCO
  (d) trata el historial público como registro permanente de la attestación; merge/rebase la
  preservan y los tres métodos están permitidos. Mitigación: documentar; preferir squash de PR de
  un commit o rebase-merge cuando la preservación importe.
- **Commits de bots:** Dependabot autorea con
  `49699333+dependabot[bot]@users.noreply.github.com`. **Estado de este repo (verificado): la bot
  policy YA es `well-known` con `categories = ["dependency-updaters"]` en
  `.github/workflows/ci.yml` (job `dco`, L397-402) → solo se exime a los bots de dependencias
  conocidos; NO hay cambio que hacer (la tarea 4.6 documenta la política ACTIVA, no una
  recomendación de cambio).** Matices upstream, claramente separados del estado actual: el DEFAULT
  de KineticCafe es `all` (eximiría cualquier bot), y un `.github/dco-check.toml` en la default
  branch tendría prioridad sobre el `config:` del workflow — si apareciera, re-verificar que no
  restaura `all`.
- **`release.yml` commitea/taggea como App/web-flow** sin hook local → misma clase que web-flow; el
  re-check de firma del tip ya existe allí.
- **Duplicación hook + `-s`:** `-s` corre ANTES de invocar al hook → el guard `grep` ve el trailer
  presente y no inyecta (load-bearing, D5; `interpret-trailers` no duplicaría un valor idéntico,
  pero añadiría uno distinto); test explícito de idempotencia bajo `-s`.
- **Cherry-pick conserva el trailer original pero crea un committer nuevo** → rompería matchers
  estrictos author==trailer (probot), no el gate de este repo (KineticCafe acepta author o
  committer).
- **`HUSKY=0` desactiva L1-L2 de golpe** → aceptado: L3 (CI) permanece inbypasseable. Con el
  re-check de `pre-push` eliminado (D1'), el mismo vale para cualquier commit que entre al
  historial sin pasar por los hooks — ver §Accepted residual risk (casos y control compensador).
- **Automatización vs intención legal** → declarado arriba y en el doc (APPLY), no oculto.
- **Fallo de proceso de `sed`/`printf` bajo `set -e` (corrige la garantía de no-bloqueo):** Husky
  despacha los hooks como `sh -e "$s"`; una asignación sin guardar (`signoff=$(… | sed …)`) con
  estatus ≠0 abortaría el script ANTES del `case` y **bloquearía** el commit — el `case` `*) exit 0`
  solo cubre "sed corrió pero no hubo match", no el fallo de proceso. Por eso la asignación lleva
  `|| signoff=""` y rige la regla general: **todo comando con estatus no-cero posible va guardado**
  (`|| …`); sin guardar, `set -e` convierte ese fallo en un bloqueo. El `*) exit 0` queda como
  segunda barrera (fail-closed sin editar), no como garantía única de no-bloqueo.
- **`sed -E` en entornos exóticos:** soportado por GNU/BSD/MSYS2; con el guard anterior, cualquier
  fallo de `sed` degrada a `signoff=""` → `case` → `exit 0` sin editar (nunca inyección corrupta,
  nunca bloqueo).
- **Casos borde del fichero de mensaje (verificados en `tasks.md` 3.13):** (a) **CRLF** en
  `COMMIT_EDITMSG` dejado por un editor Windows → el hook no bloquea y la inyección produce un
  trailer parseable; (b) **identidad UTF-8 con acentos** (`José Pérez <…@…>`) → el trailer sale
  byte-idéntico (`interpret-trailers` no normaliza ni transcodifica); (c) **fichero de mensaje
  vacío** → exit 0 sin bloquear, registrando el resultado de la inyección sobre vacío; (d)
  **`commit.template` con un ejemplo literal `Signed-off-by:`** → HAZARD: el guard `grep` de
  presencia lo trata como trailer real y SUPRIME la inyección de la identidad del committer, y
  `commit-msg` (también solo-presencia) lo daría por válido — la discrepancia solo saltaría tarde,
  en CI (parser `strict`, identidad). Este repo NO tiene `commit.template` hoy
  (`git config --get commit.template` vacío); workaround documentado: no poner ejemplos literales
  en el template o pasar `-s` explícito.

## Testing strategy

Todos los escenarios se ejecutan en un **repo desechable** (tmp) con el hook copiado, no contra el
repo real, y en Git Bash/MSYS2 (Windows) como plataforma primaria, más macOS/Linux cuando haya
ejecución disponible:

1. **Merge skipped:** merge commit (`$2=merge`) → mensaje intacto, exit 0, sin trailer añadido.
2. **Idempotencia bajo `-s` explícito:** `git commit -S -s` (convención del repo) → el guard grep
   detecta el trailer → exactamente uno en el resultado.
3. **Re-entrada con `--amend`:** `git commit --amend --no-edit` sobre commit ya firmado → sin
   duplicado; y `--amend` sobre commit hecho con `--no-verify` sin trailer → el hook lo repara
   (vía de reparación retrógrada).
4. **Mensaje sin body vs con body:** commit solo con asunto y commit con cuerpo → ambos terminan
   con bloque de trailers válido.
5. **Compatibilidad strict-parse:** `git interpret-trailers --parse <msg>` round-tripea el mensaje
   final → bloque único de trailers sin texto no-trailer tras él (requisito del parser strict de
   KineticCafe).
6. **Exit 0 con identidad irresoluble:** entorno sin `user.name`/`user.email` ni overrides → hook
   sale en 0 sin editar → `commit-msg` rechaza con su guidance habitual (comportamiento intacto).
7. **Fallback a author:** `GIT_COMMITTER_IDENT` ausente/rota con author ident válida → se usa
   author.
8. **`commit-msg` intacto + `pre-push` sin lógica DCO (D1'):** (a) los escenarios de `commit-msg`
   del delta `specs/local-dco-validation/spec.md` siguen pasando igual (rechazo por ausencia con rc
   1 y salida `❌ DCO:` ANTES de que commitlint corra; rc 0 con trailer; merge skip) — las únicas
   ediciones permitidas son DOS strings (tarea 5.8): la guidance y la etiqueta de cabecera `# DCO check (L2)`, con la lógica DCO byte-idéntica; (b) **afirmaciones de eliminación** en
   `.husky/pre-push`: `grep -c 'Signed-off-by' .husky/pre-push` = 0, `grep -c 'DCO'
.husky/pre-push` = 0 (ninguna lógica DCO residual), `grep -c 'git fetch origin main'
.husky/pre-push` ≥ 1 y el guard de `origin/main` presentes (los scoped tests dependen de
   `--changed origin/main`), `grep -c 'test:changed' .husky/pre-push` = 2,
   `sh -n .husky/pre-push` rc 0; (c) invocación manual de `pre-push` por STDIN con commits sin
   trailer contra un origin bare local → la salida NO contiene salida DCO y el rc lo determinan SOLO
   los scoped tests (alcanza `Running scoped tests (server)...`); cero riesgo de push real (nunca
   hay `git push`).
9. **Sobrevive a `--no-verify`:** `git commit --no-verify` → L1 inyecta igualmente (no está
   suprimido), probando la propiedad que motivó la elección del hook.
10. **Cross-platform:** mismo trailer canónico en Git Bash/MSYS2, macOS y Linux; condición
    plataforma-imposible → exit 0.
11. **CRLF desde editor Windows:** mensaje con finales de línea CRLF (como dejaría un editor
    Windows en `.git/COMMIT_EDITMSG`) → hook exit 0, trailer parseable, sin bloqueo.
12. **Identidad UTF-8 acentuada:** `GIT_COMMITTER_NAME="José Pérez"` →
    `Signed-off-by: José Pérez <…>` byte-idéntico y `git interpret-trailers --parse` = 1 línea.
13. **Fichero de mensaje vacío:** hook exit 0 sin bloquear; se registra qué produce la inyección
    sobre un fichero vacío (comportamiento documentado, no asumido).
14. **`commit.template` con ejemplo literal `Signed-off-by:`** → el guard `grep` suprime la
    inyección de la identidad real (hazard de §Pitfalls; este repo no tiene template): verificar
    que el hook no bloquea y documentar el workaround (`-s` o quitar el ejemplo literal).

## References

- https://developercertificate.org/
- https://wiki.linuxfoundation.org/dco
- https://openinfra.org/dco/
- https://docs.openstack.org/contributors/common/dco.html
- https://git-scm.com/docs/githooks
- https://git-scm.com/docs/git-commit
- https://git-scm.com/docs/git-interpret-trailers
- https://github.com/git/htmldocs/blob/gh-pages/gitfaq.adoc
- https://typicode.github.io/husky/
- https://typicode.github.io/husky/how-to.html
- https://github.com/KineticCafe/actions-dco
- https://github.com/dcoapp/app
- https://github.com/tim-actions/dco
- https://docs.gitlab.com/ee/user/project/repository/push_rules/
- https://github.com/moby/moby/blob/master/CONTRIBUTING.md
- Repo: `docs/CONTEXT-CICD.md` §10.1-§10.6/§11.1, `.husky/commit-msg`, `.husky/pre-push`,
  `.github/workflows/ci.yml` (job `dco`), `proposal.md`, `specs/local-dco-validation/spec.md`,
  `specs/dco-documentation/spec.md`
