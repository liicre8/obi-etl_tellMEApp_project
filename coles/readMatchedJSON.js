import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to directories
const matchedDir = path.join(__dirname, '/matched'); // Folder with JSON files
const outputFilePath = path.join(__dirname, 'Packed032725.json'); // Output JSON file

// Object to store the best matches by source_id
const bestMatches = {};
const uniqueSourceIds = new Set(); // Set to track unique source_ids
let item1Count = 0; // Counter for added item1s
let objectCount = 0;
const matchedTreshold = 0.35;
// Function to process JSON files
const processJsonFiles = () => {
    try {
        if (!fs.existsSync(matchedDir)) {
            console.error("❌ The 'matched' folder does not exist.");
            return;
        }

        const files = fs.readdirSync(matchedDir);

        if (files.length === 0) {
            console.warn("⚠️ No JSON files found in 'matched' folder.");
            return;
        }

        files.forEach((file) => {
            const filePath = path.join(matchedDir, file);

            if (file.endsWith('.json')) {
                try {
                    console.log(`📂 Processing file: ${file}`);

                    const rawData = fs.readFileSync(filePath, 'utf8');
                    const jsonArray = JSON.parse(rawData);

                    if (Array.isArray(jsonArray)) {
                        jsonArray.forEach((jsonObject) => {
                            const { item1, item2, nameSimilarity } = jsonObject;
                            objectCount = objectCount +1;
                            const sourceId = item1.source_id;
                            uniqueSourceIds.add(sourceId); // Track unique source_ids
                            // Only process if similarity is greater than treshold
                            console.log(`: ${item1.source_id} ${nameSimilarity} over ${matchedTreshold}`);
                            if (nameSimilarity > matchedTreshold && item1?.source_id) {
                                console.log(`: ${item1.source_id}`);
                                // const sourceId = item1.source_id;
                                // uniqueSourceIds.add(sourceId); // Track unique source_ids
                                // Compare similarity and store only the highest one
                                if (!bestMatches[sourceId] || bestMatches[sourceId].nameSimilarity < nameSimilarity) {
                                    // Replace item2's barcode with item1's barcode
                                    if (item2.barcode) {
                                        item1.barcode = item2.barcode;
                                    }
                                    bestMatches[sourceId] = { item1, item2, nameSimilarity };
                                }
                            }
                        });
                    } else {
                        console.warn(`⚠️ Skipping ${file}: Not a JSON array`);
                    }
                } catch (error) {
                    console.error(`❌ Error reading or parsing ${file}:`, error);
                }
            }
        });

        // Convert stored matches to a flat array (removing keys)
        const filteredResults = Object.values(bestMatches).flatMap(({ item1, item2 }) => {
            item1Count++; // Count added item1s
            return [item1, item2];
        });

        if (filteredResults.length === 0) {
            console.warn("⚠️ No matches found with similarity greater than treshold");
            return;
        }

        // Save to Packed.json
        fs.writeFileSync(outputFilePath, JSON.stringify(filteredResults, null, 2), 'utf8');

        console.log(`✅ Packed.json has been saved successfully!`);
        console.log(`📊 Total initial matched: ${objectCount}`);
        console.log(`📊 Total Unique prodID matched: ${uniqueSourceIds.size}`);
        console.log(`📊 Total final matched with ${matchedTreshold*100}% percentage : ${item1Count}`);
    } catch (error) {
        console.error("❌ Error processing files:", error);
    }
};
// Global error handling
process.on('uncaughtException', (error) => {
    console.error("❌ Uncaught Exception:", error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error("❌ Unhandled Promise Rejection:", reason);
});

// Run the function
processJsonFiles();
