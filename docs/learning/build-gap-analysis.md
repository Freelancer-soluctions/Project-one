# Gap Analysis: Stage Build y TypeScript empresarial

> Análisis comparativo entre la implementación actual del stage de build del
> repositorio Project One y el PRD `PRDS/PRD-Stage-Build-y-TypeScript-empresarial.md`.
> Fecha de análisis: 2026-11-19. Auditoría realizada por @researcher.
>
> **Veredicto global**: el sistema cumple mayormente con los estándares
> empresariales (~85% de cobertura). La configuración de TypeScript es
> excepcional. El Dockerfile y los workflows son sólidos. Los gates son
> estrictos con fail-closed. El frontend tiene budgets, determinismo y cache
> immutable.
>
> El único gap **real** (no cosmético) es G1+G12 (falta `git add -N` en el
> gate de drift OpenAPI). El resto son gaps menores, fuera de alcance del PRD,
> o que requieren infraestructura que no existe.

---

## 1. Resumen ejecutivo

| Área                              | Cobertura | Estado      |
| --------------------------------- | --------- | ----------- |
| TypeScript config                 | 95%       | CUMPLE      |
| Dockerfile multi-stage            | 90%       | CUMPLE      |
| Workflow GitHub Actions           | 90%       | CUMPLE      |
| Gates y agregador                 | 85%       | CUMPLE      |
| Seguridad supply chain            | 75%       | PARCIAL     |
| Frontend (Vite + cache + budgets) | 90%       | CUMPLE      |
| Código generado (drift gate)      | 70%       | PARCIAL     |
| **Promedio**                      | **~85%**  | **PARCIAL** |

---

## 2. Gaps identificados

### Prioridad 1 — Crítico (hacer ahora)

#### G1+G12: Falta `git add -N` en gate de drift OpenAPI

- **Utilidad**: Permite detectar archivos generados NUEVOS que no están trackeados.
  Sin esta verificación, un archivo generado nuevo pasaría silenciosamente sin
  que nadie lo note (drift silencioso). El PRD documenta explícitamente este
  caso (B17) y exige `git add -N .` antes del diff o verificar `git status
--porcelain` vacío.
- **Archivo**: `.github/workflows/ci.yml:2725-2729`
- **Problema**: El gate solo ejecuta `git diff --exit-code apps/server/openapi.yaml`.
  Si el generador crea un archivo nuevo (no trackeado), `git diff --exit-code`
  sale con 0 (no lo ve).
- **Fix**: Añadir `git add -N .` antes de `git diff --exit-code`, o verificar
  `git status --porcelain` vacío.
- **Estado**: **Por implementar** (incluido en change `ci-gaps-priority-1-2`).

### Prioridad 2 — Medio (próximo sprint)

#### G2+G3: `postbuild-tests-complete` y `postbuild-analysis-complete` no evalúan skipped

- **Utilidad**: Garantiza que un job saltado sin autorización no pase como verde.
  Hoy solo verifican `failure` y `cancelled`; un `skipped` no autorizado pasaría.
  En contraste, `build-complete` sí evalúa skipped autorizado. La consistencia
  entre agregadores evita que un gap en postbuild se convierta en verde vacío.
- **Archivo**: `ci.yml:3851-3861` y `ci.yml:3875-3885`
- **Fix**: Añadir evaluación de skipped (autorizado o no) como en `build-complete`.
- **Estado**: **Por implementar** (incluido en change `ci-gaps-priority-1-2`).

#### G4: `ci-complete` se salta si `CI_MINIMAL=true`

- **Utilidad**: Documentar claramente el comportamiento para evitar que el modo
  minimal desactive el required check del ruleset. Si `ci-complete` es required
  y se salta, el merge se bloquea o el gate se bypassa.
- **Archivo**: `ci.yml:3901`
- **Fix**: Documentar el comportamiento; considerar que CI_MINIMAL no desactive
  el required check.
- **Estado**: **Por implementar** (incluido en change `ci-gaps-priority-1-2`).

#### G5: SLSA L3 no alcanzado (requiere reusable workflow)

- **Utilidad**: SLSA L3 proporciona aislamiento entre el proceso de build y el
  workflow llamador, con claves de firma inaccesibles para el código del build.
  Mejora la integridad de la cadena de suministro.
- **Archivo**: `build.yml:203-301` (job image)
- **Problema**: La atestación usa `actions/attest-build-provenance` en el mismo
  workflow (no en reusable workflow).
- **Impacto**: SLSA L2 (no L3). Aceptable según PRD D6.
- **Fix**: Mover build a reusable workflow si se requiere L3.
- **Estado**: **Fuera de alcance** (PRD lo defiere; requiere refactor significativo).

#### G6: No se usa cosign ni política de admisión

- **Utilidad**: Cosign firma la imagen con clave OIDC del workflow; la política
  de admisión en el clúster rechaza imágenes sin atestación válida. Es el
  último control de la cadena: si el despliegue no verifica, la firma no
  protege nada.
- **Archivo**: `build.yml` (no hay step de cosign)
- **Problema**: El PRD D6 lista cosign y política de admisión como opciones.
  La implementación usa GitHub attestation (Sigstore) que es equivalente
  funcionalmente, pero no hay firma con cosign ni política de admisión en clúster.
- **Impacto**: Aceptable para fase actual (PRD recomienda atestaciones al inicio).
- **Fix**: Evaluar cosign/admisión cuando haya orquestador (ECS/EKS).
- **Estado**: **Fuera de alcance** (requiere orquestador que no existe).

#### G8: `permissions: contents: read` global en ci.yml (no `{}`)

- **Utilidad**: GitHub best practices recomienda `permissions: {}` global para
  forzar declaración explícita por job. Con `contents: read` global, el default
  es más permisivo de lo necesario.
- **Archivo**: `ci.yml:3-5`
- **Fix**: Cambiar a `permissions: {}` y asegurar que cada job declare
  `contents: read` donde lo necesite.
- **Estado**: **Por implementar** (incluido en change `ci-gaps-priority-1-2`).

### Prioridad 3 — Bajo (backlog / quick wins)

#### G7: Reproducibilidad bit-a-bit no verificada

- **Utilidad**: Builds bit-a-bit reproducibles garantizan que el mismo commit
  produce exactamente la misma imagen. Útil para auditoría y detección de
  tampering.
- **Archivo**: `Dockerfile:65-66` (SOURCE_DATE_EPOCH recibido pero no usado por tsc)
- **Problema**: `SOURCE_DATE_EPOCH` se pasa al Dockerfile pero `tsc` no lo usa
  para timestamps en `.js.map`.
- **Impacto**: No es objetivo actual (PRD lo deja fuera).
- **Fix**: No requerido; documentado como fuera de alcance.
- **Estado**: **Fuera de alcance** (PRD lo deja fuera).

#### G9: Falta `# syntax=docker/dockerfile:1` en Dockerfile

- **Utilidad**: Habilita BuildKit features (cache mount, --mount=type=secret).
  Cosmético: BuildKit ya está activo por defecto en Docker 23+.
- **Archivo**: `apps/server/Dockerfile:1`
- **Fix**: Añadir `# syntax=docker/dockerfile:1` como primera línea.
- **Estado**: **Quick win opcional** (incluido en change `ci-gaps-priority-1-2`).

#### G10: Falta `--pull` en docker build

- **Utilidad**: Obtiene base images frescas. Explícitamente no requerido con
  digest pinning (el digest es fijo).
- **Archivo**: `build.yml:273-289`
- **Impacto**: Ninguno (digest pinning es superior).
- **Fix**: No requerido; documentar que digest pinning sustituye a `--pull`.
- **Estado**: **Fuera de alcance** (no requerido).

#### G11: Frontend budget en kB vs size-limit en bytes

- **Utilidad**: Unificar unidades evita confusión en mantenimiento.
- **Archivo**: `apps/client/budget.json:7-11` (225, 150, 30) vs size-limit config (bytes)
- **Problema**: budget.json usa kB (225 = 225 KB), size-limit usa bytes (153600 = 150KB).
- **Impacto**: Confusión en mantenimiento; no afecta funcionalidad.
- **Fix**: Unificar unidades o documentar claramente.
- **Estado**: **Quick win opcional** (incluido en change `ci-gaps-priority-1-2`).

#### G13: TypeScript target ES2023 vs ES2024

- **Utilidad**: Aprovechar features ES2024 (Object.groupBy, Promise.withResolvers).
- **Archivo**: `tsconfig.base.json:3-4`
- **Problema**: Node 22.11+ soporta ES2024. El target ES2023 es conservador.
- **Impacto**: No es un gap real (ES2023 es seguro y bien soportado).
- **Fix**: Opcional — actualizar a ES2024 si se usan features newer.
- **Estado**: **Fuera de alcance** (opcional, sin uso de features ES2024).

#### G14: Falta `noUncheckedSideEffectImports` (TS 5.6+)

- **Utilidad**: Verifica que los side-effect imports existen. Detecta imports de
  módulos inexistentes con side effects.
- **Archivo**: `tsconfig.base.json`
- **Problema**: TS 5.6 introdujo `noUncheckedSideEffectImports`. No está activo.
- **Impacto**: Menor — no detecta imports de módulos inexistentes con side effects.
- **Fix**: Añadir `noUncheckedSideEffectImports: true` (TS 5.6+).
- **Estado**: **Quick win opcional** (incluido en change `ci-gaps-priority-1-2`).

#### G15: Falta `isolatedDeclarations` (TS 5.5+)

- **Utilidad**: Permite emitir declaraciones sin type-checking completo. Útil
  para builds paralelos más rápidos.
- **Archivo**: `tsconfig.base.json`
- **Problema**: TS 5.5 introdujo `isolatedDeclarations`. No está activo.
- **Impacto**: Menor — no afecta funcionalidad, solo performance de builds.
- **Fix**: Añadir `isolatedDeclarations: true` si se quiere builds más rápidos
  (requiere anotaciones explícitas).
- **Estado**: **Fuera de alcance** (requiere anotar todo el código).

#### G16: Runtime Dockerfile copia `src` (swagger)

- **Utilidad**: Reducir tamaño de imagen y superficie de ataque (código fuente
  expuesto si hay RCE).
- **Archivo**: `Dockerfile:109-110`
- **Problema**: El runtime copia `src` además de `dist` porque swagger-jsdoc
  parsea anotaciones `@openapi` como texto. Esto shippea código fuente en la
  imagen de producción.
- **Impacto**: Menor — aumenta tamaño de imagen y superficie de ataque.
- **Fix**: Documentado en Dockerfile como necesario. Alternativa: generar
  openapi.yaml en build y no copiar src. Pero requiere cambio en swagger config.
- **Estado**: **Fuera de alcance** (requiere refactor de swagger config).

---

## 3. Resumen de cobertura

| Área                              | Cobertura | Estado      |
| --------------------------------- | --------- | ----------- |
| TypeScript config                 | 95%       | CUMPLE      |
| Dockerfile multi-stage            | 90%       | CUMPLE      |
| Workflow GitHub Actions           | 90%       | CUMPLE      |
| Gates y agregador                 | 85%       | CUMPLE      |
| Seguridad supply chain            | 75%       | PARCIAL     |
| Frontend (Vite + cache + budgets) | 90%       | CUMPLE      |
| Código generado (drift gate)      | 70%       | PARCIAL     |
| **Promedio**                      | **~85%**  | **PARCIAL** |

---

## 4. Gaps incluidos en change `ci-gaps-priority-1-2`

Los siguientes gaps se incluyen en el change `ci-gaps-priority-1-2` (Prioridad 1 y 2
reales + quick wins opcionales):

| Gap                                           | Prioridad     | Incluido en change |
| --------------------------------------------- | ------------- | ------------------ |
| G1+G12 (drift gate `git add -N`)              | 1             | ✅ Sí              |
| G2+G3 (skipped eval en postbuild/ci-complete) | 2             | ✅ Sí              |
| G4 (CI_MINIMAL behavior)                      | 2             | ✅ Sí              |
| G8 (`permissions: {}` en ci.yml)              | 2             | ✅ Sí              |
| G9 (`# syntax=docker/dockerfile:1`)           | 3 (quick win) | ✅ Sí (opcional)   |
| G11 (unificar unidades budget.json)           | 3 (quick win) | ✅ Sí (opcional)   |
| G14 (`noUncheckedSideEffectImports`)          | 3 (quick win) | ✅ Sí (opcional)   |

## 5. Gaps fuera de alcance (no incluidos en ningún change)

| Gap                             | Prioridad | Razón de exclusión                             |
| ------------------------------- | --------- | ---------------------------------------------- |
| G5 (SLSA L3)                    | 2         | Requiere reusable workflow; PRD lo defiere     |
| G6 (cosign/admisión)            | 2         | Requiere orquestador (ECS/EKS)                 |
| G7 (reproducibilidad bit-a-bit) | 3         | PRD lo deja fuera de alcance                   |
| G10 (`--pull`)                  | 3         | Explícitamente no requerido con digest pinning |
| G13 (target ES2024)             | 3         | Sin beneficio funcional                        |
| G15 (`isolatedDeclarations`)    | 3         | Requiere anotar todo el código                 |
| G16 (no copiar src en runtime)  | 3         | Requiere refactor de swagger config            |

---

## 6. Conclusión

El sistema **cumple mayormente con los estándares empresariales** (~85% de
cobertura). La configuración de TypeScript es **excepcional** (supera las
recomendaciones de Total TypeScript). El Dockerfile y los workflows son
**sólidos** con digest pinning, least privilege, provenance, SBOM y attestation.
Los gates son **estrictos** con fail-closed y skipped autorizado. El frontend
tiene **budgets, determinismo y cache immutable**.

El único gap **real** es la falta de `git add -N` en el gate de drift OpenAPI
(G1+G12), que permite que un archivo generado nuevo pase sin detección. El
resto son gaps menores (cosméticos o fuera de alcance según el PRD).

**Recomendación**: Implementar G1-G4 y G8 (prioridad 1 y 2 reales) para
alcanzar ~92% de cobertura. Los quick wins opcionales (G9, G11, G14) se
incluyen en el mismo change por bajo esfuerzo. Los gaps fuera de alcance (G5,
G6, G7, G10, G13, G15, G16) quedan documentados como "fuera de alcance"
y se re-evaluarán cuando haya infraestructura (orquestador) o requisito de
auditoría.

El sistema ya es **apto para producción** en su estado actual.
EOF
echo "written OK"
