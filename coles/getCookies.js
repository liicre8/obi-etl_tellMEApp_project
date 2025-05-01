
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fs from 'fs';
puppeteer.use(StealthPlugin());

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const captcha = async (page, url) => {
  let i = 1;
  const maxTries = 20;
  try {
    while (i <= maxTries) {
      console.log(`🔎 Checking for CAPTCHA... (${i})`);
      await delay(5000);
      const captchaStillThere = await page.evaluate(() => {
        return !!document.querySelector('iframe[src*="_Incapsula_Resource"]');
      });

      if (!captchaStillThere) {
        console.log('✅ CAPTCHA solved! Proceeding...');
        break;
      }

      console.log('🛑 CAPTCHA still detected, waiting for manual solve...');
      i++;
    }

    if (i > maxTries) {
      console.warn('⚠️ Max wait reached. Proceeding anyway (captcha may still be there).');
    }

    return true;
  } catch (error) {
    console.error('❌ Error while waiting for CAPTCHA:', error);
    return false;
  }
};

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.1.2 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.43',
  'Mozilla/5.0 (Linux; Android 11; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Android 11; Mobile; rv:109.0) Gecko/20100101 Firefox/109.0',
  'Mozilla/5.0 (Linux; Android 11; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 OPR/68.0.2254.63568',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
];

puppeteer.use(StealthPlugin());

(async () => {
  while (true) {
    const browser = await puppeteer.launch({
      headless: false,
      args: [
        `--proxy-server=http=api.scraperapi.com:8001`,
        // `--proxy-server=socks5://127.0.0.1:9050`
      ],
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      userDataDir: 'C:\\Users\\OBI - Wilslie\\AppData\\Local\\Google\\Chrome\\User Data\\Person 1',
    });
    let page;
    while (true) {
      await delay(10000);
      page = (await browser.newPage()).removeAllListeners('request');
      const SCRAPER_API_KEY = '0e6c546a09c1e1d91e23cc4683a91174';

      await page.authenticate({
        username: SCRAPER_API_KEY,
        password: ''
      });

      const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
      await page.setUserAgent(randomUserAgent);
      await page.setExtraHTTPHeaders({
        Referer: 'https://www.coles.com.au/',
      });

      await page.goto('https://www.coles.com.au/');
      const client = await page.target().createCDPSession();
      await client.send('Storage.clearDataForOrigin', {
        origin: 'https://www.coles.com.au/',
        storageTypes: 'all'
      });

      await captcha(page, 'https://www.coles.com.au/');

      await page.goto('https://www.coles.com.au/browse/');
      await delay(15000);
      await page.goto('https://www.coles.com.au/browse/fruit-vegetables/vegetables/');
      await delay(10000);
      await page.reload();

      const cookiesCraft = await page.cookies();
      fs.writeFileSync('./coles/colesCookies.json', JSON.stringify(cookiesCraft, null, 2));
      console.log('✅ Extracted Cookies successfully.');

      await page.close();
      await delay(15000);
    }
  }
})();
