import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
// Get the absolute path of the script's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define source and target folder paths
const sourceFolder = path.join(__dirname, 'NewMatched');  // JSON files containing source_ids
const targetFolder = path.join(__dirname, `../UnMatchedAll/${process.env.FOLDER_DATE}/`);  // Nested JSON files to be cleaned

// Function to read and extract source_ids from JSON files in sourceData/
const getsource_idsFromSource = (folderPath) => {
    let source_ids = new Set();

    fs.readdirSync(folderPath).forEach(file => {
        const filePath = path.join(folderPath, file);
        if (!fs.statSync(filePath).isFile() || !file.endsWith('.json')) return;

        try {
            const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
            if (Array.isArray(data)) {
                data.forEach(obj => {
                    if (obj.source_id) {
                        source_ids.add(obj.source_id);
                    }
                });
            }
        } catch (error) {
            console.error(`Error reading/parsing ${file}:`, error);
        }
    });
    return source_ids;
};

// Recursive function to find JSON files in targetData/ and remove objects with matching source_ids
const removeMatchingObjects = (folderPath, source_ids) => {
    fs.readdirSync(folderPath).forEach(file => {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            removeMatchingObjects(filePath, source_ids); // Recursively process subdirectories
        } else if (stats.isFile() && file.endsWith('.json')) {
            try {
                let data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (Array.isArray(data)) {
                    const filteredData = data.filter(obj => !source_ids.has(obj.source_id)); // Remove matching objects
                    
                    if (filteredData.length !== data.length) {
                        fs.writeFileSync(filePath, JSON.stringify(filteredData, null, 2));
                        console.log(`Updated ${filePath}: Removed ${data.length - filteredData.length} matching objects.`);
                    }
                }
            } catch (error) {
                console.error(`Error processing ${filePath}:`, error);
            }
        }
    });
};

// Execute the process
if (!fs.existsSync(sourceFolder)) {
    console.error("Error: sourceData folder not found!");
    process.exit(1);
}

if (!fs.existsSync(targetFolder)) {
    console.error("Error: targetData folder not found!");
    process.exit(1);
}

const source_idsToRemove = getsource_idsFromSource(sourceFolder);
if (source_idsToRemove.size > 0) {
    console.log(`Found ${source_idsToRemove.size} source_ids to remove. Processing target data...`);
    removeMatchingObjects(targetFolder, source_idsToRemove);
    console.log("✅ Processing complete.");
} else {
    console.log("⚠️ No source_ids found in sourceData.");
}
