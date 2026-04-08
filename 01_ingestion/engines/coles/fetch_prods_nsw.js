
// File: 01_ingestions/engine/coles/fetch_tree_nsw.js
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'
import _ from 'lodash'
import fs from 'fs'
import path from 'path'
import chalk from 'chalk'

import handleSteps from '../../11_tools/utils/steps.js'
import safeNavigate from '../../11_tools/utils/safe_navigate.js'
import { c_locations } from '../../../07_configs/constants/location.js'
import { build_id } from '../../07_configs/coles/bid.js'
import { coles_url } from '../../07_configs/coles/source_endpoints.js'

puppeteer.use(StealthPlugin())

const TARGET_STATE = 'nsw'

async function detectAndAwaitCaptcha(page) {
  const selector = 'iframe[src*=\"recaptcha\"], .h-captcha, .g-recaptcha'
  const hasCaptcha = await page.$(selector)
  if (hasCaptcha) {
    console.log(chalk.yellow('⚠️ CAPTCHA detected, waiting for solve...'))
    try {
      await page.waitForSelector(selector, { hidden: true, timeout: 300000 })
      console.log(chalk.green('✅ CAPTCHA solved, proceeding...'))
    } catch {
      console.warn(chalk.red('❌ CAPTCHA still present after timeout, proceeding anyway'))
    }
  }
}

const m_coles_tree = {
  browser: null,
  pageMap: new Map(),
  hierarchyCache: {},
  CATEGORY_URL: `${coles_url}/_next/data/${build_id}/en/browse.json`,

  sanitizeFilename: (name) =>
    name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'),

  start: async function () {
    this.browser = await puppeteer.launch({
      headless: false,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      userDataDir: process.env.CHROME_PATH,
      defaultViewport: null,
    })

    const locations = c_locations.filter(loc => loc.name === TARGET_STATE)
    for (const loc of locations) {
      const page = await this.browser.newPage()
      this.pageMap.set(loc.location, page)

      // Initial navigation & clear non-cookie storage
      await page.goto(coles_url, { waitUntil: 'domcontentloaded' })
      const client = await page.target().createCDPSession()
      await client.send('Storage.clearDataForOrigin', { origin: coles_url, storageTypes: 'local_storage,session_storage' })

      await safeNavigate(page, coles_url)
      await detectAndAwaitCaptcha(page)

      const initResult = await handleSteps(page, loc, coles_url)
      if (!initResult?.success) {
        console.warn(chalk.red(`❌ Failed to set location: ${loc.location}`))
        await page.close()
        this.pageMap.delete(loc.location)
        continue
      }
      console.log(chalk.green(`✅ Location set: ${loc.location}`))

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

    console.log(chalk.green('✅ NSW category trees done 🎯'))
    await this.browser.close()
  },

  fetchAndCompare: async function (loc) {
    const page = this.pageMap.get(loc.location)
    if (!page) return false
    await new Promise(res => setTimeout(res, 3000))

    try {
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

      for (const parent of view) {
        if (!parent?.id || !parent?.name) continue
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

m_coles_tree.start().catch(err => console.error('🚨 Failed to run m_coles_tree:', err))

// // File: 01_ingestions/engine/coles/fetch-tree-nsw.js
// import puppeteer from 'puppeteer-extra'
// import StealthPlugin from 'puppeteer-extra-plugin-stealth'
// import _ from 'lodash'
// import axios from 'axios'
// import fs from 'fs'
// import path from 'path'
// import chalk from 'chalk'

// import handleSteps from '../../../13_tools/utils/steps.js'
// import safeNavigate from '../../../13_tools/utils/safe-navigate.js'
// import { c_locations } from '../../../07_configs/constants/location.js'
// import { build_id } from '../../../07_configs/constants/coles-bid.js'
// import { coles_url } from '../../../07_configs/constants/source-endpoints.js'

// puppeteer.use(StealthPlugin())
// const TARGET_STATE = 'nsw'

// const m_coles_tree = {
//   browser: null,
//   pageMap: new Map(),
//   hierarchyCache: {},
//   CATEGORY_URL: `${coles_url}/_next/data/${build_id}/en/browse.json`,

//   sanitizeFilename: (name) =>
//     name.replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-'),

//   start: async function () {
//     this.browser = await puppeteer.launch({
//       headless: false,
//       executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
//       userDataDir: process.env.CHROME_PATH,
//       defaultViewport: null,
//     })

//     const pagePromises = c_locations
//       .filter(loc => loc.name === TARGET_STATE)
//       .map(async (loc) => {
//         const page = await this.browser.newPage()
//         this.pageMap.set(loc.location, page)

//         await safeNavigate(page, coles_url)
//         const result = await handleSteps(page, loc, coles_url)
//         if (!result?.success) {
//           console.warn(chalk.red(`❌ Failed to set location for: ${loc.location}`))
//           await page.close()
//           this.pageMap.delete(loc.location)
//           return
//         }

//         console.log(chalk.green(`✅ Location set for: ${loc.location}`))
//       })

//     await Promise.allSettled(pagePromises)
//     await this.fetchAndCompare()

//     console.log(chalk.green('🎯 NSW location processed.'))
//     await this.browser.close()
//   },

//   fetchAndCompare: async function () {
//     for (const loc of c_locations.filter(loc => loc.name === TARGET_STATE)) {
//       const page = this.pageMap.get(loc.location)
//       if (!page) continue
  
//       const cookies = await page.cookies()
//       const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ')
//       await page.close()
  
//       // Wait 5 seconds to let the site load after location set
//       await new Promise(resolve => setTimeout(resolve, 5000))
  
//       try {
//         const response = await axios.get(this.CATEGORY_URL, {
//           headers: {
//             Cookie: cookieHeader,
//             'User-Agent': 'Mozilla/5.0',
//           },
//         })
  
//         const data = response?.data?.pageProps
//         const storeId = data?.initStoreId
//         const view = data?.allProductCategories?.catalogGroupView
  
//         if (storeId !== loc.initStoreId || !Array.isArray(view)) {
//           console.warn(chalk.yellow(`⚠️ Store ID mismatch or no data for: ${loc.location}`))
//           continue
//         }

//         console.log(chalk.blue(`📦 Confirmed initStoreId from API: ${storeId} for ${loc.name.toUpperCase()}`))
  
//         // Wait 3 seconds before saving tree
//         await new Promise(resolve => setTimeout(resolve, 3000))
  
//         const cityName = loc.location.split(',')[0].trim()
//         const folder = path.resolve('./02_raw/coles/category_tree', cityName)
//         if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true })
  
//         for (const parent of view) {
//           if (!parent?.id || !parent?.name) continue
  
//           const filename = this.sanitizeFilename(parent.name)
//           const filePath = path.join(folder, `${filename}.json`)
//           const dataToSave = {
//             initStoreId: storeId, 
//             catalogGroupView: {
//               id: parent.id,
//               name: parent.name,
//               level: parent.level,
//               originalName: parent.originalName,
//               productCount: parent.productCount,
//               seoToken: parent.seoToken,
//               subType: parent.subType,
//               catalogGroupView: parent.catalogGroupView || [],
//             }
//           }
  
//           const previous = this.hierarchyCache[filePath]
//           if (!_.isEqual(previous, dataToSave)) {
//             fs.writeFileSync(filePath, JSON.stringify(dataToSave, null, 2))
//             this.hierarchyCache[filePath] = dataToSave
//             console.log(`📁 Updated: ${chalk.cyan(filename)} for ${chalk.magenta(cityName)}`)
//           }
//         }
//       } catch (err) {
//         console.error(chalk.red(`❌ Error fetching API for ${loc.location}: ${err.message}`))
//       }
//     }
//   },

// }

// export default m_coles_tree

// // 🔽 Invoke it here!
// m_coles_tree.start().catch((err) => {
//   console.error('🚨 Failed to run m_coles_tree:', err)
// })


