const fs = require('fs');
const path = require('path');

const keyValueFilePath = path.join(__dirname, 'Matched_Barcodes', 'matchedList.json'); // JSON Object file
const targetFile = path.join(__dirname, 'data'); // Path to the nested folder containing JSON array files

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
                console.log(`Updated file: ${filePath}`);
            }
        }
    });
}
updateBarcodes(targetFile);
console.log('Barcode update process completed.');