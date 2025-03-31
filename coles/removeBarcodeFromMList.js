import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import matchedList from "./matchedFromUnmatched.js"; // Import barcode list

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define JSON file path inside "folder1"
const jsonFilePath = path.join(__dirname, "folder1", "matchedList.json");

// Ensure the file exists before proceeding
if (!fs.existsSync(jsonFilePath)) {
  console.error(`❌ Error: File not found at ${jsonFilePath}`);
  process.exit(1);
}

// Read and parse the JSON file
const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, "utf8"));

console.log(`🔍 Original JSON size: ${Object.keys(jsonData).length} entries`);

// Keep only key-value pairs where the value exists in matchedList
const filteredData = Object.fromEntries(
  Object.entries(jsonData).filter(([key, value]) => matchedList.includes(value))
);

console.log(`✅ Retained ${Object.keys(filteredData).length} matching entries`);
console.log(`🗑 Removed ${Object.keys(jsonData).length - Object.keys(filteredData).length} non-matching entries`);

// Write updated JSON back to the file
fs.writeFileSync(jsonFilePath, JSON.stringify(filteredData, null, 2));

console.log(`💾 Updated JSON saved to ${jsonFilePath}`);
