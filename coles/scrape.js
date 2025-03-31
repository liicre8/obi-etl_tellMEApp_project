const puppeteer = require('puppeteer');
const axios = require('axios');

const SCRAPER_API_KEY = 'f0ab51d2e673344b1945ced4f6b543d0';
const targetUrl = 'https://www.coles.com.au/browse/bakery';

(async () => {
  // 1️⃣ Get the page HTML through ScraperAPI
  const { data: html } = await axios.get('http://api.scraperapi.com', {
    params: {
      api_key: SCRAPER_API_KEY,
      url: targetUrl,
      render: true // Optional if JS-heavy
    }
  });

  // 2️⃣ Load the HTML into Puppeteer (optional for DOM parsing)
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'domcontentloaded' });

  // 3️⃣ Scrape content
  const title = await page.title();
  console.log('Page Title:', title);

  await browser.close();
})();
