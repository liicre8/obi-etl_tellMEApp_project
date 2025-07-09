import categories from './constant/getProducts.js';
import fs from 'fs';
import path from 'path';
import Product from './models/products.js';
import dbConnect from './db/dbConnect.js';
import dotenv from 'dotenv';

dotenv.config();

const RESET = '\x1b[0m';
const CYAN = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const MAGENTA = '\x1b[35m';

const getData = async () => {
  await dbConnect();
  let data = [];
  let total = 0;

  for (const categ of categories) {


    let category = categ.category;
    if (category === 'Chips, Chocolates & Snacks') category = 'Pantry';
    let defaultCatId = categ.id;

    const products = await Product.find({ category: category }).exec();

    const productsData = products.map((product) => {
      const productObj = product.toObject();

      // ✅ Skip if prices array is empty or image is missing
      if (productObj.prices.length === 0 || productObj.image_url === "N/A") return false;

      // ✅ Filter out prices with null values
      const validPrices = productObj.prices
        .filter((priceObj) => priceObj.price !== null)
        .map(({ _id, ...rest }) => rest); // Remove _id

      // ✅ Skip the product if no valid prices remain
      if (validPrices.length === 0) return false;

      let subId = '';
      let childId = '';
      let finalCategoryId = defaultCatId;

      const matchedCategory = categories.find((cat) => cat.category === category);
      if (matchedCategory) {
        const sub = matchedCategory.subCategories.find(
          (sub) => sub.subCategory === productObj.subCategory
        );
        if (sub) {
          const child = sub.childItems.find(
            (item) => item.extensionCategory === productObj.extensionCategory
          );
          if (child) {
            subId = child.subId ?? '';
            childId = child.childId ?? '';
            if (child.catId) {
              finalCategoryId = child.catId;
            }
          }
        }
      } else {
        console.warn(`⚠️ Category "${category}" not found in getProducts.js`);
      }

      return {
        source_url: productObj.source_url || null,
        name: productObj.name || null,
        image_url: productObj.image_url || null,
        source_id: `${productObj.coles_product_id}` || null,
        barcode: productObj.barcode || '',
        category_id: finalCategoryId || '',
        subcategory_id: subId || '',
        subsubcategory_id: childId || '',
        shop: productObj.shop || null,
        weight: productObj.weight || '',
        prices: validPrices,
      };
    }).filter(Boolean); // ✅ Remove skipped entries (false/null)

    if (productsData.length > 0) {
      const baseFolder = `./coles/data/${process.env.FOLDER_DATE}`;
      const folderPath = path.join(baseFolder);
      const toPush = [category, productsData.length];
      data.push(toPush);

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
        console.log(`📁 Created folder: ${folderPath}`);
      }

      const fileName = `${category}.json`;
      const filePath = path.join(folderPath, fileName);

      try {
        if (fs.existsSync(filePath)) {
          console.log(`📦 File already exists: ${filePath}. Skipping save.`);
          const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          const combinedData = [...existingData, ...productsData];

          // ✅ Deduplicate based on source_id, shop, and IDs
          const uniqueProducts = combinedData.reduce((acc, item) => {
            const exists = acc.some(
              (t) =>
                t.source_id === item.source_id &&
                t.shop === item.shop &&
                t.category_id === item.category_id &&
                (t.subcategory_id === item.subcategory_id || (!t.subcategory_id && !item.subcategory_id)) &&
                (t.subsubcategory_id === item.subsubcategory_id || (!t.subsubcategory_id && !item.subsubcategory_id))
            );
            if (!exists) acc.push(item);
            return acc;
          }, []);

          total += uniqueProducts.length;
          fs.writeFileSync(filePath, JSON.stringify(uniqueProducts, null, 2));
        } else {
          const uniqueProducts = productsData.reduce((acc, item) => {
            const exists = acc.some(
              (t) =>
                t.source_id === item.source_id &&
                t.shop === item.shop &&
                t.category_id === item.category_id &&
                (t.subcategory_id === item.subcategory_id || (!t.subcategory_id && !item.subcategory_id)) &&
                (t.subsubcategory_id === item.subsubcategory_id || (!t.subsubcategory_id && !item.subsubcategory_id))
            );
            if (!exists) acc.push(item);
            return acc;
          }, []);

          total += uniqueProducts.length;
          fs.writeFileSync(filePath, JSON.stringify(uniqueProducts, null, 2));
          console.log(`✅ Data saved to ${filePath}`);
        }

        console.log(`📊 Total products for "${category}":`, total);
      } catch (error) {
        console.error('❌ Error writing data to file:', error);
      }
    }
  }

  console.log(`${CYAN}\n🧮 Final Summary of All Categories:${RESET}`);
  data.forEach(([cat, count]) => {
  console.log(`${GREEN}- ${cat}:${RESET} ${YELLOW}${count}${RESET}`);
  });

  const grandTotal = data.reduce((acc, [, count]) => acc + count, 0);
  console.log(`${MAGENTA}\n📦 Grand Total Products Across All Categories: ${YELLOW}${grandTotal}${RESET}`);
};

(async () => {
  await getData();
})();
