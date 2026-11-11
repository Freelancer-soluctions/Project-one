# SLA de remediación de vulnerabilidades

Change: `security-exceptions-policy` (PRD `Análisis-del-stage-SECURITY-estrategias-y-gates`).
Aplica a hallazgos de dependencias (SCA), secretos, IaC y config de pipeline
detectados por los gates del stage SECURITY (Trivy, `npm audit`,
`dependency-review`, Gitleaks, Checkov, Semgrep, zizmor, GuardDog).

## 1. Objetivos por severidad

| Severidad | Condición                                             | Deadline desde la detección           |
| --------- | ----------------------------------------------------- | ------------------------------------- |
| Crítica   | CVSS ≥ 9.0, **KEV** (CISA) o exploit público conocido | **7 días**                            |
| Alta      | CVSS 7.0–8.9 sin explotación conocida                 | **30 días**                           |
| Media     | CVSS 4.0–6.9                                          | **90 días**                           |
| Baja      | CVSS < 4.0                                            | **best effort** (revisión trimestral) |

Una vulnerabilidad crítica con explotación activa confirmada pasa a
**deadline acelerado de 24–72 h** (ver §4).

## 2. Inicio del reloj (clock-start)

- El reloj arranca en la **detección**: el primer run del gate que reporta el
  hallazgo (fecha del artifact/SARIF o del issue abierto), no la fecha del PR
  de corrección ni la del triaje.
- Si el hallazgo entra por el lockfile, la detección es el primer run que lo
  ve; si entra por un CVE publicado después, la detección es el primer run
  posterior a la publicación.
- **La reasignación de responsable NO reinicia el reloj.**
- Un cambio de severidad (upgrade/downgrade por nuevo CVSS o KEV) recalcula el
  deadline desde la detección original, no desde el cambio.
- Una **excepción pendiente** (en revisión) **no pausa el reloj**. Solo una
  excepción aprobada y vigente en `security/exceptions.yml` saca el hallazgo
  del cómputo de SLA, y aun así se cuenta como riesgo aceptado visible.

## 3. Escalación

| Momento             | Acción                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 50 % del deadline   | Recordatorio al `owner` de la dependencia/hallazgo.                                                                |
| 80 % del deadline   | Escalada al `devops-team` + issue etiquetado `security-sla-at-risk`.                                               |
| Deadline superado   | Issue `security-sla-breach` (bloqueante para el release), revisión obligatoria en la reunión semanal de seguridad. |
| Crítica/KEV vencida | Escalada inmediata al mantenedor principal; considerar mitigación compensatoria (WAF, feature flag, pin temporal). |

Los incumplimientos abiertos son una de las siete métricas mensuales
(`.github/workflows/security-metrics.yml`).

## 4. Explotación activa

Con evidencia de explotación activa (KEV, aviso del proveedor, intento
observado en logs):

1. Reevaluar el riesgo **de inmediato** (no esperar al ciclo mensual).
2. Acelerar el deadline a 24–72 h según exposición (público vs interno).
3. Si no hay parche: aplicar mitigación compensatoria y registrar una
   excepción en `security/exceptions.yml` con `expires` ≤ 30 días y el
   ticket de seguimiento. La excepción no elimina la escalada.

## 5. Interacción con excepciones

- Toda supresión referencia un `id` de `security/exceptions.yml` (schema y
  caducidad máxima de 90 días; ver `docs/runbooks/security/exception-expiry.md`).
- Una excepción **no** cambia la severidad ni el SLA: solo documenta que el
  riesgo se acepta temporalmente. El conteo de excepciones activas y la
  fecha de vencimiento más próxima son visibles en el issue mensual.
- Excepción vencida = fallo del job `security-exceptions-check` (advisory en
  FASE 1; bloqueante en FASE 2).

## 6. Revisión

- Revisión mensual de métricas y excepciones (issue `[monthly-security-metrics]`).
- Revisión trimestral de los deadlines de §1 frente a la industria
  (GitLab, OWASP, Cloudaware) y de la lista de excepciones permanentes.
- Este documento se versiona; cambios requieren revisión de `/security/`
  (CODEOWNERS).
