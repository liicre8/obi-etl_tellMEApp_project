// pushUnMatchedToAPI-C.js
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
    const data = JSON.parse(rawData);
    console.log(`📦 Total products in file: ${data.length}`);
    console.log(`🚀 Uploading from index ${startIndex} to ${data.length}`);

    let totalProductsPushed = 0;
    let batchNumber = 1;
    let failedProducts = [];
    let pushedProducts = [];

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = startIndex; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);

      try {
        const externalApiUrl = process.env.JARROD_API;
        const apiKey = process.env.JARROD_KEY;

        const response = await axios.post(externalApiUrl, chunk, {
          headers: {
            accept: 'application/json',
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          httpAgent,
          httpsAgent
        });

        console.log(`✅ Success! Batch ${batchNumber}: Sent ${chunk.length} products.`);
        totalProductsPushed += chunk.length;
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

            const remainingProducts = chunk.filter(p => p.name !== productName);
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
                pushedProducts.push(...remainingProducts);
              } catch (retryErr) {
                console.error(`❌ Retry failed for batch ${batchNumber}:`, retryErr.message);
                failedProducts.push(...remainingProducts);
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

  } catch (error) {
    console.error('❌ Error reading or processing the output file:', error);
  }
})();








// // pushProducts.mjs
// import dotenv from 'dotenv';
// dotenv.config();

// import fs from 'fs/promises';
// import path from 'path';
// import axios from 'axios';
// import axiosRetry from 'axios-retry';
// import { fileURLToPath } from 'url';
// import http from 'http';
// import https from 'https';

// // Create __dirname equivalent for ES Modules
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// // Retrieve folder date from .env
// const folderDate = process.env.FOLDER_DATE; // e.g., "3-25-2025"
// if (!folderDate) {
//   console.error('❌ FOLDER_DATE is not defined in .env');
//   process.exit(1);
// }

// // Set the base directory for the files
// const baseDir = path.join(__dirname, 'UMforUpload', folderDate);

// // Set API details
// const externalApiUrl = process.env.JARROD_API;
// const apiKey = process.env.JARROD_KEY;
// if (!externalApiUrl || !apiKey) {
//   console.error('❌ API details are missing. Check .env settings.');
//   process.exit(1);
// }

// // Set the chunk size for sending requests
// const chunkSize = 5;

// // Create Keep-Alive agents
// const httpAgent = new http.Agent({ keepAlive: true });
// const httpsAgent = new https.Agent({ keepAlive: true });

// // Configure Axios retry logic
// axiosRetry(axios, {
//   retries: 2, // Number of retries
//   retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
//   retryCondition: (error) => {
//     return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
//   },
// });

// // Function to introduce delay
// const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// // Function to get all JSON files recursively
// async function getJsonFiles(dir) {
//   let files = [];
//   try {
//     const items = await fs.readdir(dir, { withFileTypes: true });

//     for (const item of items) {
//       const fullPath = path.join(dir, item.name);
//       if (item.isDirectory()) {
//         const subFiles = await getJsonFiles(fullPath);
//         files = files.concat(subFiles);
//       } else if (item.isFile() && item.name.endsWith('.json')) {
//         files.push(fullPath);
//       }
//     }
//   } catch (error) {
//     console.error(`❌ Error reading directory ${dir}:`, error);
//   }
//   return files;
// }

// // Function to push products to the API
// async function pushProducts(filePath) {
//   try {
//     const rawData = await fs.readFile(filePath, 'utf8');
//     const data = JSON.parse(rawData);

//     if (!Array.isArray(data) || data.length === 0) {
//       console.log(`⏩ Skipping empty file: ${filePath}`);
//       return;
//     }

//     console.log(`📂 Processing file: ${filePath} (${data.length} products)`);

//     let totalProductsPushed = 0;
//     let batchNumber = 1;

//     for (let i = 0; i < data.length; i += chunkSize) {
//       const chunk = data.slice(i, i + chunkSize);
//       console.log(`🚀 Sending batch ${batchNumber} with ${chunk.length} objects`);

//       try {
//         const response = await axios.post(externalApiUrl, chunk, {
//           headers: {
//             accept: 'application/json',
//             'X-API-Key': apiKey,
//             'Content-Type': 'application/json',
//           },
//         });

//         console.log(`✅ Batch ${batchNumber}: Sent ${chunk.length} objects. Response:`, response.data);
//         totalProductsPushed += chunk.length;
//         batchNumber++;
//       } catch (error) {
//         if (error.response) {
//           console.error(`❌ API error (batch ${batchNumber}):`, error.response.data);
//         } else if (error.request) {
//           console.error(`❌ No response received (batch ${batchNumber}):`, error.message);
//         } else {
//           console.error(`❌ Unexpected error (batch ${batchNumber}):`, error.message);
//         }
//       }

//       await delay(2000); // Pause between requests
//     }

//     console.log(`✅ Finished processing ${filePath}. Total pushed: ${totalProductsPushed}\n`);
//   } catch (error) {
//     console.error(`❌ Error reading or pushing ${filePath}:`, error);
//   }
// }

// // Main function to process all JSON files
// (async () => {
//   try {
//     const files = await getJsonFiles(baseDir);
//     console.log(`📂 Found ${files.length} files to process.`);

//     for (const file of files) {
//       await pushProducts(file);
//     }

//     console.log('✅ All files processed successfully.');
//   } catch (error) {
//     console.error('❌ Error during processing:', error);
//   }
// })();

