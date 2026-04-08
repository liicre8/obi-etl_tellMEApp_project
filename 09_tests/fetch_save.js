import axios from 'axios'
import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Resolve this file's folder
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// CONFIG — edit these only
const CONFIG = {
  URL: 'https://jsonplaceholder.typicode.com/posts',
  MODE: 'raw',                 // 'raw' | 'property' | 'fields'
  PROPERTY_PATH: 'data',       // used when MODE = 'property'
  FIELDS: ['id', 'userId', 'title', 'body'], // used when MODE = 'fields'
  PRETTY: true,
  OUTPUT_FILENAME: 'output.json'
}

// Compute output path in the same folder as this script
const OUTPUT_PATH = join(__dirname, CONFIG.OUTPUT_FILENAME)

// Helpers
const getByPath = (obj, path) => {
  if (!path) return obj
  return path.split('.').reduce((acc, key) => acc && acc[key], obj)
}

const pickFields = (rows, fields) => {
  if (!Array.isArray(rows)) return []
  return rows.map(r => {
    if (r == null || typeof r !== 'object') return {}
    const out = {}
    for (const f of fields) out[f] = r[f]
    return out
  })
}

const selectData = (body, cfg) => {
  if (cfg.MODE === 'raw') return body
  if (cfg.MODE === 'property') return getByPath(body, cfg.PROPERTY_PATH)
  if (cfg.MODE === 'fields') {
    const base = Array.isArray(body) ? body : getByPath(body, cfg.PROPERTY_PATH)
    return pickFields(base, cfg.FIELDS)
  }
  throw new Error('Unsupported MODE')
}

const main = async () => {
  const start = Date.now()
  console.log('Start fetch', CONFIG.URL)

  const resp = await axios.get(CONFIG.URL, {
    headers: { 'User-Agent': 'shadow-json/1.0' },
    timeout: 15000
  })

  const body = resp.data
  const data = selectData(body, CONFIG)

  const jsonText = CONFIG.PRETTY ? JSON.stringify(data, null, 2) : JSON.stringify(data)
  await writeFile(OUTPUT_PATH, jsonText, 'utf8')

  const ms = Date.now() - start
  console.log('Saved', OUTPUT_PATH)
  console.log('Done', { bytes: Buffer.byteLength(jsonText, 'utf8'), ms })
}

main().catch(err => {
  console.error('Error', err.message)
  process.exit(1)
})
