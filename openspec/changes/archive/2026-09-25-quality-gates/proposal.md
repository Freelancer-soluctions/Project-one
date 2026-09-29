# Proposal

## Why

Los gates de calidad del substage 2B (`prebuild-quality-complete`) están apagados o son cosméticos: `client-typecheck`, `server-typecheck`, `client-complexity`, `server-complexity` y los jobs `sonarqube`/`coverage` corren con `if: false`, y los typecheck fingen pasar con `|| echo "TypeCheck: no-op..."` (exit 0 siempre). Falta el gate de documentación `docs-validation` (propuesta activa `docs-changelog-validation`: no existen `.markdownlint.json` ni `.vale.ini`), y la taxonomía bloqueante/advisory quedó solo como análisis en `docs/learning/quality-gates.md` sin requisitos ni correcciones aplicadas. Sin esto, `ci-complete` reporta verde mientras la salud real de calidad es desconocida.

## What Changes

- **Taxonomía de gates** como contrato: cada job del substage 2B se clasifica `blocking` (fallo cancela el merge vía agregador) o `advisory` (`continue-on-error: true`, informa sin bloquear), documentada en `docs/learning/quality-gates.md`.
- **Fix de gates `if: false`**: `client-typecheck`/`server-typecheck` (quitar `if: false` y el `|| echo` — fallo real de `tsc --noEmit`), `client-complexity`/`server-complexity` (activar sin `--rule` override; `eslint.config.js` es la única fuente de verdad), `client-sonarqube`/`server-sonarqube` (activar en modo advisory con `SonarSource/sonar-quality-gate-check`).
- **Fix del agregador**: `prebuild-quality-complete` conserva `if: always()`, trata `cancelled` como bloqueo (no solo `failure`) y su `needs` lista exactamente los jobs de su substage (`docs-validation` advisory NO entra como gate).
- **`docs-validation` como gate advisory**: nuevo job que corre `markdownlint-cli` + `vale` sobre `docs/` y `docs/changelog.md` con `continue-on-error: true`, `if: always()` y publicación de reporte (artifact/step summary); fase 1 no bloquea.
- **Configs de validación de docs**: crear `.markdownlint.json`, `.markdownlintignore` y `.vale.ini` (StylesPath `.github/styles`).
- **Docs alineadas**: `docs/CONTEXT-CICD.md` (§3.3/§13.4), `docs/pre-merge-gates-governance.md` y `docs/learning/quality-gates.md` reflejan la taxonomía y el estado real de los jobs.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `config-correctness`: se añaden requisitos sobre corrección de configuración de CI — taxonomía de gates (blocking/advisory) como contrato verificable, eliminación de gates cosméticos (`if: false` + `|| echo`), semántica correcta del agregador (`always()` + `cancelled` + `needs` exacto) y `docs-validation` como gate advisory respaldado por `.markdownlint.json`/`.vale.ini`.

## Impact

- `.github/workflows/ci.yml`: jobs `client-typecheck` (L450), `client-complexity` (L465), `server-format-check` (L525), `server-typecheck` (L538), `server-complexity` (L553), `client-sonarqube` (L761), `server-sonarqube` (L822); agregador `prebuild-quality-complete` (L1092) y `ci-complete` (L1156).
- Configuración nueva en raíz: `.markdownlint.json`, `.markdownlintignore`, `.vale.ini` (+ estilos en `.github/styles/`).
- `package.json`: devDeps `markdownlint-cli` (vale se instala desde release/acción, no vía npm) y scripts de validación de docs.
- `docs/CONTEXT-CICD.md`, `docs/pre-merge-gates-governance.md`, `docs/learning/quality-gates.md` (incluye limpiar un bloque de texto residual de una delegación de agente al final del archivo).
- Dependencia de secuencia: requiere los scripts `type-check` del change activo `typescript-strict-check` (fallback `npx tsc --noEmit` mientras no existan).
- Desarrolladores: PRs con errores de tipo o complejidad ahora bloquean de verdad; reportes de docs visibles sin bloquear merges (fase 1).
