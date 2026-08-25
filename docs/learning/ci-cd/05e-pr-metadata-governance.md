# 05e — PR Metadata Checks: DCO, Título y Body Templates en Enterprise

> **Guía 05e — Research Brief + Implementation Guide** (después de 05d) | Anterior: [05d-ci-commit-lint-implementation.md](./05d-ci-commit-lint-implementation.md)
>
> Esta guía documenta la investigación completa sobre **PR Metadata Checks** (DCO sign-off, PR title validation, body templates) con foco en entornos enterprise. Cubre el landscape de herramientas, interacción con squash-merge, patrones de implementación enterprise, y el roadmap de implementación para Project-one.

---

## 🎯 Objetivo

Responder tres preguntas concretas:

1. **¿Qué son los PR Metadata Checks y por qué importan?**
2. **¿Cómo interactúan con squash-merge (nuestro flujo)?**
3. **¿Qué implementamos nosotros y en qué orden?**

---

## 📋 Resumen Ejecutivo

| Check             | Qué valida                                                  | Enterprise value                           | Effort | Priority |
| ----------------- | ----------------------------------------------------------- | ------------------------------------------ | ------ | -------- |
| **PR Title Lint** | Título del PR sigue Conventional Commits                    | Alto — cierra gap del squash message final | S      | **P1**   |
| **DCO Sign-off**  | Cada commit tiene `Signed-off-by` (trazabilidad de autoría) | Alto — audit trail compliance              | S      | **P1.5** |
| **PR Template**   | Body del PR tiene estructura consistente                    | Alto — reviews consistentes + compliance   | M      | **P2**   |

**Hallazgo estrella**: el lint de PR title **CIERRA** el gap documentado del squash-message (05d). Con `squash_merge_commit_title=PR_TITLE`, el título del PR se convierte en el mensaje del commit final en main — lintearlo = garantizar que main siempre tenga commits convencionales.

---

## 🏗️ ¿Qué son los PR Metadata Checks?

En un flujo PR-based, hay tres momentos donde se puede enforce governance:

```
1. ANTES del commit    → hook commit-msg (commitlint)       ← ya lo tenemos (05d)
2. AL crear el PR      → PR title + body + signed-off-by     ← ESTE DOC
3. AL hacer merge      → ruleset required checks             ← ya lo tenemos (ruleset 21227644)
```

Los PR Metadata Checks operan en el **momento 2** — cuando se crea o actualiza el PR. Son la capa que validla **intención y trazabilidad** del cambio, no solo el formato del código.

### Los tres componentes

| Componente        | Qué es                                                                        | Herramienta                              |
| ----------------- | ----------------------------------------------------------------------------- | ---------------------------------------- |
| **PR Title Lint** | Valida que el título del PR siga Conventional Commits (`feat:`, `fix:`, etc.) | `amannn/action-semantic-pull-request@v6` |
| **DCO Sign-off**  | Valida que cada commit del PR tenga `Signed-off-by: Name <email>`             | `KineticCafe/actions-dco@v3.2.0`         |
| **PR Template**   | Estructura predefinida del body del PR (summary, issue link, testing, etc.)   | `.github/PULL_REQUEST_TEMPLATE.md`       |

---

## 🔬 DCO Sign-off: Deep Dive

### ¿Qué es el DCO?

**Developer Certificate of Origin** — declaración legal estandarizada (Linux Foundation, DCO v1.1) que certifica: _"Tengo derecho a contribuir este código bajo la licencia del proyecto"_.

Se manifiesta como un trailer en el commit:

```
feat: add payment flow

Signed-off-by: DevJohan <johan@empresa.com>
```

Se añade con `git commit -s` (flag `-s`).

### DCO vs Firma SSH/GPG

|                           | Firma SSH/GPG                                  | DCO                                      |
| ------------------------- | ---------------------------------------------- | ---------------------------------------- |
| **Naturaleza**            | Criptográfica                                  | Legal/Contractual                        |
| **Prueba**                | Autenticidad (quién escribió, no fue alterado) | Derecho (certifico que puedo contribuir) |
| **No repudiable**         | Sí (firma matemática)                          | No (es una declaración honoraria)        |
| **Protege contra**        | Suplantación, tampering                        | Demandas por código sin derechos         |
| **Requiere**              | Clave SSH/GPG registrada                       | `git commit -s` + email correcto         |
| **¿Son complementarios?** | SÍ — cubren capas distintas                    | SÍ — identidad vs derecho                |

### ¿Cuándo importa el DCO?

```
¿Quién contribuye?

├── Solo employees internos
│   ├── Contrato laboral YA asigna IP → DCO es REDUNDANTE técnicamente
│   ├── PERO enterprise lo usa como AUDIT TRAIL (evidencia intencional)
│   └── SOC2/ISO27001: trazabilidad de cambios = control requerido
│
├── Employees + contractors
│   ├── Contractor agreement cubre IP assignment
│   ├── DCO = evidencia adicional (paper trail)
│   └── Enterprise verdict: DCO recomendado
│
└── Open-source (externos)
    ├── NO hay contrato que cubra IP
    ├── DCO = MÍNIMO OBLIGATORIO
    └── CLA = ideal pero más pesado
```

### Herramientas de DCO (Comparación)

| Herramienta                          | Tipo            | Mantenimiento         | Bot handling                                              | Veredicto          |
| ------------------------------------ | --------------- | --------------------- | --------------------------------------------------------- | ------------------ |
| `probot/dco` (DCO App clásica)       | GitHub App      | ❌ MUERTA (~2024)     | Exenta bots por defecto                                   | **No usar**        |
| `cncf/dco2` (App nueva CNCF)         | GitHub App      | ✅ Activa 2026 (Rust) | Categorías config                                         | Alternativa App    |
| **`KineticCafe/actions-dco@v3.2.0`** | GitHub Action   | ✅ Activa             | **RICHEST**: policy all/well-known/allowlist + categorías | **ELEGIDA**        |
| `tisonkun/actions-dco`               | GitHub Action   | Baja actividad        | Básico                                                    | Alternativa simple |
| `christophebedard/dco-check`         | Script multi-CI | Moderada              | Por plataforma                                            | Alternativa        |
| Custom script                        | Self-hosted     | Dependencia tuya      | Tú implementas                                            | Control total      |

### ¿Por qué KineticCafe?

- **Config TOML rica**: policy `well-known` con categorías predefinidas
  - `dependency-updaters`: dependabot[bot], renovate[bot], snyk-bot[bot]
  - `ci-cd`: github-actions[bot]
  - `release`: semantic-release[bot], release-please[bot]
- **Parsing inteligente**: maneja edge cases de dependabot (email `support@github.com` ≠ author email)
- **Action, no App**: no necesitas instalar GitHub App con permisos extendidos
- **Políticas granulares**: `all` (exenta todos), `well-known` (solo categorías conocidas), `allowlist` (explícitos), `none` (nadie exento)

```toml
# .github/dco-check.toml
[bot]
policy = "well-known"
categories = ["dependency-updaters"]
```

---

## 🔨 Squash-Merge × DCO: La Historia Real

### ¿Preserva GitHub los `Signed-off-by` en squash?

**SÍ, SI el setting es correcto.** GitHub squash NO descarta trailers automáticamente — depende de `squash_merge_commit_message`:

| Setting               | ¿Preserva Signed-off-by?                                                   |
| --------------------- | -------------------------------------------------------------------------- |
| `DEFAULT`             | Depende del formato del commit message original                            |
| `PR_TITLE`            | Solo preserva el título (body se pierde si COMMIT_MESSAGES no está activo) |
| **`COMMIT_MESSAGES`** | ✅ **SÍ** — concatena mensajes originales incluyendo trailers              |
| `PR_BODY`             | Preserva el body del PR                                                    |
| `BLANK`               | ❌ NO — descarta todo                                                      |

**Nuestro setting actual**: `COMMIT_MESSAGES` → **los trailers SÍ sobreviven al squash**. ✅

### Flujo completo con DCO + squash

```
PR con 3 commits:
  feat: A
  Signed-off-by: Juan <juan@empresa.com>
  fix: B
  Signed-off-by: María <maria@empresa.com>
  docs: C
  Signed-off-by: Juan <juan@empresa.com>

  └─► Squash-MERGE (COMMIT_MESSAGES setting)
      └► Commit en main:
          Subject: feat(auth): add payment flow  ← del PR title
          Body:
            feat: A                              ← de COMMIT_MESSAGES
            Signed-off-by: Juan                  ← PRESERVADO ✅
            fix: B
            Signed-off-by: María                 ← PRESERVADO ✅
            docs: C
            Signed-off-by: Juan                  ← PRESERVADO ✅
```

### CNCF/LF avala este patrón

LF oficial recomienda: _"When merging... include Signed-off-by lines from every contributor, and add one for you as the person merging."_ → nuestro setting `COMMIT_MESSAGES` hace esto automáticamente.

### El workaround enterprise (4 opciones)

| Opción                   | Descripción                                     | Fricción | Nuestro caso        |
| ------------------------ | ----------------------------------------------- | -------- | ------------------- |
| (a) PR como audit record | DCO check en PR + GitHub audit log = suficiente | Baja     | ✅ Nuestro approach |
| (b) Maintainer re-signa  | Humano pega trailers en squash dialog           | Alta     | ❌ No práctico      |
| (c) Push ruleset regex   | Requiere Team/Enterprise plan                   | Media    | ⚠️ Futuro opcional  |
| (d) Ignore post-squash   | Solo audit log                                  | Muy baja | ⚠️ Débil solo       |

**Nuestro approach: (a) + setting COMMIT_MESSAGES** → los trailers sobreviven al squash sin intervención manual.

---

## 📝 PR Title Lint: Deep Dive

### ¿Por qué importa en squash-merge?

Con `squash_merge_commit_title=PR_TITLE`:

- El título del PR = el mensaje del commit final en main
- PR Title Lint valida ese título ANTES del merge
- **Resultado**: main siempre recibe commits convencionales ✅

Con `COMMIT_OR_PR_TITLE` (nuestro setting actual):

- Single commit PR → squash usa commit message (ya validado por commit-lint)
- Multi-commit PR → squash usa PR title (validado por PR Title Lint)
- **Resultado**: ambos cubiertos ✅ (pero inconsistente — PR_TITLE es más simple)

### Herramienta: amannn/action-semantic-pull-request@v6

```yaml
pr-title-lint:
  name: PR Title Lint
  runs-on: ubuntu-latest
  permissions:
    pull-requests: read
  if: github.event_name == 'pull_request'
  steps:
    - uses: amannn/action-semantic-pull-request@v6
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        types: |
          feat
          fix
          docs
          style
          refactor
          perf
          test
          build
          ci
          chore
          revert
        requireScope: false
        subjectPattern: ^(?![A-Z]).+$
        ignoreLabels: |
          bot
          ignore-semantic-pull-request
```

**Types** — alineados con `@commitlint/config-conventional` (nuestra config actual de commitlint).

---

## 📋 PR Template: Deep Dive

### ¿Por qué es un control de compliance?

En enterprise, el PR template no es "comodidad" — es **evidencia de gobierno del cambio**:

| Sección del template | Control de compliance             | SOC2/ISO reference        |
| -------------------- | --------------------------------- | ------------------------- |
| Summary              | Qué cambió y por qué              | CC8.1 (Change Management) |
| Type/Scope           | Clasificación del cambio          | CC6.1 (Logical Access)    |
| Related Issue        | Traceabilidad requirements→code   | CC8.1, ISO A.8.1          |
| Testing              | Evidencia de validación           | CC7.1 (System Operations) |
| Screenshots          | Evidencia visual                  | CC8.1                     |
| Checklist            | Auto-verification del contributor | CC8.1                     |

### Template recomendado para Project-one

```markdown
## Summary

<!-- ¿Qué hace este cambio y por qué? -->

## Type / Scope

<!-- Marca uno: -->

- [ ] Client (React/Vite)
- [ ] Server (Express/Prisma)
- [ ] E2E (Playwright)
- [ ] Shared/Config
- [ ] CI/CD

## Related Issue

<!-- Link al ticket/story — required para trazabilidad -->

Closes #

## How Has This Been Tested?

<!-- Evidencia de testing — SOC2 CC8.1 -->

- [ ] Unit tests (vitest)
- [ ] Integration tests
- [ ] E2E tests (playwright)
- [ ] Manual testing
- [ ] N/A (docs/config only)

## Screenshots (if applicable)

<!-- Evidencia visual para cambios UI -->

## Pre-merge Checklist

- [ ] Signed-off-by present in all commits (`git commit -s`)
- [ ] Tests pass locally
- [ ] Documentation updated (if needed)
- [ ] No breaking changes (or documented in Summary)
```

### Enforcement real: ¿se puede forzar el body?

**GitHub NO puede nativamente** — solo sugiere el template. Opciones de enforcement:

| Opción                          | Effort     | Realidad                                   |
| ------------------------------- | ---------- | ------------------------------------------ |
| Template visual (solo)          | Bajo       | El más común — funciona por cultura        |
| Action que valide body no-empty | Medio      | Reduce PRs vacíos pero no valida contenido |
| Danger.js script                | Medio-Alto | Valida checklist completada pero维护成本高 |
| Review guideline + CODEOWNERS   | Medio      | La review humana como gate                 |

**Para enterprise, el approach estándar es: template + review culture + CODEOWNERS**. La automatización total del body es más fricción que valor.

---

## 📊 Decisiones de Diseño (Research-Backed)

### D1: DCO como job paralelo separado (no unificar con commitlint)

| Razón                          | Detalle                                                                |
| ------------------------------ | ---------------------------------------------------------------------- |
| Separación de concerns         | commitlint = formato; DCO = trazabilidad legal                         |
| Required checks independientes | Si uno falla, el otro sigue valido para debugging                      |
| Rollout independiente          | Se puede activar antes/después                                         |
| Patrón consistente             | Mismo patrón que commit-lint: job paralelo, no needs, ci-complete gate |

### D2: Squash setting unchanged vs changed

| Setting actual     | `COMMIT_OR_PR_TITLE` + `COMMIT_MESSAGES`                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| Pros               | Single-commit: commit msg (commit-lint); multi: PR title (PR Title Lint)                                                  |
| Contras            | Inconsistente: a veces linteamos título, a veces commit message                                                           |
| Cambio propuesto   | `PR_TITLE` + `COMMIT_MESSAGES`                                                                                            |
| Pros del cambio    | Consistente: siempre PR title = squash subject = lo que PR Title Lint valida                                              |
| Contras del cambio | Single-commit PRs cuyo commit message es good pero PR title no → PR Title Lint falla (eso es BUENO — fuerza consistencia) |

**Decisión**: cambiar a `PR_TITLE` para consistencia.

### D3: Body validation — template visual + review culture (no automation)

Razón: la automatización del body es fragile (templates cambian, bots whitelist, false positives). En enterprise, la review humana + CODEOWNERS es el gate real para el body.

---

## 🗺️ Roadmap de Implementación

### P1: PR Title Lint (effort: S)

1. Agregar job `pr-title-lint` a ci.yml (paralelo, no needs, ADD-only)
2. Registrar `PR Title Lint` como required check en ruleset 21227644
3. Cambiar repo setting `squash_merge_commit_title=PR_TITLE`
4. Rollout: `continue-on-error: true` por un ciclo → luego Active

### P1.5: DCO Check (effort: S)

1. Agregar job `dco` a ci.yml usando `KineticCafe/actions-dco@v3.2.0`
2. Whitelist dependabot via config TOML `well-known` policy
3. Registrar `DCO` como required check en ruleset 21227644
4. Documentar en CONTRIBUTING.md: `git commit -s` obligatorio

### P2: PR Template + Guidelines (effort: M)

1. Crear `.github/PULL_REQUEST_TEMPLATE.md` con las 6 secciones
2. Agregar CODEOWNERS para review boundaries
3. Documentar PR guidelines en CONTRIBUTING.md
4. (Opcional) Action ligera para validar body no-empty

---

## ⚠️ Gotchas Enterprise

1. **Exact-name case-sensitive**: el `name:` del job debe coincidir EXACTAMENTE con el string registrado en el ruleset. Mismatch → deadlock de "Expected — waiting".
2. **Dependabot email mismatch**: author email es `+dependabot[bot]@users.noreply.github.com` pero sign-off es `support@github.com`. KineticCafe lo maneja; scripts custom necesitan whitelist explícita.
3. **Squash trailer loss**: si `squash_merge_commit_message` no es `COMMIT_MESSAGES`, los Signed-off-by se pierden. Verificar setting ANTES de activar DCO check.
4. **probot/dco está muerto**: no instalar la DCO App clásica. Usar `cncf/dco2` (App) o `KineticCafe/actions-dco` (Action).
5. **Zero-bypass ruleset**: dependabot, release-please, y otros bots generarán PRs que deben pasar los checks — whitelist OBLIGATORIO en las configs de los Actions.
6. **PR body enforcement**: GitHub NO puede nativamente forzar contenido del body. No intentar automatizar lo que la review humana hace mejor.

---

## 📚 Referencias

| Recurso                             | URL                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| KineticCafe/actions-dco             | https://github.com/KineticCafe/actions-dco                                                                                   |
| amannn/action-semantic-pull-request | https://github.com/amannn/action-semantic-pull-request                                                                       |
| CNCF dco2 App                       | https://github.com/cncf/dco2                                                                                                 |
| LF DCO Best Practices               | https://bestpractices.linuxfoundation.org/ip/contribution-mechanisms-dco.html                                                |
| GitHub squash options (2022)        | https://github.blog/changelog/2022-08-23-new-options-for-controlling-the-default-commit-message-when-merging-a-pull-request/ |
| OpenSpec change                     | `openspec/changes/pr-metadata-governance/`                                                                                   |

---

## 🔮 Futuro: Enterprise Implementation Patterns (Para Profundizar)

> **Nota**: esta sección es un placeholder para investigación futura sobre patrones avanzados de implementación en entornos empresariales. Los siguientes temas merecen un deep-dive dedicado:
>
> - **CLA (Contributor License Agreement)**: cuándo DCO no es suficiente y se necesita CLA bilateral (patent grants, relicensing rights, copyright assignment). Comparación DCO vs CLA en escenarios de auditoría SOC2/ISO27001 real.
> - **Push rulesets para Signed-off-by**: regex en el commit message como defense-in-depth contra el squash-time stripping (requiere plan Team/Enterprise). Cómo configurar y rollout.
> - **CODEOWNERS patterns**: design patterns para ownership boundaries en monorepos (client/server/e2e). Integración con required reviewers.
> - **Automated compliance dashboards**: cómo exportar evidencia de DCO/title-lint/template-compliance para auditorías (GitHub API, audit log exports, SIEM integration).
> - **Multi-repo governance**: cómo escalar PR metadata checks a nivel organization (org-wide rulesets, shared Actions, reusable workflows).
> - **Patrones de Mantycore/MorganStanley/Netflix**: cómo empresas fintech/enterprise reales implementan DCO + CLA + CODEOWNERS como stack de compliance.

---

## ➡️ Siguiente

> **Has completado el research brief de PR Metadata Checks** — junto con 05c (signing) y 05d (commit-lint), cubre las tres capas de gobernanza de commits: quién firma, cómo se escribe, y qué metadatos acompaña cada PR.

> **Índice**: [README Avanzado](./avanzado-README.md) · **Anterior**: [05d-ci-commit-lint-implementation.md](./05d-ci-commit-lint-implementation.md)
