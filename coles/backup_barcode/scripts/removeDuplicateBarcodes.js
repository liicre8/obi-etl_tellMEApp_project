//File Path: coles/barcode/removeDuplicateBarcodes.js.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.resolve(__dirname, '../colesGeneralBarcodeLookup.json');

try {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const data = JSON.parse(raw);

  const seen = new Set();
  const unique = {};

  for (const [key, value] of Object.entries(data)) {
    if (!seen.has(value)) {
      seen.add(value);
      unique[key] = value;
    }
  }

  fs.writeFileSync(filePath, JSON.stringify(unique, null, 2));
  console.log(`✅ Removed duplicates. Saved cleaned data to ${filePath}`);
} catch (err) {
  console.error('❌ Error processing file:', err.message);
}
