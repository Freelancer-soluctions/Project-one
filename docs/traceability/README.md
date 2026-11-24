# Matriz de trazabilidad de requisitos (RTM)

Este directorio alberga las matrices de trazabilidad de requisitos (RTM) de los changes de OpenSpec.

## Convención

- Un archivo por change: `docs/traceability/<change-name>.md`.
- La RTM vincula requisito (Feature Brief / RN-xxx) → change (`openspec/changes/<name>/`) →
  spec (delta) → task → código → prueba → evidencia.
- Se crea junto con el change y se actualiza en `/opsx:verify`; no se archiva con el change (sirve de evidencia histórica).
- El formato mínimo es una tabla con columnas: `Requisito | Escenario | Task | Código | Prueba | Evidencia`.

## Estado actual

Todavía no hay RTM materializadas; el directorio existe para que las referencias de
`docs/product/De-stakeholder-a-producción-flujo-completo-de una-feature.md` y
`openspec/config.yaml` resuelvan. La primera RTM se añadirá cuando un change la requiera.
