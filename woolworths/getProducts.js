import categories from './constant/categories.js';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import Product from './models/products.js';
import cleanUpPrices from './clean.js';
import dbConnect from './db/dbConnect.js';
import dotenv from 'dotenv';

dotenv.config();

const RESET   = '\x1b[0m';
const CYAN    = '\x1b[36m';
const GREEN   = '\x1b[32m';
const YELLOW  = '\x1b[33m';
const MAGENTA = '\x1b[35m';

const UNIQUE_PER_EXPORT = String(process.env.UNIQUE_PER_EXPORT || 'false').toLowerCase() === 'true';

function normalize(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function safeParseMaybeArray(v) {
  // Your fields look like arrays of JSON strings; handle mixed shapes safely.
  // Examples:
  //   ["\"Poultry, Meat & Seafood\""]  -> parse each -> ["Poultry, Meat & Seafood"]
  //   ["[\"A\",\"B\"]"]                -> parse each -> ["A","B"]
  //   ["\"A\"", "\"B\""]               -> ["A","B"]
  //   ["A","B"]                        -> as-is
  if (!Array.isArray(v)) return [];
  const out = [];
  for (const x of v) {
    try {
      const parsed = JSON.parse(x);
      if (Array.isArray(parsed)) out.push(...parsed);
      else out.push(parsed);
    } catch {
      // not JSON, keep as raw string
      out.push(String(x));
    }
  }
  return out;
}

async function getData() {
  console.log(`${CYAN}Start cleaning${RESET}`);
  // await cleanUpPrices();
  console.log(`${CYAN}End cleaning${RESET}\n`);

  await dbConnect();

  // Authoritative DB total (distinct documents)
  const dbTotal = await Product.countDocuments({});
  console.log(`${MAGENTA}📦 MongoDB products collection total: ${dbTotal}${RESET}\n`);

  // Fetch all docs once (14k is fine in memory; for huge sets, switch to paged scan)
  const allProducts = await Product.find().sort({ _id: 1 }).lean().exec();
  console.log(`${CYAN}🔄 Fetched ${allProducts.length} total products from DB${RESET}\n`);

  // Global sets for honesty
  const seenGlobalIds = new Set();            // distinct Mongo _id used anywhere
  const seenGlobalSourceIds = new Set();      // optional diagnostic
  let entriesAcrossFiles = 0;                 // what you previously called "Grand Total Saved"

  const summary = [];

  for (const categ of categories) {
    const category     = categ.category;
    const defaultCatId = categ.id;

    for (const sub of categ.subCategories) {
      const subCategory = sub.subCategory;

      for (const ext of sub.childItems) {
        const extensionCategory = ext.extensionCategory || '';
        const finalCatId        = ext.catId || defaultCatId;
        const subId             = ext.subId   || '';
        const childId           = ext.childId || '';

        // Filter in-memory with normalized comparisons
        const filtered = allProducts.filter(product => {
          const cats = safeParseMaybeArray(product.category);
          const subs = safeParseMaybeArray(product.subCategory);
          const exts = safeParseMaybeArray(product.extensionCategory);
          if (!cats.some(c => normalize(c) === normalize(category))) return false;
          if (!subs.some(s => normalize(s) === normalize(subCategory))) return false;
          if (!exts.some(e => normalize(e) === normalize(extensionCategory))) return false;
          return true;
        });

        console.log(`${CYAN}🔍 ${category} > ${subCategory} > ${extensionCategory}: found ${filtered.length}${RESET}`);

        if (filtered.length === 0) continue;

        // Map to output format; allow "first match wins" if UNIQUE_PER_EXPORT
        const productsData = [];
        for (const product of filtered) {
          const validPrices = (product.prices || [])
            .filter(p => p && p.price != null)
            .map(({ _id, ...rest }) => rest);

          const sourceIdRaw = product.retailer_product_id ?? null;
          const source_id   = sourceIdRaw == null ? null : String(sourceIdRaw);

          // If we want each Mongo doc only once in the whole export:
          if (UNIQUE_PER_EXPORT && seenGlobalIds.has(String(product._id))) {
            continue; // skip placing this product into another file
          }

          productsData.push({
            _id:               String(product._id),           // keep for global dedupe
            source_url:        product.source_url || null,
            name:              product.name || null,
            image_url:         product.image_url || null,
            source_id,                                          
            barcode:           product.barcode || '',
            category_id:       finalCatId,
            subcategory_id:    subId,
            subsubcategory_id: childId,
            shop:              product.shop || null,
            weight:            product.weight ?? null,
            prices:            validPrices,
          });
        }

        if (!productsData.length) continue;

        // Prepare folder & file
        const baseFolder = `./woolworths/data/${process.env.FOLDER_DATE}/${finalCatId}`;
        if (!fs.existsSync(baseFolder)) {
          fs.mkdirSync(baseFolder, { recursive: true });
          console.log(`${GREEN}📁 Created folder:${RESET} ${baseFolder}`);
        }
        const fileName = `${subId}${childId ? ` - ${childId}` : ''}.json`;
        const filePath = path.join(baseFolder, fileName);

        // Merge with existing contents (optional). Your current logic merges every time,
        // which makes the per-file length a "cumulative" figure. Keep it for compatibility.
        let combined = productsData;
        if (fs.existsSync(filePath)) {
          const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          combined = [...existing, ...productsData];
          console.log(`${YELLOW}📦 File exists:${RESET} ${filePath}. Merging and deduplicating...`);
        } else {
          console.log(`${GREEN}✅ Writing new file:${RESET} ${filePath}`);
        }

        // Dedupe inside THIS FILE by stable key; prefer Mongo _id + shop + cat ids.
        const seenFile = new Set();
        const uniqueData = [];
        for (const item of combined) {
          const key = [
            item._id || '',             // fall back to source_id if needed
            item.shop || '',
            item.category_id || '',
            item.subcategory_id || '',
            item.subsubcategory_id || ''
          ].join('|');

          if (!seenFile.has(key)) {
            seenFile.add(key);
            uniqueData.push(item);
          }
        }

        // Update global counters AFTER dedupe-per-file
        fs.writeFileSync(filePath, JSON.stringify(uniqueData, null, 2));

        // Count entries the way your old script did (sum of file sizes)
        entriesAcrossFiles += uniqueData.length;
        summary.push([`${category} > ${subCategory} > ${extensionCategory}`, uniqueData.length]);
        console.log(`${MAGENTA}📊 Saved ${uniqueData.length} items to ${fileName}${RESET}\n`);

        // Track global uniqueness by Mongo _id (independent of files)
        for (const item of uniqueData) {
          if (item._id) seenGlobalIds.add(item._id);
          if (item.source_id) seenGlobalSourceIds.add(item.source_id);
        }
      }
    }
  }

  // Final summaries
  console.log(`${CYAN}🧮 Final Summary of All Woolworths Categories:${RESET}`);
  summary.forEach(([label, count]) => {
    console.log(`${GREEN}- ${label}:${RESET} ${YELLOW}${count}${RESET}`);
  });

  console.log(`${MAGENTA}\n📦 Grand Total Entries Saved (across files): ${YELLOW}${entriesAcrossFiles}${RESET}`);
  console.log(`${MAGENTA}🆔 Grand Total UNIQUE Products (by _id): ${YELLOW}${seenGlobalIds.size}${RESET}`);
  console.log(`${MAGENTA}🧾 MongoDB countDocuments({}): ${YELLOW}${dbTotal}${RESET}`);

  // if (UNIQUE_PER_EXPORT) {
  //   console.log(`${CYAN}\nMode:${RESET} UNIQUE_PER_EXPORT=true → each document is written once (first matching file wins).`);
  // } else {
  //   console.log(`${YELLOW}\nNote:${RESET} Multiple-category products will appear in multiple files. The "Entries Saved" sum will exceed the number of MongoDB documents. Use UNIQUE_PER_EXPORT=true if you want 1:1 with DB.`);
  // }
}

(async () => {
  await getData().catch(err => {
    console.error('❌ Fatal:', err);
    process.exit(1);
  });
})();
