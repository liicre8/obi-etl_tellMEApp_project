//File: src/checking/CheckingUnMatchedData.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Dates
const yesterdayDate = '5-22-2025';
// const todayDate = process.env.FOLDER_DATE; 
const todayDate = '5-27-2025';
const now = new Date();
const auditFolderName = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;
const basePath = path.join(__dirname, '..');
const unmatchedAuditPath = path.join(basePath, 'audit', 'unmatched', auditFolderName);

// Ensure output directory exists
if (!fs.existsSync(unmatchedAuditPath)) {
  fs.mkdirSync(unmatchedAuditPath, { recursive: true });
}

function readJSON(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

function compareUnmatched(shop) {
  const filename = `${shop}UnMatched.json`;
  const yesterdayPath = path.join(basePath, 'UnMatchedAll', yesterdayDate, filename);
  const todayPath = path.join(basePath, 'UnMatchedAll', todayDate, filename);

  if (!fs.existsSync(yesterdayPath)) {
    console.warn(`❌ Missing yesterday file: ${yesterdayPath}`);
  }
  if (!fs.existsSync(todayPath)) {
    console.warn(`❌ Missing today file: ${todayPath}`);
  }

  const yesterdayData = readJSON(yesterdayPath);
  const todayData = readJSON(todayPath);

  if (!yesterdayData || !todayData) {
    console.warn(`⚠️ Skipping ${shop}: missing one or both files`);
    return;
  }

  const yesterdayByBarcode = {};
  Object.values(yesterdayData).forEach(product => {
    if (product.barcode) {
      yesterdayByBarcode[product.barcode] = product;
    }
  });

  const changedRows = [];

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
      const yesterdayPrices = yesterdayProduct.prices;
      const todayPrices = todayProduct.prices;

      todayPrices.forEach(todayPrice => {
        const state = todayPrice.state;
        const yPriceEntry = yesterdayPrices.find(p => p.state === state);

        const row = [
          barcode,
          todayProduct.name,
          todayProduct.shop,
          todayProduct.category_id,
          todayProduct.source_id,
          state,
          yPriceEntry?.price ?? '',
          todayPrice.price,
          yPriceEntry?.price_per_unit ?? '',
          todayPrice.price_per_unit,
          todayProduct.weight,
          todayProduct.source_url,
          todayProduct.image_url
        ];

        const safeRow = row.map(value =>
          typeof value === 'string' && (value.includes(',') || value.includes('"'))
            ? `"${value.replace(/"/g, '""')}"`
            : value
        );

        changedRows.push(safeRow.join(','));
      });
    }
  });

  if (changedRows.length > 0) {
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

    const csvContent = [csvHeaders.join(','), ...changedRows].join('\n');
    const csvFileName = shop === 'coles' ? 'coles_price_changes.csv' : 'wools_price_changes.csv';
    const outputPath = path.join(unmatchedAuditPath, csvFileName);

    fs.writeFileSync(outputPath, csvContent, 'utf-8');
    console.log(`✅ Unmatched price changes for ${shop} saved to: ${outputPath}`);
  } else {
    console.log(`✅ No price changes found in unmatched data for ${shop}`);
  }
}

// Run for both shops
compareUnmatched('coles');
compareUnmatched('woolworths');



