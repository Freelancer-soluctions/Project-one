# Design

## Context

Estado verificado en el repo (no asumido):

- Thresholds viven **solo** en los configs de workspace: client 84/49/63/85 (statements/branches/functions/lines),
  server 39/18/7/39. `vitest.shared.js` define provider y reporters, no thresholds.
- `scripts/ci/check-coverage.mjs` lee `config.test.coverage.thresholds` y solo `summary.total`. No mira `perFile`
  ni globs, y no normaliza rutas.
- `coverage-summary.json` (reporter `json-summary`) trae una entrada por archivo **más** `total`. Las claves son
  rutas **absolutas del SO** — en esta máquina, `C:\Users\...\apps\client\src\components\404\NotFound.jsx`. Cada
  entrada tiene `lines/functions/statements/branches` con `total/covered/skipped/pct`.
- Vitest 4.1.11 soporta de forma nativa `thresholds.perFile` y thresholds por glob, y expone el flag CLI
  `--coverage.thresholds.autoUpdate <boolean|function>` que reescribe los thresholds en el config **solo cuando la
  cobertura actual supera la configurada**.
- Las suites son baratas: server ~5-6s, client ~14s (por eso sharding quedó `N/A`).
- `.husky/pre-push` corre `test:changed` (TIA, diff-scoped, sin `--coverage`). `pre-commit` no menciona coverage.

Ver `proposal.md` para la motivación.

## Goals / Non-Goals

**Goals:**

- Que el veredicto de coverage local y el de CI no puedan discrepar.
- Que la granularidad (`perFile`/glob) se evalúe en **todos** los puntos de enforcement, no solo en Vitest.
- Que el ratchet sea una acción local explícita y reproducible.

**Non-Goals (a nivel de diseño):**

- No cambiar el flujo del artefacto de coverage en CI ni el contrato `reportsDirectory`/`D18` — son de
  `ci-test-jobs-activation`.
- No tocar `continue-on-error` ni la ventana de calibración — de `ci-testing-gate-promotion`.
- No decidir _qué_ globs llevar ni _con qué_ números: eso sale de la cobertura medida por workspace, no de este diseño.

## Decisions

### D1 — El tier local es un comando, no el hook `pre-push`

**Elegido:** `coverage:check` como script de raíz explícito; `pre-push` intacto.

**Por qué:** `pre-push` corre TIA diff-scoped. Bajo D18 un reporte parcial no es comparable a los thresholds globales,
así que atar el gate ahí produciría un falso verde — exactamente el fallo que D18 existe para evitar. Y el costo es
irrelevante: ~30s por ambos workspaces, así que la suite completa local es accesible en cada push sin degradar la calidad.

**Alternativa considerada:** añadir `--coverage` a `test:changed` en `pre-push`. Descartada: con
`--coverage.changed` (de `tia-hardening`) solo mediría el diff, que es otra capacidad y otro requisito.

### D2 — El guard replica la granularidad de Vitest en vez de delegar

**Elegido:** extender `check-coverage.mjs` para evaluar `perFile` y globs.

**Por qué:** Vitest ya evalúa los tres niveles durante `vitest run --coverage` y hace fallar la corrida. Si el guard
solo mira `total`, los dos pueden discrepar: el job falla (por Vitest) con un `✅` impreso antes (por el guard), o al
contrario. Dos aplicaciones del mismo gate con veredictos distintos es peor que no tener guard, porque el log miente
sobre lo que pasó.

**Alternativa considerada:** documentar "Vitest es el único que evalúa granularidad; el guard solo el total".
Descartada: el guard existe para producir un reporte legible por workspace/métrica, y esa utilidad se pierde si su
salida puede contradecir al run. Además el guard es el punto que consume el artefacto de otro job, donde el fallo
puede venir sin que nadie lea la salida de Vitest.

**Consecuencia aceptada:** el guard pasa a duplicar lógica de Vitest. Se mitiga sharing un único módulo de
evaluación entre guard y (si algún día hace falta) otros consumidores, en vez de dos implementaciones.

### D3 — Normalización de rutas a relativa-al-workspace con `/`

**Elegido:** antes de casar globs, convertir cada clave de `coverage-summary.json` a ruta relativa a la raíz del
workspace con separadores `/`.

**Por qué:** hoy las claves son absolutas y con backslashes en Windows. Un patrón `src/utils/**` no casa contra
`C:\...\apps\client\src\utils\x.js`. Sin normalizar, la granularidad sería verde en Linux y vacua en Windows — el peor
modo de fallo posible para un gate, porque parece funcionar.

**Alternativa considerada:** usar `coverage.include`/exclusiones para forzar claves relativas. No existe tal opción:
las claves del `json-summary` las emite el provider, no la config.

### D4 — El ratchet usa el `autoUpdate` nativo, invocado por flag

**Elegido:** script de raíz que corre la suite con `--coverage.thresholds.autoUpdate` y luego **lee el diff** para
reportar qué thresholds suben.

**Por qué:** Vitest solo sube (nunca baja) thresholds cuando la cobertura actual supera la configurada — la semántica
de ratchet ya está garantizada por la herramienta. Reimplementarla sería trabajo con más superficie de bug. Usar el
flag en vez de tocar el config garantiza que el comportamiento de "nunca bajar" no dependa de nuestro código.

**Por qué un script y no una nota en el doc:** el §3.2 del doc ya describía `autoUpdate` y aun así nadie podía subir
un piso — no había comando. La ausencia de la acción era el gap, no la ausencia de la explicación.

### D5 — Granularidad por debajo del piso global, nunca en su lugar

**Elegido:** los floors globales se conservan tal cual; `perFile` y globs se añaden encima.

**Por qué:** bajar el global para permitir例外 por área haría que el número agregado dejara de describir nada.
Mantenerlo bajo y granularizar arriba es lo que §6.1 del doc ya defendía y lo que permite que el total siga siendo
comparable entre corridas y workspaces.

## Risks / Trade-offs

- **El guard queda desfasado ante futuros cambios de Vitest en umbrales** → Mitigación: el contrato de la spec exige
  paridad de veredicto; si Vitest cambia su semántica, la spec es la que obliga a realinear el guard, y el fallo
  aparece como discrepancia de veredicto, no como silencio.
- **Un `perFile` demasiado alto rompe el build del repo entero en vez de señalar un módulo** → Mitigación: arrancar
  con globs dirigidos a áreas ya medidas bien (utilities, hooks) y subir el perFile global solo con evidencia de
  las runs; el ratchet es el camino seguro para reajustar.
- **Añadir el comando local sin información de su costo puede desincentivarlo** → Mitigación: el comando imprime la
  duración medida por workspace; el doc publica el número real, no una estimación.
- **Ratchet ejecutado por unnoticed en CI por un `--` mal construido** → Mitigación: el flag va en el script de raíz
  con la suite completa; ningún workflow añade el flag, y la spec prohíbe explícitamente auto-update en CI (ya
  exigida por `ci-test-jobs-activation`).
- **Duplicación conceptual con `coverage-baselines`** (medición y documentación de baselines) → Mitigación:
  `coverage-baselines` es measurement-and-record; este change define el contrato de enforcement. No se solapan
  requisitos; si al archivar aparece conflicto de propósito, es señal de que esa spec debe actualizarse.

## Migration Plan

1. Implementar el guard extendido **antes** de añadir thresholds granulares. Con solo el piso global actual, el
   comportamiento del guard no cambia (verificable: mismos exit codes en verde y en rojo).
2. Añadir `perFile`/globs a los configs de workspace.
3. Reintroducir el script local de ratchet.
4. Reestructurar el doc y corregir el cross-reference.

**Rollback:** revertir los thresholds granulares de los configs es suficiente — el guard extendido, sin thresholds
granulares configurados, se comporta exactamente como el anterior. Los scripts de raíz son aditivos y su retirada
no rompe nada.

## Open Questions

- **Qué globs y qué números exactos** se eligen para cada workspace: sale de la cobertura medida por área, así que
  se resuelve leyendo `coverage-summary.json` en la tarea de implementación, no antes. No cambia la spec ni el
  enfoque.
