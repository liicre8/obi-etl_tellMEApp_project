// File: 01_ingestions/engine/coles/fetch_prods_7oc.js
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

import handleSteps from '../../11_tools/utils/steps.js'
import safeNavigate from '../../11_tools/utils/safe_navigate.js'
import { c_locations } from '../../07_configs/coles/location.js'
import { build_id } from '../../07_configs/coles/bid.js'
import { coles_url } from '../../07_configs/coles/source_endpoints.js'

puppeteer.use(StealthPlugin())

const TARGET_STATES = ['act', 'nt', 'qld', 'sa', 'tas', 'vic', 'wa']
const CATEGORIES_TO_SAVE = ['Meat & Seafood', 'Fruit & Vegetables']

async function detectAndAwaitCaptcha(page) {
  // Look for common CAPTCHA indicators
  const selector = 'iframe[src*="recaptcha"], .h-captcha, .g-recaptcha'
  const hasCaptcha = await page.$(selector)
  if (hasCaptcha) {
    console.log(chalk.yellow('⚠️ CAPTCHA detected, waiting for solve...'))
    // Wait until CAPTCHA iframe or element is removed or hidden
    await page.waitForSelector(selector, { hidden: true, timeout: 300000 })
    console.log(chalk.green('✅ CAPTCHA solved, proceeding...'))
  }
}

const m_coles_tree = {
  browser: null,
  pageMap: new Map(),
  hierarchyCache: {},
  CATEGORY_URL: `${coles_url}/_next/data/${build_id}/en/browse.json`,

  sanitizeFilename: (name) =>
    name.replace(/[^^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'),

  start: async function () {
    this.browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      userDataDir: process.env.CHROME_PATH,
      defaultViewport: null,
    })

    const targetLocations = c_locations.filter(loc => TARGET_STATES.includes(loc.name))

    for (const loc of targetLocations) {
      const page = await this.browser.newPage()
      this.pageMap.set(loc.location, page)

      // Initial navigation & storage clearance (preserve cookies)
      await page.goto(coles_url, { waitUntil: 'domcontentloaded' })
      const client = await page.target().createCDPSession()
      await client.send('Storage.clearDataForOrigin', { origin: coles_url, storageTypes: 'local_storage,session_storage' })

      // Perform safe navigation
      await safeNavigate(page, coles_url)

      // Detect CAPTCHA and wait until solved
      await detectAndAwaitCaptcha(page)

      // Set location via handleSteps
      const initResult = await handleSteps(page, loc, coles_url)
      if (!initResult?.success) {
        console.warn(chalk.red(`❌ Failed to set location: ${loc.location}`))
        await page.close()
        this.pageMap.delete(loc.location)
        continue
      }
      console.log(chalk.green(`✅ Location set: ${loc.location}`))

      // Retry fetch up to 3 times
      let success = false
      for (let i = 1; i <= 3; i++) {
        success = await this.fetchAndCompare(loc)
        if (success) break
        console.warn(chalk.yellow(`⚠️ Fetch attempt ${i} failed for ${loc.location}`))
        await new Promise(res => setTimeout(res, 2000))
      }
      if (!success) console.error(chalk.red(`❌ Failed fetching data for ${loc.location} after retries`))

      await page.close()
      this.pageMap.delete(loc.location)
    }

    console.log(chalk.green('✅ All locations done 🎯'))
    await this.browser.close()
  },

  fetchAndCompare: async function (loc) {
    const page = this.pageMap.get(loc.location)
    if (!page) return false
    await new Promise(res => setTimeout(res, 3000))

    try {
      // Fetch in browser context to include cookies
      const json = await page.evaluate(async (url) => {
        const res = await fetch(url, { credentials: 'include', headers: { 'User-Agent': navigator.userAgent } })
        return res.json()
      }, this.CATEGORY_URL)

      const storeId = json?.pageProps?.initStoreId
      const view = json?.pageProps?.allProductCategories?.catalogGroupView
      if (storeId !== loc.initStoreId || !Array.isArray(view)) {
        console.warn(chalk.yellow(`⚠️ Mismatch for ${loc.location}: got ${storeId}, expected ${loc.initStoreId}`))
        return false
      }

      console.log(chalk.blue(`📦 Confirmed initStoreId ${storeId} for ${loc.name.toUpperCase()}`))
      const city = loc.location.split(',')[0].trim()
      const folder = path.resolve('./02_raw/coles/category_tree_loc', city)
      if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

      const filtered = view.filter(p => p?.name && CATEGORIES_TO_SAVE.includes(p.name))
      for (const parent of filtered) {
        const filename = this.sanitizeFilename(parent.name)
        const filePath = path.join(folder, `${filename}.json`)
        const dataToSave = { initStoreId: storeId, catalogGroupView: parent }
        const prev = this.hierarchyCache[filePath]
        if (!_.isEqual(prev, dataToSave)) {
          fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2))
          this.hierarchyCache[filePath] = dataToSave
          console.log(chalk.green(`📁 Saved ${filename} for ${city}`))
        }
      }
      return true
    } catch (err) {
      console.error(chalk.red(`❌ Error fetching API for ${loc.location}: ${err.message}`))
      return false
    }
  }
}

export default m_coles_tree

m_coles_tree.start().catch(err => console.error('🚨 Failed:', err))

// // File: 01_ingestions/engine/coles/fetch-tree-7oc.js
// import puppeteer from 'puppeteer-extra'
// import StealthPlugin from 'puppeteer-extra-plugin-stealth'
// import _ from 'lodash'
// import fs from 'fs'
// import path from 'path'
// import chalk from 'chalk'

// import handleSteps from '../../../13_tools/utils/steps.js'
// import safeNavigate from '../../../13_tools/utils/safe-navigate.js'
// import { c_locations } from '../../../07_configs/constants/location.js'
// import { build_id } from '../../../07_configs/constants/coles-bid.js'
// import { coles_url } from '../../../07_configs/constants/source-endpoints.js'

// puppeteer.use(StealthPlugin())

// const TARGET_STATES = ['act', 'nt', 'qld', 'sa', 'tas', 'vic', 'wa']
// const CATEGORIES_TO_SAVE = ['Meat & Seafood', 'Fruit & Vegetables']

// const m_coles_tree = {
//   browser: null,
//   pageMap: new Map(),
//   hierarchyCache: {},
//   CATEGORY_URL: `${coles_url}/_next/data/${build_id}/en/browse.json`,

//   sanitizeFilename: (name) =>
//     name.replace(/[^^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'),

//   start: async function () {
//     this.browser = await puppeteer.launch({
//       headless: false,
//       executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//       userDataDir: process.env.CHROME_PATH,
//       defaultViewport: null,
//     })

//     const targetLocations = c_locations.filter(loc => TARGET_STATES.includes(loc.name))

//     for (const loc of targetLocations) {
//       const page = await this.browser.newPage()
//       this.pageMap.set(loc.location, page)

//       // Clear storage except cookies
//       await page.goto(coles_url, { waitUntil: 'domcontentloaded' })
//       const client = await page.target().createCDPSession()
//       await client.send('Storage.clearDataForOrigin', { origin: coles_url, storageTypes: 'local_storage,session_storage' })

//       await safeNavigate(page, coles_url)
//       const initResult = await handleSteps(page, loc, coles_url)
//       if (!initResult?.success) {
//         console.warn(chalk.red(`❌ Failed to set location: ${loc.location}`))
//         await page.close()
//         this.pageMap.delete(loc.location)
//         continue
//       }
//       console.log(chalk.green(`✅ Location set: ${loc.location}`))

//       // Retry fetch up to 3 times
//       let success = false
//       for (let i = 1; i <= 3; i++) {
//         success = await this.fetchAndCompare(loc)
//         if (success) break
//         console.warn(chalk.yellow(`⚠️ Fetch attempt ${i} failed for ${loc.location}`))
//         await new Promise(res => setTimeout(res, 2000))
//       }
//       if (!success) console.error(chalk.red(`❌ Failed fetching data for ${loc.location} after retries`))

//       await page.close()
//       this.pageMap.delete(loc.location)
//     }

//     console.log(chalk.green('✅ All locations done 🎯'))
//     await this.browser.close()
//   },

//   fetchAndCompare: async function (loc) {
//     const page = this.pageMap.get(loc.location)
//     if (!page) return false
//     await new Promise(res => setTimeout(res, 3000))

//     try {
//       // Fetch in browser context to include cookies
//       const json = await page.evaluate(async (url) => {
//         const res = await fetch(url, { credentials: 'include', headers: { 'User-Agent': navigator.userAgent } })
//         return res.json()
//       }, this.CATEGORY_URL)

//       const storeId = json?.pageProps?.initStoreId
//       const view = json?.pageProps?.allProductCategories?.catalogGroupView
//       if (storeId !== loc.initStoreId || !Array.isArray(view)) {
//         console.warn(chalk.yellow(`⚠️ Mismatch for ${loc.location}: got ${storeId}, expected ${loc.initStoreId}`))
//         return false
//       }

//       console.log(chalk.blue(`📦 Confirmed initStoreId ${storeId} for ${loc.name.toUpperCase()}`))
//       const city = loc.location.split(',')[0].trim()
//       const folder = path.resolve('./02_raw/coles/category_tree', city)
//       if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })

//       const filtered = view.filter(p => p?.name && CATEGORIES_TO_SAVE.includes(p.name))
//       for (const parent of filtered) {
//         const filename = this.sanitizeFilename(parent.name)
//         const filePath = path.join(folder, `${filename}.json`)
//         const dataToSave = { initStoreId: storeId, catalogGroupView: parent }
//         const prev = this.hierarchyCache[filePath]
//         if (!_.isEqual(prev, dataToSave)) {
//           fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2))
//           this.hierarchyCache[filePath] = dataToSave
//           console.log(chalk.green(`📁 Saved ${filename} for ${city}`))
//         }
//       }
//       return true
//     } catch (err) {
//       console.error(chalk.red(`❌ Error fetching API for ${loc.location}: ${err.message}`))
//       return false
//     }
//   }
// }

// export default m_coles_tree

// m_coles_tree.start().catch(err => console.error('🚨 Failed:', err))
