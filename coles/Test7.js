import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Fuse from 'fuse.js';
import matchedList from './matchedFromUnmatched.js'; // Import matched barcodes list

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const matchedDir = path.join(__dirname, 'matched'); // Directory to save matched files

// Ensure matched directory exists
if (!fs.existsSync(matchedDir)) {
    fs.mkdirSync(matchedDir, { recursive: true });
}

// Function to load JSON files
const loadJsonFile = (filename) => {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ File not found: ${filename}`);
        return [];
    }
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`❌ Error reading ${filename}:`, error);
        return [];
    }
};

// Load JSON data
const jsonArray1 = loadJsonFile('WoolworthsAll.json');
const jsonArray2 = loadJsonFile('ColesAll.json');

let matchCount = 0;

// Normalize weight/quantity values for accurate comparison
const normalizeWeight = (weight) => {
    if (!weight) return null;

    // Normalize "ea" → "each" and "pck" → "pack"
    weight = weight.replace(/\bea\b/gi, 'each').replace(/\bpck\b/gi, 'pack');

    // Regex to capture numeric value and unit
    const match = weight.match(/(\d+\.?\d*)\s*(mg|g|kg|gm|ml|l|litre|liter|pack|each|capsule|tablet|pcs|piece)/i);
    if (!match) return null;

    let value = parseFloat(match[1]);
    let unit = match[2].toLowerCase();

    // Convert weight-based units to mg
    if (unit === 'g' || unit === 'gm') value *= 1000; // Convert g → mg
    if (unit === 'kg') value *= 1000000; // Convert kg → mg

    // Convert volume-based units to ml
    if (unit === 'l' || unit === 'litre' || unit === 'liter') value *= 1000; // Convert l → ml

    return { value, unit };
};

// Setup Fuse.js for fuzzy name matching
const fuse = new Fuse(jsonArray2, {
    keys: ['name'],
    threshold: 0.3, // Adjust as needed (lower = stricter match)
    includeScore: true,
});

// Compare JSON objects
jsonArray1.forEach((item1) => {
    if (!item1.barcode) {
        console.warn(`⚠ Skipping ${item1.name} (Missing Barcode)`);
        return;
    }

    // Skip if Barcode is already in matched list
    if (matchedList.includes(item1.barcode)) {
        console.log(`🔸 Skipping ${item1.name} (Barcode already matched: ${item1.barcode})`);
        return;
    }

    // Find best name match using Fuse.js
    const bestMatch = fuse.search(item1.name)?.[0];

    if (!bestMatch) return; // No match found

    const item2 = bestMatch.item;
    const nameSimilarity = (1 - bestMatch.score) * 100; // Convert to percentage

    // Normalize weight for both items
    const weight1 = normalizeWeight(item1.weight);
    const weight2 = normalizeWeight(item2.weight);

    let weightSimilarity = 0;

    if (weight1 && weight2 && weight1.unit === weight2.unit) {
        weightSimilarity = weight1.value === weight2.value
            ? 95
            : (Math.min(weight1.value, weight2.value) / Math.max(weight1.value, weight2.value)) * 100;
    }

    // Match Condition: Name similarity >= 70% AND Weight similarity >= 90%
    if (nameSimilarity >= 35 && weightSimilarity >= 95) {
        console.log(`✅ Match Found! Name: ${(nameSimilarity).toFixed(2)}% | Weight: ${(weightSimilarity).toFixed(2)}%`);
        console.log(`- ${item1.name}  ===  ${item2.name}`);

        if (!item1.category_id || !item2.category_id) {
            console.warn("⚠ Skipping match - missing ProductID");
            return;
        }

        // Save matched data
        const matchedData = {
            item1,
            item2,
            nameSimilarity: nameSimilarity.toFixed(2),
            weightSimilarity: weightSimilarity.toFixed(2),
        };
        const fileName = `${item1.category_id}.json`;
        const filePath = path.join(matchedDir, fileName);

        // Append or create file
        let existingData = [];
        if (fs.existsSync(filePath)) {
            try {
                const existingContent = fs.readFileSync(filePath, 'utf8');
                existingData = JSON.parse(existingContent);
            } catch (err) {
                console.error(`❌ Error reading existing file: ${fileName}`, err);
            }
        }
        existingData.push(matchedData);
        fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
        console.log(`💾 Match saved to ${filePath}`);
        matchCount++;
    }
});

console.log(`🎯 Total Matches Found: ${matchCount}`);
