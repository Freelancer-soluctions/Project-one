# Design: pbt-hardening

## Context

Gaps verificados por el review de PBT (2026-11-05). El gate es blocking (correcto); faltan propiedades de dominio, SUT real, negativas, artefacto en fallo y sync de specs.

## Goals / Non-Goals

**Goals:**

- Cerrar los 5 gaps como cambios definitivos (blocking).
- Sincronizar specs a la postura blocking.

**Non-Goals:**

- No cambiar el gate (ya blocking).

## Decisions

- **D1 — Invariantes de dominio**: crear propiedades sobre helpers reales (`stock`, `attendance`).
- **D2 — SUT real**: importar helpers de paginación, stock, dinero en los predicados.
- **D3 — Propiedades negativas**: valores inválidos → rechazados.
- **D4 — Artefacto en fallo**: upload-artifact + reporter junit/json en job property-tests.
- **D5 — Sync de specs**: actualizar delta y main spec a blocking.
