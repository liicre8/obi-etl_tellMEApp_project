import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
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
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`❌ Error reading ${filename}:`, error);
        return [];
    }
};

// Normalize and extract words from product name
const normalizeName = (name) =>
    name.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);

// Compute name similarity based on common words
const computeNameSimilarity = (name1, name2) => {
    const words1 = normalizeName(name1);
    const words2 = normalizeName(name2);
    const totalWords = Math.max(words1.length, words2.length);
    const matchedWords = words1.filter(word => words2.includes(word)).length;
    
    return (matchedWords / totalWords) * 100; // Returns a number, NOT a string
};

// Normalize weight/quantity values
const normalizeWeight = (weight) => {
    if (!weight) return null;

    // Replace common shorthand (ea → each, pck → pack)

    weight = weight
  .replace(/\bea\b/gi, 'each')
  .replace(/\bpck\b/gi, 'pack')
  .replace(/\b1\s*each\b/gi, 'each');

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

// Load JSON data
// const jsonArray1 = loadJsonFile('WoolworthsAll.json'); // Source products
// const jsonArray2 = loadJsonFile('ColesAll.json'); // Target products

const jsonArray1 = loadJsonFile('0ColesAll.json'); // Source products
const jsonArray2 = loadJsonFile('0WoolworthsAll.json');  // Target products

let matchCount = 0;
let remainingUmmatched = 0
// Compare JSON objects
jsonArray1.forEach((item1) => {
    // if (!item1.barcode) {
    //     console.warn(`⚠ Skipping ${item1.name} (Missing Barcode)`);
    //     return;
    // }

    // Skip if Barcode is already in matched list

    if (matchedList.includes(item1.barcode)) {
        console.log(`🔸 Skipping ${item1.name} (Barcode already matched: ${item1.barcode})`);
        return;
    }
 remainingUmmatched++;
    let bestMatch = null;
    let bestScore = 0;

    jsonArray2.forEach((item2) => {
        if (!item2.barcode) return;

        // Compute name similarity
        const nameSimilarity = computeNameSimilarity(item1.name, item2.name);
    
        const weight1 = normalizeWeight(item1.weight);
        const weight2 = normalizeWeight(item2.weight);
        let weightSimilarity = 0;

        if (weight1 && weight2 && weight1.unit === weight2.unit) {
            weightSimilarity = weight1.value === weight2.value
                ? 100
                : (Math.min(weight1.value, weight2.value) / Math.max(weight1.value, weight2.value)) * 100;
        }

        // If the match is better than the previous one, update best match
        if (nameSimilarity >= 95 && weightSimilarity >= 90 && nameSimilarity > bestScore) {
            bestScore = nameSimilarity;
            bestMatch = { item2, nameSimilarity, weightSimilarity };
        }
    });
    // Save the best match if found
    if (bestMatch) {
        console.log(`✅ Match Found! Name: ${bestMatch.nameSimilarity}% | Weight: ${bestMatch.weightSimilarity}%`);
        console.log(`- ${item1.name}  ===  ${bestMatch.item2.name}`);

        // if (!item1.category_id || !bestMatch.item2.category_id) {
        //     console.warn("⚠ Skipping match - missing ProductID");
        //     return;
        // }

        // Save matched data
        const matchedData = {
            item1,
            item2: bestMatch.item2,
            nameSimilarity: bestMatch.nameSimilarity.toFixed(2),
            weightSimilarity: bestMatch.weightSimilarity.toFixed(2),
        };
        const fileName = `${item1.category_id ? item1.category_id : "uncategorize"}.json`;
        const filePath = path.join(matchedDir, fileName);

        // Append or create file
        let existingData = [];
        if (fs.existsSync(filePath)) {
            try {
                existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
console.log(`Remaining Coles product UnMatched : ${remainingUmmatched}`);
console.log(`🎯 Total Matches Found: ${matchCount}`);
