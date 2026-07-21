# Proposal: Document System Modules (Updated)

## Why (Problem)

El sistema actual carece de documentación técnica integral para la mayoría de sus módulos. Actualmente:

- **events.md** y **notes.md** existen como documentos de referencia completos, siguiendo un formato híbrido arc42 / C4 Model / IEEE 1016.
- El resto de módulos (~23) no tienen ningún tipo de documentación técnica estructurada.
- Existen **stubs ligeros** (server-*.md y client-*.md) que son versiones incompletas y separadas por capa, sin valor arquitectónico real.
- No hay trazabilidad entre el código fuente (`apps/server/src/modules/*` y `apps/client/src/modules/*`) y documentación formal.
- La incorporación de nuevos desarrolladores requiere un esfuerzo significativo de descubrimiento del código.
- El conocimiento del sistema reside únicamente en el código fuente y en la memoria del equipo.

## What (Solution)

Documentar todos los módulos del sistema usando el mismo formato y nivel de detalle que `events.md` — un enfoque híbrido **arc42 / C4 Model / IEEE 1016**.

### Entregables Concretos

1. **Documentos consolidados full-stack** — Cada módulo produce un único archivo `<module>.md` que cubre tanto servidor (`apps/server/src/modules/<module>/`) como cliente (`apps/client/src/modules/<module>/`), exactamente como `events.md`.
2. **Cobertura total** — ~25 módulos del sistema documentados con los mismos 20 apartados de events.md.
3. **INDEX.md actualizado** — Reflejar los documentos consolidados, eliminando la separación obsoleta Server/Client.
4. **Stubs viejos eliminados** — `server-*.md` y `client-*.md` reemplazados por sus versiones consolidadas.

### Alcance

| Tipo | Detalle |
|------|---------|
| **In-Scope** | Documentación de todos los módulos del sistema con el formato arc42/C4/IEEE 1016. Revisión de cada módulo contra código fuente real. INDEX.md actualizado. Stubs legacy eliminados. |
| **Out-of-Scope** | Generación automatizada de documentación. Cambios en el código fuente. Refactorización de módulos. Pruebas de documentación archivos. |

### Estrategia de Ejecución

- Mega-cambio: un solo cambio OpenSpec para toda la documentación.
- Tareas secuenciales: un task por módulo, en orden de implementación.
- Cada task: explorar código fuente → generar markdown → revisar consistencia.

## Impacto

- **Positivo**: Reducción drástica del tiempo de onboarding. Trazabilidad código ↔ documentación. Base para futuras auditorías y revisiones de arquitectura.
- **Negativo**: Esfuerzo único significativo (~28 tareas). Mantenimiento futuro requerido para mantener docs sincronizados con código.

## Criterios de Aceptación

- [ ] Cada módulo documentado tiene un archivo `<module>.md` en `docs/modules/` siguiendo la misma estructura de 20 apartados que `events.md`.
- [ ] Cada documento refleja fielmente el código fuente real (endpoints, componentes, esquemas, rutas, permisos).
- [ ] INDEX.md listado consolidado sin separación Server/Client.
- [ ] Stubs viejos (`server-*.md`, `client-*.md`) eliminados.
- [ ] Los diagramas Mermaid son correctos y renderizables.
