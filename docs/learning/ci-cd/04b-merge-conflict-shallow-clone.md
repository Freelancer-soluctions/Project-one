# 04b — Caso de Estudio: `refusing to merge unrelated histories` (Shallow Clone)

> **Guía 04b de 5+1 — Nivel Fundamentos** | **Prerrequisitos:** [01-git-y-yaml.md](./01-git-y-yaml.md) completado (estrategias de merge) | **Anterior:** [04-docker-basico-para-cicd.md](./04-docker-basico-para-cicd.md) | **Siguiente:** [Nivel Intermedio (05)](05-husky-git-hooks.md)
>
> Guía **complementaria del nivel Fundamentos**, ligada a la **01 (Git)**: crónica didáctica de un incidente real (PR #120) — cómo un **clone shallow** convirtió un merge rutinario en un `fatal: refusing to merge unrelated histories`, y cómo se resolvió conservando los cambios de la rama actual sin `--allow-unrelated-histories`. Esta guía es un **caso de estudio (post-mortem), no una guía teórica**: todo lo que describe ocurrió, con comandos y salidas reales.

---

## 🎯 Objetivo

Al terminar esta guía sabrás:

1. **Reconocer** un clone **shallow/parcial** y sus síntomas (el marcador `(grafted)`).
2. **Explicar** por qué git se niega a mergear con `refusing to merge unrelated histories`.
3. **Evitar** el anti-pattern `--allow-unrelated-histories` y sus consecuencias catastróficas.
4. **Completar** el historial con `git fetch --unshallow origin` y recuperar el ancestro común.
5. **Resolver** un merge multi-archivo **conservando la versión de tu rama** (`--ours`), incluyendo conflictos por **renames**.
6. **Cerrar** el ciclo: `git add`, merge commit firmado, `push`, y verificación del PR (`MERGEABLE` vs `BLOCKED`).

---

## 📋 Resumen del incidente

```
Usuaria/o intenta mergear la rama ci/governance-gates (PR #120)

  GitHub UI: "This branch has conflicts that must be resolved"
      │
      ▼
  Local: git merge origin/main
      │
      ▼
  fatal: refusing to merge unrelated histories      ← NO es un conflicto normal
      │
      ▼
  Diagnóstico: clone SHALLOW (historial truncado, "(grafted)")
      │
      ▼
  Solución: git fetch --unshallow origin  →  merge-base recuperado  →  merge
      │
      ▼
  Resolución: 16 archivos en conflicto (4 content + 12 renames) a favor de --ours
      │
      ▼
  Commit merge firmado  →  push  →  PR #120 = MERGEABLE
```

**Resultado**: el conflicto desapareció del PR; el PR quedó `MERGEABLE`, con los status checks del ruleset (`Verify Commit Signatures`, `Commit Lint`) como único bloqueo transitorio.

---

## 🚀 Cómo solucionarlo — receta completa (copy-paste)

> **Si solo te llevas una cosa de esta guía, que sea este bloque.** Es el "antes" y el "después" del problema: primero **completa el historial** (para que git encuentre el ancestro común) y solo entonces **mergea y resuelve**. No uses `--allow-unrelated-histories`.

### Paso 0 — Cerrar el área de trabajo

Asegúrate de no tener cambios sin commitear antes de mergear:

```bash
git status            # debe estar limpio (o haz commit/stash primero)
git status --short    # p. ej.: solo archivos ya trackeados y limpios
```

### Paso 1 — Diagnosticar (¿es un shallow clone?)

```bash
git rev-parse --is-shallow-repository
# true  →  es shallow, sigue al Paso 2
# false →  no es shallow; puede ser historias independientes (ver FAQ)
```

### Paso 2 — Completar el historial (unshallow)

```bash
git fetch --unshallow origin
# alternativas si reporta "Not a shallow repository":
git fetch --deepen origin main
```

### Paso 3 — Verificar el ancestro común

```bash
git merge-base origin/main HEAD   # debe devolver un hash (ej. e5679c9)
```

### Paso 4 — Mergear con la rama actual

```bash
git merge origin/main             # ahora SÍ encuentra ancestro común y procede
git status                        # lista los archivos en conflicto
```

### Paso 5 — Resolver conservando TU rama (`--ours`)

> En un `git merge origin/main` dentro de tu rama: `ours` = tu rama actual, `theirs` = `main`. Para **conservar lo tuyo** usa `--ours`.

```bash
# 5a. Ver los archivos conflictivos y su estado de letra:
git status --short   # columnas como UU / AA / DU / DD / AU / UA (ver glosario)

# 5b. Resolver LOS ARCHIVOS DE CONTENIDO uno a uno (conserva tu versión):
git checkout --ours docs/ci-cd-pipeline-empresarial.md
git checkout --ours docs/cicd-plantilla-completa.md
git checkout --ours docs/learning/ci-cd/20-governance-stage.md
git checkout --ours opencode.jsonc

# 5c. Resolver conflictos por RENAMES (añade/elimina según la dirección de la letra):
#   - DD (deleted both):   git rm  "openspec/changes/<name_sin_fecha>/"
#   - AU (added/updated):  git add "openspec/changes/archive/2026-08-28-.../..."
#   - UA (updated/added):  git rm  "openspec/changes/<name_sin_fecha>/"
```

### Paso 6 — Confirmar que no quedan conflictos

```bash
git diff --name-only --diff-filter=U   # debe estar VACÍO (0 conflictos)
git status                             # "All conflicts fixed but you are still merging"
```

### Paso 7 — Commitear el merge (firmado) y subir

```bash
git add <archivos resueltos>      # o `git add -A` si ya validaste el diff
git commit -S                     # merge commit FIRMADO (ED25519); guarda el mensaje sugerido
git push origin ci/governance-gates
```

### Paso 8 — Verificar el PR

```bash
# Desde GitHub: PR #120 → "This branch has no conflicts" = MERGEABLE ✅
# MERGEABLE ≠ listo para mergear: "BLOCKED" = checks del ruleset pendientes (normal)
```

> **Regla del repo**: `git commit -S` siempre, nunca `--no-verify`. Los hooks (lint-staged, gitleaks, semgrep) corren al commitear.

---

## 🔍 Contexto del caso

- **Repo**: `Freelancer-soluctions/Project-one` (monorepo Node/Express + React, público, GitHub).
- **Rama de trabajo**: `ci/governance-gates` (cambios de documentación CI/CD: `docs/CONTEXT-CICD.md` y 3 commits más).
- **PR**: #120 (rama `ci/governance-gates` → `main`).
- **Conflicto reportado por GitHub** en 4 archivos:
  - `docs/ci-cd-pipeline-empresarial.md`
  - `docs/cicd-plantilla-completa.md`
  - `docs/learning/ci-cd/20-governance-stage.md`
  - `opencode.jsonc`
- **Estado de la rama**: `ci/governance-gates` = `origin/ci/governance-gates` (sincronizada, ni ahead ni behind).

> **Regla operativa del repo**: estos 2 de los 4 archivos son sensibles — `docs/ci-cd-pipeline-empresarial.md` (INTOCABLE, no se modifica) y `docs/cicd-plantilla-completa.md` (RETENIDA, contiene datos únicos). Por eso la resolución debía **conservar** la versión de la rama, no la de `main`.

---

## 🧠 Teoría primero: qué es un clone shallow

Un **clone shallow** (o "parcial") es un clon de git que descarga **solo una parte del historial**, no todos los commits. Se crea con:

```bash
git clone --depth <N> <repo>      # solo los últimos N commits
git clone --shallow-since <fecha> # solo commits desde una fecha
```

### Por qué causa `unrelated histories`

Git decide si puede mergear dos ramas buscando un **ancestro común** (el `merge-base`). Si no existe, asume que las historias son "no relacionadas" y se niega a fusionarlas por seguridad:

```
        A---B---C   (tu rama: ci/governance-gates)
       /
...???  ← historial RECORTADO aquí (shallow): git no ve lo de abajo

        F---G---H   (origin/main)
       /
...???           ← git local NO conoce este tramo
```

Sin el historial completo, git no encuentra el punto donde ambas ramas "se separaron" y lanza:

```
fatal: refusing to merge unrelated histories
```

### El síntoma visible: `(grafted)`

En un clone shallow, los commits en el borde del historial se marcan como **grafted** (injertados), porque el historial se "cortó" ahí. En `git log --graph` se ve así:

```
*   557ac53 chore: resolve PR merge conflicts with origin/main (governance gates)
|\
| * e5679c9 (grafted) Ci/governance gates (#116)    ← el historial se corta aquí
```

La etiqueta **`(grafted)`** es la pista visual de un clone shallow.

### Verificación definitiva

```bash
git rev-parse --is-shallow-repository
# true   → es shallow
# false  → historial completo

git rev-parse --is-shallow-repository
# además, si existe en el repo: .git/shallow  (lista los commits borde)
```

---

## ⛔ El anti-pattern: NO uses `--allow-unrelated-histories`

Cuando git se niega a mergear, la tentación es forzarlo:

```bash
git merge --allow-unrelated-histories origin/main   # ❌ NO
```

**Por qué es un desastre**: `--allow-unrelated-histories` le dice a git "trata estas dos ramas como si jamás hubieran compartido historia". Entonces git considera que **cada archivo existe en ambas ramas desde cero** y genera un conflicto en **cientos de archivos** (todo lo que existe en beide lados), no solo en los 4 que GitHub reportó. Resolver eso a mano es inviable y propenso a borrar trabajo.

**Regla**: nunca fuerces el merge de historias no relacionadas. Primero **completa el historial** para que git recupere el ancestro común.

---

## ✅ La solución: completar el historial (unshallow)

### Paso 1 — Confirmar que es shallow

```bash
git rev-parse --is-shallow-repository
# true
```

### Paso 2 — Descargar el historial completo

```bash
git fetch --unshallow origin
```

- `--unshallow` convierte el clone shallow en **completo**: descarga todo el historial de las ramas de `origin`.
- Si git reporta `Not a shallow repository` (porque el shallow no está marcado o es por otra vía), usa como alternativa:

```bash
git fetch --deepen origin main   # baja más profundidad hasta hallar el ancestro
```

### Paso 3 — Verificar el ancestro común

```bash
git merge-base origin/main HEAD
# devuelve un hash (ej. e5679c9)  ← ya hay ancestro común, se puede mergear
```

### Paso 4 — Repetir el merge

```bash
git merge origin/main
```

Ahora git encuentra el ancestro y procede. En este caso detectó **16 archivos** en conflicto (los 4 originales + 12 derivados de renames en `openspec/`).

---

## 🔀 Resolver conflictos conservando TU rama (`--ours`)

Cuando mergeas `origin/main` **dentro** de tu rama (`ci/governance-gates`), la dirección de cada lado es:

| Lado     | Significado en este merge              | Es lo que quieres cuando...         |
| -------- | -------------------------------------- | ----------------------------------- |
| `ours`   | tu rama actual (`ci/governance-gates`) | ✅ quieres **conservar lo tuyo**    |
| `theirs` | la rama que entras (`origin/main`)     | quieres adoptar los cambios de main |

Como el objetivo era **conservar los cambios de `ci/governance-gates`**, se usó `--ours` en todos los conflictivos.

### 4 conflictos de contenido

```bash
git checkout --ours docs/ci-cd-pipeline-empresarial.md
git checkout --ours docs/cicd-plantilla-completa.md
git checkout --ours docs/learning/ci-cd/20-governance-stage.md
git checkout --ours opencode.jsonc
```

Los estados de conflicto (letras) que se vieron:

| Archivo                                      | Estado git                             | Resolución                                    |
| -------------------------------------------- | -------------------------------------- | --------------------------------------------- |
| `docs/ci-cd-pipeline-empresarial.md`         | `UU` (both modified)                   | `--ours` (conservar local)                    |
| `opencode.jsonc`                             | `UU` (both modified)                   | `--ours`                                      |
| `docs/learning/ci-cd/20-governance-stage.md` | `AA` (both added)                      | `--ours`                                      |
| `docs/cicd-plantilla-completa.md`            | `DU` (deleted by us, modified by them) | `--ours` → **deleted** (como en nuestra rama) |

> **Nota**: en `DU` (deleted by us / modified by them), `--ours` mantiene la **decisión local de eliminar** el archivo, que es lo que la rama quería.

### 12 conflictos por renames de `openspec/`

El merge también encontró renames en `openspec/changes/` (el `ci-governance-pre-merge-gates` se archivó con fecha, mientras `main` lo tenía sin fecha). Direcciones:

- **6 `DD`** (`ci-governance-gates-culmination` → eliminado en ambas) → se eliminaron.
- **6 `AU`** (added by us / updated by them en `archive/…`) → se conservó la **versión archivada de nuestra rama**.
- **6 `UA`** (`ci-governance-pre-merge-gates` sin fecha, versión de `main`) → se eliminó (prevaleció la versión con fecha de la rama).

Se marcaron todos con `git add` y se removieron las adiciones no-conflictivas de `main` (`governance-roadmap.md`, `ci-governance-pre-merge-gates/`).

### Verificar que no quedan conflictos

```bash
git diff --name-only --diff-filter=U   # debe estar VACÍO (0 conflictos)
git status                             # "All conflicts fixed but you are still merging"
```

### Commitear el merge (firmado)

```bash
git add <archivos resueltos>
git commit -S      # merge commit firmado (ED25519); guarda el mensaje sugerido
```

> En este repo, **todos** los commits (incluidos los de merge) se firman con la SSH key ED25519 dedicada (`-S`) y **nunca** `--no-verify`. Los hooks (lint-staged, gitleaks, semgrep) corren y pasan.

---

## 🚀 Cerrar el ciclo: push y verificación

```bash
git push origin ci/governance-gates
```

Resultado en este caso:

| Chequeo    | Salida                                    | Significado                                                          |
| ---------- | ----------------------------------------- | -------------------------------------------------------------------- |
| `git push` | `d761a39..c4d2bc9`                        | el merge commit `c4d2bc9` subió                                      |
| PR #120    | `mergeable: MERGEABLE`                    | ✅ el **conflicto ya no existe**                                     |
| PR #120    | `mergeStateStatus: BLOCKED`               | ⏳ no es conflicto: son los **status checks del ruleset** pendientes |
| Checks     | `Verify Commit Signatures`, `Commit Lint` | gate de gobernanza normal (deben pasar antes del merge)              |

> **Diferencia clave**: `MERGEABLE` significa "GitHub ya puede hacer el merge técnicamente" (no hay conflicto). `BLOCKED` significa "hay una condición que impide mergear ahora" — en este caso, los required status checks. El conflicto (problema) se **resolvió**; el bloqueo (gobernanza) es el flujo normal del repo.

---

## 🧠 Por qué ocurrió y cómo evitar que vuelva

**Causa raíz**: el repo local era un **clone shallow**. Los síntomas (conflictos recurrentes, `unrelated histories`, `(grafted)`) son típicos de un clone parcial en un repo activo con muchos merges.

**Prevención / curación**:

1. Completa el historial de una vez:

   ```bash
   git fetch --unshallow origin
   ```

2. Revisa si algún workflow/script local cose en `--depth` de forma reiterada.
3. Si trabajas con frecuencia en ramas largas, **evita clones shallow** para ramas de integración; usa `--depth` solo para clonados de un solo uso.

---

## 🧑💻 Hands-on

Práctica con un sandbox (crea un mini-repo) para interiorizar el concepto **sin tocar Project One**:

```bash
# 1. Crea un repo y haz un shallow clone de él... primero prepáralo
mkdir demo && cd demo
git init repo-remoto && cd repo-remoto
# crea y commitea algunos archivos (convenience: varias ramas y renames)
git config user.email "demo@example.com"; git config user.name "Demo"

# 2. Ahora un shallow clone (solo los últimos commits)
cd ..
git clone --depth 1 ./repo-remoto demo-shallow
cd demo-shallow
git rev-parse --is-shallow-repository   # → true

# 3. Simula una rama nueva
git checkout -b feature-a
echo "a" > a.txt; git add a.txt; git commit -m "feat: add a"
git push origin feature-a

# 4. En el repo remoto, avanza main
cd ../repo-remoto
git checkout main; echo "main" > main.txt; git add .; git commit -m "feat: main work"

# 5. De vuelta en el shallow, intenta mergear
cd ../demo-shallow
git fetch origin
git merge origin/main        # → fatal: refusing to merge unrelated histories

# 6. Comprueba el fix
git fetch --unshallow origin
git merge origin/main        # → ahora encuentra ancestro y hace el merge

# 7. Limpia tu sandbox
cd .. && rm -rf demo
```

**En Project One** (si vuelve a pasar), el checklist es:

1. `git rev-parse --is-shallow-repository` → ¿`true`?
2. `git fetch --unshallow origin`
3. `git merge-base origin/main HEAD` → debe dar hash.
4. `git merge origin/main`
5. Resolver `--ours` los conflictivos (conservando tu rama).
6. `git add` + `git commit -S` + `git push`.

---

## ❓ FAQ

### ¿`refusing to merge unrelated histories` siempre es un shallow clone?

No siempre, pero es la causa más común en la práctica. También ocurre si inicializas un repo y haces un primer commit sin relación con el remoto, o si dos historias se crearon independientes (p. ej. `git init` + `git remote add` en un repo que ya tenía commits). En todos los casos, la solución correcta es **recuperar un ancestro común** (fetch del historial completo o `--allow-unrelated-histories` solo cuando de verdad son historias independientes iniciales).

### ¿Puedo usar `--allow-unrelated-histories` cuando inicializo el repo?

Sí, en el caso límite de **primer merge entre un repo local recién inicializado y su remoto** es el uso legítimo (cuando de verdad no comparten historia). Pero para un merge rutinario de una rama de trabajo existente, **no**: busca el ancestro común primero.

### ¿Qué diferencia hay entre `MERGEABLE` y `BLOCKED` en un PR?

- **`MERGEABLE`** = GitHub puede aplicar el merge técnicamente (no hay conflicto de archivos).
- **`BLOCKED`** = hay una condición que impide mergear ahora (ej. required status checks pendientes, approvals faltantes). **No** significa conflicto.

### ¿Los merge commits también se firman?

En Project One, sí. Todos los commits — incluidos los de merge — usan `-S` (SSH ED25519 dedicada) para satisfacer `Verify Commit Signatures` del ruleset.

### ¿Cómo se resuelve un conflicto de rename?

Cuando ambos lados mueven/renombran archivos, git genera conflictos `rename/add`, `rename/modify` etc. Las letras de estado (`DD`, `AU`, `UA`, `DU`) indican qué pasó en cada lado. La regla es: decide qué versión del archivo prevalece y `git add` para aceptar. En este caso, para **conservar la rama**, se eligió la versión archivada con fecha de `ci/governance-gates` sobre la versión sin fecha de `main`.

---

## 📖 Glosario

| Término                           | Definición                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------- |
| **Shallow clone**                 | Clon de git que descarga solo parte del historial (`--depth` / `--shallow-since`) |
| **Grafted**                       | Marcador de commit en el borde de un shallow clone: el historial se "corta" ahí   |
| **`unrelated histories`**         | Error de git al mergear sin ancestro común                                        |
| **`merge-base`**                  | El commit ancestro común más reciente de dos ramas                                |
| **Unshallow**                     | `git fetch --unshallow` — completa el historial de un clone parcial               |
| **`ours` / `theirs`**             | En un merge, tu rama (`ours`) vs la rama entrante (`theirs`)                      |
| **`--allow-unrelated-histories`** | Flag que fuerza el merge sin ancestro común (anti-pattern en merges rutinarios)   |
| **`MERGEABLE` / `BLOCKED`**       | Estado de mergeabilidad vs condiciones de merge en un PR                          |

---

## 🔗 Navegación

- **Anterior**: [04-docker-basico-para-cicd.md](./04-docker-basico-para-cicd.md) (nivel Fundamentos)
- **Relacionada**: [01-git-y-yaml.md](./01-git-y-yaml.md) — ramas, PRs, estrategias de merge, Conventional Commits
- **Siguiente**: [05-husky-git-hooks.md](./05-husky-git-hooks.md) (inicio del nivel **Intermedio**)
- **Contexto gobernanza**: [CONTEXT-CICD.md](../../CONTEXT-CICD.md) (reglas §7 reglas de oro; §5.9 sobre `disabled_manually` y regla "no asumir estado por código")

> **Regla del repo**: commits siempre firmados (`git commit -S`, ED25519), Conventional Commits, nunca `--no-verify`.

---

## 🎓 Nivel

Esta guía pertenece al **nivel Fundamentos** (bloque Git, complementa la guía 01). Es un anexo de caso práctico: técnicamente más denso que el resto del nivel, pero cubre un síntoma Git real y frecuente. Índice del nivel: [`fundamentos-README.md`](./fundamentos-README.md)
