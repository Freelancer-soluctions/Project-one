# 05d — Journal de Implementación: ci-commit-lint-governance (Lo que REALMENTE pasó)

> **Guía 05d — Implementation Journal** (transversal, después de 05c) | Anterior: [05c-ci-commit-signing-implementation.md](./05c-ci-commit-signing-implementation.md)
>
> Esta guía documenta TODO lo que hicimos, encontramos y resolvimos durante la implementación del cambio `ci-commit-lint-governance`. No es una guía teórica — es un **registro vivo** de decisiones, investigación y aprendizajes del mundo real. Complementa el journal de firma de commits (05c) con la otra mitad de la higiene de commits: el **formato Conventional Commits**.

---

## 🎯 Objetivo

Entender a fondo qué se hizo, POR QUÉ se hizo así, y QUÉ APRENDIMOS al implementar validación de Conventional Commits en tres capas:

1. **Local**: hook `commit-msg` de Husky que valida ANTES de commitear.
2. **CI**: job `Commit Lint (Conventional Commits)` en `pull_request` y `merge_group`.
3. **Gobernanza**: el check registrado como _required status check_ en el ruleset de `main`.

---

## 📋 Resumen Ejecutivo del Change

| Fase      | Qué logramos                                                                                                | Estado      |
| --------- | ----------------------------------------------------------------------------------------------------------- | ----------- |
| **F1**    | Hook local `.husky/commit-msg` arreglado con patrón raw `npx` oficial                                       | ✅ Completo |
| **F2**    | Job `commit-lint` en ci.yml (~L294-329): `pull_request` + `merge_group`, paralelo, con guard de rango vacío | ✅ Completo |
| **F3**    | Validado en CI real: run 32792653410 (PR #112) — PASSED en 1m56s                                            | ✅ Completo |
| **F4**    | Check requerido registrado en ruleset 21227644 y VERIFICADO vía `gh api`                                    | ✅ Completo |
| **Bonus** | Investigación "¿es obligatorio registrar?" + review pre-archive + archivado del change                      | ✅ Completo |

**Resultado**: 13/13 tareas completas, change archivado en `openspec/changes/archive/2026-08-24-ci-commit-lint-governance/` y specs principales sincronizadas (4 requisitos en `openspec/specs/ci-commit-lint-governance/spec.md`).

---

## 🏗️ Anatomía del Job en ci.yml

```yaml
# .github/workflows/ci.yml (~líneas 294-329) — versión simplificada
commit-lint:
  # SIN key `needs:` — corre EN PARALELO con los demás jobs (feedback rápido)
  permissions:
    contents: read
    pull-requests: read
  steps:
    - uses: actions/checkout@v5
      with:
        fetch-depth: 0 # ← CRÍTICO: sin historia completa no existen los SHAs base/head
    - uses: actions/setup-node@v4
      with:
        node-version-file: .nvmrc
    - run: npm ci

    # GUARD de rango vacío: fallar explícito, nunca pasar vacuamente
    - name: Guard — reject empty commit range
      run: |
        COUNT=$(git rev-list --count "${BASE_SHA}..${HEAD_SHA}")
        if [ "$COUNT" -eq 0 ]; then
          echo "::error::Empty commit range — nothing to lint"
          exit 1
        fi

    # pull_request: lint del RANGO de commits del PR
    - if: github.event_name == 'pull_request'
      run: npx commitlint --from "$BASE_SHA" --to "$HEAD_SHA" --verbose

    # merge_group: validar SOLO el squash commit que genera la merge queue
    - if: github.event_name == 'merge_group'
      run: npx commitlint --last --verbose
```

Y el gate final lo recoge:

```yaml
# ci-complete (~L678): needs incluye commit-lint
```

### Decisiones de diseño (del design.md)

| ID  | Decisión                              | Por qué                                                                                                    |
| --- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| D1  | Raw `npx commitlint` (patrón oficial) | Ver tabla de rechazo de wagoid abajo                                                                       |
| D2  | Job paralelo SIN `needs:`             | Feedback rápido sin bloquear a otros jobs; el gate real lo hace `ci-complete`                              |
| D3  | Manejo por evento                     | PR → rango `--from/--to`; merge_group → solo el squash con `--last` (los commits originales ya no existen) |
| D4  | Hard-fail ante violaciones            | Sin flags supresores; el código de salida no-cero de commitlint mata el step/job nativamente               |

---

## ⚖️ Decisión Clave: Raw npx vs wagoid Action

La opción "fácil" era usar la action comunitaria `wagoid/commitlint-github-action@v6`. La rechazamos por tres razones documentadas:

| Criterio              | wagoid action                                                                                          | Raw `npx commitlint` (elegido)                      |
| --------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------- |
| Versión de commitlint | Docker image empaqueta **v19** — ignora la v20.3.1 pineada del lockfile (salvo workaround `NODE_PATH`) | La pineada del repo (v20.3.1) — cero drift          |
| Config                | Default busca `.mjs` — nuestro repo usa `.js` → **ignora el config silenciosamente**                   | Lee el config real del repo                         |
| Mantenimiento         | Stale ~19 meses                                                                                        | Patrón recomendado por la doc oficial de commitlint |

> **Lección**: una action que "funciona" pero usa otra versión de la herramienta y otro archivo de configuración no está validando lo que crees que valida. El silencio de wagoid ante configs `.js` es peor que un error ruidoso.

### El bug que el review atrapó: contradicción proposal ↔ design

El `proposal.md` original listaba `wagoid/commitlint-github-action@v6` como dependencia nueva — mientras el `design.md` D1 la rechazaba explícitamente y la implementación usaba raw npx. El reviewer pre-archive lo marcó como **bloqueante para archivar** (contradicción entre artifacts), aunque el código estuviera perfecto.

Fix: 1 línea en proposal Impact → _"none new — uses lockfile-pinned @commitlint/cli via raw npx (per design D1)"_. Además se limpió un leftover de "wagoid defaults are appropriate" en design D4.

> **Lección meta**: la consistencia entre artifacts importa tanto como el código. Una propuesta que menciona una alternativa ya rechazada siembra confusión futura — reconcilia siempre Impact contra las decisiones de design antes de archivar.

---

## 🔬 Veredicto de Investigación: ¿Registrar el Check es Obligatorio?

Pregunta clave del change: _"si el job ya corre en CI, hace falta registrarlo como required status check?"_ Delegamos investigación formal. Respuesta: **SÍ, obligatorio** — sin registro el job no tiene dientes.

| Sin registrar                        | Registrado                   |
| ------------------------------------ | ---------------------------- |
| Merge con job en rojo es POSIBLE     | Bloqueado                    |
| La merge queue IGNORA su fallo       | La queue lo gatea            |
| Push directo a main sin lint posible | Con "Require PR" → bloqueado |

Razón técnica: los checks no-required son **advisory-only**. Nada en GitHub impide mergear con un check opcional en rojo.

### Checklist de registro (ejecutado y verificado)

1. Settings → Rules → Rulesets → editar el ruleset EXISTENTE de signed-commits (no crear uno nuevo).
2. "Require status checks to pass" → nombre EXACTO `Commit Lint (Conventional Commits)` (case-sensitive; ver gotcha abajo).
3. Desmarcar "Require branches up to date" → modo **Loose**.
4. Marcar "Require a pull request before merging".
5. Enforcement: `Evaluate` primero → luego `Active`.

---

## 🛡️ Estado Final Verificado del Ruleset

Verificación READ-ONLY vía `gh api repos/Freelancer-soluctions/Project-one/rulesets/21227644`:

| Campo             | Valor                                                             |
| ----------------- | ----------------------------------------------------------------- |
| Ruleset           | `Require signed commits` (id 21227644)                            |
| Enforcement       | `active`, target `~DEFAULT_BRANCH` (main)                         |
| Checks requeridos | `Verify Commit Signatures` + `Commit Lint (Conventional Commits)` |
| Bypass            | `[]` — `current_user_can_bypass: never` (ni admins)               |
| Strict policy     | `false` → Loose mode, según recomendación                         |

### Gaps residuales documentados (aceptados, no ignorados)

- **Sin regla `pull_request`**: push directo a main sigue posible (con firma + checks verdes). Mitigable activando "Require a pull request before merging" en el mismo ruleset.
- **Squash final message no linteado en push directo**: la mitigación (push ruleset con regex de commit-message) requiere plan Team/Enterprise en repos privados.

> **Lección**: documenta los gaps que decides NO cerrar. Un riesgo aceptado y anotado es ingeniería; un riesgo silencioso es una bomba.

---

## 🧪 Validación (3 niveles)

1. **Dry-run local**: `npx commitlint --from=HEAD~2 --to=HEAD --verbose` → `found 0 problems, 0 warnings`.
2. **CI real**: run 32792653410 en PR #112 — `Commit Lint (Conventional Commits)` PASSED (1m56s, conclusion success). Constraint de CI incremental intacto: solo 4 jobs activos (Detect Changes, Verify Commit Signatures, Commit Lint, Zombie Workflow Guard); los pesados siguen en skip.
3. **Baseline de actionlint**: 26 expresiones `if: false` preexistentes documentadas; grep confirmó cero errores referenciando el bloque nuevo (L294-329).

---

## ⚠️ Gotchas Técnicos que Descubrimos

### 1. El nombre del check es case-sensitive Y debe coincidir con el `name:` del job

El ruleset referencia `"Commit Lint (Conventional Commits)"` — el campo `name:` del job, NO su id `commit-lint`. Un mismatch (una mayúscula, un paréntesis) produce el deadlock eterno de status **"Expected — waiting"**: el check requerido nunca reporta porque ningún job se llama así.

### 2. Modo Loose, casi siempre

Con "branches up to date" activado (strict), cada PR competidor fuerza re-runs en cascada. En repos pequeños con baja contención de merge, Loose da la protección necesaria sin el churn.

### 3. commitlint exige ≤100 chars por línea en el BODY

El hook local nos lo cobró en vivo: mensajes con líneas largas en el body fallaban. Regla práctica para agentes: wrappear el body a ~72-100 chars por línea.

### 4. `fetch-depth: 0` es prerequisito del rango

`--from/--to` necesitan los SHAs reales de base y head. Con el checkout shallow por defecto, el rango no existe → falsos fallos o rangos vacíos.

### 5. El rango vacío debe FALLAR, no pasar vacuamente

Si `base..head` tiene 0 commits (p.ej. target == source), commitlint no tiene nada que lintear y saldría verde. El guard con `git rev-list --count` convierte ese caso ambiguo en fallo explícito con mensaje claro.

### 6. merge_group cambia el objeto de validación

En la merge queue los commits originales ya no son lo que entra a main — entra UN squash commit. Lintear el rango histórico sería validar fantasmas; `commitlint --last` sobre el squash es lo correcto.

---

## 📊 Métricas del Change

| Métrica                   | Valor                                                     |
| ------------------------- | --------------------------------------------------------- |
| Tasks completadas         | 13/13                                                     |
| Run de CI de validación   | 32792653410 (PR #112, PASS 1m56s)                         |
| Cadena de commits         | `55f0dd6` → `786b3e6` → `6d98e9d` → `4db5fae` → `c2838e2` |
| Issues del review final   | 4 (todos documentales, cero funcionales)                  |
| Gaps residuales aceptados | 2 (regla PR ausente, squash-message en push directo)      |
| Requisitos en main spec   | 4                                                         |

---

## 🗺️ Mapa Mental del Change

```
ci-commit-lint-governance
├── F1: Hook Local
│   ├── .husky/commit-msg → npx --no -- commitlint --edit "$1"
│   └── Dogfood: los propios commits del change pasaron por él
│
├── F2: Job CI
│   ├── commit-lint en ci.yml (paralelo, sin needs)
│   ├── pull_request: --from/--to vía SHAs de env
│   ├── merge_group: --last (solo squash)
│   └── Guard: rev-list count == 0 → exit 1
│
├── F3: Validación Real
│   ├── Run 32792653410: PASSED (1m56s)
│   └── Incremental CI: 4 jobs activos, pesados skipping
│
└── F4: Gobernanza
    ├── Investigación: registro OBLIGATORIO (advisory vs required)
    ├── Registro en ruleset 21227644 (nombre exacto, Loose)
    ├── Verificación gh api: active, cero bypass
    └── Archive + sync a openspec/specs/
```

---

## 📅 Cronología

1. **Implementación**: fix del hook local (raw npx) + job en ci.yml siguiendo design D1-D4, respetando el constraint de CI incremental (solo añadir, jamás activar jobs deshabilitados).
2. **Validación**: dry-run local limpio + run real de CI en verde con solo 4 jobs activos.
3. **Investigación gobernanza**: veredicto formal — registro del check es obligatorio para que el job tenga poder de bloqueo; procedimiento documentado en tasks.md 3.5 (commit `786b3e6`).
4. **Registro manual** (usuario) + verificación read-only vía gh api → REGISTERED (tarea 3.5 cerrada, commit `6d98e9d`).
5. **Review pre-archive**: NEEDS CHANGES solo-documental (contradicción wagoid, leftovers, frase duplicada, nota stale) → fixes inline (commit `4db5fae`).
6. **Archive**: change movido a `openspec/changes/archive/2026-08-24-ci-commit-lint-governance/`, delta sincronizado a main specs (commit `c2838e2`).

---

## 📚 Referencias

| Recurso                | Ubicación / URL                                                                                                             |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| OpenSpec change        | `openspec/changes/archive/2026-08-24-ci-commit-lint-governance/`                                                            |
| Main spec sincronizada | `openspec/specs/ci-commit-lint-governance/spec.md`                                                                          |
| Job implementado       | `.github/workflows/ci.yml` (~L294-329)                                                                                      |
| Hook local             | `.husky/commit-msg`                                                                                                         |
| Commitlint CLI         | https://commitlint.js.org/reference/cli.html                                                                                |
| GitHub Rulesets        | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets |

---

## ➡️ Siguiente

> **Has completado el journal de commit-lint** — junto con 05c, cubre las dos capas de gobernanza de commits: quién firma (signing) y cómo se escribe (conventional format).

> **Índice**: [README Avanzado](./avanzado-README.md) · **Anterior**: [05c-ci-commit-signing-implementation.md](./05c-ci-commit-signing-implementation.md) · **Siguiente**: [06-ci-yml-walkthrough.md](06-ci-yml-walkthrough.md)
