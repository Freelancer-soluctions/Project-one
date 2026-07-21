# Sistema de Hooks de OpenCode

> **Fecha:** 2026-07-16
> **Versión de OpenCode:** ~1.18.x (basado en `@opencode-ai/plugin@^1.18.2` en el proyecto local)
> **Fuentes:** Documentación oficial, OpenCode Book, OpenCode Plugins Manual, código del proyecto local

---

## 1. Introducción

### ¿Qué son los hooks? (Para toda la audiencia)

Los **hooks** son puntos de enganche que OpenCode expone para que desarrolladores externos puedan extender o modificar el comportamiento del sistema. Piensa en ellos como «tomas de corriente»: OpenCode tiene eventos que ocurren en momentos específicos (cuando se inicia una sesión, cuando se ejecuta una herramienta, cuando se envía un mensaje al modelo de IA, etc.) y los hooks permiten conectar código personalizado que se ejecuta justo en esos momentos.

**Para stakeholders no técnicos:** Imagina que OpenCode es una fábrica automatizada. Los hooks son como sensores y paneles de control colocados en puntos clave de la línea de producción. Puedes agregar tus propias reglas: «cuando el producto pase por aquí, haz una verificación extra» o «cuando se complete este paso, envía una notificación». Esto permite personalizar el comportamiento sin tener que reconstruir toda la fábrica.

**Para desarrolladores:** Los hooks son funciones JavaScript/TypeScript que se exportan desde un **plugin**. Cada hook recibe un objeto `input` (de solo lectura) y un objeto `output` (mutable). Los plugins modifican el `output` para influir en el comportamiento. Todos los hooks son asíncronos y se ejecutan en cadena: si hay múltiples plugins, cada uno ve las modificaciones del anterior.

### Arquitectura general

```
Plugin → exporta → { hooks object }
                         │
           ┌─────────────┼─────────────┐
           ▼             ▼             ▼
    hook "config"   hook "event"   hook "tool.execute.after"
    (configuración) (observador)  (post-ejecución)
```

Los hooks se declaran en un archivo dentro de `.opencode/plugins/` (o `~/.config/opencode/plugins/`). Cada plugin es una función asíncrona que recibe un contexto (`PluginInput`) y retorna un objeto con los hooks que implementa.

---

## 2. Clasificación de Hooks

Los hooks se organizan en las siguientes categorías:

| Categoría | Hooks | Propósito general |
|-----------|-------|-------------------|
| **Configuración y registro** | `config`, `tool`, `auth` | Extender la configuración, registrar herramientas y proveedores de autenticación |
| **Ciclo de chat/LLM** | `chat.message`, `chat.params`, `chat.headers`, `experimental.chat.messages.transform`, `experimental.chat.system.transform`, `experimental.text.complete` | Interceptar y modificar mensajes, parámetros y prompts enviados al modelo |
| **Ejecución de herramientas** | `tool.execute.before`, `tool.execute.after`, `command.execute.before` | Intervenir antes/después de ejecutar herramientas o comandos |
| **Permisos** | `permission.ask` | Controlar solicitudes de permiso programáticamente |
| **Shell** | `shell.env` | Inyectar variables de entorno en ejecuciones de shell |
| **Ciclo de sesión** | `experimental.session.compacting` | Personalizar la compresión de contexto |
| **Suscripción a eventos** | `event` | Escuchar todos los eventos del sistema (observer) |

---

## 3. Catálogo Detallado de Hooks

Cada hook se documenta con la siguiente estructura:
- **En una frase (no técnico):** Resumen en lenguaje sencillo
- **Resumen técnico:** Descripción precisa para desarrolladores
- **Disparador:** Cuándo se ejecuta
- **Payload (input):** Qué información recibe (solo lectura)
- **Retorno (output):** Qué puede modificar
- **¿Bloqueante?:** Si detiene el flujo hasta que termina
- **Ejemplo:** Código TypeScript ilustrativo
- **Fuente:** Confirmado (con cita) o inferido (no confirmado oficialmente)

---

### 3.1 Configuración y Registro

#### Hook: `config`

- **En una frase:** Permite a un plugin modificar la configuración de OpenCode en tiempo de arranque, como agregar comandos personalizados, agentes o servidores MCP.
- **Resumen técnico:** Inyecta o modifica la configuración global durante la inicialización del plugin. Útil para empaquetar comandos, agentes o servidores MCP junto con un plugin.
- **Disparador:** Una vez durante la inicialización del plugin, después de cargar todos los plugins.
- **Payload (input):** Objeto `Config` completo (`input.command`, `input.agent`, `input.mcp`, etc.)
- **Retorno (output):** Modifica el objeto `input` directamente (mutación in-place).
- **¿Bloqueante?:** Sí — la inicialización espera a que termine.
- **Ejemplo:**
  ```typescript
  import type { Plugin } from "@opencode-ai/plugin";

  export const MiPlugin: Plugin = async (ctx) => ({
    config: async (config) => {
      config.command = config.command || {};
      config.command["saludar"] = {
        template: "Di hola a $ARGUMENTS",
        description: "Saluda a alguien",
      };
    },
  });
  ```
- **Fuente:** Confirmado — Documentación oficial [opencode.ai/docs/plugins/](https://opencode.ai/docs/plugins/) y OpenCode Book §13.2.2.

---

#### Hook: `tool`

- **En una frase:** Permite registrar herramientas personalizadas que el modelo de IA puede invocar, como si fueran herramientas nativas.
- **Resumen técnico:** Las herramientas registradas vía `tool` están disponibles para todos los agentes (sujeto a reglas de permiso). Usa el helper `tool()` de `@opencode-ai/plugin` para definirlas.
- **Disparador:** Una vez durante la inicialización del plugin, después de cargar todos los plugins.
- **Payload (input):** No aplica — no es una función, es un diccionario.
- **Retorno (output):** Un objeto `{ [key: string]: ToolDefinition }`. No hay mutación de output.
- **¿Bloqueante?:** Sí — se registra antes de que los agentes puedan usarlas.
- **Ejemplo:**
  ```typescript
  import { type Plugin, tool } from "@opencode-ai/plugin";

  export const MiPlugin: Plugin = async (ctx) => ({
    tool: {
      timestamp: tool({
        description: "Obtiene el timestamp actual",
        args: {},
        async execute(args, context) {
          return new Date().toISOString();
        },
      }),
    },
  });
  ```
- **Fuente:** Confirmado — Documentación oficial y OpenCode Book §13.2.1.

---

#### Hook: `auth`

- **En una frase:** Permite agregar nuevos métodos de autenticación para proveedores de modelos de IA (OAuth, API Key, etc.).
- **Resumen técnico:** Devuelve una configuración `AuthHook` con el nombre del proveedor, métodos de autenticación y un cargador opcional.
- **Disparador:** Durante la inicialización del proveedor, cuando se necesita autenticación.
- **Payload (input):** No aplica — es una declaración, no una función hook.
- **Retorno:** Objeto `AuthHook` con `provider`, `methods[]` y `loader?`.
- **¿Bloqueante?:** Sí — la inicialización del proveedor espera.
- **Ejemplo:**
  ```typescript
  export const MiPlugin: Plugin = async (ctx) => ({
    auth: {
      provider: "mi-servicio-llm",
      methods: [
        {
          type: "api",
          label: "API Key",
          prompts: [{ type: "text", key: "apiKey", message: "Ingresa tu API key" }],
          async authorize(inputs) {
            return { type: "success", key: inputs.apiKey };
          },
        },
      ],
    },
  });
  ```
- **Fuente:** Confirmado — OpenCode Plugins Manual y OpenCode Book §13.1.3.

---

### 3.2 Ciclo de Chat / LLM

#### Hook: `chat.message`

- **En una frase:** Se activa cuando el usuario envía un mensaje, antes de que llegue al modelo de IA. Permite modificar el mensaje o agregar contexto adicional.
- **Resumen técnico:** Intercepta el mensaje del usuario antes de enviarlo al LLM. Permite modificar `output.message` o inyectar `parts` adicionales (como contexto de archivos, instrucciones del sistema dinámicas, etc.).
- **Disparador:** Cuando el usuario envía un mensaje ([source](https://github.com/sst/opencode/blob/3efc95b/packages/opencode/src/session/prompt.ts#L1046)).
- **Payload (input):** `{ sessionID, agent?, model?, messageID? }`
- **Retorno (output):** `{ message: UserMessage, parts: Part[] }` — mutable.
- **¿Bloqueante?:** Sí — el mensaje no se envía al LLM hasta que todos los hooks `chat.message` terminen.
- **Ejemplo:**
  ```typescript
  export const MiPlugin: Plugin = async (ctx) => ({
    "chat.message": async (input, output) => {
      output.parts.push({
        type: "text",
        text: "\n[Contexto: El proyecto usa TypeScript con modo estricto]",
      });
    },
  });
  ```
- **Fuente:** Confirmado — Documentación oficial, OpenCode Plugins Manual, OpenCode Book §13.2.4.

---

#### Hook: `chat.params`

- **En una frase:** Permite ajustar los parámetros que controlan cómo el modelo de IA genera respuestas (temperatura, creatividad, etc.) en cada llamada.
- **Resumen técnico:** Modifica los parámetros enviados al LLM en cada solicitud: `temperature`, `topP`, `topK`, y opciones específicas del proveedor.
- **Disparador:** Antes de cada llamada al LLM ([source](https://github.com/sst/opencode/blob/3efc95b/packages/opencode/src/session/prompt.ts#L920)).
- **Payload (input):** `{ sessionID, agent, model, provider, message }`
- **Retorno (output):** `{ temperature, topP, topK?, options }` — mutable.
- **¿Bloqueante?:** Sí — la llamada al LLM espera.
- **Ejemplo:**
  ```typescript
  export const MiPlugin: Plugin = async (ctx) => ({
    "chat.params": async (input, output) => {
      if (input.message.text?.includes("creativo")) {
        output.temperature = 1.5;
      }
      // Inyectar 'effort' para modelos Anthropic
      if (input.provider.info.id === "anthropic") {
        output.options["anthropic"] = {
          thinking: { type: "enabled", budget_tokens: 10000 },
        };
      }
    },
  });
  ```
- **Fuente:** Confirmado — Documentación oficial (sección Examples), OpenCode Book §13.2.3.

---

#### Hook: `chat.headers`

- **En una frase:** Permite modificar los encabezados HTTP enviados en las solicitudes a la API del proveedor de IA.
- **Resumen técnico:** Intercepta y modifica los encabezados de las peticiones HTTP salientes hacia el proveedor LLM. Útil para agregar tokens de autenticación dinámicos o headers personalizados.
- **Disparador:** Antes de cada solicitud HTTP al proveedor LLM.
- **Payload (input):** Sin detalles públicos completos.
- **Retorno (output):** Objeto de encabezados mutable.
- **¿Bloqueante?:** Sí.
- **Ejemplo:**
  ```typescript
  export const MiPlugin: Plugin = async (ctx) => ({
    "chat.headers": async (input, output) => {
      output.headers = {
        ...output.headers,
        "X-Custom-Header": "valor-personalizado",
      };
    },
  });
  ```
- **Fuente:** Inferido — Mencionado en la interfaz `Hooks` del OpenCode Book §13.1.1. No aparece en la documentación oficial ni en el Plugins Manual. **No confirmado oficialmente.**

---

#### Hook: `experimental.chat.messages.transform`

- **En una frase:** Permite transformar la lista completa de mensajes del historial antes de enviarla al modelo. Es más potente que `chat.message` porque opera sobre todos los mensajes, no solo el último.
- **Resumen técnico:** Modifica el array completo de mensajes que se enviará al LLM. Puedes filtrar, reordenar, fusionar o eliminar mensajes. Prefijo `experimental.` indica API inestable.
- **Disparador:** Cuando se construye la lista de mensajes para enviar al LLM.
- **Payload (input):** `{}` (vacio actualmente)
- **Retorno (output):** `{ messages: [{ info: Message, parts: Part[] }] }`
- **¿Bloqueante?:** Sí.
- **Ejemplo:**
  ```typescript
  export const MiPlugin: Plugin = async (ctx) => ({
    "experimental.chat.messages.transform": async (input, output) => {
      // Filtrar mensajes de depuración del historial
      output.messages = output.messages.filter(
        (m) => !m.info.role?.startsWith("debug-")
      );
    },
  });
  ```
- **Fuente:** Inferido — Documentado en OpenCode Book §13.2.5 con firma TypeScript. No aparece en la documentación oficial ni en el Plugins Manual. **No confirmado oficialmente.**

---

#### Hook: `experimental.chat.system.transform`

- **En una frase:** Permite modificar el prompt del sistema (las instrucciones de fondo que recibe el modelo de IA) añadiendo, quitando o reemplazando párrafos enteros.
- **Resumen técnico:** Modifica el array de segmentos del system prompt. Es el hook principal que usan proyectos como oh-my-opencode para inyectar instrucciones de comportamiento complejas.
- **Disparador:** Cuando se construye el System Prompt.
- **Payload (input):** `{ sessionID?, model }`
- **Retorno (output):** `{ system: string[] }` — cada elemento es un segmento del prompt.
- **¿Bloqueante?:** Sí.
- **Ejemplo:**
  ```typescript
  export const MiPlugin: Plugin = async (ctx) => ({
    "experimental.chat.system.transform": async (input, output) => {
      output.system.push(
        "## Regla del proyecto\nSiempre preguntar antes de eliminar archivos."
      );
    },
  });
  ```
- **Fuente:** Inferido — Documentado en OpenCode Book §13.2.6 con firma TypeScript. **No confirmado oficialmente.**

---

#### Hook: `experimental.text.complete`

- **En una frase:** Se activa después de que el modelo genera texto pero antes de que se muestre al usuario. Permite modificar la respuesta final.
- **Resumen técnico:** Hook de post-generación. Recibe el texto generado y permite modificarlo antes de que se entregue al usuario. Experimental.
- **Disparador:** Después de que el LLM completa una generación de texto.
- **Payload (input):** Sin detalles públicos completos.
- **Retorno (output):** Texto generado (mutable).
- **¿Bloqueante?:** Sí.
- **Ejemplo:**
  ```typescript
  export const MiPlugin: Plugin = async (ctx) => ({
    "experimental.text.complete": async (input, output) => {
      // Ejemplo hipotético: sanitizar la salida
      // output.text = output.text.replace(/datos-sensibles/g, "[REDACTED]");
    },
  });
  ```
- **Fuente:** Inferido — Mencionado en la tabla del OpenCode Plugins Manual. No hay firma TypeScript detallada disponible. **No confirmado oficialmente.**

---

### 3.3 Ejecución de Herramientas

#### Hook: `tool.execute.before`

- **En una frase:** Se activa justo antes de que OpenCode ejecute una herramienta (como leer un archivo, ejecutar un comando, etc.). Permite modificar los argumentos o incluso bloquear la ejecución.
- **Resumen técnico:** Intercepta la llamada a cualquier herramienta antes de su ejecución. Puedes modificar `output.args` o lanzar un error para cancelar la ejecución.
- **Disparador:** Antes de cada ejecución de herramienta ([source](https://github.com/sst/opencode/blob/3efc95b/packages/opencode/src/session/prompt.ts)).
- **Payload (input):** `{ tool: string, sessionID: string, callID: string }`
- **Retorno (output):** `{ args: any }` — mutable. Lanzar `new Error()` cancela la ejecución.
- **¿Bloqueante?:** Sí — la herramienta no se ejecuta hasta que el hook termina.
- **Ejemplo:**
  ```typescript
  export const EnvProtection: Plugin = async (ctx) => ({
    "tool.execute.before": async (input, output) => {
      if (input.tool === "read" && output.args.filePath?.includes(".env")) {
        throw new Error("No leer archivos .env");
      }
    },
  });
  ```
- **Fuente:** Confirmado — Documentación oficial (ejemplo de .env protection) y OpenCode Book §13.2.8.

---

#### Hook: `tool.execute.after`

- **En una frase:** Se activa después de ejecutar una herramienta. Permite inspeccionar, registrar o modificar el resultado antes de que el modelo lo vea.
- **Resumen técnico:** Post-procesa el resultado de cualquier herramienta. Puedes modificar `output.output`, `output.title` y `output.metadata`. Es un hook de solo observación en el diseño recomendado (no debe usarse para corregir errores — eso se hace en capas superiores).
- **Disparador:** Después de cada ejecución de herramienta.
- **Payload (input):** `{ tool: string, sessionID: string, callID: string }`
- **Retorno (output):** `{ title: string, output: string, metadata: any }` — mutable.
- **¿Bloqueante?:** Sí — el resultado no se entrega al LLM hasta que el hook termina.
- **Ejemplo (del proyecto local):**
  ```typescript
  export const plugin: Plugin = async () => ({
    "tool.execute.after": async (input, output) => {
      if (input.tool !== "task") return; // Solo subagentes

      const agentName = input.args?.subagent_type;
      if (!agentName) return;

      // Validar el contrato de salida y registrar en auditoría
      const subagentMessage = extractTaskResult(output.output ?? "");
      if (!subagentMessage) return;

      const verdict = validateContract(subagentMessage, agentName);
      if (!verdict.valid) {
        output.metadata = output.metadata || {};
        output.metadata.contractValidation = {
          valid: false,
          agent: verdict.agent,
          errors: verdict.errors,
        };
      }
    },
  });
  ```
- **Fuente:** Confirmado — Implementación real en el proyecto local (`.opencode/plugins/output-contracts.ts`) y documentación oficial.

---

#### Hook: `command.execute.before`

- **En una frase:** Se activa antes de ejecutar un comando de slash (como `/skill` o un comando personalizado). Permite modificar o interceptar comandos.
- **Resumen técnico:** Similar a `tool.execute.before` pero específico para comandos definidos en la configuración. Mencionado en la interfaz `Hooks` del `@opencode-ai/plugin`.
- **Disparador:** Antes de ejecutar un comando slash.
- **Payload (input):** Sin detalles públicos completos.
- **Retorno (output):** Mutable — permite modificar argumentos del comando.
- **¿Bloqueante?:** Sí.
- **Ejemplo:**
  ```typescript
  export const MiPlugin: Plugin = async (ctx) => ({
    "command.execute.before": async (input, output) => {
      console.log(`Comando ejecutado: ${input.name}`);
    },
  });
  ```
- **Fuente:** Inferido — Mencionado en la interfaz `Hooks` del OpenCode Book §13.1.1. **No confirmado oficialmente.**

---

### 3.4 Permisos

#### Hook: `permission.ask`

- **En una frase:** Permite automatizar las decisiones de permisos: puedes aprobar operaciones seguras automáticamente y denegar las peligrosas sin molestar al usuario.
- **Resumen técnico:** Intercepta cada solicitud de permiso antes de mostrarla al usuario. Permite establecer `output.status` como `"allow"`, `"deny"` o `"ask"` (preguntar al usuario).
- **Disparador:** Cuando una herramienta requiere permiso y el sistema está por preguntar al usuario ([source](https://github.com/sst/opencode/blob/3efc95b/packages/opencode/src/permission/index.ts#L81)).
- **Payload (input):** Objeto `Permission` con detalles de la solicitud.
- **Retorno (output):** `{ status: "ask" | "deny" | "allow" }`
- **¿Bloqueante?:** Sí — la pregunta al usuario no se muestra hasta que el hook decida.
- **Ejemplo:**
  ```typescript
  export const MiPlugin: Plugin = async (ctx) => ({
    "permission.ask": async (input, output) => {
      if (input.tool === "read") {
        output.status = "allow"; // Auto-aprobar lecturas
      }
      if (input.tool === "bash" && input.args?.includes("rm -rf")) {
        output.status = "deny"; // Auto-denegar rm -rf
      }
    },
  });
  ```
- **Fuente:** Confirmado — Documentación oficial y OpenCode Book (mencionado en interfaz Hooks).

---

### 3.5 Shell

#### Hook: `shell.env`

- **En una frase:** Permite inyectar variables de entorno en todas las ejecuciones de comandos shell, tanto del agente como del terminal del usuario.
- **Resumen técnico:** Modifica el entorno de shell para todas las ejecuciones posteriores. Útil para establecer API keys, configuraciones de proyecto, etc.
- **Disparador:** Durante la inicialización y cuando se ejecutan comandos shell.
- **Payload (input):** `{ cwd: string }` (directorio de trabajo actual)
- **Retorno (output):** `{ env: Record<string, string> }` — las variables se agregan al entorno.
- **¿Bloqueante?:** No — es declarativo (establece variables para ejecuciones futuras).
- **Ejemplo (de la documentación oficial):**
  ```typescript
  export const InjectEnvPlugin: Plugin = async () => ({
    "shell.env": async (input, output) => {
      output.env.MI_API_KEY = "secreto";
      output.env.RAIZ_DEL_PROYECTO = input.cwd;
    },
  });
  ```
- **Fuente:** Confirmado — Documentación oficial (ejemplo "Inject environment variables").

---

### 3.6 Ciclo de Sesión

#### Hook: `experimental.session.compacting`

- **En una frase:** Cuando OpenCode comprime el contexto de la sesión para ahorrar tokens, este hook permite inyectar información importante que no debería perderse en la compresión.
- **Resumen técnico:** Se activa antes de que el LLM genere un resumen de continuación (compaction). Permite inyectar contexto adicional vía `output.context[]` o reemplazar completamente el prompt de compactación vía `output.prompt`.
- **Disparador:** Antes de cada operación de compactación de sesión.
- **Payload (input):** `{ sessionID: string }`
- **Retorno (output):** `{ context: string[], prompt?: string }` — si se establece `prompt`, se reemplaza completamente el prompt de compactación por defecto.
- **¿Bloqueante?:** Sí — la compactación espera.
- **Ejemplo (de la documentación oficial):**
  ```typescript
  import type { Plugin } from "@opencode-ai/plugin";

  export const CompactionPlugin: Plugin = async (ctx) => ({
    "experimental.session.compacting": async (input, output) => {
      output.context.push(`## Contexto Personalizado
  Estado que debe persistir entre compactaciones:
  - Tarea actual
  - Decisiones importantes tomadas
  - Archivos en modificación activa`);
    },
  });
  ```
- **Fuente:** Confirmado — Documentación oficial (sección "Compaction hooks") y OpenCode Book §13.2.9.

---

### 3.7 Suscripción a Eventos (Observer)

#### Hook: `event`

- **En una frase:** Es un «todo en uno»: permite escuchar cualquier evento que ocurra en OpenCode sin modificar nada, solo para reaccionar (enviar notificaciones, registrar actividad, etc.).
- **Resumen técnico:** Suscripción comodín (wildcard) a todos los eventos del sistema. Es un hook de solo observación — no puede modificar eventos, solo reaccionar a ellos.
- **Disparador:** Cada vez que cualquier evento es publicado en el Bus de eventos.
- **Payload (input):** `{ event: { type: string, properties: any } }`
- **Retorno (output):** `Promise<void>` — sin retorno, solo efectos secundarios.
- **¿Bloqueante?:** Sí (para ese plugin), pero asíncrono no bloqueante para el sistema (otros plugins continúan).
- **Eventos disponibles (confirmados):**

  | Categoría | Eventos |
  |-----------|---------|
  | **Sesión** | `session.created`, `session.updated`, `session.deleted`, `session.diff`, `session.error`, `session.status`, `session.idle`, `session.compacted` |
  | **Mensajes** | `message.updated`, `message.removed`, `message.part.updated`, `message.part.removed` |
  | **Archivos** | `file.edited`, `file.watcher.updated` |
  | **Herramientas** | `tool.execute.before`, `tool.execute.after` |
  | **Permisos** | `permission.updated`, `permission.replied` |
  | **Comandos** | `command.executed` |
  | **TUI** | `tui.prompt.append`, `tui.command.execute`, `tui.toast.show` |
  | **LSP** | `lsp.updated`, `lsp.client.diagnostics` |
  | **Todo** | `todo.updated` |
  | **Instalación** | `installation.updated`, `installation.update.available` |
  | **Shell/PTY** | `pty.created`, `pty.updated`, `pty.exited`, `pty.deleted` |
  | **VCS** | `vcs.branch.updated` |
  | **IDE** | `ide.installed` |
  | **Servidor** | `server.connected` |

- **Ejemplo:**
  ```typescript
  export const NotificationPlugin: Plugin = async ({ $ }) => ({
    event: async ({ event }) => {
      if (event.type === "session.idle") {
        await $`osascript -e 'display notification "Sesión completada" with title "OpenCode"'`;
      }
      if (event.type === "file.edited") {
        console.log("Archivo editado:", event.properties.file);
      }
    },
  });
  ```
- **Fuente:** Confirmado — Documentación oficial (sección "Events" y ejemplos) y OpenCode Book §13.2.7.

---

## 4. Cómo se configuran los hooks en un proyecto

### 4.1 Estructura de un plugin

Los hooks se declaran dentro de plugins. Un plugin es un archivo JavaScript o TypeScript en:

- **Global:** `~/.config/opencode/plugins/`
- **Proyecto:** `.opencode/plugins/`

```typescript
// .opencode/plugins/mi-plugin.ts
import type { Plugin } from "@opencode-ai/plugin";

export const MiPlugin: Plugin = async ({ project, client, $, directory, worktree }) => {
  console.log(`Plugin iniciado para: ${project.name}`);

  return {
    // Aquí van los hooks que este plugin implementa
    config: async (config) => {
      // ...
    },
    "tool.execute.after": async (input, output) => {
      // ...
    },
    event: async ({ event }) => {
      // ...
    },
  };
};
```

### 4.2 Registro de plugins

Los plugins se registran en `opencode.json` o `opencode.jsonc` en la clave `plugin`:

```jsonc
// opencode.jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": [
    "nombre-del-plugin-npm",                    // Plugin desde npm
    "./.opencode/plugins/mi-plugin-local.ts"    // Plugin local
  ]
}
```

**Ejemplo del proyecto local (opencode.jsonc):**
```jsonc
{
  "plugin": [
    "@warp-dot-dev/opencode-warp",
    "./.opencode/plugins/output-contracts.ts"
  ]
}
```

### 4.3 Orden de carga

Los plugins se cargan en este orden (los hooks se ejecutan en secuencia, en el mismo orden):

1. Config global (`~/.config/opencode/opencode.json`)
2. Config del proyecto (`opencode.json`)
3. Directorio global de plugins (`~/.config/opencode/plugins/`)
4. Directorio del proyecto (`.opencode/plugins/`)

### 4.4 Mecanismo de ejecución en cadena

Todos los hooks del mismo nombre se ejecutan en secuencia (con `await`) en el orden de registro. Cada plugin recibe el mismo objeto `output` — las modificaciones del plugin anterior son visibles para el siguiente:

```typescript
// Mecanismo interno simplificado (OpenCode Book §13.2.10)
async function trigger(name, input, output) {
  for (const hook of hooksRegistrados) {
    const fn = hook[name];
    if (!fn) continue;
    await fn(input, output); // Cada plugin modifica output
  }
  return output;
}
```

### 4.5 Dependencias npm

Los plugins locales pueden usar paquetes npm. Agrega un `package.json` en `.opencode/`:

```json
{
  "dependencies": {
    "@opencode-ai/plugin": "^1.18.2",
    "ajv": "^8.17.1"
  }
}
```

OpenCode ejecuta `bun install` automáticamente al iniciar.

---

## 5. Tabla Resumen

| Hook | ¿Confirmado? | Categoría | ¿Bloqueante? | ¿Modifica? |
|------|-------------|-----------|-------------|------------|
| `config` | ✅ Sí | Configuración | Sí | Config global |
| `tool` | ✅ Sí | Registro | Sí | N/A (declara) |
| `auth` | ✅ Sí | Autenticación | Sí | N/A (declara) |
| `chat.message` | ✅ Sí | Chat/LLM | Sí | Mensaje y partes |
| `chat.params` | ✅ Sí | Chat/LLM | Sí | Temperatura, topP, options |
| `chat.headers` | ⚠️ Inferido | Chat/LLM | Sí | Encabezados HTTP |
| `experimental.chat.messages.transform` | ⚠️ Inferido | Chat/LLM | Sí | Lista de mensajes |
| `experimental.chat.system.transform` | ⚠️ Inferido | Chat/LLM | Sí | System prompt |
| `experimental.text.complete` | ⚠️ Inferido | Chat/LLM | Sí | Texto generado |
| `tool.execute.before` | ✅ Sí | Ejecución | Sí | Argumentos de tool |
| `tool.execute.after` | ✅ Sí | Ejecución | Sí | Output de tool |
| `command.execute.before` | ⚠️ Inferido | Ejecución | Sí | Args de comando |
| `permission.ask` | ✅ Sí | Permisos | Sí | Status (allow/deny/ask) |
| `shell.env` | ✅ Sí | Shell | No | Variables de entorno |
| `experimental.session.compacting` | ✅ Sí | Sesión | Sí | Contexto/prompt |
| `event` | ✅ Sí | Observer | Sí (aislado) | N/A (solo observa) |

---

## 6. Limitaciones y notas importantes

1. **Hooks experimentales**: Aquellos con prefijo `experimental.` tienen API inestable y pueden cambiar sin aviso. No deben considerarse parte de la API pública estable.

2. **`tool.execute.after` no puede reintentar**: Una vez que el hook se ejecuta, la herramienta ya se completó. El hook no puede deshacer la operación ni forzar un reintento. Para correcciones, usar autovalidación en el prompt (Capa 1) antes de que el hook se ejecute (Capa 2).

3. **Los hooks NO pueden lanzar errores para cancelar operaciones** (excepto `tool.execute.before` y `permission.ask` que sí lo soportan). En otros hooks, lanzar un error puede romper la sesión.

4. **Ejecución secuencial**: Si múltiples plugins implementan el mismo hook, se ejecutan en orden de carga. Los plugins posteriores ven las modificaciones de los anteriores.

5. **Ámbito de instancia**: Los eventos están aislados por instancia de OpenCode (directorio del proyecto). Cada proyecto ejecuta su propio bus de eventos.

---

## 7. Fuentes

### Documentación oficial
- [OpenCode Docs — Plugins](https://opencode.ai/docs/plugins/) — Guía oficial de plugins, eventos y hooks de compactación
- [OpenCode Docs — Config](https://opencode.ai/docs/config/) — Documentación de configuración (formato `opencode.json`)
- [OpenCode Config Schema](https://opencode.ai/config.json) — Schema JSON de validación

### OpenCode Book (comunitario)
- [Chapter 13.1 — Plugin Interface Definition](https://www.opencodebook.xyz/en/chapter_13_plugin_system/13.1_plugin_interface_definition) — Definición completa de la interfaz `Hooks` con tipos TypeScript
- [Chapter 13.2 — Plugin Lifecycle Hooks](https://www.opencodebook.xyz/en/chapter_13_plugin_system/13.2_plugin_lifecycle_hooks) — Documentación detallada de cada hook con firmas, timing y ejemplos

### OpenCode Plugins Manual (comunitario)
- [04-hooks-reference.md](https://github.com/joshuadavidthomas/opencode-plugins-manual/blob/main/docs/04-hooks-reference.md) — Referencia de 10 hooks con firmas y ejemplos
- [07-events.md](https://github.com/joshuadavidthomas/opencode-plugins-manual/blob/main/docs/07-events.md) — Sistema de eventos con 30+ eventos documentados
- [05-config-hook.md](https://github.com/joshuadavidthomas/opencode-plugins-manual/blob/main/docs/05-config-hook.md) — Hook `config` no documentado oficialmente

### Código fuente de OpenCode (referencias)
- [packages/opencode/src/bus/index.ts](https://github.com/sst/opencode/blob/3efc95b/packages/opencode/src/bus/index.ts) — Implementación del bus de eventos
- [packages/opencode/src/session/index.ts](https://github.com/sst/opencode/blob/3efc95b/packages/opencode/src/session/index.ts) — Eventos de sesión
- [packages/opencode/src/session/prompt.ts](https://github.com/sst/opencode/blob/3efc95b/packages/opencode/src/session/prompt.ts) — Disparo de hooks `chat.message` y `chat.params`
- [packages/opencode/src/permission/index.ts](https://github.com/sst/opencode/blob/3efc95b/packages/opencode/src/permission/index.ts) — Disparo de hook `permission.ask`
- [packages/plugin/src/index.ts](https://github.com/anomalyco/opencode/blob/dev/packages/plugin/src/index.ts) — Definiciones de tipos del paquete `@opencode-ai/plugin`

### Proyecto local
- `C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\opencode.jsonc` — Configuración con plugins registrados
- `C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\.opencode\plugins\output-contracts.ts` — Implementación real del hook `tool.execute.after`
- `C:\Users\user\Desktop\Programacion\Node-express-nest\project-one\.opencode\package.json` — Dependencia `@opencode-ai/plugin@^1.18.2`
