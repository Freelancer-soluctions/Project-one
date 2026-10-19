# Spec Delta

## Purpose

Gate local de verificación de la firma criptográfica de los commits en el hook `pre-push` (capa L2 de la estrategia shifting-left), con un trust store versionado en la raíz del repo (`allowed_signers`), preflight no bloqueante y política híbrida de clasificación `%G?` — complementa sin sustituir al enforcer autoritativo de CI, el check `Verify Commit Signatures`. Incluye la documentación del gate en `docs/CONTEXT-CICD.md` y la corrección factual de su §3.5 verificada por API el 2026-10-18.

> **Nota de capas (no contradictoria).** La capa local L2 de este change aplica a **TODAS las ramas** —más estricta que el ruleset 21227644, que solo protege `~DEFAULT_BRANCH`—; la capa CI/ruleset L3 sigue siendo el enforcer autoritativo sobre `main` y valida contra las claves registradas en **GitHub**, no contra el contenido de `allowed_signers`. Alcance distinto y autoridad distinta: ninguna capa anula a la otra. Los únicos escapes del gate local son los mecanismos explícitos del propio hook (`HUSKY=0` y `git push --no-verify`), documentados como escape honesto.

## ADDED Requirements

### Requirement: Preflight no bloqueante del trust store

Antes de clasificar cualquier commit, el hook SHALL resolver el trust store desde la raíz del worktree (`git rev-parse --show-toplevel`) y comprobar que (a) el fichero `allowed_signers` existe y es legible, (b) la ruta **absoluta que el hook pasará con `-c gpg.ssh.allowedSignersFile=<abs>`** —derivada de ese mismo `rev-parse`— existe y es legible, **sin leer la configuración de la máquina** (el gate no depende del `git config` del dev para esta ruta), y (c) `ssh-keygen` está disponible. Si alguna comprobación falla, el hook SHALL emitir un warning que identifique el motivo y SHALL continuar **sin bloquear el push por firma** (el resto del hook sigue su curso).

**Un mismatch de principal NO es fallo de preflight.** Si el fichero resuelve y es legible pero el principal del commit no coincide con ninguna entrada, el preflight pasa y la clasificación devuelve `%G? = U` → warning de la Política híbrida: el preflight decide si hay base para clasificar, no si la clave es válida.

**Guardas de estatus.** `.husky/pre-push` corre bajo `set -e` (línea 2), así que todo comando del bloque con estatus no-cero posible (`git log`, `ssh-keygen`, `test`, comparaciones) SHALL ir guardado (`|| true` o `|| <salida controlada>`): un estatus no-cero esperable no SHALL abortar el hook sin mensaje ni ocultar el motivo de bloqueo o el avance a los tests.

Rationale (obligatorio): sin trust store resoluble, `git verify-commit` devuelve un error duro `exit 1` (`Unable to open allowed keys file "..." : No such file or directory` / `No principal matched`, medido 2026-10-18 con git 2.52.0.windows.1) y — medido en esta misma máquina — **con la configuración ausente un commit SÍ firmado se clasifica como `%G? = N`**. Sin preflight, el gate bloquearía pushes cuyos commits están firmados; el estado "unverified" no existe en ese camino.

#### Scenario: Trust store ausente o no resoluble en un clon fresco

- **WHEN** el hook se ejecuta y `allowed_signers` no existe en la raíz del worktree (o la ruta absoluta que el hook pasaría con `-c gpg.ssh.allowedSignersFile=…` no existe)
- **THEN** el hook emite un warning con el motivo
- **AND** NO bloquea el push por firma
- **AND** no clasifica ningún commit como `N` en ese push

#### Scenario: ssh-keygen ausente

- **WHEN** el hook se ejecuta y `ssh-keygen` no está en el `PATH`
- **THEN** el hook emite un warning con el motivo
- **AND** NO bloquea el push por firma

#### Scenario: Trust store resoluble

- **WHEN** el hook se ejecuta, `allowed_signers` existe y es legible en la raíz del worktree y `ssh-keygen` está disponible
- **THEN** el hook procede a clasificar con `%G?` cada commit del rango de push

#### Scenario: Mismatch de principal no es fallo de preflight

- **WHEN** `allowed_signers` es legible pero el principal del commit no coincide con ninguna entrada del fichero
- **THEN** el preflight pasa (no hay fallo de confianza) y la clasificación devuelve `%G? = U`
- **AND** el hook emite un warning con el motivo y NO bloquea el push por ese commit

#### Scenario: Comando con estatus no-cero no aborta el hook

- **WHEN** un comando del bloque de firma devuelve estatus no-cero de forma esperable bajo el `set -e` del hook (p. ej. `ssh-keygen` inexistente o un `git log` sobre un SHA inválido)
- **THEN** el comando está guardado (`|| true` / `|| <salida controlada>`) y el hook NO aborta silenciosamente
- **AND** el hook emite siempre un mensaje y termina o bien en un `exit 1` motivado o bien en la sección de tests scoped

### Requirement: Política híbrida de clasificación %G?

El hook SHALL clasificar cada commit del rango con `%G?` y aplicar esta política: `G` → pasa; `N` (sin firma) → 🛑 **bloquea**; `B` (firma corrupta) → 🛑 **bloquea**; `E`, `U`, `X`, `Y`, `R` → ⚠️ **warning con motivo, no bloquea**; y **cualquier letra no enumerada (incluidas las futuras) → cláusula `*)` explícita con fail-open y warning** — nunca bloqueo silencioso ni salida sin motivo. Por cada commit bloqueado o advertido el hook SHALL imprimir el short-SHA, la clasificación y el motivo. Para `U`, el motivo SHALL distinguir «clave ausente del trust store local» (`No principal matched` — causa más común en este repo: un dev cuya clave todavía no se ha dado de alta vía PR) de clave expirada o revocada (`X`/`Y`/`R`). El hook SHALL evaluar **todas** las líneas STDIN del push —es decir, todas las ramas—, **acumulando** los fallos de todas ellas, y SHALL emitir un **único `exit 1` al final del bucle** (nunca un `exit 1` por línea, que ocultaría los fallos del resto de ramas). El mensaje de bloqueo por `N` o `B` SHALL incluir remediación explícita y correcta: `git commit --amend -S` para el commit más reciente, `git rebase origin/main --exec 'git commit --amend --no-edit -S'` para los anteriores, y un puntero al setup de firma (`docs/learning/ci-cd/05b-commit-signing.md`). `git rebase --signoff` SHALL NO recomendarse: solo añade el trailer `Signed-off-by:` sin re-firma, y todo `rebase` destruye las firmas existentes.

Justificación obligatoria (política no estricta): el tip de `origin/main` **`8dc24d6e`** (squash del PR #140, firmado por la GPG key de **web-flow**) da localmente **`%G? = E`** y `git verify-commit` → **`exit 1`** (`gpg: Can't check signature: No public key`), medido 2026-10-18 incluso con trust store configurado; un gate "todo debe dar `G`" rompería pushes legítimos. El enforcer autoritativo de la firma sigue siendo el check CI `Verify Commit Signatures` (ruleset 21227644); este gate es la capa L2 temprana.

#### Scenario: Commit firmado y verificable

- **WHEN** un commit del rango de push — posteriores al cutoff — clasifica `%G? = G`
- **THEN** el hook lo acepta sin bloquear ni advertir

#### Scenario: Commit sin firma

- **WHEN** un commit del rango de push — posteriores al cutoff — clasifica `%G? = N`
- **THEN** el hook lo bloquea con short-SHA y motivo «sin firma»
- **AND** el push se rechaza con `exit 1`

#### Scenario: Firma corrupta

- **WHEN** un commit del rango de push clasifica `%G? = B`
- **THEN** el hook lo bloquea con short-SHA y motivo «firma corrupta»
- **AND** el push se rechaza con `exit 1`

#### Scenario: Firma no comprobable localmente (web-flow)

- **WHEN** un commit del rango de push clasifica `%G? = E` — caso representado por `origin/main` `8dc24d6e`, squash del PR #140 firmado por web-flow, cuyo `git verify-commit` devuelve `exit 1` (`Can't check signature: No public key`)
- **THEN** el hook emite un warning con el motivo (firma no comprobable localmente)
- **AND** NO bloquea el push por ese commit

#### Scenario: Validez desconocida, clave expirada o revocada

- **WHEN** un commit del rango de push clasifica `%G?` como `U`, `X`, `Y` o `R`
- **THEN** el hook emite un warning con el motivo de la clasificación
- **AND** NO bloquea el push por ese commit

#### Scenario: Clave ausente del trust store local (U)

- **WHEN** un commit clasifica `%G? = U` porque su clave no está en el `allowed_signers` local (`No principal matched`, p. ej. un dev cuya clave aún no se dio de alta vía PR)
- **THEN** el motivo impreso es «clave ausente del trust store local» (proceso de alta por PR)
- **AND** ese motivo es distinguible del de clave expirada o revocada (`X`/`Y`/`R`)
- **AND** NO bloquea el push por ese commit

#### Scenario: Bloqueo con remediación accionable

- **WHEN** la política bloquea un commit por `N` o `B`
- **THEN** el mensaje incluye short-SHA, clasificación, motivo y la remediación correcta: `git commit --amend -S` (commit más reciente) o `git rebase origin/main --exec 'git commit --amend --no-edit -S'` (commits anteriores)
- **AND** incluye el puntero al setup de firma (`docs/learning/ci-cd/05b-commit-signing.md`)
- **AND** NO recomienda `git rebase --signoff` (no re-firma: solo añade el trailer `Signed-off-by:`; además, todo `rebase` destruye las firmas existentes)

#### Scenario: Push multi-rama con fallos acumulados

- **WHEN** un push envía varias líneas STDIN: una rama con un commit `N` posterior al cutoff y otra rama solo con `G`/warnings
- **THEN** el hook evalúa todas las líneas y reporta el fallo de la rama afectada con su short-SHA
- **AND** emite un único `exit 1` al final del bucle
- **AND** los fallos de todas las ramas siguen visibles en la salida (no se corta en la primera línea)

#### Scenario: Letra futura de %G?

- **WHEN** un commit clasifica con una letra no enumerada en la política (nuevo estado que git añada en el futuro)
- **THEN** la cláusula `*)` aplica fail-open: emite un warning que incluye la letra recibida
- **AND** NO bloquea el push por ese commit

### Requirement: Enumeración del rango de push por STDIN (contrato STDIN de pre-push)

El hook SHALL enumerar los commits a evaluar leyendo de STDIN las líneas que git le pasa en el formato `<local-ref> <local-sha> <remote-ref> <remote-sha>`, **verificado empíricamente el 2026-10-18** (git 2.52.0.windows.1, banco desechable): un push de actualización entrega `refs/heads/main <sha-nuevo> refs/heads/main <sha-previo>`, con **el mismo string de nombre en `LOCAL_REF` y `REMOTE_REF`**. Con esa semántica:

(a) SHALL omitir las líneas de tag (`LOCAL_REF` o `REMOTE_REF` bajo `refs/tags/*`) — es un **no-goal** documentado del gate: el repo crea los tags vía `changeset git-tag` y hoy `release.yml` está `disabled_manually` (auditoría 2026-10-18), y una línea de tag no representa commits nuevos de rama;

(b) SHALL omitir el borrado de rama y cualquier `LOCAL_SHA` nulo (`0000000000000000000000000000000000000000`); en el wire real el borrado llega como `(delete) <sha-nulos> refs/heads/<rama> <remote-sha>` — **`(delete)` ocupa `LOCAL_REF`**, nunca `REMOTE_SHA`;

(c) en el primer push de una rama nueva (`REMOTE_SHA` nulo) SHALL usar el fallback `origin/main..$LOCAL_SHA --no-merges`; el `LOCAL_SHA` del STDIN ya es el tip real de la rama pusheada, y usar `HEAD` evaluaría la rama actualmente checked-out, produciendo un falso pase o un falso bloqueo;

(d) en cualquier otro caso SHALL usar `$REMOTE_SHA..$LOCAL_SHA --no-merges`; el rango por **nombres** (`$REMOTE_REF..$LOCAL_REF`) sería un **no-op de 0 commits** porque ambos nombres son idénticos (verificado 2026-10-18);

(e) NO SHALL filtrar por nombre de rama: el gate evalúa **todas las ramas** (`refs/heads/*`), incluidas las que el ruleset no protege (`~DEFAULT_BRANCH`).

**Paridad re-atribuida (no existe paridad de enumeración con CI).** Este comportamiento SHALL seguir el **contrato STDIN de `pre-push`** (puntos (a)-(e), formato de línea verificado 2026-10-18). La **paridad con `ci.yml:115-175` es SOLO de cutoff** (`SIGNING_ROLLOUT_DATE || '2026-08-01'`, línea 115): la enumeración de CI no comparte este contrato —grep sobre todo `ci.yml`→ **0 matches** de `(delete)`, SHA nulo, `origin/main..HEAD` y `--no-merges` (verificado 2026-10-18). El rango se obtiene **después** del `git fetch origin main --depth=1` preexistente del hook.

#### Scenario: Push normal de rama existente

- **WHEN** el push actualiza una rama existente y STDIN entrega `refs/heads/main <sha-nuevo> refs/heads/main <sha-previo>` (el **mismo nombre** en ambos campos)
- **THEN** el hook evalúa `$REMOTE_SHA..$LOCAL_SHA --no-merges`
- **AND** NO evalúa por nombres de ref (eso daría 0 commits)

#### Scenario: Primer push de una rama nueva

- **WHEN** el push crea una rama (`remote-sha` = SHA nulo, `local-sha` = tip real de la rama)
- **THEN** el hook evalúa `origin/main..$LOCAL_SHA --no-merges`
- **AND** no falla aunque la referencia remota de la rama aún no exista
- **AND** evalúa el tip real pusheado, no el `HEAD` checked-out

#### Scenario: Borrado de rama

- **WHEN** el push elimina una rama y STDIN entrega `(delete) <sha-nulos> refs/heads/<rama> <remote-sha>` (o `local-sha` es el SHA nulo)
- **THEN** el hook omite esa línea sin evaluar ningún commit y sin bloquear

#### Scenario: Push de tag omitido

- **WHEN** el push envía tags (`refs/tags/*` como `LOCAL_REF`/`REMOTE_REF`), p. ej. tras un `changeset git-tag`
- **THEN** el hook omite esas líneas sin clasificar ningún commit
- **AND** no bloquea el push por firma (no-goal: los tags no son commits de rama y `release.yml` está `disabled_manually`)

#### Scenario: Push a rama distinta de main

- **WHEN** se pushea una rama no protegida por el ruleset (p. ej. `feature/x`) con un commit `N` posterior al cutoff
- **THEN** el hook la clasifica igual que `main` y bloquea el push
- **AND** el alcance del gate no depende de que el ruleset cubra esa rama

#### Scenario: Push sin commits nuevos

- **WHEN** el rango de push no contiene commits (0 a evaluar)
- **THEN** el hook no bloquea el push por firma

### Requirement: Grandfathering por cutoff SIGNING_ROLLOUT_DATE

El hook SHALL eximir de bloqueo todo commit cuyo `author.date` en formato ISO-8601 sea estrictamente anterior a `SIGNING_ROLLOUT_DATE`, con valor por defecto `2026-08-01` sobrescribible por variable de entorno — misma regla y mismo default que `vars.SIGNING_ROLLOUT_DATE || '2026-08-01'` de `ci.yml:115` (paridad **de cutoff** únicamente; la enumeración no es par, ver Requirement de enumeración). La comparación SHALL ser lexicográfica sobre fechas ISO-8601 (válida para ese formato, en paridad con CI). Los commits grandfathered SHALL contarse y reportarse como exentos, y NUNCA SHALL bloquear el push.

**Ventana ±TZ declarada.** CI compara el `author.date` que devuelve la API en UTC (`Z`, p. ej. `2026-07-15T10:30:00Z`) y el hook compara `%aI` **local con offset de zona** (p. ej. `2026-07-15T12:30:00+02:00`): la divergencia posible queda acotada a ±14 h (rango extremo de offsets de zona) y **solo** afecta a commits históricos situados alrededor del cutoff — nunca a commits claramente anteriores o posteriores.

**Paridad condicionada (sin red).** La paridad con CI depende de que `vars.SIGNING_ROLLOUT_DATE` siga **indefinida** en GitHub (verificado 2026-10-18: existe solo `CI_MINIMAL`); si llegara a definirse en GitHub, el hook local **no lo detecta sin red** y seguiría rigiéndose por su default o por su variable de entorno — divergencia conocida y documentada, no silenciada.

#### Scenario: Commit anterior al cutoff sin firma

- **WHEN** un commit del rango de push tiene `author.date` anterior a `2026-08-01` y `%G? = N`
- **THEN** el hook lo reporta como grandfathered (exento)
- **AND** NO bloquea el push por ese commit

#### Scenario: Commit posterior al cutoff sin firma

- **WHEN** un commit del rango de push tiene `author.date` posterior o igual a `2026-08-01` y `%G? = N`
- **THEN** el hook lo bloquea

#### Scenario: Cutoff sobrescrito por entorno

- **WHEN** la variable de entorno `SIGNING_ROLLOUT_DATE` define una fecha distinta
- **THEN** el hook usa ese valor como cutoff en lugar del default `2026-08-01`

#### Scenario: Commit histórico en la ventana ±TZ alrededor del cutoff

- **WHEN** un commit sin firma tiene `author.date` local con offset cuya traducción a UTC cae al otro lado del cutoff (divergencia ≤14 h)
- **THEN** la decisión exento/bloqueante puede diferir de la de CI **solo** en esa ventana
- **AND** el hook aplica `%aI` local de forma determinista y la documentación declara la ventana

### Requirement: Ubicación del bloque y ausencia total de DCO

El bloque de verificación de firma SHALL ubicarse con orden literal: **`git fetch origin main --depth=1` → guard de existencia de `origin/main` → bloque de firma → tests scoped**. Si el gate bloquea (`exit 1`), los tests scoped **NO** SHALL ejecutarse. El hook NO SHALL invocar `git verify-commit` en runtime: la clasificación usa exclusivamente `%G?` (invocado con `-c gpg.ssh.allowedSignersFile=<abs>`); `git verify-commit` es evidencia de verificación para diagnóstico y documentación, no parte del gate. Los únicos escapes del gate SHALL ser los mecanismos explícitos del propio hook —`HUSKY=0 git push …` y `git push --no-verify`—, documentados como escape honesto y visible en el propio comando (no como estado normal), sin añadir ninguna otra salida condicional u oculta; la documentación SHALL mantener la nota de capas (gate local en todas las ramas vs ruleset en `~DEFAULT_BRANCH`) para que no se lea como contradictoria con CI.

El hook de firma SHALL contener **cero lógica DCO**: no inspecciona trailers `Signed-off-by:` ni repite ninguna validación de origen — este change **asume el `pre-push` post-DCO** del change activo `local-dco-auto-signoff`, que borra las líneas 16-49 del hook actual y lo deja en `git fetch origin main --depth=1` + guard de `origin/main` + tests scoped, e implementa su **propia** enumeración de SHAs. El gate SHALL existir **solo** en `pre-push` (no en `pre-commit` ni en `commit-msg`) y no SHALL introducir llamadas de red nuevas (el `git fetch` ya existía; `%G?` es local).

#### Scenario: Gate bloquea antes de los tests

- **WHEN** algún commit del rango queda bloqueado por la política de clasificación
- **THEN** el hook sale con `exit 1` sin ejecutar los tests scoped
- **AND** el push se rechaza

#### Scenario: Gate pasa y continúa a los tests

- **WHEN** ningún commit queda bloqueado (solo `G`, grandfathered y warnings)
- **THEN** el hook continúa a la sección de tests scoped exactamente como antes

#### Scenario: El hook de firma no toca DCO

- **WHEN** se inspecciona el contenido de `.husky/pre-push` tras implementar este change
- **THEN** el hook no contiene lógica de validación `Signed-off-by:` ni referencias a DCO
- **AND** conserva `git fetch origin main`, el guard de `origin/main` y la sección de tests scoped
- **AND** no invoca `git verify-commit` (clasifica solo con `%G?`)

#### Scenario: Escape honesto del hook

- **WHEN** un desarrollador ejecuta `HUSKY=0 git push …` o `git push --no-verify`
- **THEN** el gate de firma no se ejecuta (escape explícito, visible en el propio comando)
- **AND** no existe ninguna otra salida condicional u oculta del gate
- **AND** la documentación describe ambos escapes junto a la nota de capas (local en todas las ramas vs ruleset en `main`)

### Requirement: Trust store versionado en la raíz del repo

El repositorio SHALL versionar el fichero `allowed_signers` **en su raíz**, en formato OpenSSH `principals [options] keytype key` — con las opciones **entre** principals y keytype — incluyendo obligatoriamente `namespaces="git"` (el namespace con el que Git firma), y conteniendo **exclusivamente claves públicas** (ninguna clave privada). El hook SHALL resolver la ruta desde la raíz del worktree y pasarla con `-c gpg.ssh.allowedSignersFile=<ruta absoluta>` derivada de `git rev-parse --show-toplevel`, de modo que el gate funcione en un clon fresco **sin depender de la config global de la máquina**; una ruta relativa configurada SHALL resolverse contra el **top-level del worktree** y no contra el directorio de trabajo corriente (verificado con git 2.52.0.windows.1 desde un subdirectorio). El alta y la baja de claves SHALL hacerse mediante un PR que añade o elimina la línea correspondiente en `allowed_signers`, junto con el registro (alta) o la revocación (baja) de la `.pub` como **Signing Key** en GitHub. Las rutas concretas de claves de cada máquina son **fuera de alcance de esta spec** (viven en la checklist de implementación).

El riesgo de **envenenamiento del trust store** (introducir una clave ajena vía un PR) SHALL quedar controlado por `.github/CODEOWNERS` (regla por defecto `* → core-team`) en conjunto con `require_code_owner_review=true` del ruleset, y su impacto SHALL quedar **acotado**: la verificación de CI (`Verify Commit Signatures`) valida contra las claves registradas en **GitHub** (`.commit.verification.verified`), independiente del contenido de `allowed_signers`.

#### Scenario: Clon fresco funciona sin config de máquina

- **WHEN** un desarrollador clona el repo en una máquina nueva sin `gpg.ssh.allowedSignersFile` global
- **THEN** el hook resuelve `allowed_signers` versionado en la raíz
- **AND** clasifica con `%G?` los commits firmados por claves presentes en ese fichero

#### Scenario: Commit firmado por una clave presente en el trust store

- **WHEN** un commit del rango está firmado con una clave cuya `.pub` está en `allowed_signers` con el principal correcto (el email de git) y `namespaces="git"`
- **THEN** el commit clasifica `%G? = G`

#### Scenario: Ruta relativa resuelta desde un subdirectorio

- **WHEN** `gpg.ssh.allowedSignersFile` contiene la ruta relativa `allowed_signers` y git se ejecuta desde un subdirectorio del worktree (p. ej. `apps/server`)
- **THEN** la ruta se resuelve contra la raíz del worktree y la verificación encuentra el fichero versionado

#### Scenario: Alta de clave por PR

- **WHEN** un nuevo desarrollador aporta su clave pública vía un PR que añade su línea en `allowed_signers`
- **THEN** tras el merge, sus commits firmados clasifican `%G? = G` para todo el equipo
- **AND** la misma `.pub` queda registrada como Signing Key en GitHub (documentado como paso del proceso)

#### Scenario: Intento de versionar una clave privada

- **WHEN** se propone un contenido de `allowed_signers` que incluye una clave privada
- **THEN** el cambio se rechaza (el trust store solo admite claves públicas)

#### Scenario: PR que modifica el trust store

- **WHEN** un PR añade, modifica o elimina una línea de `allowed_signers`
- **THEN** la revisión de CODEOWNERS (`* → core-team`) es exigible por `require_code_owner_review=true`
- **AND** aunque una clave ajena llegara a mergearse, el impacto queda acotado: CI valida contra las claves registradas en GitHub, independiente de `allowed_signers`

### Requirement: Documentación del gate y corrección factual de §3.5

`docs/CONTEXT-CICD.md` SHALL documentar el gate de firma como **capa L2** en §10 (contratos de los hooks), §11.1 (tabla de las capas de validación) y §12 (tooling local de seguridad/calidad), **enlazando sin duplicar** `docs/learning/ci-cd/05b-commit-signing.md` (líneas 134-135 sintaxis de `allowed_signers`, 198-231 por qué NO usar `%G?` en CI sin trust store, 476-516 troubleshooting).

Además, SHALL corregir la deuda factual de **§3.5** y sus reflejos (§1, §3.4, §5.1, §5.9) con la auditoría de API del **2026-10-18**. **Normativo — solo hechos estables:** el ruleset 21227644 se llama **`"Require signed commits"`** (NO `"Pre-Merge Governance Gate"`; `updated_at=2026-09-02`); los 4 status checks (`Verify Commit Signatures`, `Commit Lint (Conventional Commits)`, `PR Title Lint`, `DCO`) con `integration_id 15368`; `required_signatures` presente con `enforcement: active`; y la protección clásica de `main` con `required_signatures.enabled=false`.

**Snapshot fechado NO normativo (2026-10-18) — para evitar drift garantizado:** el bypass auditado (`bypass_actors = [{"actor_id":5,"actor_type":"RepositoryRole","bypass_mode":"pull_request"}]` y `current_user_can_bypass = pull_requests_only` en lugar de `[]`/`never`) y el inventario de workflows — **8 activos** (`ci`, `security`, `scheduled-security`, `dependabot-updates`, `opencode-review`, `flaky-weekly`, `nightly-full-suite`, `order-dependence-audit`) y **4 `disabled_manually`** (`release`, `preview`, `deploy`, `security-digest`), con `ci-enterprise.yml` ya no presente en el registro. La documentación SHALL marcar ese bloque como «snapshot 2026-10-18, no normativo»: cualquier `gh workflow enable`/`disable` posterior NO incumple este requirement, y el snapshot se resincroniza en la próxima auditoría de docs.

#### Scenario: Lector de la tabla de capas (§11.1)

- **WHEN** un desarrollador lee `docs/CONTEXT-CICD.md` §11.1
- **THEN** la fila L2 (pre-push) incluye la verificación de firma de commits junto a la regresión scoped
- **AND** la sección remite a `docs/learning/ci-cd/05b-commit-signing.md` en lugar de duplicar su contenido

#### Scenario: Lector de §3.5 corregida

- **WHEN** un desarrollador lee `docs/CONTEXT-CICD.md` §3.5 tras este change
- **THEN** el ruleset aparece como `"Require signed commits"` con sus 4 status checks y `integration_id 15368`
- **AND** el bypass y el inventario de workflows aparecen dentro de un bloque marcado como «snapshot 2026-10-18, no normativo»
- **AND** el inventario muestra 8 activos y 4 `disabled_manually`, sin `ci-enterprise.yml`

#### Scenario: Hechos sin cambio preservados

- **WHEN** se revisa la sección corregida
- **THEN** siguen figurando `required_signatures` con `enforcement: active`, los 4 status checks con `integration_id 15368` y la protección clásica con `required_signatures.enabled=false`

#### Scenario: Cambio posterior en el registro de workflows no incumple el spec

- **WHEN** tras la auditoría de 2026-10-18 se habilita o deshabilita un workflow (`gh workflow enable/disable`)
- **THEN** este requirement NO queda incumplido (el inventario es snapshot fechado, no normativo)
- **AND** el próximo refresh de docs actualiza el snapshot con su nueva fecha de auditoría

#### Scenario: Sin duplicación del doc de signing

- **WHEN** se compara la nueva documentación con `docs/learning/ci-cd/05b-commit-signing.md:134-135,198-231,476-516`
- **THEN** la documentación del gate delega en esas secciones mediante enlace y no reproduce su troubleshooting ni su sintaxis
