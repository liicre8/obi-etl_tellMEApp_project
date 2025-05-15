import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Setup __dirname and config
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dates
const yesterdayDate = '5-6-2025';
const todayDate = process.env.FOLDER_DATE;

if (!todayDate) {
  console.error('❌ Error: FOLDER_DATE environment variable is not set.');
  process.exit(1);
}

const now = new Date();
const auditFolderName = `${now.getMonth() + 1}-${now.getDate()}-${now.getFullYear()}`;
const basePath = path.join(__dirname, '..');
const auditOutputPath = path.join(basePath, 'audit', 'unmatched_added_removed', auditFolderName);

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

function compareAddedRemoved(shop) {
  const filename = `${shop}UnMatched.json`;
  const yesterdayPath = path.join(basePath, 'UnMatchedAll', yesterdayDate, filename);
  const todayPath = path.join(basePath, 'UnMatchedAll', todayDate, filename);

  const yesterdayData = readJSON(yesterdayPath) || {};
  const todayData = readJSON(todayPath) || {};

  const yesterdayBarcodes = new Set(Object.keys(yesterdayData));
  const todayBarcodes = new Set(Object.keys(todayData));

  const removed = [];
  const added = [];

  for (const barcode of yesterdayBarcodes) {
    if (!todayBarcodes.has(barcode)) {
      const p = yesterdayData[barcode];
      removed.push(p);
    }
  }

  for (const barcode of todayBarcodes) {
    if (!yesterdayBarcodes.has(barcode)) {
      const p = todayData[barcode];
      added.push(p);
    }
  }

  writeCSV(removed, `${shop}_removed_unmatched.csv`);
  writeCSV(added, `${shop}_added_unmatched.csv`);

  console.log(`✅ Done processing unmatched data for ${shop}. Added: ${added.length}, Removed: ${removed.length}`);
}

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
        : p[h] ?? ''
    ).join(',')
  );

  const csv = [headers.join(','), ...rows].join('\n');
  fs.writeFileSync(path.join(auditOutputPath, filename), csv, 'utf-8');
}

// Run for both shops
compareAddedRemoved('coles');
compareAddedRemoved('woolworths');
