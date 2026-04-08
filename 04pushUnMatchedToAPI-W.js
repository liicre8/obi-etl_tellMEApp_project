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
      console.log(`🚀 Sending batch ${batchNumber} (${chunk.length} products)`);

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
