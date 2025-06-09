//File Path: pushMatchedToAPI.js
import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import path from 'path';
import axios from 'axios';

const MYCATEGORIES = JSON.parse(fs.readFileSync('constant/categories.json', 'utf8'));

const chunkSize = 100;
const skipCount = 0;
let totalProducts = 0;
let cleanedUnitsCount = 0;
let fileNumber = 1;

const getData = async () => {
  for (const categ of MYCATEGORIES) {
    for (const sub of categ.children) {
      for (const ext of sub.children) {
        let matchedData = [];
        const fileName = `${sub.id ?? ''}${ext.id ? ` - ${ext.id}` : ''}.json`;
        const filePath = path.join(`matched/${process.env.FOLDER_DATE}/${categ.id}`, fileName);

        try {
          matchedData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          console.log(`File No. ${fileNumber}: ${fileName} of category ${categ.id}, Object count: ${matchedData.length}`);
          fileNumber++;
        } catch (error) {
          console.log(`Skipping ${fileName}: File not found.`);
          continue;
        }

        // Clean units by removing 'WAS' and '|' content
        const cleanedProducts = matchedData.map(item => {
          const cleanedPrices = item.prices.map(price => {
            let cleanedUnit = price.price_unit;
            
            if (cleanedUnit) {
              // Extract unit before 'WAS' if it exists
              if (cleanedUnit.includes('WAS')) {
                const originalUnit = cleanedUnit;
                cleanedUnit = cleanedUnit.split('WAS')[0].trim();
                cleanedUnitsCount++;
                console.log(`Cleaned unit from "${originalUnit}" to "${cleanedUnit}" for product "${item.name}"`);
              }
              
              // Remove content after '|' if it exists
              if (cleanedUnit.includes('|')) {
                const originalUnit = cleanedUnit;
                cleanedUnit = cleanedUnit.split('|')[0].trim();
                cleanedUnitsCount++;
                console.log(`Cleaned unit from "${originalUnit}" to "${cleanedUnit}" for product "${item.name}"`);
              }
            }
            
            return {
              ...price,
              price_unit: cleanedUnit
            };
          });
          
          return {
            ...item,
            prices: cleanedPrices
          };
        });

        const validProducts = cleanedProducts;

        totalProducts += validProducts.length;

        // Break into chunks and transform to new schema
        for (let i = skipCount; i < validProducts.length; i += chunkSize) {
          const chunk = validProducts.slice(i, i + chunkSize).map(item => ({
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
              unit: price.price_unit || null
            }))
          }));

          // Preview the transformed data
          // console.log(`\n== Chunk Preview: ${i + 1}-${i + chunk.length} of ${validProducts.length} ==`);
          // console.dir(chunk, { depth: null });

          // Uncomment to push to API
          try {
            const externalApiUrl = process.env.JARROD_API;
            const apiKey = process.env.JARROD_KEY;
            const response = await axios.post(externalApiUrl, chunk, {
              headers: {
                accept: 'application/json',
                'X-API-Key': apiKey,
                'Content-Type': 'application/json',
              },
            });
            console.log(`Success! Batch ${i + 1}-${i + chunk.length} of ${validProducts.length}, API Response:`, response.data);
          } catch (error) {
            if (error.response) {
              console.error('Error response:', error.response.status, error.response.data);
            } else if (error.request) {
              console.error('No response received:', error.request);
            } else {
              console.error('Error:', error.message);
            }
          }
        }
      }
    }
  }

  console.log('\nTotal Products Processed:', totalProducts);
  console.log('Total Units Cleaned:', cleanedUnitsCount);
};

(async () => {
  await getData();
})();