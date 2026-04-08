// File: 01_ingestion/source_api/coles/fetch_build_id.js

import fs from 'fs';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

import { build_id as existingBuild_id } from '../../../07_configs/coles/bid.js';
import bid_tracks from '../../../07_configs/coles/bid_tracker.js';
import { coles_url } from '../../../07_configs/coles/source_endpoints.js';
import dayjs from '../../../11_tools/constant/day.js';

puppeteer.use(StealthPlugin());

const scrapeBuildId = async (url) => {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    userDataDir: process.env.CHROME_PATH,
  });

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const buildId = await page.evaluate(() => {
    const el = document.querySelector('#__NEXT_DATA__');
    if (!el) return null;
    try {
      const json = JSON.parse(el.textContent);
      return json.buildId || null;
    } catch (e) {
      return null;
    }
  });

  await browser.close();
  return buildId;
};

const run = async () => {
  const newBuild_id = await scrapeBuildId(coles_url);
  if (!newBuild_id) {
    console.error('❌ Failed to scrape build ID.');
    return;
  }

  console.log('🆕 Scraped Coles Build ID:', newBuild_id);

  if (newBuild_id === existingBuild_id) {
    console.log('✅ Build ID has not changed. No update necessary.');
    return;
  }

  const content = `export const build_id = '${newBuild_id}';\n`;
  fs.writeFileSync('07_configs/coles/bid.js', content);
  console.log('✅ bid.js updated.');

  const sydneyStamp = `${dayjs().tz('Australia/Sydney').format()} (SYD) - ${newBuild_id}`;
  bid_tracks.Coles.push(sydneyStamp);

  const trackerContent = `const bid_tracks = ${JSON.stringify(bid_tracks, null, 2)};\n\nexport default bid_tracks;\n`;
  fs.writeFileSync('07_configs/coles/bid_tracker.js', trackerContent);
  console.log('📌 bid_tracker.js updated.');
};

run().catch(console.error);
