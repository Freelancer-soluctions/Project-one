# DCO — Developer Certificate of Origin

> Documento canónico y transversal del DCO en Project One. Es el único punto de entrada para entender qué
> certifica un `Signed-off-by`, cómo lo producen los hooks locales, cómo lo valida CI y qué pitfalls existen.
> La mecánica de Husky vive en `docs/learning/ci-cd/05-husky-git-hooks.md` y el setup de la firma SSH (`-S`)
> en `docs/learning/ci-cd/05b-commit-signing.md`: aquí se enlazan, no se duplican.

---

## 1. Qué es el DCO v1.1

El **Developer Certificate of Origin v1.1** es una declaración que el contribuyente hace en cada commit
mediante el trailer `Signed-off-by:`. Al firmar, certifica las cuatro cláusulas del texto oficial:

- **(a)** que tiene derecho a contribuir con el código bajo la licencia del proyecto (aquí, licencias
  permisivas del monorepo);
- **(b)** que la contribución se realiza bajo la licencia indicada del proyecto, sin condiciones adicionales;
- **(c)** que conserva el copyright de su contribución y puede otorgar la licencia correspondiente; y
- **(d)** que la contribución y su attestación quedan registradas públicamente y son trazables.

### DCO vs CLA

| Aspecto   | DCO                                    | CLA (Contributor License Agreement)                            |
| --------- | -------------------------------------- | -------------------------------------------------------------- |
| Qué es    | Certificación de **origen** por commit | Contrato de **concesión de licencia** (a veces cesión)         |
| Formato   | Trailer `Signed-off-by: Name <email>`  | Documento/firma electrónica, habitualmente una vez por persona |
| Alcance   | Cada commit                            | A nivel de contribuyente, antes de contribuir                  |
| Revocable | Es una declaración por commit          | Suele requerir proceso legal para revocar                      |

Este repo exige **DCO y no CLA**: el commit firmado ya documenta autoría y permiso, encaja con el flujo de
Pull Requests y con el check automático de CI, y no añade fricción contractual al equipo.

Fuentes oficiales:

- <https://developercertificate.org/>
- <https://wiki.linuxfoundation.org/dco>
- <https://openinfra.org/dco/>
- <https://docs.openstack.org/contributors/common/dco.html>

---

## 2. El trailer `Signed-off-by`: formato y mecánica

Formato exacto (una línea por attestación, al final del mensaje, en el bloque de trailers):

```text
Signed-off-by: Name <email>
```

- **`-s` (signoff manual).** `git commit -s` añade el trailer. Git firma como **committer**, no como autor.
- **`-S` (firma criptográfica).** `git commit -S` firma el commit con la clave SSH ed25519 (ver
  `05b-commit-signing.md`). Es **ortogonal** al DCO: el commit puede estar firmado y sin signoff, o al revés.
  La convención del repo es `git commit -S -s`.
- **Hook de auto-signoff.** `.husky/prepare-commit-msg` inyecta el trailer automáticamente usando la
  **identidad real de git**: `git var GIT_COMMITTER_IDENT` (comportamiento idéntico a `-s`, que firma como
  committer), con fallback a `git var GIT_AUTHOR_IDENT` si el committer no es resoluble. La inyección se hace
  con `git interpret-trailers --in-place --trailer …`, nunca con `printf >>`.
- **Overrides de identidad.** `GIT_COMMITTER_NAME`/`GIT_COMMITTER_EMAIL` mandan en la identidad primaria; en
  el fallback se respetan `GIT_AUTHOR_NAME`/`GIT_AUTHOR_EMAIL`; por debajo quedan `user.name`/`user.email`.
  No hay identidad hardcodeada.
- **Deduplicación.** El hook primero comprueba la presencia case-sensitive del trailer en el mensaje completo
  (misma semántica que `commit-msg`). `-s` corre **antes** del hook, así que el guard ve el trailer y no
  duplica. Este guard es la garantía real: `interpret-trailers` solo deduplica valores idénticos.
- **`Co-authored-by` no satisface el DCO.** El parser de CI exige específicamente `Signed-off-by`.
- **Merge commits.** Están exentos: el hook sale con `exit 0` cuando el source es `merge`, y `commit-msg`
  omite la validación si la primera línea empieza por `Merge` seguido de un espacio.
- **Validación autoritativa.** CI usa `KineticCafe/actions-dco` con parser **strict**: exige un bloque único
  de trailers al final del mensaje, sin texto no-trailer después, nombre y email válidos, e identidad de
  **author o committer**. El parser valida; no produce el trailer.

### El mito `commit.signoff`

`commit.signoff` **no es una variable de configuración de git**. `git help --config` no la lista y
`git commit` la ignora: `git config --global commit.signoff true` no inyecta ningún `Signed-off-by`.
Git upstream **rechaza deliberadamente** esa variable para preservar el valor legal de un sign-off
intencionado (ver la sección de gitfaq más abajo).

- `format.signoff` **sí existe**, pero solo aplica a `format-patch`, `am` y `send-email`, no a `git commit`.
- El único camino de automatización local fiable es el hook `prepare-commit-msg`.
- **Matiz legal declarado:** automatizar el sign-off debilita el argumento de "intención deliberada" que
  upstream protege. Se acepta conscientemente en este repo porque la intención queda atestiguada por la
  identidad real del committer y por el check de CI required + blocking; no se oculta.

---

## 3. Contratos de los hooks locales

Husky v9 registra los hooks con `core.hooksPath=.husky/_`: los shims delegan en el dispatcher `h`, que
ejecuta `sh -e <hook>` por existencia del fichero. `npm run husky:disable` / `npm run husky:enable` renombran
el directorio completo. `HUSKY=0` desactiva las capas locales; CI (L3) no depende de Husky.

| Hook                 | Cuándo corre          | Rol DCO                                                                   | Exit                                                         |
| -------------------- | --------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `prepare-commit-msg` | Antes del editor      | **L1 — inyecta** el trailer de forma idempotente (source `merge` exento)  | **Siempre 0**: solo repara, nunca bloquea                    |
| `commit-msg`         | Al validar el mensaje | **L2 — valida** presencia case-sensitive del trailer, ANTES de commitlint | `exit 1` con guidance si falta                               |
| `pre-push`           | Antes de `git push`   | **No valida DCO** (ver abajo)                                             | Falla por el gate de firma o los tests scoped; nunca por DCO |

- **`prepare-commit-msg`** recibe `$1` (fichero de mensaje) y `$2` (source). No es suprimible por
  `--no-verify`: ese flag solo salta `pre-commit` y `commit-msg`. Si no puede resolver la identidad o el
  fichero, sale con 0 sin editar; el rechazo autoritativo por ausencia sigue siendo de `commit-msg`. Todo
  comando con estatus no-cero posible va guardado porque Husky lo ejecuta bajo `set -e`.
- **`commit-msg`** es el **único gate local de validación**. Salta merge commits (prefijo `^Merge` + espacio),
  comprueba el trailer con un grep case-sensitive sobre el mensaje completo y ejecuta commitlint solo si el DCO pasa.
  La guidance del error es accionable (`git commit -s` / `git commit --amend -s` + nota del auto-signoff).
- **`pre-push`** — **pre-push no valida DCO**. Conserva el `git fetch origin main --depth=1`, el guard de
  existencia de `origin/main` (los tests scoped usan `--changed origin/main`) y la sección de tests scoped
  (`test:changed` de server y client); además incorpora el gate local de firma de commits de la capability
  `local-commit-signature-gate` (no relacionado con DCO). No inspecciona trailers.

Taxonomía: este documento usa el **modelo de capas DCO** (L0 identidad → L1 inyección → L2 validación →
L3 CI). `docs/CONTEXT-CICD.md` §11.1 usa una taxonomía distinta de **tiempos de ejecución** (L1 pre-commit,
L2 pre-push, L2.5 PR title, L3 CI); no son intercambiables: el tier L1 de §11.1 contiene las capas DCO L1 y
L2, el tier L2 (pre-push) **no es capa DCO**, y el tier L3 es la capa DCO L3. Los documentos de este repo
deben declarar ambos esquemas sin renumerarlos.

---

## 4. Herramientas de enforcement

| Herramienta                 | Punto de enforcement                         | Bloquea                                            | Configuración / esfuerzo                                                              | Bots                                                               |
| --------------------------- | -------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **KineticCafe/actions-dco** | CI, status check required (ruleset 21227644) | Sí: check required + blocking para el flujo normal | `config` inline en `ci.yml` (job `dco`); parser `strict`; `bot.policy` y `categories` | `well-known` + `categories = ["dependency-updaters"]` en este repo |
| **probot (`dcoapp/app`)**   | GitHub App sobre PRs                         | Sí (override manual para write-access)             | Instalación de la App + política de emails                                            | Bots y merge exentos por defecto                                   |
| **`tim-actions/dco`**       | CI, action                                   | Sí (falla el job)                                  | Mínima; solo presencia                                                                | Sin política de bots documentada                                   |

**Por qué KineticCafe:** ya está integrado como check `DCO` required y blocking en `ci.yml`, atado al ruleset
21227644 (`Require signed commits`), con parser `strict` (posición/formato del trailer) y política de bots
tunable. Snapshot verificado 2026-10-19: el ruleset tiene `enforcement: active` y un bypass
`RepositoryRole` (`actor_id 5`) en modo `pull_request`, con `current_user_can_bypass: pull_requests_only` —
el bypass **no** es un push directo sin check, y su permanencia es una decisión de gobernanza separada.
Cambiar de herramienta aportaría poco y perdería la integración actual.

---

## 5. Pitfalls conocidos y mitigación

1. **Commits web-flow (GitHub UI).** No ejecutan hooks locales, así que no reciben auto-signoff. GitHub no
   ofrece "commit and sign off". _Mitigación:_ reparar localmente con `git commit --amend -s` / revert, o
   usar un alias/exención acordada; CI es el backstop.
2. **Squash-merge de PRs multi-commit.** Con `squash_merge_commit_message=COMMIT_MESSAGES`, el mensaje
   squash puede perder los trailers individuales. _Mitigación:_ preferir PRs de un commit o rebase-merge
   cuando la preservación del historial de attestaciones importe; reparar con `--amend -s` si hace falta.
3. **Commits de bots.** Dependabot autorea con `49699333+dependabot[bot]@users.noreply.github.com`. La
   política **activa** del repo es `bot.policy = "well-known"` con `categories = ["dependency-updaters"]`
   (job `dco` de `ci.yml`): solo se eximen bots de dependencias conocidos. El default upstream de
   KineticCafe es `all` y un `.github/dco-check.toml` en la rama por defecto tendría prioridad sobre el
   `config:` del workflow; si apareciera, re-verificar que no restauró `all`.
4. **Amend, rebase y cherry-pick.** El hook repara retroactivamente un `--amend` sin trailer y es
   idempotente en replays. Un cherry-pick conserva el trailer original pero crea un **committer nuevo**:
   rompe matchers estrictos author==trailer (probot), no el gate de este repo (KineticCafe acepta author o
   committer).
5. **`release.yml` / commits de App.** El release commitea/taggea como App o web-flow, sin hooks locales;
   misma clase de riesgo que web-flow.
6. **`commit.template` con un ejemplo literal.** Un template que contenga un trailer de ejemplo con nombre y
   email de placeholder hace que el guard de presencia suprima la inyección de la identidad real, y `commit-msg`
   (también solo-presencia) lo daría por válido hasta que CI lo rechace por identidad. _Mitigación:_ no poner
   ejemplos literales en el template o pasar `-s` explícito. Este repo no tiene `commit.template`.
7. **Matiz legal.** Ver §2: automatizar el sign-off debilita el argumento de intención deliberada; aceptado
   conscientemente.
8. **Riesgo residual aceptado (sin re-check en `pre-push`).** Los commits que entran al historial local sin
   pasar por los hooks —cherry-pick de una rama ajena, `HUSKY=0`/hooks desactivados, commits anteriores a
   este change, tooling GUI que salta hooks, `--no-verify` con identidad irresoluble— ya **no** se detectan
   en el dev: no reciben auto-signoff ni rechazo local. _Control compensatorio:_ el check `DCO` de CI los
   rechaza en el PR (required + blocking); el feedback se desplaza del push al PR, pero el gate final no se
   pierde.

---

## 6. Diseño en capas: local → CI

| Capa   | Mecanismo                                                         | Punto                 | ¿Suprimible?                                        | Rol                                       |
| ------ | ----------------------------------------------------------------- | --------------------- | --------------------------------------------------- | ----------------------------------------- |
| **L0** | Identidad git (`user.name`/`user.email`, overrides `GIT_*_IDENT`) | dev                   | n/a                                                 | Fuente del nombre+email del trailer       |
| **L1** | `prepare-commit-msg` auto-signoff                                 | dev, antes del editor | **No** por `--no-verify`; sí por `HUSKY=0`          | Garantiza el trailer por construcción     |
| **L2** | `commit-msg` presencia DCO (case-sensitive, antes de commitlint)  | dev, al hacer commit  | Sí (`--no-verify`, `HUSKY=0`)                       | **Único gate local de validación**        |
| **L3** | CI `DCO` (KineticCafe, job `dco` de `ci.yml`, ruleset 21227644)   | GitHub, en el PR      | No en el flujo normal (bypass auditado solo vía PR) | Backstop autoritativo del riesgo residual |

- **No existe una capa DCO en `pre-push`.** Ese hook hace fetch + guard de `origin/main` + tests scoped
  (y el gate de firma, ajeno al DCO).
- **Mapeo local→CI:** L1+L2 en el dev, L3 en GitHub. `--no-verify` salta L2 pero **no** L1; `HUSKY=0`
  desactiva L1-L2; L3 no depende de Husky.
- **Defense-in-depth genuina:** L1 inyecta y L2 valida (no se duplican); L3 repite la validación con
  autoridad de parser (feedback temprano + red inbypasseable en el flujo normal).
- **Riesgo residual:** ver §5.8; los commits que evitan los hooks los cubre solo CI.
- **Sin duplicación:** mecánica de hooks en `docs/learning/ci-cd/05-husky-git-hooks.md`; setup de claves y
  firma SSH en `docs/learning/ci-cd/05b-commit-signing.md`.

---

## 7. Comandos útiles

```bash
# Commit con la convención del repo (firma SSH + signoff)
git commit -S -s -m "feat(scope): descripción"

# Reparar el último commit sin trailer
git commit --amend -s --no-edit

# Ver el trailer final de un commit
git log -1 --format=%B

# Verificar el bloque de trailers (mismo parser que usa CI)
git log -1 --format=%B | git interpret-trailers --parse
```

---

## 8. Referencias

- <https://developercertificate.org/>
- <https://wiki.linuxfoundation.org/dco>
- <https://openinfra.org/dco/>
- <https://docs.openstack.org/contributors/common/dco.html>
- <https://git-scm.com/docs/githooks>
- <https://git-scm.com/docs/git-commit>
- <https://git-scm.com/docs/git-interpret-trailers>
- <https://github.com/git/htmldocs/blob/gh-pages/gitfaq.adoc>
- <https://typicode.github.io/husky/>
- <https://github.com/KineticCafe/actions-dco>
- <https://github.com/dcoapp/app>
- <https://github.com/tim-actions/dco>
- <https://docs.gitlab.com/ee/user/project/repository/push_rules/>
