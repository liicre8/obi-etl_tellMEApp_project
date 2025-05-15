//File: src/checking/AddedRemoveMProd.js
const fs = require('fs');
const path = require('path');
const categories = require('../constant/categories');
require('dotenv').config();

// Config
const yesterdayDate = '5-6-2025';
const todayDate = process.env.FOLDER_DATE;

if (!todayDate) {
  console.error('❌ Error: FOLDER_DATE environment variable is not set.');
  process.exit(1);
}

// Output folder
const now = new Date();
const auditFolderName = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;
const basePath = path.join(__dirname, '..');
const auditOutputPath = path.join(basePath, 'audit', 'matched_added_removed', auditFolderName);

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

const removedProducts = [];
const addedProducts = [];

function compareForAddedOrRemoved(category) {
  const categoryId = category.id;
  const yesterdayFolder = path.join(basePath, 'matched', yesterdayDate, categoryId);
  const todayFolder = path.join(basePath, 'matched', todayDate, categoryId);

  if (!fs.existsSync(yesterdayFolder) || !fs.existsSync(todayFolder)) {
    console.warn(`⚠️ Skipping ${category.name} (${categoryId}): folder missing`);
    return;
  }

  const yesterdayFiles = fs.readdirSync(yesterdayFolder).filter(f => f.endsWith('.json'));
  const todayFiles = fs.readdirSync(todayFolder).filter(f => f.endsWith('.json'));

  const fileSet = new Set([...yesterdayFiles, ...todayFiles]);

  fileSet.forEach(file => {
    const yesterdayData = readJSON(getFilePath(yesterdayDate, categoryId, file)) || {};
    const todayData = readJSON(getFilePath(todayDate, categoryId, file)) || {};

    const yesterdayBarcodes = new Set(Object.keys(yesterdayData));
    const todayBarcodes = new Set(Object.keys(todayData));

    // Products removed
    [...yesterdayBarcodes].forEach(barcode => {
      if (!todayBarcodes.has(barcode)) {
        const p = yesterdayData[barcode];
        removedProducts.push({
          barcode: p.barcode,
          name: p.name,
          shop: p.shop,
          category_id: p.category_id,
          source_id: p.source_id,
          weight: p.weight,
          source_url: p.source_url,
          image_url: p.image_url
        });
      }
    });

    // Products added
    [...todayBarcodes].forEach(barcode => {
      if (!yesterdayBarcodes.has(barcode)) {
        const p = todayData[barcode];
        addedProducts.push({
          barcode: p.barcode,
          name: p.name,
          shop: p.shop,
          category_id: p.category_id,
          source_id: p.source_id,
          weight: p.weight,
          source_url: p.source_url,
          image_url: p.image_url
        });
      }
    });
  });
}

// Run comparison
categories.forEach(compareForAddedOrRemoved);

// Write CSV
function writeCSV(dataArray, filename) {
  const headers = [
    'barcode',
    'name',
    'shop',
    'category_id',
    'source_id',
    'weight',
    'source_url',
    'image_url'
  ];

  const rows = dataArray.map(p =>
    headers.map(h =>
      typeof p[h] === 'string' && (p[h].includes(',') || p[h].includes('"'))
        ? `"${p[h].replace(/"/g, '""')}"`
        : p[h]
    ).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(path.join(auditOutputPath, filename), csv, 'utf-8');
}

writeCSV(removedProducts, 'removed_products.csv');
writeCSV(addedProducts, 'added_products.csv');

console.log(`✅ Removed and added product CSVs saved to: ${auditOutputPath}`);
