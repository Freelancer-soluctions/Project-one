# ci-type-check-cache Specification

## Purpose

Persistencia y caché del tsBuildInfo en los jobs de typecheck de CI. `strict` ya está activo en `apps/server/tsconfig.json` y se gobierna por `config-correctness` (un flag por paso); este change no lo toca. `@typescript-eslint/ban-ts-comment` se añade en `ci-quality-gates-blocking-hardening` (P1.6) y no se duplica aquí.

## ADDED Requirements

### Requirement: Type check con tsBuildInfo persistido y cacheado

Los steps `client-typecheck` y `server-typecheck` de `ci.yml` SHALL ejecutar `tsc --noEmit --tsBuildInfoFile <ruta>` y cachear el directorio del tsBuildInfo en CI (`actions/cache`) con clave de lockfile + fuentes. `--incremental` es redundante (ya activo en `tsconfig.json`/`apps/server/tsconfig.json`) y no se añade.

#### Scenario: Cache hit

- **WHEN** la caché del tsBuildInfo está disponible
- **THEN** tsc reutiliza el tsBuildInfo generado en corridas anteriores
- **AND** un error de tipos real devuelve exit 2

#### Scenario: Cache miss

- **WHEN** no hay caché
- **THEN** tsc genera el tsBuildInfo desde cero
- **AND** el archivo se cachea para la siguiente corrida

#### Scenario: Error de tipos

- **WHEN** existe un error de tipos
- **THEN** `tsc --noEmit` devuelve exit 2
- **AND** el job falla

### Requirement: Client fuera de alcance

El client (100% JS, `checkJs: false`) SHALL quedar fuera de alcance de este change hasta que exista una migración TS del client. Activar `strict` en `tsconfig.json` raíz sin `checkJs` SHALL NOT cambiar el comportamiento.

#### Scenario: Client sin checkJs

- **WHEN** el client no tiene `checkJs: true`
- **THEN** `strict` en la config raíz no afecta al client
- **AND** este change no modifica `tsconfig.json` raíz para strict
