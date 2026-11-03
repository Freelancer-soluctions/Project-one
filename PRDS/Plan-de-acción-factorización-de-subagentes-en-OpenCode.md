# Plan de acción: factorización de subagentes en OpenCode

Oct 30, 2026 · @Johan

## Resumen

Pasaremos de 8 agentes a un agente principal y dos subagentes de apoyo (reviewer y researcher), con project-manager como cuarto agente solo si las herramientas de Composio pesan demasiado en tokens.

El criterio viene del artículo de Anthropic sobre cuándo plegar subagentes en el loop principal. Un subagente se justifica si aísla un contexto saturado, corre trabajo paralelo con contexto desechable, resuelve conflictos de herramientas o instrucciones, o verifica de forma independiente. Todo lo demás pasa a ser una skill, un comando o un permiso.

A ese criterio se suma una restricción propia: la cuota de la suscripción debe rendir un mes completo con jornadas de 8 horas. Por eso el plan asigna un modelo distinto a cada fase y fija un presupuesto diario con semáforo.

Qué se obtiene:

- Sin traspasos con pérdida entre el interrogatorio, la spec y la implementación.
- Prompts más cortos: el procedimiento vive en skills que se cargan solo cuando hacen falta.
- Menos arranques desde cero del modelo de pago: el developer deja de releer la spec en cada tarea.
- Cada cambio se mide con un eval y se puede revertir agente por agente.

## Punto de partida

Hoy un orchestrator gratuito delega en 7 subagentes, y el gasto de pago se concentra en developer, reviewer y planner. Los modelos son los de tu `opencode.jsonc` actual; los prompts, los del gist de mayo.

| Agente          | Modelo hoy                      | Qué hace en la práctica                          | Fricción detectada                                                          |
| --------------- | ------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| orchestrator    | gratuito (beam-free)            | Enruta y lleva las 6 fases del flujo SDD         | 26 reglas críticas y reglas de eficiencia que compensan el costo de delegar |
| spec-manager    | gratuito (beam-free)            | Ejecuta los comandos /opsx-\*                    | Solo envuelve comandos; recibe el interrogatorio en una línea               |
| git-manager     | gratuito (beam-free)            | Ejecuta /commit-\* y gh                          | Envoltorio de comandos; las prohibiciones viven en el prompt                |
| planner         | pago (claude-haiku-5-5)         | Revisa specs; en modo normal crea docs de diseño | Dos modos en un mismo prompt                                                |
| developer       | pago (gpt-6-luna)               | Implementa, una invocación por tarea             | Relee la spec y explora el código en cada tarea                             |
| reviewer        | pago (gpt-6-luna)               | Revisa el código con un checklist largo          | Salida de 10 secciones; cobertura y lint que ya impone el CI                |
| researcher      | gratuito (beam-free)            | Investiga con web y Context7                     | Salida larga de 7 secciones                                                 |
| project-manager | gratuito (mimo-v2.6-flash-free) | Mueve tarjetas de Trello con Composio            | Justificado por el aislamiento de herramientas                              |

Dónde se pierden tokens y calidad:

- **Traspasos con pérdida:** lo que se decide en el interrogatorio llega al spec-manager como una línea de delegación.
- **Developer por tarea:** cada invocación repite el prompt, relee tasks.md y design.md y vuelve a explorar el código, todo en un modelo de pago.
- **Ruido en los prompts:** el bloque de política de MCP se repite en 5 prompts, el modo OpenSpec/Normal en 3, y muchas reglas ya las imponen los permisos.
- **Verificación duplicada:** `/opsx-verify` y el reviewer comprueban ambos que las tareas estén completas.
- **Configuración:** `build` y `general` siguen activos (sus líneas `disable` están comentadas), `tool_output` admite hasta 400 líneas o 64 KB por salida y `docs/CONTEXT-CICD.md` se carga siempre en `instructions`.

## Arquitectura destino y cómo funciona

Un agente principal ejecuta todo el flujo en un solo contexto y solo delega lo que aísla volumen o verifica de forma independiente.

&#91;embedded content: destino de cada agente · 8 agentes, 3 destinos\]

El principal absorbe a cuatro agentes; los que verifican o aíslan volumen se quedan, y el planner pasa a ser una skill del reviewer.

### Las piezas

- **Agente principal:** lleva la conversación, ejecuta el flujo SDD, implementa por lotes, hace los commits y corre los comandos `/opsx-*` y `/commit-*` directamente.
- **Skills:** guardan el “cómo se hace” y se cargan solo cuando la fase lo pide: `sdd-workflow`, `git-workflow`, `design-docs`, `grill-me` y las de revisión.
- **Comandos:** se mantienen tal cual; lo único que cambia es quién los ejecuta.
- **Subagentes:** el reviewer verifica con otro modelo y contexto limpio, y el researcher aísla el volumen de la web. Project-manager es condicional.
- **Permisos y plugin:** las reglas duras (sin force push, sin `--no-verify`, sin amend) se imponen con bash por patrón y con `neurosymbolic-guardrails.ts`, no con prosa en el prompt.
- **Estado en archivos:** `tasks.md` con `[x]` y notas breves permiten hacer `/compact` o reiniciar la sesión sin perder el hilo.

### Cómo viaja un cambio

1. El principal carga la skill `sdd-workflow` y empieza el interrogatorio con grill-me: mínimo 3 preguntas, hasta que el usuario confirme el plan.
2. Con el plan confirmado corre `/opsx-explore`, `/opsx-new` y `/opsx-propose`, que generan proposal, specs, design y tasks. Si necesita investigar, delega en el researcher y recibe un resumen corto.
3. El reviewer revisa la spec con `review-spec`, una sola vez y en solo lectura, y devuelve un veredicto compacto. El principal ajusta lo que haga falta.
4. El principal cambia al modelo de la fase 4 y ejecuta las tareas por lotes, en orden, marcando `[x]` y haciendo un commit atómico por lote.
5. Vuelve al modelo gratuito, corre `/opsx-verify` (tareas y cobertura de la spec) y pide una sola revisión de código al reviewer con `review-code`.
6. Con verify y review sin hallazgos críticos, ejecuta `/opsx-archive` y actualiza la tarjeta de Trello.

&#91;embedded content: flujo de un cambio · 7 fases, 3 delegaciones\]

Cada fase termina en una compuerta; solo la implementación y las dos revisiones gastan cuota de pago, y el resto corre en modelos gratuitos.

## Cuándo un subagente se convierte en skill, comando o desaparece

Cada agente pasa por las mismas seis preguntas, en este orden, y la primera respuesta afirmativa decide su destino.

1. ¿Solo envuelve comandos y no procesa volumen? Desaparece: queda el comando.
2. ¿Usa el mismo modelo que quien lo llama y necesita su contexto? Se pliega en ese agente, sin costo extra.
3. ¿Lee mucho y devuelve poco (web, diffs, logs)? Se queda aislado, con el modelo más barato que sirva.
4. ¿Verifica trabajo ajeno? Se queda, con otro modelo y salida compacta.
5. ¿Aísla herramientas pesadas o permisos? Se queda.
6. ¿Es texto de "cómo se hace X"? Pasa a ser una skill.

Aplicadas a tus 8 agentes:

| Agente                   | Destino                                               | Pregunta que decide                                                                  |
| ------------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| orchestrator + developer | Un solo agente principal                              | 2: comparten contexto, y hoy el orchestrator solo enruta                             |
| spec-manager             | Desaparece; el principal corre `/opsx-*`              | 1: solo ejecuta comandos                                                             |
| git-manager              | Desaparece; `/commit-*`, permisos por patrón y plugin | 1: el principal ya conoce el cambio y no necesita releer diffs                       |
| planner                  | Skills `review-spec` (del reviewer) y `design-docs`   | 4 y 6: su modo SDD es una revisión independiente; su modo normal es un procedimiento |
| reviewer                 | Se queda, ampliado a spec y código                    | 4: verificación independiente                                                        |
| researcher               | Se queda                                              | 3: aísla el ruido de la web                                                          |
| project-manager          | Condicional                                           | 5: se queda solo si las definiciones de Composio pesan mucho en tokens               |

## Modelos por fase y presupuesto de cuota

Un modelo distinto por fase, dentro de la misma sesión, y un presupuesto diario con semáforo hacen que la cuota rinda el mes completo.

| Fase                                      | Modelo                                         | Por qué                                                     |
| ----------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------- |
| 0 a 2: interrogatorio, exploración y spec | Gratuito                                       | Mucho texto y poca dificultad; el reviewer verifica después |
| 3: revisión de la spec                    | Reviewer con un modelo distinto (probar Haiku) | Independencia respecto de quien escribió la spec            |
| 4: implementación                         | El más barato que pase el eval                 | Es donde está la dificultad real                            |
| 5: verificación                           | Gratuito para `/opsx-verify`, más el reviewer  | Lo mecánico no gasta cuota de pago                          |
| 6: archivo y Trello                       | Gratuito                                       | Trabajo mecánico                                            |
| Investigación en cualquier fase           | Gratuito (researcher)                          | Aísla el volumen de la web                                  |

El cambio de modelo se hace al inicio de cada fase y después de `/compact`, cuando el contexto aún es pequeño. Cambiar de modelo invalida la caché del proveedor, así que no conviene hacerlo a mitad de una fase. Hay que confirmar si tu versión de OpenCode deja fijar el modelo en el frontmatter de cada comando.

Elige el modelo de la fase 4 por costo por tarea aprobada, no por precio por token: uno barato que necesita reintentos puede salir más caro. No conocemos aún las tarifas de gpt-6-luna ni de Haiku en tu plan; esa es la primera medición.

### Presupuesto diario

```latex
\text{presupuesto diario} = \frac{\text{cuota mensual} \times 0.85}{\text{días laborables}}
```

El 0,85 deja un 15% de reserva para retrabajo, y los días laborables son 22 si trabajas de lunes a viernes. Si tu plan tiene ventanas por 5 horas o por semana además de la mensual, la regla se aplica a la ventana más restrictiva. Reparto inicial del presupuesto diario, a calibrar con tus datos: 70% implementación, 20% revisión y 10% imprevistos.

### Semáforo a mitad de jornada

| Consumo del presupuesto diario | Acción                                                                              |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| Menos del 50%                  | Seguir con el flujo normal                                                          |
| Entre el 50% y el 70%          | Pasar tareas de bajo riesgo (docs, refactors, commits) a modelos gratuitos          |
| Más del 70%                    | Solo modelos gratuitos el resto del día; dejar la implementación pesada para mañana |

Los modelos gratuitos tienen sus propios límites de uso, así que no son un colchón infinito. Antes de fijar los umbrales, registra 3 días de consumo real con `opencode-quota` (y con `opencode stats` si tu versión lo trae).

## Plan por fases

La migración tiene siete fases (0 a 6); cada una termina con un criterio de salida medible y se puede revertir sin afectar a las demás. Trabaja en una rama y haz un commit por fase, para que revertir una fase sea un `git revert`.

### Fase 0: línea base y evals

**Objetivo:** medir antes de tocar nada.

- Define un eval de 10 tareas reales y ejecuta cada una 2 veces, porque algunos fallos aparecen solo en una de dos corridas.
- Incluye la cadena completa (interrogatorio, spec, revisión, implementación, verify, commit, Trello) y las reglas que no se pueden romper: grill-me antes de la spec, sin push forzado, sin `--no-verify`, tareas en orden.
- Registra los tokens por agente durante 3 jornadas normales.

**Criterio de salida:** línea base de calidad y de consumo guardada.

### Fase 1: ahorros sin riesgo (hoy)

**Objetivo:** recortar consumo sin cambiar la arquitectura.

- Quita de los prompts los bloques de política de MCP y los párrafos “Why:”.
- Quita `webfetch` y `websearch` del developer: la investigación pasa por el researcher gratuito.
- Baja `tool_output` de 400 líneas / 64 KB a unas 150 líneas / 16 KB y usa reportadores de tests silenciosos.
- Desactiva `build` y `general` (descomenta sus líneas `disable`).
- Mueve `docs/CONTEXT-CICD.md` de `instructions` a una skill y comprueba si la regla 19 del orchestrator duplica CONTEXT.md, que ya carga `instructions`.
- Cambia el developer a invocaciones por lote de tareas, con `[x]` en tasks.md tras cada tarea.

**Criterio de salida:** el eval pasa como en la línea base con menos tokens por tarea.

**Reversión:** revertir el commit; ningún agente cambia.

### Fase 2: skills y comandos

**Objetivo:** sacar la lógica de los prompts sin retirar todavía ningún agente.

- Crea las skills `sdd-workflow` (las 6 fases y sus compuertas), `git-workflow` (Conventional Commits, TBD, commits atómicos), `design-docs` (el modo normal del planner), `review-spec` y `review-code`. Las checklists `review-security`, `review-react` y `review-express` se cargan solo si aplican.
- Mantén los comandos `/opsx-*`, `/commit-*` y `/trello-*`.
- Mueve las prohibiciones de git (sin force push, sin amend, sin `--no-verify`) a permisos de bash por patrón y a `neurosymbolic-guardrails.ts`.
- Reactiva `output-contracts.ts` para forzar una salida compacta en reviewer y researcher: veredicto, hallazgos críticos y altos con archivo y línea, y los de severidad media y baja solo si se piden.

**Criterio de salida:** las skills existen y el eval pasa con los agentes actuales cargándolas.

**Reversión:** revertir el commit; los prompts anteriores siguen en el historial.

### Fase 3: retirar spec-manager y git-manager

**Objetivo:** eliminar los dos envoltorios de comandos.

- Da al agente que lleva la conversación `bash` restringido por patrón: `openspec *`, `git status`, `git diff --stat`, `git add`, `git commit` y `gh`; el resto de git sigue bloqueado. Verifica la sintaxis de patrones en la documentación de permisos de OpenCode.
- Deja el resumen del interrogatorio en el mismo contexto: ya no hay una delegación que lo recorte.
- Haz los commits justo después de cada lote de tareas, con el mensaje tomado de la tarea; no hace falta releer el diff completo.
- Retira ambos agentes de `task` y de la config.

**Criterio de salida:** el eval pasa sin regresiones y todas las reglas inviolables siguen en verde.

**Reversión:** revertir el commit y restituir los dos agentes.

### Fase 4: fusionar el planner en el reviewer

**Objetivo:** una sola verificación independiente, con salida compacta.

- El reviewer carga `review-spec` o `review-code` según lo que se le pida, y revisa una vez por cambio.
- Prueba al reviewer con un modelo distinto al del principal (por ejemplo Haiku) y quédate con el más barato que pase el eval.
- Quita del reviewer lo que ya imponen CI y Husky (cobertura, lint, formato); ese dato se lee del pipeline.
- Retira el planner: su modo de documentos de diseño ya vive en `design-docs`.

**Criterio de salida:** en el eval, la revisión de specs y de código detecta los mismos problemas que antes.

**Reversión:** restituir el planner.

### Fase 5: un solo agente principal

**Objetivo:** un contexto y un loop para todo el flujo.

- Crea el principal con un prompt núcleo corto: identidad, reglas que siempre aplican y cuándo cargar cada skill.
- Asigna el modelo por fase, con `/models` o con el modelo del comando si tu versión lo permite.
- Retira orchestrator y developer. Quita el workaround `edit: ask` del bug #26758 y comprueba que reviewer y researcher conservan `read`, `glob` y `grep`.
- Decide sobre project-manager: mide las definiciones de Composio en tokens; si pesan poco, pásalo al principal, y si pesan mucho, déjalo como subagente.

**Criterio de salida:** el eval pasa y el consumo por cambio baja frente a la línea base.

**Reversión:** restituir orchestrator y developer. Es el cambio más grande, por eso va al final.

### Fase 6: operación y ajuste continuo

**Objetivo:** mantener la cuota bajo control todo el mes.

- Aplica el presupuesto diario y el semáforo.
- Revisa cada semana los tokens por fase y poda las skills que no se usen.
- Reevalúa el modelo del reviewer y el de la fase 4 cuando cambien las tarifas o los modelos disponibles.

**Criterio de salida:** la cuota llega a fin de mes con margen.

Tres reglas valen para todas las fases: cambia una cosa a la vez, compara qué tareas cambiaron y no solo el puntaje global, y si algo empeora revierte únicamente ese agente.

## Evals y métricas

Un eval pequeño y repetido decide cada cambio: si el agente plegado puntúa peor que el subagente, el subagente se queda.

El eval tiene dos niveles. Un set de extremo a extremo (las 10 tareas de la fase 0) mide el flujo completo, y cada skill lleva sus propios casos pequeños. Mientras exista el orchestrator se mide también el enrutamiento (si eligió al agente correcto); cuando un agente se pliega, se mide si el principal cargó la skill correcta.

| Métrica                                       | Cómo se mide                                                                  | Umbral para seguir                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Calidad de la tarea                           | Rúbrica sobre el mensaje final y los artefactos (spec, código, commit)        | No baja frente a la línea base                                     |
| Reglas inviolables                            | Casos que intentan romperlas: push forzado, saltar grill-me, commit sin hooks | 100% respetadas                                                    |
| Tokens de pago por tarea                      | `opencode-quota` y, si existe, `opencode stats`                               | Igual o menor que la línea base                                    |
| Tokens totales por tarea, gratuitos incluidos | Las mismas fuentes                                                            | Sin saltos grandes, porque la cuota gratuita también tiene límites |
| Carga de skills                               | Si el principal cargó la skill que correspondía                               | Se carga en todos los casos que aplican                            |
| Turnos hasta terminar                         | Conteo de turnos por tarea                                                    | Igual o menor                                                      |

Cómo comparar:

- Mira qué tareas cambiaron, no solo el promedio. En el caso que describe el artículo, plegar un subagente en otro bajó la latencia pero rompió un proceso que antes pasaba: el agente respondía solo, sin consultar al especialista.
- Ejecuta cada tarea al menos 2 veces; esa ruptura apareció solo en una de dos corridas.
- Incluye una tarea por cada cadena de agentes que corre en producción y una por cada regla que no se puede romper.

## Riesgos y reversión

El mayor riesgo es perder calidad al quitar un agente, y por eso cada fase tiene su eval y su reversión. Los demás riesgos son de consumo.

| Riesgo                                                                   | Señal                                                            | Mitigación o reversión                                                                   |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| El principal gratuito redacta specs de menor calidad                     | Sube el rechazo del reviewer o baja el puntaje del eval de specs | Usar un modelo mejor solo en las fases 1 y 2, o volver a delegar la redacción de la spec |
| El contexto largo encarece cada turno                                    | Sesiones largas sin `/compact`                                   | Una sesión por cambio, `/compact` por lote de tareas y estado en tasks.md                |
| Una regla que imponía un agente se rompe (por ejemplo, commit sin hooks) | Un caso rojo en el eval de reglas inviolables                    | Mover la regla a permisos o al plugin y revertir la fase afectada                        |
| El cambio de modelo a mitad de sesión invalida la caché                  | Un turno de arranque caro                                        | Cambiar solo en los límites de fase y después de `/compact`                              |
| Los límites de los modelos gratuitos frenan el trabajo                   | Avisos de límite o respuestas lentas                             | Aplicar el semáforo y reservar presupuesto de pago para tareas pequeñas                  |
| Composio pesa en el contexto del principal                               | Muchos tokens fijos por turno                                    | Mantener project-manager como subagente                                                  |
| El bug #26758 oculta herramientas heredadas                              | Reviewer o researcher sin `read`, `glob` o `grep`                | Usar `edit: ask` como ya hace el researcher, hasta que el bug se corrija                 |

Reversión: cada fase es un commit en una rama, así que revertirla es un `git revert`. Los prompts de los agentes retirados quedan en el historial de git, y no se borran de la rama hasta cerrar la fase 6.

## Próximos pasos

Antes de empezar hay cuatro cosas por confirmar, y la primera semana cubre las fases 0 y 1 y el arranque de la fase 2.

A confirmar antes de empezar:

- Si OpenCode reutiliza la sesión del subagente entre tareas o si cada tarea arranca de cero.
- Si tu versión permite fijar el modelo en el frontmatter de los comandos.
- Las tarifas y los límites de gpt-6-luna y de Haiku en tu plan de opencode-go, y qué modelos descuentan saldo.
- Cuántos tokens suman las definiciones de herramientas de Composio.

Checklist de la primera semana:

- [ ] Crear la rama de la migración
- [ ] Definir los 10 casos del eval, con las reglas inviolables
- [ ] Medir los tokens por agente durante 3 jornadas
- [ ] Recortar prompts, quitar `webfetch` y `websearch` del developer y bajar `tool_output`
- [ ] Desactivar `build` y `general`
- [ ] Mover `docs/CONTEXT-CICD.md` a una skill
- [ ] Pasar el developer a invocaciones por lote
- [ ] Redactar las skills `sdd-workflow`, `git-workflow`, `design-docs`, `review-spec` y `review-code`
- [ ] Reactivar `output-contracts.ts` para reviewer y researcher
- [ ] Pasar el eval con las skills y decidir si se retira el git-manager

## Fuentes

- [Building agents: When to fold subagents into your main agent loop](https://claude.com/resources/articles/building-agents-when-to-fold-subagents-into-your-main-agent-loop), Anthropic, 22 de octubre de 2026.
