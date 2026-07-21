// index.js
// Por qué usamos @modelcontextprotocol/sdk:
// Implementar el protocolo MCP a mano (JSON-RPC sobre stdio)
// es frágil y propenso a errores de framing. El SDK lo maneja.

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { ListToolsRequestSchema, CallToolRequestSchema } from '@modelcontextprotocol/sdk/types.js'
import { TARGETS } from './targets.js'
import { buildToolIndex, filterTools } from './semantic.js'
import { sanitizeToolList } from './sanitize.js'

// Unhandled rejection handler - catch any unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('[MCP-PROXY] FATAL unhandled rejection:', err)
  process.exit(1)
})

const target = process.argv.find(a => a.startsWith('--target='))?.split('=')[1]
if (!target || !TARGETS[target]) {
  console.error(`[MCP-PROXY] Target desconocido: ${target}. Disponibles: ${Object.keys(TARGETS).join(', ')}`)
  process.exit(1)
}

const config = TARGETS[target]

// Estado en memoria: catálogo completo cacheado para no
// re-fetchar al remoto en cada tools/list de OpenCode.
// TTL de 5 minutos — las tools de un MCP remoto no cambian
// cada segundo, pero sí pueden actualizarse.
let toolsCache = null
let toolsCacheTime = 0
const TOOLS_TTL_MS = 5 * 60 * 1000

// Por qué necesitamos el "último prompt":
// El protocolo MCP no pasa contexto de tarea en tools/list.
// La única forma de saber qué está haciendo el agente es
// interceptar las llamadas a tools/call y extraer el contexto
// del argumento más reciente, o usar una variable de entorno
// que OpenCode pase vía el campo `environment` del MCP local.
// Usamos la segunda opción: el agente escribe su tarea en
// PROXY_TASK_CONTEXT como env var al invocar el subagente.
// Si no existe, devolvemos todas las tools (safe fallback).
function getCurrentTaskContext() {
  return process.env.PROXY_TASK_CONTEXT ?? ''
}

async function fetchRemoteTools() {
  const now = Date.now()
  if (toolsCache && now - toolsCacheTime < TOOLS_TTL_MS) {
    return toolsCache
  }

  // Llamada MCP estándar al remoto real
  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers()
    },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'tools/list', params: {}
    })
  })

  if (!res.ok) {
    console.error(`[MCP-PROXY] [proxy:${target}] fetchRemoteTools failed: ${res.status} ${res.statusText}`)
    if (toolsCache) {
      console.error(`[MCP-PROXY] [proxy:${target}] Falling back to cached tools (${toolsCache.length} tools)`)
      return toolsCache
    }
    throw new Error(`Failed to fetch remote tools: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()
  toolsCache = data.result?.tools ?? []
  toolsCacheTime = now

  // Indexar embeddings en background — no bloquea el tools/list
  buildToolIndex(toolsCache, target).catch(console.error)

  return toolsCache
}

const server = new Server(
  { name: `semantic-proxy-${target}`, version: '1.0.0' },
  { capabilities: { tools: {} } }
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
  const allTools = await fetchRemoteTools()
  const taskContext = getCurrentTaskContext()
  const filtered = await filterTools(allTools, taskContext, target)

  // Sanitize tools before returning to client
  const sanitized = sanitizeToolList(filtered)

  console.error(`[MCP-PROXY] [proxy:${target}] tools/list — ${allTools.length} total → ${filtered.length} filtradas → ${sanitized.length} sanitizadas`)
  return { tools: sanitized }
})

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  // Forward directo al remoto — sin filtrar aquí.
  // La decisión de qué tool usar ya la tomó el modelo.
  const res = await fetch(config.url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...config.headers()
    },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'tools/call',
      params: req.params
    })
  })

  if (!res.ok) {
    console.error(`[MCP-PROXY] [proxy:${target}] tools/call failed: ${res.status} ${res.statusText}`)
    throw new Error(`Tool call failed: ${res.status} ${res.statusText}`)
  }

  const data = await res.json()

  if (data.error) {
    console.error(`[proxy:${target}] tools/call error:`, data.error)
    throw new Error(data.error.message || 'Tool call returned error')
  }

  return data.result
})

const transport = new StdioServerTransport()
await server.connect(transport)
console.error(`[proxy:${target}] listo`)