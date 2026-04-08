// File: 01_ingestions/engine/wools/fetch_all_tree.js

import fs from 'fs'
import path from 'path'
import axios from 'axios'
import chalk from 'chalk'

import { wools_url, wools_tree } from '../../../07_configs/coles/source_endpoints.js'

// ---------- helpers ----------
function sanitizeFilename(name) {
  return name
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-') + '.json'
}

// for comparisons; mirrors filename rules (no symbols, spaces→-), minus ".json", lowercased
function normKey(name) {
  return sanitizeFilename(name || '').replace(/\.json$/i, '').toLowerCase()
}

// List of properties to exclude
const excludedFields = new Set([
  'IsRestricted',
  'ProductCount',
  'IsSortEnabled',
  'IsPaginationEnabled',
  'IsSpecial',
  'RichRelevanceId',
  'IsBundle',
  'IsUntraceable',
  'DisplayOrder'
])

// Recursively strip excluded fields from a node and its children
function cleanNode(node) {
  const cleaned = {}
  for (const [key, value] of Object.entries(node)) {
    if (excludedFields.has(key)) continue
    if (key === 'Children' && Array.isArray(value)) {
      cleaned.Children = value.map(cleanNode)
    } else {
      cleaned[key] = value
    }
  }
  return cleaned
}

// Recursively collect all NodeLevel 1 nodes with NodeId starting with "1"
function collectMatchingNodes(nodes) {
  let result = []
  for (const node of nodes) {
    if (
      node?.NodeLevel === 1 &&
      typeof node.NodeId === 'string' &&
      node.NodeId.startsWith('1')
    ) {
      result.push(node)
    }
    if (Array.isArray(node.Children)) {
      result = result.concat(collectMatchingNodes(node.Children))
    }
  }
  return result
}

// ---------- main ----------
async function processCategoryTree() {
  const apiUrl = `${wools_url}${wools_tree}`
  const outputDir = './02_raw/wools/categories'
  const baselinePath = path.resolve('./07_configs/wools/lookups/L1_category_list.json')

  // 0) Load baseline Wools[] for "New" detection + syncing
  let baselineIsObject = false
  let baselineArray = []
  let baselineSet = new Set()
  try {
    if (fs.existsSync(baselinePath)) {
      const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'))
      if (Array.isArray(raw)) {
        baselineArray = raw.slice()
        baselineIsObject = false
      } else if (Array.isArray(raw?.Wools)) {
        baselineArray = raw.Wools.slice()
        baselineIsObject = true
      } else {
        console.warn(chalk.yellow('⚠️ L1_tree_list.json shape not recognized; starting with empty baseline.'))
      }
      baselineSet = new Set(baselineArray.map(normKey))
    } else {
      console.warn(chalk.yellow(`⚠️ Baseline not found at ${baselinePath}. A new one will be created.`))
    }
  } catch (e) {
    console.warn(chalk.yellow('⚠️ Could not read/parse baseline; proceeding with empty list.'), e.message)
  }

  try {
    const res = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
      }
    })

    const categories = res.data?.Categories
    if (!Array.isArray(categories)) {
      console.error(chalk.red('❌ No "Categories" array found in response.'))
      return
    }

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    const matchingNodes = collectMatchingNodes(categories)
    const newlyDiscovered = []

    for (const node of matchingNodes) {
      const cleanedNode = cleanNode(node)
      const filename = sanitizeFilename(node.Description)
      const filePath = path.join(outputDir, filename)
      fs.writeFileSync(filePath, JSON.stringify(cleanedNode, null, 2), 'utf-8')

      const isNew = !baselineSet.has(normKey(node.Description))
      if (isNew) newlyDiscovered.push(node.Description)

      const suffix = isNew ? chalk.cyan(' - New') : ''
      console.log(chalk.green(`✅ Saved: ${filename}`) + suffix)
    }

    console.log(chalk.blue(`📁 Total saved: ${matchingNodes.length}`))

    // 3) Sync & sort baseline (A→Z)
    if (newlyDiscovered.length > 0) {
      for (const name of newlyDiscovered) {
        const key = normKey(name)
        if (!baselineSet.has(key)) {
          baselineArray.push(name)            // preserve original casing
          baselineSet.add(key)
        }
      }

      // sort case-insensitively, keep original casing
      baselineArray.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))

      const toWrite = baselineIsObject ? { Wools: baselineArray } : baselineArray

      try {
        const tmp = baselinePath + '.tmp'
        fs.writeFileSync(tmp, JSON.stringify(toWrite, null, 2))
        fs.renameSync(tmp, baselinePath)
        console.log(
          chalk.magenta(
            `🔄 Updated L1_category_list.json with ${newlyDiscovered.length} new categor${newlyDiscovered.length > 1 ? 'ies' : 'y'}:`
          ),
          newlyDiscovered.map(n => `"${n}"`).join(', ')
        )
      } catch (e) {
        console.error(chalk.red('❌ Failed to update/sort L1_category_list.json:'), e.message)
      }
    } else {
      console.log(chalk.gray('✓ No new top-level categories to sync into L1_category_list'))
    }
  } catch (err) {
    console.error(chalk.red(`❌ Error: ${err.message}`))
  }
}

processCategoryTree()
