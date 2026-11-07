# Tasks: pbt-hardening

## 1. Invariantes de dominio

- [ ] 1.1 Crear propiedad de stock ≥ 0 sobre `stockCreateSchema` (Joi, ya parcialmente cubierto en schemas.properties). Nota: no existe helper real de stock/inventory; el guard es el schema.
- [ ] 1.2 (BLOQUEADO) Idempotencia check-in/out de asistencia: attendance/service.ts no tiene lógica de idempotencia. Requiere implementarla primero (fuera de alcance de este change) o acotar a schema validation.
- [ ] 1.3 Verificar que mutar el SUT rompe las propiedades.

## 2. SUT real

- [x] 2.1 Reapuntar paginación a `src/utils/pagination/**` (importar helper real).
- [ ] 2.2 Reapuntar `money` a cálculo monetario real del repo (no conmutatividad genérica).

## 3. Propiedades negativas

- [ ] 3.1 Añadir propiedades de rechazo (valores inválidos → error) en schemas server y client.

## 4. Artefacto en fallo

- [x] 4.1 Añadir `actions/upload-artifact` (if: failure()) al job `property-tests`.
- [x] 4.2 Añadir reporter junit/json al job.

## 5. Sync de specs

- [x] 5.1 Actualizar delta spec `property-based-testing` a postura blocking.
- [x] 5.2 Actualizar main spec `ci-prebuild-substage-structure` (quitar `continue-on-error: true`).
- [x] 5.3 `openspec sync pbt-hardening` (o manual).

## 6. Cierre

- [x] 6.1 `npm run test:pbt` verde.
- [x] 6.2 `openspec validate pbt-hardening --strict` exit 0.
- [ ] 6.3 Archivar `property-based-testing-adoption` (si no archivado).
- [ ] 6.4 Archivar este change.
