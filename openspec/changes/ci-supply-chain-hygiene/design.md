# Design

## Context

Los jobs activos de los substages 2B/2C de `ci.yml` presentan debilidades de supply chain verificadas: (1) `actionlint-advisory` instala el binario vía `bash <(curl …/main/scripts/download-actionlint.bash) 1.7.12` — binario fijado, instalador apuntando a `main`; (2) `scancode-license-pr-diff` extrae la deny-list scrapeando `ci.yml` con grep/sed, y esa deny-list vive en la clave inline `deny-licenses` de `dependency-review`, marcada como deprecated por la acción (issue #938). Adicionalmente, una edición concurrente del working tree (2026-09-30, confirmada intencional por el usuario) removió el job bloqueante `actionlint` (2B) dejando un `needs` fantasma en el agregador quality — la consolidación se adopta en este change. Ver proposal.md para el detalle y docs/learning/`{pipeline-config-scan,license-policy,license-compliance}.md` para el estado documentado vigente.

Restricciones que condicionan el diseño:

- Los `name:` de los jobs tocados están bindeados a `required_status_checks` del ruleset `main` (donde aplique) — renombrarlos rompe el binding silenciosamente. Este change no toca `name:` (y verifica que `Quality: ActionLint` no quede como check requerido huérfano).
- La geometría de ci.yml es sensible (3 changes recientes sobre ella); el archivo ya cambió dos veces durante esta sesión. Toda edición parte de snapshot + conteo con método correcto (50 job-keys a 2 espacios con indentación exacta, excluyendo triggers).
- `ci-prebuild-lint` ya declara "SHALL execute `rhysd/actionlint@v1`" — desincronizado con la implementación real (instalador bash) incluso antes de este change.
- No hay jq en la máquina local (Windows); en runners ubuntu-latest sí. Las validaciones locales de YAML usan `node`, no jq.

## Goals / Non-Goals

**Goals:**

- Eliminar toda ejecución de scripts remotos (`curl | bash`) de los jobs del PR pipeline.
- Dejar la deny-list de licencias en una única fuente versionada consumida por ambas capas (dependency-review + ScanCode PR-diff), abandonando la clave deprecated.
- Consolidar el gate actionlint en un solo job (el advisory de 2C) y dejar el DAG sin referencias fantasma.
- Sincronizar los requirements con el mecanismo real de ejecución.

**Non-Goals:**

- Mover/renombrar jobs, cambiar `name:`, o tocar otros agregadores que no sean el quality (ver `ci-security-substage-alignment` para la geometría vigente).
- Pinneo por SHA de las demás actions (roadmap FASE 2 de zizmor, change `pipeline-config-scan`).
- Reactivar el gate bloqueante de actionlint (la graduación a blocking del advisory es la FASE 2 de `pipeline-config-scan`, no este change).
- Cambiar fases (FASE 1 advisory → FASE 2 blocking) de ningún otro gate.

## Decisions

- **D1 — Docker image en vez de instalar el binario.** `runs-on: ubuntu-latest` con Docker disponible; `rhysd/actionlint:1.7.12` existe en Docker Hub (verificado) y matchea la convención del repo (imágenes pinneadas a versión exacta: `zricethezav/gitleaks:v8.30.1`, `aboutcode/scancode-toolkit:32.5.0`). Alternativas: (a) pinnear el script instalador por commit SHA de `rhysd/actionlint` — conserva el `curl | bash`, solo lo estrecha; (b) `reviewdog/action-actionlint` — introduce una action de terceros nueva que además requeriría pinneo. El cambio es de mecanismo, no de versión: 1.7.12 se conserva (mismos flags y hallazgos).
- **D1b — Consolidación del gate actionlint (decisión del usuario, 2026-09-30).** El job bloqueante `actionlint` (2B) se remueve: un solo job ejecuta actionlint por PR (el advisory de 2C, con SARIF). Origen: edición concurrente del working tree (mtime 21:55) que removió el job dejando un needs fantasma en el agregador; al consultarlo, el usuario confirmó que fue intencional ("se eliminó uno que estaba en quality porque ya está presente en security") — adopción del hallazgo #7 del análisis externo. Trade-off consciente: mientras el advisory esté en `continue-on-error: true` (FASE 1), los hallazgos de actionlint no bloquean el merge — la evidencia migra a Code Scanning. Pendiente operacional: verificar/remover el check `Quality: ActionLint` de `required_status_checks` del ruleset si está registrado. Alternativa considerada: restaurar el job y Dockerizarlo — descartada porque duplicaría checkout+instalación por PR, exactamente lo que el #7 señalaba.
- **D2 — `docker run` en el job advisory, conservando flags y salidas.** `actionlint-advisory`: step `docker run --rm -v "$PWD:/repo" -w /repo rhysd/actionlint:1.7.12 -no-color -config-file .github/actionlint.yaml -format "$(cat .github/actionlint-sarif.tmpl)" .github/workflows/*.y*ml > actionlint.sarif`, seguido de las validaciones existentes (`test -s` + `jq -e .`) y uploads (SARIF Code Scanning + artifact 14d) intactos. Nota de apply: se usa `docker run` (patrón del job scancode del mismo workflow) en lugar de `uses: docker://` porque el `-format "$(cat …)"` requiere sustitución de shell, que `uses:` no ejecuta. Alternativa: workflow-level container env — descartado, infecta todos los steps del job innecesariamente.
- **D3 — `.github/license-policy.yml` como fuente única ejecutable.** Formato elegido: el config-schema de `dependency-review-action` (keys `deny-licenses`, etc., lista YAML) para que el archivo sea directamente consumible vía input `config-file` sin transformación, con header-comentario que apunte a `docs/learning/license-policy.md` (política narrativa, waivers, scopes). Alternativas: YAML custom con key `licenses.deny` (requeriría convertir antes de pasárselo a la acción — transformación = nuevo punto de fallo); JSON (menos legible para review humano en diff).
- **D4 — `config-file` reemplaza la clave inline.** `dependency-review-action` soporta `config-file` oficialmente (doc marketplace, Option 2; formato de lista YAML confirmado en docs oficiales); el resto de inputs (`fail-on-severity`, `comment-summary-in-pr`, `vulnerability-check`, `license-check`) se conservan inline y NO se mueven al archivo — mínimo diff, y la doc de la acción soporta mezclar inputs con config-file. La clave `deny-licenses` inline desaparece de ci.yml (verificado: única ocurrencia ejecutable).
- **D5 — Lectura ScanCode con `node -e`, no jq.** El step de evaluación reemplaza el bloque `DENY_LIST=$(grep … ci.yml …)` por lectura de `.github/license-policy.yml` con un parser YAML mínimo via `node -e` (los runners ubuntu traen node; el repo ya usa `node -e` en ese mismo step). Validación obligatoria: lista no vacía y 4 entradas — si el parseo falla, `::error::` + exit 1 (mismo contrato de fallo temprano que hoy). Se decide en el apply si el parser mínimo es suficiente o si el archivo se complementa con una key plana fácil de parsear; el spec solo exige "leer el archivo y validar el parseo".
- **D6 — `LICENSE_DENY_LIST` del digest queda intacto.** El spec `license-compliance` lo define como superconjunto documentado de la deny-list del gate; cambiarlo en este change violaría la coherencia tres-vías sin necesidad. Su drift ya está cubierto por la spec (omisiones/extensiones justificadas en `license-policy.md`).
- **D7 — Comentarios de trazabilidad sin fecha de change.** Los bloques editados llevan comentario breve explicando la nueva fuente/mecanismo y la consolidación (patrón de la sesión), sin la fórmula "change ci-supply-chain-hygiene (fecha)" — ese patrón reservó `ci-security-substage-alignment` para trazabilidad de reubicación física; aquí no hay movimiento de jobs.

## Risks / Trade-offs

- [Config-file cambia el modo de fallo ante config inválida: la acción puede comportarse distinto ante un YAML malformado que ante la clave inline] → Validación local del YAML antes de push (parseo + los 4 SPDX), y primer run del job observado en el PR de implementación antes del merge.
- [Los hallazgos de actionlint dejan de bloquear el PR tras la consolidación] → Decisión consciente del usuario; la evidencia queda en Code Scanning (SARIF) y el artifact del PR. La FASE 2 de `pipeline-config-scan` (quitar `continue-on-error` al advisory + añadirlo al agregador security) restablece el gate bloqueante. Anotar en quality-gates.md.
- [`Quality: ActionLint` huérfano en required_status_checks del ruleset] → Verificar post-push: si el ruleset lo tiene registrado, el PR queda bloqueado esperando un check que nunca corre; removerlo del ruleset en el mismo ciclo (paso operacional documentado en tasks).
- [Docker pull de `rhysd/actionlint` añade latencia (~2-5s pull) frente al instalador bash] → Aceptable: timeout del job advisory, y se gana la eliminación de la ejecución de scripts remotos. La imagen `rhysd/actionlint` es la oficial del autor del binario.
- [El parser `node -e` del D5 es código inline en el workflow (no reutilizable ni testeable aparte)] → Mantener la key de deny-list plana y simple en el YAML; si crece la política, extraer a script versionado en `scripts/security/` (anotado como seguimiento, no en este change).
- [Desincronización futura entre `.github/license-policy.yml` y `docs/learning/license-policy.md`] → La spec `license-compliance` exige igualdad exacta; el delta la mantiene sobre la nueva fuente. El primer run de `scancode-license-pr-diff` imprime la lista efectiva en el log (conservado), lo que hace visible el drift en cada PR.

## Migration Plan

1. Crear `.github/license-policy.yml` (D3) — archivo nuevo, sin impacto en runs existentes.
2. Editar ci.yml tras snapshot `.tmp/ci.yml.pre-supply-chain-hygiene` + conteo de jobs con método correcto (50, excluyendo triggers) — un solo commit con todas las ediciones atómicas (needs del agregador, header 2B, job advisory a Docker, dependency-review y scancode a policy file).
3. Validar: `actionlint` local (per-file, debe salir 0 — el needs fantasma se elimina), conteo estable, `name:` intactos, y `openspec validate --specs --strict` verde.
4. Primer run observado en el PR (jobs dependency-review + scancode-license-pr-diff + actionlint-advisory en verde/hallazgos esperados) antes del merge; verificar que el check `Quality: ActionLint` no esté en `required_status_checks` del ruleset (removerlo del ruleset si lo está). Rollback: revert del commit único — el archivo nuevo queda huérfano sin efecto.
