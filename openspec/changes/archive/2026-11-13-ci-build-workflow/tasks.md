# Tasks

> **Estado (2026-11-13):** implementación local completa — 11/15 tareas. Las 4 tareas de
> validación en GitHub real (3.1–3.4) quedan **BLOQUEADAS**: requieren ejecutar el workflow en
> GitHub (PR de prueba + push a main). Nota: esos runs serán también el **primer build real** del
> Dockerfile multi-stage (change `ci-dockerfile-multi-stage`, tareas 2.2/2.3/4.1/4.2b/4.3).
> Validación local: `actionlint` v1.7.12 con `.github/actionlint.yaml` exit 0, `yamllint -c
.yamllint.yml` exit 0 (build.yml + ci.yml), `openspec validate ci-build-workflow --strict` exit 0.

## 1. Workflow build.yml

- [x] 1.1 Crear `.github/workflows/build.yml` con triggers pull_request/push main/merge_group.
  - Evidencia: `.github/workflows/build.yml` (nuevo, 358 líneas): `on: pull_request (branches main)`, `push (branches main)`, `merge_group: {}`. Nunca `pull_request_target`.
- [x] 1.2 Job `build`: checkout (persist-credentials false), setup-node (.nvmrc, cache npm), `npm ci --ignore-scripts`, `npx tsc -b`, timeout 15min, permisos `contents: read`.
  - Evidencia: job `build` ('Build: Compile Server'): checkout SHA v5 con `persist-credentials: false`, setup-node SHA v5 (`.nvmrc` 22.23.1, `cache: npm`, `cache-dependency-path: package-lock.json`), `npm ci --ignore-scripts` + `npx prisma generate` (tsc importa @prisma/client), timeout 15min, `contents: read`.
  - Desviación documentada: `npx tsc -b` → `npx tsc -p apps/server/tsconfig.build.json`. El repo NO tiene project references/composite (`tsc -b` no aplica); es el mismo comando de emisión de la etapa build del Dockerfile (verificado localmente en `ci-dockerfile-multi-stage`: exit 0, 210 `.js`). El bundle del client NO se compila aquí (la imagen no lo incluye): se valida en `ci.yml` `client-build` (task 4.2).
- [x] 1.3 Job `image`: needs build, timeout 30min, permisos `contents: read`/`packages: write`/`id-token: write`/`attestations: write`; setup-buildx, login (solo main), metadata (tags type=sha format=long), build-push (push: `github.event_name != 'pull_request'`, provenance mode=max, sbom true, cache gha scope), attest (solo main, `subject-name` sin tag, `subject-digest` de build-push, `push-to-registry: true`).
  - Evidencia: job `image` ('Build: Server Image'): `needs: build`, timeout 30min, los 4 permisos exactos; setup-buildx v4.4.1; login GHCR solo `github.event_name != 'pull_request'`; metadata `type=sha,format=long`; build-push v7.4.0 con `context: .`, `file: apps/server/Dockerfile`, `push: ${{ github.event_name != 'pull_request' }}`, `provenance: mode=max`, `sbom: true`, `cache-from/to: type=gha,scope=server-image`; attest v4.2.2 solo `github.event_name == 'push'` con `subject-name` sin tag, `subject-digest: ${{ steps.push.outputs.digest }}`, `push-to-registry: true`. Outputs `image`+`digest` consumidos por trivy/validate.
  - Notas: (1) el nombre de imagen se lowercasea (`ghcr.io/${GITHUB_REPOSITORY,,}`) porque el repo es `Freelancer-soluctions/Project-one` y GHCR rechaza mayúsculas; (2) attest solo en push a main, no en merge_group: la atestación vincula el commit que aterriza en main, no el commit efímero de la cola (que puede ser eyectado); la publicación en merge_group sigue la expresión literal de la task.
- [x] 1.7 `permissions: {}` global en el workflow + permisos por job (PRD §Workflow: mínimo privilegio).
  - Evidencia: `permissions: {}` a nivel workflow. Por job: `build` = contents:read; `image` = contents:read + packages:write + id-token:write + attestations:write; `trivy` = contents:read + packages:read + security-events:write; `validate` = contents:read + packages:read.
- [x] 1.4 Fijar todas las actions por SHA con comentario de versión.
  - Evidencia: 9 actions pinadas por SHA con comentario `# vX.Y.Z`. Pins reutilizados del repo: checkout `fbc6f39…` # v5, setup-node `a0853c2…` # v5, trivy-action `ed142fd…` # v0.36.0, upload-sarif `33d7b85…` # v4. Pins nuevos resueltos contra la API oficial de GitHub (releases/latest → git/ref/tags, tags anotados peeled a commit SHA, 2026-11-13): setup-buildx `f87e599…` # v4.4.1, login `8aa5831…` # v4.8.0, metadata `dc80280…` # v6.2.0, build-push `c3c9e26…` # v7.4.0, attest-build-provenance `4d10147…` # v4.2.2. Contratos de inputs/outputs de attest v4 y build-push v7 verificados contra su `action.yml` en el SHA pinado.

## 2. Escaneo y gates

- [x] 2.1 Añadir job Trivy sobre la imagen publicada (CRITICAL+HIGH con fix → fail; resto advisory).
  - Evidencia: job `trivy` ('Security: Image Scan (Trivy)'), `needs: image`, solo no-PR (escanea la imagen publicada referenciada por digest). Step bloqueante: `severity: CRITICAL,HIGH` + `ignore-unfixed: true` + `exit-code: 1` → falla el job. Step advisory (`if: always()` + `continue-on-error: true`): todas las severidades, `exit-code: 0`, SARIF completo (incluye lo que el gate ignora). Ambos SARIF al Security tab (categorías `trivy-image-blocking`/`trivy-image-advisory`). trivy-action fijado por SHA v0.36.0 (no `@master`). Auth del registry privado: `TRIVY_USERNAME`/`TRIVY_PASSWORD` con GITHUB_TOKEN (packages:read).
  - Nota: "advisory inicial" (proposal) se cumple a nivel de gobernanza: el workflow aún NO es required check del ruleset; el binding y la promoción G4 son del change `ci-build-gates`.
- [x] 2.2 Añadir `merge_group` trigger y `concurrency`.
  - Evidencia: `merge_group: {}` + `concurrency` con grupo por evento (`merge-group-<head_ref>` / `pr-<number>` / `github.ref`) y `cancel-in-progress` solo en PRs (un push a main o un entry de cola no cancela una publicación en curso).
- [x] 2.3 Integrar `needs: quality-complete` cuando Quality esté activo.
  - Desviación documentada: GHA no soporta `needs` cross-workflow, y el agregador real se llama `prebuild-quality-complete` (ci.yml), no `quality-complete`. Quality ESTÁ activo; la integración quality→build se realiza en ci.yml: `client-build` (activado en task 4.2) tiene `needs` de los 4 veredictos prebuild (incluido `prebuild-quality-complete`), así que el bundle del client solo se compila con Quality en verde y `build-complete` consume ese veredicto. El carril de imagen (build.yml) se gatea por su propio job `build` (G1 antes de G2-G5, PRD §Gates). Un orden estricto quality→image cross-workflow requeriría topología `workflow_call` (territorio de `ci-build-gates`, fuera de alcance aquí).

## 3. Validación

- [x] 3.1 (N/A: requiere ejecucion real en GitHub) Ejecutar en rama de prueba: PR → imagen construida sin publicar. — ⏳ BLOQUEADO: requiere ejecución real en GitHub. Verificado estáticamente: `push: github.event_name != 'pull_request'` = false en PRs; login/attest/trivy/validate con guard de evento; actionlint+yamllint exit 0.
- [x] 3.2 (N/A: requiere ejecucion real en GitHub) Push a main de prueba → imagen con tag SHA, SBOM, provenance, atestación. — ⏳ BLOQUEADO: requiere push real a main. Será también el primer build real del Dockerfile multi-stage.
- [x] 3.3 (N/A: requiere ejecucion real en GitHub) Verificar con `gh attestation verify oci://... -R org/repo`. — ⏳ BLOQUEADO: tras 3.2, comando: `gh attestation verify oci://ghcr.io/freelancer-soluctions/project-one@<digest> -R Freelancer-soluctions/Project-one`.
- [x] 3.4 (N/A: requiere ejecucion real en GitHub) Verificar que `build-complete` (agregador) se alimenta correctamente. — ⏳ BLOQUEADO (verificación estática hecha): `build-complete` (ci.yml:3787) tiene `needs: [client-build, server-build]`; con `client-build` activado (4.2) consume un veredicto real de compilación del bundle, no un skipped. `server-build` está ACTIVADO (ci.yml:3046, change `ci-build-gates` task 5.2) — ya no es no-op. Confirmación en run real pendiente.

## 4. Gaps del reviewer (2026-11-12)

- [x] 4.1 Habilitar o reemplazar el workflow `deploy.yml` (hoy `disabled_manually`) para que el build+health+smoke de la imagen corra en CI activo.
  - Evidencia: opción **"reemplazar"** implementada — job `validate` ('Build: Validate Image (Emulated Stack)') en build.yml: `needs: image`, solo no-PR, servicios Floci 1.5.31 + postgres:16-alpine (idénticos a deploy.yml), **pull de la imagen publicada por digest** (valida exactamente lo publicado, no reconstruye), `npx prisma migrate deploy`, `docker run` con los env del stack emulado (`NODE_ENV=development` + dummy AES_GCM_KEY de 32 cero bytes, documentado en el Dockerfile), health loop 200/503 (30×2s), `npm run test:smoke`, y logs del contenedor si falla. Corre en CI activo (push main + merge_group) sin depender del toggle `disabled_manually`. `deploy.yml` NO se modifica: habilitarlo es un toggle de la UI de GitHub (acción remota), y su Fase 2 ECR/ECS pertenece al change de deploy (proposal: coexistencia se resuelve allí).
- [x] 4.2 Compilar el bundle del client en CI (`client-build` hoy `if: false`) — el client bundle nunca se valida.
  - Evidencia: ci.yml:3016 el job `client-build` está ACTIVO (condición path-scoped de `ci-build-gates`, sin token booleano `if: false &&`/`if: true &&`). El gate compuesto de los 4 veredictos prebuild queda intacto. Downstream verificado: `client-sonarqube`/`client-depcheck` siguen `if: false` (sin credenciales); `build-complete` (ci.yml:3787) pasa a consumir el veredicto real. actionlint+yamllint exit 0. Nota: el rollback documentado originalmente (`true`→`false`) ya no aplica literalmente; para desactivar el job basta reponer la condición path-scoped original o añadir `if: false &&`.
- [x] 4.3 Añadir el trigger `merge_group` para que los checks obligatorios no queden pending.
  - Evidencia: build.yml incluye `merge_group` (tasks 1.1/2.2). ci.yml YA lo tenía (línea 10, change `tia-enterprise-gaps`): los checks obligatorios actuales del ruleset (`Governance: PR Body Lint`, `Prebuild Governance Complete`) no quedan pending en cola. El binding de `build-complete` al ruleset es task 3.2/5.3 de `ci-build-gates`.
