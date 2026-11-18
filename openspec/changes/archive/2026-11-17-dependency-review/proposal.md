# Proposal

## Why

El gate `dependency-review` (SCA) bloquea merges en `ci.yml` L765-787 pero su estado real no está reflejado en la documentación de gates ni en configuración explícita: `docs/learning/quality-gates.md` §2 no tiene fila `dependency-review`, `license-check: true` corre sin política de licencias, `comment-summary-in-pr` no está usado y el scope `development` no se ha evaluado. Verificado 2026-09-25 en `docs/learning/dependency-review.md`.

## What Changes

- Agregar fila `dependency-review` a la tabla de taxonomía de `docs/learning/quality-gates.md` §2 (tipo `blocking (PR)`, coherente con la fila `secrets` / `gitleaks-full-scan`).
- Configurar política de licencias explícita en `.github/workflows/ci.yml` job `dependency-review`: `allow-licenses` (lista blanca) o `deny-licenses` (lista negra), mutuamente excluyentes, y documentarla.
- Activar `comment-summary-in-pr` (`on-failure` recomendado) para que la acción publique el resumen en el PR — hoy `pull-requests: write` existe pero no se usa (`comment-summary-in-pr` default `never`).
- Evaluar y documentar `fail-on-scopes`: default `runtime`; decidir si se agrega `development` para que `devDependencies` vulnerables bloqueen.
- Documentar `security-events: write` (permiso declarado pero no usado: la acción no emite SARIF; el SARIF de dependencias viene de Trivy en `security.yml`).
- Documentar la separación Trivy (`security.yml` `dependency-scan`) vs `dependency-review` (`ci.yml`): complementarios, no duplicados (CVE filesystem+OS vs árbol npm diff-PR + licencias).

## Capabilities

### New Capabilities

- `dependency-review`: gobernanza del gate SCA PR-time — taxonomía `blocking/advisory` en `quality-gates.md`, política de licencias, resumen en PR, scopes de fallo, permisos y separación respecto de Trivy.

### Modified Capabilities

<!-- none — ci-supply-chain-security ya declara el bloqueo por vulnerabilidad/licencia; este change agrega la capa de gobernanza/configuración sin cambiar ese contrato -->

## Impact

- `docs/learning/quality-gates.md`: §2 (tabla de gates, fila nueva) y tabla resumen de estado.
- `.github/workflows/ci.yml`: job `dependency-review` (L765-787) — `allow-licenses`/`deny-licenses`, `comment-summary-in-pr`, posible `fail-on-scopes`, comentario de `security-events: write`.
- `docs/learning/dependency-review.md`: secciones §3.1/§4.2/§4.6 y roadmap (gaps cerrados o confirmados).
- `docs/CONTEXT-CICD.md` §9.3.5 y `docs/pre-merge-gates-governance.md` §4.12: coherencia de taxonomía/umbral (nota: §4.12 afirma default `high`; el default real es `low` — corregir).
- Desarrolladores: ven resumen de hallazgos en el PR; futuras vulnerabilidades en `devDependencies` podrían pasar a bloquear.
- Sin cambios de código de aplicación; solo workflows CI y docs.
