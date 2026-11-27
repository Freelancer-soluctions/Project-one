# Design: ci-mise-toolchain-parity

## Context

Project One usa `.tool-versions` + script manual para herramientas de lint/seguridad. La CI las instala por caminos distintos (Actions SHA-pinned, `uvx`, `docker run`). Se busca paridad verificable multiplataforma y air-gapped con Mise.

## Goals

- Fuente única de verdad para toolchain (lint/security) en `mise.toml` + `mise.lock`.
- Ejecución bloqueante (`--locked`) en CI y local.
- Multiplataforma (Windows/macOS/Linux) y air-gapped.
- Onboarding reproducible en un comando.
- Gobernanza: checksums, trust model, auditoría.

## Non-Goals

- Migrar runtime de Node/Python (ya gestionado por `.nvmrc`/`pyproject`); solo tools.
- Reemplazar Husky o los workflows existentes; integrar Mise en ellos.
- Cambiar las políticas de seguridad (`.checkov.yml`, etc.); solo cómo se instalan/ejecutan las herramientas.

## Decisions

### D1: Mise como SSOT

Adoptar `mise.toml` en raíz con `monorepo_root = true` para el toolchain de lint/seguridad. Node se declara aquí por paridad con `.nvmrc`, pero `.nvmrc` permanece como SSOT del runtime durante la migración (Non-Goals: runtime de Node/Python fuera de alcance).

### D2: Lockfile commiteado

`mise.lock` generado con `mise lock --platform ...` y commiteado. Verificación en CI con `MISE_LOCKED=1` y `locked_require_checksum = true`.

### D3: Backends por herramienta

- Binarios precompilados vía `aqua` (hadolint, actionlint, zizmor, gitleaks) — multiplataforma + checksums.
- Paquetes Python vía `pipx` (checkov, semgrep, guarddog) — aislados, wheels verificadas.
- Runtime Node/Python/uv vía `core`/`aqua`.

### D4: Caché seguro

Cachear `downloads-cas` (verificado por checksum), nunca `installs`. En air-gapped, pre-sembrar el caché y usar `MISE_OFFLINE=1`.

### D5: Hooks con Mise

`.husky/pre-commit` y `pre-push` invocan herramientas vía `mise exec` o shims. Si falta una herramienta, fallar en CI; en local, fail-open documentado solo para opcionales.

### D6: Gobernanza

- Trust model: normal por defecto, paranoid opt-in por desarrollador.
- `trusted_config_paths` para la raíz; `ignored_config_paths` para worktrees temporales.
- CODEOWNERS sobre `mise.toml`, `mise.lock`, `.husky/`.

### D7: Rollback

Si Mise falla en CI, el job falla (no fallback silencioso). Rollback = revertir el PR que introduce Mise; los scripts legacy (`.tool-versions`) se mantienen como fallback durante la migración.

## Risks / Trade-offs

- **Curva de aprendizaje** de Mise para devs (mitigación: onboarding doc + `mise doctor`).
- **Windows**: paths y shims distintos (mitigación: documentar `%LOCALAPPDATA%\mise`).
- **Air-gapped**: requiere pre-sembrado del caché (mitigación: job de mirror + docs).
- **Drift de backends**: versiones de aqua/pipx pueden cambiar (mitigación: lockfile + `mise lock --check` en CI).

## Migration Plan

1. Crear `mise.toml` + `mise.lock` en raíz.
2. Añadir `mise install --locked` a workflows (job dedicado de cache).
3. Actualizar hooks para usar Mise.
4. Añadir job `toolchain-verify`.
5. Deprecar `.tool-versions` y `scripts/install-lint-tools.sh`.
6. Documentar onboarding y air-gapped.
7. Eliminar legacy tras validación.
