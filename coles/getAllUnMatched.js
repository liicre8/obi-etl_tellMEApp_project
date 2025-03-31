import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

// Manually define __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve correct paths
const sourceFolder = path.resolve(__dirname, `../matched/${process.env.FOLDER_DATE}/`);
const keyValueFilePath = path.join(__dirname, "folder1", "matchedList.json"); // JSON Object file

const compareFolder1 = path.resolve(__dirname, `./data/${process.env.FOLDER_DATE}/`);
const compareFolder2 = path.resolve(__dirname, `../woolworths/data/${process.env.FOLDER_DATE}/`);
const outputFolder = path.resolve(__dirname, `../UnMatchedAll/${process.env.FOLDER_DATE}/`);

// Ensure output folder exists
if (!fs.existsSync(outputFolder)) {
  fs.mkdirSync(outputFolder, { recursive: true });
}

// Function to recursively get JSON files from a folder
const getJsonFiles = (dir) => {
  let jsonFiles = [];
  if (!fs.existsSync(dir)) {
    console.warn(`Directory not found: ${dir}`);
    return jsonFiles;
  }
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      jsonFiles = jsonFiles.concat(getJsonFiles(fullPath));
    } else if (file.endsWith(".json")) {
      jsonFiles.push(fullPath);
    }
  });
  return jsonFiles;
};

// Function to parse JSON files and extract objects
const parseJsonFiles = (files) => {
  let objects = [];
  files.forEach((file) => {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      if (Array.isArray(data)) {
        objects = objects.concat(data);
      } else {
        console.warn(`Skipping file (not an array): ${file}`);
      }
    } catch (error) {
      console.error(`Error parsing JSON file: ${file}`, error);
    }
  });
  return objects;
};

// Read and parse the JSON object file
const keyValueData = JSON.parse(fs.readFileSync(keyValueFilePath, "utf8"));
// Store keys and values from JSON object


// Get all JSON files from source and compare folders
const sourceFiles = getJsonFiles(sourceFolder);
const compareFiles1 = getJsonFiles(compareFolder1);
const compareFiles2 = getJsonFiles(compareFolder2);

// Parse JSON objects from source and compare folders
const sourceObjects = parseJsonFiles(sourceFiles);
const compareObjects1 = parseJsonFiles(compareFiles1);
const compareObjects2 = parseJsonFiles(compareFiles2);

console.log(`Object 1 (Coles): ${compareObjects1.length}`);
console.log(`Object 2 (Woolworths): ${compareObjects2.length}`);
console.log(`Object Source: ${sourceObjects.length}`);

// Create a Set of source_ids from sourceObjects
const excludeSourceIds = new Set(Object.keys(keyValueData));  // Barcodes as keys
const excludeBarcodes = new Set(Object.values(keyValueData)); // Source IDs as values
console.log(`SourceIds : ${excludeSourceIds.size},  Barcode : ${excludeBarcodes.size}`)
// Create a Set of sourceIds from sourceObjects
const sourceIds = new Set(sourceObjects.map((obj) => obj.source_id));

// ✅ Filter out objects where source_id or barcode match exclusion criteria
const filteredCompareObjects = [
  ...compareObjects1.filter((obj) => 
    !sourceIds.has(obj.source_id) && 
    !excludeSourceIds.has(obj.source_id) && 
    !excludeBarcodes.has(obj.barcode)
  ),
  ...compareObjects2.filter((obj) =>
    !sourceIds.has(obj.source_id) && 
    !excludeSourceIds.has(obj.source_id) && 
    !excludeBarcodes.has(obj.barcode)
  )
];

// Separate objects by shop type
const colesObjects = filteredCompareObjects.filter((obj) => obj.shop === "coles");
const woolworthsObjects = filteredCompareObjects.filter((obj) => obj.shop === "Woolworths");

console.log(`Coles Unmatched: ${colesObjects.length}`);
console.log(`Woolworths Unmatched: ${woolworthsObjects.length}`);

// Save filtered JSON files
fs.writeFileSync(path.join(outputFolder, "colesUnMatched.json"), JSON.stringify(colesObjects, null, 2));
fs.writeFileSync(path.join(outputFolder, "woolworthsUnMatched.json"), JSON.stringify(woolworthsObjects, null, 2));

console.log("✅ Filtered JSON files saved successfully!");
