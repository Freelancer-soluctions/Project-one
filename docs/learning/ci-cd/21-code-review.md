# 21 — Code Review: Práctica, Técnica y Cultura de Revisión

> **Guía 21 — Enterprise CI/CD** | Anterior: [20-governance-stage.md](./20-governance-stage.md)
>
> Code review es **la técnica nº 1 de aseguramiento de calidad en la industria** de software: la revisión humana del código ajeno antes de que entre a la rama principal. Esta guía lo cubre todo desde cero: por qué revisar, cómo revisar, qué buscar, las técnicas concretas, las herramientas (incluida la IA), cómo medir el proceso y cómo hacerlo bien cuando eres un equipo de uno.

---

## 🎯 Objetivo

1. **Qué es** code review y por qué es la técnica de QA nº 1
2. **Los 8 beneficios** concretos de revisar código
3. **El proceso**: el PR como unidad, tamaño, velocidad y etiqueta
4. **Las dimensiones** que hay que cubrir en cada revisión
5. **Técnicas prácticas**: review por lectura, por ejecución, incremental, autor vs revisor
6. **El rol de la IA** en la revisión moderna
7. **Métricas** para medir la salud del proceso
8. **Cómo aplicar todo esto en un equipo de una sola persona**

---

## 📋 Resumen Ejecutivo

```
        ┌────────────────────────────────────────────────┐
        │              CODE REVIEW (Humano)              │
        │                                                │
        │  POR QUÉ   → Calidad, compartición, seguridad  │
        │  QUÉ       → 6 dimensiones de análisis         │
        │  CÓMO      → Técnicas de lectura y ejecución   │
        │  CON QUÉ   → GitHub UI, Copilot, issues        │
        │  CUÁNTO    → <400 LOC, <500 LOC/h, 60-90 min   │
        │  MEDIR     → DORA, tiempo, densidad de defectos│
        │  SOLO      → Self-review + personas externas   │
        └────────────────────────────────────────────────┘
```

**Regla de oro** (SmartBear, "Best Kept Secrets of Peer Code Review" — datos de 5.000+ inspecciones):

| Métrica               | Valor recomendado | Efecto de superarlo                         |
| --------------------- | ----------------- | ------------------------------------------- |
| Tamaño del cambio     | **< 400 LOC**     | Caída de efectividad de detección           |
| Velocidad de revisión | **< 500 LOC/h**   | Menos defectos detectados a mayor velocidad |
| Duración de la sesión | **60-90 min**     | La atención decae tras ~90 min              |

> Revisar **menos** código, **más despacio** y en **sesiones cortas** es **más efectivo** que revisar PRs gigantes sin pausa. El tamaño del PR es **el mayor predictor** de la calidad de la review.

---

## 🏗️ Parte 1 — Por qué existe: la técnica de QA nº 1

### 1.1 Qué es

**Code review** (revisión de código) es el examen sistemático del código fuente por una **persona distinta a quien lo escribió**, con el objetivo de encontrar defectos antes de que el código llegue a producción.

Es una **verificación humana** que complementa a las **verificaciones automáticas** (tests, lint, CI). El CI garantiza "el código compila y los tests pasan"; la review garantiza que además **tiene sentido**, **es mantenible**, **es seguro** y **comunica intención**.

### 1.2 Diferencias con lo automático

| Dimensión         | CI / Tests (automático)                          | Code Review (humano)                        |
| ----------------- | ------------------------------------------------ | ------------------------------------------- |
| Qué detecta       | Errores lógicos, regresiones, formato, vulns SCA | Diseño, legibilidad, intención, duplicación |
| Coste por defecto | Bajo, repetible, determinista                    | Alto, no repetible, depende del revisor     |
| Aprendizaje       | No                                               | **Alto**: el equipo aprende en cada review  |
| Sesgo del autor   | Ninguno (ejecuta el plano)                       | **El autor está ciego** a sus propios bugs  |
| Reglas            | Explícitas (tests, lint)                         | Implícitas (convenciones, sentido común)    |

> **El insight central**: el autor de un código **no puede ver sus propios errores** — su cerebro ejecuta la "versión que quiso escribir", no la que escribió. Un segundo par de ojos rompe ese sesgo. Esta es la razón psicológica de fondo de por qué la review funciona, y por qué es la técnica más antigua **y más vigente** de QA.

### 1.3 Los 8 beneficios (respuesta a "¿por qué molestarse?")

1. **Detecta bugs temprano** — un defecto encontrado en review cuesta **5-10× menos** que encontrado en producción (la ley de Boehm: el coste de un defecto crece exponencialmente cuanto más tarde se encuentra).
2. **Mejora la calidad y mantenibilidad** — el código revisado tiende a ser más claro, comentado y estructurado, simplemente porque "alguien lo va a leer".
3. **Comparte conocimiento** — el revisor aprende del autor y viceversa; la review es **transferencia de conocimiento** sobre el dominio y la arquitectura.
4. **Impone consistencia** — es el mecanismo que hace que el código del equipo parezca escrito **por una sola persona**, aplicando convenciones.
5. **Detecta riesgos** — arquitectura frágil, deuda técnica, configuraciones peligrosas, dependencias dudosas.
6. **Protege `main`** — es la última línea antes del merge; protege la rama que todos consumen.
7. **Documenta decisiones** — los hilos de discusión en el PR quedan como **memoria de decisiones** (por qué se hizo así).
8. **Construye confianza** — un equipo que se revisa mutuamente confía más en su propio código y en su pipeline.

---

## 🏗️ Parte 2 — El proceso: el PR como unidad de review

### 2.1 El flujo clásico

```
[1] Desarrollador crea rama feature
        │
[2] Desarrollador abre PR hacia main
        │   (título conventional + template + checks CI)
        ▼
[3] Revisor 1: review técnica (diseño, lógica, seguridad)
        │
[4] Revisor 2 (si aplica): review de dominio / CODEOWNERS
        │
[5] Discusión → cambios → recorrido (iteración)
        │
[6] Aprobación (approve) → Merge (squash → main)
        │
[7] Post-merge: CI/CD (deploy, release)
```

### 2.2 El tamaño importa (la métrica nº 1)

La investigación empírica (SmartBear) es contundente:

- PRs **< 200 LOC**: la tasa de detección de defectos se desploma por debajo del umbral mínimo.
- PRs **400-1000 LOC**: la efectividad cae drásticamente.
- PRs **> 1000 LOC**: la revisión se vuelve **contraproducente** — el revisor se rinde y aprueba sin leer.

**Reglas prácticas**:

- Un PR debería poder revisarse en **una sesión de 60-90 min**.
- Si el PR es demasiado grande, **partirlo**: cada commit/tema tiene su propio PR.
- **La review no es un reescaneo**: bloques generados, configs de CI, dependencias y renombres masivos **no necesitan lectura línea a línea** — revísalos con un vistazo y concéntrate en la lógica real.

### 2.3 Velocidad y latencia

| Métrica              | Valor óptimo            | Por qué                                      |
| -------------------- | ----------------------- | -------------------------------------------- |
| Tiempo de respuesta  | Primera review en < 24h | El contexto del autor sigue fresco           |
| Velocidad de lectura | < 500 LOC/h             | Superarla = leer por encima = perder defects |
| Duración de sesión   | 60-90 min               | Tras ~90 min, el revisor "apaga"             |

La latencia de review es una de las **4 métricas DORA** (Lead Time for Changes): un PR que espera días por review infla el lead time y frena el flujo.

### 2.4 Etiqueta del revisor

- **Crítica al código, no a la persona** ("esta función hace X" ≠ "tú hiciste X mal").
- **Sé específico y accionable**: señala la línea y propón cómo arreglarlo.
- **Usa la distinción de severidad** para que el autor sepa qué priorizar:

| Severidad              | Significado                          | Bloquea merge? |
| ---------------------- | ------------------------------------ | :------------: |
| **Critical / Blocker** | Bug, vulnerabilidad, breaking change |     ✅ Sí      |
| **Warning / Major**    | Riesgo, deuda, error latente         | ⚠️ Idealmente  |
| **Nit / Minor**        | Estilo, preferencia, nitpick         |     ❌ No      |

> El autor **no debería sentir que cada nit** bloquea el merge. Etiquetar la severidad permite aprobar un PR con nits pendientes (que se resuelven en un follow-up) sin bloquear el flujo.

---

## 🏗️ Parte 3 — Las 6 dimensiones del análisis

Cada review debe cubrir **6 dimensiones**. El checklist operativo se encuentra en `docs/code-review-checklist.md`, que esta guía amplía y ordena según estas dimensiones.

### Dimensión 1: Funcionalidad

- ¿El código hace **lo que dice el PR** que hace? (lee el título + body del PR primero)
- ¿Cubre los **edge cases**? (inputs vacíos, nulos, límites, casos extremos)
- ¿Maneja los **errores** adecuadamente? (try/catch, códigos de error, mensajes)
- ¿Hay **valores hardcodeados** que deberían ser config/constantes?

### Dimensión 2: Diseño y mantenibilidad

- ¿El código es **legible** y está **bien estructurado**?
- ¿Cada función tiene **una sola responsabilidad** (SRP)?
- ¿Hay **duplicación** (DRY) que se pueda extraer?
- ¿Los nombres de variables/funciones son **descriptivos**?
- ¿Hay **código muerto** o **comentado** que sobra?

### Dimensión 3: Seguridad

- ¿Hay **validación de input** (incluida la del lado servidor, no solo el cliente)?
- ¿Se **loguea o expone** datos sensibles (passwords, tokens, PII)?
- ¿Hay checks de **autenticación/autorización** donde hacen falta?
- ¿Se previene **SQL injection** (en este proyecto: uso correcto de Prisma)?
- ¿Se previene **XSS** (encoding de salida)?
- ¿El código introduce dependencias o secretos nuevos?

### Dimensión 4: Testing

- ¿El código nuevo tiene **tests unitarios** apropiados?
- ¿Los tests cubren **happy path y errores**?
- ¿Hay **tests de integración** para endpoints nuevos?
- ¿Pasan **localmente y en CI**?

### Dimensión 5: Estilo y formato

- ¿Sigue la **guía de estilo** (`docs/code-style.md`)?
- ¿Prettier aplicado (`npm run format`)?
- ¿Sin errores de lint (`npm run lint`)?
- ¿Indentación y espaciado **consistentes**?

### Dimensión 6: Documentación (JSDoc)

- ¿Las funciones **nuevas o modificadas** tienen JSDoc correcto (`@param`, `@returns`, `@throws`)?
- ¿Los tipos son correctos y consistentes entre módulos?
- Ver sección específica al final de esta guía y `docs/code-review-checklist.md`.

---

## 🏗️ Parte 4 — Técnicas prácticas de revisión

### 4.1 Review por lectura de código (estática)

Leer el diff línea a línea siguiendo el **flujo de ejecución** (no el orden de los archivos):

1. **Entiende el contexto** — lee el PR body y los tests primero.
2. **Sigue el hilo** — de la entrada (controlador) al dominio (servicio) a la persistencia (DAO), igual que lo haría el runtime.
3. **Busca "huele raro"** — `TODO`, `FIXME`, `any`, `@ts-ignore`, `console.log`, catch vacíos, `!` non-null assertion.
4. **Verifica los cambios en cascada** — un cambio de firma rompe a todos los callers.

### 4.2 Review por ejecución (dinámica)

- **Corre el código** localmente y prueba el flujo (no solo leerlo).
- Ejecuta los tests del ámbito (en este proyecto: `vitest run --changed origin/main` en server + client).
- Revisa que el CI degobernanza pase (los 4 checks del ruleset, guía 19).

### 4.3 Review incremental / por commits

En lugar de revisar el diff total del PR, revisa **commit a commit** siguiendo la historia narrativa del cambio. Ventajas:

- Cada commit es una unidad lógica pequeña y revisable.
- Detectas errores en **su punto de origen**, no en el diff agregado.
- Facilita el bisect futuro.

### 4.4 Autor vs revisor: roles

| Rol         | Responsabilidad                                                                                |
| ----------- | ---------------------------------------------------------------------------------------------- |
| **Autor**   | Explica el _qué_ y el _por qué_ en el PR body; responde feedback con calma; divide PRs grandes |
| **Revisor** | Verifica contra los 6 dimensiones; etiqueta severidad; aprueba o pide cambios según bloqueros  |

> **Aprobación con nits**: si solo hay nits/minor, el revisor puede **aprobar** y dejar que el autor los resuelva en un follow-up. Si hay un **blocker/warning**, se piden cambios **o** se aprueba condicionalmente con el blocker señalado.

### 4.5 El recorrido (walkthrough) síncrono

Para código **crítico o complejo** (auth, pagos, migraciones), en lugar de una review asíncrona únicamente:

1. El autor **explica el flujo** línea a línea al revisor.
2. El revisor **interrumpe** donde ve problemas.
3. Se resuelven decision design en el momento (no en hilos espaciados en el tiempo).

Es caro en tiempo pero **muy efectivo** para cambios de alto riesgo.

---

## 🏗️ Parte 5 — Herramientas y el rol de la IA

### 5.1 Herramientas nativas de GitHub

- **GitHub PR review UI**: comentarios por línea (inline), `Approve`/`Request changes`/`Comment`, hilos de discusión resueltos (`required_review_thread_resolution` en el ruleset, guía 19).
- **Suggested changes**: comentarios que proponen un cambio concreto aplicable con un clic.
- **CODEOWNERS**: garantiza que el equipo correcto revise cada path (guía 19).
- **Required reviews**: `required_approving_review_count=1` en el ruleset (guía 19).
- **PR checks**: los 4 checks del CI (firma, commit lint, PR title, DCO) son **prerrequisito** de una buena review — automatizan lo que el humano no debería gastar esfuerzo en.

### 5.2 El rol de la IA en la review (2026)

La IA (Copilot code review, agents) **automatiza la pasada mecánica**, dejando a la persona el juicio de diseño:

| Qué puede hacer bien la IA                     | Qué sigue siendo humano                            |
| ---------------------------------------------- | -------------------------------------------------- |
| Detectar smells: duplicación, dead code, `any` | Valorar decisiones de **arquitectura**             |
| Encontrar bugs lógicos obvios y edge cases     | Evaluar **intención de negocio** y contexto        |
| Verificar convenciones y JSDoc/firma           | Tomar decisiones de **trade-off** (deuda vs plazo) |
| Sugerir tests faltantes                        | Dar feedback **constructivo** y enseñar            |

> **Limitación crítica conocida (verificada en este proyecto)**: Copilot y la mayoría de agents de review **solo dejan un COMMENT (comentario), nunca un APPROVE**. No cuentan hacia `required_approving_review_count`. Para levantar un approve se necesita un **actor humano** o un **bot/GitHub App** con permisos de write y membresía en CODEOWNERS (y las reglas bot-to-bot impiden que el mismo actor que crea el PR lo apruebe).

**Conclusión práctica**: la IA es un **revisor junior incansable** que hace la primera pasada; la **decisión final y el approve** los debe dar una persona.

### 5.3 El pipeline del proyecto como revisor automático

El CI del proyecto ya hace de "primer revisor" **no humano** de la gobernanza (guía 19):

- `Verify Commit Signatures` — integridad de los commits del PR
- `Commit Lint` — Conventional Commits
- `PR Title Lint` — título del PR
- `DCO` — sign-off
- `Dependency Review` — vulns de dependencias nuevas

> **Shifting-left (guía 11)**: estos gates eliminan el trabajo mecánico de la review humana. El revisor **no pierde tiempo** verificando formato o firma; lo invierte en las **6 dimensiones** de la Parte 3.

---

## 🏗️ Parte 6 — Métricas de salud del proceso

Para saber **si tu proceso de review funciona**, mide:

| Métrica                          | Qué mide                                   | Valor sano                |
| -------------------------------- | ------------------------------------------ | ------------------------- |
| **Density de defectos**          | Defectos encontrados ÷ LOC revisados       | Sube al mejorar la review |
| **% de cambios sin revisión**    | (# merges sin review) ÷ (# merges totales) | 0% (ideal)                |
| **Tiempo hasta primera review**  | PR abierto → primera observación           | < 24h                     |
| **Lead Time for Changes (DORA)** | Commit → deploy                            | Bajo                      |
| **Change Failure Rate (DORA)**   | Deploys que causan incidentes              | Bajo                      |
| **Conversaciones resueltas**     | Hilos cerrados sin merge                   | Alto (se resuelven antes) |

> Conexión con guía 22 (DORA): la review impacta directamente **Lead Time for Changes** (latencia de review) y **Change Failure Rate** (menos bugs pasan a prod).

---

## 🏗️ Parte 7 — Cómo hacerlo en un equipo de una sola persona

Es el caso **real de este proyecto** (repo didáctico, un solo dev). La regla de GitHub es contundente:

> **"Pull request authors cannot approve their own pull requests"** — es una regla fija de GitHub, no configurable. Además, el ruleset 21227644 tiene `current_user_can_bypass: never`.

### 7.1 Estrategias para un solo dev

| Estrategia                      | Cómo                                                                                                             | Limitación                      |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **Self-review (siempre)**       | Revisa tu propio PR con la checklist, línea a línea, días después de escribirlo                                  | No rompe el sesgo del autor     |
| **Review por "doble rol"**      | En el PR, escribe el **body completo** (qué, por qué, cómo se probó, riesgos) y revisa **como si fuera de otro** | Psicológico                     |
| **Revisión diferida**           | Deja el PR 24h y revísalo "fresco", como lector externo                                                          | No siempre posible              |
| **Persona externa**             | Un compañero, un code reviewer freelancer, un mentor                                                             | Depende de recursos             |
| **IA como revisor junior**      | Copilot/agents para la pasada mecánica (Parte 5.2)                                                               | No aprueba, solo comenta        |
| **Self-merge con reglas duras** | Relajar temporalmente el conteo de reviews o usar `bypass_actors` (opción infra, guía 19)                        | Requiere decisión de gobernanza |

### 7.2 Recomendación para este repo

La **mejor práctica realista** para un dev solo es combinar:

1. **Self-review estricta** con `docs/code-review-checklist.md` (la guía presente + el checklist asociado).
2. **Diferenciar severidades**: no bloquear tu propio flujo por nits.
3. **Revisión diferida** para código crítico (esperar 24h antes de mergear auth/migraciones).
4. **IA como segunda pasada** mecánica.
5. **Personas externas puntuales** para los cambios más críticos.

> **Nota de gobernanza**: si el ruleset `required_approving_review_count=1` impide self-merge, la alternativa es una **decisión explícita** (no un workaround): o bien se relaja el conteo, o bien se da bypass `pull_request` a un rol Admin (guía 19). Ambas son cambios de política que deben decidirse con intención, no improvisarse. En la práctica didáctica de este repo, la **auto-revisión** es la técnica de aprendizaje principal; el gate de revisión externa es el "endurecimiento" que se activa cuando haya más de un contribuidor.

---

## 🏗️ Parte 8 — La sección JSDoc (validación de documentación)

Este proyecto tiene una **guía de documentación estricta** para controller/service/DAO (ver `docs/code-review-checklist.md` sección JSDoc y `docs/jsdoc-reference-guide.md`). El revisor debe verificar:

### Controladores (Controller)

- `@param {Object} req` con propiedades específicas (`req.body`, `req.params`, `req.safeQuery`, `req.userId`, `req.cookies` según aplique).
- `@param {Object} res`.
- `@returns {Promise<void>}`.
- `@throws {ClientError}` con tipo, razón y status code cuando hay throw.

### Servicios (Service)

- Documentar las propiedades de `data`/`params` con **anotación de tipo** y **descripción**.
- Propiedades opcionales con corchetes: `[paramName]`.
- Tipos de retorno Promise correctos.
- `@throws {Error}` para validación, `@throws {ClientError}` para lógica de negocio.

### DAOs

- Documentar `where`, `take`/`skip` (paginación).
- Tipos de retorno correctos (`Object`, `Array<Object>`, `Object|null`).

### Excluidos

- **No** documentar `routes.js` (se usa Swagger/OpenAPI).
- **No** añadir JSDoc a archivos de definición de rutas.

> **Regla de oro JSDoc**: el propósito se dice en la **primera línea** (no `@description`), la firma se autodocumenta (no `@function` ni `@async`), y los tipos usan el formato `@param {type} name - description`. La consistencia se valida contra `docs/jsdoc-reference-guide.md`.

---

## ✅ Implementation Checklist (para aplicar hoy)

### Autor (antes de pedir review)

- [ ] PR pequeño (< 400 LOC) y con título conventional (guía 19)
- [ ] PR body completo: qué, por qué, cómo se probó, riesgos, plan de rollback
- [ ] Commits firmados (`git commit -Ss`) + Conventional Commits (guías 19/05)
- [ ] Tests del ámbito pasan localmente (`vitest run --changed origin/main`)
- [ ] Lint + format pasan (`npm run lint`, `npm run format`)
- [ ] Self-review previa con este checklist antes de abrir el PR

### Revisor (al revisar)

- [ ] Leer el PR body y entender el _qué_ y el _por qué_ antes del diff
- [ ] Cubrir las **6 dimensiones** (Parte 3): funcionalidad, diseño, seguridad, testing, estilo, doc
- [ ] Etiquetar severidad: Blocker / Warning / Nit
- [ ] Proponer cambios sugeridos (suggested changes) cuando sea claro
- [ ] No bloquear por nits; concentrar atención en los blockers
- [ ] Revisar en sesión de 60-90 min, < 500 LOC/h

### Proceso (métricas)

- [ ] Primera review < 24h
- [ ] Todos los hilos de discusión resueltos antes del merge
- [ ] Registrar defectos encontrados (para medir densidad)
- [ ] Aprobar solo cuando cumple: blockers resueltos + checks verdes

---

## ❓ FAQ

### ¿Code review es solo para equipos grandes?

**No.** Es **la técnica de QA nº 1** independientemente del tamaño del equipo. En un equipo de uno, la review se hace con self-review disciplinada, revisión diferida e IA como segunda pasada (Parte 7). El valor de la "segunda opinión" no depende del tamaño del org.

### ¿Si el CI ya valida todo, hace falta la revisión humana?

**Sí.** El CI valida **lo que se puede automatizar**: tests, lint, formato, firmas, vulns. No puede juzgar **diseño, legibilidad, intención de negocio, duplicación o seguridad de diseño**. Son conjuntos complementarios (Parte 1.2).

### ¿Un PR grande es siempre malo?

**No necesariamente**, pero es **difícil de revisar bien**. Los datos SmartBear muestran que la efectividad cae con el tamaño. La regla: si supera ~400 LOC, **partirlo** en PRs temáticos. Hay excepciones legítimas (renombres masivos, configs de CI, dependencias) que no requieren lectura línea a línea.

### ¿La IA me puede aprobar el PR?

**No cuentan como approve.** Copilot y la mayoría de agents solo dejan comentarios; no incrementan `required_approving_review_count`. Para un approve real necesitas un actor humano o un bot con write + CODEOWNERS (y la regla bot-to-bot). La IA es un **revisor junior de apoyo**, no un sustituto del humano.

### ¿Qué hago si mi jefe/equipo quiere aprobar PRs de 2000 líneas?

Es una señal de **deuda de review** — el proceso se está saltando la regla del tamaño. Propón dividir en PRs temáticos y usa la data (efectividad cae >400 LOC) para justificar el cambio de hábito.

### ¿La review ralentiza el equipo?

**Inicialmente sí**, pero es **falsa economía** evitarla: encontrar 1 bug en review cuesta minutos; encontrarlo en producción cuesta horas o dinero real (ley de Boehm). Además, la review que **comparte conocimiento** reduce preguntas futuras y defectos recurrentes. La latencia de review se gestiona (objetivo < 24h), no se elimina.

### ¿Qué diferencia hay entre esta guía y el `docs/code-review-checklist.md` existente?

El **checklist** es la herramienta operativa (las casillas que marcas); esta **guía** es el documento educativo que te enseña **por qué** cada dimensión importa, las técnicas, las métricas y el caso de un solo dev. Se usan juntos: lees esta guía, aplicas el checklist.

---

## 📖 Glosario

| Término                | Definición                                                                                              |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| **Code Review**        | Examen sistemático del código por una persona distinta a quien lo escribió, antes de que entre a `main` |
| **Diff**               | Diferencia entre dos versiones del código (lo que cambia en el PR)                                      |
| **Blocker**            | Hallazgo que impide el merge (bug, vuln, breaking change)                                               |
| **Warning/Major**      | Hallazgo que debería arreglarse (riesgo, deuda, error latente)                                          |
| **Nit/Minor**          | Hallazgo menor de estilo o preferencia que no bloquea                                                   |
| **Approval (approve)** | Veredicto del revisor que permite el merge; cuenta hacia `required_approving_review_count`              |
| **Request changes**    | Veredicto del revisor que bloquea el merge hasta que se corrijan los hallazgos                          |
| **Suggested change**   | Comentario de GitHub que propone un cambio aplicable con un clic                                        |
| **CODEOWNERS**         | Archivo que asigna owners por path; con `require_code_owner_review` fuerza su revisión                  |
| **Ley de Boehm**       | El coste de un defecto crece un orden de magnitud por cada fase más tarde que se encuentra              |
| **Self-review**        | Autorevisión del propio PR; en un dev solo es la técnica principal                                      |
| **Review diferida**    | Revisar el propio código tras 24h, "como lector externo", para romper el sesgo del autor                |

---

## 📚 Referencias

| Recurso                       | URL                                                                                                                                                         |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Google Eng Practices (review) | https://google.github.io/eng-practices/review/                                                                                                              |
| SmartBear Code Review         | https://smartbear.com/learn/code-review/best-practices-for-peer-code-review/                                                                                |
| GitHub About PR reviews       | https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews                     |
| GitHub PR reviews (actions)   | https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/approving-a-pull-request-with-required-reviews |
| Define feature branch PR      | https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/collaborating-with-issues-and-pull-requests/about-pull-requests  |
| DORA metrics (guía 22)        | https://dora.dev/                                                                                                                                           |
| CheckList del proyecto        | `docs/code-review-checklist.md`                                                                                                                             |
| Guía de governance gates      | `docs/learning/ci-cd/19-governance-gates.md`                                                                                                                |

---

## ➡️ Siguiente

> **Has dominado la práctica de code review** — la técnica de QA nº 1, sus 8 beneficios, las 6 dimensiones, las técnicas, el rol de la IA, las métricas y el caso single-dev. Estás listo para aplicar `docs/code-review-checklist.md` y para el entendimiento de governance (guía 19) y métricas (guía 22).

> **Índice**: [README Profesional](./profesional-README.md) · **Anterior**: [20-governance-stage.md](./20-governance-stage.md)
