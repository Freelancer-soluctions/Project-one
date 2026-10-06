# Design

## Contexto

El change `ci-testing-pipeline-reactivation` (archivado el 2026-10-03)/jobos a testing de STAGE 2 en FASE 1 advisory:
ejecutan, publican artefactos y anotan el PR, pero con `continue-on-error: true` no bloquean. Su propio diseño
(dibujo D1/D12) era explícito: la promoción a FASE 2 exige una ventana de calibración previa. Sin esa ventana, el
primer flake de infraestructura se convierte en un bloqueo y el equipo aprende a saltarlo — exactamente el fallo que
`ci-shifting-left` ya Attempts evitar con el fallback de hooks deshabilitables.

Por eso el trabajo se dividió. Una ventana de calibración no es código pendiente: es un periodo de observación con
decisiones que dependen de datos que solo GitHub produce (duración real de job, triaje de fallos reales, artifacts de
14 días para la métrica de flakiness).

## Decisiones

**D1 — La ventana de calibración es un change, no una tarea de un change.**

_Alternativa descartada:_ mantener el change abierto 2-4 semanas. Se descartó porque un change visible como
incompleto durante semanas se mezcla con el trabajo siguiente en la cabeza del equipo y en el debug: cuando un PR
rojo aparezca dos meses después, no hay forma de saber si venía de P0, de P1 o de la promoción.

_Consecuencia:_ `ci-testing-pipeline-reactivation` se archiva con P0/P1/grupo 8 verificados y este change conserva
lo que necesita tiempo y GitHub.

**D2 — La promoción es un único PR, no seis.**

Quitar `continue-on-error` en commits separados dejaría el repo en un estado intermedio donde algunos jobs bloquean
y otros no, sin ninguna propiedad útil. Además el `needs` del agregador es transitivo: un PR único hace imposible
que se mergee a medias.

**D3 — El triaje de fallos distingue tres causas y no permite "reintentar en silencio".**

- Test rojo → corregir el test. Un test que seactivate y pasa solo no es flaky, es un test mal escrito.
- `timeout-minutes` insuficiente → ajustarlo con la duración medida (D5).
- Infraestructura → corregir la infra.

La cuarta opción —subir retries para que pase— queda explícitamente prohibida en la capa de tests: `apps/server/vitest.config.js`
ya usa `retry: 2` solo en CI y `e2e/playwright.config.js` `retries: 2` en CI, pero esos retries existen **para que
el reporte exponga el flakiness** (spec `ci-flaky-retry`), no para ocultarlo. Subirlos para silenciar un fallo
destruye la métrica semanal, que es justo lo que permite distinguir un test mal escrito de uno realmente intermitente.

**D4 — El guard de cero tests del hook se cierra aquí, no se deja.**

El guard D7 de los jobs de CI (cae a suite completa si el diff no matchea ningún test) no tiene equivalente en
`.husky/pre-push`. El impacto está acotado porque CI lo vuelve a comprobar, pero un gate local que puede dar verde
sin ejecutar nada erosiona la confianza en la capa shifting-left más rápido que un gate que no existe: el developer
aprende que el hook "siempre pasa".

_Alternativa descartada:_ cerrarlo en `ci-testing-pipeline-reactivation`. Se descartó porque ese change ya se
archivaba y porque exige una decisión de diseño sobre los scripts (`test:changed` debe emitir una señal de "corrí al
menos un test"), que pertenece a este change junto con el resto del gate local.

**D5 — Los timeouts se ajustan con datos, no con intuición.**

`timeout-minutes` de cada job se compara contra la duración observada en la ventana. Solo se sube si la duración
medida se acerca al límite; subirlo "por si acaso" convierte un fallo de infra en un job de 15 minutos que tampoco
da información.

**D6 — La evidencia de la ventana se registra en este change, no en el PR de promoción.**

`ci-testing-pipeline-reactivation` tarea 3.2 lo pedía en su propio `tasks.md`. Al dividir, la evidencia viene aquí.
Se conserva el formato: workspace, job, duración, número de corridas y desviación típica.

## Riesgos

| Riesgo                                                          | Mitigación                                                                                  |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Un flake de infraestructura en la ventana bloquea PRs legítimos | `timeout-minutes` con holgura sobre la duración medida (D5); el triaje separa infra de test |
| El equipo empieza a usar `--no-verify` al primer bloqueo        | Por eso la ventana es obligatoria y no un "cuando se pueda"                                 |
| Regresión silenciosa: el job deja de correr y sigue verde       | El guard de cero tests (D4) + verificación 3.V con un test rojo deliberado                  |
| La promoción se mergea sin evidencia                            | `docs/learning/quality-gates.md` en lockstep es requirement del delta, no una nota          |

## Open Questions

Ninguna abierta. La ventana de calibración no tiene decisión pendiente: se ejecuta y se registra.
