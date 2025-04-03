import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define input JSON files to process (Add more filenames here if needed)
const inputFiles = ['PackedMatched.json']; // Add more JSON files here

const outputFilePath = path.join(__dirname, 'colesOutput.json'); // Output file path

const parseMatchedJSON = () => {
    try {
        let colesData = {}; // Object to store unique source_id → barcode pairs

        // Load existing data if `colesOutput.json` already exists
        if (fs.existsSync(outputFilePath)) {
            try {
                const existingData = fs.readFileSync(outputFilePath, 'utf8');
                colesData = JSON.parse(existingData);
            } catch (error) {
                console.error(`❌ Error reading existing colesOutput.json:`, error);
            }
        }

        // Loop through each input JSON file
        inputFiles.forEach((fileName) => {
            const filePath = path.join(__dirname, fileName);

            if (!fs.existsSync(filePath)) {
                console.warn(`⚠ Skipping missing file: ${fileName}`);
                return;
            }
            try {
                const data = fs.readFileSync(filePath, 'utf8');
                const jsonArray = JSON.parse(data);

                jsonArray.forEach((item) => {
                    if (item.shop === 'coles' && item.source_id && item.barcode) {
                        if (!colesData[item.source_id]) {
                            colesData[item.source_id] = item.barcode; // Add only if not exists
                        }
                    }
                });
                console.log(`✅ Processed: ${fileName}`);
            } catch (error) {
                console.error(`❌ Error processing ${fileName}:`, error);
            }
        });

        // Save updated data back to colesOutput.json
        fs.writeFileSync(outputFilePath, JSON.stringify(colesData, null, 2), 'utf8');

        console.log(`✅ Data successfully updated in colesOutput.json`);
    } catch (error) {
        console.error(`❌ Unexpected error:`, error);
    }
};

// Run the function
parseMatchedJSON();
