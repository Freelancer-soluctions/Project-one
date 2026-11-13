# Tasks

## 1. Workflow build.yml

- [ ] 1.1 Crear `.github/workflows/build.yml` con triggers pull_request/push main/merge_group.
- [ ] 1.2 Job `build`: checkout (persist-credentials false), setup-node (.nvmrc, cache npm), `npm ci --ignore-scripts`, `npx tsc -b`, timeout 15min, permisos `contents: read`.
- [ ] 1.3 Job `image`: needs build, timeout 30min, permisos `contents: read`/`packages: write`/`id-token: write`/`attestations: write`; setup-buildx, login (solo main), metadata (tags type=sha format=long), build-push (push: `github.event_name != 'pull_request'`, provenance mode=max, sbom true, cache gha scope), attest (solo main, `subject-name` sin tag, `subject-digest` de build-push, `push-to-registry: true`).
- [ ] 1.7 `permissions: {}` global en el workflow + permisos por job (PRD §Workflow: mínimo privilegio).
- [ ] 1.4 Fijar todas las actions por SHA con comentario de versión.

## 2. Escaneo y gates

- [ ] 2.1 Añadir job Trivy sobre la imagen publicada (CRITICAL+HIGH con fix → fail; resto advisory).
- [ ] 2.2 Añadir `merge_group` trigger y `concurrency`.
- [ ] 2.3 Integrar `needs: quality-complete` cuando Quality esté activo.

## 3. Validación

- [ ] 3.1 Ejecutar en rama de prueba: PR → imagen construida sin publicar.
- [ ] 3.2 Push a main de prueba → imagen con tag SHA, SBOM, provenance, atestación.
- [ ] 3.3 Verificar con `gh attestation verify oci://... -R org/repo`.
- [ ] 3.4 Verificar que `build-complete` (agregador) se alimenta correctamente.

## 4. Gaps del reviewer (2026-11-12)

- [ ] 4.1 Habilitar o reemplazar el workflow `deploy.yml` (hoy `disabled_manually`) para que el build+health+smoke de la imagen corra en CI activo.
- [ ] 4.2 Compilar el bundle del client en CI (`client-build` hoy `if: false`) — el client bundle nunca se valida.
- [ ] 4.3 Añadir el trigger `merge_group` para que los checks obligatorios no queden pending.
