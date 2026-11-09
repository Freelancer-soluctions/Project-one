# Runbook — respuesta ante un secreto detectado

Aplica a cualquier hallazgo de las capas de detección del repo:

| Capa                                               | Dónde                                   | Alcance                           |
| -------------------------------------------------- | --------------------------------------- | --------------------------------- |
| L0 GitHub native secret scanning + push protection | Security tab / push bloqueado           | repo completo (público, gratis)   |
| L1 Gitleaks staged (hook `pre-commit`)             | local, antes de commitear               | cambios staged                    |
| L2 SAST diff (`pre-push` y job `sast`)             | local / CI                              | diff del PR (Semgrep `p/secrets`) |
| L3 Gitleaks PR diff (job `secrets` de `ci.yml`)    | CI, PR y merge queue                    | diff del PR                       |
| L4 Gitleaks full history (semanal + pre-release)   | `scheduled-security.yml`, `release.yml` | todo el historial                 |

> **Regla de oro (RR-1):** primero **revocar y rotar**, después discutir el historial.
> Un secreto vive en el proveedor, no en git: reescribir el historial sin rotar no
> protege nada y además rompe clones, PRs y firmas.

## RR-1 — Revocar y rotar (inmediato)

1. Identifica el proveedor y el recurso afectado (AWS, Cloudinary, GitHub App, JWT de
   sesión, URL de base de datos, SMTP, etc.).
2. **Revoca el valor comprometido** en el panel del proveedor (no lo "desactives
   temporalmente": revócalo).
3. Emite un valor nuevo y guárdalo en el gestor de secretos del repo
   (`Settings → Secrets and variables → Actions`) o en el `.env` del despliegue.
4. Verifica que el valor viejo ya no autentica (`curl`/SDK con el valor viejo debe dar
   401/403).
5. Si el secreto es de terceros y el proveedor participa en el **secret scanning partner
   program**, GitHub notifica y puede revocarlo automáticamente; aun así confirma el
   estado en el panel del proveedor.

## RR-2 — Auditar uso (mismo día)

- Revisa logs de acceso, facturación y auditoría del proveedor desde la fecha del primer
  commit que contiene el secreto (el `Commit` del hallazgo da la ventana mínima).
- Busca patrones anómalos: picos de uso, IPs desconocidas, creación de recursos,
  cambios de permisos, exfiltración de datos.
- Registra la conclusión (sin usos / usos sospechosos / usos confirmados) en el registro
  de incidentes (RR-6). Si hay uso confirmado, escala como incidente de seguridad y
  sigue el procedimiento de notificación aplicable.

## RR-3 — Decidir sobre el historial (`git filter-repo`)

Rotar es obligatorio; reescribir el historial es **opcional** y se decide después:

- **No reescribir** cuando el valor ya está revocado y era un placeholder o un secreto
  sin valor operativo. Añade la entrada justificada a `.gitleaksignore`
  (`commit:file:regla:línea` + motivo + fecha de revisión) y cierra el hallazgo.
- **Reescribir** cuando el requisito es que el valor no exista en el historial publicado
  (p. ej. obligación contractual o secreto de larga vida con valor histórico). Pasos:
  1. `git filter-repo --replace-text replacements.txt` en un clon limpio (nunca sobre el
     clon de trabajo).
  2. Coordina la ventana: todos los clones deben re-clonar; los PRs abiertos se
     reconstruyen.
  3. Fuerza el push (`--force-with-lease`) solo con aprobación del owner del repo.
  4. Invalida cachés y forks si el repo es público.
  5. Verifica con `gitleaks git --log-opts="--all"` que el valor ya no aparece.
- El fichero `replacements.txt` debe borrarse tras el proceso (está en la allowlist de
  `.gitleaks.toml` para que no se escanee a sí mismo).

## RR-4 — Cerrar el hallazgo

- Alertas de GitHub: `Security → Secret scanning` → revisar y **dismiss** con motivo
  (`revoked`, `false positive`, `used in tests`). Dismiss sin rotar no es aceptable.
- Hallazgos de Gitleaks: SARIF en `Security → Code scanning` (`category: gitleaks`) y
  artifact `gitleaks-report` del run; el issue del escaneo semanal se cierra enlazando
  la rotación.
- Si el hallazgo es un falso positivo legítimo, la allowlist se justifica por entrada
  con motivo y fecha (RH-4); cambios en `.gitleaks.toml` / `.gitleaksignore` requieren
  revisión del equipo devops (CODEOWNERS).

## RR-5 — Prevenir la recurrencia

- Añade el patrón a `.gitleaks.toml` si es un formato propio que las reglas default no
  cubren (con `keywords` + `entropy` para no generar ruido).
- Confirma que push protection está activo: un push con un secreto reconocido debe
  bloquearse con enlace a este runbook.
- Si el secreto llegó por un `.env` versionado, revisa el `.gitignore` y el hook
  `pre-commit`.

## RR-6 — Registro de incidentes (evidencia de gobernanza)

Cada incidente se registra en la tabla de abajo (nunca el valor del secreto). El registro
es la evidencia que pide el PRD (`G9`) y se revisa en la auditoría trimestral.

**Plazo D3: 24 horas** desde la detección hasta la rotación efectiva. Aplica a un equipo
de una sola persona (mantenedor único); si el equipo crece, el plazo se renegocia y se
documenta aquí. El incumplimiento del plazo se registra como desviación con su causa.

| Fecha detección | Origen (capa) | Secreto (tipo, sin valor) | Regla/archivo/commit | Rotado (fecha/hora) | ¿Dentro de D3? | Historial (sí/no/motivo) | Uso observado | Responsable |
| --------------- | ------------- | ------------------------- | -------------------- | ------------------- | -------------- | ------------------------ | ------------- | ----------- |
| _pendiente_     |               |                           |                      |                     |                |                          |               |             |

## Referencias

- `openspec/specs/ci-secret-scanning/spec.md` — requisitos de detección y gobernanza.
- `docs/CONTEXT-CICD.md` §5.7 — estado operativo de la capa nativa de GitHub.
- `.gitleaks.toml` — reglas y allowlists; `.gitleaksignore` — baseline por fingerprint.
- `docs/learning/ci-cd/05b-commit-signing.md` — higiene de credenciales de firma.
