# Tasks: ci-pr-review-automation

**Nota:** Este change es de DECISIÓN. **D2 = mantener Sonar inactivo (diferido)**
(decisión 2026-11-12, registrada en `quality-policy.md` §4.2). La Fase 2
(activación) solo se ejecuta si D2 = activar Y credenciales presentes; como
D2 = diferido, **Fase 2 no se ejecuta** (queda N/A). Las tasks de Fase 1 (decisión

- documentación) son las accionables y se completan ahora.

## Fase 1: Decisión (accionable ahora)

- [x] Decidir D2 (documentar en quality-policy.md): ¿Sonar aporta algo que ESLint+resto no cubren? ¿Nube o propio? (afecta `SONAR_HOST_URL`)
  - Evidencia: D2 = **diferido** (mantener inactivo). Justificación: ESLint+cobertura+security ya bloquean el merge gate; sin creds/infra Sonar hoy. Nube vs propio sin decidir (diferido hasta activación). Registrado en `quality-policy.md` §4.2 (mitad 1 valor + mitad 2 nube/propio).
- [x] Decidir D2-forks: skip (guard `if: github.event.pull_request.head.repo.full_name == github.repository`) vs análisis sin secreto
  - Evidencia: **skip con guard** (elegido para futura activación). Registrado en §4.2 + design D3. No se aplica ahora (D2 diferido).
- [x] Decidir mecanismo del check: integración Sonar↔GitHub (emite `SonarQube Code Analysis`) vs action `sonar-quality-gate-check` + `continue-on-error`
  - Evidencia: **action `sonar-quality-gate-check` sin COE** (required directo), un check por workspace; reconciliado con `quality-gates.md:29` (documenta advisory+COE → al activar required se quita el COE). Registrado en §4.2 + design D7.
- [x] Decidir advisory-first vs required-directo (PRD recomienda advisory; decisión doc dice blocking desde día 1 con pre-flight)
  - Evidencia: **required directo** (blocking desde día 1 con pre-flight + PR de prueba). El PRD recomienda advisory pero se elige required directo. Registrado en §4.2 + design D6.
- [x] Verificar si CodeRabbit/DeepSource están instalados antes de exigir que "permanezcan" como asesores
  - Evidencia: **NO instalados**. Glob de configs (`.coderabbit.yaml`/`.deepsource.toml`/etc.) → 0 en el repo (solo `node_modules/react-dropzone/.codeclimate.yml`, dependencia ajena). Grep repo → solo menciones en PRD/docs como candidatos. `quality-gap-analysis.md:319` (D12) ya los registra no-required. Si se instalan → asesores (sin check requerido). Registrado en §4.2.
- [x] Analizar reportería en `merge_group`: el check `SonarQube Code Analysis` (ligado al PR) puede no reportar en el commit sintético de la cola → decidir si el required check es el agregador existente o un job que corra en `merge_group`
  - Evidencia: el required check del ruleset (API, ruleset 21227644) son 3 contextos: `Governance: PR Body Lint`, `Prebuild Governance Complete` y `Prebuild Security Complete` — ni `CI Complete` ni `Postbuild Analysis Complete` están vinculados (CONTEXT-CICD.md §3.2). El check de Sonar es PR-linked (no reporta en el commit sintético). Jobs Sonar serían PR-only → skip autorizado por evento en `merge_group` (§1 regla 3; `ci.yml` `merge_group: {}` L10, agregador `postbuild-analysis-complete` L3811 con sonar en `needs` L3818-3819). Registrado en §4.2 + design D4. Nota: con el wiring actual, activar Sonar NO bloquearía el merge; para "required directo" habría que añadir un contexto nuevo al ruleset.
- [x] Registrar en `quality-policy.md`: decisión D2 (ambas mitades), QG aplicado (Sonar way: 0 issues, 80% cov, 3% dup, hotspots + matizes MQR/fudge ≥20 líneas), forks, merge queue, fecha (crear plantilla mínima si hardening no aterrizó)
  - Evidencia: `quality-policy.md` ya existe (hardening P1.4). §4.2 nueva con D2 (ambas mitades), QG Sonar way + matices MQR/fudge ≥20 líneas, forks, merge queue, revisores IA, fecha 2026-11-12. Fila `sonarqube` de §2 actualizada a "inactivo (D2 diferido)".

## Fase 2: Activación (N/A — D2 = diferido, sin credenciales)

> No se ejecuta: D2 = mantener inactivo (2026-11-12). Requiere D2 = activar +
> `SONAR_TOKEN`/`SONAR_HOST_URL` presentes. Los parámetros de activación ya quedaron
> decididos en Fase 1 (required directo, skip forks, action sin COE, agregador como
> required check). Se reactivará en un change futuro cuando haya infra/creds.

- [x] Configurar `SONAR_TOKEN` y `SONAR_HOST_URL` en secrets — N/A (D2 diferido; sin instancia Sonar)
- [x] Modificar jobs `client-sonarqube`/`server-sonarqube` (quitar `if: false`, usar `pull_request`, aplicar guard de fork si se decidió skip) — N/A (D2 diferido; jobs siguen `if: false`)
- [x] Ejecutar PR de prueba y confirmar nombre del check `SonarQube Code Analysis` — N/A (D2 diferido)
- [x] Reconciliar mecanismo del check con `docs/learning/quality-gates.md` (enfoque advisory con action vs integración) — N/A en activación; la reconciliación del mecanismo decidido ya se documentó en §4.2 (action sin COE para required directo)
- [x] Añadir al ruleset como required check (tras confirmación + análisis de merge queue) — N/A (D2 diferido; required check sigue siendo el agregador)
- [x] Verificar que CodeRabbit/DeepSource permanecen como asesores (si instalados) — N/A (no instalados; verificado en Fase 1)
- [x] `openspec validate --specs --strict` sin errores
  - Evidencia: pre-archive `Totals: 176 passed, 0 failed`; post-archive `Totals: 177 passed, 0 failed (177 items)` (nueva capability `ci-pr-review-automation`, 4 requirements ADDED, main spec `openspec/specs/ci-pr-review-automation/spec.md`). Change strict: "Change 'ci-pr-review-automation' is valid". Archivado en `openspec/changes/archive/2026-11-12-ci-pr-review-automation` (`specsUpdated: true`, added=4). Fase 2 N/A (D2 diferido); decisión documentada en `quality-policy.md` §4.2.
