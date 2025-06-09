import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();
puppeteer.use(StealthPlugin());

// Helper function to replace waitForTimeout
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: './woolworths-session',
    defaultViewport: null,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });

  const page = await browser.newPage();
  await page.goto('https://www.woolworths.com.au/', { waitUntil: 'networkidle2' });
  
  // Replace waitForTimeout with delay function
  await delay(3000); // let everything load

  // ✅ 1. Click the account icon manually (the SVG icon container)
  await page.waitForSelector('.wx-header__icon.signIn', { timeout: 15000 });
  await page.click('.wx-header__icon.signIn');

  // ✅ 2. Wait for login form to appear
  await page.waitForSelector('input#username', { timeout: 15000 });
  await page.type('input#username', process.env.WOOLS_EMAIL, { delay: 80 });
  await page.type('input#password', process.env.WOOLS_PASS, { delay: 80 });

  // ✅ 3. Click login
  await page.click('button[type="submit"]');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });

  // ✅ 4. Set location
  await page.waitForSelector('[data-testid="changeLocationButton"]', { timeout: 15000 });
  await page.click('[data-testid="changeLocationButton"]');
  
  await page.waitForSelector('input[name="suburb"]', { timeout: 15000 });
  await page.type('input[name="suburb"]', 'Town Hall NSW 2000');
  
  await delay(3000); // Replace waitForTimeout
  
  await page.waitForSelector('.location-tile', { timeout: 10000 });
  await page.click('.location-tile');
  
  await delay(3000); // let backend confirm location

  // ✅ 5. Save cookies
  const cookies = await page.cookies();
  fs.writeFileSync('./woolworths/cookies.json', JSON.stringify(cookies, null, 2));
  
  console.log('✅ Cookies saved. You can now run index2.js');
  await browser.close();
})();