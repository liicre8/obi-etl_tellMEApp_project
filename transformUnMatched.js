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

  const cat = product.subsubcategory_id ? product.subsubcategory_id : product.subcategory_id
  if (!product.image_url || !product.barcode || product.barcode === "" || cat === "") {
    return null;
  }

  let filteredPrices = (product.prices || []).filter(priceObj =>
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
    category_id: product.subsubcategory_id ? product.subsubcategory_id : product.subcategory_id,
    weight: product.weight || '',
    prices: uniquePrices,
  };
}
function transformProducts(products) {
  return products.reduce((acc, product) => {
    const cleaned = cleanProduct(product);
    if (cleaned) {
      acc.push(cleaned);
    }
    return acc;
  }, []);
}

async function processFile(fileName) {
  const filePath = path.join(__dirname, 'UnMatchedAll', folderDate, fileName);

  try {
    const rawData = await fs.readFile(filePath, 'utf8');
    const products = JSON.parse(rawData);

    // ✅ Only proceed if subsubcategory_id is present
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
    console.log(`File "${fileName}" count: ${count} objects`);
  }
})();

// transform.mjs
// transform.mjs

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

// // Define source and target directories
// const sourceDir = path.join(__dirname, 'UnMatchedAll', folderDate);
// const baseTargetDir = path.join(__dirname, 'UMforUpload', folderDate);

// // Define store-specific file mapping
// const fileMapping = {
//   "colesUnMatched.json": "coles",
//   "woolworthsUnMatched.json": "Woolworths"
// };

// // Ensure the target folder structure exists
// async function ensureTargetFolders() {
//   try {
//     await fs.mkdir(baseTargetDir, { recursive: true });
//     for (const store of Object.values(fileMapping)) {
//       await fs.mkdir(path.join(baseTargetDir, store), { recursive: true });
//     }
//   } catch (error) {
//     console.error('❌ Failed to create output folders:', error);
//     process.exit(1);
//   }
// }

// function cleanProduct(product) {
//   const cat = product.subsubcategory_id || product.subcategory_id;
//   if (!product.image_url || !product.barcode || product.barcode === "" || !cat) {
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
//     category_id: cat,
//     weight: product.weight || '',
//     prices: uniquePrices,
//   };
// }

// function transformProducts(products) {
//   const categoryMap = {};

//   products.forEach(product => {
//     const cleaned = cleanProduct(product);
//     if (!cleaned) return;

//     const { category_id, barcode } = cleaned;
    
//     if (!categoryMap[category_id]) {
//       categoryMap[category_id] = new Map();
//     }

//     // ✅ Ensure unique barcodes in each category
//     if (!categoryMap[category_id].has(barcode)) {
//       categoryMap[category_id].set(barcode, cleaned);
//     }
//   });

//   // Convert Map objects back to arrays
//   for (const category in categoryMap) {
//     categoryMap[category] = Array.from(categoryMap[category].values());
//   }

//   return categoryMap;
// }

// async function processFile(fileName) {
//   const filePath = path.join(sourceDir, fileName);
//   const storeFolder = fileMapping[fileName];

//   if (!storeFolder) {
//     console.error(`❌ Unknown file: ${fileName}. Skipping...`);
//     return 0;
//   }

//   try {
//     const rawData = await fs.readFile(filePath, 'utf8');
//     const products = JSON.parse(rawData);

//     // ✅ Only proceed if subsubcategory_id is present
//     const needsTransformation = products.some(product => product.hasOwnProperty('subsubcategory_id'));
//     if (!needsTransformation) {
//       console.log(`⏩ ${fileName}: File is already transformed. Skipping...`);
//       return 0;
//     }

//     const transformedData = transformProducts(products);
//     const totalObjects = Object.values(transformedData).reduce((sum, arr) => sum + arr.length, 0);

//     // ✅ Write each category_id's data into its respective store folder
//     for (const [categoryId, items] of Object.entries(transformedData)) {
//       const categoryFilePath = path.join(baseTargetDir, storeFolder, `${categoryId}.json`);
//       await fs.writeFile(categoryFilePath, JSON.stringify(items, null, 2));
//       console.log(`✅ Saved ${items.length} unique barcode objects to ${categoryFilePath}`);
//     }

//     console.log(`✅ ${fileName} processed: ${totalObjects} unique barcode objects transformed and saved.\n`);
//     return totalObjects;
//   } catch (error) {
//     console.error(`❌ Error processing ${fileName}:`, error);
//     return 0;
//   }
// }

// (async () => {
//   await ensureTargetFolders();

//   for (const fileName of Object.keys(fileMapping)) {
//     const count = await processFile(fileName);
//     console.log(`File "${fileName}" count: ${count} unique objects`);
//   }
// })();
