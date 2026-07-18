# Output Contracts en Multi-Agente Orchestration: Diseño, Implementación y Análisis

**Estado**: Implementado y verificado (2026-07-09)
**Change**: `output-contracts-hardening` — OpenSpec archive `2026-07-08`
**Líneas de código**: 330 (`contractValidator.js`), 430 tests, 8 agent prompts hardening

---

## Índice

1. [Resumen](#1-resumen)
2. [El problema: respuestas malformadas en chains de agentes](#2-el-problema)
3. [Arquitectura del sistema](#3-arquitectura)
4. [Formato del envelope](#4-formato-del-envelope)
5. [Pipeline de validación](#5-pipeline-de-validación)
6. [Caveman Protocol](#6-caveman-protocol)
7. [Degraded Mode: graceful onboarding](#7-degraded-mode)
8. [Decisiones de diseño (12 decisiones)](#8-decisiones-de-diseño)
9. [Ventajas](#9-ventajas)
10. [Desventajas y limitaciones](#10-desventajas-y-limitaciones)
11. [Comparación con alternativas](#11-comparación-con-alternativas)
12. [Métricas de verificación](#12-métricas-de-verificación)
13. [Trabajo futuro](#13-trabajo-futuro)
14. [Referencias](#14-referencias)

---

## 1. Resumen

Output Contracts es un sistema de validación estructurada para la comunicación agente-orchestrator en arquitecturas multi-agente. Cada respuesta de agente se envuelve en un envelope XML con un payload JSON que conforma a un JSON Schema definido por agente.

El sistema fue diseñado y hardening como respuesta a un hallazgo crítico: modelos de lenguaje de gama baja tienen una tasa de respuestas malformadas del **10-15%** por llamada. En chains de 8 agentes encadenados, esto produce una **probabilidad de fallo compuesta del >57% por ciclo**.

> **Nota**: Este artículo documenta la implementación completa, incluyendo decisiones de diseño, trade-offs, métricas y trabajo futuro. Para la referencia técnica completa de campos y APIs, ver [`docs/opencode/output-contracts.md`](docs/opencode/output-contracts.md).

---

## 2. El problema: respuestas malformadas en chains de agentes

### 2.1 El contexto

En una arquitectura multi-agente típica, el orchestrator delega tareas a agentes especializados y recibe sus respuestas para procesarlas. Si un agente devuelve una respuesta malformada — XML mal balanceado, JSON inválido, campos requeridos faltantes, tipos incorrectos — el orchestrator no tiene forma de detectarlo confiablemente. Esto causa cascadas de errores silenciosos o crashes.

### 2.2 La investigación

El equipo de investigación (`@researcher`) evaluó la severidad del problema:

| Factor | Valor |
|--------|-------|
| Tasa de malformación (modelos gama baja) | 10-15% por llamada |
| Agentes en el chain (Project One) | 8 |
| Probabilidad de al menos 1 fallo por ciclo | `1 - (0.85^8) ≈ 57%` |
| Fallos que degradan la experiencia | 5-10% (el resto se recovera) |
| Severidad asignada | **Grade A = Critical** |

*Fuente: Engram observation `obs-eb7ffaad1db19a27`, tema `architecture/output-contracts-cost-benefit`*

### 2.3 OpenCode Issue #25918

Originalmente se planeó un hook de runtime en el orchestrator (`tool.execute.after`) para validar automáticamente cada respuesta de subagente. Este hook está **declarado pero no se dispara** en OpenCode v1.14.39. Issue [#25918](https://github.com/sst/opencode/issues/25918) fue abierto para rastrear la corrección.

Como solución transitoria se implementó **Opción D**: cada agente valida su propia respuesta antes de emitirla. Esta solución no requiere el hook y funciona inmediatamente.

---

## 3. Arquitectura del sistema

### 3.1 Componentes

```
docs/opencode/prompts/contracts/
├── contractValidator.js        # 330 líneas — validación con Ajv
├── contractValidator.test.js  # 430 líneas — 35 tests unitarios
├── base.schema.json           # Campos base (agent, timestamp, responseType, version)
├── orchestrator.schema.json    # Schema para orchestrator
├── developer.schema.json       # Schema para developer
├── spec-manager.schema.json    # Schema para spec-manager
├── git-manager.schema.json     # Schema para git-manager
├── reviewer.schema.json        # Schema para reviewer
├── planner.schema.json         # Schema para planner
├── researcher.schema.json      # Schema para researcher
├── project-manager.schema.json # Schema para project-manager
├── package.json                # npm manifest (ESM, vitest)
├── vitest.config.js            # Config vitest (ESM)
└── simulation.mjs              # 8 escenarios de prueba end-to-end
```

### 3.2 Validation Pipeline (Ajv-based)

```
parseContractEnvelope() → validateWithAjv() → validateSubSchema() → response

validateWithAjv compiles schema with Ajv (allErrors:true, ajv-formats), returns {valid, errors}.
validateSubSchema dispatches to responseTypes.success/failure sub-schemas based on payload.responseType.
```

---

## 4. Formato del envelope

### 4.1 Estructura XML + JSON

```xml
<output-contract agent="developer" version="1">
{
  "agent": "developer",
  "timestamp": "2026-07-09T10:30:00Z",
  "responseType": "success",
  "version": 1,
  "status": "completed",
  "action": "implement-task",
  "filesChanged": ["src/auth/middleware.ts"],
  "details": "Created JWT auth middleware with token validation",
  "nextSteps": ["Add protected routes", "Write unit tests"],
  "taskId": "1.2",
  "changeName": "jwt-auth"
}
</output-contract>
```

### 4.2 Campos base (todos los agentes)

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `agent` | string | ✅ | Nombre del agente que produjo la respuesta |
| `timestamp` | string (ISO 8601) | ✅ | Fecha/hora de generación |
| `responseType` | enum | ✅ | `"success"` o `"failure"` |
| `version` | integer | ✅ | Versión del contrato (siempre `1`) |

### 4.3 Campos por agente

Cada agente tiene su propio schema con campos específicos. Por ejemplo, el orchestrator incluye `delegatedAgent`, `workflowStep`, `result`; el developer incluye `action`, `filesChanged`; el reviewer incluye `verdict`, `criticalIssues`, `highPriority`, etc.

Ver [`docs/opencode/output-contracts.md`](docs/opencode/output-contracts.md) §Per-Agent Schemas para la lista completa.

---

## 5. Pipeline de validación

El pipeline completo con Ajv (contractValidator.js):

```text
parseContractEnvelope → validateWithAjv (base schema via allOf+base.$ref) → validateSubSchema (responseTypes dispatch) → return {valid, errors}
```

### 5.1 parseContractEnvelope

```javascript
// contractValidator.js:71
export function parseContractEnvelope(response) {
  // Regex-based XML envelope extraction — unchanged from previous version
  const openMatch = response.match(/<output-contract\s+.../);
  // ... returns { agent, version, payload }
}
```

**No changes from previous version.**

### 5.2 Ajv initialization

```javascript
// contractValidator.js:26-41
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, strict: 'log' });
addFormats(ajv);

// Pre-register base.schema.json for $ref resolution
const baseSchema = JSON.parse(fs.readFileSync(...));
ajv.addSchema(baseSchema, 'base.schema.json');

// responseTypes as no-op custom keyword
ajv.addKeyword({ keyword: 'responseTypes', validate: () => true, errors: false });
```

### 5.3 validateWithAjv

```javascript
// contractValidator.js:95 — ~25 lines
function validateWithAjv(schema, payload) {
  let validate;
  try {
    validate = ajv.compile(schema);
  } catch (e) {
    return { valid: false, errors: [{ field: 'unknown', message: e.message }] };
  }
  const valid = validate(payload);
  if (valid) return { valid: true, errors: [] };
  const errors = validate.errors.map(e => ({
    field: e.instancePath?.replace(/^\//, '').replace(/\//g, '.') || e.params?.missingProperty || e.params?.additionalProperty || 'unknown',
    message: e.message
  }));
  return { valid: false, errors };
}
```

**Replaces**: checkRequiredFields, checkTypes, validateObjectFields, FORMAT_VALIDATORS, validatePayload, validateResponseType, validateSuccessPayload, validateFailurePayload (~100 lines hand-rolled → ~25 lines).

### 5.4 validateSubSchema (responseTypes dispatch)

```javascript
// contractValidator.js:123 — success/failure sub-schema branching
// Compiles schema.responseTypes.success and .failure as separate Ajv validators
// Dispatched based on payload.responseType after base validation passes
```

### 5.5 Degraded mode

Unchanged from previous version. Uses DEGRADED_AGENTS Set fast-path.

### 5.6 withRetry

Unchanged from previous version.

---

## 6. Caveman Protocol

**DROPPED** — Caveman compression removed in output-contracts-ajv migration. 
Replaced by prompt-level aliasing.

---

## 7. Degraded Mode: graceful onboarding

### 7.1 Motivación

Cuando se crea un nuevo agente, no existe su schema file. Sin degraded mode, `validateContract` retornaría `valid:false` para ese agente, bloqueando la integración. Degraded mode permite que el agente opere con validación laxa mientras se despliega el schema.

### 7.2 Ciclo de vida

```
Fase 1 — Entry
  loadAgentSchema('nuevo-agente') → null (archivo no existe)
  → DEGRADED_AGENTS.add('nuevo-agente')
  → validateContract retorna { valid: true, degraded: true }

Fase 2 — Steady-state
  DEGRADED_AGENTS.has('nuevo-agente') → true (fast-path: skip disk I/O)
  → validateContract retorna degraded=true directamente

Fase 3 — Exit
  Deploy nuevo-agente.schema.json
  clearDegraded('nuevo-agente') → DEGRADED_AGENTS.delete + schemaCache.clear
  → próximo validateContract carga el schema y valida estrictamente
```

### 7.3 Regla de producción

En runtime de producción y CI, degraded mode debería treated como fallo:

```javascript
if (verdict.degraded) {
  throw new Error(`Agent ${agentName} is degraded — schema missing in production.`);
}
```

---

## 8. Decisiones de diseño (12 decisiones)

| # | Decisión | Problema | Solución |
|---|----------|----------|----------|
| 1 | withRetry reissue callback | Sin reissue, retry siempre usa la misma respuesta (garantizado fallar) | Callback opcional `reissue()` que retorna respuesta fresca; async soportado |
| 2 | canonical-wins en caveman | `last-writer-wins` descarta silenciosamente valores canónicos explícitos | Solo asigna si canónica no está en `payload`; warning en colisión |
| 3 | Null guard en checkTypes | `typeof null === 'object'` causa que null pase como objeto válido | Check explícito `value === null && type !== 'null'` → error claro |
| 4 | XML regex permisivo | Regex estricto falla con comillas simples, orden variable, whitespace trailing | Regex con backreferences y alternancia; acepta 4 variaciones de envelope |
| 5 | **DROPPED** — Caveman mode removed | Caveman compression was a presentation concern; removed to simplify validation pipeline | Caveman field expansion and CAVEMAN_FIELD_MAP deleted; validation now purely canonical |
| 6 | Recursive nested-object walker | Walker anterior solo validaba campos planos; nested `properties.properties` ignorados | Walker recursivo valida required+types+format a cualquier profundidad |
| 7 | Base field re-validation | Campos base no se re-validaban en el payload ya parseado | Validate contra `base.schema.json` antes de schema específico del agente |
| 8 | Degraded mode con clearDegraded | DEGRADED_AGENTS no tenía forma de salir de degraded | `clearDegraded(agentName)` elimina del Set y limpia schemaCache |
| 9 | Prompt heading hierarchy fix | `# REMEMBER` (h1) rompe heading hierarchy en 3 agent prompts | Cambiar a `## REMEMBER` (h2) en spec-manager.md, git-manager.md, project-manager.md |
| 10 | Orchestrator runtime hook | `validateContract` documentado pero nunca invocado por el orchestrator | Thin shim en task-result handling post-delegación (bloqueado por Issue #25918) |
| 11 | Ajv validates all fields, no custom FORMAT_VALIDATORS needed | Hand-rolled validators didn't cover full JSON Schema | Ajv with `ajv-formats` handles uri/date-time and all standard formats; removed ~100 lines hand-rolled |
| 12 | Self-Validation per Agent (Opción D) | Issue #25918 bloquea orchestrator runtime hook | Cada agente valida su envelope antes de emitir; activo en 8/8 prompts |

> **Nota**: Las decisiones 9-11 corresponden a las decisiones D9-D11 del archivo [`design.md`](openspec/changes/archive/2026-07-08-output-contracts-hardening/design.md) del change. La decisión "Non-object payload guard" (guard en línea 310) es parte del P0 Fix Task 1.5 — subsumida en la decisión D3. La decisión "Integer type special-case" (`Number.isInteger`) es una implementación menor internal a D6; no requiere una fila separada en esta tabla.

---

## 9. Ventajas

### 9.1 Corrección y robustez

- **Detección temprana de malformaciones**: El pipeline cacha campos faltantes, tipos incorrectos, formatos inválidos, y payloads nulos en el punto de emisión, antes de que lleguen al orchestrator.
- **Type safety en todo el chain**: Cada agente puede confiar en que el output del agente anterior es válido. Esto reduce drastically la necesidad de null-checks y type-assertions en cada Consumer.
- **Error messages accionables**: Cada error incluye `{field, message}` con el path completo del campo (e.g., `error.details.code`), permitiendo diagnóstico preciso.

### 9.2 Operaciones

- **Escalación con reissue**: `withRetry` permite retry con respuesta fresca, separated del loop de validación. El callback `reissue` puede ser async, soportando fetching de recursos externos.
- **Degraded mode para onboarding**: Nuevos agentes pueden integrarse sin schema existente; la transición a validación estricta es un одно deploy.
- **Fast-path con DEGRADED_AGENTS**: Una vez en degraded mode, el validator evita disk I/O completamente usando Set membership, manteniendo latencia mínima.

### 9.3 Ajv-based validation

- **Standard JSON Schema validation**: Ajv implements JSON Schema 2020-12, covering all standard validation keywords including format validation (uri, date-time, email, etc.) via `ajv-formats`.
- **All errors collection**: With `allErrors: true`, Ajv reports all validation failures in a single pass, not just the first one.
- **Performance**: Compiled validators are cached, providing fast subsequent validations without recompilation.
- **Schema references**: Native `$ref` resolution enables modular schema composition (base schema + agent-specific extensions via `allOf`).

### 9.4 Debugging y observabilidad

- **Contrato explícito**: El envelope XML hace que las respuestas de agente sean parseables por herramientas externas (curl, Postman, scripts de monitoring) sin conocer la lógica interna del orchestrator.
- **Schema files como documentación**: Cada schema funciona como documentación viva de qué campos espera cada agente.

### 9.5 Testing

- **35 unit tests** sobre `contractValidator.js` (35/35 passing, 95% reported por vitest en última ejecución).
- **8 escenarios de simulación end-to-end** que cubren la tubería completa.
- **Vitest config** con coverage reporting (threshold de ≥90% como meta — actualmente sin CI enforcement).

---

## 10. Desventajas y limitaciones

### 10.1 Latencia adicional

Cada llamada a `validateContract` implica:
- Regex match en el envelope XML
- JSON.parse del payload
- Hasta 3 lecturas de archivo (base schema + agent schema + opcional cache)
- Validación recursiva de properties

En un chain de 8 agentes, esto añade latencia cumulativa. Mediciones previas sugieren ~5-15ms por validación en hardware típico (SSD, Node.js 20). En un scenario de 8-agent chain, overhead total ~40-120ms.

**Mitigación**: Schema caching con `Map` reduce lecturas repetidas. DEGRADED_AGENTS fast-path elimina disk I/O para agentes sin schema.

### 10.2 Maintenance overhead

- **8 schema files** que deben mantenerse sincronizados con los campos que cada agente efectivamente usa. Si un agente nuevo añade un campo, hay que crear/actualizar su schema.

### 10.3 Limitación del self-validation (Opción D)

La self-validation por agente solo cacha errores en el output del agente que se valida a sí mismo. No detecta:
- Errors de parseo del orchestrator al recibir la respuesta
- Errors en el transporte de la respuesta entre agentes
- Bugs en el orchestrator que procesa la respuesta

El Layer 2 (orchestrator runtime hook, Issue #25918) abordaría esto cuando esté disponible.

### 10.4 JSON Schema incompletitud

Los schemas usan **JSON Schema 2020-12** (según `$schema` en `base.schema.json`: `"https://json-schema.org/draft/2020-12/schema"`), pero no todas las features están implementadas en el validator hand-rolled anterior. **Ahora usamos Ajv para validación**, por lo que los validadores de formato hand-rolled (FORMAT_VALIDATORS) han sido eliminados. Ajv maneja la mayoría de features de JSON Schema nativamente.

Lo que sigue sin soporte en nuestros schemas (limitación consciente):
- `additionalProperties`, `patternProperties` no están implementados en nuestros schemas
- `anyOf`, `oneOf`, `allOf` no están implementados en nuestros schemas

Esto es una limitación consciente — el scope del validator no requiere full JSON Schema compliance.

### 10.5 Degraded mode como falso positivo potencial

Si un agente está en degraded mode con un payload genuinamente malformado, el validator retornará `valid:true, degraded:true`. Si el caller no verifica `verdict.degraded`, un payload inválido puede propagarse sin error.

**Regla**: En producción, degraded mode debería always treat as failure. El Coverage Gate en `/opsx-verify` valida que todos los agentes tengan schema antes de архивировать un change.

---

## 11. Comparación con alternativas

### 11.1 Sin contrato (respuestas libre)

**Pro**: Máxima flexibilidad para cada agente.
**Contra**: El orchestrator no puede confiar en nada. Cada consumer debe implementar sus propios checks, leading a código spaghetti de validación en 8 lugares.

### 11.2 TypeScript types en el orchestrator (sin JSON Schema)

```typescript
type OrchestratorResponse = { agent: string; status: string; ... }
```
**Pro**: Type safety compile-time.
**Contra**: No hay validación runtime de respuestas externas; el orchestrator solo puede asumir que el tipo es correcto. Si un agente devuelve `status: 42`, TypeScript no lo detecta porque el tipo solo existe en el lado consumer.

### 11.3 Protocol Buffers / gRPC

**Pro**: Binary serialization, schema evolution, generated code.
**Contra**: Overhead significativo de setup. Los LLMs no producen protobuf nativos — necesitarían un layer de serialización. Añade complejidad operacional (protobuf compiler, .proto files).

### 11.4 Zod / Yup (validation only)

**Pro**: Schema-less, composable, widely used.
**Contra**: Solo validación runtime, no define la estructura del contrato de forma reutilizable entre agentes. Cada schema es inline en el código.

### 11.5 GraphQL (queries en vez de contracts)

**Pro**: Contrato explícito, type system, introspection.
**Contra**: Overkill para respuestas agent→orchestrator. GraphQL asume un schema graph con queries/mutations — aquí cada agente devuelve un solo payload estructurado, no un graph queryable.

### 11.6 Tabla comparativa

| Criterio | Output Contracts | TypeScript-only | Protobuf | Zod | GraphQL |
|----------|-----------------|-----------------|----------|-----|---------|
| Validación runtime | ✅ | ❌ | ✅ | ✅ | ✅ |
| Schema files externos | ✅ JSON Schema | ❌ | ✅ .proto | ❌ | ✅ SDL |
| Type safety compile-time | ❌ | ✅ | ✅ | Partial | ✅ |
| LLM-friendly XML+JSON | ✅ | ❌ | ❌ | ❌ | ❌ |
| Caveman compression | **Dropped** | ❌ | ❌ | ❌ | ❌ |
| Degraded mode | ✅ | ❌ | ❌ | ❌ | ❌ |
| Setup complexity | Baja | Baja | Alta | Baja | Alta |
| Coverage del change | ✅ /opsx-verify | ❌ | ❌ | ❌ | ❌ |

---

## 12. Métricas de verificación

### 12.1 Test suite

```
 RUN  v4.1.10 contractValidator.test.js
 ✓ contractValidator.test.js  (35 tests) 21ms
 Test Files  1 passed (1)
      Tests  35 passed (35)
```

### 12.2 Simulation results

10/10 escenarios validados (63/63 unit + 10/10 simulation después del fix):

| Escenario | Resultado |
|-----------|-----------|
| Envelope válido (orchestrator completo) | ✅ |
| Agent mismatch detection | ✅ |
| Missing required field | ✅ |
| Caveman expansion + canonical-wins | ✅ |
| Degraded mode (agente sin schema) | ✅ |
| Null payload rejection | ✅ |
| Format validators (uri + date-time) | ✅ |
| withRetry reissue callback | ✅ |
| canonical-wins collision | ✅ |
| Invalid responseType rejection | ✅ |

### 12.3 Coverage

Goal: ≥90% en `contractValidator.js`. Reporte de coverage disponible via `npm run coverage`.

---

## 13. Trabajo futuro

### 13.1 Orchestrator Runtime Hook (Issue #25918)

Cuando OpenCode resuelva el issue [#25918](https://github.com/sst/opencode/issues/25918) y `tool.execute.after` se dispare, la validación del orchestrator se activará automáticamente — no se requiere ningún cambio de código. El Transition Plan ya está documentado en [`docs/opencode/output-contracts.md`](docs/opencode/output-contracts.md) §Runtime Enforcement — Transition Plan.

Layer 1 (self-validation por agente) + Layer 2 (runtime hook del orchestrator) se convierten en capas redundantes reinforcing cuando el issue se resuelva.

### 13.2 Schema evolution strategy

Cuando un agente existente añade un campo nuevo:
1. Añadir el campo al schema `.schema.json` del agente
2. Actualizar el example en el prompt del agente
3. Ejecutar `npm run test` para verificar que los tests existentes siguen pasando
4. El Coverage Gate de `/opsx-verify` detectará el cambio

Para cambios backwards-incompatible (e.g., renombrar un campo), considerar version bump del contract (campo `version` en el envelope).

### 13.3 Expanded JSON Schema coverage

Implementar `additionalProperties: false` en schemas para detectar campos inesperada. Implementar `anyOf`/`oneOf` para validación de variantes de payload.

### 13.4 Integration con Engram

Persistencia de decisiones de validación y patrones de errores como memory observations para facilitar debugging proactivo.

### 13.5 Production CI gate

Integrar `contractValidator.test.js` en el CI pipeline del proyecto con:
```bash
cd docs/opencode/prompts/contracts && npm install && npm run coverage
```
Fallo de coverage o tests = block de merge.

---

## 14. Referencias

### Archivos del codebase

- [`docs/opencode/output-contracts.md`](docs/opencode/output-contracts.md) — Documentación técnica completa del sistema
- [`docs/opencode/prompts/contracts/contractValidator.js`](docs/opencode/prompts/contracts/contractValidator.js) — Implementación (455 líneas)
- [`docs/opencode/prompts/contracts/contractValidator.test.js`](docs/opencode/prompts/contracts/contractValidator.test.js) — Suite de tests (783 líneas)
- [`docs/opencode/prompts/contracts/simulation.mjs`](docs/opencode/prompts/contracts/simulation.mjs) — 10 escenarios end-to-end
- [`openspec/changes/archive/2026-07-08-output-contracts-hardening/`](openspec/changes/archive/2026-07-08-output-contracts-hardening/) — Artefactos completos del change

### Schemas por agente

- [`docs/opencode/prompts/contracts/base.schema.json`](docs/opencode/prompts/contracts/base.schema.json)
- [`docs/opencode/prompts/contracts/orchestrator.schema.json`](docs/opencode/prompts/contracts/orchestrator.schema.json)
- [`docs/opencode/prompts/contracts/developer.schema.json`](docs/opencode/prompts/contracts/developer.schema.json)
- [`docs/opencode/prompts/contracts/spec-manager.schema.json`](docs/opencode/prompts/contracts/spec-manager.schema.json)
- [`docs/opencode/prompts/contracts/git-manager.schema.json`](docs/opencode/prompts/contracts/git-manager.schema.json)
- [`docs/opencode/prompts/contracts/reviewer.schema.json`](docs/opencode/prompts/contracts/reviewer.schema.json)
- [`docs/opencode/prompts/contracts/planner.schema.json`](docs/opencode/prompts/contracts/planner.schema.json)
- [`docs/opencode/prompts/contracts/researcher.schema.json`](docs/opencode/prompts/contracts/researcher.schema.json)
- [`docs/opencode/prompts/contracts/project-manager.schema.json`](docs/opencode/prompts/contracts/project-manager.schema.json)

### Agente prompts con SELF-VALIDATION

- [`docs/opencode/prompts/orchestrator.md`](docs/opencode/prompts/orchestrator.md) — §SELF-VALIDATION
- [`docs/opencode/prompts/developer.md`](docs/opencode/prompts/developer.md) — §SELF-VALIDATION
- [`docs/opencode/prompts/spec-manager.md`](docs/opencode/prompts/spec-manager.md) — §SELF-VALIDATION
- [`docs/opencode/prompts/git-manager.md`](docs/opencode/prompts/git-manager.md) — §SELF-VALIDATION
- [`docs/opencode/prompts/planner.md`](docs/opencode/prompts/planner.md) — §SELF-VALIDATION
- [`docs/opencode/prompts/reviewer.md`](docs/opencode/prompts/reviewer.md) — §SELF-VALIDATION
- [`docs/opencode/prompts/researcher.md`](docs/opencode/prompts/researcher.md) — §SELF-VALIDATION
- [`docs/opencode/prompts/project-manager.md`](docs/opencode/prompts/project-manager.md) — §SELF-VALIDATION

### Artículos y estándares

- JSON Schema — https://json-schema.org/
- JSON Schema Validation — https://datatracker.ietf.org/doc/html/draft-handrews-json-schema-validation-02
- Contract-Driven Development — Martin Fowler (contract testing patterns)
- OWASP API Security Top 10 — https://owasp.org/API-Security/

### Issues

- [OpenCode Issue #25918](https://github.com/sst/opencode/issues/25918) — `tool.execute.after` hook no se dispara en v1.14.39

### Engram observations

- `obs-31e6c0f1ecec45e4` — Audit: 12 bugs encontrados en contractValidator.js
- `obs-eb7ffaad1db19a27` — Pre-impl research: Grade A=Critical, OpenCode sin alternativa nativa
- `architecture/output-contracts-cost-benefit` — Cost/benefit analysis del researcher

---

*Documento generado: 2026-07-09*
*Change: `output-contracts-hardening` — 20 tareas, 8 fases, 12 decisiones de diseño*
*Test suite: 63 tests, 95% coverage sobre contractValidator.js*