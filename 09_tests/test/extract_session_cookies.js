//File: 01_ingestion/source_api/coles/extract_session_cookies.js
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();
puppeteer.use(StealthPlugin());

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const captcha = async (page) => {
  let i = 1;
  try {
    while (true) {
      console.log(`🔎 Checking for CAPTCHA... (attempt ${i})`);
      await delay(5000);

      const captchaStillThere = await page.evaluate(() =>
        !!document.querySelector('iframe[src*="_Incapsula_Resource"]') ||
        !!document.querySelector('iframe[src*="captcha"]')
      );

      if (!captchaStillThere) {
        console.log('✅ CAPTCHA solved! Proceeding...');
        break;
      }

      console.log('🛑 CAPTCHA still detected, waiting for manual solve...');
      i++;
    }

    return true;
  } catch (error) {
    console.error('❌ Error while waiting for CAPTCHA:', error);
    return false;
  }
};

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0',
];

(async () => {
  const SCRAPER_API_KEY = process.env.SCRAPER_API_KEY;
  const chromeProfilePath = process.env.CHROME_PATH || 'C:\\Users\\HP\\AppData\\Local\\Google\\Chrome\\User Data\\Person 1';

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: chromeProfilePath,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      `--proxy-server=http=api.scraperapi.com:8001`,
    ]
  });

  const page = await browser.newPage();

  if (SCRAPER_API_KEY) {
    await page.authenticate({ username: SCRAPER_API_KEY, password: '' });
  }

  const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  await page.setUserAgent(randomUserAgent);
  await page.setExtraHTTPHeaders({ Referer: 'https://www.coles.com.au/' });

  console.log("🏠 Navigating to homepage...");
  await page.goto('https://www.coles.com.au/', { waitUntil: 'domcontentloaded' });

  // Check if CAPTCHA is present
  let captchaDetected = await page.evaluate(() =>
    !!document.querySelector('iframe[src*="_Incapsula_Resource"]') ||
    !!document.querySelector('iframe[src*="captcha"]')
  );

  if (!captchaDetected) {
    console.log("🔄 No CAPTCHA detected initially. Opening secondary tab to try and trigger it...");

    const verifyTab = await browser.newPage();
    await verifyTab.setUserAgent(randomUserAgent);
    await verifyTab.setExtraHTTPHeaders({ Referer: 'https://www.coles.com.au/' });

    await verifyTab.goto('https://www.coles.com.au/browse', { waitUntil: 'domcontentloaded' });
    await captcha(verifyTab);
    await verifyTab.close();
  } else {
    console.log("🧩 CAPTCHA detected immediately.");
    await captcha(page);
  }

  // Simulate natural user browsing
  console.log("🛒 Navigating to /browse...");
  await page.goto('https://www.coles.com.au/browse/', { waitUntil: 'networkidle2' });
  await delay(8000);

  try {
    console.log("🥦 Navigating to vegetables category...");
    await page.goto('https://www.coles.com.au/browse/fruit-vegetables/vegetables/', { waitUntil: 'networkidle2' });
    await delay(5000);
    await page.reload({ waitUntil: 'networkidle2' });
    await delay(3000);
  } catch (err) {
    console.warn('⚠️ Failed to navigate to vegetables page:', err.message);
  }

  // Save cookies
  const cookies = await page.cookies();
  const saveDir = path.resolve(__dirname, '../../../../data/cookies');
  const cookieFilePath = path.join(saveDir, 'colesCookies.js');

  if (!fs.existsSync(saveDir)) {
    fs.mkdirSync(saveDir, { recursive: true });
  }

  const cookieExportString = `module.exports = ${JSON.stringify(cookies, null, 2)};\n`;
  fs.writeFileSync(cookieFilePath, cookieExportString);

  console.log(`🍪 ✅ Extracted and saved cookies to ${cookieFilePath}`);

  await page.close();
  await browser.close();
})();
