// pushUnMatchedToAPI-W.js
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

const fileName = "woolworthsUnMatched.json";
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

const transformProduct = (item) => ({
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
});

(async () => {
  try {
    const externalApiUrl = process.env.JARROD_API;
    const apiKey = process.env.JARROD_KEY;

    if (!externalApiUrl) {
      console.error('❌ Environment variable JARROD_API is missing or null.');
      process.exit(1);
    }
    if (!apiKey) {
      console.error('❌ Environment variable JARROD_KEY is missing or null.');
      process.exit(1);
    }

    const rawData = await fs.readFile(outputFilePath, 'utf8');
    const data = JSON.parse(rawData);
    console.log(`📦 Total products in file: ${data.length}`);
    console.log(`🚀 Uploading from index ${startIndex} to ${data.length}`);

    const totalBatches = Math.ceil(data.length / chunkSize);

    let totalProductsPushed = 0;
    let batchNumber = 1;
    let failedProducts = [];
    let pushedProducts = [];

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = startIndex; i < data.length; i += chunkSize) {
      const rawChunk = data.slice(i, i + chunkSize);
      const chunk = rawChunk.map(transformProduct);
      console.log(`🚀 Sending batch ${batchNumber} (${chunk.length} products)`);

      try {
        const response = await axios.post(externalApiUrl, chunk, {
          headers: {
            accept: 'application/json',
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          httpAgent,
          httpsAgent
        });

        // Log success with batch numbers and API response, showing 'null' if response.data is null
        console.log(`Success! Batch ${batchNumber}-${totalBatches} of ${totalBatches}, API Response: ${response.data === null ? 'null' : JSON.stringify(response.data)}`);

        totalProductsPushed += chunk.length;
        pushedProducts.push(...rawChunk);
        batchNumber++;

      } catch (error) {
        if (error.response && error.response.data?.detail) {
          const detail = error.response.data.detail;
          const match = detail.match(/Category '(\d+)' wasn't found when trying to import product '(.*?)'/);

          if (match) {
            const [, missingCatId, productName] = match;
            console.warn(`⚠️ Skipping invalid category '${missingCatId}' for "${productName}"`);

            const failedProduct = rawChunk.find(p => p.name === productName);
            if (failedProduct) failedProducts.push(failedProduct);

            const remainingRaw = rawChunk.filter(p => p.name !== productName);
            const remainingProducts = remainingRaw.map(transformProduct);

            if (remainingProducts.length > 0) {
              try {
                const retryResponse = await axios.post(externalApiUrl, remainingProducts, {
                  headers: {
                    accept: 'application/json',
                    'X-API-Key': apiKey,
                    'Content-Type': 'application/json',
                  },
                  httpAgent,
                  httpsAgent
                });
                console.log(`🔁 Retry Batch ${batchNumber}: Pushed ${remainingProducts.length} products.`);
                totalProductsPushed += remainingProducts.length;
                pushedProducts.push(...remainingRaw);
              } catch (retryErr) {
                console.error(`❌ Retry failed for batch ${batchNumber}:`, retryErr.message);
                failedProducts.push(...remainingRaw);
              }
            }
          } else {
            console.error(`❌ API error (batch ${batchNumber}):`, detail);
            failedProducts.push(...rawChunk);
          }

        } else if (error.request) {
          console.error(`❌ No response for batch ${batchNumber}:`, error.message);
          failedProducts.push(...rawChunk);
        } else {
          console.error(`❌ Unexpected error for batch ${batchNumber}:`, error.message);
          failedProducts.push(...rawChunk);
        }
      }

      await delay(2000);
    }

    if (failedProducts.length > 0) {
      const failedDir = path.join(__dirname, 'failedUploads-UMW');
      await fs.mkdir(failedDir, { recursive: true });
      const failedOutputPath = path.join(failedDir, `failedUnmatchedPush_${folderDate}.json`);
      try {
        await fs.writeFile(failedOutputPath, JSON.stringify(failedProducts, null, 2), 'utf8');
        console.log(`🚨 Saved ${failedProducts.length} failed products to ${failedOutputPath}`);
      } catch (writeErr) {
        console.error('❌ Failed to write failed products JSON:', writeErr);
      }
    }

    if (pushedProducts.length > 0) {
      const successDir = path.join(__dirname, 'UploadedData-UMW');
      await fs.mkdir(successDir, { recursive: true });
      const successOutputPath = path.join(successDir, `WoolworthsPushData_${folderDate}.json`);
      try {
        await fs.writeFile(successOutputPath, JSON.stringify(pushedProducts, null, 2), 'utf8');
        console.log(`📂 Saved ${pushedProducts.length} successfully pushed products to ${successOutputPath}`);
      } catch (writeErr) {
        console.error('❌ Failed to write successful products JSON:', writeErr);
      }
    }

    console.log(`✅ All batches processed. Total successfully pushed: ${totalProductsPushed}`);
  } catch (error) {
    console.error('❌ Error reading or processing the output file:', error);
  }
})();

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

// const fileName = "woolworthsUnMatched.json";
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

// const transformProduct = (item) => ({
//   name: item.name,
//   imageUrl: item.image_url,
//   sourceUrl: item.source_url,
//   sourceId: item.source_id,
//   barcode: item.barcode,
//   categoryId: item.category_id,
//   shop: item.shop,
//   weight: item.weight,
//   prices: item.prices.map(price => ({
//     state: price.state,
//     price: Number(price.price),
//     pricePerUnit: price.price_per_unit ? Number(price.price_per_unit) : null,
//     unit: price.unit || null
//   }))
// });

// (async () => {
//   try {
//     // Check critical env variables
//     const externalApiUrl = process.env.JARROD_API;
//     const apiKey = process.env.JARROD_KEY;

//     if (!externalApiUrl) {
//       console.error('❌ Environment variable JARROD_API is missing or null.');
//       process.exit(1);
//     }
//     if (!apiKey) {
//       console.error('❌ Environment variable JARROD_KEY is missing or null.');
//       process.exit(1);
//     }

//     const rawData = await fs.readFile(outputFilePath, 'utf8');
//     const data = JSON.parse(rawData);
//     console.log(`📦 Total products in file: ${data.length}`);
//     console.log(`🚀 Uploading from index ${startIndex} to ${data.length}`);

//     let totalProductsPushed = 0;
//     let batchNumber = 1;
//     let failedProducts = [];
//     let pushedProducts = [];

//     const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

//     for (let i = startIndex; i < data.length; i += chunkSize) {
//       const rawChunk = data.slice(i, i + chunkSize);
//       const chunk = rawChunk.map(transformProduct);
//       console.log(`🚀 Sending batch ${batchNumber} (${chunk.length} products)`);

//       try {
//         const response = await axios.post(externalApiUrl, chunk, {
//           headers: {
//             accept: 'application/json',
//             'X-API-Key': apiKey,
//             'Content-Type': 'application/json',
//           },
//           httpAgent,
//           httpsAgent
//         });

//         console.log(`✅ Success! Batch ${batchNumber}: Sent ${chunk.length} products.`);
//         totalProductsPushed += chunk.length;
//         pushedProducts.push(...rawChunk); // Save raw form for logging
//         batchNumber++;

//       } catch (error) {
//         if (error.response && error.response.data?.detail) {
//           const detail = error.response.data.detail;
//           const match = detail.match(/Category '(\d+)' wasn't found when trying to import product '(.*?)'/);

//           if (match) {
//             const [, missingCatId, productName] = match;
//             console.warn(`⚠️ Skipping invalid category '${missingCatId}' for "${productName}"`);

//             const failedProduct = rawChunk.find(p => p.name === productName);
//             if (failedProduct) failedProducts.push(failedProduct);

//             const remainingRaw = rawChunk.filter(p => p.name !== productName);
//             const remainingProducts = remainingRaw.map(transformProduct);

//             if (remainingProducts.length > 0) {
//               try {
//                 const retryResponse = await axios.post(externalApiUrl, remainingProducts, {
//                   headers: {
//                     accept: 'application/json',
//                     'X-API-Key': apiKey,
//                     'Content-Type': 'application/json',
//                   },
//                   httpAgent,
//                   httpsAgent
//                 });
//                 console.log(`🔁 Retry Batch ${batchNumber}: Pushed ${remainingProducts.length} products.`);
//                 totalProductsPushed += remainingProducts.length;
//                 pushedProducts.push(...remainingRaw);
//               } catch (retryErr) {
//                 console.error(`❌ Retry failed for batch ${batchNumber}:`, retryErr.message);
//                 failedProducts.push(...remainingRaw);
//               }
//             }
//           } else {
//             console.error(`❌ API error (batch ${batchNumber}):`, detail);
//             failedProducts.push(...rawChunk);
//           }

//         } else if (error.request) {
//           console.error(`❌ No response for batch ${batchNumber}:`, error.message);
//           failedProducts.push(...rawChunk);
//         } else {
//           console.error(`❌ Unexpected error for batch ${batchNumber}:`, error.message);
//           failedProducts.push(...rawChunk);
//         }
//       }

//       await delay(2000);
//     }

//     if (failedProducts.length > 0) {
//       const failedDir = path.join(__dirname, 'failedUploads-UMW');
//       await fs.mkdir(failedDir, { recursive: true });
//       const failedOutputPath = path.join(failedDir, `failedUnmatchedPush_${folderDate}.json`);
//       try {
//         await fs.writeFile(failedOutputPath, JSON.stringify(failedProducts, null, 2), 'utf8');
//         console.log(`🚨 Saved ${failedProducts.length} failed products to ${failedOutputPath}`);
//       } catch (writeErr) {
//         console.error('❌ Failed to write failed products JSON:', writeErr);
//       }
//     }

//     if (pushedProducts.length > 0) {
//       const successDir = path.join(__dirname, 'UploadedData-UMW');
//       await fs.mkdir(successDir, { recursive: true });
//       const successOutputPath = path.join(successDir, `WoolworthsPushData_${folderDate}.json`);
//       try {
//         await fs.writeFile(successOutputPath, JSON.stringify(pushedProducts, null, 2), 'utf8');
//         console.log(`📂 Saved ${pushedProducts.length} successfully pushed products to ${successOutputPath}`);
//       } catch (writeErr) {
//         console.error('❌ Failed to write successful products JSON:', writeErr);
//       }
//     }

//     console.log(`✅ All batches processed. Total successfully pushed: ${totalProductsPushed}`);
//   } catch (error) {
//     console.error('❌ Error reading or processing the output file:', error);
//   }
// })();
