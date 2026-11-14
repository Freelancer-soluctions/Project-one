# Stage Quality (Grupo A): shift-left y gates enterprise

Nov 10, 2026 · @Johan

## Resumen

El stage Quality debe dar feedback en segundos en la máquina del autor y bloquear en CI solo lo que es determinista; lo subjetivo o ruidoso corre como advisory hasta calibrarse.

Este documento analiza el Grupo A (código fuente): lint, formato, tipos, compilación multilenguaje, complejidad, dead code, import boundaries, root manifest guard, review automatizado y validación de docs. Para cada job define qué corre en local (shift-left), qué espeja CI, qué tipo de gate lo cubre y cómo se adopta sin frenar el trabajo.

La regla de fondo: lo local es feedback y CI es enforcement. Un hook se salta con `--no-verify`, así que todo control local tiene un espejo en CI, y el ruleset exige solo un check agregador. El comportamiento de ESLint, dependency-cruiser, knip y SonarQube sale de su documentación; los umbrales y las fases son propuestas por calibrar con tu código real.

## Shift-left por capas

Cuanto más a la izquierda, más rápido el feedback y más fácil de saltar; el enforcement real está en el PR.

&#91;embedded content: capas de shift-left · 6 capas, 1 de enforcement principal\]

Editor, pre-commit y pre-push ahorran tiempo pero se saltan con `--no-verify`; el PR y la merge queue son las capas que bloquean, y lo programado solo reporta.

## Matriz por job

Cada job tiene una capa local, un espejo en CI y un tipo de gate; solo dos quedan en advisory de forma permanente.

| Job                         | Herramienta                       | Local                         | CI                                   | Tipo de gate                             | Adopción                                   |
| --------------------------- | --------------------------------- | ----------------------------- | ------------------------------------ | ---------------------------------------- | ------------------------------------------ |
| Lint                        | ESLint                            | Archivos staged en pre-commit | Repo completo, `--max-warnings 0`    | Código de salida, bloqueante             | Bloqueante; con deuda previa, ratchet      |
| Formato                     | Prettier                          | Auto-fix en pre-commit        | `--check`, solo lectura              | Código de salida, bloqueante             | Bloqueante                                 |
| Tipos                       | `tsc` estricto                    | Pre-push                      | `tsc --noEmit` incremental           | Código de salida, bloqueante             | Bloqueante                                 |
| Compile-check multilenguaje | `go vet`, `cargo check`           | Opcional                      | Solo si el repo tiene esos lenguajes | Bloqueante donde aplica                  | Omitir si no aplica                        |
| Complejidad                 | Reglas de ESLint                  | Editor                        | Lint con umbrales                    | Umbral sobre código nuevo más ratchet    | Advisory, luego bloqueante en código nuevo |
| Dead code                   | knip                              | No                            | PR                                   | Ratchet                                  | Advisory                                   |
| Import boundaries           | dependency-cruiser                | Pre-push                      | PR, con baseline                     | Regla determinista                       | Bloqueante con baseline                    |
| Root manifest guard         | Script propio                     | No                            | PR                                   | Allowlist versionada                     | Bloqueante                                 |
| PR review automation        | SonarQube, DeepSource, CodeRabbit | No                            | Asíncrono                            | Quality Gate de Sonar sobre código nuevo | Bloquea solo Sonar                         |
| Docs y CHANGELOG            | markdownlint, vale                | Staged en pre-commit          | PR                                   | markdownlint bloqueante, vale warning    | Mixto                                      |

## Detalle por job

Cada herramienta tiene una trampa conocida que convierte un gate en ruido o lo deja sin efecto; esto es lo que hay que configurar y vigilar.

### Lint (ESLint)

- `--max-warnings` vale -1 por defecto, o sea desactivado. Con `--max-warnings 0` un warning hace fallar el job. ESLint sale con 1 si hay errores o se excede el límite, y con 2 si la configuración o la herramienta fallan; ese 2 conviene tratarlo como error de herramienta.
- `--report-unused-disable-directives` está en `warn` por defecto (`linterOptions.reportUnusedDisableDirectives`). En CI se sube a error, con una salvedad documentada: tras actualizar ESLint o una regla pueden aparecer fallos nuevos, porque una supresión de un falso positivo corregido queda sin uso. Por eso las versiones van fijadas.
- `--cache` guarda `.eslintcache`. La estrategia por defecto (`metadata`) se basa en fechas de modificación, que cambian en cada `git clone`; `--cache-strategy content` evita ese problema en CI. La caché se guarda con `actions/cache` usando como clave el lockfile y el hash de los fuentes.
- Con lint-staged y `--max-warnings 0`, los archivos ignorados que llegan como argumento generan un warning y rompen el hook; `--no-warn-ignored` (configuración flat) lo evita.
- Las anotaciones en el PR (SARIF) exigen `security-events: write` y code scanning activo. El paso que sube el SARIF no debe llevar `continue-on-error` si es el único lint del job.

### Formato (Prettier)

- En CI solo `--check`: no escribe nada. Un bot que empuja commits de formato invalida las firmas y el DCO del PR.
- Va en un paso separado del lint para que un fallo diga de inmediato si es de estilo o de reglas.
- En local, auto-fix al hacer commit sobre archivos staged. La versión de Prettier se fija, porque una actualización reformatea el repo.

### Tipos (TypeScript)

- `strict` activado en todos los proyectos del repo (cliente, servidor, compartido); el job comprueba cada uno.
- `incremental` con `tsBuildInfoFile` en una ruta cacheada acelera la segunda corrida. En la prueba con TypeScript 6.0.3, \`tsc --noEmit --incremental --tsBuildInfoFile\` escribió el archivo \`.tsbuildinfo\`, de modo que la ruta se puede cachear en CI.
- Prohibir `@ts-ignore`; permitir `@ts-expect-error` solo con descripción. Una supresión sin explicación es deuda invisible.

### Compile-check multilenguaje

- `go vet` y `cargo check` solo tienen sentido si el repo contiene esos lenguajes. En un monorepo TypeScript el job queda vacío y se omite.

### Complejidad

- Reglas de ESLint como `complexity`, `max-depth` y `max-lines-per-function`. Tu lista cita `max-lines-per-rule`; no encontré una regla con ese nombre y probablemente es `max-lines-per-function`; verifícalo.
- Los umbrales no tienen un valor estándar: se fijan con una corrida advisory sobre tu código (D3).
- Se bloquea código nuevo o modificado y el legado entra por ratchet (ver Estrategias).

### Dead code (knip)

- La fuente de falsos positivos es la configuración: la documentación de knip dice que se atiendan primero los _configuration hints_, porque ignorarlos deja la imagen del proyecto incompleta y marca código usado como no usado.
- El modo producción analiza solo código de producción y `dependencies`, y excluye tests y `devDependencies`; es la forma recomendada de dejar fuera el código de pruebas, en lugar de usar `ignore` o `project`. El modo por defecto encuentra más problemas de herramientas.
- Los patrones `ignore` no sacan archivos del análisis, solo ocultan los reportes, y crean puntos ciegos. Para exports usados solo dentro de su propio archivo existe `ignoreExportsUsedInFile`.
- Propuesta: modo producción en el PR como advisory y modo por defecto en el job programado. Las páginas de knip sobre uso en CI y adopción gradual no se pudieron revisar.

### Import boundaries (dependency-cruiser)

- Se ejecuta como `depcruise src --config .dependency-cruiser.js`; el exit code es 1 cuando hay violaciones y 2 si los argumentos o la configuración son inválidos.
- Para adoptarlo con violaciones existentes: `depcruise-baseline src --output-to .known-violations.json` genera la línea base y `--ignore-known` la respeta. Así el job bloquea solo violaciones nuevas.
- Reglas candidatas (propuesta): el cliente no importa del servidor; el código compartido no depende de cliente ni servidor; sin dependencias circulares.
- El archivo de baseline lo revisa CODEOWNERS: si cualquiera lo regenera, el gate se apaga editando un JSON.

### Root manifest guard

- Un script verifica que las dependencias del `package.json` raíz sean un subconjunto de las directas más una allowlist versionada. Es una regla de tu monorepo; no existe una herramienta estándar equivalente.
- Falla listando cada dependencia que sobra y cada una que falta, para que el autor sepa qué corregir.

### PR review automation

- SonarQube: el Quality Gate por defecto (_Sonar way_) exige, sobre código nuevo, ningún issue nuevo, todos los Security Hotspots revisados, cobertura de al menos 80,0% y duplicación de como máximo 3,0%. La cobertura se solapa con el stage de testing; conviene que la condición viva en un solo lugar.
- Revisores con IA (CodeRabbit, DeepSource) producen salida no determinista; lo habitual es dejarlos como comentarios sin check requerido (práctica general, no una fuente concreta).
- En PRs de forks los secretos no están disponibles: el análisis de Sonar necesita un token, así que hay que decidir qué pasa con esos PRs (D2).

### Docs y CHANGELOG

- markdownlint es determinista y se bloquea. vale juzga estilo y se deja como warning.
- La validación de CHANGELOG solo aplica si una herramienta de release lo genera o lo exige.
- La verificación de enlaces externos corre programada: falla por razones ajenas al PR.

## Estrategias enterprise

Siete prácticas hacen viable bloquear sin que el equipo desactive el gate.

1. **Advisory y luego bloqueante.** Cada gate nuevo corre de 2 a 4 semanas sin bloquear, se calibra y después se exige.
2. **Ratchet.** Se congela la deuda actual y solo se prohíbe empeorar. En dependency-cruiser es el baseline con `--ignore-known`; para complejidad y warnings de lint, un contador que solo puede bajar. ESLint también ofrece supresiones en bloque en versiones recientes. La documentación las describe y en la prueba con ESLint 10.14 funcionaron (\`--suppress-rule\`, \`--prune-suppressions\`), con dos condiciones: solo cubren reglas en nivel \`error\` y llevan un contador por archivo y regla.
3. **Código nuevo, no código total.** El Quality Gate de Sonar evalúa las condiciones sobre código nuevo; el mismo principio sirve para complejidad y duplicación.
4. **Solo lo afectado.** En monorepos se detectan los paquetes cambiados (por ejemplo con `dorny/paths-filter`) y se corre el job solo ahí. Los filtros deben incluir los archivos de configuración de la raíz; si no, un cambio en la configuración del linter puede saltarse el lint.
5. **Cachés.** `.eslintcache` con clave de lockfile y fuentes, `.tsbuildinfo` de TypeScript y caché de dependencias bajan el tiempo del job, que es lo que hace aceptable bloquear.
6. **Supresiones con costo.** Reportar directivas sin uso, exigir justificación en cada `eslint-disable` y poner la configuración del linter, los baselines y las allowlists bajo CODEOWNERS.
7. **Versiones fijadas.** ESLint, Prettier, TypeScript y las actions por SHA, para que una actualización no ponga `main` en rojo sin tocar código.

## Gates de estructura

El gate real es el agregador: si cuenta un job saltado como éxito, ningún control individual protege nada.

1. **Un solo check requerido.** El ruleset exige `quality-complete`; los nombres de los jobs individuales pueden cambiar sin bloquear merges.
2. **Agregador estricto.** Con `if: always()`, falla si algún job obligatorio terminó en algo distinto de `success`: `failure`, `cancelled` o `skipped` sin autorización.
3. **Lo caro espera.** Tests, build e imagen declaran `needs: [quality-complete]`.
4. **Hermanos sin cancelar.** Lint, formato y tipos corren en paralelo y todos reportan, para ver todos los fallos a la vez; la concurrencia por PR solo cancela corridas viejas del mismo PR.
5. **Merge queue.** Los workflows incluyen el trigger `merge_group` para revalidar contra la base actualizada.
6. **Configuración protegida.** CODEOWNERS sobre `.github/workflows/`, la configuración de ESLint, los baselines y las allowlists.

El agregador, con la salida de `needs` pasada por una variable de entorno y no interpolada en el script:

```yaml
quality-complete:
  if: always()
  needs: [lint, format, types, boundaries, manifest-guard, docs]
  runs-on: ubuntu-latest
  env:
    NEEDS: ${{ toJSON(needs) }}
  steps:
    - run: echo "$NEEDS" | jq -e 'all(.[]; .result == "success")'
```

Si un job puede saltarse de forma legítima (un PR solo de docs), el salto lo autoriza la salida de un job de detección de cambios, no un `skipped` implícito.

## Configuración de referencia

Los mismos comandos corren en el hook, en el script de npm y en CI; solo cambia qué archivos reciben.

Las banderas de ESLint, knip, dependency-cruiser y lint-staged de esta sección están tomadas de su documentación. Dos avisos antes de copiarlas: la página de ESLint v9 indica que esa rama llegó a fin de vida el 2026-08-06, así que confirma qué versión soportada usas; y la página de `tsBuildInfoFile` no menciona `noEmit`, por lo que `tsc --noEmit --incremental` se comprobó con una corrida real: genera el archivo `.tsbuildinfo` en TypeScript 6.0.3; restaurarlo desde la caché de CI sigue sin probarse.

**Scripts de npm** (un solo lugar para las banderas; hook y CI los llaman):

```json
{
  "scripts": {
    "lint": "eslint . --max-warnings 0 --cache --cache-location .cache/eslint/ --cache-strategy content",
    "format:check": "prettier --check .",
    "typecheck": "tsc --noEmit --incremental --tsBuildInfoFile .cache/tsc/app.tsbuildinfo",
    "deps:boundaries": "depcruise src --config .dependency-cruiser.js --ignore-known .known-violations.json",
    "deadcode": "knip --production --cache",
    "docs:lint": "markdownlint-cli2 \"**/*.md\""
  }
}
```

- `--cache-location` apunta a un directorio con `/` final: sin la barra, ESLint lo trata como archivo si el directorio aún no existe.
- `--cache-strategy content` evita que el cambio de fechas tras un `git clone` invalide la caché.
- La directiva de supresiones sin uso se sube a error en la configuración, no en la línea de comandos: `linterOptions: { reportUnusedDisableDirectives: 'error' }`. La documentación indica que no se puede combinar `--report-unused-disable-directives` con su variante de severidad.
- `deadcode` queda sin gate en la Fase 1: se ejecuta con `--no-exit-code` hasta que se decida su nivel (D5).

**lint-staged** (hook `pre-commit`; el hook de Husky solo ejecuta `npx lint-staged`):

```json
{
  "*.{ts,tsx,js,jsx}": [
    "eslint --fix --no-warn-ignored --max-warnings 0",
    "prettier --write"
  ],
  "*.{json,yml,yaml}": "prettier --write",
  "*.md": ["prettier --write", "markdownlint-cli2"]
}
```

- Un arreglo de comandos se ejecuta en orden. lint-staged vuelve a añadir al commit lo que modifican las tareas, así que la configuración no lleva `git add`: si lo encuentra, avisa por consola.
- `--no-warn-ignored` evita que los archivos ignorados que llegan como argumento generen un warning y, con `--max-warnings 0`, rompan el commit.

**Hook `pre-push`:** `npm run typecheck && npm run deps:boundaries`.

**Job de CI** (el de lint; los de formato, tipos, boundaries, manifest guard y docs siguen el mismo esqueleto con su script):

```yaml
lint:
  runs-on: ubuntu-latest
  timeout-minutes: 10
  permissions:
    contents: read
  steps:
    - uses: actions/checkout@<sha-fijado>
    - uses: actions/setup-node@<sha-fijado>
      with:
        node-version-file: .nvmrc
        cache: npm
    - run: npm ci --ignore-scripts
    - uses: actions/cache@<sha-fijado>
      with:
        path: .cache/eslint
        key: eslint-${{ hashFiles('package-lock.json') }}-${{ github.sha }}
        restore-keys: eslint-${{ hashFiles('package-lock.json') }}-
    - run: npm run lint
```

El job no lleva `continue-on-error`. Con `--cache-strategy content`, restaurar una caché antigua es seguro: ESLint vuelve a analizar los archivos cuyo contenido cambió.

## Ratchet y adopción gradual

Cada herramienta trae su propio mecanismo para bloquear solo lo nuevo; ninguno funciona sin un ciclo de mantenimiento.

| Herramienta        | Mecanismo (de su documentación)                                                                                                                                       | Mantenimiento                                                                                                                                                         | Trampa                                                                                                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ESLint             | Supresiones en bloque: `eslint --fix --suppress-all` o `--suppress-rule <regla>`; genera `eslint-suppressions.json` en la raíz, que se versiona                       | Al corregir violaciones, ESLint sale con código distinto de cero hasta ejecutar `--prune-suppressions`; `--pass-on-unpruned-suppressions` lo tolera de forma temporal | Solo suprime reglas en `error`, no en `warn`. `--suppressions-location` debe ser igual en cada corrida. La página no explica cómo se tratan violaciones nuevas dentro de código ya suprimido: se prueba antes de confiar |
| dependency-cruiser | `depcruise-baseline src --output-to .known-violations.json` y `--ignore-known .known-violations.json`                                                                 | Regenerar el archivo solo en un PR dedicado                                                                                                                           | Quien regenera el baseline apaga el gate; va bajo CODEOWNERS                                                                                                                                                             |
| knip               | Severidad por tipo de hallazgo en `rules` (`warn`, `error`, `off`); `--max-issues N`; filtros `--files`, `--dependencies`, `--exports`; `--workspace`; `--production` | Pasar cada tipo a `error` cuando llegue a cero                                                                                                                        | Los hallazgos en `warn` se imprimen pero no hacen fallar la corrida                                                                                                                                                      |
| ESLint (contador)  | `--max-warnings N` con N igual a los warnings actuales                                                                                                                | Bajar N en cada PR de limpieza                                                                                                                                        | Cuenta total, no distingue viejo de nuevo: arreglar un warning y añadir otro pasa                                                                                                                                        |

Ciclo de vida de un ratchet, igual para todas:

1. **Congelar.** Un PR dedicado genera el baseline o las supresiones y lo revisa CODEOWNERS.
2. **Bloquear lo nuevo.** Desde ese merge, el gate falla ante cualquier hallazgo que no esté en el baseline.
3. **Reducir.** Cada PR de limpieza corrige hallazgos y poda el baseline; el tamaño del archivo es una métrica.
4. **Revisar.** Una revisión periódica comprueba que el baseline solo ha bajado.

**Orden para knip**, según su guía de adopción gradual: primero los _configuration hints_, después los archivos de entrada y los plugins, y entonces los hallazgos, empezando por los archivos sin uso, porque ocultan sus exports y dependencias. Se avanza un tipo por vez (`--files`, `--dependencies`, `--exports`) y cada uno pasa a `error` al llegar a cero. Las supresiones puntuales usan etiquetas JSDoc como `@lintignore` o `@internal`, `ignoreExportsUsedInFile` e `ignoreDependencies`.

Para CI, knip termina con código 1 si encuentra hallazgos; `--no-exit-code` lo deja solo como reporte y `--treat-config-hints-as-errors` hace fallar las sugerencias de configuración. Su guía propone correrlo dos veces, en modo por defecto y en modo producción, y cachea en `./node_modules/.cache/knip` con `--cache`.

## Excepciones y supresiones

Toda excepción lleva motivo, responsable y caducidad; sin eso, el gate se apaga una línea a la vez.

Los plazos y la frecuencia de revisión son propuestas por calibrar.

| Tipo de excepción                                                | Dónde vive                   | Qué se exige                                                                                                             | Caducidad (propuesta)                                                |
| ---------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| Directiva `eslint-disable` en una línea                          | El código                    | Descripción tras `--` y, si es deuda, enlace a un issue; las directivas sin uso fallan (`reportUnusedDisableDirectives`) | Hasta que el código cambie; la directiva sin uso la detecta el lint  |
| Entrada en `eslint-suppressions.json` o `.known-violations.json` | Archivo versionado           | Solo se crea en el PR de congelado; luego solo se poda                                                                   | Se reduce a cero con el tiempo; revisión periódica                   |
| Entrada en la allowlist del manifest guard                       | Archivo versionado           | Motivo, responsable y issue                                                                                              | Revisión trimestral                                                  |
| `@ts-expect-error`                                               | El código                    | Descripción obligatoria                                                                                                  | Falla cuando el error desaparece: el compilador avisa                |
| Supresión de un falso positivo de knip                           | `knip.json` o etiqueta JSDoc | Motivo en el PR                                                                                                          | Revisión con cada cambio de herramienta                              |
| Bypass del ruleset                                               | Configuración del repo       | Lista vacía, o solo tu cuenta con el riesgo documentado                                                                  | Cada uso se revisa en el registro de auditoría, si tu plan lo ofrece |

Requisitos:

1. **EX-1.** Los archivos de supresiones, baselines y allowlists están bajo CODEOWNERS, igual que la configuración del linter y los workflows.
2. **EX-2.** Una excepción nueva entra en un PR que no mezcla otros cambios, para que la revisión la vea sola. La exigencia de descripción en `eslint-disable` puede imponerla un plugin de comentarios de ESLint; confirma cuál y su regla antes de adoptarlo.
3. **EX-3.** Un registro único (por ejemplo `docs/learning/quality-exceptions.md`) lista las excepciones vigentes con motivo y responsable.
4. **EX-4.** Con un solo mantenedor, nadie más aprueba las excepciones; el riesgo se acepta de forma explícita o se añade una segunda cuenta que revise (D7).

## Gobernanza y propiedad

Cada gate tiene un dueño, una regla de cambio y un registro de en qué fase está; sin eso nadie sabe quién puede apagarlo ni cuándo se volvió bloqueante.

Con un solo mantenedor los roles recaen en la misma persona, pero se definen igual: así añadir a alguien no obliga a rediseñar nada. Los controles de esta sección y de la siguiente forman parte de la Fase 0 del plan.

| Área                                        | Responsable         | Aprueba cambios                        | Se versiona en                                                                     |
| ------------------------------------------- | ------------------- | -------------------------------------- | ---------------------------------------------------------------------------------- |
| Reglas de lint, tipos y complejidad         | Dueño de calidad    | CODEOWNERS de plataforma               | `eslint.config.*`, `tsconfig*.json`                                                |
| Baselines, supresiones y allowlists         | Dueño de calidad    | CODEOWNERS de plataforma, en PR aparte | `eslint-suppressions.json`, `.known-violations.json`, allowlist del manifest guard |
| Workflows y ruleset                         | Dueño de plataforma | CODEOWNERS de plataforma               | `.github/workflows/`                                                               |
| Versiones de herramientas                   | Dueño de calidad    | Revisión del PR de actualización       | `package.json`, lockfile, pins de actions                                          |
| Estado de cada gate (advisory o bloqueante) | Dueño de calidad    | CODEOWNERS de plataforma               | `docs/learning/quality-policy.md`                                                  |

**CODEOWNERS.** El archivo vive en `.github/`, en la raíz o en `docs/`; GitHub usa el primero que encuentra. Las líneas son patrones al estilo gitignore seguidos de propietarios, y **gana el último patrón que coincide**, así que el patrón general va primero. Un propietario debe tener acceso de escritura explícito; si el usuario o el equipo no existe o no tiene acceso, no se asigna nadie. Basta la aprobación de uno de los propietarios listados. En repos privados la función requiere un plan de pago (Pro, Team o Enterprise). Para protegerlo, `/.github/` tiene propietario, de modo que cambiar el propio CODEOWNERS exige revisión.

```text
# El último patrón que coincide gana
*                           @owner-general
/.github/                   @owner-plataforma
/eslint.config.*            @owner-plataforma
/.dependency-cruiser.*      @owner-plataforma
/.known-violations.json     @owner-plataforma
/eslint-suppressions.json   @owner-plataforma
/knip.json                  @owner-plataforma
/scripts/ci/                @owner-plataforma
```

**Ruleset de `main`.** Exige un único check, `quality-complete`; PR obligatorio; revisión de code owners; descartar aprobaciones obsoletas; merge queue; sin force push. Tres comportamientos documentados por GitHub condicionan el diseño: un workflow omitido por filtro de rutas, de ramas o por mensaje de commit deja su check en _Pending_ y bloquea el merge; un job omitido por una condición `if` reporta _Success_ y satisface el requisito; y un job que depende de otro que falló se omite y puede no bloquear, por lo que los checks requeridos con `needs` usan `always()`. Para merge queue los workflows necesitan el trigger `merge_group`.

**Política de actualización de herramientas.**

1. Dependabot o Renovate proponen las actualizaciones de ESLint, Prettier, TypeScript, knip, dependency-cruiser y de los pins de actions por SHA, agrupadas en un PR de herramientas.
2. Una actualización de herramienta nunca viaja en el mismo PR que código de producto.
3. Una versión mayor se prueba primero en un job advisory paralelo antes de reemplazar a la anterior.
4. Si la actualización cambia los hallazgos, se regenera el baseline en ese mismo PR de herramientas y lo revisa CODEOWNERS.

**Registro de políticas.** `docs/learning/quality-policy.md` lista cada gate con su estado, la fecha en que pasó a bloqueante, su dueño y su umbral. Esa fecha es la evidencia de desde cuándo el control es obligatorio.

## Seguridad del propio stage Quality

El stage ejecuta código de terceros y de PRs, así que se endurece como cualquier otro flujo con acceso al repo.

| Control                                | Requisito                                                                                                                                   | Qué evita                                                    |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Permisos mínimos                       | `permissions: {}` a nivel de workflow y `contents: read` por job; solo el job que sube SARIF lleva `security-events: write`                 | Que un token filtrado pueda escribir                         |
| Credenciales                           | `persist-credentials: false` en `actions/checkout` si ningún paso posterior empuja o crea tags                                              | Que el token quede en disco (regla `artipacked` de zizmor)   |
| Actions fijadas por SHA                | Todas las actions por SHA completo, con Dependabot o Renovate para proponer las actualizaciones                                             | Que un tag mutable de un tercero cambie bajo tus pies        |
| Sin inyección de plantillas            | Ningún `${{ }}` dentro de `run:`; los valores pasan por variables de entorno                                                                | Que un título de PR o rama se ejecute como shell             |
| Triggers seguros                       | Los jobs de calidad corren en `pull_request`: en forks usa token de solo lectura y sin secretos                                             | Que código del fork acceda a secretos                        |
| Sin ejecutar código de PR con secretos | Con `pull_request_target`, nunca hacer checkout de la cabeza del PR ni compilar o probar lo descargado; el código se inspecciona como datos | El ataque _pwn request_                                      |
| Instalación sin scripts                | `npm ci --ignore-scripts` en los jobs de lint                                                                                               | Que scripts de ciclo de vida de una dependencia corran en CI |
| Tiempo acotado                         | `timeout-minutes` en cada job                                                                                                               | Jobs colgados y minutos consumidos                           |
| Acciones permitidas                    | Restringir en la configuración del repo qué actions de terceros pueden ejecutarse                                                           | Que se añada una action no revisada                          |

Detalles:

1. **Análisis de los workflows.** zizmor audita los propios workflows. La configuración que documenta Packagist: se ejecuta en pushes a `main` y en PRs que cambien archivos de `.github/`, con `contents: read`, checkout y action de zizmor fijados por SHA, `persist-credentials: false`, el job falla ante cualquier hallazgo, con anotaciones y perfil _pedantic_. Sus reglas incluyen `unpinned-uses`, `template-injection`, `excessive-permissions`, `artipacked` y `dangerous-triggers`. No se suprimen hallazgos en bloque: se corrige cada uno o se documenta el riesgo aceptado con un comentario acotado.
2. **Scripts postinstall y Prisma.** Si el chequeo de tipos del servidor depende del cliente generado de Prisma, `--ignore-scripts` obliga a un paso explícito de generación en ese job; es preferible a dejar correr todos los scripts de instalación.
3. **Sonar y forks.** Un PR de fork no recibe secretos, por lo que el análisis de Sonar no puede autenticarse. La documentación de GitHub recomienda separar el flujo que trata código no confiable del que usa secretos, y rechaza ejecutar el código del PR con `pull_request_target`. La decisión de qué hacer con esos PRs es D2.
4. **Política de eventos de GitHub.** La documentación indica que `pull_request_target` quedará bloqueado por defecto en repos públicos sin política de eventos, con aplicación programada para el 2026-12-02; no afecta a repos privados o internos.
5. **Cachés.** Los jobs de calidad no usan secretos, y las cachés se alimentan desde eventos de confianza (`push` a `main`) siempre que se pueda.

## Monorepo y multilenguaje

En un monorepo cada paquete corre sus propios jobs y solo lo afectado se ejecuta, pero la detección de lo afectado se rompe si el checkout es superficial.

Tu repo tiene, por la plantilla de PR, cliente (React y Vite), servidor (Express y Prisma), E2E (Playwright) y configuración compartida; el diseño parte de ahí.

1. **Un job por área.** `lint`, `types` y `format` se ejecutan por workspace (cliente, servidor, compartido); el agregador `quality-complete` espera a todos. Un `matrix` genera un check por entrada: el agregador los cubre con `needs` y el ruleset sigue exigiendo solo `quality-complete`.
2. **Lo afectado.** Turborepo ofrece `--affected` (por ejemplo `turbo run lint typecheck --affected`); en GitHub Actions compara la base y la cabeza del PR. Necesita historial: con un checkout superficial, la propia documentación advierte que todos los paquetes se consideran cambiados. Se usa `fetch-depth: 0` con `filter: blob:none`. `turbo query affected --exit-code` devuelve 1 si hay paquetes afectados, 0 si no y 2 si hay error, y sirve para saltar la instalación de dependencias cuando no cambia nada.
3. **Trampas de la caché de Turborepo.** Que pase en un fallo de caché y falle en un acierto suele indicar una clave `outputs` mal configurada; si faltan `env` o `globalEnv`, tareas de entornos distintos comparten caché; y la versión de `turbo` se fija (`TURBO_VERSION`) si se instala global antes de las dependencias.
4. **Filtros de rutas y checks requeridos.** Un filtro de rutas a nivel de workflow deja el check requerido en _Pending_ y bloquea el merge. La detección de cambios va dentro del workflow, como un job que publica qué cambió, y el agregador acepta `skipped` solo cuando esa salida lo autoriza (RD-3).
5. **Archivos de la raíz.** Un cambio en la configuración de ESLint, TypeScript, Prettier o en el lockfile fuerza todos los jobs, no solo los del paquete tocado.
6. **TypeScript por proyecto.** Cada workspace tiene su `tsconfig`; con referencias de proyecto, la documentación de `tsBuildInfoFile` ata ese archivo a los proyectos compuestos, de modo que el comportamiento con `--noEmit` se prueba con una corrida real.

Equivalentes por lenguaje, solo si el repo los llega a tener:

| Lenguaje   | Lint                | Formato               | Tipos o compilación |
| ---------- | ------------------- | --------------------- | ------------------- |
| TypeScript | ESLint              | Prettier `--check`    | `tsc --noEmit`      |
| Python     | Ruff (`ruff check`) | `ruff format --check` | mypy o pyright      |
| Go         | golangci-lint       | `gofmt`               | `go vet`            |
| Rust       | clippy              | `cargo fmt --check`   | `cargo check`       |

De esta tabla, la pareja `ruff check` y `ruff format --check` aparece en las fuentes consultadas; el resto son los equivalentes habituales y no se verificaron en esta sesión.

## Observabilidad y SLOs del stage

Se mide la duración en percentiles, las fallas por causa y el tiempo de recuperación de `main`; los promedios esconden las corridas lentas.

Las métricas y los umbrales de alerta de la tabla salen de una guía de observabilidad de pipelines; los umbrales están pensados para equipos con varias personas, así que para un solo mantenedor se revisan cada semana en lugar de alertar.

| Métrica                                | Qué mide                                                    | Umbral de ejemplo de la fuente                                                 |
| -------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Duración por percentil (p50, p95, p99) | Tiempo total y por fase: checkout, instalación, lint, tipos | Alerta si el p95 es al menos 1,5 veces el de la semana anterior durante 1 hora |
| Tiempo de cola                         | Espera hasta que un runner toma el job                      | Crítica si el p95 supera 300 s durante 15 minutos                              |
| Tasa de fallo, por causa               | Prueba, infraestructura, configuración o flaky              | Aviso si `main` supera el 30% de fallos durante 30 minutos                     |
| Rojos sin cambios de código            | Fallos que desaparecen al repetir                           | Meta propia: 0                                                                 |
| MTTR de `main`                         | Tiempo desde un fallo hasta la siguiente corrida verde      | Meta propia por definir (D8)                                                   |

Métricas propias del stage:

- Estado de cada gate (advisory o bloqueante) y días desde el último cambio.
- Tamaño de baselines y supresiones: solo debe bajar.
- Excepciones vigentes y vencidas.
- Aciertos de caché (`cache-hit` de `actions/cache`) por job.
- Hallazgos por herramienta y por tipo de regla, para ver qué gate produce ruido.

**Cómo recogerlas.** La guía propone dos patrones: un paso final con `if: always()` que envía un span OTLP con el estado del job, o un pequeño servicio que recibe los webhooks de fin de corrida y escribe en Prometheus. Para un repo pequeño basta con un informe semanal generado con la CLI de GitHub (`gh run list` con salida JSON) y publicado en el resumen del job; la elección es D8. Los hallazgos de ESLint se publican como anotaciones en el PR vía SARIF, con `security-events: write` y code scanning activo, y el Step Summary lista lo que falló.

**Costo en minutos de CI.** Palancas, de más a menos efecto: caché de dependencias y de herramientas, ejecutar solo lo afectado, cancelar corridas viejas del mismo PR con `concurrency`, `timeout-minutes` en cada job y no repetir jobs que ya corrieron en el hook local de forma redundante. Cada palanca se evalúa contra su efecto en la seguridad: ninguna debe saltarse el agregador.

## Runbook de operación

En cada situación hay una acción inmediata que restablece `main` y otra de fondo que evita la repetición; nunca se apaga un gate para salir del paso.

| Situación                                        | Acción inmediata                                                                                              | Acción de fondo                                                        |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `main` en rojo                                   | Revertir el commit culpable y arreglar en una rama aparte, salvo arreglo trivial                              | Revisar por qué el PR pasó: ¿merge queue? ¿check requerido incorrecto? |
| Una herramienta se rompe tras actualizar         | Revertir el PR de herramientas; las versiones fijadas limitan el daño                                         | Probar la versión nueva en un job advisory antes de reemplazar         |
| Falso positivo bloqueante                        | Excepción puntual en un PR aparte (EX-2) con motivo y responsable                                             | Si es sistémico, bajar la regla a warning con fecha de vuelta          |
| Hace falta volver a advisory                     | PR que restaura `continue-on-error` en ese job, con fecha límite, revisado por CODEOWNERS                     | Registrar el motivo y la fecha en `quality-policy.md`                  |
| Supresiones sin podar tras una limpieza          | Ejecutar `eslint --prune-suppressions` en el mismo PR; mientras tanto ESLint sale con código distinto de cero | Hacer de la poda un paso del PR de limpieza                            |
| Caché de ESLint sospechosa                       | Ejecutar sin `--cache`: ESLint borra el `.eslintcache` existente                                              | Subir el prefijo de la clave de caché en el workflow                   |
| Check requerido en _Pending_                     | Quitar el filtro de rutas, de ramas o de mensaje del workflow requerido                                       | Mover la detección de cambios dentro del workflow                      |
| Mensaje "was not set by the expected GitHub App" | Comprobar qué app publicó el check                                                                            | Fijar la fuente esperada en el ruleset                                 |
| Fallo de infraestructura (runner o red)          | Repetir la corrida solo si el fallo es de infraestructura                                                     | Registrarlo como causa _infra_ en las métricas                         |
| Fallo determinista                               | No repetir: corregir el código o la regla                                                                     | Una repetición que pasa indica un check no determinista                |

Reglas del runbook:

1. **Revertir primero.** Un `main` en rojo bloquea a todos los PRs siguientes; restablecerlo va antes que diagnosticar.
2. **Ningún gate se apaga con un interruptor.** Una variable que cambie un gate de bloqueante a advisory sin revisión es un bypass; la vuelta a advisory es un PR revisado y con fecha.
3. **Todo incidente deja una línea.** En `quality-policy.md` queda qué ocurrió, qué se cambió y quién lo aprobó.
4. **Con un solo mantenedor no hay segunda persona de guardia.** El runbook se escribe para quien lo lee por la noche con prisa: comandos exactos, sin interpretación.

## Cumplimiento y evidencia

Un PR aprobado demuestra que hubo una revisión, no que la rama la exigiera; la evidencia útil es la configuración de enforcement y el historial de qué checks corrieron sobre qué commit.

Esta sección sigue la guía de evidencia de cambios en GitHub que lista lo que suelen pedir los auditores (por ejemplo, para el control de gestión de cambios de SOC 2). No sustituye a tu auditor: qué marco aplica y cómo lo evalúa es decisión suya.

| Evidencia                    | Qué es                                                                                             | Cómo la produce este stage                                                                                                 |
| ---------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Identidad del cambio         | PR, SHA de cabeza y de merge, descripción, issue vinculado                                         | Plantilla y lint del PR; el merge queue crea un SHA temporal que hay que enlazar al PR                                     |
| Checks                       | Nombres, conclusión, run ID, revisión del workflow y SHA evaluado                                  | `quality-complete` y sus jobs; los resultados quedan en el historial de Actions                                            |
| Configuración de enforcement | Ruleset en vigor en el período: checks requeridos, code owners, aprobaciones obsoletas, force push | Versionar una exportación del ruleset o definirlo como código, porque la pantalla de ajustes solo muestra el estado actual |
| Fecha de cada gate           | Desde cuándo un control es bloqueante                                                              | `quality-policy.md` con fecha y responsable                                                                                |
| Bypass                       | Quién puede saltarse el ruleset y cada uso                                                         | Lista de bypass vacía o mínima; los usos se revisan en el registro de auditoría                                            |
| Excepciones                  | Motivo, responsable y caducidad                                                                    | Registro de excepciones (EX-3)                                                                                             |
| Vínculo con producción       | PR, SHA aprobado, digest del artefacto, despliegue                                                 | Fuera de este stage: lo cubre el PRD de la cadena de suministro                                                            |

Límites que la propia guía señala y que este diseño tiene en cuenta:

1. **Los checks en verde pueden engañar.** Un check requerido se satisface con `success`, `skipped` o `neutral`, y un job de Actions omitido reporta _Success_; por eso el agregador estricto no es opcional.
2. **Un gate advisory no es evidencia de enforcement.** Hasta la fecha de paso a bloqueante, el control no existía a efectos de auditoría.
3. **Los comentarios de revisores con IA no son revisión humana.** Solo cuentan como evidencia de revisión los controles diseñados expresamente así.
4. **Separación de funciones.** Un auditor mira la relación entre autor, último en empujar, revisor y quien fusiona. Con un solo mantenedor esa separación no existe; se documenta como riesgo aceptado con controles compensatorios (gates automáticos estrictos y registro de auditoría) o se añade una segunda cuenta (D7).
5. **Retención.** La guía insiste en conservar respuestas de la API, registros y parámetros de extracción, pero no fija plazos; el plazo es decisión tuya o de tu cliente (D9).

## Experiencia del desarrollador y despliegue del cambio

Un gate que se entiende y se repite en local se respeta; uno opaco se esquiva.

1. **Un comando que reproduce CI.** `npm run check` ejecuta lint, formato, tipos, boundaries y docs, los mismos scripts que usa CI; `npm run fix` aplica los arreglos automáticos. Quien ve verde en local debe ver verde en CI.
2. **Hooks instalados solos.** Un script `prepare` en `package.json` instala los hooks al hacer `npm ci`, así nadie depende de recordar un paso manual.
3. **Editor alineado.** `.editorconfig` y `.vscode/settings.json` versionados (formato al guardar, ESLint activo) y extensiones recomendadas, para que el editor dé el mismo veredicto que el hook.
4. **Finales de línea.** Los archivos que enviaste en esta conversación usan CRLF (Windows); si el repo también se edita en Windows, un `.gitattributes` (por ejemplo `* text=auto eol=lf`) y la opción `endOfLine` de Prettier evitan que `format:check` falle solo en CI, que corre en Linux.
5. **Mensajes accionables.** Cada gate dice qué falló, dónde y cómo corregirlo, y enlaza a una sección de `docs/learning/quality.md`; el manifest guard ya nombra la dependencia que sobra o falta.
6. **Plantilla de PR sin casillas redundantes.** Solo quedan casillas para lo que ninguna máquina verifica; lint, formato y tipos no se repiten como casillas.
7. **Comunicación de cada fase.** Antes de pasar un gate a bloqueante se anuncia la fecha, qué fallará y cómo corregirlo, y el cambio se registra en `quality-policy.md`.
8. **Lista de incorporación.** Clonar, `npm ci`, comprobar que los hooks están instalados, ejecutar `npm run check` y abrir un PR de prueba que fuerce un fallo y lo corrija.
9. **Bucle de mejora.** Cada mes se revisa qué errores llegaron a CI y un hook local habría detectado, y qué falsos positivos generaron excepciones; los gates que producen más ruido se recalibran.

## Verificación empírica en un repo de prueba

Los comandos y comportamientos de esta guía se ejecutaron en un repo TypeScript de prueba (ESLint 10.14, TypeScript 6.0.3, Prettier, lint-staged, dependency-cruiser, knip, markdownlint-cli2). La tabla separa lo que se observó de lo que sigue siendo lectura de documentación.

| Control                             | Qué se probó                                                                       | Resultado observado                                                                                                                                                  |
| ----------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lint                                | `eslint . --max-warnings 0`, con código limpio, con advertencias y con config rota | Exit 0 limpio; exit 1 con error o con advertencia (la advertencia de `complexity` cuenta contra `--max-warnings 0`); exit 2 con config inválida o error de ejecución |
| Directivas sin uso                  | `reportUnusedDisableDirectives: 'error'`                                           | Un `eslint-disable` que ya no suprime nada falla el lint                                                                                                             |
| Caché de ESLint                     | `--cache --cache-location .cache/eslint/ --cache-strategy content`                 | Crea el directorio con un archivo `.cache_<hash>`; la ruta debe terminar en `/`                                                                                      |
| TypeScript                          | `tsc --noEmit --incremental --tsBuildInfoFile .cache/tsc/app.tsbuildinfo`          | Escribe el `.tsbuildinfo` aunque haya `--noEmit` (TS 6.0.3); un error de tipos real devuelve exit 2                                                                  |
| `@ts-ignore`                        | Error de tipos precedido de `// @ts-ignore`                                        | Exit 0: el comentario lo oculta. La regla `ban-ts-comment` debe cerrar ese hueco                                                                                     |
| lint-staged con archivo ignorado    | Archivo ignorado por ESLint en el commit                                           | Con `--no-warn-ignored` pasa (exit 0); sin la bandera ESLint emite una advertencia y, con `--max-warnings 0`, el commit falla (exit 1)                               |
| lint-staged ante fallo              | Una tarea falla                                                                    | Revierte al estado original (stash) y no aplica modificaciones                                                                                                       |
| dependency-cruiser                  | Regla `client-not-server` con una violación                                        | Exit 1 con la regla y el par de archivos                                                                                                                             |
| Baseline de dependency-cruiser      | `depcruise-baseline` + `--ignore-known`                                            | La violación conocida pasa con exit 0 y avisa «1 known violations ignored»; una violación nueva sigue dando exit 1                                                   |
| knip sin `entry`                    | Proyecto sin `knip.json` ni `main`                                                 | Reporta todos los archivos como no usados: sin entrypoints el resultado es ruido, no señal                                                                           |
| knip con `entry`                    | `knip.json` con entradas y `ignoreDependencies`                                    | Detecta archivo huérfano y exports sin uso; además un _configuration hint_ por una entrada de `ignoreDependencies` que ya no hace falta                              |
| knip flags                          | `--no-exit-code`, `--max-issues`, `--cache`                                        | `--no-exit-code` → exit 0; `--max-issues 5` devolvió exit 1 con 6 hallazgos (por encima del tope); `--cache` escribe en `node_modules/.cache/knip`                   |
| Supresiones masivas (v10)           | `--suppress-rule complexity` con la regla en `warn`                                | Genera `eslint-suppressions.json` **vacío**: solo se suprimen reglas en nivel `error`                                                                                |
| Supresiones masivas (v10)           | Misma prueba con la regla en `error`                                               | Registra `count` por archivo y regla; los dos hallazgos existentes quedan suprimidos                                                                                 |
| Supresión obsoleta                  | Arreglar uno de los hallazgos suprimidos                                           | ESLint falla con exit 2 y pide `--prune-suppressions` (o `--pass-on-unpruned-suppressions`); tras podar el `count` baja a 1                                          |
| Hallazgo nuevo en archivo suprimido | Añadir otra función compleja en el mismo archivo                                   | Falla: el `count` es un tope por archivo y regla, no un permiso general para el archivo                                                                              |
| markdownlint-cli2                   | Archivo con listas sin líneas en blanco, estilo mixto y títulos duplicados         | Exit 1 con reglas MD032, MD004, MD024 y MD025; `--fix` corrige las de formato y deja las de estructura                                                               |
| Agregador (jq)                      | Cuatro combinaciones de `needs`                                                    | `skipped` solo pasa para el job autorizado; `skipped` en otro, `failure` y `cancelled` dan exit 1                                                                    |

Hallazgos que cambian la guía:

1. **knip necesita `entry` explícito.** Sin él, en un proyecto que no es un paquete publicable, todo aparece como no usado. El rollout empieza por `knip.json` y los _configuration hints_, no por activar el gate.
2. **Las supresiones masivas solo cubren reglas en `error`.** Una regla en `warn` se ratchetea con `--max-warnings` o subiéndola a `error` antes de suprimir; si no, el archivo queda vacío y parece que funcionó.
3. **Las supresiones son un contador.** Al corregir código el CI falla hasta podar (exit 2): es deseable, porque obliga a que la deuda solo baje, pero hay que documentarlo para que nadie lo trate como un fallo de herramienta.
4. **Los archivos de configuración también se lintean.** El `.dependency-cruiser.cjs` generó `'module' is not defined` (`no-undef`) con la config de ESLint de prueba: los `.cjs` necesitan `languageOptions.sourceType`/globals de Node o un `ignores` explícito.
5. **`--no-warn-ignored` es obligatorio en lint-staged** cuando algún archivo en staging cae en `ignores`; sin él el commit falla por una advertencia que no es un defecto.
6. **`@ts-ignore` anula el chequeo de tipos** con exit 0; la regla `@typescript-eslint/ban-ts-comment` (permitir solo con descripción) es lo que lo hace visible.

Limitaciones de esta verificación: se hizo en un repo mínimo (3 archivos fuente), así que los tiempos de lint frío contra caché caliente no representan un monorepo real; el comportamiento de los gates dentro de GitHub Actions (required checks, `skipped`, merge queue) se apoya en la documentación de GitHub y no se ejecutó contra un repositorio real.

## Controles adicionales investigados

Estos controles no estaban cubiertos en el detalle por job. Cada uno indica qué se encontró en la fuente y la recomendación.

| Control                                 | Hallazgo en la fuente                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Recomendación                                                                                                                                                                                                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Análisis de PR con SonarQube            | La documentación indica que el análisis de PR muestra solo issues nuevos y que su quality gate usa solo las condiciones de código nuevo; el estado se publica en la plataforma (decoración) con `sonar.pullrequest.key`, `sonar.pullrequest.branch` y `sonar.pullrequest.base`. La página de integración con GitHub indica que el estado se añade como check y que se puede bloquear el merge con un ruleset (recomendado) o una regla de protección, agregando el check \`SonarQube Code Analysis\` a los requeridos junto con «requerir ramas actualizadas». Esa página está redactada para SonarQube Cloud aunque aparece en la documentación de Server: confirmar el nombre del check y el comportamiento en tu versión | Empezar como advisory; pasarlo a required check (ruleset) tras un PR de prueba que confirme el nombre del check. Hay hilos en la comunidad de Sonar sobre quality gates que fallan por líneas no modificadas: validar con un PR de prueba antes de exigirlo |
| ESLint con tipos (typescript-eslint)    | «El linting con tipos es, en general, tan lento como el type-check del mismo proyecto». Las reglas lentas suelen ser las que llaman al API de tipos, `@stylistic/indent`, `eslint-plugin-prettier` y varias de `eslint-plugin-import`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       | Medir con `TIMING=1`; reemplazar `eslint-plugin-prettier` por `prettier --check`; dejar `import/no-cycle` y similares solo en CI o pre-push; acotar los `include` del `tsconfig` para no arrastrar artefactos de build                                      |
| Reglas de React                         | `eslint-plugin-react-hooks` y `eslint-plugin-jsx-a11y` aportan `rules-of-hooks`, `exhaustive-deps` y accesibilidad estática                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | `rules-of-hooks` en `error` desde el inicio; `exhaustive-deps` en `warn` y luego ratchet; a11y estática cubre una parte limitada: complementar con pruebas de accesibilidad en el stage de pruebas                                                          |
| Prisma                                  | `prisma migrate diff` exige un `--from-*` y un `--to-*` del mismo proveedor; con `--exit-code` devuelve 0 sin diferencias, 1 en error y 2 con diferencias                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Gate de drift: comparar `--from-migrations` contra `--to-schema`; exit 2 significa que el esquema cambió sin migración. `prisma validate` y `prisma format --check` van en el mismo job                                                                     |
| Documentación                           | markdownlint cubre estructura (probado arriba); Vale cubre estilo de prosa; verificadores de enlaces y ortografía se suelen separar de los de estructura                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | markdownlint-cli2 como gate de bloqueo sobre archivos cambiados; Vale y ortografía en modo advisory hasta calibrar vocabulario                                                                                                                              |
| Código generado                         | Aparece en `ignores` de ESLint, knip y dependency-cruiser                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   | Un solo archivo de patrones de exclusión por repo, revisado por CODEOWNERS; excluir generados reduce ruido pero también oculta código a mano dentro de esas carpetas                                                                                        |
| Revisión automática por IA (CodeRabbit) | Sus pre-merge checks tienen modo warning (por defecto, no bloquea) y error; error bloquea solo junto con Automatic Approvals. Los checks de directorio se reportan como Check Runs, pero crear uno no lo hace obligatorio: hay que añadirlo al ruleset con el nombre «CodeRabbit / \<sufijo>». Con auto-approvals activo emite request-changes, que bloquea el merge en GitHub; una revisión omitida puede no reportar el check                                                                                                                                                                                                                                                                                             | Dejarlo como asesor (warning). Si se exige, probar PRs que coincidan, que no coincidan y con revisión omitida antes de añadirlo al ruleset; no sustituye a los gates deterministas                                                                          |
| i18n (claves de traducción)             | i18n-check detecta claves faltantes e inválidas por defecto y, con \`-u\`, claves sin uso y no definidas (react-intl, i18next, next-intl). No hay Action oficial: se ejecuta como paso propio y el job falla si hay claves faltantes o inválidas; la página no documenta un código de salida                                                                                                                                                                                                                                                                                                                                                                                                                                | Solo si el ERP tiene más de un idioma: gate de claves faltantes en bloqueo y claves sin uso en advisory; confirmar el exit code con una corrida propia                                                                                                      |

## Prototipo de manifest-guard

El control del `package.json` raíz descrito en el detalle por job no tiene herramienta estándar, así que se escribió y se probó un script de referencia (`scripts/manifest-guard.mjs`, sin dependencias). Falla si el manifiesto raíz declara un paquete que no está en `manifest-allowlist.json` ni es dependencia directa de algún workspace. Salida 0 correcto, 1 violación, 2 error de uso.

```js
#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.argv[2] ?? '.';
const read = (p) => JSON.parse(readFileSync(p, 'utf8'));
try {
  const rootPkg = read(join(root, 'package.json'));
  const allow = new Set(
    read(join(root, 'manifest-allowlist.json')).allow ?? []
  );
  const globs =
    (Array.isArray(rootPkg.workspaces)
      ? rootPkg.workspaces
      : rootPkg.workspaces?.packages) ?? [];
  const direct = new Set();
  for (const g of globs) {
    const base = g.replace(/\/\*$/, '');
    if (!existsSync(join(root, base))) continue;
    for (const d of readdirSync(join(root, base), { withFileTypes: true })) {
      const f = join(root, base, d.name, 'package.json');
      if (!d.isDirectory() || !existsSync(f)) continue;
      const p = read(f);
      for (const k of [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
      ])
        Object.keys(p[k] ?? {}).forEach((n) => direct.add(n));
    }
  }
  const bad = [];
  for (const k of ['dependencies', 'devDependencies'])
    for (const n of Object.keys(rootPkg[k] ?? {}))
      if (!allow.has(n) && !direct.has(n)) bad.push(`${k}: ${n}`);
  if (bad.length) {
    console.error('manifest-guard: fuera de allowlist:\n  ' + bad.join('\n  '));
    process.exit(1);
  }
  console.log('manifest-guard: ok');
} catch (e) {
  console.error('manifest-guard: error de uso: ' + e.message);
  process.exit(2);
}
```

Pruebas con un monorepo de ejemplo de dos workspaces: manifiesto dentro de la allowlist → exit 0; dependencia de un workspace subida al raíz → exit 0; `lodash` raíz fuera de la allowlist → exit 1 nombrando el paquete; allowlist ausente → exit 2. Limitaciones: solo resuelve globs del tipo `carpeta/*` (no patrones anidados ni negaciones) y no compara versiones. Al lintear el script con la configuración de prueba apareció `no-undef` en `console` y `process`: los scripts de Node necesitan globals de Node en su bloque de configuración de ESLint, el mismo caso de los `.cjs` del hallazgo 4.

## Lo que no se pudo cerrar desde aquí

Tres cosas dependen de tu repositorio y no se pueden verificar sin él; el plan de adopción las trata como criterios de salida de la Fase 1: los tiempos reales de typed linting en tu monorepo, el comportamiento de los gates dentro de GitHub Actions (checks obligatorios, `skipped`, merge queue, nombre exacto del check de Sonar) y la restauración de la caché de `.tsbuildinfo` entre corridas de CI. Cada una se resuelve con un PR de prueba y queda registrada en el registro de aprendizajes.

## Criterios de aceptación y métricas

El stage se acepta cuando cada gate demuestra que falla donde debe y no falla donde no debe.

| #   | Caso                                                        | Resultado esperado                                                           |
| --- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| A1  | Error de lint en un archivo nuevo                           | `lint` rojo, `quality-complete` rojo, tests y build saltados                 |
| A2  | Un warning nuevo                                            | `lint` rojo por `--max-warnings 0`                                           |
| A3  | Archivo sin formatear                                       | `format` rojo; CI no modifica nada                                           |
| A4  | Error de tipos solo en el servidor                          | `types` rojo: se comprueban todos los proyectos                              |
| A5  | `@ts-ignore` añadido                                        | Lint rojo                                                                    |
| A6  | `eslint-disable` que ya no suprime nada                     | Lint rojo                                                                    |
| A7  | Import del cliente al servidor                              | `boundaries` rojo                                                            |
| A8  | Violación de imports ya incluida en el baseline             | No bloquea                                                                   |
| A9  | Dependencia en el `package.json` raíz fuera de la allowlist | `manifest-guard` rojo, con la dependencia nombrada                           |
| A10 | Violación suprimida y corregida sin podar                   | ESLint sale con código distinto de cero hasta `--prune-suppressions`         |
| A11 | Commit con `--no-verify` y un error de lint                 | El mismo error lo detecta CI                                                 |
| A12 | Job obligatorio saltado sin autorización                    | `quality-complete` rojo                                                      |
| A13 | Export nuevo sin uso, Fase 1                                | Warning de knip, no bloquea                                                  |
| A14 | La misma regla de knip pasada a `error`, Fase 3             | Rojo                                                                         |
| A15 | Hallazgo nuevo en un archivo con supresiones                | Lint rojo: el contador por archivo y regla es un tope, no un permiso         |
| A16 | Archivo ignorado por ESLint en staging                      | El commit pasa (lint-staged con --no-warn-ignored)                           |
| A17 | Violación nueva de dependency-cruiser con baseline activo   | Exit 1 con la regla y los archivos; las violaciones del baseline no bloquean |
| A18 | Cambio de schema.prisma sin migración                       | prisma migrate diff --exit-code devuelve 2 y el job falla                    |
| A19 | Markdown con estructura inválida                            | markdownlint-cli2 rojo sobre los archivos cambiados                          |
| A20 | knip sin entry configurado                                  | No se habilita como gate: primero knip.json y los configuration hints        |

Presupuestos de tiempo y métricas, todos propuestos:

- `pre-commit` sobre archivos staged: menos de 10 segundos.
- `pre-push` (tipos y boundaries): menos de 60 segundos.
- Grupo completo en el PR con caché caliente: menos de 5 minutos.
- Rojos sin cambios de código (flaky): 0.
- Tamaño de baselines y supresiones: solo baja, nunca sube.
- Excepciones vencidas sin revisar: 0.
- Errores que llegan a CI y que un hook local habría detectado: se mide para ajustar qué se adelanta a la izquierda.

## Plan de adopción

Cuatro fases llevan cada gate de advisory a bloqueante; la primera es prerrequisito porque un agregador que acepta saltos no protege nada.

&#91;embedded content: plan de adopción · 4 fases, 3 gates\]

Cada rombo es un criterio de salida: sin cumplirlo no se pasa a la fase siguiente. La duración de la fase advisory sale del patrón habitual; el resto se calibra con corridas reales.

Qué entra en cada fase, incluidos los controles de las secciones de gobernanza, seguridad y verificación:

1. **Fase 0, prerrequisitos.** Agregador estricto con `if: always()`, `permissions` mínimos, acciones fijadas por SHA, CODEOWNERS y ruleset de `main` con el agregador como check obligatorio, runbook de fallos y registro de excepciones. Sin esto ningún gate posterior protege.
2. **Fase 1, advisory.** Lint con `--max-warnings 0` en archivos cambiados, formato, tipos, markdownlint, `knip.json` con `entry` y _configuration hints_, baseline de dependency-cruiser, `prisma validate`. Se mide durante 2 a 4 semanas antes de bloquear.
3. **Fase 2, bloqueo de lo determinista.** Lint, formato, tipos, imports con `--ignore-known`, `manifest-guard` y drift de Prisma pasan a obligatorios. Las supresiones masivas de ESLint se generan solo para reglas ya en `error`.
4. **Fase 3, bloqueo de lo estadístico y endurecimiento.** knip de `warn` a `error` por categoría, análisis de PR de Sonar solo tras confirmar el check obligatorio, regla de poda de supresiones, métricas y revisión trimestral de excepciones.

Los casos de aceptación A1 a A20 sirven como fixtures: cada uno se ejecuta en una rama de prueba con la violación correspondiente y debe producir el resultado indicado antes de pasar a la fase siguiente.

## Antipatrones y riesgos

El riesgo mayor es el gate que nadie respeta: lento, ruidoso o apagable editando un archivo.

| Antipatrón o riesgo                        | Efecto                               | Mitigación                                                        |
| ------------------------------------------ | ------------------------------------ | ----------------------------------------------------------------- |
| Hooks sin espejo en CI                     | `--no-verify` salta el control       | Todo check local se repite en CI                                  |
| Auto-fix commits desde CI                  | Rompe firmas y DCO                   | CI solo comprueba; el fix es local                                |
| Agregador que acepta `skipped`             | PR en verde sin ejecutar nada        | Agregador estricto y saltos autorizados por detección de cambios  |
| `continue-on-error` en un job bloqueante   | El gate no bloquea                   | Prohibirlo fuera de fases advisory, con fecha de salida           |
| Umbrales fijados a ojo                     | Falsos rojos o gate inútil           | Corrida advisory de 2 a 4 semanas                                 |
| `ignore` masivo en knip                    | Puntos ciegos                        | Configurar entradas y plugins; `ignore` solo para casos puntuales |
| Baseline regenerado sin revisión           | Deuda nueva se esconde               | CODEOWNERS sobre baselines                                        |
| Revisor con IA como check requerido        | Bloqueos no deterministas            | Solo comentarios; bloquea el Quality Gate de Sonar                |
| Filtros por ruta sin la configuración raíz | Un cambio de reglas no corre el lint | Incluir configs de la raíz en los filtros                         |
| Herramientas sin versión fija              | `main` rojo tras una actualización   | Versiones y actions fijadas                                       |
| Un solo mantenedor                         | Nadie revisa excepciones             | Riesgo aceptado y documentado, o una segunda cuenta               |

## Decisiones abiertas y fuentes

Trece decisiones por tomar; D3 y D4 requieren una corrida advisory sobre tu código.

| #   | Decisión                                    | Opciones                                                                         | Recomendación                                                                 |
| --- | ------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| D1  | Ejecución de solo lo afectado               | Filtros por ruta, o un orquestador (`turbo`, `nx affected`)                      | Filtros por ruta al inicio                                                    |
| D2  | SonarQube y PRs de forks                    | Sonar en la nube o propio; saltar el análisis en forks                           | Decidir si Sonar aporta algo que ESLint y el resto no cubren                  |
| D3  | Umbrales de complejidad                     | Valores por defecto de ESLint o medidos sobre tu código                          | Medirlos en la fase advisory                                                  |
| D4  | Mecanismo de ratchet                        | Contador propio, baseline por herramienta o supresiones en bloque de ESLint      | Baseline por herramienta donde exista                                         |
| D5  | Nivel del gate de dead code                 | Siempre advisory, o bloquear exports nuevos sin uso                              | Advisory hasta limpiar la configuración de knip                               |
| D6  | `vale`                                      | Warning, o no usarlo                                                             | Warning                                                                       |
| D7  | Aprobación de excepciones                   | Un solo mantenedor con riesgo aceptado, o una segunda cuenta que revise          | Riesgo aceptado y documentado al inicio; excepciones solo en PR aparte (EX-2) |
| D8  | Métricas del stage                          | Informe semanal con la CLI de GitHub, o spans OTLP y un servicio de métricas     | Informe semanal al inicio; fijar aquí la meta de MTTR de main                 |
| D9  | Retención de la evidencia                   | Un año, tres años o lo que pida un cliente o un auditor                          | Preguntar a quien vaya a auditar antes de fijar un plazo                      |
| D10 | Reglas en warn frente a supresiones masivas | Subirlas a error y suprimir, o ratchet con --max-warnings                        | Subir a error antes de suprimir; solo cubren reglas en error                  |
| D11 | Gate de drift de Prisma                     | migrate diff --exit-code con migraciones frente a schema, o solo prisma validate | Drift en Fase 2; validate desde la Fase 1                                     |
| D12 | Revisión automática por IA                  | Asesor (warning) o check obligatorio                                             | Asesor; los gates deterministas son los obligatorios                          |
| D13 | Gate de i18n                                | No aplicar, o claves faltantes en bloqueo y sin uso en advisory                  | Aplicar solo si el ERP tiene más de un idioma                                 |

### Fuentes

- [ESLint, interfaz de línea de comandos (v9)](https://eslint.org/docs/v9.x/use/command-line-interface): `--max-warnings`, directivas sin uso, caché, códigos de salida.
- [SonarQube, quality gates](https://docs.sonarsource.com/sonarqube-server/10.8/instance-administration/analysis-functions/quality-gates/): condiciones de _Sonar way_ sobre código nuevo.
- [dependency-cruiser, herramientas de CLI (Tessl)](https://tessl.io/registry/tessl/npm-dependency-cruiser/files/docs/cli-tools.md): baseline, `--ignore-known`, códigos de salida.
- [Knip, FAQ](https://knip.dev/reference/faq): falsos positivos, modo producción y `ignore`.
- [Linting pipeline en GitHub Actions (OneUptime)](https://oneuptime.com/blog/post/2025-12-20-linting-pipeline-github-actions/view): caché, lint de archivos cambiados, SARIF.

* [ESLint, supresiones en bloque](https://eslint.org/docs/v9.x/use/suppressions): `--suppress-all`, `eslint-suppressions.json`, `--prune-suppressions`.
* [Knip, uso en CI](https://knip.dev/guides/using-knip-in-ci): código de salida, `--no-exit-code`, caché y modo doble.
* [Knip, adopción gradual](https://knip.dev/guides/adopt-gradually): `rules`, `--max-issues`, filtros por tipo.
* [TypeScript, tsBuildInfoFile](https://www.typescriptlang.org/tsconfig/tsBuildInfoFile.html): ubicación por defecto del archivo de información incremental.
* [lint-staged, README](https://github.com/lint-staged/lint-staged/blob/cb43872fb6c05366a8fc25a8bd889b95918f45a3/README.md): formato de configuración y re-adición automática de archivos.

- [GitHub, solución de problemas de checks requeridos](https://docs.github.com/en/enterprise-cloud@latest/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks): checks omitidos, _Pending_, `always()` con `needs`, `merge_group`.
- [GitHub, uso seguro de pull_request_target](https://docs.github.com/en/actions/reference/security/securely-using-pull_request_target): patrones peligrosos y alternativas.
- [GitHub, acerca de los code owners](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners): ubicación, sintaxis, precedencia y requisitos.
- [Turborepo, construir CI](https://turborepo.dev/docs/crafting-your-repository/constructing-ci): `--affected`, historial de git y caché.
- [Packagist, asegurar workflows con zizmor](https://blog.packagist.com/securing-our-github-actions-workflows-with-zizmor/): reglas y configuración en CI.
- [OneUptime, evidencia de gestión de cambios con pull requests](https://oneuptime.com/blog/post/2026-08-04-github-pull-requests-change-management-evidence/view): qué evidencia piden los auditores y sus límites.
- [Observabilidad de pipelines (Agent Zone)](https://agent-zone.pages.dev/knowledge/cicd/pipeline-observability): métricas, percentiles y umbrales de alerta.
- [SonarQube, integración con GitHub a nivel de proyecto](https://docs.sonarsource.com/sonarqube-server/devops-platform-integration/github-integration/setting-up-at-project-level): estado como check y bloqueo de merge con ruleset.
- [SonarQube, análisis de pull requests](https://docs.sonarsource.com/sonarqube-server/10.5/analyzing-source-code/pull-request-analysis): solo issues nuevos y condiciones de código nuevo.
- [typescript-eslint, rendimiento del linting con tipos](https://typescript-eslint.io/troubleshooting/typed-linting/performance): reglas lentas y recomendaciones.
- [Prisma, migrate diff](https://docs.prisma.io/docs/cli/migrate/diff): `--exit-code` y fuentes de comparación.
- [CodeRabbit, pre-merge checks](https://docs.coderabbit.ai/pr-reviews/pre-merge-checks) y [flujo de request changes](https://docs.coderabbit.ai/pr-reviews/request-changes-workflow): modos y bloqueo de merge.
- [i18n-check](https://github.com/lingualdev/i18n-check): claves faltantes, inválidas, sin uso y no definidas.

Sonar como check obligatorio está documentado (ruleset con \`SonarQube Code Analysis\`), pero la página es de la variante Cloud: falta confirmarlo contra tu instancia. Ya verificado en la prueba: `tsc --noEmit --incremental` escribe el archivo de información incremental. La página de ESLint v9 indica que esa rama llegó a fin de vida el 2026-08-06.
