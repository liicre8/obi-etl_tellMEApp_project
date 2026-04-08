//File: 01_ingestion/source_api/coles/extract_level_1_categories.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const { colesBID } = require('../../configs/build/buildId');
const { colesURL } = require('../../configs/shared/storeURL');
// now points at your Level-1 block list
const Level1 = require('../../configs/shared/filtered/level-1.js');

const CATEGORY_URL = `${colesURL}/_next/data/${colesBID}/en/browse.json`;
const OUTPUT_PATH = path.resolve(__dirname, '../../configs/categories/coles/ParentCategory.js');

puppeteer.use(StealthPlugin());

const fetchColesParentCategories = async () => {
  try {
    console.log('🌐 Launching Puppeteer to initialize session...');

    const browser = await puppeteer.launch({
      headless: true,
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    });

    const page = await browser.newPage();

    // 🚫 Block non-essential resources for speed
    await page.setRequestInterception(true);
    page.on('request', (req) => {
      const type = req.resourceType();
      if (['image', 'stylesheet', 'font', 'media'].includes(type)) {
        req.abort();
      } else {
        req.continue();
      }
    });

    // ⏩ Faster load using domcontentloaded
    await page.goto(colesURL, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const cookies = await page.cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
    await browser.close();

    console.log('✅ Session initialized. Fetching browse.json with session cookies...');

    const response = await axios.get(CATEGORY_URL, {
      headers: {
        Cookie: cookieHeader,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      }
    });

    const catalogGroupView = response?.data?.pageProps?.allProductCategories?.catalogGroupView;

    if (!Array.isArray(catalogGroupView)) {
      console.error('❌ catalogGroupView not found or invalid in response.');
      return;
    }

    const blocked = Level1.Coles || [];
    const filteredParents = catalogGroupView
      .filter(cat => cat.originalName && !blocked.includes(cat.originalName))
      .map(cat => ({ name: cat.originalName, id: cat.id }));
    
    // Sort categories alphabetically by name (A to Z)
    filteredParents.sort((a, b) => a.name.localeCompare(b.name));

    const outputContent = `module.exports = ${JSON.stringify(filteredParents, null, 2)};\n`;
    fs.writeFileSync(OUTPUT_PATH, outputContent);

    console.log(`📁 Saved ${filteredParents.length} parent categories to: ${OUTPUT_PATH}`);
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
  }
};

fetchColesParentCategories();