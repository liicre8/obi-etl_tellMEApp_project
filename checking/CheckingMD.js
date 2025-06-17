//File: src/checking/CheckingMatchedData.js
const fs = require('fs');
const path = require('path');
const categories = require('../constant/categories');
require('dotenv').config();

// Config
const yesterdayDate = '6-16-2025';
const todayDate = process.env.FOLDER_DATE;


if (!todayDate) {
  console.error('❌ Error: FOLDER_DATE environment variable is not set.');
  process.exit(1);
}

// Current date for audit folder
const now = new Date();
const auditFolderName = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;
const basePath = path.join(__dirname, '..');
const auditOutputPath = path.join(basePath, 'audit', 'matched', auditFolderName);

if (!fs.existsSync(auditOutputPath)) {
  fs.mkdirSync(auditOutputPath, { recursive: true });
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function getFilePath(date, categoryId, fileName) {
  return path.join(basePath, 'matched', date, categoryId, fileName);
}

// Collect all changes across categories into one object
const auditData = {};

function compareAndAudit(category) {
  const categoryId = category.id;
  const yesterdayFolder = path.join(basePath, 'matched', yesterdayDate, categoryId);
  const todayFolder = path.join(basePath, 'matched', todayDate, categoryId);

  if (!fs.existsSync(yesterdayFolder) || !fs.existsSync(todayFolder)) {
    console.warn(`⚠️ Skipping ${category.name} (${categoryId}): folder missing`);
    return;
  }

  const files = fs.readdirSync(todayFolder).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    const todayData = readJSON(getFilePath(todayDate, categoryId, file));
    const yesterdayData = readJSON(getFilePath(yesterdayDate, categoryId, file));

    if (!todayData || !yesterdayData) return;

    const yesterdayByBarcode = {};
    Object.values(yesterdayData).forEach(product => {
      if (product.barcode) {
        yesterdayByBarcode[product.barcode] = product;
      }
    });

    Object.values(todayData).forEach(todayProduct => {
      const barcode = todayProduct.barcode;
      if (!barcode || !Array.isArray(todayProduct.prices)) return;

      const yesterdayProduct = yesterdayByBarcode[barcode];
      if (!yesterdayProduct || !Array.isArray(yesterdayProduct.prices)) return;

      const priceChanged = todayProduct.prices.some(todayPrice => {
        const yPrice = yesterdayProduct.prices.find(p => p.state === todayPrice.state);
        return (
          !yPrice ||
          todayPrice.price !== yPrice.price ||
          todayPrice.price_per_unit !== yPrice.price_per_unit
        );
      });

      if (priceChanged) {
        auditData[barcode] = {
          name: todayProduct.name,
          barcode: barcode,
          source_url: todayProduct.source_url,
          image_url: todayProduct.image_url,
          source_id: todayProduct.source_id,
          shop: todayProduct.shop,
          category_id: todayProduct.category_id,
          weight: todayProduct.weight,
          prices: [
            { [yesterdayDate]: yesterdayProduct.prices },
            { [todayDate]: todayProduct.prices }
          ]
        };
      }
    });
  });
}

// Run comparisons
categories.forEach(compareAndAudit);

// CSV export (manual method)
const csvHeaders = [
  'barcode',
  'name',
  'shop',
  'category_id',
  'source_id',
  'state',
  'old_price',
  'new_price',
  'old_price_per_unit',
  'new_price_per_unit',
  'weight',
  'source_url',
  'image_url'
];

const auditRows = [];

Object.values(auditData).forEach(product => {
  const yesterdayPrices = product.prices[0][yesterdayDate];
  const todayPrices = product.prices[1][todayDate];

  todayPrices.forEach(todayPrice => {
    const state = todayPrice.state;
    const yPriceEntry = yesterdayPrices.find(p => p.state === state);

    const row = [
      product.barcode,
      product.name,
      product.shop,
      product.category_id,
      product.source_id,
      state,
      yPriceEntry?.price ?? '',
      todayPrice.price,
      yPriceEntry?.price_per_unit ?? '',
      todayPrice.price_per_unit,
      product.weight,
      product.source_url,
      product.image_url
    ];

    // Escape CSV values
    const safeRow = row.map(value =>
      typeof value === 'string' && (value.includes(',') || value.includes('"'))
        ? `"${value.replace(/"/g, '""')}"`
        : value
    );

    auditRows.push(safeRow.join(','));
  });
});

const csvContent = [csvHeaders.join(','), ...auditRows].join('\n');
const csvOutputFile = path.join(auditOutputPath, 'price_changes.csv');
fs.writeFileSync(csvOutputFile, csvContent, 'utf-8');

console.log(`✅ Price change CSV saved to: ${csvOutputFile}`);





//File: src/matched/5-6-2025/ by ID Category

//In ENV:
//FOLDER_DATE="5-6-2025"

// File: src/constant/categories.js
// This categories.js will be guide, since there is Level 1 ID on here 

// ID's on each folder need to access, inside on here is the json data:
// "name": "Baby",
// "id": "22015",

// "name": "Bakery",
// "id": "22060",

// "name": "Dairy, Eggs & Fridge",
// "id": "22089",

// "name": "Deli & Chilled Meats",
// "id": "24023",

// "name": "Drinks",
// "id": "22164",

// "name": "Freezer",
// "id": "22280",

// "name": "Fruit & Veg",
// "id": "22351",

// "name": "Health & Beauty",
// "id": "22394",

//"name": "Household",
//"id": "22459",

//"name": "Pantry",
//"id": "22770",

// "name": "Pet",
//"id": "22916",

//"name": "Poultry, Meat & Seafood",
//"id": "22713",


//Inside those ID folder is the json files that has id's: 22016-23820.json this the example of it.

// The code should be compare datas from the date folder 5-6-2025 and today's data 5-7-2025
