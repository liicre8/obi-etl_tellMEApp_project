//File: src/checking/CheckingUnMatchedData.js
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Dates
const yesterdayDate = '8-20-2025';
const todayDate = process.env.FOLDER_DATE; 

if (!todayDate) {
  console.error('❌ Error: FOLDER_DATE environment variable is not set.');
  process.exit(1);
}

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
  } catch (error) {
    console.error(`Error reading JSON file ${filePath}:`, error.message);
    return null;
  }
}

// Improved CSV escaping function
function escapeCSVValue(value) {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // If the value contains comma, double quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

function compareUnmatched(shop) {
  console.log(`\n🔍 Processing ${shop} unmatched data...`);
  
  const filename = `${shop}UnMatched.json`;
  const yesterdayPath = path.join(basePath, 'UnMatchedAll', yesterdayDate, filename);
  const todayPath = path.join(basePath, 'UnMatchedAll', todayDate, filename);

  // Check if files exist
  if (!fs.existsSync(yesterdayPath)) {
    console.warn(`❌ Missing yesterday file: ${yesterdayPath}`);
    return;
  }
  if (!fs.existsSync(todayPath)) {
    console.warn(`❌ Missing today file: ${todayPath}`);
    return;
  }

  const yesterdayData = readJSON(yesterdayPath);
  const todayData = readJSON(todayPath);

  if (!yesterdayData || !todayData) {
    console.warn(`⚠️ Skipping ${shop}: missing one or both files`);
    return;
  }

  console.log(`📊 Yesterday data: ${Object.keys(yesterdayData).length} products`);
  console.log(`📊 Today data: ${Object.keys(todayData).length} products`);

  // Build lookup map for yesterday's data
  const yesterdayByBarcode = {};
  Object.values(yesterdayData).forEach(product => {
    if (product.barcode) {
      yesterdayByBarcode[product.barcode] = product;
    }
  });

  const changedRows = [];
  let processedProducts = 0;
  let productsWithChanges = 0;

  // Process today's data and compare with yesterday
  Object.values(todayData).forEach(todayProduct => {
    const barcode = todayProduct.barcode;
    if (!barcode || !Array.isArray(todayProduct.prices)) return;

    processedProducts++;
    const yesterdayProduct = yesterdayByBarcode[barcode];
    if (!yesterdayProduct || !Array.isArray(yesterdayProduct.prices)) return;

    // Check if any price changed
    const priceChanged = todayProduct.prices.some(todayPrice => {
      const yPrice = yesterdayProduct.prices.find(p => p.state === todayPrice.state);
      return (
        !yPrice ||
        todayPrice.price !== yPrice.price ||
        todayPrice.price_per_unit !== yPrice.price_per_unit
      );
    });

    if (priceChanged) {
      productsWithChanges++;
      const yesterdayPrices = yesterdayProduct.prices;
      const todayPrices = todayProduct.prices;

      // Create a row for each state/price combination
      todayPrices.forEach(todayPrice => {
        const state = todayPrice.state;
        const yPriceEntry = yesterdayPrices.find(p => p.state === state);

        // Build the row data array in the correct order
        const rowData = [
          barcode,                                    // barcode
          todayProduct.name,                         // name
          todayProduct.shop,                         // shop
          todayProduct.category_id,                  // category_id
          todayProduct.source_id,                    // source_id
          state,                                     // state
          yPriceEntry?.price ?? '',                 // old_price
          todayPrice.price,                         // new_price
          yPriceEntry?.price_per_unit ?? '',        // old_price_per_unit
          todayPrice.price_per_unit,                // new_price_per_unit
          todayProduct.weight,                      // weight
          todayProduct.source_url,                  // source_url
          todayProduct.image_url                    // image_url
        ];

        // Escape all values properly
        const safeRow = rowData.map(escapeCSVValue);
        changedRows.push(safeRow.join(','));
      });
    }
  });

  console.log(`📈 Processed ${processedProducts} products, found ${productsWithChanges} with price changes`);
  console.log(`📝 Generated ${changedRows.length} CSV rows`);

  // Generate CSV if there are changes
  if (changedRows.length > 0) {
    // Define CSV headers (make sure this matches the row data order)
    const csvHeaders = [
       'Barcode',
       'Name',
       'Shop',
       'Category_id', 
       'Source_id',
       'State',
       'Old_price',
       'New_price',
       'Old_per_unit',
       'New_price_per_unit',
       'Weight',
       'Source_url',
       'Image_url'
    ];

    // Create CSV content with UTF-8 BOM for Excel compatibility
    const csvContent = [csvHeaders.join(','), ...changedRows].join('\n');
    const csvFileName = shop === 'coles' ? 'coles_unmatched_pc.csv' : 'woolworths_unmatched_pc.csv';
    const outputPath = path.join(unmatchedAuditPath, csvFileName);

    // Write with BOM for Excel compatibility
    const BOM = '\uFEFF';
    fs.writeFileSync(outputPath, BOM + csvContent, 'utf-8');
    
    console.log(`✅ Unmatched price changes for ${shop} saved to: ${outputPath}`);
    
    // Log sample data for verification
    console.log('\n📋 Sample data (first 2 rows):');
    console.log('Headers:', csvHeaders.join(','));
    changedRows.slice(0, 2).forEach((row, index) => {
      console.log(`Row ${index + 1}:`, row);
    });
  } else {
    console.log(`✅ No price changes found in unmatched data for ${shop}`);
  }
}

// Main execution
console.log('🚀 Starting unmatched data comparison...');

// Run for both shops
compareUnmatched('coles');
compareUnmatched('woolworths');

console.log('\n🎉 Unmatched data comparison completed!');



