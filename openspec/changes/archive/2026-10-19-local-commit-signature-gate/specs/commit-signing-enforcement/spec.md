# Spec Delta

> **Delta sobre `openspec/specs/commit-signing-enforcement/spec.md` (35 líneas leídas).** MODIFIED del requirement
> `### Requirement: Ruleset en main exige commits firmados` (spec original líneas **9-26**), copiado íntegro. El
> requirement `### Requirement: Error claro en push rechazado` (líneas **28-35**) **no cambia** y por eso no se
> repite aquí. Corrección factual verificada por API el **2026-10-18** (read-only): el nombre del ruleset 21227644
> en la API es **`Require signed commits`** (`updated_at=2026-09-02`), no `Pre-Merge Governance Gate`.
>
> **Reconciliación de los scenarios de bypass (revisión NEEDS CHANGES):** los escenarios citan **solo los campos
> verificados por API** — `actor_id: 5`, `actor_type: "RepositoryRole"`, `bypass_mode: "pull_request"` — y **no
> afirman el rol del actor** (p. ej. «Admin»), que la auditoría no verificó; el bypass **nunca** opera como push
> directo sin firma. El título `Bypass de Admin en emergencia` se conserva **por paridad con el spec original**
> (el validador exige que un bloque MODIFIED no omita scenarios existentes); su contenido es el reconciliado.

## MODIFIED Requirements

### Requirement: Ruleset en main exige commits firmados

GitHub SHALL tener un ruleset 21227644 llamado **`Require signed commits`** (nombre actual en la API, auditoría
2026-10-18, `updated_at=2026-09-02`; el nombre histórico `Pre-Merge Governance Gate` ya no lo devuelve) que apunte
SOLO a la rama `main` — `~DEFAULT_BRANCH` — (las ramas `feature/*` NO tienen protección remota de firma). El
ruleset SHALL aceptar únicamente pushes cuyos commits estén firmados y verificados (`required_signatures` presente
y `enforcement: active`). El ruleset SHALL incluir un bypass de emergencia configurado como
`bypass_actors = [{"actor_id":5,"actor_type":"RepositoryRole","bypass_mode":"pull_request"}]` con
`current_user_can_bypass = pull_requests_only` — es decir, el bypass se ejerce **exclusivamente a través de un
pull request y nunca como push directo sin firma**.

**El comportamiento de fondo NO cambia con esta corrección**: sigue aplicando solo a `~DEFAULT_BRANCH`, sigue
exigiendo commits firmados y verificados, y sigue existiendo un bypass de emergencia (ahora documentado con sus
valores reales de API, sin atribuir rol al actor). **Hechos confirmados sin cambio (2026-10-18):**
`required_signatures` presente y `enforcement: active`; los 4 status checks requeridos — `Verify Commit Signatures`,
`Commit Lint (Conventional Commits)`, `PR Title Lint`, `DCO` — con `integration_id = 15368`; la protección clásica
de `main` sigue con `required_signatures.enabled=false`.

#### Scenario: Push firmado a main

- **WHEN** se hace push de commits firmados y verificados a `main`
- **THEN** el push es aceptado por el ruleset

#### Scenario: Push sin firma a main

- **WHEN** se hace push de un commit sin firma a `main`
- **THEN** el ruleset rechaza el push

#### Scenario: Bypass de Admin en emergencia

- **WHEN** el actor habilitado en `bypass_actors` (`actor_id: 5`, `actor_type: "RepositoryRole"`) invoca el bypass
  del ruleset en una emergencia
- **THEN** el bypass opera **solo en contexto de pull request** (`bypass_mode: "pull_request"`,
  `current_user_can_bypass: pull_requests_only`)
- **AND** un push directo a `main` sin firma sigue siendo rechazado (el bypass **nunca** permite push directo)
- **AND** no se atribuye al actor ningún rol no verificado por la auditoría (el título del scenario se conserva por
  paridad con el spec original)

#### Scenario: Bypass de emergencia vía pull request

- **WHEN** un actor con `actor_type: RepositoryRole` (`actor_id: 5`) necesita saltarse la exigencia de firma en una
  emergencia
- **THEN** el bypass solo es aplicable **en contexto de pull request** (`bypass_mode`/
  `current_user_can_bypass: pull_requests_only`), nunca como push directo a `main`

#### Scenario: Push directo sin firma no lo permite el bypass

- **WHEN** el mismo actor habilitado (`actor_id: 5`, `actor_type: "RepositoryRole"`) intenta un **push directo** a
  `main` con commits sin firma
- **THEN** el ruleset rechaza el push — el estado auditado (`bypass_mode: "pull_request"` +
  `current_user_can_bypass: pull_requests_only`) hace que el bypass no sea aplicable fuera de un PR
- **AND** no se afirma ningún rol («Admin» u otro) del actor: solo los campos verificados por API

#### Scenario: Nombre verificado en la API

- **WHEN** se consulta `GET /repos/{owner}/{repo}/rulesets/21227644` (auditoría 2026-10-18)
- **THEN** el campo `name` es `Require signed commits` y `enforcement` es `active`
- **AND** la documentación del repo (`docs/CONTEXT-CICD.md` §3.5/§5.1) usa ese mismo nombre

> **Divergencia detectada y NO resuelta aquí (follow-up fuera de scope, no silenciada):** el spec
> `openspec/specs/ruleset-expansion/spec.md` — requirement _"Bypass actors preserved as NONE"_ — afirma
> "zero bypass actors (no exceptions for anyone, including admins)", lo que **contradice el estado API de
> 2026-10-18** (`bypass_actors` contiene un actor `RepositoryRole` en modo `pull_request` y
> `current_user_can_bypass: pull_requests_only`). Corregir esa capability exige una **decisión de gobernanza**
> (¿se mantiene o se retira el bypass?) que está fuera del scope de este change — cuyo alcance es solo corregir
> los hechos de `commit-signing-enforcement` y de la documentación. Queda registrada como **D11 en
> `design.md`** y como **tarea de deuda explícita en `tasks.md`** (sin editar `ruleset-expansion` en este change).
