# Proposal

## Why

Ningún hook local verifica la **firma criptográfica** de los commits que salen del workstation: la capa L1
(`pre-commit`, `commit-msg`) valida lint/format/SAST/secrets/DCO y L2 (`pre-push`) solo hace fetch + tests
scoped (`docs/CONTEXT-CICD.md` §10.1/§10.6/§11.1 — las funciones L1/L2 no mencionan firma), mientras que la
única enforcement de firma vive en L3 (ruleset 21227644 `required_signatures` + check CI
`Verify Commit Signatures`). `AGENTS.md:67` exige `git commit -S`, pero `-S` solo produce un commit firmado si
`commit.gpgsign=true` está activo en el `.gitconfig` **global de la máquina** (config no versionada): en un clon
fresco, en una máquina nueva o si alguien desactiva la firma, un commit **sin** firma sale del dev sin que nada
local lo detecte y el problema solo aparece al llegar a GitHub — feedback tardío, caro y dependiente de la memoria
del dev. Es exactamente el hueco que la estrategia shifting-left (`docs/CONTEXT-CICD.md` §11) dice cerrar.

Hay dos hechos que hacen que este change sea **necesario ahora** y que condicionan su diseño:

1. **El trust store local es una config por máquina.** `gpg.ssh.allowedSignersFile` apunta hoy a
   `C:/Users/user/.ssh/allowed_signers` (verificado por `git config --show-origin`), un fichero **no versionado**
   y distinto en cada workstation; no existe ningún `allowed_signers` versionado en el repo (glob = 0). Sin un
   trust store resoluble, `git verify-commit` devuelve un **error duro `exit 1`** (`Unable to open allowed keys
file "..." : No such file or directory` / `No principal matched`, medido 2026-10-18 con git 2.52.0.windows.1) y
   `%G?` puede reportar **`N` («sin firma») para un commit que SÍ está firmado** (medido con el trust store no
   configurable) — es decir, un gate ingenuo bloquearía pushes legítimos en un clon fresco.
2. **Un gate estricto "todo debe dar `G`" rompería pushes legítimos.** `origin/main` contiene hoy un commit
   firmado por **web-flow** (squash del PR #140, `8dc24d6e`, GPG RSA de GitHub): localmente `%G? = E` y
   `git verify-commit origin/main` → **`exit 1`** (`gpg: Can't check signature: No public key`, medido
   2026-10-18 incluso con trust store configurado). La política debe distinguir "sin firma / firma corrupta"
   (bloquea) de "firma no comprobable localmente" (advierte).

## What Changes

- **Nuevo gate local de firma en `.husky/pre-push`** (GOVERNANCE, pre-PR/merge — Regla 4 de
  `docs/CONTEXT-CICD.md`): para cada commit del rango de push clasifica `%G?` y aplica una **política híbrida**
  — `G` pasa · `N` (sin firma) 🛑 · `B` (firma corrupta) 🛑 · `E`/`U`/`X`/`Y`/`R` ⚠️ warning con motivo, no
  bloquea — listando short-SHA + motivo por commit. **Preflight obligatorio**: si el trust store no resuelve o el
  fichero no existe (o falta `ssh-keygen`), emite warning y **NO bloquea** (evita romper clones frescos y evitar
  clasificar como `N` un commit firmado). El enforcer autoritativo sigue siendo el check CI
  `Verify Commit Signatures`; este gate es la capa L2 temprana, no un sustituto.
- **Trust store versionado en la raíz: fichero `allowed_signers`** en formato OpenSSH
  (`principals [options] keytype key` — opciones **entre** principals y keytype; `namespaces="git"`, que es el
  namespace con el que Git firma), con **solo claves públicas** y un proceso documentado de alta/baja de claves
  (PR que añade/quita la línea + registro de la `.pub` como Signing Key en GitHub). El hook resuelve la ruta
  desde `git rev-parse --show-toplevel` y la pasa con `-c gpg.ssh.allowedSignersFile=<abs>` para ser
  determinista e independiente de la config global de la máquina (verificado: la ruta relativa se resuelve
  contra el top-level del worktree, no contra el CWD — probado desde un subdirectorio).
- **Enumeración propia de SHAs con paridad 1:1 con `ci.yml:115-175`**: lectura de STDIN del hook
  (`<local-ref> <local-sha> <remote-ref> <remote-sha>`), skip de borrado de rama y de SHA nulo, fallback
  `origin/main..HEAD --no-merges` en el primer push de rama nueva, y cutoff de grandfathering
  `SIGNING_ROLLOUT_DATE` (default `2026-08-01`) comparando `author.date` en ISO-8601.
- **Cero DCO (límite duro de scope)**: este change **no menciona, asume ni toca** la validación DCO. El proposal
  **asume el `pre-push` post-DCO** del change activo `openspec/changes/local-dco-auto-signoff/` (que deja el hook
  en `git fetch origin main --depth=1` + guard de `origin/main` + tests scoped) e implementa su **propia**
  enumeración de SHAs. El bloque nuevo se inserta **después** del fetch+guard y **antes** de los tests scoped
  (firma ≈ ms por commit; tests = caros) — y solo hay que pagar el coste de firma si los tests van a correr.
- **Documentación (incluida)**: (a) el gate documentado en `docs/CONTEXT-CICD.md` §10/§11/§12 — hoy solo
  describen DCO/tests/SAST/advisory en L1/L2 — **enlazando sin duplicar** `docs/learning/ci-cd/05b-commit-signing.md`
  (§F1.1 sintaxis de `allowed_signers`, §F2 por qué NO usar `%G?` en CI sin trust store, §8 troubleshooting);
  (b) **corrección de la deuda factual de §3.5** verificada por API el **2026-10-18**: el ruleset 21227644 se
  llama hoy **`"Require signed commits"`** (NO `"Pre-Merge Governance Gate"`; `updated_at=2026-09-02`),
  `bypass_actors=[{"actor_id":5,"actor_type":"RepositoryRole","bypass_mode":"pull_request"}]` (la doc dice `[]`),
  `current_user_can_bypass=pull_requests_only` (la doc dice `never`), `ci-enterprise.yml` **ya no aparece** en el
  registro de workflows, y el inventario es **8 activos** (`ci`, `security`, `scheduled-security`,
  `dependabot-updates`, `opencode-review`, `flaky-weekly`, `nightly-full-suite`, `order-dependence-audit`) +
  **4 `disabled_manually`** (`release`, `preview`, `deploy`, `security-digest`). **Sin cambios**: `required_signatures`
  presente y `enforcement: active`; los 4 status checks (`Verify Commit Signatures`, `Commit Lint (Conventional
Commits)`, `PR Title Lint`, `DCO`, `integration_id 15368`); la protección clásica sigue con
  `required_signatures.enabled=false`.
- **Cero cambios de CI, de GitHub y en `.husky/pre-commit`/`commit-msg`**: no se toca `ci.yml`, no se toca el
  ruleset, no se añade red (el `git fetch` del hook ya existía; `git verify-commit`/`%G?` son locales).

## Capabilities

### New Capabilities

- `local-commit-signature-gate`: gate local de verificación de firma en `pre-push` — confianza versionada en la
  raíz (`allowed_signers`), preflight no bloqueante, política de clasificación `%G?` (bloquea `N`/`B`, advierte
  `E`/`U`/`X`/`Y`/`R`), enumeración de SHAs con paridad `ci.yml` + grandfathering `SIGNING_ROLLOUT_DATE`,
  ubicación del bloque fetch+guard → firma → tests, ausencia total de DCO, y documentación del gate +
  corrección factual de §3.5 en `docs/CONTEXT-CICD.md`.

### Modified Capabilities

- `commit-signing-local`: el trust store deja de ser solo `~/.ssh/allowed_signers` de cada máquina —
  `gpg.ssh.allowedSignersFile` SHALL resolver al fichero **versionado en la raíz del repo** (ruta relativa
  resuelta contra el top-level, o absoluta derivada de `rev-parse --show-toplevel`), y el escenario «Commit sin
  firma configurada» (hoy: _no hay hook Husky obligatorio de firma — D8_) pasa a reflejar que **sí existe** una
  enforcement local: `pre-push` bloquea el push de commits posteriores al cutoff sin firma (la creación del
  commit en sí sigue sin hook de firma; el gate es de push).
- `commit-signing-enforcement`: corrección factual del **nombre** del ruleset — el requirement declara
  `Pre-Merge Governance Gate`, nombre que la API ya no devuelve; hoy es `"Require signed commits"`
  (`updated_at=2026-09-02`), con `bypass_actors` = `RepositoryRole actor_id 5` en modo `pull_request` y
  `current_user_can_bypass: pull_requests_only`. El comportamiento de fondo (solo `main`, exige commits
  firmados y verificados, existe bypass de emergencia) **no cambia**; es una sincronización de hecho verificado.

> **No modificadas (y por qué)**: `commit-signing-ci-verification` (su Purpose cita el nombre viejo del ruleset,
> pero no es un requirement; su requirement clave — _el job NUNCA usa `%G?` en el runner sin trust store_ — sigue
> vigente y **complementa** este change: el gate local usa `%G?` **con** trust store versionado, mientras que CI
> sigue consultando la API `.verified`), y `commit-signing-release-migration` (la mención del nombre del ruleset es
> narrativa; su cláusula operativa es `required_signatures`, intacta). **Divergencia detectada y NO resuelta aquí**:
> `ruleset-expansion` _"Bypass actors preserved as NONE"_ contradice el estado API de 2026-10-18 (`bypass_actors` con
> un actor `RepositoryRole` en modo `pull_request`); corregirla implica una **decisión de gobernanza** (¿se mantiene o
> se retira el bypass?) fuera del scope de este change — queda registrada como follow-up en `design.md` (D11) y como
> tarea de deuda explícita.

## Impact

- **`.husky/pre-push`** — único hook tocado: nuevo bloque de verificación de firma entre el guard de `origin/main`
  y la sección de scoped tests. **Asume el hook post-DCO** del change `local-dco-auto-signoff` (sin bucle DCO);
  no se edita `pre-commit`, no se edita `commit-msg`.
- **`allowed_signers` (nuevo, raíz del repo)** — fichero de claves públicas versionado; cualquier clave secreta
  en él rompería la cadena de confianza (guard explícito en tasks).
- **`docs/CONTEXT-CICD.md`** — §10.1/§10.6/§11.1/§12 documentan el nuevo gate de firma L2; §1/§3.4/§3.5/§5.1/§5.9
  se corrigen con la auditoría API 2026-10-18 (nombre del ruleset `Require signed commits`, bypass
  `RepositoryRole actor_id 5` + `pull_requests_only`, inventario 8 activos / 4 `disabled_manually`,
  `ci-enterprise.yml` ausente); cabecera actualizada con la entrada 2026-10-18.
- **`docs/learning/ci-cd/05b-commit-signing.md`** — solo enlaces y secciones mínimas nuevas (setup del trust store
  versionado + troubleshooting del gate), **sin duplicar** F1.1 (líneas 134-135), F2 (198-231) ni §8 (476-516).
- **`AGENTS.md` (bullet Commit Signing, L67)** — referencia al gate local y al trust store versionado, además de `-S`.
- **Config por máquina (documental)** — `git config gpg.ssh.allowedSignersFile allowed_signers` (relativo al
  top-level del worktree) para que la verificación **interactiva** (`git log --show-signature`) use el trust store
  versionado; el hook no depende de esta config (pasa la ruta con `-c`).
- **Specs (deltas de este change)**:
  - `specs/local-commit-signature-gate/spec.md` — **capability NUEVA** (7 requirements WHEN/THEN: preflight,
    política `%G?`, enumeración STDIN, grandfathering, ubicación del bloque + cero DCO, trust store versionado,
    documentación §10/§11/§12 + corrección §3.5).
  - `specs/commit-signing-local/spec.md` — **MODIFIED**: trust store versionado en la raíz y escenario D8
    actualizado con el gate de push.
  - `specs/commit-signing-enforcement/spec.md` — **MODIFIED**: nombre real del ruleset y hechos de bypass
    verificados por API 2026-10-18.
- **Sin impacto**: `.github/workflows/ci.yml` (el job `verify-signatures` no cambia), ruleset 21227644 (sin
  edición de configuración en GitHub), protección clásica de `main`, red (sin llamadas nuevas: `git verify-commit`/
  `%G?` son locales y el `git fetch` del hook ya existía), dependencias npm/lockfile, `.husky/pre-commit`,
  `.husky/commit-msg`, capabilities `pre-push-scoped-testing`, `local-dco-validation` y
  `commit-signing-ci-verification` (todas sin cambio de requirements), y cualquier validación DCO (fuera de scope:
  cero DCO).
