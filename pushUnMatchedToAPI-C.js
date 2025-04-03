// pushOutput.mjs
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { fileURLToPath } from 'url';
import http from 'http';
import https from 'https';

// Create __dirname equivalent for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Retrieve folder date from .env
const folderDate = process.env.FOLDER_DATE; // e.g., "3-12-2025"
if (!folderDate) {
  console.error('❌ FOLDER_DATE is not defined in .env');
  process.exit(1);
}

// Set the file name for the output JSON file (from previous transformation)
const fileName = "colesUnMatched.json"; // adjust as needed

// Define file path based on folder date and file name
const outputFilePath = path.join(__dirname, 'UnMatchedAll', folderDate, fileName);

// Set the chunk size
const chunkSize = 50;

// Retrieve the starting index from the environment variables; default is 0.
const startIndex = 10600;

// Create Keep-Alive agents
const httpAgent = new http.Agent({ keepAlive: true });
const httpsAgent = new https.Agent({ keepAlive: true });

// Configure Axios retry logic
axiosRetry(axios, {
  retries: 2, // Number of retries
  retryDelay: axiosRetry.exponentialDelay, // Exponential backoff
  retryCondition: (error) => {
    // Retry only for network errors or 5xx errors (including 504)
    return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
  },
});

(async () => {
  try {
    // Read the cleaned JSON output file
    const rawData = await fs.readFile(outputFilePath, 'utf8');
    const data = JSON.parse(rawData);
    console.log(`Total objects in output file: ${data.length}`);

    // Log the upload range
    console.log(`Uploading objects from index ${startIndex} to ${data.length}`);

    let totalProductsPushed = 0;
    let batchNumber = 1;

    // Iterate over the data in chunks starting from startIndex
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    for (let i = startIndex; i < data.length; i += chunkSize) {
    //  await delay(2000);
      const chunk = data.slice(i, i + chunkSize);
      // console.log(`🚀 Sending batch ${batchNumber} with ${chunk.length} objects (Index ${i + 1} to ${i + chunk.length} of ${data.length})`);
      // chunk.forEach((obj, index) => {
      //   console.log(`🔹 Object ${index + 1} in batch ${batchNumber}:`, obj.name);
    // });
      try {
        const externalApiUrl = process.env.JARROD_API;
        const apiKey = process.env.JARROD_KEY;
        const response = await axios.post(externalApiUrl, chunk, {
          headers: {
            accept: 'application/json',
            'X-API-Key': apiKey,
            'Content-Type': 'application/json',
          },
          // timeout: 70000, // 70 seconds timeout
          // httpAgent,
          // httpsAgent,
        });
        console.log(
          `✅ Success! Batch ${batchNumber}: Sent objects ${i + 1} to ${i + chunk.length}. API Response: ${response.data}`
        );
        totalProductsPushed += chunk.length;
        batchNumber++;
      } catch (error) {
        if (error.response) {
          console.error(`❌ Error response for batch ${batchNumber}:`, chunk, error.response.data);
        } else if (error.request) {
          console.error(`❌ No response received for batch ${batchNumber}:`,response.headers, error.message);
        } else {
          console.error(`❌ Error for batch ${batchNumber}:`, error.message);
        }
      }
      await delay(2000);
    }
    console.log(`✅ All batches processed. Total objects pushed: ${totalProductsPushed}`);
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

