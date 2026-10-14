# Property-Based Testing (fast-check) — Invariantes, Parsers y Lógica Pura [SL]

> **Fecha de investigación:** 2026-10-07  
> **Alcance:** concepto (PBT vs example-based, ciclo generate-assert-shrink), API de fast-check v4
> (arbitraries, runners, `Parameters`, model-based testing, ecosistema), patrones de propiedades
> (invariantes/leyes, round-trip, parsers, lógica pura, cálculo monetario con `bigInt`,
> schema-driven Joi/zod) + patrones CI (seed, numRuns, reproducir counterexamples, flaky
> properties, TIA/sharding) y **estado actual en este monorepo** (fast-check **NO instalado** —
> purgado como phantom dep en `9ae16e8f`, 0 propiedades, gap P2 documentado) con plan priorizado.  
> **Audiencia:** Equipo de ingeniería, CI/CD maintainers, QA lead.  
> **Status:** ✅ Investigación completa — el repo **no tiene PBT activo** (docs previos afirman
> `fast-check@3.23.2` instalado; hoy requiere reinstalación), con plan de adopción en 5 pasos
> **condicionado a no duplicar ownership** de `ci-testing-gate-promotion` (FASE 1) ni
> `tia-hardening` (TIA/changed-only).

---

## 1. Conceptos

**Property-Based Testing (PBT)** es una técnica de testing donde no se escriben ejemplos concretos
("para input X espero output Y"), sino **propiedades invariantes** que deben cumplirse para
**cualquier** entrada de un dominio dado: el framework genera las entradas, ejecuta la aserción
cientos de veces y, cuando algo falla, **encoge (shrink)** el contraejemplo hasta el caso mínimo
que todavía lo reproduce.

> QuickCheck nació en Haskell — Claessen & Hughes, ICFP 2000 [[quickcheck-paper]] — y mutó a casi
> todos los lenguajes: Hypothesis (Python), jqwik (Java), proptest (Rust/Ruby) y **fast-check**
> (JavaScript/TypeScript). La idea central no cambió: **"para cualquier `x` tal que se cumple la
> precondición, el predicado es verdadero"**.

### 1.1 PBT vs example-based

| Eje                | Example-based (Vitest clásico)               | Property-based (fast-check)                                     |
| ------------------ | -------------------------------------------- | --------------------------------------------------------------- |
| Qué define el test | Input concreto + output esperado             | Propiedad/ley que vale para todo el dominio                     |
| Cobertura          | Los casos que el developer **imaginó**       | Cientos/miles de inputs generados, sesgados hacia edge cases    |
| Fallo típico       | Regresión conocida                           | Caso límite no contemplado ("" , 0, -1, max int, strings raros) |
| Output del fallo   | `expected X, received Y`                     | **Counterexample mínimo + `seed`/`path` reproducible**          |
| Mejor para         | Regresiones, flujos conocidos, contratos API | Parsers, validadores, algoritmos puros, invariantes de dominio  |
| No reemplaza       | —                                            | PBT **no sustituye** los unit tests example-based               |

### 1.2 Ciclo generate → assert → shrink

1. **Generate**: cada arbitraries produce un valor aleatorio (pero **determinista** dada una
   semilla). Ej: `fc.integer()`, `fc.string()`, `fc.record({...})`.
2. **Assert**: el predicado se evalúa. Devuelve `true`/`undefined` (ok), `false` (fail) o lanza
   (`expect(...)`). `fc.pre(cond)` descarta entradas que no cumplen la precondición.
3. **Shrink**: al fallar, fast-check **reintenta con valores más simples** hasta hallar el menor
   contraejemplo que sigue fallando. Un `fc.string()` de 500 caracteres puede encogerse a `""`;
   un objeto a `{ id: 0 }`. El error final imprime `seed`, `path` y el counterexample.

### 1.3 Reglas de escritura de propiedades

- **No mutar los inputs** dentro del predicado: rompe el shrinking y distorsiona el counterexample
  (documentado en [[fc-properties]]). Si necesitas mutar, clona antes.
- **Preferir constraints del arbitrary sobre `.filter`**: `fc.string({ minLength: 2 })` en vez de
  `fc.string().filter(s => s.length >= 2)` — el filtro **genera y descarta**, y un filtro muy
  estricto dispara `maxSkipsPerRun` o degrada el rendimiento [[fc-properties]].
- **`fc.pre` vs `.filter`**: misma semántica (descartar entradas inválidas); `fc.pre` es inline y
  legible, `.filter` compone. Ambos consumen intentos — acota el dominio en el arbitrary cuando
  sea posible.
- **Propiedad fuerte > propiedad débil**: `x === x` siempre pasa y no detecta nada. Una propiedad
  útil **falla cuando se introduce un bug** — si nunca puede fallar, es ruido.
- **Excepciones como fallo, no como invariante**: no envuelvas todo en `try/catch` que devuelva
  `true`; deja que el error se propague para que el shrinker converja.

---

## 2. API de fast-check (v4)

### 2.1 Bloques principales

| Bloque          | Qué aporta                                            | Referencia         |
| --------------- | ----------------------------------------------------- | ------------------ |
| **Arbitraries** | Generador **+ shrinker** (no es solo aleatorio)       | [[fc-arbitraries]] |
| **Properties**  | `fc.property(...arbs, pred)` / `fc.asyncProperty`     | [[fc-properties]]  |
| **Runners**     | `fc.assert`, `fc.check`, `fc.sample`, `fc.statistics` | [[fc-runners]]     |
| **Plugins**     | Hooks de vida, reporters, interruptores               | [[fc-plugins]]     |

### 2.2 Arbitraries — cuatro familias

| Familia        | Contenido                                            | Ejemplos                                                                                                                                       |
| -------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Primitives** | Átomos con shrink hacia valores mínimos              | `fc.string()`, `fc.integer()`, `fc.nat()`, `fc.boolean()`, `fc.date()`, `fc.bigInt()`, `fc.double()`                                           |
| **Composites** | Estructuras construidas sobre otras                  | `fc.array(x)`, `fc.record({...})`, `fc.dictionary(k, v)`, `fc.tuple(a, b)`, `fc.object()`, `fc.json()`                                         |
| **Combiners**  | Combina/refina arbitraries                           | `fc.oneof(...)`, `fc.frequency([[w, x]])`, `fc.option(x)`, `fc.letrec(tie => ({...}))`, `.map()`, `.chain()`, `.filter()`, `fc.uniqueArray(x)` |
| **Fake data**  | Formatos realistas (código que ramifica por formato) | `fc.uuid()`, `fc.email()`, `fc.url()`, `fc.domain()`, `fc.ip()`, `fc.semver()`                                                                 |

Combinadores clave: `fc.frequency` pondera alternativas (útil para sesgar hacia casos comunes);
`fc.letrec` define tipos recursivos (árboles/JSON); `chain` correlaciona inputs (el segundo valor
depende del primero); `uniqueArray` genera arrays sin duplicados con criterio de unicidad.

### 2.3 Runners y `Parameters<T>`

| API / Parámetro                  | Significado                                                                                          |
| -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `fc.assert(prop, p)`             | Ejecuta y **lanza** con mensaje formateado (counterexample + seed) — el runner habitual              |
| `fc.check(prop, p)`              | Igual pero devuelve `RunDetails` (para reporters propios)                                            |
| `fc.sample(arb, n)`              | Extrae n valores de un arbitrary — para diseñar/depurar generadores                                  |
| `fc.statistics(arb, classify)`   | Distribución de clases de valores generados (calidad del arbitrary)                                  |
| `numRuns` (default **100**)      | Iteraciones por propiedad                                                                            |
| `seed`                           | Semilla de la corrida — **clave para reproducir**                                                    |
| `path`                           | Ruta al counterexample (`"96:5"`) — con `seed` reproduce directamente el fallo                       |
| `endOnFailure: true`             | Para en el primer fallo **sin shrink** — usado junto a `seed`+`path` para replay del mínimo          |
| `examples`                       | Valores fijos inyectados **antes** de los generados (regresiones conocidas siempre evaluadas)        |
| `maxSkipsPerRun`                 | Máx. descartes por run por `fc.pre`/`.filter` — evita loops de precondiciones                        |
| `fc.interruptAfterTimeLimit(ms)` | **Plugin** (reemplaza al parámetro deprecado `interruptAfterTimeLimit`): corta corridas largas en CI |

> `configureGlobal({...})` establece defaults globales (típico en el setupFile de Vitest);
> **resetea todo** lo anterior — para extender sin perderlo: `fc.configureGlobal({ ...
fc.readConfigureGlobal(), ...nuevos })` [[fc-global]]. Los **plugins no se comparten vía
> `configureGlobal`**: van por `fc.installGlobalPlugin(...)`.

### 2.4 Model-based testing (stateful)

Para sistemas con **estado** donde el bug solo aparece tras una **secuencia** de operaciones:

| Pieza                                                 | Rol                                                                                        |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `ICommand.check(model)`                               | ¿Es legal este comando en el estado actual?                                                |
| `ICommand.run(model, real)`                           | Ejecuta sobre el sistema real **y** actualiza el modelo; lanza si divergen                 |
| `ICommand.toString()`                                 | Serializa el comando para el reporte del fallo                                             |
| `fc.commands(cmds, {size})`                           | Arbitrary de **escenarios** — shrink eficiente de secuencias (mejor que `fc.array(oneof)`) |
| `fc.modelRun` / `asyncModelRun` / `scheduledModelRun` | Runners síncrono / async / **con scheduler** (detecta race conditions)                     |
| Replay                                                | Además de `{seed, path}`, `fc.commands` necesita `{replayPath}` (se imprime en el fallo)   |

> El **modelo debe ser una simplificación**, no una copia del sistema — "no pruebas el código
> comparándolo consigo mismo" [[fc-model]].

### 2.5 Ecosistema y track record

| Paquete                 | Rol                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `@fast-check/vitest` ⭐ | Integración oficial: `test.prop([fc...])` / `test.prop({k: fc...})` + sync de timeouts   |
| `zod-fast-check`        | Convierte schemas **zod** → arbitrary: `ZodFastCheck().inputOf(schema)` [[fc-ecosystem]] |
| `@fast-check/poisoning` | Detecta prototype poisoning en globals durante la generación                             |

Track record: fast-check se usa en **Jest, fp-ts, Ramda**; el equipo de TypeScript (Microsoft)
"fuzzing del compilador con fast-check encontró en segundos el mismo bug que costó horas" (Jake
Bailey) y hay casos en Google Docs — ver [[fc-intro]] y [[fc-trackrecord]]. No hay evidencia
sólida de "PBT en aerolíneas/Bloomberg" en las fuentes oficiales: citar solo lo verificable.

---

## 3. Patrones de propiedades

### 3.1 Invariantes y leyes (algebra)

```ts
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

describe('leyes del dedupe (unique)', () => {
  it('idempotencia: dedupe(dedupe(x)) === dedupe(x)', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (xs) => {
        expect(dedupe(dedupe(xs))).toEqual(dedupe(xs));
      })
    );
  });

  it('permutación: el resultado es una permutación sin duplicados del input', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (xs) => {
        const out = dedupe(xs);
        expect([...out].sort((a, b) => a - b)).toEqual(
          [...new Set(xs)].sort((a, b) => a - b)
        );
      })
    );
  });

  it('orden estable: conserva la primera aparición', () => {
    fc.assert(
      fc.property(fc.array(fc.integer()), (xs) => {
        const out = dedupe(xs);
        for (const v of out) expect(xs.indexOf(v)).toBeGreaterThanOrEqual(0);
      })
    );
  });
});
```

Leyes clásicas para funciones propias: **idempotencia** (`f(f(x)) = f(x)`), **invariante de
dominio** (porcentaje siempre ∈ [0,100], stock nunca negativo, suma total ≥ 0), **conmutatividad
/ asociatividad** (operadores propios), **round-trip** (ver §3.2).

### 3.2 Round-trip: `parse ∘ print = id`

```ts
// serialize(x) → string; parse(string) → x  ⇒  parse(serialize(x)) deep-equals x
fc.assert(
  fc.property(
    fc.record({ id: fc.nat(), nombre: fc.string(), total: fc.integer() }),
    (obj) => {
      expect(parse(serialize(obj))).toEqual(obj);
    }
  )
);
```

Parsers/serialización ideales para PBT: **JSON** (`fc.json()` genera strings JSON arbitrarios;
`JSON.parse(JSON.stringify(x))` ≈ id para datos JSON-safe), **fechas ISO** (round-trip
`Date → toISOString → parse`), **CSV** (parse(serialize(rows)) ≈ rows con escaping), **URL
encoding** (`decodeURIComponent(encodeURIComponent(s))`).

### 3.3 Lógica pura: sorting, paginación, filtros

```ts
// Leyes de sorting (Propiedad 1-3 del artículo de Suschkewitsch / QuickCheck clásico)
fc.assert(
  fc.property(fc.array(fc.integer()), (xs) => {
    const s = sortAsc(xs);
    // 1. Ordenado
    for (let i = 1; i < s.length; i++)
      expect(s[i - 1]).toBeLessThanOrEqual(s[i]);
    // 2. Permutación (mismo multiset)
    expect([...s].sort((a, b) => a - b)).toEqual([...xs].sort((a, b) => a - b));
    // 3. Idempotencia
    expect(sortAsc(s)).toEqual(s);
  })
);

// Paginación: la unión de páginas es el original, sin solape
fc.assert(
  fc.property(
    fc.array(fc.integer()),
    fc.integer({ min: 1, max: 50 }),
    (xs, size) => {
      const pages = paginate(xs, size);
      expect(pages.flat()).toEqual(xs);
      expect(pages.every((p) => p.length <= size)).toBe(true);
    }
  )
);
```

### 3.4 Cálculo monetario con `fc.bigInt` (nunca floating point)

```ts
// Dinero en centavos/minor units como bigInt — 0.1 + 0.2 no existe aquí
fc.assert(
  fc.property(
    fc.bigInt({ min: 0n, max: 1_000_000_00n }),
    fc.bigInt({ min: 0n, max: 1_000_000_00n }),
    (a, b) => {
      expect(addMoney(a, b)).toBe(a + b); // conmutativo
      expect(subMoney(a, a)).toBe(0n); // autoinverso
      expect(pctOf(100n, a)).toBeLessThanOrEqual(a); // porcentaje ∈ [0, x]
      expect(pctOf(0n, a)).toBe(0n); // caso límite
    }
  )
);
```

Regla: **si el dominio es dinero, el arbitrary es `fc.bigInt`** (o enteros en minor units). No
uses `fc.double()` para montos: los errores de precisión flotante hacen que la propiedad falle
"por el lenguaje", no por el bug → genera flaky properties.

### 3.5 Schema-driven: Joi (server) y zod (client)

Este repo valida en **dos** librerías distintas:

| Lugar         | Librería        | Schemas                                                        | Estrategia arbitrary                                     |
| ------------- | --------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| `apps/server` | **Joi**         | 24 × `src/modules/*/schemas/*.joi.js` + `src/utils/joiSchemas` | Arbitrary Joi-driven (receta §3.5.1) + `schema.validate` |
| `apps/client` | **zod** ^3.23.8 | 23 × `src/modules/*/utils/schema.js` (+ `zod-i18n.js`)         | `zod-fast-check` → `ZodFastCheck().inputOf(schema)`      |

#### 3.5.1 Arbitrary Joi-driven (receta server)

```ts
import Joi from 'joi';
import fc from 'fast-check';

// Patrón: 1) generar un objeto "candidato" holgado, 2) parsearlo con Joi,
// 3) predicado sobre el valor parseado → toda propiedad valida el dominio real.
const userArb = fc
  .record({
    nombre: fc.string({ minLength: 1, maxLength: 50 }),
    email: fc.email(),
    edad: fc.integer({ min: 0, max: 120 }),
  })
  .map((cand) => {
    const { value } = usersJoiSchema.validate(cand, {
      convert: true,
      stripUnknown: true,
    });
    return value;
  });

fc.assert(
  fc.property(userArb, (user) => {
    // La propiedad se evalúa SIEMPRE sobre entradas válidas según Joi
    expect(usersJoiSchema.validate(user).error).toBeUndefined();
  })
);
```

Para **rechazos**: propiedad complementaria con `fc.anything()`+mutación — si `validate(x)` falla,
el mensaje de error debe ser determinista y no lanzar excepción no controlada.

#### 3.5.2 zod (receta client, con `zod-fast-check`)

```ts
import fc from 'fast-check';
import { ZodFastCheck } from 'zod-fast-check';
import { expenseSchema } from '@/modules/expenses/utils/schema';

const expenseArb = ZodFastCheck().inputOf(expenseSchema);

fc.assert(
  fc.property(expenseArb, (exp) => {
    expect(expenseSchema.safeParse(exp).success).toBe(true);
  })
);
```

### 3.6 Model testing para state machines (stock / asistencia)

```ts
class StockCheckCommand implements fc.Command<Model, StockSystem> {
  constructor(
    readonly sku: string,
    readonly qty: number
  ) {}
  check = (m: Model) => m.stock[m.sku] !== undefined;
  run(m: Model, r: StockSystem): void {
    r.restock(this.sku, this.qty); // sistema real
    m.stock[this.sku] += this.qty; // modelo simplificado
    expect(r.get(this.sku)).toBe(m.stock[this.sku]); // invariantes en cada paso
    expect(r.get(this.sku)).toBeGreaterThanOrEqual(0); // stock nunca negativo
  }
  toString = () => `restock(${this.sku}, ${this.qty})`;
}

fc.assert(
  fc.property(fc.commands(allCommands, { size: '+1' }), (cmds) => {
    fc.modelRun(() => ({ model: initModel(), real: initSystem() }), cmds);
  }),
  { numRuns: 100 }
);
```

Candidatos del repo: **stock/warehouse** (restock → sell → nunca negativo), **attendance**
(check-in/out idempotente), **payroll** (cálculo acumulativo). El replay de `commands` exige
`{replayPath}` además de `{seed, path}` [[fc-model]].

---

## 4. Patrones CI

### 4.1 Estrategia de seed: reproducibilidad > aleatoriedad

| Entorno         | Semilla                   | Racional                                                           |
| --------------- | ------------------------- | ------------------------------------------------------------------ |
| **CI**          | **Fija** (`seed: 42`/env) | Corridas deterministas: un fallo es **reproducible**, no aleatorio |
| **Local**       | Random (default)          | Explora espacio nuevo sin tocar CI                                 |
| **Repro local** | `--seed=<s> --path=<p>`   | Copia el `seed`+`path`/`replayPath` del fallo de CI → mismo caso   |

Receta: en CI fija la semilla **e imprímela siempre**; el mensaje de fallo de `fc.assert` ya
trae `{ seed, path, endOnFailure }` — **guarda ese log** en el job (artefacto o salida de
consola) para poder reproducir desde local:

```bash
npx vitest run src/**/**.unit.test.js --reporter=verbose   # local
# Replay del fallo de CI (copiado del log):
node replay.mjs  # → fc.assert(prop, { seed: 670108017, path: '96:5', endOnFailure: true })
```

### 4.2 `numRuns`: local 100 (default) vs CI 1000

```js
// vitest.setup.js (setupFile) — ajusta según entorno, sin tocar cada test
import fc from 'fast-check';
fc.configureGlobal({
  numRuns: process.env.CI ? 1000 : 100,
  // seed fija SOLO en CI para determinismo; local random explora más
  ...(process.env.CI ? { seed: 42 } : {}),
});
```

> Presupuesto de tiempo: **PBT va en STAGE 2 PRE-Build (< 1–2 min)** — opera sobre source, sin
> build artifact, con el mismo runner que los unit tests; ~1000 cases por property en ~1–3 s
> [[emp] §36.3 item 14]. Si una property supera el presupuesto, baja `numRuns` o divide la
> propiedad; **nunca** dejes `numRuns` enorme bloqueando el PR (anti-pattern §4.5).

### 4.3 Fallos: counterexamples y cuarentena de flaky properties

- El output de `fc.assert` incluye **counterexample, seed, path, shrunk N veces** — es el
  **artefacto de debugging**; el CI debe conservarlo (log completo, no truncado).
- **Flaky property** = propiedad mal escrita (no determinista, dependiente de red/reloj/orden de
  módulos, o `filter` demasiado estricto que gana a veces). Tratamiento en este repo: misma
  vía que los tests flaky — `vitest-flaky-reporter.mjs` + **cuarentena** en lugar de reintentar
  silenciosamente [[ute] §flaky].
- Regla: una property flaky **no se duerme con retry**; se diagnostica (¿input no determinista? ¿
  mutación de inputs? ¿`filter` de por medio?) y se corrige, o se pone en cuarentena con issue.

### 4.4 Interacción con TIA y sharding

| Mecanismo                | Interacción con PBT                                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **TIA** (`test:changed`) | PBT corre dentro del mismo `*.unit.test.js` → **viaja gratis** con la selección changed-only [[tia]]                                       |
| **Sharding**             | Reparte por archivo: las properties se distribuyen como cualquier test; vigila que una property **no domine** una shard (balanceo) [[sto]] |
| **Coverage**             | PBT suele **subir** ramas/branches cubiertas; es candidato a justificar ratchets [[cov]]                                                   |
| **Cuarentena**           | Fallback si una property resulta no determinista en CI                                                                                     |

### 4.5 Anti-patterns (qué NO hacer)

| Anti-pattern                                 | Por qué duele                                                        | Alternativa                                             |
| -------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------- |
| Propiedad **débil** (`expect(x).toEqual(x)`) | Siempre true → 0 bugs detectados, solo ruido                         | Propiedad que **fallaría** ante un bug plausible        |
| **Filter-heavy** (`.filter` anidados)        | Genera y descarta → lento, `maxSkipsPerRun` alcanzado                | Constraints en el arbitrary (`min/max/minLength`)       |
| **Huge `numRuns`** en PR (p.ej. 100k)        | Bloquea el pipeline, viola presupuesto < 1–2 min                     | 100 local / 1000 CI; campañas intensivas en **nightly** |
| **Sin log de seed**                          | Fallo no reproducible → "pasa en mi máquina"                         | Semilla fija CI + log `seed`+`path` obligatorio         |
| **PBT para CRUD simple** o mock-heavy        | Overhead de generador sin retorno; mocks + aleatoriedad = ruido      | PBT para parsers/lógica pura; ejemplos para CRUD        |
| Excepciones como invariant (try/catch→true)  | Enmascara errores, shrink inútil                                     | Dejar propagar el error                                 |
| Mutar inputs en el predicado                 | Rompe shrinking y display del counterexample [[fc-properties]]       | Clonar antes de mutar                                   |
| **`fc.anything()` + side effects**           | Genera `undefined`/claves raras en código con efectos no controlados | Arbitraries acotados al dominio                         |

---

## 5. Estado actual del repo + plan priorizado

### 5.1 Auditoría (2026-10-07)

| Hecho                            | Evidencia                                                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **fast-check NO está instalado** | `grep '"fast-check"' **/package.json` → 0 matches en root, `apps/server`, `apps/client`, `e2e`; tampoco en `package-lock.json`                          |
| Fue **purgado** como phantom dep | Commit `9ae16e8f` _"chore(deps): purge flattened phantom deps from root manifest"_ eliminó `"fast-check": "3.23.2"` del manifest raíz                   |
| **0 propiedades** existentes     | Ningún `fc.property`/`fc.assert` en el código                                                                                                           |
| Docs previos **desactualizados** | `unit-tests-enterprise.md` §23.3 línea 329 y `panorama-resumen.md` línea 45 dicen "`fast-check@3.23.2` instalado, 0 usos" → **hoy requiere reinstalar** |
| Gap **P2** ya documentado        | `unit-tests-enterprise.md` §23.3: "Property-based con fast-check para parsers/invariantes"                                                              |
| Candidatos server (Joi)          | 24 schemas `src/modules/*/schemas/*.joi.js` + `src/utils/joiSchemas`                                                                                    |
| Candidatos client (zod)          | 23 schemas `src/modules/*/utils/schema.js`, `zod-i18n.js`                                                                                               |
| Stack de tests                   | Vitest 4.1.11 (root), naming `*.unit.test.js` (server, colocated) / `*.unit.test.{js,jsx}` (client)                                                     |
| PBT ya posicionado en CI docs    | `ci-cd-pipeline-empresarial.md` §36.3 item 14 → **STAGE 2 PRE-Build**, < 1–2 min, complemento de unit tests                                             |

### 5.2 Plan priorizado

| #   | Acción                                                                                                                                                                                                                                                                      | Prioridad |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 1   | **Reinstalar** `fast-check@4.x` + `@fast-check/vitest` como `devDependencies` en los workspaces que generen properties (server, y client si aplica)                                                                                                                         | P1        |
| 2   | **Setup**: `vitest.setup.js` con `fc.configureGlobal({ numRuns: process.env.CI ? 1000 : 100 })` + script `test:pbt` por workspace                                                                                                                                           | P1        |
| 3   | **Primeras propiedades**: server — Joi validators (§3.5.1) + lógica pura (sorting/dedupe/paginación, stock ≥ 0, asistencia idempotente); client — zod round-trip (§3.5.2)                                                                                                   | P1        |
| 4   | **Wire CI advisory**: job PBT en STAGE 2 PRE-Build (`if:` FASE 1 advisory, presupuesto < 1–2 min) — **sin duplicar ownership**: los test gates FASE 1 pertenecen a `ci-testing-gate-promotion` y el TIA changed-only a `tia-hardening`; este plan solo **añade** el job PBT | P2        |
| 5   | **Docs lockstep**: corregir `unit-tests-enterprise.md` §23.3 y `panorama-resumen.md` ("3.23.2 instalado" → estado real de reinstalación)                                                                                                                                    | P2        |

> **Nota de coordinación**: no duplicar ownership — FASE 1 de los test jobs es de
> `ci-testing-gate-promotion`; TIA/`test:changed` es de `tia-hardening`; el job PBT nuevo se
> encadena al agregador `prebuild-unit-tests-complete` existente sin mover los otros.

### 5.3 Receta mínima end-to-end (Vitest)

```ts
// apps/server/src/utils/money/money.unit.test.js  (receta — elegir patrón .unit.test.js)
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { addMoney, pctOf } from './money.js';

describe('money properties', () => {
  it('conmutatividad de la suma (minor units)', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 1_000_000n }),
        fc.bigInt({ min: 0n, max: 1_000_000n }),
        (a, b) => {
          expect(addMoney(a, b)).toBe(addMoney(b, a));
        }
      ),
      { numRuns: process.env.CI ? 1000 : 100 }
    );
  });
});
```

```bash
# package.json (por workspace)
"test:pbt": "vitest run \".unit.test.js\" --reporter=default"
```

---

## 6. Referencias y cross-links

### Documentación oficial fast-check

- Introducción a PBT con fast-check: <https://fast-check.dev/docs/introduction/>
- Core Blocks — Properties (`fc.property`, `fc.pre`, no mutar inputs):
  <https://fast-check.dev/docs/core-blocks/properties/>
- Core Blocks — Runners (`assert`, `check`, `sample`, `statistics`):
  <https://fast-check.dev/docs/core-blocks/runners/>
- Core Blocks — Arbitraries (4 familias): <https://fast-check.dev/docs/core-blocks/arbitraries/>
- Configuration — Global settings (`configureGlobal`, setupFile Vitest):
  <https://fast-check.dev/docs/configuration/global-settings/>
- Advanced — Model based testing (`fc.commands`, `modelRun`, `replayPath`):
  <https://fast-check.dev/docs/advanced/model-based-testing/>
- API — `Parameters<T>` (`numRuns`, `seed`, `path`, `endOnFailure`, `examples`):
  <https://fast-check.dev/docs/api/interfaces/Parameters/>
- Ecosistema (`@fast-check/vitest` ⭐, `zod-fast-check`, track record):
  <https://fast-check.dev/docs/ecosystem/>

### Origen y comparables

- Claessen & Hughes — _QuickCheck: A Lightweight Tool for Random Testing of Haskell Programs_
  (ICFP 2000): <https://www.cse.chalmers.se/~rjmh/Papers/quickfox.pdf>
- Hypothesis (Python, property-based + workspaces/health checks): <https://hypothesis.readthedocs.io/>
- jqwik (Java, PBT sobre JUnit): <https://jqwik.net/>
- proptest (Rust): <https://docs.rs/proptest> · prop (Ruby): <https://github.com/abnegate/prop>

### Documentación interna del proyecto

- [`docs/learning/unit-tests-enterprise.md`][ute] (§23.3 — gap P2 "Property-based con
  fast-check"; **corregir** afirmación "3.23.2 instalado")
- [`docs/ci-cd-pipeline-empresarial.md`][emp] ("Property-Based Testing (fast-check) — invariantes,
  parsers, lógica **[SL]**", §36.3 item 14 — STAGE 2 PRE-Build, < 1–2 min)
- [`docs/learning/test-impact-analysis.md`][tia] (TIA changed-only — PBT viaja con
  `test:changed`)
- [`docs/learning/quality-gates.md`][qg] (FASE 1 advisory vs FASE 2 blocking)
- [`docs/learning/snapshot-testing.md`][snap] (otro estilo de test no-example-based)
- [`docs/learning/test-sharding.md`][shard] (reparto de properties entre shards)
- [`docs/learning/panorama-resumen.md`][pan] (§"fast-check 3.23.2 instalado, 0 usos" — **corregir**)

[ute]: unit-tests-enterprise.md
[emp]: ../ci-cd-pipeline-empresarial.md
[tia]: test-impact-analysis.md
[qg]: quality-gates.md
[snap]: snapshot-testing.md
[shard]: test-sharding.md
[pan]: panorama-resumen.md
[cov]: coverage-tripwire-floor-ratchet.md
[sto]: smart-test-ordering.md
[quickcheck-paper]: https://www.cse.chalmers.se/~rjmh/Papers/quickfox.pdf
[fc-intro]: https://fast-check.dev/docs/introduction/
[fc-properties]: https://fast-check.dev/docs/core-blocks/properties/
[fc-runners]: https://fast-check.dev/docs/core-blocks/runners/
[fc-arbitraries]: https://fast-check.dev/docs/core-blocks/arbitraries/
[fc-plugins]: https://fast-check.dev/docs/core-blocks/plugins/
[fc-global]: https://fast-check.dev/docs/configuration/global-settings/
[fc-model]: https://fast-check.dev/docs/advanced/model-based-testing/
[fc-ecosystem]: https://fast-check.dev/docs/ecosystem/
[fc-trackrecord]: https://fast-check.dev/docs/introduction/track-record/
