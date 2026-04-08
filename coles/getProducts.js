// File: cole.getProduct.js
import categories from './constant/getProducts.js';
import fs from 'fs';
import path from 'path';
import Product from './models/products.js';
import dbConnect from './db/dbConnect.js';
import dotenv from 'dotenv';

dotenv.config();

const RESET   = '\x1b[0m';
const CYAN    = '\x1b[36m';
const GREEN   = '\x1b[32m';
const YELLOW  = '\x1b[33m';
const MAGENTA = '\x1b[35m';

const getData = async () => {
  await dbConnect();
  let data  = [];
  let total = 0;

  for (const categ of categories) {
    // Normalize category name
    let category = categ.category;
    if (category === 'Chips, Chocolates & Snacks') category = 'Pantry';
    const defaultCatId = categ.id;

    // Fetch with case-insensitive matching and stable order
    const products = await Product
      .find({ category: new RegExp(`^${category}$`, 'i') })
      .sort({ _id: 1 })
      .exec();

    console.log(`${CYAN}🔄 Fetched ${products.length} products for category "${category}"${RESET}`);

    const productsData = products
      .map(product => {
        const obj = product.toObject();

        // Skip if no prices or missing image
        if (!obj.prices.length || obj.image_url === 'N/A') return null;

        // Filter out null prices
        const validPrices = obj.prices
          .filter(p => p.price != null)
          .map(({ _id, ...rest }) => rest);

        if (!validPrices.length) return null;

        // Determine final category IDs
        let subId         = '';
        let childId       = '';
        let finalCategory = defaultCatId;
        const matchCat = categories.find(cat => cat.category === categ.category);

        if (matchCat) {
          const sub = matchCat.subCategories.find(s => s.subCategory === obj.subCategory);
          if (sub) {
            const child = sub.childItems.find(i => i.extensionCategory === obj.extensionCategory);
            if (child) {
              subId   = child.subId    || '';
              childId = child.childId  || '';
              finalCategory = child.catId || defaultCatId;
            }
          }
        } else {
          console.warn(`⚠️ Category "${category}" not found in getProducts.js`);
        }

        return {
          source_url:       obj.source_url || null,
          name:             obj.name       || null,
          image_url:        obj.image_url  || null,
          source_id:        obj.coles_product_id || null,
          barcode:          obj.barcode    || '',
          category_id:      finalCategory  || '',
          subcategory_id:   subId          || '',
          subsubcategory_id: childId       || '',
          shop:             obj.shop       || null,
          weight:           obj.weight     || '',
          prices:           validPrices,
        };
      })
      .filter(Boolean);

    if (!productsData.length) continue;

    // Prepare output folder & file
    const baseFolder = `./coles/data/${process.env.FOLDER_DATE}`;
    const folderPath = path.join(baseFolder);
    const filePath   = path.join(folderPath, `${category}.json`);

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`📁 Created folder: ${folderPath}`);
    }

    try {
      let uniqueProducts = [];

      if (fs.existsSync(filePath)) {
        console.log(`📦 File already exists: ${filePath}. Merging...`);
        const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const combined = [...existing, ...productsData];

        // Deduplicate
        uniqueProducts = combined.reduce((acc, item) => {
          const exists = acc.some(t =>
            t.source_id === item.source_id &&
            t.shop      === item.shop      &&
            t.category_id === item.category_id &&
            (t.subcategory_id === item.subcategory_id || (!t.subcategory_id && !item.subcategory_id)) &&
            (t.subsubcategory_id === item.subsubcategory_id || (!t.subsubcategory_id && !item.subsubcategory_id))
          );
          if (!exists) acc.push(item);
          return acc;
        }, []);
      } else {
        // First-time write: just dedupe the batch
        uniqueProducts = productsData.reduce((acc, item) => {
          const exists = acc.some(t =>
            t.source_id === item.source_id &&
            t.shop      === item.shop      &&
            t.category_id === item.category_id &&
            (t.subcategory_id === item.subcategory_id || (!t.subcategory_id && !item.subcategory_id)) &&
            (t.subsubcategory_id === item.subsubcategory_id || (!t.subsubcategory_id && !item.subsubcategory_id))
          );
          if (!exists) acc.push(item);
          return acc;
        }, []);
        console.log(`✅ Data saved to ${filePath}`);
      }

      total += uniqueProducts.length;
      fs.writeFileSync(filePath, JSON.stringify(uniqueProducts, null, 2));
      console.log(`📊 Total products for "${category}":`, uniqueProducts.length);
      data.push([category, uniqueProducts.length]);

    } catch (err) {
      console.error('❌ Error writing data to file:', err);
    }
  }

  // Summary
  console.log(`${CYAN}\n🧮 Final Summary of All Categories:${RESET}`);
  data.forEach(([cat, count]) => {
    console.log(`${GREEN}- ${cat}:${RESET} ${YELLOW}${count}${RESET}`);
  });

  const grandTotal = data.reduce((sum, [, count]) => sum + count, 0);
  const mongoCount = await Product.countDocuments({});

  console.log(`${MAGENTA}\n📦 Grand Total Products Across All Categories: ${YELLOW}${grandTotal}${RESET}`);
  console.log(`${MAGENTA}🧾 MongoDB countDocuments({}): ${YELLOW}${mongoCount}${RESET}`);
};

(async () => {
  await getData();
})();
