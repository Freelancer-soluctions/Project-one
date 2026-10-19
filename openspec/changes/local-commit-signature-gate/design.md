# Design

## Context

Ver `proposal.md` (Why) para la motivación. Solo el estado actual que condiciona el HOW:

- **Hooks actuales**: `.husky/pre-push` (68 líneas) = `git fetch origin main --depth=1` (L6) + guard de
  `origin/main` (L9-14) + **bloque DCO (L16-49)** + tests scoped (L51-68); `.husky/pre-commit` y
  `.husky/commit-msg` **no contienen ninguna verificación de firma**. El change activo
  `local-dco-auto-signoff` es quien **borra las líneas 16-49** y deja `pre-push` en fetch + guard + tests.
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

## Goals / Non-Goals

**Goals:**

- Detectar en el dev, antes del push y a coste de milisegundos, los commits **sin firma** (`N`) y con
  **firma corrupta** (`B`) posteriores al cutoff, con mensajes accionables por commit.
- Hacer el trust store **reproducible en cualquier clon** (versionado en la raíz) sin depender de config por
  máquina, y degradar de forma **no bloqueante** cuando el trust store no resuelva.
- Mantener paridad de enumeración/grandfathering con `ci.yml:115-175` para que local y CI cuenten los mismos commits.
- Documentar el gate en `docs/CONTEXT-CICD.md` (§10/§11/§12) y corregir su deuda factual de §3.5 (GOVERNANCE puro).

**Non-Goals:**

- **Cero DCO**: este change no menciona, asume ni toca validación de trailers `Signed-off-by:` (Regla dura de scope).
- No se modifica `ci.yml`, el ruleset 21227644, la protección clásica, `.husky/pre-commit` ni `.husky/commit-msg`.
- No se introduce red nueva, ni dependencias npm, ni cambios de comportamiento de los tests scoped.
- No se corrige `ruleset-expansion` (divergencia registrada en D11) ni ninguna capability de otro stage
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
**`E`/`U`/`X`/`Y`/`R` → ⚠️ warning con motivo, no bloquea** — con short-SHA + motivo por commit y `exit 1` si algún
commit queda bloqueado.

**Justificación obligatoria de la no-estrictidad**: el tip de `origin/main` **`8dc24d6e`** (squash del PR #140,
firmado por la GPG key de **web-flow**) da localmente **`%G? = E`** y `git verify-commit origin/main` →
**`exit 1`** (`gpg: Can't check signature: No public key`), medido 2026-10-18 incluso con trust store
configurado. **Descartado explícitamente el gate "todo debe dar `G`"**: rompería pushes legítimos
(los squash de web-flow y cualquier firma no comprobable localmente) y convertiría el gate local en un obstáculo
mayor que CI, que es quien debe ser autoritativo.

### D3 — Alcance de SHAs: enumeración propia por STDIN

**Elegido**: el hook lee sus propias líneas de STDIN (`<local-ref> <local-sha> <remote-ref> <remote-sha>`),
salta el borrado de rama (`(delete)`) y el `LOCAL_SHA` nulo, usa `REMOTE_REF..LOCAL_REF --no-merges` y, en el
**primer push de rama nueva** (`REMOTE_SHA` nulo), cae en el fallback `origin/main..HEAD --no-merges` (el
`git fetch` previo del hook garantiza que `origin/main` existe).

- **Paridad declarada con `ci.yml:115-175`**: mismo tratamiento de borrado, SHA nulo, fallback y cutoff; local y
  CI cuentan el mismo conjunto de commits.
- **`--no-merges` justificado**: el repo tiene **0 merge commits** (`required_linear_history` + merge squash
  exclusivo) → no se pierde ningún commit real y se evita evaluar merges históricos que nadie firma.
- **Alternativa descartada**: reutilizar el bucle DCO existente — no puede reutilizarse: (a) pertenece a
  `local-dco-auto-signoff`, que lo **borra** (líneas 16-49); (b) su salida (`DCO_FAILED` de trailers) no es la
  clasificación `%G?`. Este change monta **su propio soleteo**, independiente y con la misma forma de enumeración.

### D4 — Grandfathering `SIGNING_ROLLOUT_DATE` (paridad 1:1 con CI)

**Elegido**: eximir todo commit cuyo `author.date` ISO-8601 sea estrictamente anterior a `SIGNING_ROLLOUT_DATE`
(default **`2026-08-01`**, sobrescribible por env), comparación **lexicográfica sobre ISO-8601** — idéntica a
`vars.SIGNING_ROLLOUT_DATE || '2026-08-01'` de `ci.yml:115-175`. Los grandfathered se reportan como exentos y
**nunca bloquean**.

- **Alternativas descartadas**: (a) sin cutoff → bloquearía cientos de commits históricos no re-firmables sin
  reescribir historia; (b) cutoff distinto al de CI → divergencia local/CI en el mismo rango (local pasaría y CI
  fallaría, o viceversa).
- **Rationale de fecha**: los commits anteriores al rollout no se pueden firmar retroactivamente sin reescribir
  historia; CI ya los exoneraba, y este gate hereda exactamente el mismo corte.

### D5 — Cero DCO y convivencia con `local-dco-auto-signoff`

**Elegido**: este change **no contiene ninguna lógica DCO** (no inspecciona `Signed-off-by:`, no menciona DCO en
el hook) y **asume el `pre-push` post-DCO** del change activo `local-dco-auto-signoff`, que es el **dueño** de
borrar las líneas 16-49 del hook actual.

- Tras esa eliminación, el `pre-push` queda en `git fetch origin main --depth=1` + guard de `origin/main` + tests
  scoped; **este change añade su bloque de firma como único recorredor del rango de push** (su enumeración por
  STDIN es propia e independiente — D3).
- **Orden de dependencia**: la tarea de inserción debe aplicarse sobre el hook **ya post-DCO** (o en paralelo con
  cuidado de no re-introducir el bloque DCO); el guard `grep -c 'Signed-off-by' .husky/pre-push = 0` tras aplicar
  ambos cambios es la verificación cruzada.
- **Alternativa descartada**: mezclar firma y DCO en un mismo bloque → mezclaría stages/ownership, duplicaría
  enumeración y violaría el límite de scope comprometido.

### D6 — Ubicación y orden del bloque

**Elegido**: `fetch` → `guard de origin/main` → **bloque de firma** → `tests scoped`.

- La firma cuesta **milisegundos por commit** (operación local, sin red) y los tests son **caros** → verificar
  primero lo barato; si la firma bloquea (`exit 1`), los tests **no llegan a ejecutarse**.
- El bloque va **después** del `fetch`/guard porque su fallback de primer push (`origin/main..HEAD`) **depende**
  de que `origin/main` exista localmente y esté actualizada (mismo motivo por el que el bloque DCO antiguo
  también iba ahí).
- **Alternativas descartadas**: (a) en `pre-commit`/`commit-msg` → no hay rango de push todavía (no se puede
  evaluar `REMOTE_REF..LOCAL_REF`) y encarecería cada commit; (b) tras los tests → se pagarían tests para un push
  que va a ser rechazado.

### D7 — Preflight obligatorio del trust store (no bloqueante)

**Elegido**: antes de clasificar, resolver `allowed_signers` desde la raíz del worktree y comprobar (a) que
existe y es legible, (b) que la ruta `gpg.ssh.allowedSignersFile` queda resoluble para la invocación y (c) que
`ssh-keygen` está en el `PATH`. Si algo falla → **warning con motivo y continúa sin bloquear por firma** (los
tests scoped siguen su curso).

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
- **Alternativas descartadas**: solo una clave (deja fuera a un segundo dev con claves distintas por repo);
  incluir todas las `.pub` disponibles sin verificar uso (infla el trust store con claves que no firman aquí).

### D10 — Portabilidad, coste y ausencia de red nueva

**Elegido**: el bloque se escribe en **`/bin/sh` POSIX con `set -e`**, con la misma cabecera y estilo que
`.husky/pre-commit`/`commit-msg`/`pre-push` actuales, y **todo comando con estatus no-cero posible va guardado**
(`|| true` / guards en `if`) para que bajo `sh -e` un fallo de subprocess no se convierta en un bloqueo
inesperado del push. Dependencias: **`ssh-keygen -Y` disponible en MSYS2** (verificado con el mismo toolchain de
git 2.52.0.windows.1) — sin él, degrada vía preflight (D7).

- **Cero red nueva**: `git verify-commit`/`%G?` son locales; el único `git fetch` del hook **ya existía**.
- **Coste**: ~ms por commit (un subprocess de verificación por commit); con rangos típicos de pocos commits es
  despreciable frente a los tests scoped.
- **Alternativas descartadas**: (a) bloque en bash con arrays/`[[` → rompe la convención POSIX de los hooks y el
  dispatch `sh -e` de Husky v9; (b) script Node/npm nuevo → dependencia extra, arranque Node en cada push y más
  superficie que mantener.

### D11 — Divergencia `ruleset-expansion` → follow-up fuera de scope (no silenciada)

**Registrada, no resuelta aquí**: `openspec/specs/ruleset-expansion/spec.md` (requirement _"Bypass actors
preserved as NONE"_: "zero bypass actors (no exceptions for anyone, including admins)") **contradice** el estado
API verificado el 2026-10-18: `bypass_actors = [{"actor_id":5,"actor_type":"RepositoryRole","bypass_mode":
"pull_request"}]` y `current_user_can_bypass = pull_requests_only`.

- **Por qué queda fuera**: corregirla implica una **decisión de gobernanza** (¿se mantiene o se retira el bypass
  de emergencia?) que no está autorizada en este change; aquí solo se corrigen los hechos de
  `commit-signing-enforcement` y de la documentación (§3.5/§5.1).
- **Alternativa descartada**: editar también `ruleset-expansion` en silencio → ocultaría una decisión de política
  como si fuera una actualización cosmética de hechos (y mezclaría scopes).
- **Cómo queda traceada**: en el delta `specs/commit-signing-enforcement/spec.md` (nota de divergencia), aquí como
  **D11**, y como **tarea de deuda explícita** en `tasks.md` (crear/fijar follow-up, sin editar esa spec en este
  change).

## Risks / Trade-offs

- **[El gate local NO bloquea firmas de claves ausentes del trust store]** — `%G?` devuelve `U` cuando la clave no
  está en `allowed_signers` (medido: `No principal matched` → `U`), y `U` es warning por política (D2) →
  **Mitigación**: el enforcer autoritativo sigue siendo CI `Verify Commit Signatures` + ruleset (`required_signatures`);
  el trust store versionado con proceso de alta/baja (D9) minimiza la ventana; el warning imprime el motivo.
- **[Commits que entran al historial local sin pasar por hooks]** (cherry-pick de rama ajena, `HUSKY=0`, hooks
  desactivados, tooling GUI, `--no-verify`) → **Mitigación**: aceptado y documentado; solo CI los cubre (misma
  postura que el change `local-dco-auto-signoff` para DCO).
- **[Preflight degrada el gate a no-bloqueante si el trust store se rompe]** (fichero renombrado, config local
  ausente, `ssh-keygen` fuera de PATH) → **Mitigación**: warning explícito con motivo en cada push + sección de
  troubleshooting en la doc + backstop CI; nunca bloquea por un problema de _configuración_ (decisión D7
  deliberada para no romper clon fresco).
- **[Conflictos de edición en `.husky/pre-push` con `local-dco-auto-signoff`]** → **Mitigación**: orden de
  aplicación documentado (sobre el hook post-DCO) y verificación cruzada `grep -c 'Signed-off-by' .husky/pre-push = 0`
  - `grep -c 'DCO' .husky/pre-push = 0` tras aplicar ambos changes (D5).
- **[Trust store desactualizado tras rotar una clave]** → **Mitigación**: la rotación documentada en
  `commit-signing-key-lifecycle`/`05b-commit-signing.md §8.3` gana el paso "actualizar el `allowed_signers`
  versionado"; mientras tanto los commits con la clave vieja dan `U` (warning, no bloqueo).
- **[Un warning `E` se lea como "todo correcto"]** → **Mitigación**: cada warning lleva clasificación + motivo y
  la doc aclara que la verificación autoritativa es la de GitHub (CI); el gate no emite un solo "OK" genérico.
- **[La corrección de §3.5 vuelva a quedar obsoleta]** → **Mitigación**: la cabecera del doc conserva la cadena de
  verificación con fecha (2026-10-18) y §2 ya documenta los comandos `gh api` read-only para re-auditar.

## Migration Plan

1. Versionar `allowed_signers` en la raíz (semilla D9, formato R6, solo claves públicas).
2. Insertar el bloque de firma en `.husky/pre-push` **sobre el hook post-DCO** de `local-dco-auto-signoff`
   (fetch → guard → **firma** → tests) con preflight (D7) y clasificación (D2/D3/D4).
3. Documentación: `docs/CONTEXT-CICD.md` §10/§11/§12 (gate L2) + corrección factual §1/§3.4/§3.5/§5.1/§5.9
   (auditoría 2026-10-18) + `AGENTS.md:67` + enlaces a `05b-commit-signing.md` sin duplicar.
4. Validación: `sh -n .husky/pre-push`, escenarios funcionales en repo desechable y
   `openspec validate local-commit-signature-gate --strict`.

**Rollback**: revertir el commit del bloque en `.husky/pre-push` (y, si se desea, el de `allowed_signers`) — el
cambio es local y aditivo: no toca CI, ni el ruleset, ni la protección clásica, ni dependencias, por lo que el
rollback no deja efectos en GitHub ni en el resto de hooks.
