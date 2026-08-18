## Context

El proyecto tiene un ecosistema CI/CD real y maduro: 9 workflows en `.github/workflows/` (ci.yml, ci-enterprise.yml, deploy.yml, preview.yml, quality.yml, release.yml, scheduled-security.yml, security-digest.yml, security.yml), 1 composite action (`.github/actions/setup-monorepo/action.yml`, 24 lineas), 3 git hooks de Husky.

**Brecha que este cambio cierra**: un lector que termino Fundamentos sabe que es GitHub Actions pero todavia no puede leer ni modificar los workflows reales del proyecto (por que ci.yml tiene 9 jobs, que es un workflow reutilizable, que es una composite action, como funcionan los caches, como se orquesta el testing en CI). La documentacion tecnica existente es de referencia y asume conocimientos; no existe una guia didactica que haga el puente teoria a implementacion real. Ver `proposal.md` para la motivacion completa.

## Goals / Non-Goals

**Goals:**

- Crear el nivel Intermedio (7 archivos en `docs/learning/ci-cd/`: intermedio-README.md + 6 guias 05-10) de la ruta de aprendizaje de 4 niveles, continuando la numeracion y el estilo del nivel Fundamentos.
- Que el lector termine el nivel siendo capaz de **leer y modificar cualquiera de los workflows del proyecto y los hooks de Husky** (walkthrough profundo, no solo survey).
- Usar los archivos reales (`.github/workflows/*.yml`, `.github/actions/setup-monorepo/action.yml`, `.husky/*`, `package.json` lint-staged) como material didactico con snippets citados.
- Referenciar (no duplicar) la documentacion tecnica existente: `docs/cicd-estado-actual.md`, `docs/workflows-mantenimiento-guia.md`, `docs/testing-architecture.md`, `docs/code-style.md`, `docs/adr/turborepo-evaluation.md`.

**Non-Goals:**

- NO escribir las guias aun — este cambio solo genera los artefactos OpenSpec (proposal, specs, design, tasks).
- NO crear los niveles Avanzado y Profesional — son cambios OpenSpec posteriores (`learning-cicd-avanzado`, `learning-cicd-profesional`).
- NO modificar codigo de aplicacion, workflows, actions, hooks ni infraestructura.
- NO reescribir ni migrar `docs/cicd-*.md` existentes.
- NO cubrir seguridad en profundidad (CodeQL, SBOM, Floci, AWS/IAM) — es del nivel Avanzado; aqui solo se tocan los hooks de seguridad del pre-commit en 05.

## Decisions

### D1: Continuidad con el nivel Fundamentos (numeracion 05-10, mismo estilo)

Las 6 guias del nivel usan numeracion consecutiva a las del nivel Fundamentos (00-04) y repiten su estructura pedagogica: objetivos de aprendizaje, prerequisitos, teoria primero, walkthrough de la implementacion real, resumen, siguiente guia. El indice es un archivo separado (`intermedio-README.md`) para mantener modularidad y no acoplar los dos niveles en un unico README.

**Por que**: el lector llega con el contrato pedagogico ya internalizado; la continuidad reduce friccion cognitiva y hace el roadmap de 4 niveles predecible. La numeracion intercalada (05-10) permite coexistir los dos niveles en el mismo directorio sin conflictos.

**Alternativa considerada**: fusionar el indice intermedio en el README de Fundamentos. Rechazada: mezcla dos niveles en un archivo, complica la revision por PR y el roadmap.

### D2: Walkthrough profundo (no survey)

Cada guia no solo enumera que existe un workflow/hook: desglosa el archivo real linea por linea, explica el por que de cada bloque YAML y deja al lector capaz de **modificarlo**.

**Por que**: el objetivo del nivel es "puedo leer y modificar cualquiera de los 9 workflows + hooks". Un survey (tabla inventario) ya existe en `docs/workflows-mantenimiento-guia.md`; duplicarlo no ensena a modificar. El valor didactico esta en el desglose.

**Alternativa considerada**: guias de solo lectura/enlace a la doc tecnica. Rechazada: no cumple el objetivo de aprendizaje del nivel (la doc tecnica asume que ya sabes modificar).

### D3: Snippets reales como material de ensenanza

Los bloques de codigo son snippets reales de `.github/workflows/ci.yml`, `.github/workflows/quality.yml`, `.github/actions/setup-monorepo/action.yml`, `.husky/pre-commit`, `.husky/commit-msg`, `.husky/pre-push` y `package.json` (lint-staged), siempre citando la ruta fuente en el bloque.

**Por que**: aprender sobre la implementacion real (no sobre ejemplos inventados) es el nucleo del enfoque "aprender haciendo" de la ruta. El lector puede abrir el archivo en el repo y comparar.

### D4: Enlazar en lugar de duplicar la documentacion existente

Las guias referencian `docs/cicd-estado-actual.md`, `docs/workflows-mantenimiento-guia.md`, `docs/testing-architecture.md`, `docs/code-style.md` y `docs/adr/turborepo-evaluation.md` con enlaces relativos, copiando solo snippets cortos (<40 lineas) con cita de fuente.

**Por que**: evita drift de documentacion (dos versiones del mismo dato que se desincronizan). La regla practica del nivel Fundamentos se mantiene: >40 lineas continuas de un archivo existente → enlace; <40 lineas con valor didactico → snippet con cita.

### D5: Cobertura de gotchas de Husky (timeout 120s y baseline Semgrep)

La guia 05 dedica secciones explicitas a dos gotchas reales documentados en `docs/workflows-mantenimiento-guia.md`: (a) el timeout por defecto de bash de 120 segundos que provoco falsos positivos en los commits `cf5e1bb` y `32d35a8` cuando pre-commit ejecuta lint-staged + Semgrep + Gitleaks en paralelo; (b) el baseline de 19 findings de Semgrep que no son bloqueadores (solo falla por findings nuevos en archivos staged).

**Por que**: son los dos problemas que un Junior encontrara en su primer commit real. Documentarlos de forma didactica evita que el lector piense que su commit fallo por su culpa cuando en realidad es un timeout falso positivo o un baseline pre-existente.

### D6: Distincion composite action vs reusable workflow

La guia 07 (quality.yml) y la guia 08 (composite actions) presentan una tabla comparativa explicita: donde vive cada mecanismo (`.github/workflows/*.yml` vs `.github/actions/*/action.yml`), como se invoca (`uses: ./.github/workflows/x.yml` vs `uses: ./.github/actions/x`), que encapsulan (jobs completos vs steps) y cuando usar cada uno.

**Por que**: es la confusion mas comun entre Juniors que empiezan a leer repos con ambos mecanismos. El proyecto usa exactamente los dos: `quality.yml` (reusable) y `setup-monorepo` (composite), lo que permite ensenar la distincion con ejemplos reales.

### D7: El gotcha de fetch-depth (Caso 2) debe destacar

El Caso 2 de `docs/workflows-mantenimiento-guia.md` (exit 128 de `dorny/test-reporter` por shallow checkout, y la regla resultante "la composite NO hace checkout") es material central de las guias 06 y 08.

**Por que**: es el incidente real mas didactico del repo: muestra como un detalle de config (fetch-depth default de `actions/checkout@v5`) rompe el reporting, como se diagnostico y como se resolvio. Ensenar el proceso de diagnostico es mas valioso que el snippet. Tambien explica por que los 6 jobs de ci.yml clonan con `fetch-depth: 0` y por que setup-monorepo no incluye checkout.

### D8: Aclarar gaps de cambios anteriores

El nivel aclara dos inconsistencias del estado actual que confunden: (a) `ci-enterprise.yml` referencia paths `frontend/` y `backend/` (y package-locks en esos paths) que NO existen en este monorepo (paths reales `apps/client` y `apps/server`) → cache-miss y path filtering muerto; (b) `quality.yml` tiene el step "Type Check" que ejecuta `npm run typecheck || echo "Typecheck skipped"` — el typecheck esta efectivamente desactivado.

**Por que**: sin esta aclaracion, un Junior que intente modificar ci-enterprise.yml o entender por que no hay typecheck real se frustra. Explicar el gap (y que es material del nivel Avanzado arreglarlo) da contexto honesto del estado del repo.

### D9: Compatibilidad con estructura de archivos abierta (numeracion intercalada)

Los 6 archivos (05-10) coexisten con los 6 de Fundamentos (00-04 + README) en el mismo directorio `docs/learning/ci-cd/` sin reestructurar nada de lo ya creado por `learning-cicd-fundamentos`.

**Por que**: los cambios OpenSpec se implementan de forma incremental y en paralelo; el intermedio no debe depender de que Fundamentos este mergeado, solo de su existencia como referencia. La numeracion intercalada garantiza que los archivos de ambos niveles conviven sin conflictos de nombres y que el roadmap de 4 niveles queda visible desde el directorio.

### D10: Caso 1 (.nvmrc SSOT) como material central del mantenimiento de versiones Node

El bumpeo de Node via `.nvmrc` es la modificacion mas comun que un lector hara a los workflows. El Caso 1 de `docs/workflows-mantenimiento-guia.md` §3 (incidente EBADENGINE por `omniroute@3.8.49`, fix commit `cf5e1bb`) debe ensenarse prominentemente, no solo el Caso 2 (fetch-depth). Referenciar §5 Mantenimiento de versiones Node.

**Por que**: sin el Caso 1, el lector aprende a modificar workflows pero no el mecanismo por el que un bump de version de Node se propaga atomicamente a los 9 workflows + 1 composite (`.nvmrc` como unica fuente de verdad). Un Junior que encuentre un EBADENGINE por un floor `engines.node` superior caeria en el anti-patron de editar `node-version:` workflow por workflow.

**Alternativa considerada**: relegar el Caso 1 a la doc tecnica existente. Rechazada: `docs/workflows-mantenimiento-guia.md` es de referencia y asume que ya sabes modificar; el nivel Intermedio debe ensenar el por que, no solo apuntar al playbook.

## Risks / Trade-offs

- **[Riesgo] Drift de snippets**: los snippets reales de ci.yml/quality.yml/setup-monorepo/husky pueden quedar obsoletos si esos archivos cambian → Mitigacion: citar siempre la ruta fuente, mantener snippets cortos (<40 lineas) y tarea de verificacion de referencias (tasks 8.x/9.x).
- **[Riesgo] Version de actions desactualizada en las guias**: `dorny/paths-filter` aparece como @v4 en ci.yml pero @v3 en ci-enterprise.yml; las guias deben mostrar la version real de cada archivo citado → Mitigacion: los snippets se copian tal cual del archivo fuente; cualquier diferencia se explica como didactica (inconsistencia real del repo).
- **[Riesgo] Enlaces rotos**: rutas relativas hacia `docs/` y `.github/` pueden romperse → Mitigacion: tarea de verificacion de cross-references (task 8.x) y uso consistente de rutas relativas desde `docs/learning/ci-cd/`.
- **[Trade-off] Extension 800-1500 lineas por guia**: 6 guias largas son costosas de producir y revisar → Mitigacion: cada guia es un bloque de tareas independiente (ver tasks.md), revisable por separado.
- **[Riesgo] Docs de referencia en evolucion**: `docs/workflows-mantenimiento-guia.md` y `docs/cicd-estado-actual.md` pueden cambiar → Mitigacion: enlaces por ruta relativa (no contenido copiado), el enlace sigue funcionando aunque el contenido evolucione.
- **[Riesgo] Lectores sin Fundamentos**: un lector que saltee el nivel anterior puede perderse → Mitigacion: seccion de prerequisitos en cada guia ("debes haber completado 00-04") y enlaces de retorno a las guias de Fundamentos en lugar de re-explicar conceptos base.

- **[Riesgo] Colision con cambio paralelo ci-security-hardening**: la linea exacta de quality.yml:64 (`npm run typecheck || echo "Typecheck skipped"`) que ensena la guia 07 / D8(b) es objetivo del task 3.4 de `openspec/changes/ci-security-hardening/` (hoy bloqueada — no existe script typecheck) → Mitigacion: task de verificacion 8.x que re-comprueba el estado actual de quality.yml antes de dar por valida la guia 07; secuenciar la implementacion de Intermedio antes que ci-security-hardening (o viceversa) en el roadmap del orquestador.

## Migration Plan

No aplica migracion de sistemas: es documentacion nueva en `docs/learning/ci-cd/` sin tocar codigo, workflows ni infraestructura. Rollout: este cambio (Intermedio) → revision → implementacion de guias → siguientes cambios de nivel (Avanzado, Profesional) en PRs independientes. Rollback: eliminar los 7 archivos del nivel Intermedio (no afecta nada mas; Fundamentos y la doc tecnica quedan intactos).

## Open Questions

- No hay preguntas abiertas que bloqueen especificacion, diseno o tareas: el contenido de los niveles Avanzado/Profesional se define en sus propios cambios OpenSpec y aqui solo se referencian por nombre.
- Las tareas 9.x/10.x de verificacion (anti-duplicacion y QA markdown) dependen de que herramientas de lint markdown esten disponibles en el repo; se resuelven en implementacion sin cambiar diseno ni specs.

## Cross-Reference Strategy

- Cada guia enlaza: (a) a la guia anterior y siguiente del nivel (o al intermedio-README), (b) a las guias de Fundamentos 00-04 cuando asume conceptos base, (c) a los archivos reales por ruta relativa (`.github/workflows/*.yml`, `.github/actions/*`, `.husky/*`), (d) a los docs tecnicos (`docs/cicd-estado-actual.md`, `docs/workflows-mantenimiento-guia.md`, `docs/testing-architecture.md`, `docs/code-style.md`, `docs/adr/turborepo-evaluation.md`).
- El intermedio-README enlaza de vuelta al README de Fundamentos (nivel previo) y hacia el nivel Avanzado (cambio `learning-cicd-avanzado`), manteniendo el roadmap de 4 niveles navegable.
- Enlaces relativos desde `docs/learning/ci-cd/`: `../` para `docs/` y `../../` para `.github/` y `.husky/`.
