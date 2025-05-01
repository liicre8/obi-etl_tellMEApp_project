// transform.mjs
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

const fileNames = ["colesUnMatched.json", "woolworthsUnMatched.json"];

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

function transformProducts(products) {
  const seen = new Set();
  const result = [];
  const removedDuplicates = [];

  for (const product of products) {
    const cleaned = cleanProduct(product);
    if (!cleaned) continue;

    // Use barcode only (or add name for stricter matching)
    const key = cleaned.barcode;

    if (!seen.has(key)) {
      seen.add(key);
      result.push(cleaned);
    } else {
      removedDuplicates.push(cleaned);
    }
  }

  if (removedDuplicates.length > 0) {
    console.log(`⚠️  Removed ${removedDuplicates.length} duplicate products`);
    // Optional: Save duplicates to a file
    // const duplicatesPath = path.join(__dirname, 'UnMatchedAll', folderDate, 'duplicates.json');
    // await fs.writeFile(duplicatesPath, JSON.stringify(removedDuplicates, null, 2));
  }

  return result;
}

async function processFile(fileName) {
  const filePath = path.join(__dirname, 'UnMatchedAll', folderDate, fileName);

  try {
    const rawData = await await fs.readFile(filePath, 'utf8');
    const products = JSON.parse(rawData);

    const needsTransformation = products.some(product => product.hasOwnProperty('subsubcategory_id'));

    if (!needsTransformation) {
      console.log(`⏩ ${fileName}: File is already transformed. Skipping...`);
      return 0;
    }

    const cleanedProducts = transformProducts(products);

    await fs.writeFile(filePath, JSON.stringify(cleanedProducts, null, 2));

    console.log(`✅ ${fileName} transformed successfully!`);
    console.log(`File: ${filePath}`);
    console.log(`Count: ${cleanedProducts.length} objects transformed to API format\n`);

    return cleanedProducts.length;
  } catch (error) {
    console.error(`❌ Error processing ${fileName}:`, error);
    return 0;
  }
}

(async () => {
  for (const fileName of fileNames) {
    const count = await processFile(fileName);
    console.log(`File "${fileName}" count: ${count} objects\n`);
  }
})();

// transform.mjs
// import dotenv from 'dotenv';
// dotenv.config();

// import fs from 'fs/promises';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const folderDate = process.env.FOLDER_DATE;
// if (!folderDate) {
//   console.error('❌ FOLDER_DATE is not defined in .env');
//   process.exit(1);
// }

// const fileNames = ["colesUnMatched.json", "woolworthsUnMatched.json"];
// function cleanProduct(product) {

//   const cat = product.subsubcategory_id ? product.subsubcategory_id : product.subcategory_id
//   if (!product.image_url || !product.barcode || product.barcode === "" || cat === "") {
//     return null;
//   }

//   let filteredPrices = (product.prices || []).filter(priceObj =>
//     priceObj.price !== null && priceObj.price !== ''
//   );

//   const uniquePricesMap = new Map();
//   filteredPrices.forEach((priceObj) => {
//     if (!uniquePricesMap.has(priceObj.state)) {
//       uniquePricesMap.set(priceObj.state, priceObj);
//     }
//   });
//   const uniquePrices = Array.from(uniquePricesMap.values());

//   if (uniquePrices.length === 0) {
//     return null;
//   }

//   return {
//     source_url: product.source_url || '',
//     name: product.name || '',
//     image_url: product.image_url || '',
//     source_id: product.source_id || '',
//     barcode: product.barcode || '',
//     shop: product.shop || '',
//     category_id: product.subsubcategory_id ? product.subsubcategory_id : product.subcategory_id,
//     weight: product.weight || '',
//     prices: uniquePrices,
//   };
// }
// function transformProducts(products) {
//   return products.reduce((acc, product) => {
//     const cleaned = cleanProduct(product);
//     if (cleaned) {
//       acc.push(cleaned);
//     }
//     return acc;
//   }, []);
// }

// async function processFile(fileName) {
//   const filePath = path.join(__dirname, 'UnMatchedAll', folderDate, fileName);

//   try {
//     const rawData = await fs.readFile(filePath, 'utf8');
//     const products = JSON.parse(rawData);

//     // ✅ Only proceed if subsubcategory_id is present
//     const needsTransformation = products.some(product => product.hasOwnProperty('subsubcategory_id'));

//     if (!needsTransformation) {
//       console.log(`⏩ ${fileName}: File is already transformed. Skipping...`);
//       return 0;
//     }

//     const cleanedProducts = transformProducts(products);

//     await fs.writeFile(filePath, JSON.stringify(cleanedProducts, null, 2));

//     console.log(`✅ ${fileName} transformed successfully!`);
//     console.log(`File: ${filePath}`);
//     console.log(`Count: ${cleanedProducts.length} objects transformed to API format\n`);

//     return cleanedProducts.length;
//   } catch (error) {
//     console.error(`❌ Error processing ${fileName}:`, error);
//     return 0;
//   }
// }

// (async () => {
//   for (const fileName of fileNames) {
//     const count = await processFile(fileName);
//     console.log(`File "${fileName}" count: ${count} objects`);
//   }
// })();

