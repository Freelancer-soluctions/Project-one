# Instalación de Omniroute (tutorial paso a paso)

> Meta: AI gateway local para auto-fallback de modelos en opencode cuando una cuota se agota. Vía: npm global (sin Docker). Uso intermitente.

## 0. Requisitos

- Node.js (LTS) + npm
- opencode instalado y funcionando
- ~200 MB de disco libres

## 1. Instalar omniroute (npm global)

```powershell
npm install -g omniroute@3.8.49 --include=optional
```

- Explica: `--include=optional` preserva dependencias nativas (better-sqlite3/keytar/tls-client); postinstall solo hace warmup SQLite y NO toca opencode; pin 3.8.49 por estabilidad (el proyecto publica muy rápido; v3.8.47 tuvo crash de boot).
- Verificar: `omniroute --version` → 3.8.49
- Si el postinstall falla: `$env:OMNIROUTE_SKIP_POSTINSTALL = "1"; npm install -g omniroute@3.8.49`

## 2. Arrancar omniroute (a demanda)

```powershell
omniroute
```

- Servidor en `http://localhost:20128`. Para detener: Ctrl+C.
- Verificar endpoint:

```powershell
curl.exe -s http://localhost:20128/v1/models
```

- Espera JSON list con `auto`, `oc/free`, `felo/felo`, ...

## 3. Configurar OMNIROUTE_API_KEY

- PowerShell (User scope, persiste):

```powershell
[Environment]::SetEnvironmentVariable("OMNIROUTE_API_KEY", "sk-tu-key-aqui", "User")
```

- Verificar en sesión actual: `$env:OMNIROUTE_API_KEY = "sk-tu-key-aqui"` luego `echo $env:OMNIROUTE_API_KEY`
- Añadir a los 3 perfiles bash de MSYS2 (para que los subagentes de opencode hereden la var):

```bash
# en ~/.bashrc, ~/.bash_profile y ~/.profile

echo 'export OMNIROUTE_API_KEY="sk-omniroute-local"' >> ~/.bashrc
echo 'export OMNIROUTE_API_KEY="sk-omniroute-local"' >> ~/.bash_profile
echo 'export OMNIROUTE_API_KEY="sk-omniroute-local"' >> ~/.profile
```

- Verificar: `echo $OMNIROUTE_API_KEY`
- Nota: si usas solo modelos keyless (auto/oc/free/felo/felo) un placeholder `sk-omniroute-local` basta; si conectas providers de pago, usa la key real del dashboard `http://localhost:20128/endpoints`.

## 4. Backup antes de tocar config

```powershell
copy "C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\opencode.jsonc" "C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\opencode.jsonc.backup"
```

## 5. Integrar en opencode (bloque manual provider)

- ⚠️ ADVERTENCIA: NUNCA correr `omniroute setup-opencode` ni `omniroute setup opencode` — escriben al config GLOBAL y son difíciles de revertir. Integración manual solo en el opencode.jsonc del proyecto.
- Editar `opencode.jsonc` (raíz del proyecto): dentro de `"provider": { ... }`, después de `ollama-local`, añadir:

```jsonc
    "omniroute": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "OmniRoute Gateway",
      "options": {
        "baseURL": "http://localhost:20128/v1",
        "apiKey": "{env:OMNIROUTE_API_KEY}"
      },
      "models": {
        "auto": { "name": "OmniRoute Auto (smart routing)", "limit": { "context": 128000, "output": 65536 } },
        "oc/free": { "name": "OpenCode Free (via OmniRoute)", "limit": { "context": 128000, "output": 4096 } },
        "felo/felo": { "name": "Felo (via OmniRoute)", "limit": { "context": 32000, "output": 4096 } }
      }
    }
```

- NO tocar `ollama-local`, ni añadir top-level `model` (Option A: omniroute disponible, no default).

## 6. Validar JSONC

```bash
npx -y json5 opencode.jsonc
```

## 7. Reiniciar opencode y verificar

- Cerrar/reabrir opencode (o `/restart` en TUI)
- En opencode: `/models | grep -i omniroute` → debe mostrar `omniroute/auto`, `omniroute/oc/free`, `omniroute/felo/felo`
- Test chat: `opencode -m omniroute/auto "Hola, ¿qué modelo eres?"`
- Regression: `opencode -m ollama-local/qwen2.5-coder:7b "Hola"` (ollama-local debe seguir funcionando)

## 8. Uso cotidiano (tu caso de uso: cuota agotada)

1. Abre una terminal: `omniroute` (arranca en 20128)
2. En opencode: `/model omniroute/auto` → omniroute elige automáticamente el mejor provider disponible (auto-fallback si uno está rate-limited o sin cuota)
3. Cuando termines: Ctrl+C en la terminal de omniroute (libera RAM)
4. Si olvidas arrancarlo: solo fallan requests `omniroute/*`; el resto de providers sigue funcionando (degradación graceful)

## 9. Solución de problemas

- **Puerto ocupado**: `netstat -ano | findstr :20128` → matar PID o cambiar puerto (`PORT=20129 omniroute` + actualizar baseURL en opencode.jsonc a `http://localhost:20129/v1`)
- **401/403 Invalid API key**: rotar key en `http://localhost:20128/endpoints`, actualizar env var, reiniciar opencode
- **ECONNREFUSED / fetch failed**: omniroute no está corriendo → `omniroute` y reintentar
- **/models no muestra omniroute**: revisa validación JSONC (paso 6) y que arrancaste omniroute antes de abrir opencode

## 10. Desinstalar (rollback)

```powershell
npm uninstall -g omniroute
```

- Revertir opencode.jsonc: `git checkout opencode.jsonc` (o borrar el bloque provider.omniroute manualmente)
- Quitar env var: `[Environment]::SetEnvironmentVariable("OMNIROUTE_API_KEY", $null, "User")` + borrar export de los 3 perfiles bash

## Referencia rápida

| Acción               | Comando                                              |
| -------------------- | ---------------------------------------------------- |
| Instalar             | `npm install -g omniroute@3.8.49 --include=optional` |
| Arrancar             | `omniroute`                                          |
| Endpoint             | `http://localhost:20128/v1`                          |
| Modelo auto-fallback | `/model omniroute/auto`                              |
| Desinstalar          | `npm uninstall -g omniroute`                         |
