# Simple Scraper Project

This project is a simple web scraper built using Node.js and Puppeteer. It extracts data from a website, processes it, and saves the results into a JSON file. Perfect for beginners or anyone looking to automate web data extraction.

## Features

- Automates browsing using Puppeteer.
- Extracts and processes data from web pages.
- Saves scraped data to a JSON file.

---

## Requirements

1. **Node.js**: Ensure Node.js is installed on your system. [Download Node.js](https://nodejs.org/)

---

## Getting Started

Follow these steps to set up and run the scraper:

### 1. Install Node.js

- Download and install the latest version of Node.js from the [official website](https://nodejs.org/).

### 2. Clone or Download this Project

- Download or clone this repository to your local machine.

### 3. Install Dependencies

- Open a terminal in the project directory and run the following command:
  ```bash
  npm install
  ```

### 4. Environment Variables

- Create a .env file and locate it in the root of the project:
  ```env
  JARROD_KEY="API_KEY" //replace with the actual key
  JARROD_API="API_TO_BACKEND_SERVER" // replace with the actual API

  # COLES DB
  MONGO_COLES_URI="mongodb://127.0.0.1/coles_1-1-2025" // replace with the actual date

  # coles db uri for barcodes to save
  MONGO_COLES_BARCODE="mongodb://127.0.0.1/colesbarcodes" # replace with the actual date

  # coles db uri for barcodes to save
  MONGO_COLES_BARCODE="mongodb://127.0.0.1/colesbarcodes" # replace with the actual date

  # WOOLYDB
  MONGO_WOOLY_URI="mongodb://127.0.0.1/wooly_1-22-2025" // replace with the actual date

  # folder date for inventory
  FOLDER_DATE="2-19-2025" # replace with the actual date

  # your chrome path
  CHROME_PATH="C:\\Users\\OBI - Raymond\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1" # replace with the actual chrome path
  ```

### 5. Start Scraping Woolworths website

- Before running the scraper for Woolworths, ensure to run only 5 objects inside of array by commenting out other lines of code in the `CATEGORIES` array. Which located inside of `woolworths/index2.js`.

- Note: When running `woolworths/index2.js`, ensure that the `LOCATION` array (found in `woolworths/constant/location`.js) is set to `NSW`.

#### Example `LOCATION` Configuration:

```javascript
const locations = [
    // nsw
    {
        name: 'nsw',
        location: "2000",
        subLucation: "Town Hall"
    },
    // <!-- // vic
    // {
    //     name: 'vic',
    //     location: "3000",
    //     subLucation: "QV"
    // },
    // // qld
    // {
    //     name: 'qld',
    //     location: "4053",
    //     subLucation: "Stafford"
    // },
    // // wa
    // {
    //     name: 'wa',
    //     location: "6000",
    //     subLucation: "Highgate"
    // },
    // // sa
    // {
    //     name: 'sa',
    //     location: "5000",
    //     subLucation: "Unley"
    // },
    // // tas
    // {
    //     name: 'tas',
    //     location: "7005",
    //     subLucation: "Sandy Bay"
    // },
    // // act
    // {
    //     name: 'act',
    //     location: "2601",
    //     subLucation: "Canberra Airport"
    // },
    // // nt
    // {
    //     name: 'nt',
    //     location: "0810",
    //     subLucation: "Casuarina"
    // }, -->
]

#### Example `CATEGORIES` Configuration:

````javascript
const CATEGORIES = [
   // { id: '1_717A94B', name: 'Baby', url: '/shop/browse/baby', location: '/shop/browse/baby' },
  // { id: '1_DEB537E', name: 'Bakery', url: '/shop/browse/bakery', location: '/shop/browse/bakery' },
  // { id: '1_6E4F4E4', name: 'Dairy, Eggs & Fridge', url: '/shop/browse/dairy-eggs-fridge', location: '/shop/browse/dairy-eggs-fridge' },
  // { id: '1_3151F6F', name: 'Deli & Chilled Meats', url: '/shop/browse/deli-chilled-meals', location: '/shop/browse/deli-chilled-meals' },
  // { id: '1_5AF3A0A', name: 'Drinks', url: '/shop/browse/drinks', location: '/shop/browse/drinks' },

  { id: '1_ACA2FC2', name: 'Freezer', url: '/shop/browse/freezer', location: '/shop/browse/freezer' },
  { id: '1_8D61DD6', name: 'Beauty', url: '/shop/browse/beauty-personal-care', location: '/shop/browse/beauty-personal-care' },
  { id: '1_894D0A8', name: 'Personal Care', url: '/shop/browse/personal-care', location: '/shop/browse/personal-care' },
  { id: '1_9851658', name: 'Health & Wellness', url: '/shop/browse/health-wellness', location: '/shop/browse/health-wellness' },
  { id: '1_2432B58', name: 'Household', url: '/shop/browse/cleaning-maintenance', location: '/shop/browse/cleaning-maintenance' },

  // { id: '1_39FD49C', name: 'Pantry', url: '/shop/browse/pantry', location: '/shop/browse/pantry' },
  // { id: '1_61D6FEB', name: 'Pet', url: '/shop/browse/pet', location: '/shop/browse/pet' },
  // { id: '1_DEA3ED5', name: 'Home & Lifestyle', url: '/shop/browse/home-lifestyle', location: '/shop/browse/home-lifestyle' },
  // { id: '1_717445A', name: 'Snacks & Confectionery', url: '/shop/browse/snacks-confectionery', location: '/shop/browse/snacks-confectionery' },
  // { id: '1_9E92C35', name: 'Back to School', url: '/shop/browse/back-to-school', location: '/shop/browse/back-to-school' },
];
```
- Before running the scraper for Woolworths, ensure to run only `FRUIT&VEG` and `Poultry,Meat&Seafood` objects inside of array by commenting out other lines of code in the `CATEGORIES` array. Which located inside of `woolworts/index2.js`.

- Note: When running `woolworths/index.js`, ensure that the locations in the `LOCATION` array (found in `woolworths/constant/location.js`) are set to all eight locations.

#### Example `LOCATION` Configuration:

```javascript
const locations = [
    // nsw
    {
        name: 'nsw',
        location: "2000",
        subLucation: "Town Hall"
    },
    // vic
    {
        name: 'vic',
        location: "3000",
        subLucation: "QV"
    },
    // qld
    {
        name: 'qld',
        location: "4053",
        subLucation: "Stafford"
    },
    // wa
    {
        name: 'wa',
        location: "6000",
        subLucation: "Highgate"
    },
    // sa
    {
        name: 'sa',
        location: "5000",
        subLucation: "Unley"
    },
    // tas
    {
        name: 'tas',
        location: "7005",
        subLucation: "Sandy Bay"
    },
    // act
    {
        name: 'act',
        location: "2601",
        subLucation: "Canberra Airport"
    },
    // nt
    {
        name: 'nt',
        location: "0810",
        subLucation: "Casuarina"
    },
]

#### Example `CATEGORIES` Configuration:

````javascript
const CATEGORIES = [
    // { id: '1_717A94B', name: 'Baby', url: '/shop/browse/baby', location: '/shop/browse/baby' },
  // { id: '1_DEB537E', name: 'Bakery', url: '/shop/browse/bakery', location: '/shop/browse/bakery' },
  // { id: '1_6E4F4E4', name: 'Dairy, Eggs & Fridge', url: '/shop/browse/dairy-eggs-fridge', location: '/shop/browse/dairy-eggs-fridge' },
  // { id: '1_3151F6F', name: 'Deli & Chilled Meats', url: '/shop/browse/deli-chilled-meals', location: '/shop/browse/deli-chilled-meals' },
  // { id: '1_5AF3A0A', name: 'Drinks', url: '/shop/browse/drinks', location: '/shop/browse/drinks' },
  // { id: '1_ACA2FC2', name: 'Freezer', url: '/shop/browse/freezer', location: '/shop/browse/freezer' },

  { id: '1-E5BEE36E', name: 'Fruit & Veg', url: '/shop/browse/fruit-veg', location: '/shop/browse/fruit-veg' },
  // { id: '1_8D61DD6', name: 'Beauty', url: '/shop/browse/beauty-personal-care', location: '/shop/browse/beauty-personal-care' },
  // { id: '1_894D0A8', name: 'Personal Care', url: '/shop/browse/personal-care', location: '/shop/browse/personal-care' },
  // { id: '1_9851658', name: 'Health & Wellness', url: '/shop/browse/health-wellness', location: '/shop/browse/health-wellness' },
  { id: '1_D5A2236', name: 'Poultry, Meat & Seafood', url: '/shop/browse/poultry-meat-seafood', location: '/shop/browse/poultry-meat-seafood' },
  // { id: '1_2432B58', name: 'Household', url: '/shop/browse/cleaning-maintenance', location: '/shop/browse/cleaning-maintenance' },

  //{ id: '1_39FD49C', name: 'Pantry', url: '/shop/browse/pantry', location: '/shop/browse/pantry' },
  // { id: '1_61D6FEB', name: 'Pet', url: '/shop/browse/pet', location: '/shop/browse/pet' },
  // { id: '1_DEA3ED5', name: 'Home & Lifestyle', url: '/shop/browse/home-lifestyle', location: '/shop/browse/home-lifestyle' },
  // { id: '1_717445A', name: 'Snacks & Confectionery', url: '/shop/browse/snacks-confectionery', location: '/shop/browse/snacks-confectionery' },
  // { id: '1_9E92C35', name: 'Back to School', url: '/shop/browse/back-to-school', location: '/shop/browse/back-to-school' },
  // { id: '1_8E4DA6F', name: 'Beer, Wine & Spirits', url: '/shop/browse/beer-wine-spirits', location: '/shop/browse/beer-wine-spirits' },
];


- Run the following command to start scraping:

  ```bash
  node woolworths/index/index2
  ```
note: this `woolworths/index/index2` is the scraper process of the woolworths.

- Once completed, retrieve all the data by running:
  ```bash
  node woolworths/getProducts.js
  ```
note: this `woolworths/getProducts.js` will let us retrieve all the products that have been scraped in woolworths.

### 5. Start Scraping Coles website

- Before running the scraper for Coles, ensure to run only 15 Child Items by commenting out other lines of code in the `CATEGORIES` array. Which located inside of `coles/constant/categories.js`.

- - Note: When running `woolworths/index2.js`, ensure that the `LOCATION` array (found in `woolworths/constant/location`.js) is set to `NSW`.

#### Example `LOCATION` Configuration:

```javascript
const locations = [
    // nsw
    {
        name: 'nsw',
        location: "2000",
        subLucation: "Town Hall"
    },
    // <!-- // vic
    // {
    //     name: 'vic',
    //     location: "3000",
    //     subLucation: "QV"
    // },
    // // qld
    // {
    //     name: 'qld',
    //     location: "4053",
    //     subLucation: "Stafford"
    // },
    // // wa
    // {
    //     name: 'wa',
    //     location: "6000",
    //     subLucation: "Highgate"
    // },
    // // sa
    // {
    //     name: 'sa',
    //     location: "5000",
    //     subLucation: "Unley"
    // },
    // // tas
    // {
    //     name: 'tas',
    //     location: "7005",
    //     subLucation: "Sandy Bay"
    // },
    // // act
    // {
    //     name: 'act',
    //     location: "2601",
    //     subLucation: "Canberra Airport"
    // },
    // // nt
    // {
    //     name: 'nt',
    //     location: "0810",
    //     subLucation: "Casuarina"
    // }, -->
]

#### Example `CATEGORIES` Configuration:

````javascript
const CATEGORIES = [
 {
    category: 'Pantry',
    subCategories: [
      {
          subCategory: "Baking",
          childItems: [
              { extensionCategory: "Cooking Chocolate & Cocoa" },
              { extensionCategory: "Flavouring, Essence & Food Colouring" },
              { extensionCategory: "Flour" },
              { extensionCategory: "Icing & Cake Decorating" },
              { extensionCategory: "Nuts, Seeds & Coconut" },
              { extensionCategory: "Sugar & Sweeteners" },
              { extensionCategory: "Yeast & Baking Ingredients" },
          ]
      },
      {
          subCategory: "Breakfast & Spreads",
          childItems: [
              { extensionCategory: "Breakfast Cereal" },
              { extensionCategory: "Honey" },
              { extensionCategory: "Jam" },
              { extensionCategory: "Savoury Spread" },
              { extensionCategory: "Muesli" },
              { extensionCategory: "Oats" },
          ]
      },
      {
          subCategory: "Canned Food & Instant Meals",
          childItems: [
              { extensionCategory: "Baked Beans & Spaghetti" },
              { extensionCategory: "Canned Fruit" },
      //         { extensionCategory: "Canned Meat" },
      //         { extensionCategory: "Canned Soup & Soup Ingredients" },
      //         { extensionCategory: "Canned Vegetables" },
      //         { extensionCategory: "Instant Meals & Sides" },
      //     ]
      // },
      // {
      //     subCategory: "Condiments",
      //     childItems: [
      //         { extensionCategory: "Mustard" },
      //         { extensionCategory: "Sweet Chilli & Hot Sauce" },
      //         { extensionCategory: "Tomato & BBQ Sauce" },
      //     ]
      // },
      // {
      //     subCategory: "Desserts",
      //     childItems: [
      //         { extensionCategory: "Custard, Cream & Yoghurt" },
      //         { extensionCategory: "Ice Cream Cones, Syrups & Toppings" },
      //         { extensionCategory: "Jelly" },
      //         { extensionCategory: "Puddings" },
              // { extensionCategory: "Ready to Freeze Ice Blocks" },
          ]
      },
      // {
      //     subCategory: "Health Foods",
      //     childItems: [
      //         { extensionCategory: "Health Breakfast Food & Spread" },
      //         { extensionCategory: "Health Cooking & Pasta" },
      //         { extensionCategory: "Health Snacks & Drinks" },
      //     ]
      // },
      // {
      //     subCategory: "Herbs & Spices",
      //     childItems: [
      //         { extensionCategory: "Dried Herbs & Spices" },
      //         { extensionCategory: "Salt & Pepper" },
      //     ]
      // },
      // {
      //     subCategory: "International Foods",
      //     childItems: [
      //         { extensionCategory: "Asian" },
      //         { extensionCategory: "European" },
      //         { extensionCategory: "Indian" },
      //         { extensionCategory: "Mexican" },
      //         { extensionCategory: "Middle Eastern" },
      //         { extensionCategory: "UK Foods" },
      //     ]
      // },
      // {
      //     subCategory: "Pasta, Rice & Grains",
      //     childItems: [
      //         { extensionCategory: "Beans & Legumes" },
      //         { extensionCategory: "Rice" },
      //     ]
      // },
      // {
      //     subCategory: "Sauce, Oil & Vinegar",
      //     childItems: [
      //         { extensionCategory: "Marinades & Seasoning" },
      //         { extensionCategory: "Pizza & Pasta Sauce" },
      //         { extensionCategory: "Soy & Asian Sauces" },
      //         { extensionCategory: "Stock & Gravy" },
      //     ]
      // },
      //   {
      //       subCategory: "Snacks & Confectionery",
      //       childItems: [
      //           { extensionCategory: "Biscuits & Cookies" },
      //           { extensionCategory: "Corn Chips & Salsa" },
      //           { extensionCategory: "Muesli Bars & Snack" },
      //       ]
      //   },
      //   {
      //       subCategory: "Tea & Coffee",
      //       childItems: [
      //           { extensionCategory: "Black Tea" },
      //           { extensionCategory: "Green Tea" },
      //           { extensionCategory: "Herbal & Specialty Tea" },
      //       ]
      //   },
    ],
  }
]

```
- Before running the scraper for Coles, ensure to run only `FRUIT&VEG` and `Poultry,Meat&Seafood` objects inside of array by commenting out other lines of code in the `CATEGORIES` array. Which located inside of `coles/index2.js`.

- Note: When running `coles/index.js`, ensure that the locations in the `LOCATION` array (found in `coles/constant/location.js`) are set to all eight locations.

#### Example `LOCATION` Configuration:

```javascript
const locations = [
    // nsw
    {
        name: 'nsw',
        location: "2000",
        subLucation: "Town Hall"
    },
    // vic
    {
        name: 'vic',
        location: "3000",
        subLucation: "QV"
    },
    // qld
    {
        name: 'qld',
        location: "4053",
        subLucation: "Stafford"
    },
    // wa
    {
        name: 'wa',
        location: "6000",
        subLucation: "Highgate"
    },
    // sa
    {
        name: 'sa',
        location: "5000",
        subLucation: "Unley"
    },
    // tas
    {
        name: 'tas',
        location: "7005",
        subLucation: "Sandy Bay"
    },
    // act
    {
        name: 'act',
        location: "2601",
        subLucation: "Canberra Airport"
    },
    // nt
    {
        name: 'nt',
        location: "0810",
        subLucation: "Casuarina"
    }, 
]

#### Example `CATEGORIES` Configuration:

````javascript
const CATEGORIES = [
 {
    category: 'Pantry',
    subCategories: [
      {
          subCategory: "Baking",
          childItems: [
              { extensionCategory: "Cooking Chocolate & Cocoa" },
              { extensionCategory: "Flavouring, Essence & Food Colouring" },
              { extensionCategory: "Flour" },
              { extensionCategory: "Icing & Cake Decorating" },
              { extensionCategory: "Nuts, Seeds & Coconut" },
              { extensionCategory: "Sugar & Sweeteners" },
              { extensionCategory: "Yeast & Baking Ingredients" },
          ]
      },
      {
          subCategory: "Breakfast & Spreads",
          childItems: [
              { extensionCategory: "Breakfast Cereal" },
              { extensionCategory: "Honey" },
              { extensionCategory: "Jam" },
              { extensionCategory: "Savoury Spread" },
              { extensionCategory: "Muesli" },
              { extensionCategory: "Oats" },
          ]
      },
      {
          subCategory: "Canned Food & Instant Meals",
          childItems: [
              { extensionCategory: "Baked Beans & Spaghetti" },
              { extensionCategory: "Canned Fruit" },
      //         { extensionCategory: "Canned Meat" },
      //         { extensionCategory: "Canned Soup & Soup Ingredients" },
      //         { extensionCategory: "Canned Vegetables" },
      //         { extensionCategory: "Instant Meals & Sides" },
      //     ]
      // },
      // {
      //     subCategory: "Condiments",
      //     childItems: [
      //         { extensionCategory: "Mustard" },
      //         { extensionCategory: "Sweet Chilli & Hot Sauce" },
      //         { extensionCategory: "Tomato & BBQ Sauce" },
      //     ]
      // },
      // {
      //     subCategory: "Desserts",
      //     childItems: [
      //         { extensionCategory: "Custard, Cream & Yoghurt" },
      //         { extensionCategory: "Ice Cream Cones, Syrups & Toppings" },
      //         { extensionCategory: "Jelly" },
      //         { extensionCategory: "Puddings" },
              // { extensionCategory: "Ready to Freeze Ice Blocks" },
          ]
      },
      // {
      //     subCategory: "Health Foods",
      //     childItems: [
      //         { extensionCategory: "Health Breakfast Food & Spread" },
      //         { extensionCategory: "Health Cooking & Pasta" },
      //         { extensionCategory: "Health Snacks & Drinks" },
      //     ]
      // },
      // {
      //     subCategory: "Herbs & Spices",
      //     childItems: [
      //         { extensionCategory: "Dried Herbs & Spices" },
      //         { extensionCategory: "Salt & Pepper" },
      //     ]
      // },
      // {
      //     subCategory: "International Foods",
      //     childItems: [
      //         { extensionCategory: "Asian" },
      //         { extensionCategory: "European" },
      //         { extensionCategory: "Indian" },
      //         { extensionCategory: "Mexican" },
      //         { extensionCategory: "Middle Eastern" },
      //         { extensionCategory: "UK Foods" },
      //     ]
      // },
      // {
      //     subCategory: "Pasta, Rice & Grains",
      //     childItems: [
      //         { extensionCategory: "Beans & Legumes" },
      //         { extensionCategory: "Rice" },
      //     ]
      // },
      // {
      //     subCategory: "Sauce, Oil & Vinegar",
      //     childItems: [
      //         { extensionCategory: "Marinades & Seasoning" },
      //         { extensionCategory: "Pizza & Pasta Sauce" },
      //         { extensionCategory: "Soy & Asian Sauces" },
      //         { extensionCategory: "Stock & Gravy" },
      //     ]
      // },
      //   {
      //       subCategory: "Snacks & Confectionery",
      //       childItems: [
      //           { extensionCategory: "Biscuits & Cookies" },
      //           { extensionCategory: "Corn Chips & Salsa" },
      //           { extensionCategory: "Muesli Bars & Snack" },
      //       ]
      //   },
      //   {
      //       subCategory: "Tea & Coffee",
      //       childItems: [
      //           { extensionCategory: "Black Tea" },
      //           { extensionCategory: "Green Tea" },
      //           { extensionCategory: "Herbal & Specialty Tea" },
      //       ]
      //   },
    ],
  }
]

```

- Run the following command to start scraping:
```bash
node coles/index
```
note: this `coles/index` is the scraper process of the coles.

- Once completed in coles, retrieve all the barcode for each product scraped in coles by running:
```bash
node coles/ColesfetchBarcode.js
```
note: this `coles/ColesfetchBarcode` will allow us to retrieve the barcodes in our database and if there is no barcodes and try to fetch in API.

- Once completed in coles, retrieve all the data in coles by running:
```bash
node coles/getProducts.js
```
note: this `coles/getProducts.js` will let us retrieve all the products that have been scraped in coles.

### 6. Test The Products if there is an error before passing through the API.

- Test the products by running the following:
  - For Coles:
```bash
node testColes
```
note: this `testColes` will have a logs if how many products have an error to be passed and possible issue is `image_url` is empty. This will allow us to review and make sure that we have no errors in doing the data transfer to the client.
  - For Woolworths
```bash
node testWooly
```
note: this `testWooly` will have a logs if how many products have an error to be passed and possible issue is `prices.price` didn't convert. This will allow us to review and make sure that we have no errors in doing the data transfer to the client.

### 7. Test first the matched Products by barcodes and Unmatched product for both C and W website.
  ```bash
  node compareProductsTest
  ```
  note: this `compareProductsTest` will only create the matched data with the product barcodes and once the test is successful if you run the `compareProductsFinal` ensure that you have deleted/clean the folder by the date you have created in you .env.
### 8. Send the matched Products by barcodes and Unmatched product for both C and W websit through the API.
  ```bash
  node compareProductsFinal
  ```
  note: this `compareProductsFinal` will only passed the matched data with the product barcodes.
  
### 9. Test the similar matched Products by names or titles with 95% - 100% score through the API.
  ```bash
  node compareProductsSimilarityTest
  ```
  note: this `compareProductsSimilarityTest` will only create the matched data with the product names and all the unmatched data from both C and W to test and once the test is successful if you run the `compareProductsSimilarityFinal` ensure that you have deleted/clean the folder by the date you have created in you .env.

### 10. Send the matched Products by names or titles with 95% - 100% score through the API.
  ```bash
  node compareProductsSimilarityFinal
  ```
  note: this `compareProductsSimilarityFinal` will only passed the matched data with the product names and all the unmatched data from both C and W.

---
## Notes

- Ensure the target website allows scraping and complies with its terms of service.
- Modify the scraper logic as needed to suit your requirements.
