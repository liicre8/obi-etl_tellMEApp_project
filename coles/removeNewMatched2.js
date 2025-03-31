import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from 'dotenv';
dotenv.config();
// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define file paths
const keyValueFilePath = path.join(__dirname, "folder1", "matchedList.json"); // JSON Object file
const matchedBaseDir = path.join(__dirname, `../UnMatchedAll/${process.env.FOLDER_DATE}/`); // Base directory containing nested JSON files

// Ensure key-value file exists
if (!fs.existsSync(keyValueFilePath)) {
  console.error("❌ Error: Key-value JSON file is missing.");
  process.exit(1);
}

// Read and parse the JSON object file
const keyValueData = JSON.parse(fs.readFileSync(keyValueFilePath, "utf8"));

// Store keys and values from JSON object
const storedKeys = new Set(Object.keys(keyValueData)); // Set of keys
const storedValues = new Set(Object.values(keyValueData)); // Set of values

console.log(`🔍 Stored ${storedKeys.size} keys and ${storedValues.size} values from JSON Object`);

// Function to process JSON files inside nested directories
const processJsonFiles = (dirPath) => {
  fs.readdirSync(dirPath, { withFileTypes: true }).forEach((entry) => {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      // Recursively process subdirectories
      processJsonFiles(fullPath);
    } else if (entry.isFile() && path.extname(entry.name) === ".json") {
      try {
        console.log(`📂 Processing file: ${fullPath}`);

        // Read and parse JSON array file
        let jsonArrayData = JSON.parse(fs.readFileSync(fullPath, "utf8"));

        // Remove objects that match stored keys/values
        const originalLength = jsonArrayData.length;
        jsonArrayData = jsonArrayData.filter(
          (obj) => !storedKeys.has(obj.source_id) && !storedValues.has(obj.barcode)
        );

        const removedCount = originalLength - jsonArrayData.length;
        console.log(`🗑️ Removed ${removedCount} objects from ${entry.name}`);

        // Write the updated JSON array back to the file
        fs.writeFileSync(fullPath, JSON.stringify(jsonArrayData, null, 2));
        console.log(`💾 Updated file saved: ${fullPath}`);
      } catch (error) {
        console.error(`❌ Error processing ${fullPath}:`, error);
      }
    }
  });
};

// Start processing from the base directory
if (fs.existsSync(matchedBaseDir)) {
  processJsonFiles(matchedBaseDir);
} else {
  console.error(`❌ Error: Directory "${matchedBaseDir}" not found.`);
  process.exit(1);
}

console.log("🎉 Processing complete!");
