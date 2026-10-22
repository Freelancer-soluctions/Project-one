# Requerimientos: SAST y detección de secretos en shift-left

- **Fecha:** 2026-10-19
- **Propósito:** insumo para crear los changes de OpenSpec. No es un change ni una spec.
- **Alcance:** hooks de Git (`pre-commit`, `pre-push`) y job `sast` del CI (`ci.yml`).

---

## 1. Problema

El hook `pre-commit` ejecuta hoy `sast:semgrep` (`scripts/security/semgrep-staged.ps1`) y `security:secrets`. El análisis encontró:

| #   | Hallazgo                                                                              | Consecuencia                                               |
| --- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| H1  | `$files` se calcula pero no se pasa a Semgrep                                         | Escanea el repo completo, incluido `node_modules`          |
| H2  | Falta `--error` en Semgrep                                                            | Sale con exit 0 aunque haya hallazgos                      |
| H3  | El exit code de Docker no se propaga desde PowerShell                                 | El hook nunca bloquea                                      |
| H4  | Imagen `semgrep/semgrep:latest` (el CI usa `1.176.1`)                                 | Sin paridad entre local y CI                               |
| H5  | ~100 reglas `r/...` individuales, con duplicados                                      | Una petición al registro por regla; muy lento para un hook |
| H6  | Sin filtro por extensión                                                              | Un commit que solo toca `.md` dispara el escaneo           |
| H7  | El script es PowerShell                                                               | El CI (ubuntu) no puede reutilizarlo                       |
| H8  | Job `sast` del CI con `continue-on-error: true` y fuera de `needs` de los agregadores | El "early-abort gate" no aborta nada                       |

## 2. Objetivos y no objetivos

**Objetivos**

- O1. Que lo que pasa en local pase en CI (misma versión, mismas reglas, mismo script).
- O2. Que SAST evalúe solo lo nuevo, no hallazgos antiguos.
- O3. Que el hook no bloquee por problemas ajenos al código (Docker apagado, sin red, timeout).
- O4. Que el CI sea el punto de enforcement y el hook solo dé feedback.

**No objetivos**

- Reemplazar el SAST completo nightly.
- Garantizar enforcement desde el hook (`--no-verify` lo anula).
- Vendorizar reglas del registro (se decide en la sección 7).
- Check de nuevos `nosemgrep` en el diff.
- Cablear el early-abort con `needs` hacia los jobs caros de quality/security.

## 3. Decisiones ya tomadas

| ID  | Decisión                                                                          | Razón                                                                                                                                                                                                                                  |
| --- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Secretos en `pre-commit`; SAST en `pre-push`                                      | Un secreto commiteado exige reescribir historia, por eso se detecta lo antes posible. SAST en pre-commit solo puede pasar archivos completos y bloquea por hallazgos antiguos; en pre-push se usa `--baseline-commit`, igual que el CI |
| D2  | Un único script en Node (`scripts/sast-diff.mjs`) para hook y CI                  | Node ya está en el stack y corre en Windows y ubuntu                                                                                                                                                                                   |
| D3  | Local falla abierto ante errores de herramienta; CI falla cerrado                 | Un Docker apagado no debe impedir un push; el CI es el enforcement                                                                                                                                                                     |
| D4  | El job `sast` del CI pasa a bloqueante en dos fases (advisory y luego bloqueante) | Sigue la convención FASE 1 / FASE 2 del repo                                                                                                                                                                                           |

## 4. Requerimientos funcionales

Prioridad: **M** = debe, **S** = debería.

### 4.1 Secretos en pre-commit

| ID        | Requerimiento                                                                      | Pri. | Criterio de aceptación                                                                                            |
| --------- | ---------------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------- |
| RF-SEC-01 | El hook `pre-commit` DEBE escanear secretos solo sobre lo staged                   | M    | Con un secreto de prueba staged, el commit se bloquea; con el secreto solo en un archivo no staged, no se bloquea |
| RF-SEC-02 | El hallazgo DEBE reportarse sin imprimir el valor del secreto                      | M    | La salida del hook no contiene el secreto (equivalente a `--redact`)                                              |
| RF-SEC-03 | Si la herramienta falla (error, timeout), el hook DEBE avisar y permitir el commit | M    | Con el binario inaccesible, el commit pasa con un aviso visible                                                   |
| RF-SEC-04 | El escaneo DEBE terminar en menos de 5 s en un commit típico                       | S    | Medición en un commit de referencia                                                                               |
| RF-SEC-05 | La salida de cada scan DEBERÍA capturarse y mostrarse solo si falla                | S    | Con ambos scans en verde no hay salida intercalada                                                                |

### 4.2 SAST en pre-commit

| ID       | Requerimiento                              | Pri. | Criterio de aceptación                                         |
| -------- | ------------------------------------------ | ---- | -------------------------------------------------------------- |
| RF-PC-01 | El hook `pre-commit` NO DEBE ejecutar SAST | M    | Un commit con cambios JS/TS no lanza ningún proceso de Semgrep |

### 4.3 SAST en pre-push

| ID       | Requerimiento                                                                                    | Pri. | Criterio de aceptación                                        |
| -------- | ------------------------------------------------------------------------------------------------ | ---- | ------------------------------------------------------------- |
| RF-PP-01 | El hook `pre-push` DEBE ejecutar SAST sobre el diff contra `origin/main` con `--baseline-commit` | M    | Un hallazgo ERROR nuevo bloquea el push                       |
| RF-PP-02 | Un hallazgo ya existente en `origin/main` NO DEBE bloquear el push                               | M    | Tocar un archivo con un hallazgo antiguo no bloquea           |
| RF-PP-03 | Si el push no toca `.js .jsx .cjs .mjs .ts .tsx`, el hook DEBE salir sin ejecutar Semgrep        | M    | Un push que solo toca `.md` no ejecuta Semgrep                |
| RF-PP-04 | Si el working tree está sucio, el hook DEBE omitir el escaneo con aviso visible                  | M    | Con cambios sin commitear, el push pasa y se muestra el aviso |
| RF-PP-05 | Solo los hallazgos de severidad ERROR DEBEN bloquear                                             | M    | Un hallazgo WARNING no bloquea                                |
| RF-PP-06 | El escaneo DEBE tener `timeout` (objetivo: menos de 60 s)                                        | M    | Un Semgrep colgado se corta y cae en la política de fallos    |

### 4.4 Script único y paridad

| ID        | Requerimiento                                                                                                                                             | Pri. | Criterio de aceptación                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ----------------------------------------------------------------- |
| RF-PAR-01 | Existirá `scripts/sast-diff.mjs`, invocado por el hook de pre-push y por el job `sast` del CI                                                             | M    | Ambos llaman al mismo archivo                                     |
| RF-PAR-02 | El script DEBE soportar los modos `local` y `ci` (`SAST_MODE`)                                                                                            | M    | El comportamiento difiere solo en la política de fallos (RF-FAIL) |
| RF-PAR-03 | Semgrep DEBE ejecutarse con una versión pinneada, nunca `latest`, la misma que el CI                                                                      | M    | La versión aparece una sola vez en el repo                        |
| RF-PAR-04 | El conjunto de reglas DEBE definirse en una sola fuente                                                                                                   | M    | Hook y CI no mantienen listas separadas                           |
| RF-PAR-05 | El script DEBE usar `--severity ERROR --error --metrics off` y excluir `node_modules`, `dist`, `build`, `coverage`, `*.min.js`, `prisma/generated`, `e2e` | M    | Revisión del comando efectivo                                     |
| RF-PAR-06 | El mismo diff DEBE producir el mismo resultado en hook y CI                                                                                               | M    | Comparación sobre un diff de prueba                               |

### 4.5 Política de fallos

| ID         | Requerimiento                                                                                         | Pri. | Criterio de aceptación                            |
| ---------- | ----------------------------------------------------------------------------------------------------- | ---- | ------------------------------------------------- |
| RF-FAIL-01 | Semgrep exit 0 → pasa; exit 1 → bloquea; cualquier otro código es "herramienta rota"                  | M    | Probado con cada código                           |
| RF-FAIL-02 | En modo `local`, "herramienta rota" (Docker ausente, timeout, sin red) DEBE avisar y permitir el push | M    | Con Docker apagado el push pasa con aviso         |
| RF-FAIL-03 | En modo `ci`, "herramienta rota" DEBE fallar el job                                                   | M    | Un error de herramienta en CI deja el job en rojo |

### 4.6 CI

| ID       | Requerimiento                                                                                              | Pri.                                | Criterio de aceptación                                                                                                                                                    |
| -------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RF-CI-01 | El job `sast` DEBE sustituir el `docker run` inline por `SAST_MODE=ci node scripts/sast-diff.mjs`          | M                                   | El YAML invoca el script                                                                                                                                                  |
| RF-CI-02 | FASE 1: el job conserva `continue-on-error: true` y retiene el resultado como artifact (14 d)              | M (histórico · superado por FASE 2) | El PR no se bloquea y el artifact existe                                                                                                                                  |
| RF-CI-03 | El comentario del job DEBE documentar el criterio de graduación (2-4 semanas sin falsos positivos triados) | M                                   | Criterio escrito en el YAML                                                                                                                                               |
| RF-CI-04 | FASE 2: se quita `continue-on-error` y `sast` se añade a `prebuild-governance-complete.needs`              | M (implementado 2026-10-20)         | Un ERROR deja el job y el agregador de governance en rojo → falla `CI Complete`; el bloqueo del **merge** exige bindear el check al ruleset (change de gobernanza aparte) |

### 4.7 Limpieza y documentación

| ID        | Requerimiento                                                                                                           | Pri. | Criterio de aceptación                  |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | ---- | --------------------------------------- |
| RF-CLN-01 | Se DEBE eliminar `scripts/security/semgrep-staged.ps1` y el script npm `sast:semgrep` en su forma actual                | M    | Archivos y referencias eliminados       |
| RF-CLN-02 | `.husky/pre-commit` DEBE quedar sin el bloque SAST                                                                      | M    | Ver RF-PC-01                            |
| RF-DOC-01 | Se DEBE actualizar `docs/security/semgrep-rules.md` (política de reglas y de fallos) y `docs/learning/quality-gates.md` | S    | Docs consistentes con el comportamiento |

## 5. Requerimientos no funcionales

| ID     | Requerimiento                                                                     |
| ------ | --------------------------------------------------------------------------------- |
| RNF-01 | **Portabilidad:** el script corre en Windows y ubuntu sin cambios                 |
| RNF-02 | **Reproducibilidad:** versiones de herramientas pinneadas, sin `latest`           |
| RNF-03 | **Rendimiento:** `pre-commit` en menos de 5 s; `pre-push` en menos de 60 s        |
| RNF-04 | **Observabilidad:** los avisos de escaneo omitido son visibles, nunca silenciosos |

## 6. Verificaciones previas (antes de implementar)

Estos puntos se citaron de memoria y no se comprobaron:

1. Si `--baseline-commit` exige working tree limpio en Semgrep 1.176.1.
2. Sintaxis de escaneo staged en Gitleaks v8.30.1 (`gitleaks git --pre-commit --staged` o `gitleaks protect --staged`).
3. Qué hace hoy `npm run security:secrets` (¿repo completo, historial o staged?).
4. Qué reglas `r/...` del script actual ya están cubiertas por `p/nodejs`, `p/expressjs`, `p/react`, `p/xss`.

## 7. Preguntas abiertas

1. ¿Se salta la FASE 1 del job `sast` y se activa el bloqueo directamente?
2. ¿Se vendorizan en `.semgrep/rules` las reglas `r/...` críticas no cubiertas por los packs, o se descartan?
3. ¿Existe ya una capability de SAST o governance en `openspec/specs/` a la que deban apuntar estos requisitos como `MODIFIED`?

## 8. Agrupación sugerida en changes

| Change                                               | Requerimientos                                         | Dependencias         |
| ---------------------------------------------------- | ------------------------------------------------------ | -------------------- |
| A. Hook pre-commit: secretos staged y retiro de SAST | RF-SEC-01..05, RF-PC-01, RF-CLN-02                     | Verificaciones 2 y 3 |
| B. Script `sast-diff.mjs` y hook pre-push            | RF-PP-01..06, RF-PAR-01..06, RF-FAIL-01..03, RF-CLN-01 | Verificaciones 1 y 4 |
| C. Job `sast` del CI y graduación                    | RF-CI-01..04, RF-DOC-01                                | Change B             |

Los changes A y B son independientes entre sí. El C depende del B porque el job del CI invoca el script.
