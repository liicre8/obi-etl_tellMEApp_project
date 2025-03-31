import fs from 'fs/promises';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB Connection String
const MONGO_URI = process.env.MONGO_COLES_BARCODE;

// Define Barcode Schema
const barcodeSchema = new mongoose.Schema(
  {
    coles_product_id: { type: String, unique: true }, // Ensuring uniqueness
    barcode: { type: String },
  },
  { timestamps: true }
);

// Connect to MongoDB
const dbConnect = async () => {
  try {
    await mongoose.connect(MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Define the Model
const ColesBarcode = mongoose.model('ColesBarcode', barcodeSchema);

// Path to JSON File
const filePath = './coles/colesGeneralBarcodeLookup.json';

// Function to Upload JSON Data to MongoDB
const uploadJSONToMongoDB = async () => {
  await dbConnect(); // Connect to database

  try {
    // Read JSON file
    const data = await fs.readFile(filePath, 'utf8');
    const jsonData = JSON.parse(data); // Convert JSON string to object

    // Convert JSON object to an array of { coles_product_id, barcode }
    const productsArray = Object.entries(jsonData).map(([coles_product_id, barcode]) => ({
      coles_product_id,
      barcode,
    }));

    // Insert each product only if it doesn't already exist
    for (const product of productsArray) {
      const existingProduct = await ColesBarcode.findOne({ coles_product_id: product.coles_product_id });

      if (existingProduct) {
      //  console.log(`⚠️ Skipping: Product with coles_product_id ${product.coles_product_id} already exists.`);
      } else {
        const newProduct = new ColesBarcode(product);
        await newProduct.save();
        console.log(`✅ Inserted: ${product.coles_product_id} - ${product.barcode}`);
      }
    }
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    // Close database connection
    mongoose.connection.close();
    console.log("🔌 Database connection closed.");
  }
};

// Run the function
uploadJSONToMongoDB();
