import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the absolute path of the Excel file
const filePath = path.join(__dirname, "Coles.xlsx");

// Load the workbook
const workbook = xlsx.readFile(filePath);

// Get the first sheet name
const sheetName = workbook.SheetNames[0];

// Convert sheet to JSON
const jsonData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

// Save JSON to a file
fs.writeFileSync(path.join(__dirname, "ColesUnmatch.json"), JSON.stringify(jsonData, null, 2));

console.log("Excel file successfully converted to JSON!");