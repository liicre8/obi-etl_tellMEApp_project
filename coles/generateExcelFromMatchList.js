import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from "url";
import dbConnect from "./db/dbConnect.js";
import Product from "./models/products.js";

dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the folder containing the JSON file
const inputFolder = path.join(__dirname, "folder1");

// Find the first JSON file in the folder
const jsonFiles = fs.readdirSync(inputFolder).filter(file => file.endsWith(".json"));

if (jsonFiles.length === 0) {
  console.error(`❌ Error: No JSON file found in ${inputFolder}`);
  process.exit(1);
}

const inputFilePath = path.join(inputFolder, jsonFiles[0]); // Pick the first JSON file
console.log(`📄 Using JSON file: ${inputFilePath}`);

const outputFolder = path.join(__dirname, "output", process.env.FOLDER_DATE);
const outputFilePath = path.join(outputFolder, "COLESNEWMATCHED.json");

// Read and parse JSON file
let jsonData;
try {
  jsonData = JSON.parse(fs.readFileSync(inputFilePath, "utf8"));
} catch (error) {
  console.error("❌ Error reading/parsing JSON file:", error);
  process.exit(1);
}

// MongoDB connection
await dbConnect();

const generateJsonFromMatchList = async () => {
  try {
    console.log("🔄 Processing matched list...");

    const results = [];

    // Loop through key-value pairs and query MongoDB
    for (const [key, value] of Object.entries(jsonData)) {
      //  console.log(`key: ${key} value ${value}`);
      const productRecord = await Product.findOne({ coles_product_id: key }).lean();

      if (productRecord) {
        results.push({
          source_url: productRecord.source_url || null,
          name: productRecord.name || null,
          image_url: productRecord.image_url || null,
          source_id: productRecord.coles_product_id || null,
          barcode: value || "",
          category_id: productRecord.category_id || "",
          subcategory_id: productRecord.subcategory_id || "",
          subsubcategory_id: productRecord.subsubcategory_id || "",
          shop: productRecord.shop || null,
          weight: productRecord.weight || "",
          prices: productRecord.prices || [],
        });
      }
    }

    // Ensure output folder exists
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
      console.log(`📂 Created folder: ${outputFolder}`);
    }

    // Write results to JSON file
    fs.writeFileSync(outputFilePath, JSON.stringify(results, null, 2));
    console.log(`✅ JSON file generated: ${outputFilePath}`);
  } catch (error) {
    console.error("❌ Error generating JSON file:", error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log("🔌 MongoDB connection closed.");
  }
};

// Run the function
await generateJsonFromMatchList();
