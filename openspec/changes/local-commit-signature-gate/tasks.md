# Tasks

> **Artefacto de planificación — todo se implementa en APPLY; nada está marcado como hecho.** Orden obligatorio:
> trust store (§1) → bloque en el hook (§2) → verificación funcional en repo desechable (§3) → wiring local (§4) →
> documentación (§5) → deuda/cross-refs (§6) → cierre (§7). Fuentes de verdad: `design.md` (D1-D11, Risks,
> Migration Plan) y los delta specs `specs/local-commit-signature-gate/spec.md` (R1-R7),
> `specs/commit-signing-local/spec.md` y `specs/commit-signing-enforcement/spec.md`. Evidencia empírica citada
> (git 2.52.0.windows.1, 2026-10-18) en `design.md` §Context — NO re-medir, solo re-ejecutar las recetas en APPLY.
> **Alcance GOVERNANCE puro (Regla 4 de `docs/CONTEXT-CICD.md`).** **Supuesto de hook:** `.husky/pre-push` se toma
> ya en su estado post-`local-dco-auto-signoff` (fetch + guard + tests scoped); ninguna tarea de este change edita,
> asume ni añade lógica de validación de trailers de origen — el bloque nuevo es **solo de firma** y monta su
> propia enumeración de SHAs (design D3/D5).

## 1. Trust store versionado en la raíz del repo (design D1/D8/D9, spec R6)

- [ ] 1.1 Crear `allowed_signers` en la **raíz del repo** con formato OpenSSH `principals [options] keytype key`
      (opciones **entre** principals y keytype), una línea por clave y `namespaces="git"` obligatorio en todas ellas.
      Verificación: `test -f allowed_signers` rc 0; `awk 'NF!=4' allowed_signers | wc -l` = 0; `grep -c 'namespaces="git"' allowed_signers` = `wc -l < allowed_signers`; `awk '{print $3}' allowed_signers | sort -u` = `ssh-ed25519`.
- [ ] 1.2 Sembrar con `~/.ssh/id_ed25519_projectERP.pub` y `~/.ssh/id_ed25519_projectERP-agents.pub` (**nombre real
      en disco: `-agents.pub`, no `-agens.pub`**) **tras verificar que son las claves que realmente firman** los commits
      de este repo: comparar huella del fichero con la clasificación real de la historia. Verificación:
      `ssh-keygen -lf ~/.ssh/id_ed25519_projectERP.pub` y `ssh-keygen -lf ~/.ssh/id_ed25519_projectERP-agents.pub`
      devuelven 2 huellas distintas; `git log -20 --format='%G? %GK' | grep -c '^G'` ≥ 1 y las huellas `%GK` de esos
      commits coinciden (tras la normalización que haga git) con alguna sembrada; los principals usados son los emails
      de git reales: `git log -10 --format='%ae' | sort -u` ⊆ `awk '{print $1}' allowed_signers | sort -u`.
- [ ] 1.3 **Decisión explícita sobre `~/.ssh/app_signing.pub`**: verificar si esa clave firma commits de este repo
      antes de decidir. Verificación: `ssh-keygen -lf ~/.ssh/app_signing.pub` → huella H; `git log --all
--format='%GK' | sort -u` → si H no aparece (resultado esperado: los releases los firma GitHub web-flow con GPG
      RSA, `design.md` D9), la clave **NO se sembra** y la decisión queda escrita en el propio fichero como comentario
      `# app_signing.pub excluida: <motivo verificado>`; si H aparece, se añade su línea con `namespaces="git"`.
      Criterio cerrado: `grep -c '^#' allowed_signers` ≥ 1 con la constancia de la decisión, y ninguna clave presente
      "por si acaso" (solo claves verificadas que firman).
- [ ] 1.4 Guard de "solo claves públicas" y de saneado: ninguna línea con material privado ni basura. Verificación:
      `grep -Eic 'BEGIN.*PRIVATE KEY' allowed_signers` = 0; `grep -Ec '^ssh-ed25519 ' allowed_signers` = 0 (toda línea
      empieza por principal); `awk '{print $4}' allowed_signers | grep -Ec '^[A-Za-z0-9+/=]+$'` = `wc -l <
allowed_signers`; `git check-ignore -q allowed_signers` rc 1 (NO ignorado).
- [ ] 1.5 Normalización de fin de línea y blindaje anti-secretos: el fichero se versiona con EOL LF y no dispara
      los gates de secretos. Verificación: `git check-attr text eol -- allowed_signers` → `text: auto` y `eol: lf`
      (hereda de `.gitattributes`; si no, añadir la entrada explícita); `git add allowed_signers && npm run
security:secrets` rc 0 (gitleaks staged con `.gitleaks.toml` no lo marca); si gitleaks marca la key material,
      añadir allowlist **específica y anclada** a este fichero en `.gitleaks.toml` (nunca una regla global de
      exclusión) y re-ejecutar el mismo comando a rc 0. Cierre: `npm run security:secrets:full` rc 0.
- [ ] 1.6 Documentar el **proceso de alta/baja de claves** sobre el trust store versionado, en
      `docs/learning/ci-cd/05b-commit-signing.md` (§8.3 rotación / §F1.1 sintaxis), **ampliando** esas secciones sin
      duplicarlas: alta = (1) añadir línea en `allowed_signers` vía **PR**, (2) registrar la `.pub` como **Signing Key**
      en GitHub, (3) merge; baja = (1) quitar la línea vía PR, (2) revocar la Signing Key en GitHub tras el
      solapamiento. Verificación: `grep -q 'allowed_signers' docs/learning/ci-cd/05b-commit-signing.md` rc 0,
      `grep -q 'Signing Key' docs/learning/ci-cd/05b-commit-signing.md` rc 0 y `grep -c 'allowed_signers versionado'`
      ≥ 1 en ese doc; el texto queda bajo §8.3/§F1.1 (no se crea una sección paralela que duplique la sintaxis de
      L134-135).

## 2. Bloque de verificación de firma en `.husky/pre-push` (design D2/D3/D4/D5/D6/D7/D8/D10, specs R1-R5)

- [ ] 2.1 Insertar el **preflight no bloqueante** (spec R1, design D7) al inicio del bloque: resolver la raíz con
      `git rev-parse --show-toplevel`, comprobar `test -r "$ROOT/allowed_signers"` y `command -v ssh-keygen`; si algo
      falla → `echo "⚠️ ..."` con motivo y **continuar** (nunca `exit 1` en este camino). Verificación:
      `sh -n .husky/pre-push` rc 0; `grep -F -c 'rev-parse --show-toplevel' .husky/pre-push` ≥ 1;
      `grep -F -c 'command -v ssh-keygen' .husky/pre-push` ≥ 1; `grep -F -c 'test -r' .husky/pre-push` ≥ 1; el bloque
      de preflight no contiene `exit 1` (comprobar el rango de líneas del preflight con `awk` → `grep -c 'exit 1'` = 0
      dentro de él).
- [ ] 2.2 Resolución determinista del trust store: el hook invoca git con
      `-c gpg.ssh.allowedSignersFile="$ROOT/allowed_signers"` (ruta absoluta derivada de la raíz) — design D8.
      Verificación: `grep -F -c 'gpg.ssh.allowedSignersFile="$ROOT/allowed_signers"' .husky/pre-push` ≥ 1 (o el nombre
      de variable equivalente usado en §2.1); el hook **no** depende de `git config --get` para esa ruta:
      `grep -Ec 'gpg\.ssh\.allowedSignersFile=\$\(git config' .husky/pre-push` = 0.
- [ ] 2.3 Enumeración propia de SHAs por STDIN con paridad `ci.yml:115-175` (spec R3, design D3):
      `while read -r LOCAL_REF LOCAL_SHA REMOTE_REF REMOTE_SHA`, skip de `REMOTE_SHA = "(delete)"` y de `LOCAL_SHA`
      nulo, fallback `origin/main..HEAD --no-merges` cuando `REMOTE_SHA` es nulo, y `REMOTE_REF..LOCAL_REF
--no-merges` en el resto. Verificación: `grep -F -c 'while read -r LOCAL_REF LOCAL_SHA REMOTE_REF REMOTE_SHA' .husky/pre-push` = 1;
      `grep -F -c '(delete)' .husky/pre-push` ≥ 1; `grep -F -c '0000000000000000000000000000000000000000' .husky/pre-push` ≥ 2;
      `grep -F -c 'origin/main..HEAD' .husky/pre-push` ≥ 1; `grep -c -- '--no-merges' .husky/pre-push` ≥ 2;
      `sh -n .husky/pre-push` rc 0.
- [ ] 2.4 Clasificación `%G?` y **política híbrida** (spec R2, design D2): por commit, `git -c
gpg.ssh.allowedSignersFile="$ROOT/allowed_signers" log -1 --format='%G?' <sha>` y `case` con `G` → pasa ·
      `N` → bloquea · `B` → bloquea · `E|U|X|Y|R` → warning **con motivo**; salida `short-SHA + clasificación +
motivo` por cada commit afectado y `exit 1` acumulado si algún commit quedó bloqueado. Verificación:
      `grep -c "'G'" .husky/pre-push` ≥ 1; `grep -Ec '"N"\|"B"' .husky/pre-push` ≥ 2 (ramas bloqueantes);
      `grep -Ec '"E"|"U"|"X"|"Y"|"R"' .husky/pre-push` ≥ 5 (ramas de warning) o un `case` con las 5 letras listadas;
      el mensaje de bloqueo incluye `%h`: `grep -F -c '%h' .husky/pre-push` ≥ 1; existe al menos un `exit 1` **tras** la
      clasificación (`grep -c 'exit 1' .husky/pre-push` ≥ 2 contando el del guard preexistente); `sh -n` rc 0.
- [ ] 2.5 Grandfathering `SIGNING_ROLLOUT_DATE` (spec R4, design D4): `ROLLOUT="${SIGNING_ROLLOUT_DATE:-2026-08-01}"`,
      `author.date` en ISO-8601 (`--format='%aI'`) y comparación lexicográfica estricta `<` → commit anterior al cutoff
      se marca exento (nunca bloquea) y se reporta informativamente. Verificación: `grep -F -c 'SIGNING_ROLLOUT_DATE:-2026-08-01' .husky/pre-push` ≥ 1;
      `grep -F -c '%aI' .husky/pre-push` ≥ 1; `grep -E '\< \$ROLLOUT|"\$AUTH_DATE" < "\$ROLLOUT"' .husky/pre-push` ≥ 1;
      `grep -ci 'grandfather\|exento' .husky/pre-push` ≥ 1; `sh -n` rc 0.
- [ ] 2.6 **Ubicación y orden** del bloque (spec R5, design D6): después del `git fetch origin main --depth=1` y
      del guard de `origin/main`, y **antes** de `echo "Running scoped tests (server)..."`. Verificación con números de
      línea: `grep -n 'git fetch origin main' .husky/pre-push | cut -d: -f1` <
      `grep -n '<marcador del bloque de firma>' .husky/pre-push | cut -d: -f1` <
      `grep -n 'Running scoped tests (server)' .husky/pre-push | cut -d: -f1` (los tres valores existen y están en ese
      orden); `grep -F -c 'test:changed' .husky/pre-push` = 2 (sección de tests intacta).
- [ ] 2.7 Guard de alcance del hook: el bloque nuevo añade **solo firma** — fetch, guard y tests permanecen
      intactos y el hook no gana lógica de validación de trailers de origen. Verificación: `sh -n .husky/pre-push` rc 0;
      `grep -F -c 'Signed-off-by' .husky/pre-push` = 0 y `grep -F -c 'DCO' .husky/pre-push` = 0 (**verificación de
      ausencia**, ninguna tarea anterior las edita); `grep -F -c 'git fetch origin main' .husky/pre-push` ≥ 1;
      `grep -F -c 'origin/main not found' .husky/pre-push` ≥ 1; `git diff -- .husky/pre-push` no toca los bloques
      preexistentes (revisión manual del diff: solo se inserta el bloque de firma).

## 3. Verificación funcional en repo desechable (spec R1-R5; nunca contra el repo real)

- [ ] 3.1 Montar el banco: `d=$(mktemp -d)` (o `C:/Users/user/AppData/Local/Temp/opencode/…`), `git init -b main`,
      `git config user.name/user.email` de prueba, `git config commit.gpgsign false` como base, remoto bare
      `origin`, `git fetch origin main --depth=1` equivalente (guard presente) y **claves desechables** con
      `ssh-keygen -q -t ed25519 -N "" -f "$d/k1"` (NO usar la clave real del equipo: está protegida con passphrase —
      verificado — y rompería el banco), sembrando `allowed_signers` con `k1.pub` en formato R6. Copiar el
      `.husky/pre-push` real al banco con `chmod +x`. Verificación: `git commit --allow-empty -m "feat: probe"` rc 0;
      `test -f "$d/allowed_signers"` rc 0; `sh "$d/.husky/pre-push"` invocable (los tests scoped fallarán por no haber
      `npm run test:changed` en el banco — esperado: el hook debe alcanzar la sección de tests cuando la firma pasa).
- [ ] 3.2 **Paso `G`**: commit firmado con `k1` (`git -c commit.gpgsign=true -c gpg.format=ssh -c
user.signingkey="$d/k1.pub" commit --allow-empty -m "feat: g"`) →
      `git -c gpg.ssh.allowedSignersFile="$d/allowed_signers" log -1 --format='%G?'` = `G`. Verificación: valor `G` y
      salida del hook con `Running scoped tests` (la firma no bloquea).
- [ ] 3.3 **Bloqueo `N`**: commit **sin** firma (`git -c commit.gpgsign=false commit --allow-empty -m "feat: n"`
      con `author.date` ≥ cutoff vía `GIT_AUTHOR_DATE="2026-09-01T10:00:00Z"`) → `%G?` = `N`; invocar el hook con
      `printf 'refs/heads/main %s refs/heads/main <sha-previo>\n' "$(git rev-parse HEAD)" | sh .husky/pre-push origin "$bare"`
      → **rc ≠ 0**, la salida contiene el short-SHA y el motivo «sin firma» y **NO** contiene `Running scoped tests`
      (el `exit 1` impide llegar a los tests, spec R5).
- [ ] 3.4 **Bloqueo `B` (firma corrupta)**: crear el commit firmado y corromper su objeto —
      `git cat-file commit HEAD | sed 's/^feat: b$/feat: b-c/' > /tmp/t && git hash-object -w -t commit /tmp/t >
/tmp/news && git update-ref refs/heads/main "$(cat /tmp/news)"` → `%G?` = `B`; invocar el hook igual que 3.3 →
      **rc ≠ 0**, salida con motivo «firma corrupta» y sin `Running scoped tests`. Verificación: `%G?` = `B` y ambos
      criterios de salida.
- [ ] 3.5 **Warning `E` con el commit web-flow real**: importar la historia real **sin red** — `git fetch
"C:/Users/user/Desktop/Programacion/Node-express-nest/project-one" main` en el banco y
      `git update-ref refs/remotes/origin/main 8dc24d6e…` (tip de `origin/main`, squash PR #140) → `%G?` = `E` para ese
      SHA. Invocar el hook con un rango que lo incluya → **rc de la etapa de firma = pasa** (llega a `Running scoped
tests`), la salida contiene el warning con motivo «firma no comprobable localmente» y **no** hay bloqueo por ese
      commit. Verificación: `git log -1 --format='%G?' 8dc24d6e…` = `E`; en la salida del hook: warning presente,
      mensaje de bloqueo ausente.
- [ ] 3.6 **Warning `U` (clave ajena al trust store)**: segundo par `ssh-keygen … -f "$d/k2"` y commit firmado con
      `k2` **sin** añadir `k2.pub` a `allowed_signers` → `%G?` = `U` («No principal matched») y `git verify-commit` rc 1.
      Invocar el hook → warning con motivo, **no bloquea** (política D2) y continúa a tests.
- [ ] 3.7 **Grandfathering**: commit sin firma con `GIT_AUTHOR_DATE="2026-07-15T10:30:00Z"` (anterior a
      `2026-08-01`) → el hook lo reporta exento y **no bloquea**; commit análogo con `GIT_AUTHOR_DATE="2026-09-01T10:00:00Z"`
      → **bloquea**. Verificación: los dos `%G?` = `N`, pero solo el primero es exento (salida con «exento/grandfathered»
      y rc 0 de la etapa de firma) y el segundo produce `exit 1`.
- [ ] 3.8 **Preflight / clon fresco sin trust store**: `mv allowed_signers allowed_signers.bak` en el banco →
      invocar el hook → warning con motivo (`Unable to open allowed keys file` / fichero ausente) y **push permitido**
      (rc de la etapa de firma = pasa; llega a los tests); `mv` de vuelta → vuelve a clasificar. Verificación: sin
      `exit 1` proveniente del preflight en el primer caso; con el fichero restaurado, el escenario 3.3 vuelve a
      bloquear. Repetir con `PATH` sin `ssh-keygen` (`env PATH=/usr/bin …` sin el directorio que lo contiene, o
      `PATH=/nonexistent`) → también warning, nunca bloqueo.
- [ ] 3.9 **Primer push de rama nueva y borrado de rama** (spec R3): (a) STDIN
      `refs/heads/topic <sha> refs/heads/topic 0000000000000000000000000000000000000000` → el hook usa el fallback
      `origin/main..HEAD --no-merges` y evalúa los commits esperados (salida con los SHAs de la rama); (b) STDIN con
      `refs/heads/topic <sha> refs/heads/topic (delete)` → **no valida ningún commit** y no bloquea; (c) `local-sha` nulo
      (`0000000… refs/heads/x`) → omitido. Verificación: en (a) se evalúan los commits de `origin/main..HEAD`
      (`git log --no-merges --format=%h origin/main..HEAD` coincide con los listados), en (b)/(c) 0 commits listados y
      rc de la etapa de firma = pasa.
- [ ] 3.10 **Orden firma → tests** y regresión de los preexistentes: con un `N` presente, la salida **no** contiene
      `Running scoped tests (server)` (3.3); con todo en `G`/exento/warning, la salida **sí** lo contiene (3.2). Y
      `sh -n .husky/pre-push` rc 0 tras cada edición + `git diff --check .husky/pre-push` sin errores de whitespace.

## 4. Config interactiva / wiring local por dev (design D8, spec R6)

- [ ] 4.1 Documentar y aplicar el wiring de verificación **interactiva** (el hook no depende de esto, §2.2):
      `git config gpg.ssh.allowedSignersFile allowed_signers` a **nivel de repo** (ruta relativa resuelta contra el
      top-level del worktree). Verificación en la máquina: `git config --local --get gpg.ssh.allowedSignersFile` =
      `allowed_signers`; `git log --show-signature -1` → `Good "git" signature`; `git verify-commit HEAD` rc 0.
- [ ] 4.2 Verificar la resolución de la ruta relativa desde un subdirectorio y la precedencia sobre la config
      global de la máquina (antes apuntaba a `~/.ssh/allowed_signers`). Verificación: `cd apps/server && git log -1
--format='%G?' HEAD` = `G` (usa el fichero versionado, no `~/.ssh/…`); `git config --show-origin --get
gpg.ssh.allowedSignersFile` muestra el origen `file:.git/config` con valor `allowed_signers`; y
      `cd apps/server && git -c gpg.ssh.allowedSignersFile="$PWD/../../allowed_signers" verify-commit HEAD` rc 0
      (invariante de la ruta absoluta usada por el hook).

## 5. Documentación (specs R7; design D1/D9/D11, Migration Plan paso 3)

- [ ] 5.1 `docs/CONTEXT-CICD.md` **§10** (contratos de los hooks): la fila/sección de `pre-push` gana el gate de
      **firma de commits** — preflight no bloqueante, política `%G?` (bloquea `N`/`B`, advierte `E`/`U`/`X`/`Y`/`R`),
      cutoff `SIGNING_ROLLOUT_DATE`, confianza en `allowed_signers` versionado y orden fetch → guard → firma → tests.
      **Sin describir DCO como parte de este gate** (es otro change). Verificación:
      `grep -q 'allowed_signers' docs/CONTEXT-CICD.md` rc 0; `grep -q '%G?' docs/CONTEXT-CICD.md` rc 0;
      `grep -q 'SIGNING_ROLLOUT_DATE' docs/CONTEXT-CICD.md` rc 0; y `grep -n 'pre-push'` dentro de §10 describe el
      gate de firma sin mezclarlo con validación de trailers (revisión manual de la sección).
- [ ] 5.2 `docs/CONTEXT-CICD.md` **§11.1** (tabla de las 3 capas): la fila **L2 — Pre-push** añade la
      verificación de firma (coste ms, bloqueo ✅ para `N`/`B`) junto a la regresión scoped, con enlace al doc de
      signing. Verificación: la fila L2 de la tabla contiene `firma` y `%G?`;
      `grep -c '05b-commit-signing.md' docs/CONTEXT-CICD.md` ≥ 1 (§11 enlaza, no duplica).
- [ ] 5.3 `docs/CONTEXT-CICD.md` **§12** (tooling local): registrar `allowed_signers` (raíz, versionado, solo
      claves públicas, formato OpenSSH con `namespaces="git"`) y el gate de `pre-push` como capa local de gobernanza,
      **enlazando sin duplicar** `docs/learning/ci-cd/05b-commit-signing.md:134-135` (sintaxis), `:198-231` (por qué NO
      `%G?` en CI sin trust store) y `:476-516` (troubleshooting). Verificación: `grep -q 'allowed_signers'` en §12;
      `grep -c 'namespaces="git"' docs/CONTEXT-CICD.md` = **0** (la sintaxis NO se duplica en el doc de contexto);
      `grep -q '198-231\|05b-commit-signing' docs/CONTEXT-CICD.md` rc 0.
- [ ] 5.4 **Corrección factual de §3.5** (auditoría API 2026-10-18, spec R7 + delta `commit-signing-enforcement`):
      nombre del ruleset 21227644 → **`Require signed commits`** (nota del rename de `2026-09-02`),
      `bypass_actors = [{"actor_id":5,"actor_type":"RepositoryRole","bypass_mode":"pull_request"}]`,
      `current_user_can_bypass = pull_requests_only`, protección clásica intacta
      (`required_signatures.enabled=false`), 4 checks con `integration_id 15368` sin cambios. Verificación:
      `grep -c 'Require signed commits' docs/CONTEXT-CICD.md` ≥ 1; `grep -c '`bypass_actors: \[\]`' docs/CONTEXT-CICD.md` = 0;
      `grep -c '`current_user_can_bypass: never`' docs/CONTEXT-CICD.md` = 0; `grep -q 'pull_requests_only' docs/CONTEXT-CICD.md` rc 0;
      `grep -q 'RepositoryRole' docs/CONTEXT-CICD.md` rc 0; `grep -q 'enabled=false' docs/CONTEXT-CICD.md` rc 0;
      `grep -q '15368' docs/CONTEXT-CICD.md` rc 0; y en §11.2 la frase «ruleset sin `bypass_actors`» queda corregida
      (`grep -c 'ruleset sin `bypass_actors`' docs/CONTEXT-CICD.md` = 0).
- [ ] 5.5 Reflejos de §3.5 en **§1 / §3.4 / §5.1 / §5.9** (+ §6 si aplica): inventario real de workflows —
      **8 activos** (`ci`, `security`, `scheduled-security`, `dependabot-updates`, `opencode-review`, `flaky-weekly`,
      `nightly-full-suite`, `order-dependence-audit`) y **4 `disabled_manually`** (`release`, `preview`, `deploy`,
      `security-digest`); `ci-enterprise.yml` **ya no aparece en el registro** (eliminar sus filas en §3.4/§3.5/§5.9 y
      la fila/contador `total 9`, dejando constancia explícita del hecho). Verificación:
      `grep -c 'total 9' docs/CONTEXT-CICD.md` = 0; `grep -q '8 activos\|8 workflows activos' docs/CONTEXT-CICD.md` rc 0;
      `grep -q 'ya no aparece en el registro' docs/CONTEXT-CICD.md` rc 0; `grep -n 'ci-enterprise' docs/CONTEXT-CICD.md`
      → ninguna línea dentro de §3.4/§3.5/§5.9 (inspección manual con los números devueltos) y toda mención restante
      es histórica/explicitada; cabecera del doc actualizada: `head -40 docs/CONTEXT-CICD.md | grep -q '2026-10-18'` y
      `head -40 docs/CONTEXT-CICD.md | grep -q 'Require signed commits'`.
- [ ] 5.6 `AGENTS.md` (bullet Commit Signing, L67): añadir la referencia al **gate local de firma de `pre-push`**
      y al **`allowed_signers` versionado en la raíz**, conservando intactos `-S` y la prohibición `--no-verify`.
      Verificación: `grep -q 'allowed_signers' AGENTS.md` rc 0; `grep -q 'pre-push' AGENTS.md` rc 0;
      `grep -q 'git commit -S' AGENTS.md` rc 0; `grep -q -- '--no-verify' AGENTS.md` rc 0.

## 6. Deuda y cross-refs (design D5/D11)

- [ ] 6.1 Registrar la **divergencia `ruleset-expansion`** como deuda explícita **sin editar esa spec**:
      añadir fila en `docs/CONTEXT-CICD.md` §6 (Deudas) indicando que _"Bypass actors preserved as NONE"_ contradice la
      API de 2026-10-18 y que su corrección requiere una decisión de gobernanza (mantener/retirar bypass) fuera de
      este change. Verificación: `grep -q 'ruleset-expansion' docs/CONTEXT-CICD.md` rc 0;
      `test ! -d specs/ruleset-expansion` rc 0 (sin delta para esa capability);
      `git diff --name-only -- openspec/specs/ruleset-expansion/` vacío.
- [ ] 6.2 Cross-refs y no-edición de specs fuera de alcance: solo existen los 3 deltas de este change y no se
      toca ninguna spec main. Verificación: `find specs -name spec.md | wc -l` = 3
      (`local-commit-signature-gate`, `commit-signing-local`, `commit-signing-enforcement`);
      `test ! -d specs/commit-signing-ci-verification` rc 0; `test ! -d specs/commit-signing-release-migration` rc 0;
      `test ! -d specs/pre-push-scoped-testing` rc 0; `test ! -d specs/local-dco-validation` rc 0;
      `git status --porcelain openspec/specs/` vacío.

## 7. Cierre

- [ ] 7.1 Validación OpenSpec del change completo. Verificación: `openspec validate local-commit-signature-gate --strict`
      imprime `Change 'local-commit-signature-gate' is valid` y rc 0; `openspec status --change local-commit-signature-gate --json`
      → `isPlanningComplete: true` y `artifacts` todos `done` salvo `tasks` marcado al completar esta lista.
- [ ] 7.2 Checklist de aceptación (revisión manual, mapa R1-R7): R1 preflight no bloqueante demostrado en 3.8 ·
      R2 política `G/N/B/E/U/X/Y/R` demostrada en 3.2-3.6 con la cita de `8dc24d6e` presente en `design.md` §D2 ·
      R3 enumeración STDIN + fallback + borrado en 3.9 · R4 grandfathering en 3.7 · R5 orden fetch→guard→firma→tests
      en 2.6/3.10 · R6 trust store versionado + alta/baja en §1 · R7 documentación §10/§11/§12 + corrección §3.5 en
      §5. Verificación: los 7 criterios marcados y ninguna sección de este `tasks.md` sin completar.
- [ ] 7.3 Guard de alcance final **GOVERNANCE puro**: los cambios de implementación son exactamente los
      permitidos. Verificación: `git status --porcelain` → solo `allowed_signers`, `.husky/pre-push`,
      `docs/CONTEXT-CICD.md`, `docs/learning/ci-cd/05b-commit-signing.md`, `AGENTS.md` (y, si 1.5 lo exigió,
      `.gitattributes`/`.gitleaks.toml`); **cero** cambios en `.github/workflows/**`, en `openspec/specs/**` y fuera de
      los artefactos de este change; `sh -n .husky/pre-push` rc 0; `openspec validate local-commit-signature-gate --strict`
      rc 0 tras todos los cambios.
