# Design

## Context

Ver `proposal.md` (Why) para la motivación. Solo el estado actual que condiciona el HOW:

- **Hooks actuales**: `.husky/pre-push` (68 líneas; cabecera `#!/bin/sh` + **`set -e` en L2**) = `git fetch
origin main --depth=1` (L6) + guard de `origin/main` (L9-14) + **bloque DCO (L16-49)** + tests scoped (L51-68);
  `.husky/pre-commit` y `.husky/commit-msg` **no contienen ninguna verificación de firma**. El change activo
  `local-dco-auto-signoff` es quien **borra las líneas 16-49** (su task 1.6) y deja `pre-push` en fetch + guard +
  tests.
- **Clon actual**: es **shallow** (`test -f .git/shallow` → sí), así que el hook —y su fallback de primer push—
  opera sobre `--depth=1`.
- **Trust store hoy**: `gpg.ssh.allowedSignersFile = C:/Users/user/.ssh/allowed_signers` (global, no versionado);
  no existe ningún `allowed_signers` versionado en el repo (glob = 0). Contenido actual: 2 líneas con principal
  `jamaringarciabusiness@gmail.com namespaces="git" ssh-ed25519 …`.
- **Enforcer autoritativo**: CI `Verify Commit Signatures` + ruleset 21227644 (`required_signatures`,
  `enforcement: active`, auditoría API 2026-10-18). El gate de este change es **L2 temprano**, no un sustituto.
- **Evidencia medida (2026-10-18, git 2.52.0.windows.1) que gobierna las decisiones** (NO re-medir):
  1. `origin/main` tip `8dc24d6e` (squash PR #140, web-flow) → `%G? = E` y `git verify-commit` → **exit 1**
     (`gpg: Can't check signature: No public key`), incluso con trust store configurado.
  2. Trust store ausente/no configurable → `Unable to open allowed keys file … No such file or directory` /
     `No principal matched` → **exit 1**; y `%G? = N` para un commit **SÍ firmado**.
  3. Firma de clave **ajena** al trust store → `No principal matched` → `%G? = U` y `verify-commit` exit 1.
  4. Ruta relativa `allowed_signers` → resuelta contra el **top-level del worktree**, no contra el CWD
     (probado desde un subdirectorio).
  5. Commit sin firma → `%G? = N`; commit local firmado con trust store OK → `%G? = G`.
  6. `ssh-keygen -Y` disponible en MSYS2 (mismo toolchain que git 2.52.0.windows.1).
  7. **Wire STDIN de `pre-push`** (banco desechable): push de actualización =
     `refs/heads/main <sha-nuevo> refs/heads/main <sha-previo>` (el **mismo string** de nombre en `LOCAL_REF` y
     `REMOTE_REF`), y borrado = `(delete) <sha-nulos> refs/heads/<rama> <remote-sha>` (**`(delete)` en
     `LOCAL_REF`**, nunca en `REMOTE_SHA`); grep completo de `ci.yml` → **0 matches** de `(delete)`, SHA nulo,
     `origin/main..HEAD` y `--no-merges`.

## Goals / Non-Goals

**Goals:**

- Detectar en el dev, antes del push y a coste de milisegundos, los commits **sin firma** (`N`) y con
  **firma corrupta** (`B`) posteriores al cutoff, con mensajes accionables por commit.
- Aplicar el gate a **TODAS las ramas** (`refs/heads/*`), no solo a `main` — más estricto que el ruleset
  (que solo protege `~DEFAULT_BRANCH`); los únicos escapes son los explícitos del hook (`HUSKY=0` /
  `git push --no-verify`).
- Hacer el trust store **reproducible en cualquier clon** (versionado en la raíz) sin depender de config por
  máquina, y degradar de forma **no bloqueante** cuando el trust store no resuelva.
- Paridad **de cutoff** con `ci.yml:115` (`SIGNING_ROLLOUT_DATE || '2026-08-01'`) y de **enumeración** con el
  **contrato STDIN de `pre-push`** (formato de línea verificado 2026-10-18) — no con la enumeración de CI, que
  no comparte ese contrato.
- Documentar el gate en `docs/CONTEXT-CICD.md` (§10/§11/§12) y corregir su deuda factual de §3.5 (GOVERNANCE puro).

**Non-Goals:**

- **Cero DCO**: este change no menciona, asume ni toca validación de trailers `Signed-off-by:` (Regla dura de scope).
- **No se gatean tags**: los refs `refs/tags/*` se **omiten** del gate — el repo crea tags vía `changeset
git-tag` y hoy `release.yml` está `disabled_manually` (auditoría 2026-10-18); una línea de tag no representa
  commits nuevos de rama.
- No se modifica `ci.yml`, el ruleset 21227644, la protección clásica, `.husky/pre-commit` ni `.husky/commit-msg`.
- No se introduce red nueva, ni dependencias npm, ni cambios de comportamiento de los tests scoped.
- No se corrige `ruleset-expansion` (divergencia registrada en D11) ni se edita `local-dco-auto-signoff`
  (colisión de edición y de contenido registradas en D5/D11); ninguna capability de otro stage
  (Regla 4 de `docs/CONTEXT-CICD.md`: el change es íntegramente GOVERNANCE / PRE-PR-merge).

## Decisions

### D1 — Trust store versionado en la raíz del repo

**Elegido**: fichero `allowed_signers` en la **raíz del worktree**, versionado en git, con solo claves públicas.

| Alternativa                                          | Por qué no                                                                                                                                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `~/.ssh/allowed_signers` por máquina (estado actual) | No versionado: en un clon fresco o máquina nueva no existe → `verify-commit` exit 1 y `%G?` misinterpretable; cada dev mantiene su copia → deriva silenciosa                     |
| Trust store consultando la **API de GitHub**         | Red nueva, latencia, y requiere token en el hook; el gate sería dependiente de GitHub para validar algo local; además `commit-signing-ci-verification` ya reserva la API para CI |
| **Keyring GPG**                                      | El repo firma con **SSH** (`gpg.format = ssh`); un keyring GPG no valida firmas `sshsig`                                                                                         |

**Trade-off asumido**: el trust store es ahora un artefacto compartido → alta/baja de claves por PR (D9) en lugar
de edición local instantánea.

### D2 — Política híbrida de clasificación `%G?`

**Elegida** (comprometida en Fase 0): `G` → pasa · **`N` → 🛑 bloquea** · **`B` → 🛑 bloquea** ·
**`E`/`U`/`X`/`Y`/`R` → ⚠️ warning con motivo, no bloquea** — con short-SHA + motivo por commit y **un único
`exit 1` al final del bucle** si algún commit queda bloqueado (todas las líneas STDIN se evalúan y se **acumulan**:
un push multi-rama reporta los fallos de todas las ramas, no se corta en la primera).

Complementos de la política (ya especificados en el delta):

- **`*)` explícito → fail-open con warning** para cualquier letra futura de `%G?` (nunca bloqueo silencioso).
- **Motivo de `U` distinguible**: «clave ausente del trust store local» (`No principal matched`, causa más común:
  dev sin su clave dada de alta vía PR) ≠ clave expirada/revocada (`X`/`Y`/`R`).
- **Remediación accionable en el bloqueo** (`N`/`B`): `git commit --amend -S` para el commit más reciente,
  `git rebase origin/main --exec 'git commit --amend --no-edit -S'` para los anteriores + puntero al setup de
  firma (`05b-commit-signing.md`); **nunca** recomendar `git rebase --signoff` (no re-firma: solo añade el
  trailer `Signed-off-by:`; además todo `rebase` destruye las firmas existentes).

**Justificación obligatoria de la no-estrictidad**: el tip de `origin/main` **`8dc24d6e`** (squash del PR #140,
firmado por la GPG key de **web-flow**) da localmente **`%G? = E`** y `git verify-commit origin/main` →
**`exit 1`** (`gpg: Can't check signature: No public key`), medido 2026-10-18 incluso con trust store
configurado. **Descartado explícitamente el gate "todo debe dar `G`"**: rompería pushes legítimos
(los squash de web-flow y cualquier firma no comprobable localmente) y convertiría el gate local en un obstáculo
mayor que CI, que es quien debe ser autoritativo.

### D3 — Alcance de SHAs: enumeración propia por STDIN (contrato STDIN de `pre-push`)

**Elegido**: el hook lee sus propias líneas de STDIN (`<local-ref> <local-sha> <remote-ref> <remote-sha>`) y
decide por campo, con el wire verificado 2026-10-18 (Contexto, evidencia 7):

1. **Omite tags**: cualquier línea con `LOCAL_REF`/`REMOTE_REF` bajo `refs/tags/*` → fuera del gate (Non-Goal H2).
2. **Omite borrado y SHA nulo**: `(delete)` llega en **`LOCAL_REF`** (y su `LOCAL_SHA` es nulo) — nunca en
   `REMOTE_SHA`; se descarta la línea sin evaluar.
3. **Primer push de rama nueva** (`REMOTE_SHA` nulo): fallback **`origin/main..$LOCAL_SHA --no-merges`**. Se usa
   el `LOCAL_SHA` que trae el propio STDIN (el tip real de la rama pusheada); **`HEAD` sería incorrecto** porque
   evaluaría la rama _actualmente checked-out_ → falso pase o falso bloqueo al pushear una rama que no es la
   actual. El `git fetch origin main --depth=1` previo del hook garantiza que `origin/main` existe (clon shallow).
4. **Cualquier otro caso**: rango por **SHAs** **`$REMOTE_SHA..$LOCAL_SHA --no-merges`**. El rango por **nombres**
   (`$REMOTE_REF..$LOCAL_REF`) es un **no-op de 0 commits**: en el wire real `LOCAL_REF` y `REMOTE_REF` son el
   **mismo string** (`refs/heads/<rama>`), verificado en banco desechable 2026-10-18.
5. **Sin filtro de rama**: se evalúan todas las ramas `refs/heads/*` (H5), incluidas las que el ruleset no cubre.

- **Paridad re-atribuida**: la paridad con CI es **solo de cutoff** — `SIGNING_ROLLOUT_DATE || '2026-08-01'`
  (`ci.yml:115`, la línea que define `ROLLOUT_DATE`). **No hay paridad de enumeración con CI**: el grep de todo
  `ci.yml` devuelve **0 matches** de `(delete)`, SHA nulo, `origin/main..HEAD` y `--no-merges` (2026-10-18). La
  paridad de enumeración es con el **contrato STDIN de `pre-push`** (lo que git realmente escribe en ese hook).
- **`--no-merges` justificado**: el repo tiene **0 merge commits** (`required_linear_history` + merge squash
  exclusivo) → no se pierde ningún commit real y se evita evaluar merges históricos que nadie firma.
- **Alternativas descartadas**: (a) reutilizar el bucle DCO existente — no puede reutilizarse: (a1) pertenece a
  `local-dco-auto-signoff`, que lo **borra** (task 1.6, líneas 16-49); (a2) su salida (`DCO_FAILED` de trailers) no
  es la clasificación `%G?`; (b) rango por nombres de ref → no-op de 0 commits (arriba); (c) fallback sobre `HEAD`
  → evalúa la rama checked-out, no la pusheada.

### D4 — Grandfathering `SIGNING_ROLLOUT_DATE` (paridad de cutoff con CI)

**Elegido**: eximir todo commit cuyo `author.date` ISO-8601 sea estrictamente anterior a `SIGNING_ROLLOUT_DATE`
(default **`2026-08-01`**, sobrescribible por env), comparación **lexicográfica sobre ISO-8601** — misma regla y
mismo default que `vars.SIGNING_ROLLOUT_DATE || '2026-08-01'` (`ci.yml:115`). Los grandfathered se reportan como
exentos y **nunca bloquean**.

- **Ventana ±TZ declarada**: CI compara el `author.date` de la API en **UTC** (`Z`, p. ej.
  `2026-07-15T10:30:00Z`) y el hook compara `%aI` **local con offset** (p. ej.
  `2026-07-15T12:30:00+02:00`) → la divergencia posible queda acotada a **±14 h** (rango extremo de offsets) y
  **solo** afecta a commits históricos **alrededor** de `2026-08-01`; aceptado y declarado en la spec.
- **Paridad condicionada**: la paridad con CI depende de que **`vars.SIGNING_ROLLOUT_DATE` siga indefinida** en
  GitHub (verificado 2026-10-18: existe solo `CI_MINIMAL`); si se definiera allí, el hook **no lo detecta sin
  red** y seguiría con su default/env → queda como **sincronización manual** documentada, no silenciosa.
- **Alternativas descartadas**: (a) sin cutoff → bloquearía cientos de commits históricos no re-firmables sin
  reescribir historia; (b) cutoff distinto al de CI → divergencia local/CI en el mismo rango (local pasaría y CI
  fallaría, o viceversa).
- **Rationale de fecha**: los commits anteriores al rollout no se pueden firmar retroactivamente sin reescribir
  historia; CI ya los exoneraba, y este gate hereda exactamente el mismo corte.

### D5 — Cero DCO, orden de aplicación y colisión con `local-dco-auto-signoff`

**Elegido**: este change **no contiene ninguna lógica DCO** (no inspecciona `Signed-off-by:`, no menciona DCO en
el hook) y **asume el `pre-push` post-DCO** del change activo `local-dco-auto-signoff`, que es el **dueño** de
borrar las líneas 16-49 del hook actual (su **task 1.6**).

- **Orden de gates obligatorio: DCO → firma.** La task 1.6 de `local-dco-auto-signoff` manda "borrar SOLO las
  líneas 16-49" sobre el hook tal y como está hoy: **si este change se aplicara primero**, esa tarea
  eliminaría el bloque de firma recién insertado (quedaría dentro de las líneas 16-49) — o peor, lo dejaría a
  medias. Por eso la inserción del bloque de firma debe aplicarse **sobre el hook ya post-DCO** (o, si se hacen
  en paralelo, re-validando que el diff de 1.6 no toca el bloque de firma).
- **Colisión de edición en `docs/CONTEXT-CICD.md` (reserva registrada, sin editar el otro change)**: los dos
  changes reescriben **las mismas filas** — §10.1 (tabla de los hooks: fila `pre-push`) y §11.1 (tabla de capas,
  fila L2). Queda registrado aquí para que la implementación aplique **DCO → firma sobre el texto ya
  reescrito**, en un solo paso por sección, sin revertir cambios del otro change.
- Tras la eliminación DCO, el `pre-push` queda en `git fetch origin main --depth=1` + guard de `origin/main` + tests
  scoped; **este change añade su bloque de firma como único recorredor del rango de push** (su enumeración por
  STDIN es propia e independiente — D3) y **entre el guard y los tests**.
- **Verificación cruzada**: `grep -c 'Signed-off-by' .husky/pre-push = 0` y `grep -c 'DCO' .husky/pre-push = 0`
  tras aplicar ambos cambios (ausencia de lógica de origen en el hook resultante).
- **Alternativa descartada**: mezclar firma y DCO en un mismo bloque → mezclaría stages/ownership, duplicaría
  enumeración y violaría el límite de scope comprometido. **Alternativa también descartada**: editar el
  `tasks.md`/specs de `local-dco-auto-signoff` para reordenarlo → fuera de scope (no se edita otro change).

### D6 — Ubicación y orden del bloque

**Elegido**: orden literal `fetch` → `guard de origin/main` → **bloque de firma** → `tests scoped`.

- La firma cuesta **milisegundos por commit** (operación local, sin red) y los tests son **caros** → la firma se
  evalúa **siempre** (es la primera barrera), y los tests solo corren **si la firma pasa**; si el gate bloquea
  (`exit 1`), los tests **no llegan a ejecutarse**.
- El bloque va **después** del `fetch`/guard porque su fallback de primer push (`origin/main..$LOCAL_SHA`,
  D3) **depende** de que `origin/main` exista localmente y esté actualizada (mismo motivo por el que el bloque
  DCO antiguo también iba ahí).
- El hook **no invoca `git verify-commit`** en runtime (solo `%G?`, D10) — `verify-commit` se usa como evidencia
  en diagnóstico/documentación, nunca dentro del bloque.
- **Alternativas descartadas**: (a) en `pre-commit`/`commit-msg` → no hay rango de push todavía (no se puede
  enumerar por STDIN) y encarecería cada commit; (b) tras los tests → se pagarían tests para un push que va a ser
  rechazado.

### D7 — Preflight obligatorio del trust store (no bloqueante)

**Elegido**: antes de clasificar, resolver `allowed_signers` desde la raíz del worktree y comprobar (a) que
existe y es legible, (b) que **la ruta absoluta que el hook pasará con `-c gpg.ssh.allowedSignersFile=<abs>`**
(derivada de `git rev-parse --show-toplevel`) existe y es legible — **sin leer la config de la máquina** — y (c)
que `ssh-keygen` está en el `PATH`. Si algo falla → **warning con motivo y continúa sin bloquear por firma** (los
tests scoped siguen su curso). **Un mismatch de principal no es fallo de preflight**: si el fichero resuelve pero
el principal no coincide, el preflight pasa y la clasificación devuelve `U` (D2).

**Evidencia dura que lo obliga**: medido 2026-10-18 con git 2.52.0.windows.1, **sin trust store configurable un
commit SÍ firmado se clasifica como `%G? = N`** (git imprime `error: gpg.ssh.allowedSignersFile needs to be
configured and exist for ssh signature verification`). Como `N` **bloquea** (D2), **sin preflight el gate
bloquearía pushes con commits firmados** — exactamente el fallo que el diseño debe evitar en clon fresco /
máquina nueva. Adicionalmente, con la ruta configurada pero **inexistente**, `git verify-commit` devuelve un
**error duro `exit 1`** (`Unable to open allowed keys file "…": No such file or directory` + `No principal
matched`) — no existe estado "unverified" en ese camino.

- **Alternativas descartadas**: (a) bloquear si falta el trust store → rompe clon fresco (peor que no gatear);
  (b) crear el fichero desde el hook → el gate escribiría en el worktree (inaceptable en un hook) y ocultaría el
  problema de config; (c) fiarse de la config global de la máquina → es exactamente el hueco que D1 cierra.
  _(Contra la opción "sin preflight"):_ se convertiría cualquier problema de configuración en un bloqueo de push
  con commits firmados — inaceptable para una capa L2.

### D8 — Resolución de la ruta del trust store

**Elegido (doble vía)**: (1) el **hook** pasa `-c gpg.ssh.allowedSignersFile=<abs>` derivado de
`git rev-parse --show-toplevel` → determinista, **independiente de la config global** de cada máquina y con
precedencia de línea de comandos sobre cualquier config; (2) la **config interactiva** (`git log
--show-signature`) se documenta con la **ruta relativa `allowed_signers`**, que git resuelve contra el
**top-level del worktree** (verificado 2026-10-18 desde un subdirectorio: resuelve igual que desde la raíz) —
`git config gpg.ssh.allowedSignersFile allowed_signers` a nivel de repo.

- **Alternativas descartadas**: (a) solo config global apuntando a `~/.ssh/…` → no versionable, no reproducible
  (D1); (b) solo config local `.git/config` → **no versionada** (`.git/` no se commitea) → cada clon la pierde;
  (c) asumir ruta relativa sin `-c` en el hook → dependería de que esa config local exista en cada máquina.
- **Trade-off**: dos vías (hook `-c` + config documentada) implican mantener el doc alineado — cubierto por la
  task de documentación y por el requirement R6/R7 del delta.

### D9 — Contenido inicial y ciclo de vida del trust store

**Elegido**:

- **Semilla inicial**: las `.pub` **recuperables hoy en esta máquina** — `~/.ssh/id_ed25519_projectERP.pub` y
  `~/.ssh/id_ed25519_projectERP-agents.pub` (**nota**: el fichero real se llama `-agents.pub`, no `-agens.pub`).
  `~/.ssh/app_signing.pub` **no entra en la semilla por defecto**: solo debe añadirse si se verifica que esa clave
  **firma commits** (los releases hoy los firma GitHub web-flow con GPG RSA, no esta clave) — verificación
  delegada a una task explícita, no a una suposición.
- **Formato**: `principals [options] keytype key` con las opciones **entre** principals y keytype;
  obligatoriamente `namespaces="git"` (namespace con el que Git firma). **Principal = el email de git**
  (`user.email`) usado al firmar: un dev que cambie su email sin actualizar `allowed_signers` caerá en `%G? = U`
  (warning) — documentado como pitfall.
- **Solo claves públicas**: guard explícito (ninguna línea con material privado; verificar cabecera
  `ssh-ed25519 AAAA…`).
- **Alta/baja**: PR que añade/quita la línea en `allowed_signers` + registro (alta) o revocación (baja) de la
  `.pub` como **Signing Key** en GitHub — el proceso documental existe hoy en
  `docs/learning/ci-cd/05b-commit-signing.md` (§8.3 rotación) y en `commit-signing-key-lifecycle`; este change
  solo añade el paso "commitar la línea en el trust store versionado".
- **Control de alta (riesgo de envenenamiento)**: toda modificación de `allowed_signers` pasa por
  **`.github/CODEOWNERS`** (regla por defecta `* → core-team`) junto con `require_code_owner_review=true` del
  ruleset; y el impacto de una clave ajena queda **acotado** porque CI valida contra las claves registradas en
  GitHub (`.commit.verification.verified`), **independiente** de `allowed_signers` (el fichero solo decide `G`
  vs `U` en local).
- **Alternativas descartadas**: solo una clave (deja fuera a un segundo dev con claves distintas por repo);
  incluir todas las `.pub` disponibles sin verificar uso (infla el trust store con claves que no firman aquí).

### D10 — Portabilidad, guards de `set -e`, coste y ausencia de red nueva

**Elegido**: el bloque se escribe en **`/bin/sh` POSIX** con la misma cabecera y estilo que los hooks actuales —
`.husky/pre-push` ya arranca con `set -e` en **L2** — y **todo comando con estatus no-cero posible va guardado**
(`|| true`, `|| <salida controlada>` o guard dentro de `if`) para que bajo `sh -e` un estatus no-cero **no aborte
el hook sin mensaje**. Concretamente, un `VAR=$(git log --format=%G? "$SHA")` **sin** `|| …` aborta el proceso en
ese punto: ni mensaje de bloqueo, ni warnings, ni llegada a los tests — por eso el guard es **exigible**, no
opcional (requirement R1 del delta y tasks).

- **El hook NO invoca `git verify-commit`** en runtime: la clasificación usa exclusivamente `%G?` (con `-c
gpg.ssh.allowedSignersFile=<abs>`). `git verify-commit` es **evidencia** de verificación para diagnóstico y
  documentación (sus `exit 1` citados en Contexto son la evidencia que obliga al preflight D7), **no parte del
  gate** — conclusión explícita para disipar la ambigüedad que crea esa prosa.
- **Cero red nueva**: `%G?` es local; el único `git fetch` del hook **ya existía**.
- **Coste**: ~ms por commit (un subprocess de verificación por commit); con rangos típicos de pocos commits es
  despreciable frente a los tests scoped.
- **Dependencias**: **`ssh-keygen -Y` disponible en MSYS2** (verificado con el mismo toolchain de git
  2.52.0.windows.1) — sin él, degrada vía preflight (D7).
- **Alternativas descartadas**: (a) bloque en bash con arrays/`[[` → rompe la convención POSIX de los hooks y el
  dispatch `sh -e` de Husky v9; (b) script Node/npm nuevo → dependencia extra, arranque Node en cada push y más
  superficie que mantener.

### D11 — Divergencias y colisiones registradas → follow-ups fuera de scope (no silenciados)

**(a) Divergencia `ruleset-expansion`**: `openspec/specs/ruleset-expansion/spec.md` (requirement _"Bypass actors
preserved as NONE"_: "zero bypass actors (no exceptions for anyone, including admins)") **contradice** el estado
API verificado el 2026-10-18: `bypass_actors = [{"actor_id":5,"actor_type":"RepositoryRole","bypass_mode":
"pull_request"}]` y `current_user_can_bypass = pull_requests_only`.

**(b) Colisión de hecho con `local-dco-auto-signoff` (cross-debt dirigida)**: sus tasks **4.5, 4.6 y 4.7**
(`tasks.md:44-46`) mandan a escribir, en el nuevo `docs/learning/dco.md`, que el enforcement CI usa
**`bypass_actors: []`** (racional "ya integrado, required + blocking inbypasseable con `bypass_actors: []`", el
backstop "CI DCO … `bypass_actors: []`" y la capa `L3` de la tabla de capas). La API de 2026-10-18 **desmiente
ese hecho**: el ruleset 21227644 tiene **un** actor (`actor_id: 5`, `RepositoryRole`, `bypass_mode:
pull_request`), no `[]`. **Se registra como cross-debt dirigida a ese change — no se edita su `tasks.md` ni su
spec**: quien implemente `local-dco-auto-signoff` debe validar `bypass_actors` por API antes de fijarlo en
`docs/learning/dco.md` (o citarlo como snapshot fechado), y la tarea de deuda de este change apunta aquí.

- **Por qué queda fuera de este change**: (a) corregir `ruleset-expansion` implica una **decisión de gobernanza**
  (¿se mantiene o se retira el bypass?) que no está autorizada aquí; (b) la colisión (b) pertenece al alcance de
  `local-dco-auto-signoff`. Aquí solo se corrigen los hechos de `commit-signing-enforcement` y de la
  documentación (§3.5/§5.1) — la documentación de este change usa el **snapshot fechado no normativo**
  (requisito R7) precisamente para no repetir el mismo error de drift.
- **Alternativas descartadas**: editar `ruleset-expansion` o el `tasks.md` de `local-dco-auto-signoff` en
  silencio → ocultaría una decisión de política (o un hecho desmentido) como si fuera una actualización
  cosmética, y mezclaría scopes (Regla 4).
- **Cómo queda traceada**: en el delta `specs/commit-signing-enforcement/spec.md` (nota de divergencia), aquí como
  **D11**, y como **tarea de deuda explícita** en `tasks.md` (sin editar esas specs/changes en este change).

## Risks / Trade-offs

- **[El gate local NO bloquea firmas de claves ausentes del trust store]** — `%G?` devuelve `U` cuando la clave no
  está en `allowed_signers` (medido: `No principal matched` → `U`), y `U` es warning por política (D2) →
  **Mitigación**: el enforcer autoritativo sigue siendo CI `Verify Commit Signatures` + ruleset (`required_signatures`);
  el trust store versionado con proceso de alta/baja (D9) minimiza la ventana; el warning imprime el motivo y
  distingue "clave ausente del trust store local".
- **[Escapes reales del gate son del lado del PUSH, no de la creación]** — los commits creados con `cherry-pick`,
  con hooks desactivados o con tooling GUI **sí entran al rango de push** y el gate los clasifica (`N` si no
  están firmados → **bloquea**): eso es una **ventaja** del gate, no una carencia (corrige el bullet anterior que
  decía que "solo los cubre CI"). Los escapes reales son: `git push --no-verify`, `HUSKY=0 git push`,
  un `core.hooksPath` alterno y **pushear desde otra máquina** → **Mitigación**: documentados como escape honesto
  (H5) + backstop CI `Verify Commit Signatures` + ruleset en `main`.
- **[Preflight degradable = bypass trivial local]** — renombrar o `chmod 000` el `allowed_signers` (o sacar
  `ssh-keygen` del `PATH`) apaga el gate con un warning en cada push → **Mitigación**: **aceptado deliberadamente**
  — el preflight no bloquea nunca por un problema de _configuración_ (D7) porque rompería clon fresco; el
  backstop autoritativo es CI + ruleset, y la doc de troubleshooting hace visible la degradación.
- **[Trust store auto-serviceable]** — cualquier persona con push puede añadir **su propia clave** mediante un
  PR que edite `allowed_signers` → **Mitigación**: `.github/CODEOWNERS` (`* → core-team`) +
  `require_code_owner_review=true` exigen review antes del merge; **impacto acotado**: CI valida contra las
  claves registradas en **GitHub** (`.commit.verification.verified`), independiente de `allowed_signers` — el
  fichero solo decide `G` vs `U` en local, nunca el veredicto de merge.
- **[Ventana ±TZ del cutoff]** — CI compara `%aI` de la API en **UTC** (`Z`), el hook `%aI` local con offset →
  divergencia ≤**14 h**, solo en commits históricos **cercanos a `2026-08-01`** (D4) → **Mitigación**: aceptado y
  declarado en la spec; el efecto es eximir/bloquear un commit en esa franja, nunca un commit actual.
- **[Paridad con CI condicionada a `vars.SIGNING_ROLLOUT_DATE` indefinida]** — verificado 2026-10-18: en GitHub
  existe **solo** `CI_MINIMAL`; si alguien define `SIGNING_ROLLOUT_DATE` allí, el hook **no lo detecta sin red**
  y usaría su default/env → **Mitigación**: divergencia conocida y documentada; la sincronización es **manual**
  (editar el default/env del hook en el mismo PR que defina la variable).
- **[Clon shallow]** — el worktree actual es shallow (`test -f .git/shallow` → sí) y el `fetch` del hook es
  `--depth=1`; el fallback de primer push opera sobre esa base → **Mitigación**: `origin/main..$LOCAL_SHA` es un
  rango por SHAs (no requiere historia completa) y `--no-merges` evita depender de merges históricos; el guard
  de `origin/main` ya existente aborta con mensaje si la referencia no existe.
- **[`verify-commit` en la evidencia se lea como parte del runtime del hook]** — la prosa sobre `verify-commit`
  → `exit 1` (Contexto/D7) puede confundirse con una invocación del hook → **Conclusión explícita**: el hook
  **NO invoca `git verify-commit`**; usa solo `%G?`. `verify-commit` es evidencia de diagnóstico/documentación
  (D10), y el único subprocess de verificación del gate es `git log --format=%G?` con la ruta `-c` (mismo
  mecanismo que `ssh-keygen -Y`).
- **[Commits que entran al historial local sin pasar por hooks]** (tooling GUI, `core.hooksPath` alterno,
  otra máquina) → **Mitigación**: aceptado y documentado; el gate los cubre en el lado del push siempre que el
  push salga del workstation, y CI es el backstop autoritativo.
- **[Conflictos de edición en `.husky/pre-push` y en `docs/CONTEXT-CICD.md` con `local-dco-auto-signoff`]** →
  **Mitigación**: **orden obligatorio DCO → firma** (D5): la task 1.6 de ese change ("borrar líneas 16-49")
  borraría el bloque de firma si se aplicara después de este change, y ambas reescriben las mismas filas de
  §10.1/§11.1 → implementar sobre el hook/doc ya post-DCO, con verificación cruzada `grep -c 'Signed-off-by'
.husky/pre-push = 0` + `grep -c 'DCO' .husky/pre-push = 0` (sin editar ese change).
- **[Trust store desactualizado tras rotar una clave]** → **Mitigación**: la rotación documentada en
  `commit-signing-key-lifecycle`/`05b-commit-signing.md §8.3` gana el paso "actualizar el `allowed_signers`
  versionado"; mientras tanto los commits con la clave vieja dan `U` (warning, no bloqueo).
- **[Un warning `E` se lea como "todo correcto"]** → **Mitigación**: cada warning lleva clasificación + motivo y
  la doc aclara que la verificación autoritativa es la de GitHub (CI); el gate no emite un solo "OK" genérico.
- **[La corrección de §3.5 vuelva a quedar obsoleta]** → **Mitigación**: la cabecera del doc conserva la cadena de
  verificación con fecha (2026-10-18) y §2 ya documenta los comandos `gh api` read-only para re-auditar; además
  el inventario de workflows y el bypass quedan como **snapshot fechado NO normativo** (R7) para que un
  `gh workflow enable/disable` posterior no invalide el spec.

## Migration Plan

1. Versionar `allowed_signers` en la raíz (semilla D9, formato R6, solo claves públicas, revisión CODEOWNERS).
2. **Primero** dejar `local-dco-auto-signoff` aplicado (task 1.6 → hook post-DCO) y, sobre ese estado, insertar
   el bloque de firma en `.husky/pre-push` (orden D5: **DCO → firma**) con preflight (D7), guards `|| …` (D10),
   enumeración por SHAs + tags omitidos (D3), clasificación (D2) y cutoff (D4) — resultado:
   fetch → guard → **firma** → tests.
3. Documentación: `docs/CONTEXT-CICD.md` §10/§11/§12 (gate L2, **tras** las filas reescritas por D5) + corrección
   factual §1/§3.4/§3.5/§5.1/§5.9 (auditoría 2026-10-18: normativo estable + snapshot fechado no normativo) +
   `AGENTS.md:67` + enlaces **por sección** a `05b-commit-signing.md` (§F1.1 sintaxis, §F2 por qué NO `%G?` en CI,
   §8.1 troubleshooting) **sin duplicar** — nunca por rangos de línea, que `local-dco-auto-signoff` desplazará.
4. Validación: `sh -n .husky/pre-push`, escenarios funcionales en repo desechable (incl. `E` con `8dc24d6e`,
   multi-rama, tag omitido, primer push con `LOCAL_SHA`) y
   `openspec validate local-commit-signature-gate --strict`.

**Rollback**: revertir el commit del bloque en `.husky/pre-push` (y, si se desea, el de `allowed_signers`) — el
cambio es local y aditivo: no toca CI, ni el ruleset, ni la protección clásica, ni dependencias, por lo que el
rollback no deja efectos en GitHub ni en el resto de hooks.
