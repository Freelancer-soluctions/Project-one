# Tasks: ci-pr-review-automation

**Nota:** Este change es de DECISIÓN (pospuesto). Las tasks 3-6 solo se ejecutan si D2 = activar Y credenciales presentes. Hasta entonces, solo las tasks 1, 2 y 9 son accionables.

## Fase 1: Decisión (accionable ahora)

- [ ] Decidir D2 (documentar en quality-policy.md): ¿Sonar aporta algo que ESLint+resto no cubren? ¿Nube o propio? (afecta `SONAR_HOST_URL`)
- [ ] Decidir D2-forks: skip (guard `if: github.event.pull_request.head.repo.full_name == github.repository`) vs análisis sin secreto
- [ ] Decidir mecanismo del check: integración Sonar↔GitHub (emite `SonarQube Code Analysis`) vs action `sonar-quality-gate-check` + `continue-on-error`
- [ ] Decidir advisory-first vs required-directo (PRD recomienda advisory; decisión doc dice blocking desde día 1 con pre-flight)
- [ ] Verificar si CodeRabbit/DeepSource están instalados antes de exigir que "permanezcan" como asesores
- [ ] Analizar reportería en `merge_group`: el check `SonarQube Code Analysis` (ligado al PR) puede no reportar en el commit sintético de la cola → decidir si el required check es el agregador existente o un job que corra en `merge_group`
- [ ] Registrar en `quality-policy.md`: decisión D2 (ambas mitades), QG aplicado (Sonar way: 0 issues, 80% cov, 3% dup, hotspots + matizes MQR/fudge ≥20 líneas), forks, merge queue, fecha (crear plantilla mínima si hardening no aterrizó)

## Fase 2: Activación (solo si D2 = activar + credenciales presentes)

- [ ] Configurar `SONAR_TOKEN` y `SONAR_HOST_URL` en secrets
- [ ] Modificar jobs `client-sonarqube`/`server-sonarqube` (quitar `if: false`, usar `pull_request`, aplicar guard de fork si se decidió skip)
- [ ] Ejecutar PR de prueba y confirmar nombre del check `SonarQube Code Analysis`
- [ ] Reconciliar mecanismo del check con `docs/learning/quality-gates.md` (enfoque advisory con action vs integración)
- [ ] Añadir al ruleset como required check (tras confirmación + análisis de merge queue)
- [ ] Verificar que CodeRabbit/DeepSource permanecen como asesores (si instalados)
- [ ] `openspec validate --specs --strict` sin errores
