## Context

El proyecto tiene un ecosistema CI/CD real y maduro con despliegue CD a AWS: `deploy.yml` (pipeline de 2 fases con ECR, ECS Fargate, OIDC), `preview.yml` (preview environments con Floci), `release.yml` (Changesets), y documentacion tecnica extensa (`docs/aws-deploy-architecture.md` de 866 lineas, `docs/aws-cd-learning-path.md` de 546, `docs/aws-dev-local-floci.md` de 267, `docs/aws-learning-with-floci.md` de 342, `docs/cicd-estado-actual.md` seccion 10, `docs/workflows-mantenimiento-guia.md` seccion 14). Esta documentacion es de referencia tecnica y asume conocimientos previos de AWS. Los niveles Fundamentos (00-04) e Intermedio (05-10) ya existen como cambios OpenSpec; este cambio crea el nivel Avanzado (11-17). Ver `proposal.md` para la motivacion completa.

## Goals / Non-Goals

**Goals:**

- Crear el nivel Avanzado (8 archivos en `docs/learning/ci-cd/`: avanzado-README.md + 7 guias 11-17) de la ruta de aprendizaje de 4 niveles, llevando al Junior desde CI dominado hasta CD + ecosistema AWS usando el proyecto real como caso de estudio y Floci como emulador de cero costo.
- Estructura pedagogica reproducible: objetivos → prerequisitos → teoria desde cero (AWS) → walkthrough de implementacion real → resumen → siguiente guia.
- Guias autosuficientes en contenido didactico pero que referencian (no copian) la documentacion AWS existente.

**Non-Goals:**

- NO escribir las guias aun — este cambio solo genera los artefactos OpenSpec (proposal, specs, design, tasks).
- NO crear el nivel Profesional — es el cambio OpenSpec posterior (`learning-cicd-profesional`) que se referencia desde el README.
- NO modificar codigo de aplicacion, workflows ni infraestructura AWS.
- NO reescribir ni migrar `docs/aws-*.md` existentes.
- NO crear credenciales ni infraestructura AWS real: todo el aprendizaje corre contra Floci (cero costo cloud).

## Decisions

### D1: Continuidad con Fundamentos + Intermedio (numeracion 11-17, mismo estilo)

El nivel Avanzado continua la numeracion exacta de los niveles previos (00-04 Fundamentos, 05-10 Intermedio, 11-17 Avanzado) y reutiliza el mismo contrato pedagogico: objetivos de aprendizaje, prerequisitos, teoria primero, walkthrough con snippets citando ruta fuente, resumen, siguiente guia.

**Por que**: La ruta es un todo; un lector que viene de las guias 05-10 debe reconocer la estructura sin friccion. El README es archivo separado (avanzado-README.md) igual que en Intermedio, manteniendo la estructura modular decidida en (Fundamentos D9 + Intermedio D1).

**Alternativa considerada**: Reiniciar numeracion (01-07). Rechazada: rompe la continuidad numerica que da sentido de progreso al lector y complica los cross-refs entre niveles.

### D2: Conceptos AWS ensenados desde cero

Cada guia asume que el lector nunca uso la consola AWS: se introducen desde cero los conceptos de cuenta, region (us-east-1), ARN, consola, y la distincion servicios regionales (ECS, ECR, RDS) vs globales (IAM) antes de cualquier detalle de implementacion.

**Por que**: El publico objetivo (Junior con Fundamentos + Intermedio) domina CI y GitHub Actions pero probablemente nunca toco AWS. Saltar directo a `aws ecs update-service` sin explicar region/ARN/consola haria la guia ilegible. La guia 11 (cd-conceptos-aws) construye esta base y las guias 12-16 la reutilizan.

### D3: Floci como herramienta de ensenanza central

Floci (MIT, 68 servicios, puerto 4566, imagen ~90MB, arranque ~24ms) es el vehiculo de practica de todo el nivel: cero costo cloud, APIs 1:1 con AWS real, ideal para CI y aprendizaje local. La guia 12 lo introduce a fondo (comparacion vs LocalStack, docker-compose.preview.yml, preview-smoke.mjs).

**Por que**: El proyecto ya usa Floci en produccion CI (deploy.yml, preview.yml); aprender AWS contra Floci es aprender exactamente la misma interfaz que el proyecto usa, sin gastar un centavo ni requerir cuenta AWS. El principio del proyecto ("zero cloud cost for learning/CI") se convierte en principio pedagogico.

### D4: Secuencia pedagogica Floci → Consola → Terraform

La ruta de aprendizaje AWS sigue la secuencia documentada en `docs/aws-cd-learning-path.md`: (1) practica emulada con Floci, (2) repeticion guiada en consola AWS real, (3) codificacion en Terraform (referencia en `docs/aws-deploy-architecture.md`).

**Por que**: El learning path del proyecto ya definio esta secuencia para desbloquear las fases de AWS real; las guias la explican y la referencian en vez de inventar otra. El lector entiende que Floci es el primer eslabon de una cadena que termina en Terraform.

### D5: Transparencia del inventario de secrets — gotcha SECRETKEY/JWT_SECRET

La guia 13 (deploy-yml-walkthrough) cubre explicitamente el inventario completo de secrets/variables de Fase 2 (vars.AWS*ROLE_ARN, vars.AWS_ACCOUNT_ID, secrets.STAGING*_, secrets.PROD\__) e incluye el gotcha del ARN legacy `*_JWT_SECRET_SECRET_ARN` cuyo env var inyectado es `SECRETKEY` (no `JWT_SECRET`).

**Por que**: Es el error de naming mas confuso de la pipeline (el nombre del ARN no coincide con el nombre del env var) y esta documentado en `docs/workflows-mantenimiento-guia.md` seccion 14 y `docs/aws-deploy-architecture.md`. Un Junior que intente razonar el sistema por nombres quedaria atascado; explicitarlo en la guia didactica evita la friccion.

### D6: OIDC tiene su propia guia (guia 15)

OpenID Connect recibe una guia dedicada completa (15-oidc-sin-credenciales-estaticas.md) en lugar de una seccion dentro de otra guia.

**Por que**: OIDC es el tema mas incomprendido del stack (JWT, trust policy, STS, credenciales temporales) y es la pieza de seguridad que habilita todo el despliegue sin credenciales estaticas. Su complejidad justifica 800-1500 lineas propias; mezclarlo en deploy-yml-walkthrough lo diluiria.

### D7: Patron de circuit breaker de ECS — mostrar por que es production-grade

La guia 16 (ecs-circuit-breaker-health-checks) explica la mecanica completa (task definition pineada por SHA, force-new-deployment, deploymentCircuitBreaker={enable:true,rollback:true}, health check interval 30s/timeout 5s/retries 3/startPeriod 60s/path /health, smoke tests post-deploy staging 5 min / prod 5 min (30 retries × 10s ambas)) y contrasta con un deploy naive.

**Por que**: El patron del proyecto es lo que separa un deploy profesional de uno de juguete: rollback automatico ante health checks fallidos y validacion post-deploy por entorno. La diferencia de rigor entre entornos NO es un health window mas largo en prod (ambos son 5 min / 30 retries x 10s): es (a) la aprobacion manual via GitHub Environments (protection rule de production) y (b) el concurrency group separado deploy-production (cancel-in-progress: false). Mostrar el contraste naive vs production-grade da al lector el criterio para juzgar cualquier pipeline futura.

### D8: Guia de Changesets como puente hacia madurez de automatizacion

La guia 17 (changesets-release-yml) cierra el nivel explicando el flujo de release automatico (push a main → PR "chore: version packages" → merge → npm publish + tags git), el `fetch-depth: 0` requerido y la estructura de `.changeset/`.

**Por que**: Cierra el ciclo completo push→deploy→release que el lector recorrio en las guias 13-16, mostrando que la automatizacion no termina en el deploy sino en la publicacion versionada. Ademas conecta con la spec existente `openspec/specs/release-workflow/spec.md`.

### D9: Cross-refs a docs/aws-\*.md — LINK, don't duplicate

Las guias referencian con enlaces relativos `docs/aws-deploy-architecture.md`, `docs/aws-cd-learning-path.md`, `docs/aws-dev-local-floci.md`, `docs/aws-learning-with-floci.md`, `docs/cicd-estado-actual.md` seccion 10 y `docs/workflows-mantenimiento-guia.md` seccion 14. Los snippets de workflows se copian en pequeno (<40 lineas) solo cuando son material didactico esencial y siempre citando la ruta fuente.

**Por que**: Evita drift de documentacion (dos versiones del mismo dato que se desincronizan) y respeta los docs AWS como fuente de verdad tecnica. Regla practica heredada de Fundamentos: >40 lineas continuas de un archivo existente → enlace; <40 lineas con valor didactico → snippet con cita de ruta.

### D10: README index como archivo separado por nivel

El README del nivel Avanzado es `avanzado-README.md`, archivo separado (no se fusiona con `README.md` de Fundamentos ni `intermedio-README.md`).

**Por que**: Estructura modular por nivel (decidida ya en Fundamentos): cada nivel es un PR independiente, se puede completar/serializar sin tocar los READMEs de otros niveles, y el conflicto de merge entre niveles paralelos desaparece.

## Risks / Trade-offs

- **[Riesgo] Drift de snippets**: los snippets copiados de `deploy.yml`, `preview.yml` y `release.yml` pueden quedar obsoletos si los workflows cambian → Mitigacion: citar siempre la ruta fuente, mantener snippets cortos (<40 lineas) y tarea de verificacion de referencias (task 8.x).
- **[Riesgo] Enlaces rotos hacia docs/aws-\*.md**: rutas relativas pueden romperse al reestructurar el repo → Mitigacion: uso consistente de rutas relativas desde `docs/learning/ci-cd/` y tarea de verificacion de cross-references (task 8.x/11.x).
- **[Trade-off] Extension 800-1500 lineas por guia**: escribir 7 guias de hasta 1500 lineas es costoso de producir y revisar → Mitigacion: cada guia es un bloque de tareas independiente (ver tasks.md), revisable por separado.
- **[Riesgo] Docs de referencia AWS en evolucion**: los docs de Floci y la arquitectura AWS pueden cambiar entre el diseno y la implementacion → Mitigacion: las guias enlazan por ruta relativa (no contenido copiado), el enlace sigue funcionando aunque el contenido evolucione.
- **[Riesgo] Alcance AWS excesivo**: 7 guias cubriendo AWS + Floci + OIDC + ECS puede abrumar → Mitigacion: secuencia pedagogica incremental (11 conceptos → 12 Floci → 13-14 walkthroughs → 15 OIDC → 16 ECS → 17 Changesets) y prerequisitos estrictos (Fundamentos + Intermedio completados).
- **[Trade-off] No usar AWS real en el aprendizaje**: el lector practica contra Floci, no contra AWS real → Mitigacion: Floci tiene APIs 1:1 con AWS (la secuencia Floci → Consola → Terraform de D4 muestra el camino hacia AWS real cuando el proyecto desbloquee Fase 2).

## Migration Plan

No aplica migracion de sistemas: es documentacion nueva en `docs/learning/ci-cd/` sin tocar codigo, workflows ni infraestructura AWS. Rollout: este cambio (Avanzado) → revision → implementacion de guias → siguiente cambio (Profesional) en PR independiente. Rollback: eliminar los 8 archivos `docs/learning/ci-cd/avanzado-README.md` y `docs/learning/ci-cd/1[1-7]-*.md` (no afecta nada mas).

## Open Questions

- El detalle exacto del nivel Profesional se define en su propio cambio OpenSpec (`learning-cicd-profesional`); aqui solo se referencia por nombre para la navegacion del README.
- Las tareas 9.x/10.x de verificacion (anti-duplicacion y lint markdown) dependen de que herramientas de lint markdown esten disponibles en el repo; se resuelven en implementacion sin cambiar el diseno ni las specs.
