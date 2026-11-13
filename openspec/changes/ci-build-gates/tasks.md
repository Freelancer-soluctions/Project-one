# Tasks

## 1. Agregador estricto

- [ ] 1.1 Reescribir `build-complete` en `ci.yml`: `if: always()`, evaluar resultados explícitamente (failure/cancelled/skipped no autorizado → rojo).
- [ ] 1.2 Documentar la regla: un `skipped` solo se acepta si una salida de detección de cambios lo autoriza.
- [ ] 1.3 Añadir `timeout-minutes` a `client-build`, `server-build`, `build-complete`.

## 2. Triggers y merge queue

- [ ] 2.1 Añadir `merge_group` trigger a `ci.yml` (si hay cola de merge).
- [ ] 2.2 Verificar que los checks obligatorios no quedan pending en merge queue.

## 3. Ruleset

- [ ] 3.1 Ejecutar el workflow en una rama de prueba para que `build-complete` se reporte ≥1 vez.
- [ ] 3.2 Añadir `build-complete` al ruleset 21227644 como required check (GET → modify → PUT, nunca PATCH).
- [ ] 3.3 Documentar el rollback (quitar el contexto del ruleset).

## 4. Gates y documentación

- [ ] 4.1 Documentar G1-G7 con niveles inicial en `docs/learning/quality-gates.md`.
- [ ] 4.2 Definir el umbral de tamaño de imagen (G7) y de duración (G6) tras medir.
- [ ] 4.3 Documentar el proceso de excepciones (vulnerabilidades aceptadas con fecha de caducidad).

## 5. Gaps del reviewer (2026-11-12)

- [ ] 5.1 Reescribir `build-complete` para que falle ante `failure`, `cancelled` y `skipped` no autorizado (hoy emite verde "succeeded or skipped" — verde vacío).
- [ ] 5.2 Desactivar `if: false` en `client-build` y `server-build` (Stage 3 apagado) o documentar la decisión de no-op para server.
- [ ] 5.3 Añadir `build-complete` al ruleset de `main` como required check tras ≥1 run real (GET → modify → PUT, nunca PATCH).