# Design — sca-lockfile-compliance

## Decisiones

1. **Promoción gradual.** Seguir el patrón de `containerfile-lint` y `typosquatting-detection`: quitar `continue-on-error: true`, añadir al `needs` del agregador, actualizar `quality-gates.md`. Rollback = un solo revert.

2. **Condicionamiento en lockfile.** El job ya está cableado a `repo-discovery`. Verificar que se ejecuta solo cuando hay cambios en `package-lock.json` (o equivalente). Si no, añadir la condición.

3. **OSV-Scanner como paso opcional.** Añadir un step adicional en el job `lockfile-audit` que ejecuta `osv-scanner --lockfile=package-lock.json` para cobertura multi-ecosistema. Gated on lockfile changes. Advisory en FASE 1, blocking en FASE 2.

4. **Calibración 2-4 semanas.** Antes de promover a blocking, observar runs sin falsos positivos. `npm audit` con `--audit-level=moderate` puede generar ruido en dependencias de desarrollo; calibrar el umbral.

5. **No implementar EPSS/KEV nativamente.** OSV-Scanner solo output CVSS. EPSS/KEV requieren join manual con FIRST EPSS feed + CISA KEV catalog. Documentar como limitación. Si se necesita triage completo, evaluar Snyk (comercial).

6. **Lockfile obligatorio (custom).** GitHub no enforcea nativamente la presencia de lockfile. Añadir un step que verifique que `package-lock.json` existe cuando `package.json` cambia. Implementable via script, no built-in.

## No se toca

- `security.yml` ni `scheduled-security.yml` (dependency-scan sigue advisory siempre).
- No se cambia la versión de npm audit.
- No se implementa Snyk en este change (decisión abierta).
