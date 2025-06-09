// File: pushUnMatchedToAPI-C.js
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const folderDate = process.env.FOLDER_DATE;
if (!folderDate) {
  console.error('❌ FOLDER_DATE is not defined in .env');
  process.exit(1);
}

const fileName = "colesUnMatched.json";
const outputFilePath = path.join(__dirname, 'UnMatchedAll', folderDate, fileName);

const chunkSize = 100;
const startIndex = 0;

const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

axiosRetry(axios, {
  retries: 2,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
  },
});

(async () => {
  try {
    const rawData = await fs.readFile(outputFilePath, 'utf8');
    const originalData = JSON.parse(rawData);
    console.log(`📦 Total products in file: ${originalData.length}`);
    console.log(`🚀 Uploading from index ${startIndex} to ${originalData.length}`);

    let totalProductsPushed = 0;
    let cleanedUnitsCount = 0;
    let batchNumber = 1;
    let failedProducts = [];
    let pushedProducts = [];

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // Clean units like in pushMatchedToAPI.js
    const cleanedData = originalData.map(item => {
      const cleanedPrices = item.prices.map(price => {
        let cleanedUnit = price.price_unit;

        if (cleanedUnit) {
          if (cleanedUnit.includes('WAS')) {
            const original = cleanedUnit;
            cleanedUnit = cleanedUnit.split('WAS')[0].trim();
            console.log(`🧹 Cleaned unit from "${original}" to "${cleanedUnit}" for product "${item.name}"`);
            cleanedUnitsCount++;
          }
          if (cleanedUnit.includes('|')) {
            const original = cleanedUnit;
            cleanedUnit = cleanedUnit.split('|')[0].trim();
            console.log(`🧹 Cleaned unit from "${original}" to "${cleanedUnit}" for product "${item.name}"`);
            cleanedUnitsCount++;
          }
        }

        return {
          ...price,
          unit: cleanedUnit || null // Use cleaned 'unit' field
        };
      });

      return {
        ...item,
        prices: cleanedPrices
      };
    });

    for (let i = startIndex; i < cleanedData.length; i += chunkSize) {
      const chunk = cleanedData.slice(i, i + chunkSize);

      // Transform to match API schema
      const payload = chunk.map(item => ({
        name: item.name,
        imageUrl: item.image_url,
        sourceUrl: item.source_url,
        sourceId: item.source_id,
        barcode: item.barcode,
        categoryId: item.category_id,
        shop: item.shop,
        weight: item.weight,
        prices: item.prices.map(price => ({
          state: price.state,
          price: Number(price.price),
          pricePerUnit: price.price_per_unit ? Number(price.price_per_unit) : null,
          unit: price.unit || null
        }))
      }));

      try {
        const externalApiUrl = process.env.JARROD_API;
        const apiKey = process.env.JARROD_KEY;

        const response = await axios.post(externalApiUrl, payload, {
          headers: {
            accept: 'application/json',
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          httpAgent,
          httpsAgent
        });

        console.log(`✅ Success! Batch ${batchNumber}: Sent ${payload.length} products.`);
        totalProductsPushed += payload.length;
        pushedProducts.push(...chunk);
        batchNumber++;

      } catch (error) {
        if (error.response && error.response.data?.detail) {
          const detail = error.response.data.detail;

          const match = detail.match(/Category '(\d+)' wasn't found when trying to import product '(.*?)'/);
          if (match) {
            const [, missingCatId, productName] = match;
            console.warn(`⚠️ Skipping invalid category '${missingCatId}' for "${productName}"`);

            const failedProduct = chunk.find(p => p.name === productName);
            if (failedProduct) failedProducts.push(failedProduct);

            const remaining = chunk.filter(p => p.name !== productName);
            if (remaining.length > 0) {
              try {
                const retryPayload = remaining.map(item => ({
                  name: item.name,
                  imageUrl: item.image_url,
                  sourceUrl: item.source_url,
                  sourceId: item.source_id,
                  barcode: item.barcode,
                  categoryId: item.category_id,
                  shop: item.shop,
                  weight: item.weight,
                  prices: item.prices.map(price => ({
                    state: price.state,
                    price: Number(price.price),
                    pricePerUnit: price.price_per_unit ? Number(price.price_per_unit) : null,
                    unit: price.unit || null
                  }))
                }));

                const retryResponse = await axios.post(externalApiUrl, retryPayload, {
                  headers: {
                    accept: 'application/json',
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json',
                  },
                  httpAgent,
                  httpsAgent
                });

                console.log(`🔁 Retry Batch ${batchNumber}: Pushed ${remaining.length} products.`);
                totalProductsPushed += remaining.length;
                pushedProducts.push(...remaining);
              } catch (retryErr) {
                console.error(`❌ Retry failed for batch ${batchNumber}:`, retryErr.message);
                failedProducts.push(...remaining);
              }
            }

          } else {
            console.error(`❌ API error (batch ${batchNumber}):`, detail);
            failedProducts.push(...chunk);
          }

        } else if (error.request) {
          console.error(`❌ No response for batch ${batchNumber}:`, error.message);
          failedProducts.push(...chunk);
        } else {
          console.error(`❌ Unexpected error for batch ${batchNumber}:`, error.message);
          failedProducts.push(...chunk);
        }
      }

      await delay(2000);
    }

    // Save failed products
    if (failedProducts.length > 0) {
      const failedDir = path.join(__dirname, 'failedUploads-UMC');
      await fs.mkdir(failedDir, { recursive: true });
      const failedOutputPath = path.join(failedDir, `failedUnmatchedPush_${folderDate}.json`);
      try {
        await fs.writeFile(failedOutputPath, JSON.stringify(failedProducts, null, 2), 'utf8');
        console.log(`🚨 Saved ${failedProducts.length} failed products to ${failedOutputPath}`);
      } catch (writeErr) {
        console.error('❌ Failed to write failed products JSON:', writeErr);
      }
    }

    // Save successful products
    if (pushedProducts.length > 0) {
      const successDir = path.join(__dirname, 'UploadedData-UMC');
      await fs.mkdir(successDir, { recursive: true });
      const successOutputPath = path.join(successDir, `ColesPushData_${folderDate}.json`);
      try {
        await fs.writeFile(successOutputPath, JSON.stringify(pushedProducts, null, 2), 'utf8');
        console.log(`📂 Saved ${pushedProducts.length} successfully pushed products to ${successOutputPath}`);
      } catch (writeErr) {
        console.error('❌ Failed to write successful products JSON:', writeErr);
      }
    }

    console.log(`✅ All batches processed. Total successfully pushed: ${totalProductsPushed}`);
    console.log(`🧼 Total units cleaned: ${cleanedUnitsCount}`);

  } catch (error) {
    console.error('❌ Error reading or processing the output file:', error);
  }
})();

// // File: pushUnMatchedToAPI-C.js - LATEST
// import dotenv from 'dotenv';
// dotenv.config();

// import fs from 'fs/promises';
// import path from 'path';
// import axios from 'axios';
// import axiosRetry from 'axios-retry';
// import { fileURLToPath } from 'url';
// import http from 'http';
// import https from 'https';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const folderDate = process.env.FOLDER_DATE;
// if (!folderDate) {
//   console.error('❌ FOLDER_DATE is not defined in .env');
//   process.exit(1);
// }

// const fileName = "colesUnMatched.json";
// const outputFilePath = path.join(__dirname, 'UnMatchedAll', folderDate, fileName);

// const chunkSize = 100;
// const startIndex = 0;

// const httpAgent = new http.Agent({ keepAlive: true });
// const httpsAgent = new https.Agent({ keepAlive: true });

// axiosRetry(axios, {
//   retries: 2,
//   retryDelay: axiosRetry.exponentialDelay,
//   retryCondition: (error) => {
//     return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
//   },
// });

// (async () => {
//   try {
//     const rawData = await fs.readFile(outputFilePath, 'utf8');
//     const originalData = JSON.parse(rawData);
//     console.log(`📦 Total products in file: ${originalData.length}`);
//     console.log(`🚀 Uploading from index ${startIndex} to ${originalData.length}`);

//     let totalProductsPushed = 0;
//     let cleanedUnitsCount = 0;
//     let batchNumber = 1;
//     let failedProducts = [];
//     let pushedProducts = [];

//     const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//     // Clean units like in pushMatchedToAPI.js
//     const cleanedData = originalData.map(item => {
//       const cleanedPrices = item.prices.map(price => {
//         let cleanedUnit = price.price_unit;

//         if (cleanedUnit) {
//           if (cleanedUnit.includes('WAS')) {
//             const original = cleanedUnit;
//             cleanedUnit = cleanedUnit.split('WAS')[0].trim();
//             console.log(`🧹 Cleaned unit from "${original}" to "${cleanedUnit}" for product "${item.name}"`);
//             cleanedUnitsCount++;
//           }
//           if (cleanedUnit.includes('|')) {
//             const original = cleanedUnit;
//             cleanedUnit = cleanedUnit.split('|')[0].trim();
//             console.log(`🧹 Cleaned unit from "${original}" to "${cleanedUnit}" for product "${item.name}"`);
//             cleanedUnitsCount++;
//           }
//         }

//         return {
//           ...price,
//           unit: cleanedUnit || null // Use cleaned 'unit' field
//         };
//       });

//       return {
//         ...item,
//         prices: cleanedPrices
//       };
//     });

//     for (let i = startIndex; i < cleanedData.length; i += chunkSize) {
//       const chunk = cleanedData.slice(i, i + chunkSize);

//       // Transform to match API schema
//       const payload = chunk.map(item => ({
//         name: item.name,
//         imageUrl: item.image_url,
//         sourceUrl: item.source_url,
//         sourceId: item.source_id,
//         barcode: item.barcode,
//         categoryId: item.category_id,
//         shop: item.shop,
//         weight: item.weight,
//         prices: item.prices.map(price => ({
//           state: price.state,
//           price: Number(price.price),
//           pricePerUnit: price.price_per_unit ? Number(price.price_per_unit) : null,
//           unit: price.unit || null
//         }))
//       }));

//       try {
//         const externalApiUrl = process.env.JARROD_API;
//         const apiKey = process.env.JARROD_KEY;

//         const response = await axios.post(externalApiUrl, payload, {
//           headers: {
//             accept: 'application/json',
//             'X-API-Key': apiKey,
//             'Content-Type': 'application/json',
//           },
//           httpAgent,
//           httpsAgent
//         });

//         console.log(`✅ Success! Batch ${batchNumber}: Sent ${payload.length} products.`);
//         totalProductsPushed += payload.length;
//         pushedProducts.push(...chunk);
//         batchNumber++;

//       } catch (error) {
//         if (error.response && error.response.data?.detail) {
//           const detail = error.response.data.detail;

//           const match = detail.match(/Category '(\d+)' wasn't found when trying to import product '(.*?)'/);
//           if (match) {
//             const [, missingCatId, productName] = match;
//             console.warn(`⚠️ Skipping invalid category '${missingCatId}' for "${productName}"`);

//             const failedProduct = chunk.find(p => p.name === productName);
//             if (failedProduct) failedProducts.push(failedProduct);

//             const remaining = chunk.filter(p => p.name !== productName);
//             if (remaining.length > 0) {
//               try {
//                 const retryPayload = remaining.map(item => ({
//                   name: item.name,
//                   imageUrl: item.image_url,
//                   sourceUrl: item.source_url,
//                   sourceId: item.source_id,
//                   barcode: item.barcode,
//                   categoryId: item.category_id,
//                   shop: item.shop,
//                   weight: item.weight,
//                   prices: item.prices.map(price => ({
//                     state: price.state,
//                     price: Number(price.price),
//                     pricePerUnit: price.price_per_unit ? Number(price.price_per_unit) : null,
//                     unit: price.unit || null
//                   }))
//                 }));

//                 const retryResponse = await axios.post(externalApiUrl, retryPayload, {
//                   headers: {
//                     accept: 'application/json',
//                     'X-API-Key': apiKey,
//                     'Content-Type': 'application/json',
//                   },
//                   httpAgent,
//                   httpsAgent
//                 });

//                 console.log(`🔁 Retry Batch ${batchNumber}: Pushed ${remaining.length} products.`);
//                 totalProductsPushed += remaining.length;
//                 pushedProducts.push(...remaining);
//               } catch (retryErr) {
//                 console.error(`❌ Retry failed for batch ${batchNumber}:`, retryErr.message);
//                 failedProducts.push(...remaining);
//               }
//             }

//           } else {
//             console.error(`❌ API error (batch ${batchNumber}):`, detail);
//             failedProducts.push(...chunk);
//           }

//         } else if (error.request) {
//           console.error(`❌ No response for batch ${batchNumber}:`, error.message);
//           failedProducts.push(...chunk);
//         } else {
//           console.error(`❌ Unexpected error for batch ${batchNumber}:`, error.message);
//           failedProducts.push(...chunk);
//         }
//       }

//       await delay(2000);
//     }

//     // Save failed products
//     if (failedProducts.length > 0) {
//       const failedDir = path.join(__dirname, 'failedUploads-UMC');
//       await fs.mkdir(failedDir, { recursive: true });
//       const failedOutputPath = path.join(failedDir, `failedUnmatchedPush_${folderDate}.json`);
//       try {
//         await fs.writeFile(failedOutputPath, JSON.stringify(failedProducts, null, 2), 'utf8');
//         console.log(`🚨 Saved ${failedProducts.length} failed products to ${failedOutputPath}`);
//       } catch (writeErr) {
//         console.error('❌ Failed to write failed products JSON:', writeErr);
//       }
//     }

//     // Save successful products
//     if (pushedProducts.length > 0) {
//       const successDir = path.join(__dirname, 'UploadedData-UMC');
//       await fs.mkdir(successDir, { recursive: true });
//       const successOutputPath = path.join(successDir, `ColesPushData_${folderDate}.json`);
//       try {
//         await fs.writeFile(successOutputPath, JSON.stringify(pushedProducts, null, 2), 'utf8');
//         console.log(`📂 Saved ${pushedProducts.length} successfully pushed products to ${successOutputPath}`);
//       } catch (writeErr) {
//         console.error('❌ Failed to write successful products JSON:', writeErr);
//       }
//     }

//     console.log(`✅ All batches processed. Total successfully pushed: ${totalProductsPushed}`);
//     console.log(`🧼 Total units cleaned: ${cleanedUnitsCount}`);

//   } catch (error) {
//     console.error('❌ Error reading or processing the output file:', error);
//   }
// })();
