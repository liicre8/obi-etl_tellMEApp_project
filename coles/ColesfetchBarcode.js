// //File: coles/ColesfetchBarcode.js
import axios from 'axios';
//import axiosRetry from 'axios-retry';
import Product from './models/products.js';
import dbConnect from './db/dbConnect.js';
import dotenv from 'dotenv';

dotenv.config();
import mongoose from 'mongoose';

const db2 = async () => {
  try {
    console.log('Database Name:', process.env.MONGO_COLES_BARCODE);

    // Updated to use the full Atlas URI including database name
    const barcodeDB = mongoose.createConnection(`${process.env.MONGO_COLES_BARCODE}/barcodes`);
    barcodeDB.on('connected', () => console.log('Connected to Barcode Database'));

    return barcodeDB;
  } catch (error) {
    console.log('error', error);
    return null;
  }
};

const barcodeSchema = new mongoose.Schema(
  {
    coles_product_id: { type: String },
    barcode: { type: String },
  },
  { 
    timestamps: true,
    collection: 'coles_barcodes' // Explicitly specify collection name
  }
);

const axiosInstance = axios.create({
  timeout: 60000, // 60 seconds
});

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

const getBarcode = async () => {
  try {
    await dbConnect();
    const db = await db2();
    // Use the correct collection name 'coles_barcodes'
    const ColesBarcode = db.model('ColesBarcode', barcodeSchema);
    
    const products = await Product.find({
      $or: [
        { barcode: null },
        { barcode: { $exists: false } },
        { barcode: "" }
      ]
    });
    
    console.log('products length:', products.length);

    let i = 1;
    await Promise.allSettled(
      products.map(async (product, index) => {
        try {
          const barcode = await ColesBarcode.findOne({ coles_product_id: product.coles_product_id });
          if (!barcode) {
            const { data } = await axiosInstance.get(`https://barcodes.groceryscraper.mc.hzuccon.com/barcode?product=${product.coles_product_id}`);
            console.log(`data${i}`, `${data}-${product.name}`);
            product.barcode = data;
            const barcodes = new ColesBarcode({ coles_product_id: product.coles_product_id, barcode: data });
            await barcodes.save();
          } else {
            console.log('barcodes', barcode);
            product.barcode = barcode.barcode;
          }
          
          await product.save();
        } catch (error) {
          console.log('no product barcode found', 'skip');
        }
        i++;
      })
    );
    return;
  } catch (err) {
    console.error('Error Details:', {
      message: err.message,
      config: err.config,
      code: err.code,
      response: err.response?.data,
    });
    return '';
  }
};

(async () => {
  const a = await getBarcode();
  console.log('a', a);
})();




// import axios from 'axios';
// import fs from 'fs';
// import path from 'path';
// import Product from './models/products.js';
// import dbConnect from './db/dbConnect.js';
// import dotenv from 'dotenv';

// dotenv.config();

// const BARCODE_BACKUP_PATH = path.resolve('./coles/barcode/colesGeneralBarcodeLookup.json');

// const axiosInstance = axios.create({
//   timeout: 60000,
// });

// // Load existing barcode backup if available
// let localBarcodeCache = {};
// if (fs.existsSync(BARCODE_BACKUP_PATH)) {
//   try {
//     localBarcodeCache = JSON.parse(fs.readFileSync(BARCODE_BACKUP_PATH, 'utf-8'));
//     console.log(`📁 Loaded ${Object.keys(localBarcodeCache).length} barcodes from colesGeneralBarcodeLookup.json`);
//   } catch (err) {
//     console.error('❌ Failed to parse colesGeneralBarcodeLookup.json:', err.message);
//   }
// }

// const getBarcodesFromAPI = async () => {
//   try {
//     await dbConnect();

//     const products = await Product.find({
//       $or: [
//         { barcode: null },
//         { barcode: { $exists: false } },
//         { barcode: '' },
//       ],
//     });

//     console.log('🧮 Total products missing barcode:', products.length);

//     let successCount = 0;
//     let failCount = 0;
//     let i = 1;
//     let updatedBackup = false;

//     await Promise.allSettled(
//       products.map(async (product) => {
//         const productId = product.coles_product_id;
//         const localBarcode = localBarcodeCache[productId];

//         try {
//           let barcode;

//           if (localBarcode) {
//             // Use cached barcode
//             barcode = localBarcode;
//             console.log(`💾 ${i}: Used cached barcode for ${productId} -> ${barcode}`);
//           } else {
//             // Fetch from API
//             const { data } = await axiosInstance.get(
//               `https://barcodes.groceryscraper.mc.hzuccon.com/barcode?product=${productId}`
//             );

//             if (!data) {
//               console.log(`⚠️ ${i}: No barcode returned for ${productId}`);
//               failCount++;
//               i++;
//               return;
//             }

//             barcode = data;
//             localBarcodeCache[productId] = String(barcode);
//             updatedBackup = true;
//             console.log(`🌐 ${i}: API barcode for ${productId} -> ${barcode}`);
//           }

//           product.barcode = barcode;
//           await product.save();
//           successCount++;
//         } catch (err) {
//           console.log(`❌ ${i}: Failed to get/save barcode for ${productId} - ${err.message}`);
//           failCount++;
//         }

//         i++;
//       })
//     );

//     // Write back updated barcode cache if new ones were added
//     if (updatedBackup) {
//       fs.writeFileSync(
//         BARCODE_BACKUP_PATH,
//         JSON.stringify(localBarcodeCache, null, 2),
//         'utf-8'
//       );
//       console.log(`💾 Backup updated: ${BARCODE_BACKUP_PATH}`);
//     }

//     console.log('\n🎉 All done!');
//     console.log('✅ Barcodes updated:', successCount);
//     console.log('❌ Failed updates:', failCount);
//   } catch (err) {
//     console.error('Global error:', err.message);
//   }
// };

// (async () => {
//   await getBarcodesFromAPI();
// })();


