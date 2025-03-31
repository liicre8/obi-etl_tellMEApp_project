import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const matchedBaseDir = path.join(__dirname, '../unMatched');

let woolworthsData = [];
let colesData = [];

// Function to recursively read JSON files from all subdirectories
const readJsonFiles = (dir) => {
    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            readJsonFiles(filePath); // Recursively read subdirectory
        } else if (file.endsWith('.json')) {
            const data = fs.readFileSync(filePath, 'utf8');
            try {
                const jsonData = JSON.parse(data);
                if (Array.isArray(jsonData)) {
                    jsonData.forEach(obj => {
                        if (obj && obj.name && obj.shop) {
                            const entry = {
                                Name: obj.name,
                                ProductURL: obj.source_url || '',
                                Barcode: obj.barcode || '',
                                ProductID: obj.source_id || '',
                                Shop: obj.shop,
                                CategoryID: obj.category_id || ''
                            };
                            if (obj.shop.toLowerCase() === 'woolworths') {
                                woolworthsData.push(entry);
                            } else if (obj.shop.toLowerCase() === 'coles') {
                                colesData.push(entry);
                            }
                        }
                    });
                }
            } catch (parseErr) {
                console.error(`Error parsing JSON file: ${filePath}`, parseErr);
            }
        }
    });
};
// Function to auto-size Excel columns
const autoSizeColumns = (data) => {
    if (data.length === 0) return [];
    const keys = Object.keys(data[0]);
    return keys.map((key) => ({ wch: Math.max(key.length, ...data.map(row => (row[key] ? row[key].toString().length : 0))) + 2 }));
};
// Function to export data to Excel
const exportToExcel = (data, filename) => {
    if (data.length === 0) return;
    const ws = xlsx.utils.json_to_sheet(data);
    ws['!cols'] = autoSizeColumns(data); // Auto-size columns
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');
    xlsx.writeFile(wb, path.join(__dirname, filename));
    console.log(`${filename} has been saved.`);
};

// Process all folders inside matchedBaseDir
if (fs.existsSync(matchedBaseDir)) {
    console.log(`Processing all JSON files inside: ${matchedBaseDir}`);
    readJsonFiles(matchedBaseDir);
    exportToExcel(woolworthsData, 'Woolworths.xlsx');
    exportToExcel(colesData, 'Coles.xlsx');
} else {
    console.error("No valid base directory found. Exiting.");
}
