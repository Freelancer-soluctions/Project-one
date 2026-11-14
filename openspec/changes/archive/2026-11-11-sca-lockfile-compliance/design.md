# Design — sca-lockfile-compliance

## Decisiones

1. **Promoción gradual.** Seguir el patrón de `containerfile-lint` y `typosquatting-detection`: quitar `continue-on-error: true`, añadir al `needs` del agregador, actualizar `quality-gates.md`. Rollback = un solo revert.

2. **Condicionamiento a nivel de step, no de job.** El job `lockfile-audit` se ejecuta en cada PR (`if: github.event_name == 'pull_request'`). Solo el step de OSV-Scanner se gated on lockfile changes (`needs.repo-discovery.outputs.lockfile == 'true'`). El step de `npm audit` siempre ejecuta si el lockfile está presente. El guard de lockfile obligatorio falla solo cuando `manifests==true && lockfile!=true`.

3. **OSV-Scanner como paso blocking.** Añadir un step en el job `lockfile-audit` que ejecuta `osv-scanner scan -L package-lock.json` para cobertura multi-ecosistema. Gated on lockfile changes. Blocking desde día uno (sin `continue-on-error`). Si el binario no se instala (fallo de red/checksum), el step de scan se salta vía `hashFiles` guard y el job falla por el install step.

4. **Calibración 2-4 semanas.** Antes de promover a blocking, observar runs sin falsos positivos. `npm audit` con `--audit-level=moderate` puede generar ruido en dependencias de desarrollo; calibrar el umbral.

5. **No implementar EPSS/KEV nativamente.** OSV-Scanner solo output CVSS. EPSS/KEV requieren join manual con FIRST EPSS feed + CISA KEV catalog. Documentar como limitación. Si se necesita triage completo, evaluar Snyk (comercial).

6. **Lockfile obligatorio (custom).** GitHub no enforcea nativamente la presencia de lockfile. Añadir un step que verifique que `package-lock.json` existe cuando `package.json` cambia. Implementable via script, no built-in.

## No se toca

- `security.yml` ni `scheduled-security.yml` (dependency-scan sigue advisory siempre).
- No se cambia la versión de npm audit.
- No se implementa Snyk en este change (decisión abierta).
