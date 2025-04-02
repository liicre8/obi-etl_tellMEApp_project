import dotenv from 'dotenv';

dotenv.config();
import categories from './woolworths/constant/categories.js';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from "url";
const MYCATEGORIES = JSON.parse(fs.readFileSync(`constant/categories.json`, 'utf8'));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directoryPath = path.join(__dirname, `coles/data/${process.env.FOLDER_DATE}/`);

const getAllJsonData = (dir) => {
  let allData = [];

  if (!fs.existsSync(dir)) {
    console.error(`❌ Directory not found: ${dir}`);
    return [];
  }

  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    
    // Check if the file is a JSON file
    if (file.endsWith(".json")) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        
        // If the JSON file contains an array, merge it; otherwise, push the object
        if (Array.isArray(data)) {
          allData = allData.concat(data);
        } else {
          allData.push(data);
        }
      } catch (error) {
        console.error(`❌ Error parsing JSON file: ${filePath}`, error);
      }
    }
  });

  return allData;
};

const getData = async () => {
  let totalProducts = 0;
 const ColesData = getAllJsonData(directoryPath);
  for (const categ of categories) {
    const category = categ.category;
    let mycat = category;
    mycat = category;
   
    if (category === 'Snacks & Confectionery') mycat = 'Pantry';
    if (category === 'Deli & Chilled Meals') mycat = 'Deli & Chilled Meats';
    if (category === 'Health & Wellness') mycat = 'Health & Beauty';
    if (category === 'Beauty & Personal Care') mycat = 'Health & Beauty';
    if (category === 'Home & Lifestyle') mycat = 'Household';
    if (category === 'Cleaning & Maintenance') mycat = 'Household';
    if (category === 'Fruit & Veg') mycat = 'Fruit & Vegetables';
    if (category === 'Freezer') mycat = 'Frozen';
    if (category === 'Deli & Chilled Meals') mycat = 'Deli';
 
     // const a = JSON.parse(fs.readFileSync(`coles/data/${process.env.FOLDER_DATE}/${mycat}.json`, 'utf8')); //
      // console.log('cole', ColesData.length);
   
    for (const sub of categ.subCategories) {
      const subCategory = sub.subCategory;
      for (const ext of sub.childItems) {
        const extensionCategory = ext.extensionCategory ? ext.extensionCategory : '';
        let productsMatched = [];
        let woolworthsData;

        try {
          woolworthsData = JSON.parse(fs.readFileSync(`woolworths/data/${process.env.FOLDER_DATE}/${categ.id}/${ext.subId ?? ''}${ext.childId && ` - ${ext.childId}`}.json`, 'utf8'));
          // console.log('woolworthsData', woolworthsData.length);
        } catch (error) {
          continue;
        }
        for (const data of woolworthsData) {
          const filteredProducts = ColesData.filter((p) => {
            if (p.barcode && data.barcode) {
              if (p.barcode.toString() === data.barcode.toString()) { // to compare products inside one folder
                return p;
              }
            } else {
            }
          });
          if (filteredProducts && filteredProducts.length > 0) {
            if (filteredProducts[0].subcategory_id) {
              const cleanPrices = (prices) => (prices ? prices.filter((priceObj) => priceObj.price !== null) : []);


              const filteredPrices1 = cleanPrices(filteredProducts[0].prices);
              const filteredPrices2 = cleanPrices(data.prices); 

              function getUniqueByState(data) {
                const uniqueByState = [];
                const seenStates = new Set();
              
                for (const item of data) {
                  if (!seenStates.has(item.state)) {
                    seenStates.add(item.state);
                    uniqueByState.push(item);
                  }
                }
                return uniqueByState;
              }

              // If both cleaned prices arrays are empty, do not add to productsMatched
              if (filteredPrices1.length > 0 && filteredPrices2.length > 0) {
                const formattedProduct1 = {
                  source_url: filteredProducts[0].source_url || '',
                  name: filteredProducts[0].name || '',
                  image_url: filteredProducts[0].image_url || '',
                  source_id: filteredProducts[0].source_id || '',
                  barcode: filteredProducts[0].barcode || '',
                  shop: filteredProducts[0].shop || '',
                  category_id: data.subsubcategory_id ? data.subsubcategory_id : data.subcategory_id,
                  weight: filteredProducts[0].weight || '',
                  prices: getUniqueByState(filteredPrices1),
                };
                const formattedProduct2 = {
                  source_url: data.source_url || '',
                  name: data.name || '',
                  image_url: data.image_url || '',
                  source_id: data.source_id || '',
                  barcode: data.barcode || '',
                  shop: data.shop || '',
                  category_id: data.subsubcategory_id ? data.subsubcategory_id : data.subcategory_id,
                  weight: data.weight || '',
                  prices: getUniqueByState(filteredPrices2),
                };
                productsMatched.push(formattedProduct1);
                productsMatched.push(formattedProduct2);
              }
            }
          }
        }

        try {
          // now we need to do a filteredProductsMatched id seen in "woolworthsData" variable will be removed so we can know what products in woolworths doesnt match
          if (productsMatched && productsMatched.length > 0) {
            const baseFolder = `./matched/${process.env.FOLDER_DATE}/${ext.catId ? ext.catId : categ.id}`;
            const folderPath = path.join(baseFolder);
            const fileName = `${ext.subId}${ext.childId && ` - ${ext.childId}`}.json`;
            const filePath = path.join(folderPath, fileName);
            if (!fs.existsSync(folderPath)) {
              fs.mkdirSync(folderPath, { recursive: true });
              // console.log(`Created folder: ${folderPath}`);
            }
            if (fs.existsSync(filePath)) {
              // console.log(`File already exists: ${filePath}. Skipping save.`);
              const data = JSON.parse(fs.readFileSync(`matched/${process.env.FOLDER_DATE}/${ext.catId ? ext.catId : categ.id}/${ext.subId}${ext.childId && ` - ${ext.childId}`}.json`, 'utf8'));
              const combinedData = [...data, ...productsMatched];

              // Remove duplicates based on source_id
              const uniqueData = combinedData.filter((item, index, self) => index === self.findIndex((t) => t.source_id === item.source_id && t.shop === item.shop));
              fs.writeFileSync(filePath, JSON.stringify(uniqueData, null, 2));
            } else {
              fs.mkdirSync(folderPath, { recursive: true });
              // console.log(`Created folder: ${folderPath}`);
              fs.writeFileSync(filePath, JSON.stringify(productsMatched, null, 2));
              // console.log(`Data saved to ${filePath}`);
            }
          }
        } catch (error) {
          console.error('Error writing data to file:', error);
        }
      }
    }
  }

  /**
   * This is for matched products to push in API
   */
  const chunkSize = 100;
  const skipCount = 0; //
  for (const categ of MYCATEGORIES) {
    for (const sub of categ.children) {
      for (const ext of sub.children) {
        let matchedData = [];
        try {
          matchedData = JSON.parse(fs.readFileSync(`matched/${process.env.FOLDER_DATE}/${categ.id}/${sub.id ?? ''}${ext.id && ` - ${ext.id}`}.json`, 'utf8'));
          // console.log('matched', matchedData.length);
        } catch (error) {
          console.log('error', `${sub.id ?? ''}${ext.id && ` - ${ext.id}`}`);
          continue;
        }
        totalProducts += matchedData.length;
        const chunk = matchedData.slice(skipCount, skipCount + chunkSize);
        for (let i = skipCount; i < matchedData.length; i += chunkSize) {
          // this is the loop to where it should be uploaded
        }
      }
    }
  }
  console.log('totalProductsMatched', totalProducts);
  console.log('all done');
};

(async () => {
  await getData();
})();
