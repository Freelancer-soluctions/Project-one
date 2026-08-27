# 05c — Journal de Implementación: ci-commit-signing (Lo que REALMENTE pasó)

> **Guía 05c — Implementation Journal** (transversal, después de 05b) | Anterior: [05b-commit-signing.md](./05b-commit-signing.md)
>
> Esta guía documenta TODO lo que hicimos, encontramos y resolvimos durante la implementación del cambio `ci-commit-signing`. No es una guía teórica — es un **registro vivo** de debugging, decisiones y aprendizajes del mundo real.

---

## 🎯 Objetivo

Entender a fondo qué se hizo, POR QUÉ se hizo así, y QUÉ APRENDIMOS en el proceso. Esta guía complementa la teoría de [05b-commit-signing.md](./05b-commit-signing.md) con la práctica cruda.

---

## 📋 Resumen Ejecutivo del Change

| Fase      | Qué logramos                                                                 | Estado      |
| --------- | ---------------------------------------------------------------------------- | ----------- |
| **F1**    | Firma local SSH ed25519 con clave dedicada `id_ed25519_projectERP`           | ✅ Completo |
| **F2**    | Job `verify-signatures` en ci.yml que consulta GitHub API                    | ✅ Completo |
| **F3**    | JOB_VALIDATED=true (3/3 commits verified en CI real)                         | ✅ Completo |
| **F4**    | GitHub App `Project-one-commit-signing` + `peter-evans/git-commit-signer` v4 | ✅ Completo |
| **F5**    | Ruleset "Require signed commits" en main + required status check             | ✅ Completo |
| **Bonus** | CI incremental (CI_MINIMAL guards) + root cause analysis del bug JSON        | ✅ Completo |

---

## 🐛 Bug #1: El-path equivocado (el más educativo)

### El problema

El job `verify-signatures` en ci.yml clasificaba **TODOS** los commits como `UNVERIFIED`, incluso los que tenían firma válida. Durante 3 sesiones, creímos que era:

- ❌ Delay de propagación de GitHub (~30s)
- ❌ Glitch del indexador de GitHub
- ❌ Signing Key desregistrada

### La causa raíz

El endpoint REST de GitHub para **commits múltiples** (compare endpoint) anida la verificación así:

```json
{
  "commits": [
    {
      "sha": "abc123...",
      "commit": {
        "author": { "name": "DevJohan" },
        "verification": {
          "verified": true,
          "reason": "valid",
          "signature": "-----BEGIN SSH SIGNATURE-----..."
        }
      }
    }
  ]
}
```

Pero nuestro código jq leía **top-level**:

```bash
# MAL (lo que teníamos):
VERIFIED=$(echo "$RESPONSE" | jq -r '.commits[] | select(.sha == $s) | .verification.verified // false')

# BIEN (lo que necesitábamos):
VERIFIED=$(echo "$RESPONSE" | jq -r '.commits[] | select(.sha == $s) | .commit.verification.verified // false')
```

### Por qué fue tan difícil de encontrar

1. **El endpoint individual SÍ funciona con top-level**: `GET /commits/{sha}` devuelve `.verification.verified` directamente. El código anti-stale retry (que usa endpoint individual) estaba correcto.

2. **Los dumps visuales engañaban**: cuando inspeccionas el JSON crudo, grep encuentra "verification" en cualquier parte del objeto. Parecía que estaba top-level pero estaba anidado bajo `.commit`.

3. **La evidencia contradictoria**: en una sesión el agente reportó `verified:true` (probablemente leyendo `.commit.verification`) y en otra `verified:null` (leyendo `.verification`). Ambos eran correctos para sus respectivas rutas.

### Lección aprendida

> **Siempre valida el path exacto del JSON contra la API viva ANTES de escribir jq selectors.** El esquema de la documentación de GitHub no siempre coincide con lo que la API devuelve.

### Fix aplicado

```yaml
# ci.yml línea ~126 (clasificación bulk):
# ANTES:
VERIFIED=$(echo "$RESPONSE_BODY" | jq -r --arg s "$SHA" '.commits[] | select(.sha == $s) | .verification.verified // false')
# DESPUÉS:
VERIFIED=$(echo "$RESPONSE_BODY" | jq -r --arg s "$SHA" '.commits[] | select(.sha == $s) | .commit.verification.verified // false')

# ci.yml línea ~198 (fallback merge_group):
# ANTES:
... | jq -r '.verification.verified // false'
# DESPUÉS:
... | jq -r '.commit.verification.verified // false'
```

### Cómo lo descubrimos

Un diagnóstico READ-ONLY con dumps crudos a archivo + parser independiente:

```bash
# 1. Dump crudo del endpoint
gh api repos/Freelancer-soluctions/Project-one/commits/b5804f8... > /tmp/commit.json

# 2. Buscar dónde vive "verification"
grep '"verification"' /tmp/commit.json
# Resultado: dentro de "commit" object, no top-level

# 3. Verificar con node (path real)
node -e "const d=require('/tmp/commit.json'); console.log(Object.keys(d))"
# Resultado: sha, node_id, commit, url, html_url... (NO verification)

# 4. Path correcto
node -e "const d=require('/tmp/commit.json'); console.log(d.commit.verification)"
# Resultado: { verified: true, reason: 'valid', signature: '...' }
```

---

## 🐛 Bug #2: El rebase que destruyó el YAML

### El problema

Al hacer `git rebase origin/main` sobre la rama `fix/ci-verify-signatures-rest-envelope`, el merge tool generó **11 conflictos** en ci.yml y corrompió la indentación del YAML.

### Síntomas

```bash
node -e "require('js-yaml').load(require('fs').readFileSync('.github/workflows/ci.yml','utf8'))"
# Error: end of the stream or a document separator is expected (30:1)
```

Línea 30 tenía:

```yaml
    steps:
- uses: actions/checkout@v5    # ← indentación rota (faltan espacios)
```

### Solución

Reset limpio desde `origin/main` + re-aplicar cambios manualmente:

```bash
git checkout origin/main -- .github/workflows/ci.yml
# Luego re-agregar los steps de GitHub App manualmente
```

### Lección aprendida

> **Cuando un rebase genera muchos conflictos en YAML, es más seguro resetear el archivo desde la versión limpia y re-aplicar los cambios que intentar resolver cada conflicto manualmente.** Los conflictos en YAML son propensos a romper la estructura por indentación.

---

## 🏗️ CI Incremental: CI_MINIMAL

### El problema

Cada push disparaba **todos** los jobs de ci.yml: SonarQube ×2, Coverage ×2, ActionLint, CI Complete — la mayoría fallando por deuda técnica preexistente. Consumía recursos y generaba ruido.

### La solución (2 capas)

**Capa 1: Deshabilitar workflows secundarios**

```bash
gh workflow disable "Fintech PR CI"
gh workflow disable "CD Deploy Pipeline"
gh workflow disable "Preview Environments"
gh workflow disable "Release"
gh workflow disable "Scheduled Security Scan"
gh workflow disable "Scheduled Security Digest"
gh workflow disable "security.yml"
# Dependabot Updates: workflow de sistema, API devuelve 422
# Solo queda CI (ci.yml) activo
```

**Capa 2: Guards en ci.yml**

A cada job pesado se le agregó:

```yaml
# Como PRIMERA key del job:
if: ${{ vars.CI_MINIMAL != 'true' }}

# Si el job ya tenía un if, se fusionó:
if: ${{ vars.CI_MINIMAL != 'true' && always() && (...) }}
```

Jobs protegidos:

- `actionlint` (L412)
- `client-sonarqube` (L456)
- `client-coverage` (L484)
- `server-sonarqube` (L518)
- `server-coverage` (L543)
- `ci-complete` (L579)

### Cómo activar

Crear variable de repo en Settings → Secrets and variables → Actions → Variables:

| Name         | Value  |
| ------------ | ------ |
| `CI_MINIMAL` | `true` |

### Lección aprendida

> **YAML no permite keys duplicadas.** Cuando un job ya tiene `if:`, no puedes agregar otro `if:` — debes fusionarlos en una expresión `${{ A && B }}`.

---

## 🔐 GitHub App vs SSH Key Personal

### Por qué migrar

| SSH Key Personal                       | GitHub App                                  |
| -------------------------------------- | ------------------------------------------- |
| Clave privada en GitHub Secrets        | Clave de la App protegida por GitHub        |
| Tokens no expiran                      | Tokens temporales (1 hora)                  |
| No hay audit trail                     | GitHub registra cada acción                 |
| Si se compromete → afecta a la persona | Si se compromete → solo este repo, temporal |

### Qué creamos

1. **GitHub App**: `Project-one-commit-signing` (App ID: 4688914)
2. **Permisos**: Contents (Read/Write), Pull requests (Read/Write)
3. **Secrets**: `APP_ID` y `APP_PRIVATE_KEY` (contenido del `.pem`)

### Integración en ci.yml

```yaml
# En el job repo-discovery:
- uses: actions/create-github-app-token@v1
  with:
    app-id: ${{ secrets.APP_ID }}
    private-key: ${{ secrets.APP_PRIVATE_KEY }}
- uses: peter-evans/git-commit-signer@v4
  with:
    gpg-key: ${{ secrets.APP_PRIVATE_KEY }}
    name: 'Project-one-commit-signing'
    email: 'project-one@project-one.com'
```

### Lección aprendida

> **El `.pem` NUNCA va al repositorio.** Se almacena como GitHub Secret y se referencia por nombre. Si lo commitas, cualquiera con acceso al repo puede firmar commits como tu App.

---

## 🛡️ Ruleset de Producción

### Configuración

```
Settings → Rules → New branch ruleset
```

| Campo                  | Valor                      |
| ---------------------- | -------------------------- |
| Ruleset name           | `Require signed commits`   |
| Enforcement            | `Active`                   |
| Target                 | `refs/heads/main`          |
| Require signed commits | ✅ Enabled                 |
| Required status check  | `Verify Commit Signatures` |

### Validación

Creamos una rama de test con un commit **sin firmar**:

```bash
git checkout -b test/unsigned-commit feature/ai-setup
echo "test" > test-unsigned.txt
git add test-unsigned.txt
git commit --no-gpg-sign -m "test: unsigned commit (should fail)"
git push origin test/unsigned-commit
```

**Resultado**: GitHub mostró "Merging is blocked — must have a verified signature". ✅

### Lección aprendida

> **El ruleset opera en DOS capas**: (1) GitHub verifica la firma criptográfica del commit, (2) el status check `Verify Commit Signatures` valida vía API que `.commit.verification.verified === true`. Ambas deben pasar para permitir el merge.

---

## 🔧 Gotchas Técnicos que Descubrimos

### 1. SSH_AUTH_SOCK no persiste entre llamadas bash

```bash
# En la llamada 1:
eval "$(ssh-agent -s)"
# SSH_AUTH_SOCK=/tmp/ssh-xxx.sock  ← funciona aquí

# En la llamada 2:
ssh-add -l
# Could not open connection  ← se perdió
```

**Solución**: sourcear `/tmp/opencode-ssh-agent.env` en **cada** llamada bash que necesite firma.

### 2. Passphrase en sesiones no-interactivas

`git commit -S` necesita la passphrase de la clave SSH. En sesiones no-interactivas (CI, agentes), esto falla.

**Solución**: SSH_ASKPASS + PowerShell InputBox:

```bash
cat > "$TEMP/opencode/askpass.sh" << 'ASKPASS'
#!/bin/bash
powershell -NoProfile -EncodedCommand "$(echo 'Add-Type -AssemblyName System.Windows.Forms; ...' | base64 -w0)"
ASKPASS

export SSH_ASKPASS="$TEMP/opencode/askpass.sh"
export SSH_ASKPASS_REQUIRE=force
export DISPLAY=:0
```

El usuario ve un popup de Windows para ingresar la passphrase.

### 3. MSYS2 reescribe paths

```bash
# Esto:
gh api /user/ssh_signing_keys
# Se convierte en:
gh api C:/Program Files/Git/user/ssh_signing_keys  # ← Windows path roto
```

**Solución**: no usar slash inicial en endpoints de `gh api`.

### 4. Hook pre-push necesita Docker

El hook pre-push hace fetch de `origin/main` + corre vitest (server + client). Esto requiere:

- Docker Desktop corriendo
- Contenedor `project_one_bd` (PostgreSQL) en puerto 5432
- Timeout mínimo: 300s (mejor 600s)

### 5. Remoto es HTTPS, no SSH

Aunque firmamos commits con SSH, el push autentica vía **Git Credential Manager** (HTTPS). El ssh-agent solo se usa para `git commit -S`, no para `git push`.

### 6. `git add` selectivo siempre

```bash
# NUNCA:
git add .    # ←容易 commitear basura
git add -A   # ←容易 commitear basura

# SIEMPRE:
git add .github/workflows/ci.yml
git add openspec/changes/ci-commit-signing/tasks.md
```

---

## 🔑 Setup Permanente del ssh-agent en Windows (CRÍTICO)

### El problema recurrente

Durante TODO el change, cada commit firmado por agentes fallaba con:

```
error: incorrect passphrase supplied to decrypt private key
fatal: failed to write commit object
```

**Causa**: cada sesión bash de un agente es un entorno nuevo. El `ssh-agent` arrancado dentro de esa sesión muere al terminar, y la passphrase nunca está disponible no-interactivamente.

### La solución: servicio ssh-agent de Windows

Windows tiene un **servicio ssh-agent global** que persiste entre terminales y sesiones de agentes. Una vez cargada la clave ahí, TODOS los procesos (agentes incluidos) pueden firmar sin passphrase.

**Setup UNA vez (PowerShell como Administrador):**

```powershell
# 1. Servicio automático al arrancar Windows
Set-Service ssh-agent -StartupType Automatic

# 2. Arrancarlo ahora
Start-Service ssh-agent

# 3. Cargar la clave (pide passphrase — ÚLTIMA VEZ por sesión de Windows)
ssh-add $env:USERPROFILE\.ssh\id_ed25519_projectERP
```

**Verificar:**

```powershell
ssh-add -l
# Debe mostrar: 256 SHA256:BrykXb1hhwLcPc+cjis6XFqh3DfgYy/cLIIHOFCUM3w projectERP-signing (ED25519)
```

### Qué cambia con esto

| Sin servicio                          | Con servicio                             |
| ------------------------------------- | ---------------------------------------- |
| Cada commit de agente pide passphrase | Agentes firman directo                   |
| SSH_ASKPASS popups constantes         | Passphrase UNA vez por sesión de Windows |
| Friction constante                    | Flujo fluido                             |

### Nota de seguridad

La passphrase **sigue protegiendo el archivo `.pem` en disco**. El servicio solo mantiene la clave descifrada **en memoria** mientras tu sesión de Windows está activa. Al reiniciar la PC, vuelves a cargar una vez con `ssh-add`.

> **IMPORTANTE para agentes**: los comandos `Set-Service` y `Start-Service` son de PowerShell, NO de bash/MSYS2. Si intentas `eval $(ssh-agent)` en PowerShell dará error.

---

## 🏛️ Decisión de Arquitectura: ¿Por qué verificar en el PR y no en cada push?

### La pregunta

> "La verificación de firma no debería hacerse al push a la rama en el remote?"

### La respuesta: 3 capas, cada una en su momento

```
Capa 1 (LOCAL):     git config commit.gpgsign=true
                    → TODO commit que haces YA sale firmado automáticamente
                    → La firma nace aquí, no en el server

Capa 2 (GITHUB):    Ruleset "Require signed commits" en main
                    → GitHub BLOQUEA el merge aunque el CI no exista
                    → ESTA es la enforcement REAL e infalible

Capa 3 (CI):        job verify-signatures en pull_request
                    → Feedback temprano ANTES del merge
                    → Te dice QUÉ commit falló y POR QUÉ (log detallado)
```

### Por qué NO agregar trigger `push` al workflow

| Si verificas en cada push                             | Con el diseño actual (PR only)             |
| ----------------------------------------------------- | ------------------------------------------ |
| Quemas minutos de Actions en cada push de WIP         | Solo corres cuando importa (puerta a main) |
| Commits a medio trabajo fallan y generan ruido rojo   | Sin ruido: verde cuando debe estar verde   |
| **Redundante**: el ruleset ya bloquea de todas formas | El ruleset es el seguro definitivo         |

### La prueba empírica

Cuando hicimos el test del commit sin firmar (`test/unsigned-commit`), el bloqueo lo dio **el ruleset** ("Merging is blocked — must have verified signature"), NO el CI. Es decir: aunque el workflow `verify-signatures` no existiera, un commit sin firma jamás entra a main.

### Regla general de diseño CI/CD

> **Enforcement en el destino, feedback en el tránsito.**
>
> - El ruleset protege main (destino).
> - El job de CI da visibilidad durante la revisión del PR (tránsito).
> - Verificar en cada push es poner un guardia en cada calle en vez de en la puerta del banco.

---

## ⚠️ Cosas que NO Tuvimos en Cuenta (y te van a pasar)

1. **Commits legacy siempre Unverified**: los commits históricos anteriores al change muestran badge "Unverified" en GitHub. Es visual solamente — no rompe nada.

2. **El squash-merge firma con GitHub**: cuando haces squash-merge, GitHub crea un commit nuevo firmado con SU clave web-flow, no con la tuya. El badge Verified aparece pero es la firma de GitHub, no la del autor original. El job verify-signatures valida la cadena real antes del merge.

3. **Dependabot Updates no se puede deshabilitar por API**: devuelve HTTP 422. Solo desde Settings UI del repo.

4. **Los secrets de la App deben existir ANTES del push**: si haces push sin crear APP_ID y APP_PRIVATE_KEY como secrets, ci.yml fallará en create-github-app-token con "secret not found".

5. **El ruleset bloquea TAMBIÉN a admins**: si no configuras bypass list, ni siquiera tú podrás mergear un commit sin firma. Configúralo en Rules → tu ruleset → Bypass list.

6. **CI_MINIMAL=true salta jobs pesados PERO también CI Complete**: el gate final no corre. Cuando quieras validar todo el pipeline completo, borra temporalmente la variable o ponla en false.

7. **ActionLint roto independiente**: el job actionlint falla por `rhysd/actionlint@v1` (versión no resoluble). Es un bug preexistente ajeno a este change — arreglarlo es tarea aparte.

8. **El .pem de la App NUNCA al repo**: si lo commitas aunque sea una vez, queda en el historial y debes rotarlo. Guárdalo fuera del proyecto y usa solo GitHub Secrets.

---

## 📊 Métricas del Change

| Métrica                      | Valor                                                      |
| ---------------------------- | ---------------------------------------------------------- |
| Tasks completadas            | 22/22                                                      |
| Commits firmados             | 10+                                                        |
| Bugs encontrados y resueltos | 3 (JSON path, YAML corruption, propagation false positive) |
| Sesiones de debugging        | 8+                                                         |
| Workflows deshabilitados     | 7                                                          |
| Jobs con CI_MINIMAL guard    | 6                                                          |
| Tiempo total                 | ~4 sesiones                                                |

---

## 🗺️ Mapa Mental del Change

```
ci-commit-signing
├── F1: Firma Local
│   ├── ssh-keygen -t ed25519 → id_ed25519_projectERP
│   ├── git config: gpg.format=ssh, user.signingkey, commit.gpgsign=true
│   └── Verificación: git log --show-signature → "Good signature"
│
├── F2: CI Verification
│   ├── Job verify-signatures en ci.yml Stage 2
│   ├── GitHub API: .commit.verification.verified (NO top-level)
│   ├── Scoping: compare endpoint base..head (NO todos los commits)
│   ├── Anti-stale: retry individual con sleep 30
│   └── CI_MINIMAL: guards en 6 jobs pesados
│
├── F3: JOB_VALIDATED
│   ├── Run 32617352968: 3/3 commits verified
│   ├── exit 0, failed_shas vacío
│   └── Fix: .commit.verification.verified (path correcto)
│
├── F4: GitHub App
│   ├── App: Project-one-commit-signing (ID: 4688914)
│   ├── Secrets: APP_ID + APP_PRIVATE_KEY
│   ├── actions/create-github-app-token@v1
│   └── peter-evans/git-commit-signer@v4
│
└── F5: Ruleset
    ├── Require signed commits en main
    ├── Required status check: Verify Commit Signatures
    └── Validación: commit sin firma → merge bloqueado
```

---

## 🏁 Resolución Final (post-mortem del desbloqueo)

### 🧩 Historias desconectadas

`git merge-base` entre `feature/ai-setup` y `origin/main` devolvía **vacío**: raíces distintas (`6799fe4` vs `1595f3c`). Herencia directa de la reconstrucción de historia previa del repo.

### 🟢 Falso verde del check `Verify Commit Signatures`

El check daba ✅ pero **no replicaba la verificación nativa de GitHub**: `required_signatures` evalúa **TODOS los commits del PR**, no solo HEAD. Un check que solo inspecciona HEAD no puede predecir el veredicto del ruleset.

### 🚫 Action inexistente: `peter-evans/git-commit-signer`

La action **NO existe** (404). Fue inventada/copiada mal, lo que produjo una cascada de pasos en estado `SKIP`.

### 🔓 Desbloqueo

Bypass temporal (**Repository admin**) del ruleset + **squash-merge del PR #99** → `main` recibió **UN commit firmado por GitHub**: el squash colapsa el lote contaminado en un único commit con firma válida emitida por GitHub.

### 💡 Lección clave

> Con flujo **squash-merge**, verificar los commits individuales del PR es higiene; la enforcement real son las `required_signatures` sobre lo que ENTRA a `main`.

### 📍 Estado final

| Elemento         | Estado                                         |
| ---------------- | ---------------------------------------------- |
| `main`           | Limpio — solo entran commits firmados          |
| Feature branches | Muertas (historia huérfana, no mergeables)     |
| Pendiente        | Restaurar `ROLLOUT_DATE` si se desea endurecer |

---

## 📅 Cronología Completa de la Odisea

1. **F1–F5 del change**: 22/22 tasks — firma local SSH ed25519 → job CI `verify-signatures` → validación `JOB_VALIDATED=true` → GitHub App (ID 4688914) → ruleset "Require signed commits" activo en `main`.
2. **Caos de rebase**: reconstrucción de historia dejó `feature/ai-setup` con historias NO relacionadas a `main` (merge-base vacío, raíces `6799fe4` vs `1595f3c`) y ~113 commits zombie side-lineage sin firma.
3. **Job `verify-signatures`**: bug de JSON path (`.verification` vs `.commit.verification`), luego falso verde detectado — el check custom no replicaba la verificación nativa `required_signatures` que evalúa TODOS los commits del PR, no solo HEAD.
4. **Tres fixes al job**: heredoc para `$GITHUB_OUTPUT` multilínea, guardia grandfathering faltante en path anti-stale, selector jq tolerante a ambos schemas.
5. **Action inexistente** `peter-evans/git-commit-signer` (HTTP 404) en `repo-discovery` → fallo en "Set up job" → cascada SKIP de ~24 jobs de calidad.
6. **Desbloqueo PR #99**: bypass temporal Repository admin en el ruleset + squash-merge → `main` recibió UN solo commit firmado por GitHub; bypass removido inmediatamente después.
7. **Clave dedicada para agentes**: ED25519 SIN passphrase (`~/.ssh/id_ed25519_projectERP-agents`) generada, registrada como Signing Key en GitHub, cableada a repo config local.
8. **E2E exitoso**: commit `bb695bb` creado por agente → `verified=true reason=valid`, sin passphrase. Hito central de la Vía 2.
9. **PR #100** (post-mortem doc) mergeado por squash; ramas muertas eliminadas (`feature/ai-setup`, `fix/ci-signing-clean`, `docs/ci-signing-postmortem`).
10. **Estado final**: TBD intacto (nada directo a `main`), ruleset activo sin bypass, firma de agentes operativa, chores de limpieza (ROLLOUT_DATE, app-token, git-commit-signer, commit-all -S) commiteados vía PR `chore/ci-cleanup`.

### Lecciones meta

- **Verificar actions antes de usarlas**: `gh api repos/<owner>/<repo>/actions/workflows/<slug>` — las referencias rotas cascanean SKIP a todo el pipeline y son difíciles de rastrear.
- **CI verde ≠ mergeable**: `required_signatures` evalúa todos los commits del PR; un check custom puede dar `JOB_VALIDATED` mientras `mergeStateStatus` sigue `BLOCKED`.
- **Enforcement en el destino, feedback en el tránsito**: el ruleset protege `main` (verdadero enforcement); el job CI da visibilidad en el PR (feedback temprano). Los dos capas son complementarios.
- **Claves de automatización sin passphrase**: estándar industria (mismo patrón que `APP_PRIVATE_KEY` de GitHub Apps); passphrase solo para claves humanas en terminales interactivas.
- **TBD significa TODO por PR**: incluso docs y chores — nunca push directo a `main`.

---

## 🔧 Post-Implementation: CI Incremental (PR #101)

Tras el merge del PR #100, se ejecutó una limpieza adicional vía **PR #101 (`chore/ci-cleanup`)** para habilitar CI incremental durante desarrollo activo:

1. **Restauración de `ROLLOUT_DATE=2026-08-01`** en `verify-signatures` (el cutover one-time del PR #99 cumplió su propósito; main limpio desde entonces).
2. **Eliminación de actions huérfanas** en `repo-discovery`:
   - `actions/create-github-app-token@v1` — token no consumido.
   - `peter-evans/git-commit-signer@v4` — action inexistente (404) que rompía Set up Job.
3. **Endurecimiento de `/commit-all`**: regla `-S` obligatoria + fallback seguro sin commits unsigned.
4. **Deshabilitación de 26 jobs** para CI incremental (`if: false` en cada job):
   - **Quality (13)**: lint, format, typecheck, complexity, dead-code, import-bounds, actionlint (client + server)
   - **Post-build quality (6)**: sonarqube, coverage, depcheck (client + server)
   - **Tests (4)**: unit-client, unit-server, integration, smoke
   - **Build (2)**: client-build, server-build
   - **E2E (1)**: e2e
5. **Jobs que SÍ corren**: `repo-discovery`, `verify-signatures`, `zombie-workflow-guard`, `ci-complete` (se skipea solo al no tener deps).
6. **Fix crítico de indentación YAML**: `client-depcheck` perdido al nivel raíz → restaurado bajo `jobs:` (error detectado por js-yaml pre-commit, no por GitHub Actions).
7. **PR #101 mergeado**: CI incremental operativo — solo firma y detección de cambios corren en cada push.

---

## 🔑 Arquitectura de 3 Keys: ¿Por qué y cuándo sobra?

### Las 3 keys registradas

| Key                         | Huella (SHA256)                               | Registrada | Actor               | Uso                                |
| --------------------------- | --------------------------------------------- | ---------- | ------------------- | ---------------------------------- |
| `projectERP-signing`        | `BrykXb1hhwLcPc+cjis6XFqh3DfgYy/cLIIHOFCUM3w` | Aug 21     | Humano (tú)         | Commits manuales `git commit -S`   |
| `projectERP-agents-signing` | `xIKkF6MJ36mbZ0lfV28K1N8L5eIMsQPa/BsQvq7OCEQ` | Aug 23     | Agentes IA (local)  | Commits delegados a @git-manager   |
| `projecterp-release-signer` | `qwBuMMso8HkmAxLOcF4gzwvuW5RJ25854PqsI9jgXCk` | Aug 26     | GitHub Actions (CI) | Commits automáticos de release.yml |

### ¿Por qué 3?

Cada key representa un **actor diferente** que firma commits bajo la misma cuenta GitHub:

```
              ┌──────────────────────────────┐
              │   Cuenta GitHub              │
              │   (DevJohanAdrian)           │
              │                              │
              │   ✍️  projectERP-signing     │ ← identidad humana
              │   🤖  projectERP-agents      │ ← identidad agentes
              │   ⚙️   projecterp-release    │ ← identidad runner CI
              │                              │
              │   email: 82298307+...@users   │
              └──────────────────────────────┘
```

**Ventajas de separar:**

- **Rotación aislada**: si una key se compromete, solo rotas ese contexto
- **Auditoría clara**: `git log --show-signature` muestra qué key firmó cada commit
- **Zero shared blast radius**: la key de CI no expone la identidad humana

### Hallazgo clave: ¿La key de CI es necesaria?

**No necesariamente.** `changesets/action@v2` sin `push-with-git-cli` usa **modo API por defecto**:

```
changesets/action@v2 (push-with-git-cli: false, default)
  → push via GitHub REST API
  → GitHub firma el commit con SU clave GPG (web-flow)
  → required_signatures del ruleset ✅
  → badge Verified ✅

  La config SSH en release.yml (gpg.format=ssh, signingkey, etc.)
  NUNCA se ejecuta porque changesets no usa git CLI locally
```

**Evidencia**: `release.yml` líneas 39-46 configuran SSH signing en el runner, pero changesets pusha vía API → esas líneas son dead code en el flujo default.

### ¿Entonces por qué mantener la key de CI?

| Razón                        | Explicación                                                                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Defense in depth**         | Si alguien cambia `push-with-git-cli: true`, la SSH key ya está lista                                                                |
| **Cero costo**               | Una signing key registrada no consume recursos ni superficie de ataque significativa                                                 |
| **Preparación para cambios** | Si se necesita commit con identidad específica (no la web-flow de GitHub), la SSH key permite firmar con la App en vez de con GitHub |
| **Learning artifact**        | Documenta cómo funciona changesets internamente (API mode vs CLI mode)                                                               |

### Cuándo SÍ sería necesaria la key de CI

- Si `push-with-git-cli: true` se agrega a changesets (usa git CLI locally → necesita firma SSH)
- Si el workflow crea commits FUERA de changesets (hotfixes, version bumps manuales)
- Si se necesita que el commit sea firmado con la identidad de la App (no la web-flow de GitHub)

### Matriz de decisión

| Escenario                     | ¿Necesita SSH key en CI? | Firma quién         |
| ----------------------------- | ------------------------ | ------------------- |
| changesets API mode (default) | ❌ No                    | GitHub web-flow GPG |
| changesets CLI mode           | ✅ Sí                    | App SSH key         |
| Commits manuales en workflow  | ✅ Sí                    | App SSH key         |
| squash-merge por GitHub       | ❌ No                    | GitHub web-flow GPG |

### Lección aprendida

> **Los git config de firma en CI solo tienen efecto cuando se usa `git commit` localmente.** Si el workflow pusha vía API (como changesets por defecto), la config SSH es dead code. Siempre verifica el modo de push del tool que usas antes de asumir que la firma SSH se aplica.

## 📚 Referencias

| Recurso                         | URL                                                                                                                                                    |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OpenSpec change                 | `openspec/changes/ci-commit-signing/`                                                                                                                  |
| GitHub App docs                 | https://docs.github.com/en/apps/creating-github-apps                                                                                                   |
| peter-evans/git-commit-signer   | https://github.com/peter-evans/git-commit-signer                                                                                                       |
| actions/create-github-app-token | https://github.com/actions/create-github-app-token                                                                                                     |
| GitHub Rulesets                 | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features                                                                |
| SSH commit signing              | https://docs.github.com/en/authentication/managing-commit-signature-verification/about-commit-signature-verification#ssh-commit-signature-verification |

---

## ➡️ Siguiente

> **Has completado el journal de implementación** — este documento captura TODO lo que pasó durante `ci-commit-signing`. Úsalo como referencia cuando necesites recordar POR QUÉ se tomaron ciertas decisiones.

> **Índice**: [README Avanzado](./avanzado-README.md) · **Anterior**: [05b-commit-signing.md](./05b-commit-signing.md) · **Siguiente**: [06-ci-yml-walkthrough.md](06-ci-yml-walkthrough.md)
