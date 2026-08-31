# Admin-1 Handoff: Repository Squash Merge Settings

## Status: BLOCKED-UNTIL-ADMIN

This document describes the repository settings changes required for Admin-1 to apply. These settings are consistent with `ci-pr-metadata-governance` D3 and preserve DCO trailers.

## Settings to Change

### 1. `squash_merge_commit_title` → `PR_TITLE`

**Current**: Likely `COMMIT_MESSAGES` (default) or `PR_TITLE`  
**Required**: `PR_TITLE`

**Effect**: When a PR is squash-merged, the squash commit title will be the PR title (which is validated by PR Title Lint / Conventional Commits), not the individual commit messages.

### 2. `squash_merge_commit_message` → `COMMIT_MESSAGES`

**Current**: Likely `BLANK` or `PR_BODY`  
**Required**: `COMMIT_MESSAGES`

**Effect**: The squash commit message body will contain all individual commit messages from the PR. This preserves DCO `Signed-off-by` trailers from each commit, maintaining the provenance chain.

> **⚠️ IMPORTANT UI NOTE**: In the current GitHub UI, the two separate dropdowns for `squash_merge_commit_title` and `squash_merge_commit_message` have been CONSOLIDATED into a SINGLE dropdown called **"Default commit message for squash merges"**. The exact combination `PR_TITLE` + `COMMIT_MESSAGES` **IS achievable through the UI** via the **"Pull request title and commit details"** option. The API/`gh` CLI route remains available as an alternative for exactness/admin control.

## Combined Effect

| Setting                       | Value             | Purpose                                                                   |
| ----------------------------- | ----------------- | ------------------------------------------------------------------------- |
| `squash_merge_commit_title`   | `PR_TITLE`        | PR title (Conventional Commits validated) becomes squash commit title     |
| `squash_merge_commit_message` | `COMMIT_MESSAGES` | All individual commit messages (including DCO trailers) preserved in body |

> **UI-available combination**: The pair `PR_TITLE` + `COMMIT_MESSAGES` **is available via the UI** by selecting **"Pull request title and commit details"** in the single dropdown. The REST API (`PATCH /repos/{owner}/{repo}`) or `gh api` remains an alternative — both require **repo admin** permissions and provide exact programmatic control.

## Why This Combination

1. **PR Title Lint** validates PR title follows Conventional Commits (`feat:`, `fix:`, etc.)
2. **Squash commit title** = PR title → squash commit follows Conventional Commits
3. **Squash commit body** = all commit messages → DCO `Signed-off-by` trailers preserved
4. **Consistent with ci-pr-metadata-governance D3** — single source of truth for squash settings

## Función de cada ajuste (detallada)

### `squash_merge_commit_title` → `PR_TITLE`

**Qué hace**: Define el **título (subject line)** del commit resultante del squash merge.

- **Valor `PR_TITLE`**: El título del squash commit = el título del PR.
- **Por qué importa**: El PR Title Lint (workflow `pr-title-lint.yml`) valida que el título del PR siga **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.). Al configurar `PR_TITLE`, garantizamos que **cada squash commit que aterrice en `main` tenga un título Conventional Commits válido**, sin depender de los títulos de los commits individuales (que pueden no seguir el estándar).

### `squash_merge_commit_message` → `COMMIT_MESSAGES`

**Qué hace**: Define el **cuerpo (body)** del commit resultante del squash merge.

- **Valor `COMMIT_MESSAGES`**: El cuerpo del squash commit = **concatenación de TODOS los mensajes de commits individuales** del PR.
- **Por qué importa**: Cada commit individual lleva su propio trailer `Signed-off-by` (DCO). Al preservar **todos** los mensajes de commit en el cuerpo, se mantiene la **cadena de procedencia/atribución completa** (supply-chain provenance). Esto permite auditoría: quién hizo qué, y cada commit está firmado DCO.

### Por qué AMBOS juntos importan

| Objetivo                           | Configuración                                 | Garantía resultante                                                   |
| ---------------------------------- | --------------------------------------------- | --------------------------------------------------------------------- |
| **Título conforme (Conventional)** | `squash_merge_commit_title=PR_TITLE`          | El merge squash en `main` tiene título validado por PR Title Lint     |
| **Procedencia DCO (body)**         | `squash_merge_commit_message=COMMIT_MESSAGES` | Todos los `Signed-off-by` de los commits originales quedan en el body |

Esta combinación da: **título limpio y estándar** + **historial completo de firmas DCO**.

### ⚠️ Realidad actual del UI de GitHub (consolidación a dropdown único)

GitHub **ya no tiene dos dropdowns separados**. Ahora hay **UN solo dropdown**:

**Ubicación**: Settings → General → Pull Requests → "Allow squash merging" → **"Default commit message for squash merges"**

**Las 4 opciones y qué producen (par título/cuerpo cada una):**

| Option label (EN UI)                      | squash_merge_commit_title | squash_merge_commit_message | Título producido                                 | Cuerpo producido                    |
| ----------------------------------------- | ------------------------- | --------------------------- | ------------------------------------------------ | ----------------------------------- |
| **Default message**                       | COMMIT_OR_PR_TITLE        | COMMIT_MESSAGES             | commit title (1 commit) or PR title (2+ commits) | commit message(s) / list of commits |
| **Pull request title**                    | PR_TITLE                  | BLANK                       | PR title                                         | empty                               |
| **Pull request title and commit details** | PR_TITLE                  | COMMIT_MESSAGES             | PR title                                         | commit message(s) / list of commits |
| **Pull request title and description**    | PR_TITLE                  | PR_BODY                     | PR title                                         | PR description                      |

> **Nota de localización**: Si la UI de GitHub está en español, las etiquetas aparecen traducidas, por ejemplo: _"Mensaje de confirmación predeterminado para fusiones squash"_ y opciones como _"Título del pull request y detalles de confirmación"_.

**Trade-off / Recomendación:**

| Prioridad                                                                                       | Elección en UI (si no tienes API/admin)     | Riesgo / Caveat                                                                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Preservar DCO trailers en body + Título = PR title (Conventional garantizado)** (recomendado) | **"Pull request title and commit details"** | En PR de **1 commit**: el cuerpo incluye el mensaje completo (con DCO `Signed-off-by` trailer). En PRs **multi-commit**: "commit details" produce una **lista de commits** que suele ser solo los **subjects** (títulos), **NO** necesariamente los bodies con los trailers DCO de cada commit. **Mitigaciones**: un commit por PR (squash local antes de abrir PR), o DCO bot, o verificar comportamiento en vivo. |
| **Título = PR title (Conventional garantizado), cuerpo vacío**                                  | **"Pull request title"**                    | Cuerpo vacío — no hay trailers DCO en el squash commit. DCO validado a nivel PR.                                                                                                                                                                                                                                                                                                                                    |
| **Título = PR title, cuerpo = PR description**                                                  | **"Pull request title and description"**    | Cuerpo = descripción del PR (plantilla), **NO** incluye commit messages individuales.                                                                                                                                                                                                                                                                                                                               |

**Mejor fidelidad al diseño (requiere admin + API/gh CLI):**

```bash
# Configura AMBOS campos independientemente (exactamente lo que queremos)
gh api --method PATCH /repos/{owner}/{repo} \
  -f allow_squash_merge=true \
  -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=COMMIT_MESSAGES
```

## Admin-1 Application Steps

### Via GitHub UI:

1. Go to Repository → Settings → General → Pull Requests
2. Under "Allow squash merging", configure the **single** dropdown **"Default commit message for squash merges"**:
   - **Recommended (design intent: title = PR title Conventional + body = commit messages with DCO trailers)**: Select **"Pull request title and commit details"** — sets `PR_TITLE` + `COMMIT_MESSAGES`. This achieves the exact design intent WITHOUT needing API/admin.
   - **Alternative (title = PR title, body empty)**: Select **"Pull request title"** — squash title = PR title (Conventional). Body = empty.
   - **Alternative (title = PR title, body = PR description)**: Select **"Pull request title and description"** — squash title = PR title. Body = PR description.
   - > **Note**: The exact combination `PR_TITLE` + `COMMIT_MESSAGES` **IS available** as the **"Pull request title and commit details"** UI option. The API/CLI route remains a valid alternative for exactness/admin control.

### Via GitHub CLI (requires repo admin):

```bash
# Set squash merge commit title to PR_TITLE
gh api --method PATCH /repos/{owner}/{repo} \
  -f allow_squash_merge=true \
  -f squash_merge_commit_title=PR_TITLE \
  -f squash_merge_commit_message=COMMIT_MESSAGES
```

### Via GitHub REST API:

```bash
PATCH /repos/{owner}/{repo}
{
  "allow_squash_merge": true,
  "squash_merge_commit_title": "PR_TITLE",
  "squash_merge_commit_message": "COMMIT_MESSAGES"
}
```

## Verification After Change

1. Create a test PR with multiple commits, each with `Signed-off-by` trailer
2. Squash merge the PR
3. Verify:
   - Squash commit title = PR title (Conventional Commits format)
   - Squash commit body contains all original commit messages including DCO trailers

## Related Files

- `openspec/changes/ci-governance-pre-merge-gates/tasks.md` — Task 2.2
- `openspec/changes/ci-governance-pre-merge-gates/design.md` — Decision D3
- `openspec/changes/ci-pr-metadata-governance/design.md` — Decision D3 (source of truth)

---

**Do NOT execute these settings changes via API.** This is a handoff document for Admin-1 manual application.
Task 2.2 remains `- [ ]` in tasks.md until Admin-1 applies the settings.
