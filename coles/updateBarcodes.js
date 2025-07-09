import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Handle __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// File paths
const keyValueFilePath = path.join(__dirname, 'Matched_Barcodes', 'matchedList.json');
const targetFile = path.join(__dirname, 'data');

// ANSI color codes
const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bold: '\x1b[1m',
};

// Step 1: Read the key-value pair from the JSON object file
const objectFile = JSON.parse(fs.readFileSync(keyValueFilePath, 'utf8'));

// Step 2: Create a Map from the object file
const barcodeMap = new Map(Object.entries(objectFile));

// Step 3: Traverse the nested folder
function updateBarcodes(folderPath) {
  fs.readdirSync(folderPath).forEach(file => {
    const filePath = path.join(folderPath, file);

    // Check if it's a directory (nested folder)
    if (fs.lstatSync(filePath).isDirectory()) {
      updateBarcodes(filePath);
    } else if (file.endsWith('.json')) {
      // Step 4: Read each JSON file
      const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf8'));

      // Step 5: Loop through the array and update barcode
      let updated = false;
      jsonData.forEach(item => {
        if (item.source_id && barcodeMap.has(item.source_id)) {
          item.barcode = barcodeMap.get(item.source_id);
          updated = true;
        }
      });

      // Step 6: Write back the file if updated
      if (updated) {
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), 'utf8');
        console.log(`${COLORS.green}✔ Updated file:${COLORS.reset} ${COLORS.cyan}${filePath}${COLORS.reset}`);
      }
    }
  });
}

updateBarcodes(targetFile);
console.log(`${COLORS.bold}${COLORS.yellow}Barcode update process completed.${COLORS.reset}`);
