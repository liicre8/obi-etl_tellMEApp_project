import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const matchedBaseDir = path.join(__dirname, `../UnMatchedAll/${process.env.FOLDER_DATE}/`);

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
                        if (obj && obj.shop) {
                            if (obj.shop.toLowerCase() === 'woolworths') {
                                woolworthsData.push(obj);
                            } else if (obj.shop.toLowerCase() === 'coles') {
                                colesData.push(obj);
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

// Function to export data to JSON
const exportToJson = (data, filename) => {
    if (data.length === 0) return;
    const filePath = path.join(__dirname, filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`${filename} has been saved.`);
};

// Process all folders inside matchedBaseDir
if (fs.existsSync(matchedBaseDir)) {
    console.log(`Processing all JSON files inside: ${matchedBaseDir}`);
    readJsonFiles(matchedBaseDir);
    
    exportToJson(woolworthsData, '0WoolworthsAll.json');
    exportToJson(colesData, '0ColesAll.json');
} else {
    console.error("No valid base directory found. Exiting.");
}
