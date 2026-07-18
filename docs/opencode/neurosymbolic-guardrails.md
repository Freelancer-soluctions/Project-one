# Neurosymbolic Guardrails — Especificación de Diseño

> **Estado del sistema auditado (2026-07-17):** Layer 4 está EN IMPLEMENTACIÓN. El plugin `neurosymbolic-guardrails.ts` (337 LoC) y `guardrails-rules.ts` (591 LoC) **EXISTEN** con las 12 reglas implementadas. Phases 1-3 completadas (13/13 tareas). Restan Phase 4 (verificación de auditoría), Phase 6 (pruebas, hardening, steer workaround).
>
> **Última actualización de arquitectura:** 2026-07-17
> **Versión de OpenCode probada:** v1.18.1+
> **Fuentes:** OpenSpec change `openspec/changes/add-neurosymbolic-guardrails/`, `hooks.md`, auditoría del codebase

---

## 1. Introducción

### ¿Qué son los guardrails neurosymbolic? (No técnico)

Imagina un **filtro de seguridad** que se activa antes de que cualquier agente intente ejecutar un comando. Este filtro no depende de que el modelo de IA "decida" seguir las reglas — las reglas están escritas en **código determinista** que se ejecuta fuera del modelo, en el framework de OpenCode.

Es como tener un guardia de seguridad en la puerta de una sala de servidores. El guardia no confía en que la persona que entra sea inocente — verifica su identificación,包里 y propósito **antes** de dejarlo pasar. Si algo está mal, lo bloquea.

**Para stakeholders:** Protege contra operaciones destructivas, exposición de credenciales y modificaciones no autorizadas — incluso si el modelo de IA está siguiendo instrucciones maliciosas o cometió un error.

**Para desarrolladores:** Complementa los permisos de OpenCode (`opencode.jsonc`) añadiendo validación semántica de argumentos de herramientas. Los permisos dicen "quién puede hacer qué"; los guardrails dicen "cómo se hace correctamente".

### Por qué existen en este proyecto

En July 2026, el equipo implementó un sistema de **6 capas de enforcement** para proteger el monorepo. Las capas 1, 2, 3, 5 y 6 ya estaban activas. Faltaba la **Capa 4**: prevención pre-ejecución. Este cambio la cierra.

La estrategia se basa en el artículo *"AI Agent Guardrails: Rules That LLMs Cannot Bypass"* (AWS, dev.to, 2026), que demostró que prompts y reglas de sistema son **sugerencias** que un LLM puede ignorar. La única forma de hacer reglas **inevitable** es ejecutarlas fuera del modelo.

---

## 1.1 Auditoría del Sistema — Estado Real (2026-07-17)

> Esta sección refleja el resultado de una auditoría completa del codebase. Muestra qué capas de enforcement están implementadas REALMENTE vs. lo que el diseño especifica.

### Estado de las 6 Capas de Enforcement

| Capa | Mecanismo | Implementado? | Archivo / Fuente |
|------|-----------|---------------|-----------------|
| **Layer 1** | Auto-validación en prompts (9 agentes con output-contract + SELF-VALIDATION) | ✅ SÍ | `docs/opencode/prompts/*.md` — cada prompt tiene instrucciones de output-contract y self-validation |
| **Layer 2** | `output-contracts.ts` plugin (`tool.execute.after` filtrado a `task`) | ✅ SÍ | `.opencode/plugins/output-contracts.ts` (361 líneas) |
| **Layer 2** | `contractValidator.js` (Ajv validation con schemas por agente) | ✅ SÍ | `docs/opencode/prompts/contracts/contractValidator.js` (339 líneas) |
| **Layer 2** | Schemas JSON por agente (8 archivos) | ✅ SÍ | `docs/opencode/prompts/contracts/*.schema.json` |
| **Layer 3** | Orchestrator re-delegation basada en `metadata.contractValidation` | ✅ SÍ | `docs/opencode/prompts/orchestrator.md` (sección SELF-VALIDATION) |
| **Layer 4** | `neurosymbolic-guardrails.ts` — 12 reglas pre-ejecución | ⚠️ **EN IMPLEMENTACIÓN** | `.opencode/plugins/neurosymbolic-guardrails.ts` (337 líneas, hook registrado) |
| **Layer 4** | `guardrails-rules.ts` — interfaz Rule + TOOL_RULES | ⚠️ **EN IMPLEMENTACIÓN** | `.opencode/plugins/guardrails-rules.ts` (591 líneas, 12 reglas implementadas) |
| **Layer 5** | Permission block en `opencode.jsonc` (15 deny/allow globals + 8 overrides) | ✅ SÍ | `opencode.jsonc` líneas 68-219 |
| **Layer 6** | `contract-audit.jsonl` (desde output-contracts.ts) | ✅ SÍ (parcial) | Se escribirá en `.opencode/logs/` cuando haya fallos de Layer 2 |
| **Layer 6** | `guardrails-audit.jsonl` (desde Layer 4) | ❌ **NO EXISTE** | Requiere Layer 4 |

### Mecanismos Adicionales Encontrados

| Mecanismo | Implementado? | Archivo / Fuente |
|-----------|---------------|-----------------|
| MCP proxy (`proxy/sanitize.js`) — bloquea injection en tool descriptions | ⚠️ **PARCIAL** (código existe, NO conectado) | `.opencode/proxy/sanitize.js` (96 líneas) — registrado pero comentado en `opencode.jsonc` |
| Express middleware (auth, rateLimit, validation, CSP, CSRF, errorHandler) | ✅ SÍ | `apps/server/src/middleware/index.js` — 9 middlewares activos |
| Husky hooks (pre-commit) | ❌ **NO INSTALADO** | `.husky/` no existe — `prepare` script en `package.json` línea 22 nunca se ejecutó |
| CI/CD pipelines | ❌ **NO EXISTE** | `.github/workflows/` no encontrado |
| Gitleaks secrets scanning | ⚠️ **PARCIAL** (script existe, no automatizado) | `package.json` scripts `security:secrets`, `.gitleaks.toml` |
| Semgrep SAST | ⚠️ **PARCIAL** (script existe, no automatizado) | `package.json` scripts `sast:semgrep:*` |

### Vulnerabilidades Activas (sin Layer 4)

Las siguientes operaciones NO tienen restricción mientras Layer 4 no esté implementado:

| # | Vulnerabilidad | Agentes afectados | Layer 5 ya cubre? |
|---|---------------|-------------------|------------------|
| 1 | `git push --force` | @developer, @git-manager (ambos tienen `bash: allow`) | ❌ No — Layer 5 no diferencia flags |
| 2 | `prisma db push --force-reset` | @developer (`bash: allow`) | ❌ No |
| 3 | `git commit --no-verify` | @git-manager (`bash: allow`) | ❌ No |
| 4 | `rm -rf .git` | @developer, @git-manager | ❌ No |
| 5 | Escritura directa a `.env` | @developer (`write: allow`) | ❌ No |
| 6 | `git rebase`, `git reset --hard` | @git-manager (`bash: allow`) | ❌ No |
| 7 | `curl ... \| sh` (ejecución no convencional) | @developer (`bash: allow`) | ❌ No |
| 8 | Git via Composio (si se activa) | @project-manager | ⚠️ Parcialmente (composio tiene `bash: deny` global) |
| 9 | `python -c "..."` via bash | @developer (`bash: allow`) | ❌ No |
| 10 | Llamados directos a Trello API via curl | @orchestrator (`bash: deny` global) | ✅ Sí — orchestrator tiene `bash: deny` global |

> **Nota**: Layer 5 (opencode.jsonc permissions) cubre las restricciones más gruesas. Layer 4 añade validación semántica fina. Ambos son necesarios para defense in depth.

---

## 2. Arquitectura del Sistema de Protección

### Las 6 capas de enforcement

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 6: Audit Log (JSONL) — PARCIAL                        │
│  contract-audit.jsonl ✅ (de Layer 2, activo)               │
│  guardrails-audit.jsonl ❌ (requiere Layer 4 — pendiente)    │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Anotación metadata
                            │
┌─────────────────────────────────────────────────────────────┐
│  LAYER 5: Permisos Granulares (opencode.jsonc) ✅ ACTIVO  │
│  deny/allow por agente y herramienta — cobertura completa   │
└─────────────────────────────────────────────────────────────┘
                            ▲
                            │ Deny = no llega a guardrail
                            │
┌─────────────────────────────────────────────────────────────┐
│  LAYER 4: Guardrails Neurosymbolics — PENDIENTE ❌          │
│  plugin: .opencode/plugins/neurosymbolic-guardrails.ts      │
│  rules:  12 reglas (8 system scan + 4 pattern-based)      │
│  hook:   tool.execute.before + throw Error → cancela        │
│  audit:  guardrails-audit.jsonl (por crear)                │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │ Pass = ejecuta
                           │
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: Orchestrator Escalation (ya existente)            │
│  Re-delegación basada en metadata.contractValidation       │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: Hook Runtime Validation (ya existente)           │
│  output-contracts.ts — tool.execute.after para task          │
└─────────────────────────────────────────────────────────────┘
                           ▲
                           │
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: Auto-validación en Prompts (ya existente)         │
│  Cada agente valida su propia respuesta antes de emitir     │
└─────────────────────────────────────────────────────────────┘
```

**Flujo de una llamada protegida:**

```
1. Agente decide ejecutar bash "git push --force origin main"
2. Layer 5: opencode.jsonc tiene bash:allow para git-manager → PASA
3. Layer 4: neurosymbolic-guardrails recibe tool.execute.before
   → inspecta args {command: "git push --force origin main"}
   → evalúa regla no_git_force_push
   → regex /\bgit\b.*\bpush\b.*--force/ detecta coincidencia
   → throw new Error("BLOCKED: git push --force...")
   → bash NUNCA se ejecuta
4. Layer 6: audit log escribe {"tool":"bash","violations":["git push --force"],"args":{...}}
```

---

## 3. Catálogo Completo de Guardrails

### 3.1 Reglas Diseñadas (12 reglas — PENDIENTES de implementar)

> **Estado real (2026-07-17):** Las 12 reglas están **implementadas** en `.opencode/plugins/guardrails-rules.ts` (591 líneas). El hook `tool.execute.before` está registrado en `neurosymbolic-guardrails.ts` (337 líneas). Phases 1-3 completas. Pendientes: verificación de auditoría (Phase 4), tests, steer workaround (Phase 6).

Cada regla sigue el patrón:
- **Nombre**: identificador único en snake_case
- **Herramienta**: qué tool de OpenCode intercepta
- **Severidad**: CRITICAL (destrucción de datos/historial) / HIGH (pérdida significativa) / MEDIUM (exposición accidental)
- **Trigger**: qué argumento o patrón activa la regla
- **Mensaje de bloqueo**: lo que ve el agente cuando se bloquea

---

#### `no_git_force_push` — CRITICAL

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `bash` |
| **Severidad** | CRITICAL |
| **Trigger** | Comando bash que contiene `git push` con flag `--force` o `-f` |
| **Regex** | `/\bgit\b.*\bpush\b.*(--force|-f)/i` |
| **Mensaje** | "BLOCKED: git push --force destruye el historial compartido. Usa git push sin --force o coordina con el equipo via PR." |

**Ejemplo bloqueado:**
```bash
git push --force origin main
git push -f
git push --force-with-lease origin feature-branch
```

**¿Por qué es CRITICAL?**: Un `git push --force` sobreescribe el historial remoto. Si otros desarrolladores tienen branches basadas en el historial anterior, sus cambios se destruyen. Es irreversible.

**Fuente en proyecto**: `docs/opencode/prompts/git-manager.md` — "🔒 SAFETY: NEVER force push"

---

#### `no_git_rewrite_history` — CRITICAL

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `bash` |
| **Severidad** | CRITICAL |
| **Trigger** | Comandos que reescriben historial de git |
| **Regex** | `/\bgit\b.*(\brebase\b|\breset\b.*--hard|\bcommit\b.*--amend|\bfilter-branch\b|\breflog\b.*\bdelete\b)/i` |
| **Mensaje** | "BLOCKED: Reescritura de historial de git detectada. Usa git revert para deshacer cambios." |

**Ejemplos bloqueados:**
```bash
git rebase main
git rebase -i HEAD~3
git reset --hard origin/main
git commit --amend
git filter-branch --tree-filter 'rm file.txt'
git reflog delete --hard
```

**Fuente en proyecto**: `docs/opencode/prompts/git-manager.md` — "🔒 SAFETY: NEVER rewrite repository history"

---

#### `no_git_no_verify` — CRITICAL

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `bash` |
| **Severidad** | CRITICAL |
| **Trigger** | `git commit` o `git push` con `--no-verify` |
| **Regex** | `/\bgit\b.*\bcommit\b.*--no-verify|\bgit\b.*\bpush\b.*--no-verify/i` |
| **Mensaje** | "BLOCKED: --no-verify salta los hooks de pre-commit (lint, format, Semgrep, Gitleaks). Los hooks son obligatorios." |

**Ejemplos bloqueados:**
```bash
git commit --no-verify -m "wip: fix fast"
git push origin main --no-verify
```

**Fuente en proyecto**: `docs/opencode/prompts/git-manager.md` — "🔒 SAFETY: NEVER use --no-verify"

---

#### `no_prisma_db_push_force_reset` — HIGH

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `bash` |
| **Severidad** | HIGH |
| **Trigger** | `prisma db push --force-reset`, `prisma migrate reset`, `prisma db push --accept-data-loss` |
| **Regex** | `/\bprisma\b.*\bdb\b.*\bpush\b.*--force-reset|/\bprisma\b.*\bmigrate\b.*\breset\b|/\bprisma\b.*\bdb\b.*\bpush\b.*--accept-data-loss/i` |
| **Mensaje** | "BLOCKED: Operación destructiva de base de datos. Usa 'prisma migrate dev' para desarrollo o 'prisma migrate deploy' para producción." |

**Ejemplos bloqueados:**
```bash
npx prisma db push --force-reset
npm run prisma-push -- --force-reset
prisma migrate reset
npx prisma db push --accept-data-loss
```

**¿Por qué es HIGH?**: `prisma db push --force-reset` elimina TODOS los datos de la base de datos y recrea el schema. No hay undo. En desarrollo puede ser aceptable (con consentimiento), pero si se ejecuta en producción es catastrófico.

**Fuente en proyecto**: `apps/server/package.json` scripts `prisma-push`, `prisma-migration`. Schema Prisma con 30+ modelos incluyendo `users` (passwords), `refreshToken`, `products`, `inventoryMovement`, `sale`, `payroll`, `employees`.

---

#### `no_destructive_rm` — HIGH

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `bash` |
| **Severidad** | HIGH |
| **Trigger** | `rm -rf` o `rm -fr` con rutas peligrosas (`.git`, `node_modules`, `dist`, `build`, `prisma/`) |
| **Regex** | `/\brm\b.*(-rf|-fr).*(\.git|node_modules|dist|build|prisma\/)/i` |
| **Allowlist paths** | `/tmp/`, `node_modules/.cache/` |
| **Mensaje** | "BLOCKED: rm -rf detected. Usa eliminación selectiva de archivos o mueve a papelera temporal." |

**Ejemplos bloqueados:**
```bash
rm -rf .git
rm -rf apps/server/node_modules
rm -rf apps/server/dist
rm -fr prisma/migrations
```

**Ejemplo que SÍ pasa** (carpetas allowlistadas):
```bash
rm -rf /tmp/my-temp-files
rm -rf node_modules/.cache/vite/*
```

**Nota de implementación**: La regla solo bloquea `rm -rf` en rutas peligrosas. El allowlist para `/tmp/` y `node_modules/.cache/` evita falsos positivos en operaciones de limpieza legítimas.

---

#### `no_delete_env` — CRITICAL

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `bash` |
| **Severidad** | CRITICAL |
| **Trigger** | Comandos `rm` o `del` que apuntan a archivos `.env` |
| **Regex** | `/\brm\b.*\.env|/\bdel\b.*\.env|/\brmdir\b.*\.env/i` |
| **Mensaje** | "BLOCKED: Archivos .env contienen credenciales (DATABASE_URL, JWT_SECRET, etc.). No eliminar." |

**Ejemplos bloqueados:**
```bash
rm apps/server/.env
rm .env.production
del .env.local
```

**Fuente en proyecto**: `.gitignore` excluye `.env` y `.env.*.local` (líneas 44-48). El archivo `apps/server/.env.example` contiene 15 variables sensibles: `SECRETKEY`, `REFRESHSECRETKEY`, `DATABASE_URL`, `AES_GCM_KEY`, `BCRYPT_SALT`, etc.

---

#### `no_write_env_files` — HIGH

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `write` |
| **Severidad** | HIGH |
| **Trigger** | Intento de escribir directamente en archivos `.env` (excepto `.env.example`) |
| **Path pattern** | Coincide con `/\.env(\.|$)/i` pero excluye `.env.example` (con case-insensitive path matching para cubrir `.ENV`, `.Env`, etc.) |
| **Mensaje** | "BLOCKED: No modificar .env directamente. Las variables se configuran via .env.example." |

**Ejemplos bloqueados:**
```typescript
write({ filePath: "apps/server/.env", content: "DATABASE_URL=..." })
write({ filePath: ".env.production", content: "SECRET=..." })
```

**Ejemplo que SÍ pasa:**
```typescript
write({ filePath: "apps/server/.env.example", content: "DATABASE_URL=postgres://..." })
```

---

#### `no_edit_gitignore_security` — MEDIUM

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `edit` |
| **Severidad** | MEDIUM |
| **Trigger** | Intento de eliminar `.env`, `*.log`, `credentials*` de `.gitignore` |
| **Lógica** | Detecta si `oldString` incluye patrón de seguridad y `newString` lo elimina |
| **Mensaje** | "BLOCKED: No eliminar '${pattern}' de .gitignore. Expone información sensible." |

**Ejemplo bloqueado:**
```typescript
edit({
  filePath: ".gitignore",
  oldString: ".env\n",
  newString: ""
})
```

**Fuente en proyecto**: `.gitignore` línea 68 excluye `.opencode/logs/` además de archivos env y logs. Eliminar estas exclusiones expone archivos de auditoría y credenciales.

---

#### `no_composio_git_ops` — CRITICAL

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `composio_COMPOSIO_*` (cualquier tool de Composio MCP) |
| **Severidad** | CRITICAL |
| **Trigger** | Cualquier argumento de tool Composio que contenga comandos git |
| **Regex** | `/\bgit\b.*\b(push|pull|commit|reset|rebase|merge|branch|clone|fetch|stash)/i` |
| **Mensaje** | "BLOCKED: Operaciones git vía Composio prohibidas. Git se maneja exclusivamente via git-manager con comandos git nativos." |

**¿Por qué existe?**: Los permisos de `opencode.jsonc` tienen `bash: deny` global y `composio_COMPOSIO_*: allow` solo para project-manager. Si Composio expone tools que ejecutan git internamente (a través de su propia CLI), podrían bypasear las reglas de `bash`. Esta regla cierra ese vector.

**Fuente en proyecto**: opencode.jsonc líneas 79-86. Composio MCP server registrado.

---

#### `no_dev_bash_nonstandard` — HIGH

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `bash` |
| **Severidad** | HIGH |
| **Trigger** | Bash que contiene patrones de ejecución no convencional |
| **Regex** | `/\bpython\b.*-c|/\bperl\b.*-e|/\bruby\b.*-e|/\bnpm\b.*\bexec\b|/\bnpx\b.*-y|/\bwget\b.*-O\s+-\s*|/\bcurl\b.*\bsh\b/i` |
| **Exclusiones** | `node_modules/.bin/`, `scripts/`, `npx jest`, `npx vitest`, `npm run`, `npx prisma`, `git`, `npx playwright`, `npx turbo`, `npx storybook`, `npx nx`, `npx tsx`, `npx eslint`, `npx prettier` |
| **Mensaje** | "BLOCKED: Ejecución no convencional detectada. Usa scripts npm estándar o comandos del proyecto." |

**Ejemplos bloqueados:**
```bash
python -c "import os; os.system('rm -rf .git')"
perl -e 'system("git push --force")'
curl sh malicious-script.com
npm exec untrusted-package
```

**Ejemplos que SÍ pasan:**
```bash
npm run dev
npx prisma migrate dev
node apps/server/index.js
git push origin main
npm run build
```

---

#### `no_planner_write_specs` — HIGH

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `write` |
| **Severidad** | HIGH |
| **Trigger** | Write a paths que contengan `openspec/` o `specs/` en el path |
| **Path pattern** | `/openspec/|/specs\//` en filePath (case-insensitive matching) |
| **Mensaje** | "BLOCKED: Los archivos de specs se crean via OpenSpec CLI (/opsx-new, /opsx-propose). No escribir manualmente." |

**Ejemplos bloqueados:**
```typescript
write({ filePath: "openspec/specs/my-feature/spec.md", content: "..." })
write({ filePath: "openspec/changes/my-change/tasks.md", content: "..." })
```

**Ejemplos que SÍ pasan:**
```typescript
write({ filePath: "docs/my-doc.md", content: "..." })
write({ filePath: "apps/server/src/file.ts", content: "..." })
```

**Fuente en proyecto**: Arquitectura OpenSpec requiere que todos los cambios pasen por el workflow de specs. El planner solo revisa; no crea specs.

---

#### `no_direct_trello` — CRITICAL

| Atributo | Valor |
|----------|-------|
| **Herramienta** | `bash` |
| **Severidad** | CRITICAL |
| **Trigger** | Llamados HTTP directos a APIs de Trello/Slack desde cualquier agente |
| **Regex** | `/api\.trello\.com|api\.slack\.com|trello\.com.*\/1\//i` en argumentos de curl/wget |
| **Mensaje** | "BLOCKED: Ningún agente llama Trello/Slack directamente. Debe delegar a @project-manager." |

**Ejemplos bloqueados:**
```bash
curl -X POST https://api.trello.com/1/cards?key=XXX\&token=YYY
wget -O - https://api.slack.com/methods/chat.postMessage
curl https://api.trello.com/1/boards/xxx/actions?token=zzz
```

**Ejemplos que SÍ pasan:**
```bash
curl https://api.github.com/repos/owner/repo
echo "Delegando a project-manager..."
```

**Nota:** @orchestrator ya tiene `bash: deny` global en Layer 5, pero esta regla es defense-in-depth para @developer (que tiene `bash: allow`). Si developer intenta llamar Trello directamente, esta regla lo bloquea.

---

### 3.2 Reglas Cubiertas por Permisos (Layer 5 — ya implementadas)

Estas reglas NO requieren guardrails porque `opencode.jsonc` ya las deniega a nivel de permisos. Se documentan aquí para completitud.

| Regla | Permiso que la cubre | Archivos fuente |
|-------|---------------------|-----------------|
| `@spec-manager` no puede usar `write` ni `edit` | `spec-manager`: `write: deny`, `edit: deny` | opencode.jsonc líneas 140-144 |
| `@planner` no puede usar `edit` | `planner`: `edit: deny` | opencode.jsonc línea 159 |
| `@project-manager` no puede usar `write` ni `edit` | `project-manager`: `edit: deny`, `write: deny` | opencode.jsonc líneas 215-218 |
| `@orchestrator` no puede ejecutar `bash` globalmente | `orchestrator`: global `bash: deny` | opencode.jsonc línea 73 |
| Composio denegado globalmente (excepto project-manager) | Global: `composio_COMPOSIO_*: deny` | opencode.jsonc líneas 79-86 |
| `webfetch`, `websearch` denegados globalmente | Global `webfetch: deny`, `websearch: deny` | opencode.jsonc |
| `question` denegado globalmente | Global `question: deny` | opencode.jsonc |

**Nota**: Estas reglas tienen "defense in depth" — los permisos Layer 5 son la primera barrera. Los guardrails Layer 4 son la segunda línea de defensa para los casos donde los permisos se relajan o se configuran nuevos plugins.

---

### 3.3 Reglas que Permanecen como Prompts (no implementables como guardrails)

Estas reglas NO pueden implementarse como guardrails porque requieren juicio contextual, no validación de argumentos.

| Regla | Agente | Por qué no es guardrail | Dónde se enforcing |
|-------|--------|------------------------|-------------------|
| "Preguntar una cosa a la vez" | Todos | Requiere inspeccionar el texto de la respuesta del LLM | Prompts de cada agente |
| "Delegar primero a @spec-manager antes de implementar" | orchestrator | Decisión de enrutamiento, no tool call | `orchestrator.md` |
| "Usar SDD 6-phase workflow" | Todos | Regla de proceso, no de ejecución | `AGENTS.md`, `CONTEXT.md` |
| "No emoji en output JSON" | Todos | Formato de texto generado | Prompts + output-contracts.ts |
| "Esquivar newlines sin escapar en JSON" | Todos | Formato de output | Prompts + output-contracts.ts |
| "Validar output-contract antes de retornar" | Todos | Ocurre después de generar | Layer 2 (output-contracts.ts) |
| "Conventional Commits obligatorios" | Todos | Es formato de commit, no un tool call | Prompts + husky (cuando se active) |
| "Solo @developer modifica código" | Todos | Responsabilidad compartida, no bloqueo técnico | Prompts + Layer 5 |

---

## 4. Arquitectura Técnica

### 4.1 Estructura de archivos

```
.opencode/plugins/
├── guardrails-rules.ts          # ~120 líneas — reglas puras
│   ├── Rule interface
│   ├── ValidationResult interface
│   ├── RuleContext interface
│   ├── validateRules() — función pura
│   ├── TOOL_RULES — registro de 12 reglas
│   └── helper regex/constants
└── neurosymbolic-guardrails.ts  # ~120 líneas — plugin
    ├── buildContext() — extrae contexto por tool
    ├── sanitizeArgs() — redacta campos sensibles para audit
    ├── writeAuditEntry() — JSONL writer
    └── Plugin export (tool.execute.before hook)
```

### 4.2 Interfaces

```typescript
// .opencode/plugins/guardrails-rules.ts

interface Rule {
  name: string;
  description: string;
  tool: string;  // e.g. "bash", "write", "edit", "composio_COMPOSIO_*"
  validate: (args: Record<string, unknown>) => ValidationResult;
}

interface ValidationResult {
  allowed: boolean;
  violations: string[];  // vacío si allowed === true
}

interface RuleContext {
  tool: string;       // nombre de la tool
  args: Record<string, unknown>;  // argumentos crudos
  sessionId: string;
  callId: string;
}
```

### 4.3 El hook `tool.execute.before`

```typescript
"tool.execute.before": async (input, output) => {
  const rules = TOOL_RULES[input.tool];
  if (!rules) return;  // tool sin reglas → pasa

  const context = buildContext(input.tool, output.args ?? {});
  const { allowed, violations } = validateRules(rules, context);

  if (allowed) return;  // pasó todas las reglas

  // ── BLOQUEADO ───────────────────────────────────────────────
  const blockMsg = `GUARDRAIL_BLOCKED: ${violations.join("; ")}`;

  // Audit log (con sanitización de args)
  writeAuditEntry({
    timestamp: new Date().toISOString(),
    eventType: "guardrail_blocked",
    tool: input.tool,
    sessionId: input.sessionID,
    callId: input.callID,
    violations,
    args: sanitizeArgs(output.args ?? {}),  // sin secretos
  });

  // Lanzar → cancela la ejecución de la tool
  throw new GuardrailBlockedError(blockMsg);
}
```

### 4.4 Flujo de evaluación

```
tool.execute.before (input, output)
       │
       ▼
¿Hay reglas para esta tool en TOOL_RULES?
       │ No → return (pasa, tool ejecuta normalmente)
       │
       ▼ Sí
buildContext(tool, output.args)
       │
       ▼
validateRules(rules, context)
       │ cada rule.validate(args) → true/false
       │ Collecting violations
       ▼
{allowed: bool, violations: string[]}
       │
    ┌──┴──┐
    │passed│failed
    ▼         ▼
  return   throw GuardrailBlockedError
         + writeAuditEntry
```

### 4.5 Manejo de errores (try/catch)

```typescript
"tool.execute.before": async (input, output) => {
  try {
    // ...validación...
    if (!allowed) throw new GuardrailBlockedError(msg);
  } catch (err) {
    if (err instanceof GuardrailBlockedError) throw err; // re-lanzar nuestros errores
    // Error inesperado → log y PERMITIR la ejecución (no bloquear por bug nuestro)
    console.error("[neurosymbolic-guardrails] Error en evaluador:", err);
  }
}
```

**Principio**: si el evaluador de reglas tiene un bug, **no bloqueamos** el trabajo del desarrollador. Solo bloqueamos cuando una regla se viola claramente.

---

## 5. Formato del Audit Log

### Archivo

`.opencode/logs/guardrails-audit.jsonl` (un entry por línea, JSONL puro)

### Schema de cada entrada

```json
{
  "timestamp": "2026-07-17T14:23:00.000Z",
  "eventType": "guardrail_blocked",
  "tool": "bash",
  "sessionId": "sess_abc123",
  "callId": "call_xyz789",
  "violations": [
    "git push --force destruye el historial compartido",
    "Usa git push sin --force o coordina con el equipo via PR"
  ],
  "args": {
    "command": "git push --force origin main"
    // Campos sensibles REMOVIDOS por sanitizeArgs()
  }
}
```

### Campos sensibles sanitizados

Antes de escribir al log, `sanitizeArgs()` elimina:

`password`, `apiKey`, `token`, `secret`, `authorization`, `cookie`, `x-api-key`, `x-auth-token`, `access_token`, `refresh_token`, `private_key`, `AWS_SECRET_ACCESS_KEY`, `GITHUB_TOKEN`, `NPM_TOKEN`, `DATABASE_URL`

### Verificación de que el directorio existe

El directorio `.opencode/logs/` se crea con `fs.mkdirSync({ recursive: true })` en la primera escritura. El path ya está excluido en `.gitignore` (línea 68).

---

## 6. Integración con la Arquitectura Existente

### Con `output-contracts.ts` (Layer 2)

| Aspecto | output-contracts.ts | neurosymbolic-guardrails.ts |
|---------|--------------------|-------------------------------|
| **Hook** | `tool.execute.after` | `tool.execute.before` |
| **Tool filtrada** | `task` (subagent completions) | Todas en TOOL_RULES |
| **Archivo audit** | `contract-audit.jsonl` | `guardrails-audit.jsonl` |
| **Acción en violación** | Observa + anota `metadata.contractValidation` | Lanza error y cancela |
| **LoC** | 361 | ~250 |
| **State** | Lazy-load validator | Stateless (sin estado) |

**Ambos plugins coexisten** sin conflictos. Se cargan independientemente en el array `plugin` de `opencode.jsonc`. El orden de carga (`output-contracts.ts` primero, `neurosymbolic-guardrails.ts` después) no importa porque usan hooks distintos.

### Con los permisos de `opencode.jsonc`

```
Permisos (opencode.jsonc)          Guardrails (neurosymbolic-guardrails.ts)
─────────────────────              ─────────────────────────────────────────
Layer 5: ¿Tiene permiso?    →  Layer 4: ¿Los argumentos son válidos?
       │                                │
       ▼                                ▼
   DENY → no llega a guardrail    PASS → ejecuta
   ALLOW → llega a guardrail      FAIL → throw Error → cancela
```

Los permisos y los guardrails son **capas complementarias**, no sustitutos. Los permisos dicen "quién puede ejecutar qué tool". Los guardrails dicen "cómo se ejecuta correctamente". Ambos juntos forman defense in depth.

### Con `mcp-proxy-semantic-activation` (contexto)

El change `mcp-proxy-semantic-activation` también registra `tool.execute.before` en la tool `task`. Si ambos plugins están cargados, se ejecutan en orden de registro. La interacción es **correcta**: si guardrails bloquea un task call, context-propagator nunca escribe el archivo de contexto — que es el comportamiento esperado.

---

## 7. Limitaciones y Brechas Documentadas

### 5 gaps conocidos

| # | Gap | Impacto | Workaround |
|---|-----|---------|-----------|
| 1 | **Steer pattern** — el mensaje "BLOCKED:" no llega al LLM. El agente no sabe por qué se bloqueó y no puede autocorregirse | Agente repite la llamada fallida | Agregar instrucción en el system prompt de cada agente: "Si una tool falla con 'BLOCKED:', reintenta con argumentos válidos" |
| 2 | **No hay `try/catch` global en `Plugin.trigger`** — un `throw` mal manejado puede afectar la sesión | Sesión puede crashear si hay error inesperado en el evaluador | El hook usa try/catch interno: re-lanza BLOCKED, pero para errores inesperados loggea y permite ejecución |
| 3 | **Sin HookRegistry dinámico** — las reglas no se pueden recargar en caliente | Cambios a reglas requieren reiniciar OpenCode | Lazy-load desde archivo rules — futuro: watch mode |
| 4 | **Agent identity no disponible** — para tools que no son `task`, no hay forma de saber qué agente llamó | Las 12 reglas usan pattern matching en argumentos (no en identidad) — suficiente para la mayoría de casos. `no_project_mgr_git` fue removida como fatal flaw — sin identidad de agente, bloquearía TODOS los agentes de git | Diseño actual: path/URL/regex patterns reemplazan agent-scope checks |
| 5 | **Primer mensaje de sesión** — `tool.execute.before` puede no dispararse en el primer mensaje | Brecha temporal al inicio de cada sesión | Los hooks de Layer 1 (prompts) y Layer 5 (permisos) cubren esta brecha |

---

## 8. Roadmap de Reglas

### Fase 1 (este change — MVP, 12 reglas)

Implementación inicial de guardrails neurosymbolics covering las operaciones más peligrosas del proyecto. Target: 1-2 días de implementación + tests.

### Fase 2 (post-MVP — diferidas)

| Regla | Descripción | Dependencias |
|-------|-------------|--------------|
| `no_prisma_migrate_dev_en_produccion` | Detectar si DATABASE_URL apunta a producción antes de ejecutar `prisma migrate dev` | Requiere lectura de `.env` para detectar `NODE_ENV=production` o URL de producción |
| `no_execute_security_scripts_en_produccion` | Bloquear `semgrep.ps1` y `dependency-scan.ps1` si se ejecutan en entorno de producción | Requiere detección de entorno |
| `no_mutate_gitignore` | Bloquear cualquier modificación a `.gitignore` que expoa archivos sensibles | Ya parcialmente cubierto por `no_edit_gitignore_security` (ampliar patrones) |
| Stateful rules | Persistencia de estado entre calls (p.ej., contador de `prisma migrate dev` para evitar ejecuciones sucesivas) | Requiere archivo JSON de estado |

---

## 9. Testing

### Unit tests (`guardrails-rules.test.ts`)

| Test | Input | Expected |
|------|-------|----------|
| `no_git_force_push` pasa | `{command: "git push origin main"}` | `allowed: true` |
| `no_git_force_push` falla | `{command: "git push --force origin main"}` | `allowed: false`, violations > 0 |
| `no_git_rewrite_history` — todas las variants | `git rebase main`, `git reset --hard`, `git commit --amend` | `allowed: false` |
| `no_prisma_db_push_force_reset` | `{command: "prisma db push --force-reset"}` | `allowed: false` |
| `no_destructive_rm` — paths seguros | `{command: "rm -rf /tmp/my-files"}` | `allowed: true` (path seguro) |
| `no_write_env_files` — .env.example | `{filePath: "apps/server/.env.example"}` | `allowed: true` (excluido) |
| `no_write_env_files` — .env real | `{filePath: "apps/server/.env"}` | `allowed: false` |
| `no_composio_git_ops` | Tool Composio con args `{...git push...}` | `allowed: false` |
| Múltiples reglas fallando | `{command: "git push --force"}` | `allowed: false`, violations.length >= 2 |

### Integration test (`neurosymbolic-guardrails.test.ts`)

| Test | Setup | Expected |
|------|-------|----------|
| Hook cancela con BLOCKED | Mock input `{tool:"bash", output:{args:{command:"git push --force"}}}` | `expect(hook).rejects.toThrow(/GUARDRAIL_BLOCKED/)` |
| Hook permite paso | Mock input `{tool:"bash", output:{args:{command:"git status"}}}` | `expect(hook).resolves.toBeUndefined()` |
| Audit log escribe | Mock input con tool bloqueada + mock `fs.appendFileSync` | `expect(fs.appendFileSync).toHaveBeenCalledWith(..., JSON entry)` |
| Error inesperado no crashea | Mock que lanza TypeError en `buildContext` | Hook no lanza, tool ejecuta |

---

## 10. Glossary

| Término | Definición |
|---------|------------|
| **Guardrail** | Regla que previene operaciones inválidas o peligrosas antes de que se ejecuten |
| **Neurosymbolic** | Combinación de razonamiento (el modelo) con reglas simbólicas (código determinista) que el modelo no puede eludir |
| **Layer 4** | La capa de prevención pre-ejecución en la arquitectura de 6 capas |
| **Steer pattern** | Capacidad del agente de autocorregirse al ver un error de guardrail (NO soportado nativamente en OpenCode) |
| **Defense in depth** | Múltiples capas de protección independientes para el mismo riesgo |
| **SanitizeArgs** | Función que elimina campos sensibles (passwords, tokens, API keys) antes de escribir al log de auditoría |
| **JSONL** | JSON Lines — un objeto JSON por línea, sin comas ni corchetes exteriores |

---

## 11. Sources

- **Artículo base**: [dev.to/aws — AI Agent Guardrails: Rules That LLMs Cannot Bypass](https://dev.to/aws/ai-agent-guardrails-rules-that-llms-cannot-bypass-596d)
- **Repo del artículo**: [github.com/aws-samples/sample-why-agents-fail](https://github.com/aws-samples/sample-why-agents-fail/tree/main/stop-ai-agent-hallucinations/04-neurosymbolic-demo)
- **OpenSpec change**: `openspec/changes/add-neurosymbolic-guardrails/`
- **Hooks docs**: `docs/opencode/hooks.md`
- **Output contracts**: `docs/opencode/output-contracts.md`
- **Proyecto permisos**: `opencode.jsonc` (líneas 68-87: permission block)
- **Prompts de agentes**: `docs/opencode/prompts/*.md` (9 archivos)
- **Schema Prisma**: `apps/server/prisma/schema.prisma` (30+ modelos, datos críticos)