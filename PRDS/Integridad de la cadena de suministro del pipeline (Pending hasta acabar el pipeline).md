# PRD — Integridad de la cadena de suministro del pipeline

Oct 19, 2026 · @Johan

## Resumen y problema

El pipeline ya valida el código, pero todavía no puede demostrar qué artefacto se desplegó ni quién lo construyó. Este PRD define cómo producir, exigir y archivar esa evidencia con tres controles: SBOM, firma con Cosign y provenance.

La regla que ordena todo: el pipeline **produce** (Stages 3 y 5), governance **exige** (gate pre-deploy) y el archivo **conserva** (evidencia). Hoy el diagrama de gobernanza mezcla las tres funciones en una sola línea.

Es el momento de definirlo porque tests y build siguen con `if: false` y el Stage 5 vive en workflows desactivados (`security.yml`, `deploy.yml`). Se puede diseñar antes de activar, no después.

## Objetivos y no-objetivos

Cuatro objetivos, propuestos y ajustables:

1. Todo artefacto desplegable (la imagen de `apps/server` y el bundle `client-dist`) sale firmado, con SBOM y provenance ligados a su digest.
2. Ningún despliegue ocurre sin verificar firma, identidad del builder, SBOM y provenance.
3. Lo que pueda validarse sin artefacto se valida en local en segundos, y cada check local tiene un espejo bloqueante en CI.
4. Cada release deja evidencia archivada: digest, attestations y quién aprobó.

Fuera de alcance:

- Firmar o emitir provenance desde la laptop.
- Reemplazar SCA o license compliance; ya existen (`dependency-review`, ScanCode).
- Certificación SLSA formal y admission controller en Kubernetes, hasta definir el destino de despliegue.
- Notarización de binarios (Apple, Windows).

## Principios de diseño

Un solo criterio ordena el diseño: separar quién produce la evidencia, quién la exige y quién la conserva.

1. **Producir ≠ exigir ≠ archivar.** El pipeline genera SBOM, firma y provenance; governance solo verifica y registra.
2. **Local es feedback; CI es enforcement.** Un hook se salta con `--no-verify`, así que todo check local tiene un espejo bloqueante en CI.
3. **La identidad es el workflow, no la persona.** La firma es keyless con el token OIDC del workflow; una firma desde una laptop no prueba que lo construyó el CI.
4. **Se firma y se verifica por digest, nunca por tag.** Los tags son mutables.
5. **El gate real está al consumir.** Que el paso de firma pase no prueba nada; protege verificar con identidad e issuer fijados antes de desplegar.
6. **Se promueve el mismo digest de staging a producción.** No se reconstruye.
7. **Advisory antes de bloquear.** Es el patrón FASE 1 / FASE 2 que ya usa `ci.yml`: 2–4 semanas sin falsos positivos antes de bloquear.

## Estado actual

Hoy no hay ningún artefacto que firmar: build y tests están apagados y el Stage 5 vive fuera de `ci.yml`. Fuente: `ci.yml`, revisado el 2026-10-19.

| Área                                   | Estado hoy                                                            | Brecha                                                                |
| -------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Build (`client-build`, `server-build`) | `if: false`; `server-build` es un no-op                               | No hay artefacto ni digest                                            |
| Tests (unit, integración, smoke, e2e)  | `if: false`                                                           | `prebuild-unit-tests-complete` reporta éxito aunque todo esté skipped |
| Stage 5 (firma, publicación)           | En `security.yml` y `deploy.yml`, desactivados                        | Sin firma ni provenance                                               |
| SBOM                                   | No se genera en `ci.yml`                                              | Sin inventario por release                                            |
| Hadolint (`apps/server/Dockerfile`)    | Advisory (FASE 1)                                                     | No bloquea                                                            |
| Pin de Actions por SHA                 | Solo `setup-uv`                                                       | El resto usa tags mutables                                            |
| Agregador `ci-complete`                | Sale con éxito si hay jobs cancelados                                 | Una cancelación manual puede dar check verde                          |
| Licencias y CVE                        | `dependency-review` bloquea; ScanCode y `lockfile-audit` son advisory | Ya cubierto, fuera de este PRD                                        |

## Requisitos por control

Cada control se define en tres puntos: qué se hace en local, qué produce el CI y qué gate lo exige.

### SBOM

- **Formato:** CycloneDX JSON (propuesta); SPDX solo si un cliente lo exige.
- **Local:** `npm sbom` o `syft dir:.` bajo demanda. Es advisory y no firma nada.
- **CI:** el Stage 3 genera el SBOM desde la imagen construida (Syft); el Stage 5 lo adjunta al digest como attestation con `cosign attest`.
- **Gate:** el SBOM existe, no está vacío y cada componente trae versión y purl. Si no, falla el job.

### Firma con Cosign

- **Modo:** keyless con el token OIDC del workflow. `id-token: write` solo en el job de firma.
- **Local:** no se firma. Un script `verify-image.sh` con la identidad esperada ya escrita sirve para inspección manual.
- **CI:** firma por digest tras publicar en el registry. La identidad queda como ruta del workflow más ref.
- **Gate:** antes de desplegar, `cosign verify` con `--certificate-identity` y `--certificate-oidc-issuer` (`https://token.actions.githubusercontent.com`). Verificar solo el issuer no basta, porque cualquier workflow de GitHub pasaría. Quedan prohibidas las regex laxas sobre la identidad.

### Provenance

- **Emisor:** el builder, nunca una persona. La herramienta depende de la decisión D1 (`slsa-github-generator` o attestations nativas de GitHub).
- **Local:** no se genera. Solo se prepara la reproducibilidad: `npm ci`, lockfile sincronizado e imagen base fijada por digest.
- **CI:** se emite en el Stage 5 y se adjunta al digest firmado.
- **Gate:** `cosign verify-attestation --type slsaprovenance` comprueba builder, repo, ref (`main` o tag) y que el digest coincida con el que pasó por staging.

Los comandos son de referencia: se validan contra la versión de Cosign que se fije (ver riesgos).

## Matriz de gates

Propuesta de ocho gates, uno por punto de control. Los de CI y deploy pasan de advisory a bloqueantes por fase (ver plan).

| ID  | Dónde                   | Criterio                                                                   | Tipo                                        | Si falla                         |
| --- | ----------------------- | -------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------- |
| G0  | Local, pre-push         | `npm ci --dry-run` pasa; el Dockerfile fija la base por digest             | Advisory (se puede saltar)                  | Avisa; CI lo repite              |
| G1  | CI, Stage 3             | SBOM presente, no vacío, componentes con versión y purl                    | Advisory en Fase 1; bloqueante desde Fase 2 | Falla el job; no se publica      |
| G2  | CI, Stage 5             | Digest presente; firma emitida sobre el digest, no sobre un tag            | Bloqueante                                  | No se publica                    |
| G3  | CI, Stage 5             | Self-check: `cosign verify` del propio job pasa                            | Bloqueante                                  | Falla el job                     |
| G4  | Pre-deploy a staging    | Firma válida con identidad e issuer fijados; SBOM y provenance verificados | Bloqueante desde Fase 3                     | No despliega                     |
| G5  | Pre-deploy a producción | G4 sobre el mismo digest que pasó por staging                              | Bloqueante desde Fase 3                     | No despliega                     |
| G6  | Post-deploy             | Evidencia archivada: digest, attestations, aprobador y fecha               | Bloqueante para cerrar la release           | Alerta; la release queda abierta |
| G7  | Semanal                 | Re-escaneo del SBOM archivado contra CVEs nuevos                           | Advisory                                    | Abre un issue                    |

## Estrategia local (shift-left)

El shift-left es limitado a propósito: solo se mueve a local lo que no necesita un artefacto construido, y cada check tiene su espejo en CI.

| Control               | En local                                                           | Espejo en CI                              | Se puede saltar    |
| --------------------- | ------------------------------------------------------------------ | ----------------------------------------- | ------------------ |
| SBOM                  | `npm sbom` o `syft dir:.` bajo demanda (script nuevo `sbom:check`) | G1 sobre la imagen construida             | Sí; no bloquea     |
| Reproducibilidad      | `npm ci --dry-run` y lockfile sincronizado en `pre-push`           | `npm ci` en `setup-monorepo`              | Sí (`--no-verify`) |
| Dockerfile            | Hadolint opcional                                                  | `containerfile-lint` (advisory hoy)       | Sí                 |
| Base image por digest | Script de pre-push que detecta `FROM` sin `@sha256`                | Hadolint con la política `.hadolint.yaml` | Sí                 |
| Cosign                | Versión fija instalada y `verify-image.sh` para inspección         | G4 y G5                                   | No aplica          |
| Provenance            | Nada: solo la emite el builder                                     | G4 y G5                                   | No aplica          |

No va en local: firmar, emitir provenance ni archivar evidencia. Una firma local tendría otra identidad y no serviría como prueba de que lo construyó el CI.

La versión de Cosign y de Syft se fija en el devcontainer o en el README, para que local y CI usen las mismas.

## Gobernanza: política, enforcement y evidencia

Governance cubre tres cosas y ninguna es producir el artefacto: una política escrita, un gate que la aplica y un archivo que la prueba.

- **Política.** Un documento versionado (`docs/learning/supply-chain-policy.md`, junto a `license-policy.md`) con la regla: ningún artefacto se despliega sin firma válida de nuestro workflow, SBOM y provenance del mismo digest. Dice también quién puede cambiar la identidad esperada.
- **Enforcement.** G4 y G5 son jobs de verificación que corren antes del job de deploy; el deploy depende de ellos con `needs:`. Los environments `staging` y `production` añaden la aprobación manual.
- **Evidencia.** Por cada release se guardan el digest, el bundle de firma, el SBOM, el provenance, el aprobador y la fecha, en un almacén inmutable. La retención queda por definir (D4).

## Requisitos no funcionales y seguridad del propio pipeline

El flujo de firma es el objetivo más atractivo de un ataque a la cadena de suministro, así que se endurece primero.

- **Permisos mínimos.** `contents: read` por defecto; `id-token: write` y `packages: write` solo en el job de firma.
- **Actions fijadas por SHA** en todo el flujo de firma (instalador de Cosign, Syft, attest). Los tags de terceros son mutables.
- **Binarios con versión exacta.** Sin `curl | bash` contra `main`; imágenes Docker por tag exacto o por digest.
- **Se firma solo en `main` y en tags,** no en cada PR. Así el costo en minutos de Actions no crece por PR y los PR de forks no tocan el flujo de firma.
- **Fail-closed.** Sin `continue-on-error` en G2 a G5 una vez alcanzada su fase bloqueante.
- **Presupuesto de tiempo (propuesto):** SBOM y firma juntos, menos de 5 minutos por release; verificación pre-deploy, menos de 1 minuto.
- **Privacidad de la identidad.** La firma keyless publica la identidad del workflow en un log de transparencia público; si el repo es privado, esto se decide antes (D2).

## Criterios de aceptación y métricas

El PRD se considera implementado cuando pasan estas pruebas, incluidas las negativas:

| #   | Prueba                                                              | Resultado esperado                                                          |
| --- | ------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| A1  | Desplegar una imagen sin firma                                      | G4 la rechaza                                                               |
| A2  | Desplegar una imagen firmada por otro workflow o por un fork        | La verificación falla por identidad                                         |
| A3  | Publicar un SBOM vacío o sin purl                                   | G1 falla                                                                    |
| A4  | Promover a producción un digest distinto al de staging              | G5 falla                                                                    |
| A5  | Renombrar el workflow de firma sin actualizar la identidad esperada | G4 falla y el mensaje nombra la identidad esperada                          |
| A6  | Cerrar una release                                                  | Existe el paquete de evidencia: digest, firma, SBOM, provenance y aprobador |

Métricas, con objetivos propuestos:

- Releases con las tres attestations: 100%.
- Tiempo añadido por release: menos de 5 minutos.
- Falsos bloqueos por trimestre, después de la Fase 3: 0.
- Tiempo para responder "¿esta librería está en producción?" con el SBOM archivado: menos de 5 minutos.

## Riesgos y mitigaciones

El mayor riesgo es activar gates sobre un pipeline que aún no ejecuta build ni tests; por eso la Fase 0 va primero.

| Riesgo                                                                                                                  | Impacto                                     | Mitigación                                                                 |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------- |
| Build y tests apagados                                                                                                  | Los agregadores dan verde sin ejecutar nada | Fase 0 antes de cualquier otra                                             |
| Cambios de formato entre versiones de Cosign (Cosign 3 introdujo un bundle nuevo; las fuentes consultadas no lo cubren) | Gates rotos tras actualizar                 | Fijar la versión y probar cada upgrade en un PR con un artefacto de prueba |
| Renombrar el workflow de firma cambia la identidad                                                                      | Se rechazan imágenes legítimas              | Identidad esperada en una sola variable y prueba A5                        |
| Repo privado con firma keyless pública                                                                                  | Se filtra el nombre del repo                | Resolver D1 y D2 antes de la Fase 2                                        |
| Único contribuidor: el aprobador es quien escribe el código                                                             | La aprobación manual no separa funciones    | Documentarlo como riesgo aceptado o añadir una segunda cuenta (D6)         |
| Bypass local con `--no-verify`                                                                                          | Se salta G0                                 | Todo check local tiene espejo en CI                                        |
| Tags mutables de Actions de terceros                                                                                    | Compromiso del flujo de firma               | Pin por SHA                                                                |
| Falsos positivos en G1                                                                                                  | Fricción y tentación de saltarlo            | Fase advisory de 2–4 semanas y allowlist versionada                        |

## Decisiones abiertas

Seis decisiones por resolver; D1 y D2 bloquean la Fase 2.

| #   | Decisión                          | Opciones                                                                     | Recomendación                                                                                                                                                                                           |
| --- | --------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Herramienta de firma y provenance | Cosign keyless con `slsa-github-generator`, o attestations nativas de GitHub | Depende de D2                                                                                                                                                                                           |
| D2  | ¿El repo es privado?              | Sí o no                                                                      | Si es privado, la firma keyless con Sigstore público expone el nombre del repo; las attestations nativas usan una instancia privada pero, por lo que sé, exigen GitHub Enterprise Cloud (por confirmar) |
| D3  | Destino de despliegue y registry  | GHCR, ECR u otro; Kubernetes o no; `client-dist` como imagen o como blob     | Define si hay admission controller y cómo se firma `client-dist`                                                                                                                                        |
| D4  | Retención de la evidencia         | 1 año, 3 años o hasta fin de vida de la release                              | Alinearla con lo que pidan los clientes B2B, si piden algo                                                                                                                                              |
| D5  | Formato del SBOM                  | CycloneDX o SPDX                                                             | CycloneDX salvo exigencia contraria                                                                                                                                                                     |
| D6  | Aprobador de producción           | Misma cuenta o segunda cuenta                                                | Riesgo aceptado y documentado al inicio                                                                                                                                                                 |

### Fuentes

- [Sigstore y Cosign keyless en GitHub Actions (QCecuring)](https://www.qcecuring.com/blog/sigstore-cosign-keyless-github-actions): flujo keyless, permisos y verificación con identidad e issuer.
- [Sigstore supply chain security (OneUptime)](https://oneuptime.com/blog/post/2026-01-25-sigstore-supply-chain-security/view): attestations de SBOM y provenance, y policy-controller.
- `ci.yml` del repo, revisado el 2026-10-19.
