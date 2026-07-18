// targets.js
import { readFileSync, existsSync } from 'fs'
import { homedir } from 'os'
import { join } from 'path'

// Lee el token que OpenCode ya guardó del flujo OAuth
function getOpenCodeMcpToken(serverName) {
  const authFile = join(homedir(), '.local', 'share', 'opencode', 'mcp-auth.json')
  if (!existsSync(authFile)) return null

  try {
    const auth = JSON.parse(readFileSync(authFile, 'utf8'))
    // OpenCode indexa por nombre del servidor tal como está en opencode.json
    return auth[serverName]?.access_token ?? null
  } catch {
    return null
  }
}

export const TARGETS = {
  composio: {
    url: 'https://connect.composio.dev/mcp',
    headers: () => {
      const token = getOpenCodeMcpToken('composio')
      if (!token) {
        // Fallback: COMPOSIO_API_KEY como env var si el token no está en el archivo
        const apiKey = process.env.COMPOSIO_API_KEY
        if (!apiKey) {
          console.warn('[proxy:composio] No hay token OAuth ni COMPOSIO_API_KEY disponible - enviando sin auth')
          return {}
        }
        return { 'x-api-key': apiKey }
      }
      return { 'Authorization': `Bearer ${token}` }
    }
  },
  context7: {
    url: 'https://mcp.context7.com/mcp',
    headers: () => {
      const token = getOpenCodeMcpToken('context7')
      if (token) return { 'Authorization': `Bearer ${token}` }
      return { 'CONTEXT7_API_KEY': process.env.CONTEXT7_API_KEY ?? '' }
    }
  }
}