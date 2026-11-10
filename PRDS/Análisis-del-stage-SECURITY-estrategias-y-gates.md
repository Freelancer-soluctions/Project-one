# Análisis del stage SECURITY: estrategias y gates

Nov 10, 2026 · @Johan

## Resumen

El stage SECURITY cubre bien los controles, pero mezcla en un mismo nivel dónde corre cada job, si bloquea y quién genera la evidencia; ordenar esas tres cosas es el cambio de mayor valor.

Se interpreta `[DD]` como defense in depth, `[SL]` como shift-left y RA-5 como el control de monitoreo de vulnerabilidades de NIST 800-53. Los tres cambios que más importan:

1. **Separar secretos en dos líneas.** Shift-left real (pre-commit y push protection) y escaneo de historial completo (CI y programado). Bloquean siempre, sin fase advisory.
2. **Distinguir generador de verificador en SCA.** Dependabot genera alertas y PRs; el gate es OSV-Scanner, Snyk o Dependency Review corriendo en el PR.
3. **Un agregador único.** Los nueve jobs alimentan `security-complete`, que junto a `ci-complete` es lo único que el ruleset exige.

El detalle de cada punto, con la estrategia empresarial que lo respalda, está en las secciones siguientes. Las recomendaciones de ubicación y de gates son práctica habitual de la industria aplicada a tu diagrama; los umbrales concretos se calibran con corridas reales.

## Estado objetivo y modelo de madurez

El objetivo enterprise es pasar de herramientas que corren a controles que bloquean, se miden y dejan evidencia; hoy el stage está entre el nivel 1 y el 2.

| Nivel | Nombre     | Característica                                                                                     |
| ----- | ---------- | -------------------------------------------------------------------------------------------------- |
| 0     | Ad hoc     | Escaneos manuales o inexistentes                                                                   |
| 1     | Básico     | Las herramientas corren en CI, en modo advisory                                                    |
| 2     | Gestionado | Gates bloqueantes con baseline, excepciones con caducidad, SLA de remediación                      |
| 3     | Enterprise | Evidencia retenida, métricas, runbooks, políticas como código, mapeo a marcos y revisión periódica |

La columna «Hoy» resume lo visto en el diagrama y en el `ci.yml` revisado antes; conviene confirmarla.

| Dimensión          | Hoy                                                                                    | Objetivo (nivel 3)                                                                 |
| ------------------ | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Cobertura          | Nueve familias de control en el diagrama                                               | Las mismas, con ubicación por capa definida                                        |
| Enforcement        | SAST con baseline; licencias en Fase 1 advisory; agregador que no falla al saltar jobs | Todos los controles de PR bloqueantes mediante `security-complete` y `ci-complete` |
| Shift-left         | Hooks locales (firma, lint) y SAST L1                                                  | Cada control local con espejo en CI; secretos con push protection                  |
| Monitoreo continuo | SAST y licencias semanales                                                             | También SCA y secretos programados, con SLA                                        |
| Excepciones        | Sin política documentada                                                               | Archivo versionado, con dueño y caducidad                                          |
| Evidencia          | Artefactos de 14 y 90 días                                                             | Retención definida por tipo de evidencia y reporte mensual                         |
| Gobierno           | Un mantenedor, sin roles escritos                                                      | Roles documentados, aunque los ocupe una persona                                   |
| Métricas           | No definidas                                                                           | Siete métricas con revisión mensual                                                |

Las secciones siguientes describen cada parte; las finales (marcos, estructura del repo, roles, runbooks y definición de listo) son las que cierran la brecha hacia el nivel 3.

## Arquitectura de referencia

El flujo tiene cuatro zonas; solo la de pull request bloquea el merge, y lo programado y la evidencia lo respaldan sin detenerlo.

&#91;embedded content: arquitectura de referencia · 4 zonas, 1 agregador\]

Los jobs de pull request alimentan a security-complete; lo local da feedback antes del push y lo programado detecta lo que cambia con el tiempo.

## Estrategias que se usan en empresas

Siete estrategias aparecen de forma repetida en pipelines profesionales de seguridad.

| #   | Estrategia                                    | En qué consiste                                                                                                                                             | Ya la tienes                    |
| --- | --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| E1  | Capas por costo y latencia                    | El mismo control corre en local (segundos, solo lo que cambió), en PR (minutos, solo el diff) y programado (completo, sin diff)                             | Solo en SAST                    |
| E2  | Shift-left como feedback, CI como enforcement | Los hooks locales se pueden saltar con `--no-verify`; todo check local necesita un espejo en CI que bloquee                                                 | Parcial                         |
| E3  | Baseline y fail-on-new                        | En un repo con deuda, el PR falla solo por hallazgos nuevos; la deuda va a un backlog con plazos                                                            | SAST (`--baseline-commit`)      |
| E4  | Advisory y luego bloqueante                   | Una ventana de 2 a 4 semanas de corridas limpias antes de bloquear. No aplica a secretos: un secreto filtrado exige rotación, no calibración                | Licencias (Fase 1)              |
| E5  | Monitoreo continuo además del gate            | Una dependencia sin cambios puede volverse vulnerable mañana; lo ve el escaneo programado y las alertas sobre la rama principal, no el PR (sentido de RA-5) | SAST semanal, licencias semanal |
| E6  | Excepciones versionadas                       | Las supresiones viven en un archivo del repo con justificación, dueño y fecha de caducidad; cambiarlo requiere revisión de CODEOWNERS                       | No documentado                  |
| E7  | Evidencia con retención                       | Reportes como artefactos con retención definida                                                                                                             | Sí (14 y 90 días)               |

## Dónde vive cada job y su gate

Solo secretos, SAST y SCA justifican las tres capas; el resto vive en una o dos.

| Job                              | Local (shift-left)                                     | PR                                          | Programado                  | Gate recomendado                          |
| -------------------------------- | ------------------------------------------------------ | ------------------------------------------- | --------------------------- | ----------------------------------------- |
| Secretos                         | Pre-commit sobre lo staged y push protection de GitHub | Diff del PR                                 | Historial completo          | Bloquea siempre, sin fase advisory        |
| SAST                             | Pre-commit sobre lo staged                             | Diff con baseline, fail-on-new              | Completo semanal            | Alta y crítica nuevas bloquean            |
| SCA (lockfile)                   | Opcional, bajo valor                                   | Sí, sobre el lockfile                       | Sí, sobre la rama principal | Severidad más explotabilidad, con SLA     |
| Dependency Review                | No                                                     | Sí, es nativo del PR                        | No                          | Vulnerabilidad y licencia nuevas bloquean |
| Licencias (ScanCode)             | No                                                     | Diff ACMR con deny-list                     | Repo completo               | Deny-list bloquea; `unknown` avisa        |
| IaC (Checkov, tfsec, KICS)       | Opcional                                               | Solo si cambian archivos de infraestructura | Completo                    | Alta y crítica bloquean                   |
| Hadolint                         | Pre-commit                                             | Sí, antes del build                         | No                          | Error bloquea, estilo avisa               |
| actionlint y zizmor              | Pre-commit                                             | Si cambia `.github/`                        | No                          | Bloquea                                   |
| Typosquatting (Socket, GuardDog) | No                                                     | Cuando el PR añade o cambia dependencias    | No                          | Bloquea un paquete nuevo sospechoso       |

La regla práctica: lo barato y local va en pre-commit como feedback; lo que protege el merge va en el PR como bloqueo; lo que mide deriva en el tiempo va programado y no bloquea el merge.

## Gates transversales

Ocho gates se piden con frecuencia en este tipo de stage; los tres primeros evitan la mayor parte del ruido.

| #   | Gate                               | Qué exige                                                                                                         |
| --- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| G1  | Umbral de severidad                | Alta y crítica bloquean; media y baja avisan                                                                      |
| G2  | Explotabilidad                     | Se prioriza lo que tiene exploit conocido o es alcanzable, no solo el CVSS; reduce mucho el ruido en SCA          |
| G3  | Solo hallazgos nuevos en PR        | Baseline contra la rama base                                                                                      |
| G4  | SLA de remediación                 | Plazo por severidad, medido por el escaneo programado                                                             |
| G5  | Lockfile obligatorio y consistente | Un PR que cambia `package.json` sin actualizar el lockfile falla; la instalación en CI es reproducible (`npm ci`) |
| G6  | Herramienta caída = fallo          | Con un mensaje distinto de un hallazgo                                                                            |
| G7  | Agregador estricto                 | Un job obligatorio saltado o cancelado deja el check requerido en rojo (el problema que tenía `ci.yml`)           |
| G8  | Excepciones con caducidad          | Una supresión vencida vuelve a fallar                                                                             |

## Observaciones sobre el diagrama actual

Ocho puntos concretos, ordenados de mayor a menor impacto.

| #   | Línea del diagrama                           | Observación                                                                                                              | Acción                                                                                                       |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| 1   | Secrets Detection full-repo + history `[SL]` | El historial completo no es shift-left; el shift-left real es pre-commit y push protection                               | Separar en dos líneas                                                                                        |
| 2   | SCA (Dependabot/Snyk/OSV-Scanner)            | Dependabot genera alertas y PRs; no es un gate. Mezcla generador y verificador                                           | Dependabot como generador; OSV-Scanner o Snyk como verificador en PR                                         |
| 3   | SCA y Dependency Review                      | Se solapan: Dependency Review ya cubre vulnerabilidad y licencia sobre el diff de manifiestos                            | Un bloqueante por capa; el otro como monitoreo programado                                                    |
| 4   | License Compliance, dual job                 | El diseño es correcto. ScanCode mira archivos fuente y vendor; las licencias de dependencias las cubre Dependency Review | Definir antes de la Fase 2 qué pasa con `LicenseRef-scancode-unknown*`: un warning que nadie revisa es ruido |
| 5   | Pipeline config scan (actionlint, zizmor)    | zizmor detecta también inyección de expresiones y permisos excesivos, no solo actions sin fijar                          | Pasarlo pronto a bloqueante: protege a todos los demás controles                                             |
| 6   | Typosquatting (Socket, GuardDog)             | Solo tiene sentido cuando el PR toca dependencias                                                                        | Condicionarlo a cambios en manifiestos o lockfile                                                            |
| 7   | IaC (Checkov, tfsec, KICS)                   | Aplica solo si existen Terraform, Kubernetes u otros archivos de infraestructura                                         | Confirmar qué tipos de archivo existen en el repo antes de adoptarlo                                         |
| 8   | Los nueve jobs, sin agregador visible        | Cada job suelto es un check que el ruleset tendría que exigir por nombre                                                 | `security-complete` como único check requerido, junto a `ci-complete`                                        |

## Secretos en profundidad

Un secreto filtrado se trata como incidente, no como hallazgo: el gate bloquea siempre y la respuesta empieza por revocar, no por limpiar el historial.

| Capa | Dónde                     | Alcance              | Propósito                                                      |
| ---- | ------------------------- | -------------------- | -------------------------------------------------------------- |
| 1    | Pre-commit                | Solo archivos staged | Feedback inmediato; se puede saltar con `--no-verify`          |
| 2    | Push protection de GitHub | Cada push            | Bloqueo del lado del servidor, no depende del equipo local     |
| 3    | PR                        | Diff del PR          | Espejo de la capa 1; bloquea el merge                          |
| 4    | Programado                | Historial completo   | Detecta lo que entró antes de tener el control y reglas nuevas |

**Herramientas.** Gitleaks es rápido y encaja bien en pre-commit y PR. TruffleHog puede verificar si una credencial sigue activa contra el proveedor, lo que reduce falsos positivos en el escaneo del historial. Usar ambas en capas distintas es una práctica común, no un requisito.

**Respuesta ante una filtración** (a documentar como runbook):

1. Revocar o rotar la credencial. Reescribir el historial no la vuelve segura: ya pudo copiarse.
2. Revisar los registros del proveedor por uso indebido desde la fecha de la filtración.
3. Purgar el historial solo si hace falta, y coordinar el reemplazo de todos los clones.
4. Registrar el incidente y añadir una regla o prueba para que no se repita.

**Falsos positivos.** Se suprimen por huella del hallazgo (archivo, regla y valor), nunca con una expresión regular amplia ni por carpeta completa. Los valores falsos de tests se aceptan por huella individual, con la excepción versionada que describe la sección de excepciones.

**Detalles de CI.** El escaneo del historial necesita clonado completo (`fetch-depth: 0`). Los reportes se guardan con el valor del secreto redactado, para que el artefacto no sea una segunda filtración.

## SAST en tres capas

El diagrama nombra L1 (pre-commit), L3 (PR con baseline) y el escaneo semanal completo; falta confirmar qué es L2, que podría ser un pre-push.

| Capa    | Alcance                 | Mecanismo                                            | Resultado                                   |
| ------- | ----------------------- | ---------------------------------------------------- | ------------------------------------------- |
| L1      | Archivos staged         | Pre-commit, con diff                                 | Feedback; no bloquea el merge               |
| L3      | Diff del PR             | `--baseline-commit` contra la rama base, fail-on-new | Alta y crítica nuevas bloquean; media avisa |
| Semanal | Repo completo, sin diff | Programado (RA-5)                                    | No bloquea; abre issue con SLA              |

**Por qué las tres.** Un escaneo limitado al diff no ve hallazgos que cruzan archivos ni reglas nuevas aplicadas a código viejo; por eso existe el semanal. Y el semanal por sí solo llega tarde; por eso existe el PR.

**Ajuste de reglas.** La baseline es un archivo versionado en el repo; no se regenera sin revisión. Cada regla tiene un mapa de severidad (qué es alta, qué es media) decidido una vez y revisado trimestralmente. Las supresiones en línea llevan una referencia a la excepción que las justifica.

**Salida legible.** El job publica archivo, línea, regla y severidad en el resumen del job; el autor corrige sin abrir logs. Si se dispone de Code Scanning, se sube el SARIF para ver las anotaciones en el PR.

**Gate.** Falla con severidad alta o crítica nueva, y también si la herramienta falla por error propio, con un mensaje distinto. El detalle de dependencias y cancelaciones está en el PRD del early-abort gate.

## SCA y Dependency Review

El SCA se opera con cuatro piezas que cumplen funciones distintas: generar actualizaciones, verificar el PR, monitorear la rama principal y priorizar.

| Pieza             | Herramienta típica                                      | Función                                                             | ¿Bloquea?              |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------------------------- | ---------------------- |
| Generador         | Dependabot (alertas, security updates, version updates) | Abre PRs de actualización y alertas sobre la rama principal         | No                     |
| Verificador en PR | Dependency Review, OSV-Scanner o Snyk sobre el lockfile | Falla si el PR introduce una vulnerabilidad o licencia no permitida | Sí                     |
| Monitoreo         | Escaneo programado de la rama principal                 | Detecta CVEs nuevos en dependencias que no cambiaron                | No; abre issue con SLA |
| Priorización      | CVSS, EPSS, catálogo KEV de CISA, alcance               | Ordena qué se corrige primero                                       | Alimenta el SLA        |

**Por qué el lockfile.** El `package.json` declara rangos; el lockfile fija las versiones exactas, incluidas las transitivas, que son la mayor parte del árbol. Escanear el manifiesto sin el lockfile ve solo las dependencias directas y no coincide con lo que se instala en CI.

**Triage.** Una vulnerabilidad se prioriza por cinco señales: gravedad (CVSS), probabilidad de explotación (EPSS), si está en el catálogo de vulnerabilidades explotadas (KEV), si el código vulnerable es alcanzable desde tu código (según lo que soporte la herramienta) y si la dependencia llega a producción o es solo de desarrollo.

**SLAs de remediación** (propuesta a calibrar):

| Caso                                   | Plazo          |
| -------------------------------------- | -------------- |
| Crítica, en KEV o con exploit conocido | 7 días         |
| Alta                                   | 30 días        |
| Media                                  | 90 días        |
| Baja                                   | Mejor esfuerzo |

**Gate en PR.** Bloquea una vulnerabilidad alta o crítica introducida por el PR en dependencias de producción cuando existe versión corregida. Si no hay corrección, avisa y exige una excepción con caducidad. En dependencias de desarrollo, avisa.

**Configuración de Dependabot.** Ecosistemas `npm`, `github-actions` y `docker`; actualizaciones agrupadas para reducir PRs; un límite de PRs abiertos; y un `cooldown` de algunos días antes de proponer versiones recién publicadas, que reduce el riesgo de paquetes comprometidos. Con `github-actions` Dependabot también actualiza las actions fijadas por SHA.

**OSV-Scanner frente a Snyk.** OSV-Scanner es de código abierto, lee lockfiles y consulta la base OSV; no tiene costo de licencia. Snyk es comercial, con su propia base y priorización, y suele elegirse cuando hace falta gestión central de políticas entre muchos repositorios. Para un repositorio con un solo mantenedor, empezar con OSV-Scanner y Dependency Review es razonable; la decisión queda abierta.

## Licencias

La política de licencias depende de cómo se distribuye el ERP; esa decisión va antes de pasar a la Fase 2.

| Categoría    | Ejemplos                                                        | Tratamiento                                   |
| ------------ | --------------------------------------------------------------- | --------------------------------------------- |
| Permitidas   | MIT, Apache-2.0, BSD, ISC                                       | Pasan                                         |
| Revisión     | LGPL, MPL, EPL                                                  | Aviso; depende de cómo se enlace y distribuya |
| Denegadas    | GPL-3.0, AGPL-3.0, SSPL-1.0, CC-BY-NC-4.0 (la deny-list actual) | Bloquean                                      |
| Desconocidas | `LicenseRef-scancode-unknown*`                                  | Aviso con ticket y plazo                      |

**Por qué depende de la distribución.** La GPL se activa al distribuir el software; la AGPL también al ofrecerlo como servicio en red. Un ERP en SaaS, uno on-premise y uno entregado como imagen no tienen el mismo riesgo, así que la deny-list se confirma con ese dato.

**Desconocidas.** Un warning que nadie revisa se convierte en ruido. Se define un plazo de triage, y la Fase 2 exige que no queden desconocidas sin resolver en las últimas corridas (criterio propuesto: cuatro semanas limpias).

**Reparto de cobertura.** Dependency Review cubre las licencias de dependencias declaradas en manifiestos. ScanCode sobre el diff cubre archivos fuente y código vendor. El escaneo semanal completo documenta la deriva y produce la evidencia (SPDX 2.3 y OSADL, retención de 90 días).

**Punto débil del semanal.** Con `continue-on-error: true` un fallo de la herramienta pasa desapercibido. Conviene añadir un paso que verifique que el reporte existe y no está vacío, y que abra un issue si falta. Además, `--csv` está deprecado (#3043); se mantiene `--json-pp`.

## Seguridad del propio pipeline

Los controles de esta sección protegen al resto: si un PR puede alterar el workflow, puede apagar cualquier gate.

| Control                          | Qué detecta                                                                                              | Local      | Gate                                                                 |
| -------------------------------- | -------------------------------------------------------------------------------------------------------- | ---------- | -------------------------------------------------------------------- |
| zizmor                           | Inyección de expresiones, permisos excesivos, actions sin fijar, credenciales persistidas (`artipacked`) | Pre-commit | Bloquea; de los primeros en pasar a bloqueante                       |
| actionlint                       | Sintaxis del workflow, expresiones inválidas y errores en scripts de shell                               | Pre-commit | Bloquea si cambia `.github/`                                         |
| Hadolint                         | Malas prácticas en el Dockerfile: bases sin versión fija, usuario root, capas innecesarias               | Pre-commit | Error bloquea, estilo avisa; corre antes del build                   |
| IaC (Checkov, tfsec, KICS)       | Configuraciones inseguras en Terraform, Kubernetes u otros                                               | Opcional   | Solo si existen esos archivos                                        |
| Typosquatting (Socket, GuardDog) | Paquetes con nombre engañoso, scripts de instalación o mantenedores nuevos sospechosos                   | No         | Bloquea un paquete nuevo sospechoso, solo si el PR toca dependencias |

**Puntos que se repiten en la práctica:**

- Las herramientas del pipeline se instalan con versión exacta y verificación, no con `curl | bash` desde la rama principal.
- Los permisos del workflow parten de `contents: read` y se amplían por job.
- Las actions de terceros van fijadas por SHA; Dependabot mantiene esos SHA actualizados.
- El cuerpo y el título del PR nunca se interpolan con `${{ }}` dentro de scripts.
- En CI se puede instalar con `npm ci --ignore-scripts` para impedir scripts de instalación; puede romper paquetes que los necesitan, así que se prueba antes de activarlo.

## Excepciones y gobierno

Una excepción es una decisión de aceptar un riesgo; por eso lleva dueño, motivo y fecha de caducidad.

Formato propuesto, en un archivo versionado del repo (por ejemplo `security/exceptions.yml`):

```yaml
- id: EXC-2026-014
  tool: osv-scanner
  finding: GHSA-xxxx-xxxx-xxxx
  scope: package-lock.json / nombre-del-paquete
  reason: Sin versión corregida; código vulnerable no alcanzable
  owner: johan
  created: 2026-11-10
  expires: 2027-02-08
  ticket: '#123'
```

**Reglas:**

1. Toda supresión, en línea o en archivo, referencia un `id` de excepción.
2. Un job de CI falla si una excepción venció; así, renovarla es una decisión explícita.
3. La caducidad máxima es corta (propuesta: 90 días).
4. Cambiar el archivo requiere revisión de CODEOWNERS, igual que `.github/workflows/`.
5. El resumen del stage informa cuántas excepciones hay activas y cuál vence primero.

**Un solo mantenedor.** Con una sola cuenta, el dueño y el aprobador son la misma persona, así que no hay separación de funciones. Se documenta como riesgo aceptado, y la caducidad y el conteo visible compensan en parte al obligar a revisar.

**Salida de emergencia.** Si un gate bloquea una corrección urgente, el bypass del ruleset se limita a un rol, queda registrado y se revisa después con una excepción formal. No se desactiva el check.

## El agregador security-complete

El agregador convierte nueve resultados en un solo check requerido, y falla ante cualquier cosa que no sea `success`.

```yaml
security-complete:
  name: 'Security: Complete' # nombre congelado: lo referencia el ruleset
  needs: [secrets, sast-diff, sca, dependency-review, license-pr, pipeline-scan]
  if: always()
  runs-on: ubuntu-latest
  steps:
    - name: Evaluate results
      env:
        NEEDS: ${{ toJSON(needs) }}
      run: |
        bad=$(echo "$NEEDS" | jq -r 'to_entries[] | select(.value.result != "success") | "\(.key): \(.value.result)"')
        if [ -n "$bad" ]; then
          echo "::error::Security gate not green"
          echo "$bad"
          exit 1
        fi
```

**Reglas del agregador:**

1. `if: always()`: sin él, si un job falla el agregador se salta y el check queda sin resultado.
2. Solo `success` es verde: `failure`, `cancelled` y `skipped` fallan. Es la corrección del agregador que reportaba éxito al saltar jobs.
3. Los jobs condicionales (Hadolint, IaC, typosquatting) no se saltan por un `if` implícito. Un job de detección de cambios publica una salida, y el agregador acepta `skipped` solo si esa salida lo autoriza.
4. Los condicionales se resuelven dentro del workflow, no con `paths:` a nivel de workflow: con `paths:` el check requerido nunca se ejecuta y queda en Pending, lo que bloquea el merge.
5. El valor de `needs` se pasa por `env`, no se interpola en el script.
6. El ruleset exige `security-complete` y `ci-complete`; los nombres de los jobs individuales pueden cambiar sin romper nada.

El ejemplo es un punto de partida: los nombres de jobs son los del diagrama y se ajustan a los reales.

## Operación: métricas y plan de adopción

Sin métricas, los gates se vuelven rítuales: estas siete dicen si el stage funciona y dónde duele.

| Métrica                             | Qué revela                   | Meta (propuesta)                     |
| ----------------------------------- | ---------------------------- | ------------------------------------ |
| Tiempo de corrección por severidad  | Si se cumplen los SLA        | Según la tabla de SLA                |
| Incumplimientos de SLA abiertos     | Deuda de vulnerabilidades    | 0 críticas fuera de plazo            |
| PRs bloqueados por seguridad        | Si los gates actúan          | Se observa; sin meta                 |
| Falsos positivos por mes            | Calidad de reglas y baseline | Tendencia a la baja                  |
| Excepciones activas y su antigüedad | Riesgo aceptado              | Ninguna vencida                      |
| Duración del stage                  | Fricción para el autor       | Dentro del presupuesto que se defina |
| Corridas con fallo de herramienta   | Fiabilidad del control       | 0 sin explicar                       |

**Revisión.** Una revisión mensual de excepciones, falsos positivos y SLA, con el resultado anotado en el repo.

**Plan de adopción por fases:**

| Fase | Contenido                                                                | Criterio de salida                                                  |
| ---- | ------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| 0    | Agregador `security-complete` y reglas estrictas                         | Un job saltado o cancelado deja el check en rojo                    |
| 1    | Secretos y zizmor como bloqueantes                                       | Sin secretos en el historial; cero hallazgos de zizmor sin resolver |
| 2    | SAST fail-on-new bloqueante, con baseline                                | Baseline revisada y versionada                                      |
| 3    | Dependency Review y SCA en PR: 2 a 4 semanas advisory, luego bloqueantes | Corridas limpias o hallazgos triados; SLA definidos                 |
| 4    | Licencias, Fase 2 gradual                                                | Política de distribución decidida; desconocidas resueltas           |
| 5    | Hadolint, IaC y typosquatting según los archivos presentes               | Confirmado qué tipos de archivo existen                             |

## Alineación con marcos

Este stage cubre buena parte de lo que los marcos más usados piden en vulnerabilidades, dependencias y seguridad del pipeline; el mapeo es orientativo y debe verificarse contra el texto vigente de cada marco antes de usarlo en una auditoría.

| Marco                       | Qué pide, en lo que toca a este stage                                                                                                                                          | Dónde se cubre aquí                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| NIST SP 800-53, RA-5        | Monitoreo y escaneo de vulnerabilidades de forma continua                                                                                                                      | Escaneos programados de SAST, SCA y secretos; SLA de remediación                                               |
| NIST SSDF (SP 800-218)      | Identificar vulnerabilidades de forma continua (RV.1), verificar componentes de terceros (PW.4), analizar el código (PW.7), proteger el código (PS.1)                          | SCA y Dependency Review, SAST, secretos, rulesets y CODEOWNERS                                                 |
| OWASP Top 10 CI/CD          | Abuso de la cadena de dependencias (CICD-SEC-3), ejecución envenenada del pipeline (SEC-4), higiene de credenciales (SEC-6), uso no gobernado de servicios de terceros (SEC-8) | SCA y typosquatting; zizmor, permisos mínimos y política leída del base ref; secretos; actions fijadas por SHA |
| SLSA                        | Procedencia y firma del build                                                                                                                                                  | Se cubre en el PRD de supply chain; este stage aporta dependencias fijadas y un pipeline endurecido            |
| ISO/IEC 27001:2022, Anexo A | Gestión de vulnerabilidades técnicas (A.8.8), ciclo de vida de desarrollo seguro (A.8.25), codificación segura (A.8.28)                                                        | Política, SLA, gates y evidencia retenida                                                                      |

Solo lo marcado como evidencia cuenta ante un auditor: un control sin reporte retenido y sin dueño no se considera implementado.

## Estructura del repo y configuración

La política vive en archivos versionados del repo; así cambiarla pasa por un PR y por CODEOWNERS.

| Archivo                                    | Contenido                                                      |
| ------------------------------------------ | -------------------------------------------------------------- |
| `.github/workflows/ci.yml`                 | Gates de PR de calidad y pruebas; agregador `ci-complete`      |
| `.github/workflows/security.yml`           | Jobs de seguridad en PR; agregador `security-complete`         |
| `.github/workflows/scheduled-security.yml` | SAST completo, SCA, historial de secretos y licencias, semanal |
| `.github/dependabot.yml`                   | Ecosistemas, agrupación, `cooldown` y límite de PRs            |
| `.github/CODEOWNERS`                       | Revisión obligatoria sobre workflows, excepciones y políticas  |
| `security/exceptions.yml`                  | Excepciones con dueño y caducidad                              |
| `security/` (baseline y políticas)         | Baseline de SAST, `license-policy.md`, deny-list               |
| `docs/runbooks/`                           | Runbooks de la sección correspondiente                         |

Ejemplo de `dependabot.yml`; la ruta de `directory` se ajusta a cada `package.json` del repo (por ejemplo `client` y `server`):

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    open-pull-requests-limit: 5
    cooldown:
      default-days: 3
    groups:
      minor-and-patch:
        update-types: [minor, patch]
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
  - package-ecosystem: docker
    directory: /
    schedule:
      interval: weekly
```

Ejemplo de `CODEOWNERS` (sustituye el marcador por tu usuario):

```
/.github/workflows/      @TU-USUARIO
/.github/dependabot.yml  @TU-USUARIO
/security/               @TU-USUARIO
```

**Ruleset de la rama principal:** exige pull request, bloquea force push, exige los checks `ci-complete` y `security-complete`, y exige revisión de CODEOWNERS. Confirma antes que tu plan de GitHub aplica rulesets en repositorios privados.

## Roles y responsabilidades

Con un solo mantenedor todos los roles los ocupa la misma persona; escribirlos igual deja claro qué sombrero se usa en cada decisión y qué cambiar cuando entre más gente.

| Actividad                                         | Responsable hoy                     | Cuando haya más gente                      |
| ------------------------------------------------- | ----------------------------------- | ------------------------------------------ |
| Mantener reglas, baseline y deny-list             | Mantenedor de seguridad (tú)        | Mantenedor de seguridad                    |
| Triage semanal de alertas y escaneos programados  | Tú                                  | Rotación semanal                           |
| Aprobar excepciones                               | Tú, con riesgo aceptado documentado | Persona distinta del autor de la excepción |
| Responder a un secreto filtrado                   | Tú                                  | Responsable de guardia                     |
| Revisión mensual de métricas y excepciones        | Tú                                  | Mantenedor y un segundo revisor            |
| Actualizar versiones de herramientas del pipeline | Tú, con PR de Dependabot            | Mantenedor de seguridad                    |

La separación de funciones (quien escribe no aprueba su propia excepción) es el control que hoy falta; se compensa con la caducidad de excepciones, CODEOWNERS y el conteo visible, y se resuelve de verdad con una segunda cuenta.

## Runbooks

Cada tipo de fallo tiene un primer paso conocido, para no improvisar a las 2 de la mañana.

| Situación                                      | Primer paso                                                               | Siguiente                                                                                   |
| ---------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| PR rojo por un hallazgo nuevo                  | Leer el resumen del job: regla, archivo y línea                           | Corregir; si es falso positivo, excepción con caducidad                                     |
| Secreto detectado                              | Revocar o rotar la credencial                                             | Revisar uso en el proveedor, purgar historial si hace falta, registrar el incidente         |
| CVE crítica o KEV en dependencia de producción | Confirmar si la dependencia llega a producción y si hay versión corregida | Actualizar dentro del SLA; sin corrección, mitigación y excepción                           |
| Error de herramienta (no hallazgo)             | Revisar el mensaje distinto de un hallazgo y la versión de la herramienta | Reintentar una vez; si persiste, issue y revertir la última actualización de la herramienta |
| Excepción por vencer                           | Revisar si la causa sigue vigente                                         | Renovar con nueva justificación o cerrar con la corrección                                  |
| Licencia denegada o desconocida                | Identificar el paquete o archivo y la licencia exacta                     | Sustituir, aislar o excepción aprobada; desconocida: ticket con plazo                       |
| Corrección urgente bloqueada por un gate       | Usar el bypass limitado del ruleset                                       | Excepción formal y revisión posterior; el check no se desactiva                             |
| Escaneo programado que no genera reporte       | Abrir el job y ver la causa                                               | Corregir y volver a ejecutar; el vacío cuenta como fallo                                    |

## Definición de listo

El stage alcanza el estado enterprise cuando se cumplen todos estos puntos; cada uno se puede comprobar con una prueba o un archivo.

- [ ] `security-complete` existe y falla con cualquier resultado distinto de `success`
- [ ] El ruleset exige `ci-complete` y `security-complete`, y nada más por nombre de job
- [ ] Secretos: pre-commit, push protection, PR y historial programado activos y bloqueantes
- [ ] SAST: fail-on-new bloqueante con baseline versionada y escaneo semanal completo
- [ ] SCA: lockfile obligatorio, instalación reproducible, verificación en PR bloqueante y monitoreo programado
- [ ] Dependabot configurado con agrupación, `cooldown` y los tres ecosistemas
- [ ] Licencias: deny-list decidida según el modelo de distribución y regla para `unknown`
- [ ] zizmor y actionlint bloqueantes; actions de terceros fijadas por SHA
- [ ] `security/exceptions.yml` con dueño y caducidad, y un job que falla al vencer
- [ ] SLA de remediación definidos y medidos
- [ ] Reportes con retención definida por tipo y valores sensibles redactados
- [ ] Runbooks escritos y probados al menos una vez
- [ ] Mapeo a marcos revisado contra el texto vigente
- [ ] Revisión mensual de métricas con resultado anotado en el repo

## Faltantes y orden de adopción

Lo que falta en el stage es poco; lo importante es el orden en que se activan los bloqueos.

**Faltantes:**

- **Integridad del lockfile.** Verificar que los enlaces apunten al registro esperado.
- **Espera antes de adoptar versiones nuevas** (`cooldown` en Dependabot), que reduce el riesgo de paquetes recién comprometidos.
- **Escaneo de la imagen** (Trivy, Grype): va después del build, no en este stage.
- **Política de excepciones escrita** (E6), con dueño y caducidad.

**Orden de adopción recomendado:**

1. Agregador `security-complete` y reglas de agregador estricto (G7). Sin esto, ningún bloqueo posterior protege nada.
2. Secretos y pipeline config (zizmor) como bloqueantes desde el inicio.
3. SAST con fail-on-new como bloqueante, ya con baseline.
4. Dependency Review y SCA sobre lockfile en PR, primero advisory 2 a 4 semanas y luego bloqueantes, con umbral de severidad y explotabilidad.
5. Licencias a Fase 2 gradual, con la deny-list y la regla para `unknown` ya decididas.
6. Typosquatting, Hadolint e IaC según los tipos de archivo presentes.

El PRD de SCA por lockfile (outline publicado, sin secciones escritas) y el de property-based testing (falta el roadmap dibujado) quedan pendientes.
