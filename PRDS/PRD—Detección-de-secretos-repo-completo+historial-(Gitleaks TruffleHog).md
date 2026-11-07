# PRD — Detección de secretos: repo completo + historial (Gitleaks/TruffleHog)

Nov 7, 2026 · @Johan

## Resumen y problema

Un secreto que entró al historial de Git sigue allí aunque se borre en el último commit, así que además del escaneo de cada PR hace falta un escaneo periódico del repo completo y de todo su historial.

El escaneo del diff protege el código nuevo, pero no ve lo que ya se subió antes de instalarlo, ni lo que entró por una rama olvidada, un tag o un commit reescrito. El escaneo de historial responde a «¿qué secretos hay hoy en este repo, vivos o no?», y es también el único que sirve para auditar antes de abrir un repo o de pasar una revisión de seguridad.

El problema práctico es el ruido: un escaneo de historial devuelve cientos de hallazgos viejos, casi todos revocados o falsos positivos, y un gate que falla por todos ellos se apaga. Este PRD define las herramientas, las capas de detección, la forma de manejar el historial con una línea base, la respuesta ante un hallazgo real y los gates. Las cifras y umbrales son propuestas por calibrar.

## Objetivos y no-objetivos

El éxito es no tener secretos vivos en el repo y enterarse de uno nuevo antes de que llegue a `main`.

| #   | Objetivo                                  | Meta (propuesta)                                                             |
| --- | ----------------------------------------- | ---------------------------------------------------------------------------- |
| O1  | Inventario inicial del historial          | Un escaneo completo único, triado, con cada hallazgo clasificado             |
| O2  | Cero secretos vivos en el repo            | Todo hallazgo verificado como activo se revoca y rota                        |
| O3  | Bloquear secretos nuevos                  | PR con un secreto nuevo no se mezcla                                         |
| O4  | Historial vigilado                        | Escaneo programado de repo completo e historial, con línea base              |
| O5  | Hallazgos accionables                     | Cada fallo dice archivo, commit y regla, y distingue activo de no verificado |
| O6  | El control no se puede apagar en silencio | Cambiar el escaneo o su allowlist exige revisión                             |

**No-objetivos:** reescribir el historial como solución principal (la rotación es la solución); reemplazar un gestor de secretos; escanear fuentes fuera del repo (Slack, imágenes, buckets) en esta fase; detectar vulnerabilidades de código (lo cubre el SAST).

## Herramientas

Gitleaks es la herramienta rápida para hooks y PR; TruffleHog es la de profundidad, porque comprueba si el secreto sigue activo. La fuente consultada recomienda usar ambas.

| Dimensión           | Gitleaks                                                   | TruffleHog                                                                                                      |
| ------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Alcance             | Repos con historial completo, directorios, archivos, stdin | Git, organizaciones de GitHub (wikis, issues, gists, comentarios de PR), S3, GCS, imágenes Docker, Slack, otros |
| Verificación        | No: reporta coincidencias de patrón                        | Sí: llama a la API del emisor para ver si el secreto está activo; `--results=verified` filtra                   |
| Reglas o detectores | Más de 150 reglas regex                                    | Más de 800 detectores tipados; verificación para más de 20 tipos comunes                                        |
| Velocidad           | Subsegundos en repos típicos, sin red                      | Más lento por la verificación y las fuentes extra                                                               |
| Línea base          | Sí, para omitir hallazgos conocidos                        | No, según la fuente                                                                                             |
| Integración         | Hook pre-commit, GitHub Action, salida SARIF               | Hook pre-commit, GitHub Action, salida JSON o texto; admite `--since-commit`                                    |
| Licencia            | MIT                                                        | AGPL-3.0 (código abierto) y edición Enterprise comercial                                                        |

Las cifras vienen de una comparativa de terceros y cambian con las versiones; se confirman contra la documentación de cada herramienta antes de fijar la configuración.

**Protección nativa de GitHub.** El escaneo de secretos de GitHub y su protección de push bloquean el secreto al subirlo y no requieren un job. Su disponibilidad en repos privados depende del plan (D1). Es una capa adicional, no un reemplazo: cubre patrones de socios verificados y se le escapan formatos propios.

**Falsos positivos.** Con TruffleHog, `--only-verified` hace fallar solo ante credenciales vivas y es la opción con menos ruido en producción. Con Gitleaks se ajustan reglas y umbrales de entropía y se usa la línea base para el historial viejo.

## Estrategia por capas

Cada capa atrapa lo que la anterior dejó pasar; solo la última mira el historial completo.

&#91;embedded content: capas de detección · 4 capas, 1 respuesta\]

Las capas 3 y 4 detectan; cuando encuentran un secreto real, la respuesta empieza por revocarlo, no por borrarlo del historial.

## Requisitos del escaneo de repo completo e historial

El escaneo de historial corre con checkout completo, contra una línea base versionada, y distingue hallazgos nuevos de heredados.

1. **RH-1. Checkout completo.** `actions/checkout` trae por defecto un solo commit; el job de historial usa `fetch-depth: 0` y escanea todas las ramas y tags, no solo la rama por defecto.
2. **RH-2. Dos pasadas.** Gitleaks sobre todo el historial (rápido, regex) y TruffleHog con verificación sobre el mismo repo. Un hallazgo verificado como activo es incidente (ver respuesta ante hallazgos).
3. **RH-3. Línea base.** El primer escaneo genera una línea base de hallazgos heredados ya triados, versionada en el repo. Las corridas siguientes fallan solo por hallazgos que no están en ella.
4. **RH-4. Allowlist con justificación.** Cada excepción (fixture de test, valor de ejemplo) lleva el motivo y una fecha de revisión; no hay excepciones sin motivo.
5. **RH-5. Frecuencia.** Semanal y bajo demanda (propuesta), más un escaneo completo antes de cada release importante.
6. **RH-6. Salida accionable.** El resumen del job lista regla, archivo, commit y si está verificado; se sube además SARIF cuando la herramienta lo permite (D2).
7. **RH-7. Fallo de herramienta no es limpio.** Si el escáner no corre, no descarga o el checkout es superficial, el job falla con mensaje propio; nunca reporta «sin hallazgos».
8. **RH-8. Versiones fijas.** Herramientas y actions por versión exacta o SHA, no `@main`; el job que busca secretos no debe depender de código que otro puede cambiar.
9. **RH-9. Permisos mínimos.** `contents: read`; sin secretos disponibles para PRs de forks; los hallazgos no se imprimen en claro en los logs.

## Respuesta ante un secreto hallado

Primero se revoca y se rota; limpiar el historial es secundario y nunca sustituye a la rotación.

Un secreto que ya se subió se considera comprometido, aunque la exposición haya sido breve: los commits públicos pueden ser copiados en minutos, y las copias y los forks conservan el valor.

1. **RR-1. Revocar y rotar.** Se invalida la credencial y se genera una nueva. Es lo que realmente corta el acceso.
2. **RR-2. Auditar el uso.** Revisar registros de acceso y facturación del servicio desde la fecha del commit para ver si hubo uso indebido.
3. **RR-3. Decidir sobre el historial.** Con la credencial ya muerta, reescribir el historial es opcional. Si se hace, se usa `git filter-repo` (o BFG), se comprueba con `git log --all -S '<valor>'` y se empuja con `--force-with-lease`. Reescribir cambia los hashes, obliga a re-clonar al equipo y rompe PRs abiertos.
4. **RR-4. Lo que no se limpia.** Clones y forks previos, cachés de la interfaz de GitHub y refs de PR pueden conservar el valor; por eso la rotación es la única garantía.
5. **RR-5. Prevenir la repetición.** Mover el valor a un gestor de secretos, activar la protección de push y revisar por qué el hook local no lo detuvo.
6. **RR-6. Plazo.** Un hallazgo verificado se trata como incidente de prioridad alta; una fuente de la industria sugiere una rotación en 4 horas para equipos medianos. Para un equipo de una persona el plazo se fija en D3.

El registro de cada incidente (fecha, secreto afectado sin su valor, acciones, plazo real) sirve como evidencia de gobernanza.

## Gates

Bloquean el merge los secretos nuevos y los vivos; el historial heredado alerta, pero no bloquea PRs.

La tabla es una propuesta de diseño basada en las capacidades de las herramientas y en prácticas descritas por las fuentes; no es un estándar publicado.

| #   | Gate                              | Qué verifica                                                                                                     | Dónde           | ¿Bloquea?                                                    |
| --- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------ |
| G1  | Hook local                        | Gitleaks sobre los cambios en pre-commit                                                                         | Local           | No (se puede saltar con `--no-verify`); es retroalimentación |
| G2  | Escaneo del PR                    | Gitleaks sobre los commits del PR, no solo el diff final                                                         | PR              | Sí, ante cualquier hallazgo fuera de allowlist               |
| G3  | Secreto vivo                      | TruffleHog con `--only-verified --fail`                                                                          | PR y programado | Sí: un secreto activo es incidente                           |
| G4  | Protección de push                | Bloqueo nativo de GitHub al subir                                                                                | Push            | Sí, si el plan lo permite (D1)                               |
| G5  | Historial completo                | Gitleaks y TruffleHog sobre todo el historial contra la línea base                                               | Programado      | No bloquea el merge; falla el job y abre issue               |
| G6  | Cambios de línea base y allowlist | Revisión de CODEOWNERS con motivo y fecha                                                                        | PR              | Sí (revisión humana)                                         |
| G7  | Anti-desactivación                | El escaneo es check requerido; su configuración y la política se leen del base ref, y un cambio exige CODEOWNERS | PR              | Sí                                                           |
| G8  | Salud del escáner                 | Versión fija, checkout completo en el job de historial, el agregador falla si el job se salta                    | PR y programado | Sí                                                           |
| G9  | Plazo de rotación                 | Un hallazgo verificado sin rotar pasado el plazo escala                                                          | Proceso         | Alerta                                                       |

El patrón habitual de adopción aplica: G2 y G3 pasan primero por una fase advisory de 2 a 4 semanas, y G5 empieza solo con el inventario inicial triado. G6 es una casilla de revisión; el resto ya lo verifican los checks y no se repite como casilla en la plantilla de PR.

## Plan por fases

Cinco fases; la primera limpia lo heredado, porque un gate sobre un historial sin triar se apaga.

## Criterios de aceptación y métricas

La estrategia se acepta cuando estas pruebas, incluidas las negativas, dan el resultado esperado.

| #   | Caso                                                                           | Resultado esperado                                                   |
| --- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| A1  | PR con una credencial de prueba con formato real                               | G2 rojo con archivo, commit y regla                                  |
| A2  | Credencial añadida en un commit y borrada en el siguiente, dentro del mismo PR | Sigue detectada: se escanean los commits, no solo el resultado final |
| A3  | Secreto antiguo ya presente en la línea base                                   | No falla el escaneo programado                                       |
| A4  | Secreto nuevo en el historial de una rama no principal                         | Lo detecta el escaneo completo (todas las ramas)                     |
| A5  | Job de historial con checkout superficial                                      | Falla con mensaje propio, no «sin hallazgos»                         |
| A6  | Job de escaneo saltado                                                         | `ci-complete` rojo                                                   |
| A7  | PR que añade una línea a la allowlist sin motivo                               | La revisión lo rechaza (G6)                                          |
| A8  | Hallazgo en el escaneo programado                                              | Issue creado con regla, archivo, commit y estado de verificación     |

Métricas, con metas propuestas:

- Secretos vivos en el repo: 0.
- Hallazgos heredados triados en el inventario inicial: 100%.
- Tiempo desde un hallazgo verificado hasta su rotación: dentro del plazo de D3.
- Duración del escaneo del PR: unos pocos minutos como máximo, por calibrar.

## Riesgos y mitigaciones

El riesgo mayor es un inventario inicial abrumador que lleve a apagar el gate; por eso el historial se triará una vez y luego se vigila contra una línea base.

| Riesgo                                            | Impacto                                                     | Mitigación                                                                                     |
| ------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Ruido de falsos positivos                         | Se ignora o se desactiva el gate                            | TruffleHog con verificación en bloqueo, línea base para lo heredado, ajuste de reglas          |
| Tratar la limpieza del historial como la solución | Credencial viva en copias y forks                           | RR-1: rotar primero; limpiar es opcional                                                       |
| Línea base usada para esconder secretos reales    | Secretos vivos «aprobados»                                  | Solo se baselinean hallazgos revocados o falsos; cambios con revisión (G6)                     |
| Hook local saltado con `--no-verify`              | Secreto llega al remoto                                     | El mismo escaneo corre en el PR (G2)                                                           |
| TruffleHog llama a APIs externas                  | Las credenciales se envían a los emisores para verificarlas | Aceptado por diseño de la herramienta; revisar la política de datos antes de usarlo en CI (D4) |
| Un solo mantenedor                                | Nadie más revisa la línea base                              | Riesgo aceptado y documentado; el registro de incidentes deja evidencia                        |
| Secretos fuera del repo (issues, wikis, imágenes) | Cobertura incompleta                                        | Fuera de alcance por ahora; TruffleHog puede ampliarse después (D5)                            |
| Escáner con checkout superficial                  | Falsos «limpio»                                             | RH-1 y RH-7 con prueba negativa A5                                                             |

## Decisiones abiertas y fuentes

Cinco decisiones por tomar; D1 y D4 condicionan la Fase 1.

| #   | Decisión                               | Opciones                                                                                | Recomendación                                                |
| --- | -------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| D1  | Protección nativa de GitHub            | Usarla si el plan la ofrece en repos privados, o depender solo de Gitleaks y TruffleHog | Confirmar disponibilidad en tu plan antes de contar con ella |
| D2  | Salida SARIF a la pestaña de seguridad | Sí o solo resumen del job                                                               | Resumen del job primero; SARIF si el plan lo muestra         |
| D3  | Plazo de rotación                      | 4 horas (referencia de la industria), 24 horas u otro                                   | 24 horas para un equipo de una persona, con registro         |
| D4  | TruffleHog en CI                       | Con verificación (envía el valor a los emisores), o sin verificación                    | Con verificación, tras revisar la política de datos          |
| D5  | Fuentes más allá del repo              | Solo repo, o también issues, wikis, imágenes                                            | Solo repo en esta fase                                       |

### Fuentes

- [Gitleaks vs TruffleHog (AppSec Santa)](https://appsecsanta.com/gitleaks-vs-trufflehog): alcance, verificación, reglas, línea base, integración y licencias.
- [TruffleHog vs Gitleaks, guía de escaneo en GitHub (Secrails)](https://secrails.com/blog/trufflehog-vs-gitleaks-github-secret-scanning-guide): `--only-verified`, línea base, falsos positivos y recomendaciones empresariales.
- [Secret leak remediation workflow (DEV Community)](https://dev.to/devactivity/proactive-security-mastering-the-secret-leak-remediation-workflow-for-dev-teams-4h4d): orden de respuesta y límites de la limpieza del historial.
- [Remove a secret from git history (TechEarl)](https://techearl.com/git-remove-secret-from-history): `git filter-repo`, BFG, `--force-with-lease` y qué sigue expuesto.

Todas son fuentes de terceros; no se abrió la documentación oficial de Gitleaks ni de TruffleHog, así que los detalles de banderas, versiones y hooks se confirman allí. La disponibilidad de la protección de GitHub por plan no se verificó.
