// File: 01_ingestions/engine/coles/fetch_all_tree.js

import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

import safeNavigate from '../../../11_tools/coles/utils/safe_navigate.js'
import { build_id } from '../../../07_configs/coles/bid.js'
import { coles_url } from '../../../07_configs/coles/source_endpoints.js'

puppeteer.use(StealthPlugin())

// helper to turn "Baby & Kids" → "Baby-Kids.json"
function sanitizeFilename(name) {
  return name
    .replace(/[^\w\s-]/g, '')    // strip invalid chars
    .trim()
    .replace(/\s+/g, '-')        // spaces → dashes
    .replace(/-+/g, '-')         // collapse multiple dashes
}

// normalization key used for comparisons (aligns with filename rules)
function normKey(name) {
  return sanitizeFilename(name || '').toLowerCase()
}

function transformNode(node) {
  const transformed = {
    id: node.id?.toString() || '',
    level: node.level ?? null,
    originalName: node.originalName || node.name || '',
    seoToken: node.seoToken || '',
    subType: node.subType || ''
  }

  if (Array.isArray(node.catalogGroupView) && node.catalogGroupView.length > 0) {
    transformed.catalogGroupView = node.catalogGroupView.map(transformNode)
  }

  return transformed
}

async function detectAndAwaitCaptcha(page) {
  const selector = 'iframe[src*="recaptcha"], .h-captcha, .g-recaptcha'
  if (await page.$(selector)) {
    console.log(chalk.yellow('⚠️ CAPTCHA detected, waiting for solve…'))
    try {
      await page.waitForSelector(selector, { hidden: true, timeout: 300_000 })
    } catch {
      console.warn(chalk.red('❌ CAPTCHA still present after timeout; proceeding anyway'))
    }
  }
}

const m_coles_all_tree = {
  browser: null,
  CATEGORY_URL: `${coles_url}/_next/data/${build_id}/en/browse.json`,

  start: async function() {
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
      args: ['--no-sandbox','--disable-setuid-sandbox']
    })
    const page = await this.browser.newPage()

    // 1. Navigate & CAPTCHA
    await page.goto(coles_url, { waitUntil: 'domcontentloaded' })
    await safeNavigate(page, coles_url)
    await detectAndAwaitCaptcha(page)

    // 2. Fetch the category-tree JSON
    let json
    try {
      json = await page.evaluate(async url => {
        const res = await fetch(url, {
          credentials: 'include',
          headers: { 'User-Agent': navigator.userAgent }
        })
        return await res.json()
      }, this.CATEGORY_URL)
    } catch (err) {
      console.error(chalk.red(`❌ Failed to fetch JSON: ${err.message}`))
      await this.browser.close()
      return
    }

    const view = json?.pageProps?.allProductCategories?.catalogGroupView
    if (!Array.isArray(view)) {
      console.error(chalk.red('❌ catalogGroupView is not an array'))
      await this.browser.close()
      return
    }

    // --- Load baseline L1 list to detect/append "New" categories ---
    const baselinePath = path.resolve('./07_configs/coles/lookups/L1_category_list.json')

    // We support two shapes:
    //   A) { "Coles": ["Baby", "Bakery", ...] }
    //   B) ["Baby", "Bakery", ...]
    let baselineIsObject = false
    let baselineArray = []
    let baselineSet = new Set()

    try {
      if (fs.existsSync(baselinePath)) {
        const raw = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'))
        if (Array.isArray(raw)) {
          baselineArray = raw.slice()
          baselineIsObject = false
        } else if (Array.isArray(raw?.Coles)) {
          baselineArray = raw.Coles.slice()
          baselineIsObject = true
        } else {
          console.warn(chalk.yellow('⚠️ L1_tree_list.json structure not recognized; defaulting to empty array'))
        }
        baselineSet = new Set(baselineArray.map(normKey))
      } else {
        console.warn(chalk.yellow(`⚠️ Baseline file not found at ${baselinePath}. A new one will be created.`))
      }
    } catch (e) {
      console.warn(chalk.yellow('⚠️ Could not read/parse L1_tree_list.json; proceeding with empty baseline.'), e.message)
    }

    // 3. For each top-level category, write a separate file
    const outputDir = path.resolve('./02_raw/coles/category_tree/all_level')
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    const newlyDiscovered = []   
    let savedCount = 0

    for (const parent of view) {
      if (!parent?.name) continue
      const safeName = sanitizeFilename(parent.name)
      const filePath = path.join(outputDir, safeName + '.json')

      const transformed = transformNode(parent)
      fs.writeFileSync(filePath, JSON.stringify(transformed, null, 2))
      savedCount++

      const isNew = !baselineSet.has(normKey(parent.name))
      if (isNew) newlyDiscovered.push(parent.name)

      const suffix = isNew ? chalk.cyan(' - New') : ''
      console.log(chalk.green(`✅ Saved ${safeName}.json`) + suffix)
    }

    // total line (like Woolies)
    console.log(chalk.blue(`📁 Total saved: ${savedCount}`))

    // 4. Sync baseline file by appending newly discovered categories (sorted A→Z)
    if (newlyDiscovered.length > 0) {
      for (const name of newlyDiscovered) {
        const key = normKey(name)
        if (!baselineSet.has(key)) {
          baselineArray.push(name)   
          baselineSet.add(key)
        }
      }

      // SORT A→Z, case-insensitive, keep original casing
      baselineArray.sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' }))

      // Write back keeping original shape
      const toWrite = baselineIsObject ? { Coles: baselineArray } : baselineArray

      try {
        // Write atomically: to temp file then rename
        const tmpPath = baselinePath + '.tmp'
        fs.writeFileSync(tmpPath, JSON.stringify(toWrite, null, 2))
        fs.renameSync(tmpPath, baselinePath)
        console.log(
          chalk.magenta(`🔄 Updated L1_category_list.json with ${newlyDiscovered.length} new categor${newlyDiscovered.length > 1 ? 'ies' : 'y'}:`),
          newlyDiscovered.map(n => `"${n}"`).join(', ')
        )
      } catch (e) {
        console.error(chalk.red('❌ Failed to update L1_category_list.json:'), e.message)
      }
    } else {
      console.log(chalk.gray('✓ No new top-level categories to sync into L1_category_list.json'))
    }

    await this.browser.close()
  }
}

export default m_coles_all_tree

// kick it off
m_coles_all_tree.start().catch(err => console.error('🚨 Script error:', err))
