// semantic.js
// Por qué este módulo existe separado: la lógica de similitud
// no depende de MCP ni de los remotos — es pura. Fácil de testear
// y de cambiar el modelo de embeddings sin tocar el resto.

import { readFileSync, writeFileSync, existsSync } from 'fs'

const CACHE_PATH = new URL('./cache.json', import.meta.url).pathname
const TOP_K = parseInt(process.env.PROXY_TOP_K ?? '8')
const THRESHOLD = parseFloat(process.env.PROXY_THRESHOLD ?? '0.25')

// Por qué embeddings locales y no API:
// - Sin latencia de red en cada tools/list
// - Sin costo por llamada
// - Suficiente calidad para matching de descripciones de tools
// Usamos @xenova/transformers (modelo all-MiniLM-L6-v2, ~23MB)
let pipeline = null
async function getEmbedder() {
  if (!pipeline) {
    const { pipeline: createPipeline } = await import('@xenova/transformers')
    pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2')
  }
  return pipeline
}

async function embed(text) {
  const embedder = await getEmbedder()
  const output = await embedder(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

function cosineSimilarity(a, b) {
  let dot = 0, normA = 0, normB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB))
}

// Cache en disco: los embeddings de tools se calculan una vez
// y se reusan. Solo se recalculan si el catálogo cambia.
let toolEmbeddingCache = existsSync(CACHE_PATH)
  ? JSON.parse(readFileSync(CACHE_PATH, 'utf8'))
  : {}

function saveCache() {
  writeFileSync(CACHE_PATH, JSON.stringify(toolEmbeddingCache, null, 2))
}

export async function buildToolIndex(tools, targetName) {
  let changed = false
  for (const tool of tools) {
    const cacheKey = `${targetName}::${tool.name}`
    if (!toolEmbeddingCache[cacheKey]) {
      // Por qué concatenar name + description:
      // El nombre solo ("create_card") es ambiguo.
      // La descripción completa da contexto semántico real.
      const text = `${tool.name}: ${tool.description ?? ''}`
      toolEmbeddingCache[cacheKey] = await embed(text)
      changed = true
    }
  }
  if (changed) saveCache()
}

export async function filterTools(tools, taskPrompt, targetName) {
  if (!taskPrompt || tools.length <= TOP_K) return tools

  const queryEmbedding = await embed(taskPrompt)

  const scored = tools.map(tool => {
    const cacheKey = `${targetName}::${tool.name}`
    const toolEmb = toolEmbeddingCache[cacheKey]
    if (!toolEmb) return { tool, score: 0 }
    return { tool, score: cosineSimilarity(queryEmbedding, toolEmb) }
  })

  // Por qué mantener tools con score 0 si no hay suficientes:
  // Si el catálogo es pequeño o el query es muy ambiguo,
  // es mejor exponer todo que dejar al agente sin tools.
  const filtered = scored
    .filter(s => s.score >= THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, TOP_K)
    .map(s => s.tool)

  return filtered.length >= 3 ? filtered : tools.slice(0, TOP_K)
}