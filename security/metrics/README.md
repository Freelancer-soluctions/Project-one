# Métricas mensuales de seguridad

Artefactos generados por `.github/workflows/security-metrics.yml` (change
`security-exceptions-policy`):

- `YYYY-MM.md` — informe del mes (fecha, revisor, tabla de las 7 métricas con
  su fuente, acciones de seguimiento).
- `latest.json` — misma información en JSON para consumo automatizado.

Se publican mediante un PR mensual (rama `security/monthly-metrics`, commit
firmado por la API) porque `main` exige PR + commits firmados. El merge deja la
evidencia versionada para auditoría.

Fuente y limitaciones: `scripts/security/security-metrics.mjs`. Las métricas
que dependen de historial de fechas de vulnerabilidad (tiempo a corregir por
severidad, incumplimientos de SLA abiertos) se reportan como `n/d` hasta que
exista esa fuente; no se rellenan con estimaciones. Ver `security/SLA.md`.
