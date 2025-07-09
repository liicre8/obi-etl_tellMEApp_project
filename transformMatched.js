import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const folderDate = process.env.FOLDER_DATE;
if (!folderDate) {
  console.error('❌ FOLDER_DATE is not defined in .env');
  process.exit(1);
}

function cleanProduct(product) {
  const cat = product.subsubcategory_id ? product.subsubcategory_id : product.subcategory_id;
  if (!product.image_url || !product.barcode || product.barcode === "" || cat === "") {
    return null;
  }

  const filteredPrices = (product.prices || []).filter(priceObj =>
    priceObj.price !== null && priceObj.price !== ''
  );

  const uniquePricesMap = new Map();
  filteredPrices.forEach((priceObj) => {
    if (!uniquePricesMap.has(priceObj.state)) {
      uniquePricesMap.set(priceObj.state, priceObj);
    }
  });
  const uniquePrices = Array.from(uniquePricesMap.values());

  if (uniquePrices.length === 0) {
    return null;
  }

  return {
    source_url: product.source_url || '',
    name: product.name || '',
    image_url: product.image_url || '',
    source_id: product.source_id || '',
    barcode: product.barcode || '',
    shop: product.shop || '',
    category_id: cat,
    weight: product.weight || '',
    prices: uniquePrices,
  };
}

// now returns BOTH result and removed
function transformProducts(products) {
  const seen = new Set();
  const result = [];
  const removed = [];

  for (const product of products) {
    const cleaned = cleanProduct(product);
    if (!cleaned) continue;

    const key = cleaned.source_id;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    } else {
      removed.push(cleaned);
    }
  }

  return { result, removed };
}

async function cleanMatchedSubfolders(matchedDir) {
  const entries = await fs.readdir(matchedDir, { withFileTypes: true });

  for (const entry of entries) {
    const subPath = path.join(matchedDir, entry.name);

    if (entry.isDirectory()) {
      const files = await fs.readdir(subPath);

      for (const file of files) {
        if (file.endsWith('.json')) {
          const fullPath = path.join(subPath, file);
          try {
           const raw = await fs.readFile(fullPath, 'utf8');
           let data;

           try {
             data = JSON.parse(raw);
           } catch (e) {
             console.error(`⚠️ Skipping invalid JSON: ${fullPath}`);
             await fs.unlink(fullPath);
             console.log(`🗑️ Deleted invalid JSON file: ${fullPath}`);
             continue;
           }
           
           if (!Array.isArray(data)) {
             console.warn(`⚠️ Skipping non-array JSON: ${fullPath}`);
             await fs.unlink(fullPath);
             console.log(`🗑️ Deleted non-array JSON file: ${fullPath}`);
             continue;
           }

            const { result: deduped, removed } = transformProducts(data);

            // 🧾 Log removed duplicates
            if (removed.length > 0) {
              console.log(`⚠️  Removed ${removed.length} duplicate(s) in ${file}:`);
              removed.forEach(p => {
                console.log(`   ❌ source_id: ${p.source_id}, name: "${p.name}"`);
              });
            }

            if (deduped.length > 0) {
              await fs.writeFile(fullPath, JSON.stringify(deduped, null, 2));
              console.log(`✅ Cleaned: ${fullPath} (${deduped.length} remaining)`);
            } else {
              await fs.unlink(fullPath);
              console.log(`🗑️ Deleted empty file: ${fullPath}`);
            }
          } catch (err) {
            console.error(`⚠️ Error in ${file} (${entry.name}): ${err.message}`);
          }
        }
      }
    }
  }
}

(async () => {
  const matchedDir = path.join(__dirname, 'matched', folderDate);
  await cleanMatchedSubfolders(matchedDir);
})();
