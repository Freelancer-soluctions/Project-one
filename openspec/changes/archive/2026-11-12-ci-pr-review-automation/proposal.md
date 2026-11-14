# Proposal

## Why

PR review automation (SonarQube) está inactiva (`if: false`, sin credenciales, D2 abierto). El PRD quiere Sonar Quality Gate sobre código nuevo como único bloqueante entre los revisores IA. Los revisores con IA (CodeRabbit/DeepSource) deben quedar como comentarios sin check requerido. Este change decide y, si se activa, configura Sonar con token + host URL + `pull_request` (no `pull_request_target`), maneja PRs de fork y verifica reportería en merge queue.

## What Changes

- **Decidir D2** (documentado en `quality-policy.md`): ¿Sonar aporta algo que ESLint+resto no cubren? ¿Nube o propio? (afecta `SONAR_HOST_URL`).
- **Decidir D2-forks**: skip vs análisis sin secreto para PRs de fork.
- **Si se activa (D2 = activar + credenciales presentes):**
  - Configurar `SONAR_TOKEN` y `SONAR_HOST_URL` en secrets.
  - Reemplazar `if: false` por activación real en los jobs `client-sonarqube`/`server-sonarqube`.
  - Verificar reportería en `merge_group` (el check `SonarQube Code Analysis` lo emite la integración Sonar↔GitHub ligada al PR; en el commit sintético de la cola puede no reportarse → decidir si el required check es el agregador existente).
  - Ejecutar PR de prueba que confirme el nombre del check `SonarQube Code Analysis`.
  - Añadir al ruleset como required check solo tras confirmación.
- Dejar CodeRabbit/DeepSource como asesores (warning, no required) — si están instalados; verificar primero.
- Registrar en `quality-policy.md` la decisión D2, el QG aplicado (Sonar way: 0 issues nuevos, 80% cobertura, 3% duplicación, hotspots revisados + matizes MQR/fudge factor ≥20 líneas) y la fecha.

## Capabilities

### New Capabilities

- `ci-pr-review-automation`: configuración de SonarQube PR analysis como required check (tras decisión D2 + credenciales) y revisores IA como asesores, con manejo de forks y reportería en merge queue.

### Modified Capabilities

- (ninguna a nivel de requirements de producto)

## Impact

**Affected code:**

- `.github/workflows/ci.yml` (jobs `client-sonarqube`/`server-sonarqube`: condición de activación)
- Secrets (`SONAR_TOKEN`, `SONAR_HOST_URL`)

**Affected docs:**

- `docs/learning/quality-policy.md` (decisión D2, QG aplicado, forks, merge queue, fecha)

**Dependencies:**

- `ci-quality-gates-blocking-hardening` P1.4 (crea `quality-policy.md`; crear plantilla mínima si no aterrizó)

**Sistemas:**

- SonarQube, GitHub Actions, ruleset de `main`

**Nota:** CODEOWNERS no se toca (`.github/` ya cubierto por `devops-team`, `docs/learning/` por `core-team`). endOfLine no aplica.
