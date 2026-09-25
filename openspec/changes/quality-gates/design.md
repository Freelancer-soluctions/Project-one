# Design

## Context

Ver `proposal.md` (Why). Estado relevante del repo:

- `.github/workflows/ci.yml` substage 2B: `client-typecheck` (L450) y `server-typecheck` (L538) tienen `if: false  # Disabled for incremental CI` y su paso es `npx tsc --noEmit 2>/dev/null || echo "TypeCheck: no-op..."` -> nunca falla. `client-complexity` (L465), `server-complexity` (L553), `client-sonarqube` (L761) y `server-sonarqube` (L822) tambien `if: false`.
- Agregador `prebuild-quality-complete` (L1092): `if: ${{ vars.CI_MINIMAL != 'true' && always() }}`, `needs` de 14 jobs, paso que solo evalua `contains(needs.*.result, 'failure')` -> `cancelled` pasa inadvertido.
- `ci-complete` (L1156) ya distingue `failure` (exit 1) de `cancelled` (exit 0); sus agregadores `prebuild-*-complete` no.
- `docs-validation` no existe; `.markdownlint.json`, `.markdownlintignore` y `.vale.ini` no existen en la raiz (verificado con `ls`).
- `docs/learning/quality-gates.md` (119 lineas) documenta la taxonomia propuesta, pero su final contiene un bloque residual inyectado por un agente previo (linea `--- DELEGATION SUFFIX ---` y un contract schema de `researcher`) que no es parte del documento.
- Referencias canonicas: `docs/CONTEXT-CICD.md` (secciones 3.3 gates activos, 13.4 artefactos), `docs/pre-merge-gates-governance.md`, `docs/learning/docs-changelog-validation.md` (diseno markdownlint/vale), `docs/learning/quality-gates.md`.

## Goals / Non-Goals

**Goals:**

- Que `prebuild-quality-complete` refleje la salud real: fallo y cancelacion de cualquier job bloqueante se traduzcan en gate rojo.
- Que ningun job del substage 2B simule pasar (`if: false` disfrazado de gate, `|| echo` que absorbe el codigo de salida).
- Que la taxonomia blocking/advisory sea contrato (spec) y este documentada en una sola tabla canonica.
- Que `docs-validation` exista como advisory reportable sin frenar merges en fase 1.

**Non-Goals:**

- Activar `client-coverage`/`server-coverage`, `test-unit-*`, `server-import-bounds` ni `server-format-check` (otros changes los reclaman: `coverage-baselines`, `ci-test-integration`, `import-boundaries`, simetria de format).
- Cambiar la politica de `cancelled` de `ci-complete` (hoy exit 0 = skip) ni tocar el ruleset de GitHub / required checks.
- Reformatear o reescribir `docs/` para pasar markdownlint/vale de primera (fase 1 es advisory; limpieza masiva es follow-up).
- Habilitar `security.yml` u otros workflows `disabled_manually`.

## Decisions

### D1 - Taxonomia de gates: `blocking` vs `advisory` como contrato unico

Toda decision de gate se expresa en dos categorias mutuamente excluyivas:

|                     | `blocking`                                      | `advisory`                                                                                                                                                               |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `if:`               | path-scoped o `always()` dentro de su agregador | igual que blocking                                                                                                                                                       |
| `continue-on-error` | ausente (`false`)                               | `true` a nivel job                                                                                                                                                       |
| Efecto en agregador | `failure`/`cancelled` -> `exit 1`               | su `result` no puede bloquear: o no esta en `needs` del agregador bloqueante, o `continue-on-error: true` lo convierte en `success` para `needs` (`actions/toolkit#581`) |
| Uso                 | gates que deben frenar el merge                 | reporte: `dead-code`, `docs-validation` (fase 1), `sonarqube` (fase 1)                                                                                                   |

Tabla canonica unica: `docs/learning/quality-gates.md` (seccion 2). `docs/CONTEXT-CICD.md` y `docs/pre-merge-gates-governance.md` la referencian, no la duplican.

**Alternativas consideradas:** (a) tres niveles (`blocking`/`soft-gate`/`info`) - descartada: GitHub solo entiende `continue-on-error` y required checks, un tercer estado no tiene representacion y solo anade ambiguedad; (b) clasificar por job individual sin regla - descartada porque permite excepciones no auditables.

### D2 - Fix de los gates `if: false` (typecheck, complexity, docs-validation, sonar)

- **`client-typecheck` / `server-typecheck` -> `blocking`**: quitar `if: false`; el paso ejecuta `npm run type-check --workspace=...` si el script existe, si no `npx tsc --noEmit`, y el comando queda como ultimo paso del job **sin `|| echo`** ni `2>/dev/null` que enmascaren el codigo de salida (verificar con `grep -n "|| echo" .github/workflows/ci.yml` sin matches en esos jobs). Dependencia de secuencia: change `typescript-strict-check` crea los scripts; hasta entonces fallback `npx tsc --noEmit`.
- **`client-complexity` / `server-complexity` -> `blocking`**: quitar `if: false`; el job ejecuta ESLint tomando los umbrales de `eslint.config.js` (ya sin `--rule`, requisito previo de `config-correctness`). **No se fusionan con `lint`**: el spec existente `config-correctness` define escenarios propios de los jobs `*-complexity`, y `client-lint`/`server-lint` estan path-scoped standalone (change `ci-prebuild-quality-lint`); fusionar romperia ambos contratos. Se documenta la redundancia aceptada (misma regla underlying) como trade-off.
- **`docs-validation` -> `advisory`**: nace con `continue-on-error: true` + `if: always()` y paso de publicacion (upload-artifact / `$GITHUB_STEP_SUMMARY`) para que el reporte sobreviva aunque el job "falle"; NO entra en `needs` de `prebuild-quality-complete` hasta fase 2 (activacion posterior, fuera de este change).
- **`client-sonarqube` / `server-sonarqube` -> `advisory`**: quitar `if: false` unicamente si hay credenciales (`SONAR_TOKEN`); se agrega `SonarSource/sonar-quality-gate-check` con `continue-on-error: true` para que el quality gate informe sin bloquear. Sin token -> se mantiene `if: false` documentado explicitamente como "sin credenciales", nunca como gate rojo.

**Alternativa descartada:** activar todo como `blocking` de una vez - convertiria la primera corrida en PR bloqueado por deuda historica (type errors, deuda de complejidad, Sonar sin baseline), invitando a re-apagar los gates (regresion a `if: false`).

### D3 - Agregador del CI: `always()` + `cancelled` + `needs` correcto

`prebuild-quality-complete` (y por simetria los demas `prebuild-*-complete`) queda asi:

```yaml
if: ${{ vars.CI_MINIMAL != 'true' && always() }}
steps:
  - name: Check for failures
    run: |
      if [[ "${{ contains(needs.*.result, 'failure') }}" == "true" ]]; then
        echo "One or more quality jobs failed"; exit 1
      fi
      if [[ "${{ contains(needs.*.result, 'cancelled') }}" == "true" ]]; then
        echo "One or more quality jobs were cancelled"; exit 1
      fi
      echo "Quality substage succeeded or was skipped"
```

- `always()` es obligatorio en el agregador: sin el, un `failure` previo salta el job y el gate required se queda "pending" en lugar de fallar.
- `cancelled` trata como fallo dentro del gate de calidad: un run cancelado a medias no puede reportar verde.
- `needs` = exactamente los jobs de su substage y **solo** los `blocking`: `client/server-typecheck` y `client/server-complexity` se mantienen/activan; `docs-validation` advisory no se agrega. Verificacion: `grep -A14 "prebuild-quality-complete:" .github/workflows/ci.yml`.
- `ci-complete` conserva su comportamiento actual de `cancelled` (exit 0) para no cambiar el required check en este change (ver Non-Goals); el `cancelled` de los agregadores `prebuild-*` si bloquea.

**Alternativas consideradas:** (a) `if: !cancelled()` en el agregador - descartada: cancelaria tambien la rama que debe reportar el fallo y romperia el contrato del required check; (b) tratar `cancelled` como skip (exit 0) en calidad - descartada: es exactamente el hueco que hoy deja correr CI interrumpido en verde.

### D4 - `docs/learning/*.md` como capa de referencia de la taxonomia

- `docs/learning/quality-gates.md` es la **tabla canonica** (D1): estado por job, tipo, evidencia (`grep`/linea de `ci.yml`) y al final la lista de referencias oficiales (`docs.github.com/en/actions/...`, `docs.sonarsource.com/`, `docs.vale.sh/`).
- Los artefactos y los docs de gobierno citan rutas reales: `docs/CONTEXT-CICD.md`, `docs/pre-merge-gates-governance.md`, `docs/learning/docs-changelog-validation.md`, `docs/learning/eslint-complexity-configuration.md`. Nota: no existe `docs/learning/pre-merge-gates.md`; el nombre corto que circulaba en el analisis corresponde a `docs/pre-merge-gates-governance.md` - en todos los artefactos se cita la ruta exacta.
- Se elimina el bloque residual de sufijo de delegacion al final de `docs/learning/quality-gates.md` (basura de escritura previa de un agente) y se corrige su auto-descripcion ("286 lineas"; hoy el archivo tiene 119) para que coincida con el contenido real.

**Alternativa descartada:** duplicar la tabla en `docs/CONTEXT-CICD.md` - dos tablas divergentes es la causa original del drift documentado.

## Risks / Trade-offs

- [Activar `typecheck` bloquea PRs existentes por deuda de tipos] -> Secuenciar este change **despues** de `typescript-strict-check` (scripts + baseline de errores ya resueltos); fallback `npx tsc --noEmit` solo si el script aun no existe; revisar la corrida de CI antes de marcar tasks como hechas.
- [Activar `complexity` duplica senal con `lint` (misma regla)] -> Aceptado y documentado en D2; los jobs son baratos y el spec existente ya los nombra; si el costo se vuelve ruidoso, fusionarlos es un change futuro (rompe escenarios, por eso fuera de alcance).
- [Sonar sin licencia/token] -> Condicion explicita en D2: sin `SONAR_TOKEN` el job queda `if: false` documentado, nunca advisory rojo ni bloqueante.
- [markdownlint/vale fallan en todo `docs/` desde el dia 1] -> Fase 1 advisory (`continue-on-error: true`) con reporte publicado; `.markdownlint.json` deshabilita `MD013` (line length) y `.markdownlintignore` excluye `node_modules/`, `dist/`, `coverage/` para que el ruido sea accionable.
- [Los docs dejan de coincidir con `ci.yml` otra vez] -> D4 fija una sola tabla canonica + tarea de validacion que cruza `grep` de `ci.yml` contra la tabla.

## Migration Plan

1. Crear configs de docs (`.markdownlint.json`, `.markdownlintignore`, `.vale.ini`, `.github/styles/`) y comprobar que corren localmente.
2. Fix de `ci.yml` en este orden: typecheck -> complexity -> agregador (`cancelled`) -> `docs-validation` (advisory) -> sonar (si hay token).
3. Actualizar docs (`docs/CONTEXT-CICD.md`, `docs/pre-merge-gates-governance.md`, `docs/learning/quality-gates.md`).
4. `openspec validate quality-gates --strict` + `actionlint` + corrida de CI en PR.
5. **Rollback**: cada fix es un bloque independiente del YAML; el revert del PR restaura el estado previo (`if: false`), sin migracion de datos ni cambios de ruleset.

## Open Questions

- Fase 2 de `docs-validation` (pasarlo a `blocking` y meterlo en `needs`): requiere que `docs/` pase limpio; decision pendiente de datos de la fase 1, fuera de este change.
- `client-sonarqube`/`server-sonarqube` necesitan `SONAR_TOKEN` en este repo; si no hay credenciales aplica la condicion "sin token -> `if: false` documentado" de D2.
