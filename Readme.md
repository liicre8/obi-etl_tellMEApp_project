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

### 6. Start Scraping Woolworths website

FOR RUNNING WOOLWORTHS/INDEX2.JS:

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
```

- Before running the scraper for Woolworths, ensure to run only 5 objects inside of array by commenting out other lines of code in the `CATEGORIES` array. Which located inside of `woolworths/index2.js`.

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
````


FOR RUNNING WOOLWORTHS/INDEX.JS:
- Before running the scraper for Woolworths, ensure to run only `FRUIT&VEG` and `Poultry,Meat&Seafood` objects inside of array by commenting out other lines of code in the `CATEGORIES` array. Which located inside of `woolworts/index.js`.

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

````

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
```


- Run the following command to start scraping:
``
  ```bash
  node woolworths/index2
  node woolworths/index
  ```
note: this `woolworths/index` or `/index2` is the scraper process of the woolworths.

- Once completed, retrieve all the data by running:
  ```bash
  node woolworths/getProducts.js
  ```
note: this `woolworths/getProducts.js` will let us retrieve all the products that have been scraped in woolworths.



### 5. Start Scraping Coles website

FOR RUNNING WOOLWORTHS/INDEX2.JS:
- Before running the scraper for Coles, ensure to run only 15 Child Items by commenting out other lines of code in the `CATEGORIES` array. Which located inside of `coles/constant/categories.js`.

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

````

- Note: When running `coles/index1.js`, ensure that the `LOCATION` array (found in `coles/constant/location`.js) is set to `NSW`.

#### Example `LOCATION` Configuration:

```javascript
const locations = [
    // // // // vic
    // {
    //     location: "Chadstone Shopping Centre, 1341 Dandenong Road, MALVERN EAST VIC 3145",
    //     subLucation: "Chadstone Shopping Centre, 1341 Dandenong Rd"
    // },
    // // nsw
    {
        location: "Sydney, NSW 2000",
        subLucation: "Coles Pyrmont"
    },
//     // // qld
//     {
//         location: "Kedron, QLD 4031",
//         subLucation: "Coles Kedron"
//     },
//    // // wa
//     {
//         location: "Perth, WA 6000",
//         subLucation: "Coles North Perth"
//     },
//     // // sa
//     {
//         location: "Kilburn, SA 5084",
//         subLucation: "Coles Churchill Centre"
//     },
//     // // tas
//     {
//         location: "Hobart, TAS 7000",
//         subLucation: "Coles Sandy Bay"
//     },
//     // // act
//     {
//         location: "Acton, ACT 2601",
//         subLucation: "Coles Canberra Civic"
//     },
//     // // nt
//     {
//         location: "Casuarina, NT 0810",
//         subLucation: "Coles Casuarina - Drive-through"
//     },
]

export default locations;

```


FOR RUNNING WOOLWORTHS/INDEX1.JS:
- Note: When running `coles/index1.js`, ensure that the locations in the `LOCATION` array (found in `coles/constant/location.js`) are set to all eight locations.

#### Example `LOCATION` Configuration:

```javascript
const locations = [
    // // // vic
    {
        location: "Chadstone Shopping Centre, 1341 Dandenong Road, MALVERN EAST VIC 3145",
        subLucation: "Chadstone Shopping Centre, 1341 Dandenong Rd"
    },
    // nsw
    {
        location: "Sydney, NSW 2000",
        subLucation: "Coles Pyrmont"
    },
    // // qld
    {
        location: "Kedron, QLD 4031",
        subLucation: "Coles Kedron"
    },
   // // wa
    {
        location: "Perth, WA 6000",
        subLucation: "Coles North Perth"
    },
    // // sa
    {
        location: "Kilburn, SA 5084",
        subLucation: "Coles Churchill Centre"
    },
    // // tas
    {
        location: "Hobart, TAS 7000",
        subLucation: "Coles Sandy Bay"
    },
    // // act
    {
        location: "Acton, ACT 2601",
        subLucation: "Coles Canberra Civic"
    },
    // // nt
    {
        location: "Casuarina, NT 0810",
        subLucation: "Coles Casuarina - Drive-through"
    },
]

export default locations;
````
 Before running the scraper for Coles, ensure to run only 10 Child Items by commenting out other lines of code in the `CATEGORIES` array. Which located inside of `coles/constant/categories.js`.

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
            //   { extensionCategory: "Savoury Spread" },
            //   { extensionCategory: "Muesli" },
            //   { extensionCategory: "Oats" },
          ]
      },
    //   {
    //       subCategory: "Canned Food & Instant Meals",
    //       childItems: [
    //           { extensionCategory: "Baked Beans & Spaghetti" },
    //           { extensionCategory: "Canned Fruit" },
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
````
- Run the following command to start scraping:
```bash
node coles/index1
node coles/index2
```
note: this `coles/index1` or `/index2` is the scraper process of the coles.


- Once completed, retrieve all the data by running:
  ```bash
  node coles/getProducts.js
  ```
note: this `coles/getProducts.js` will let us retrieve all the products that have been scraped in woolworths.


For Testing purposes: 
Don't forget to get delete the Data first 

## Uploading All Matched and Unmatched Products to the API.

## 1. Uploading All Matched Products To The API.

```bash
node coles/ColesfetchBarcode 
```
- This node will be used only if you have scraped newly when time for uploading.

- Run the following commands to start Uploading `MATCHED` products to the API.
```bash
node woolworths/getProducts coles/getProducts
```
note: This `woolworths/getProducts` `coles/getProducts` is the process to where it puts all products to a `MATCHED` file.

```bash
node coles/updateBarcodes
```
Note: Delete `matched` when `matchlist` is updated.
- This is so that the Barcodes from coles will be replaced with the barcodes from woolworths that are matched.
```bash
node MatchedProductsBarcode
```
Note: Before using command make sure `matched` file is deleted on the current date that is being used.
- It Matches both woolworths and coles products through Barcode to get all Matched products and store them to `matched` folder as JSON file.
```bash
node pushMatchedToAPI
```
- This will be the one to upload All Matched products from `matched` folder with the date that was set in the `.env` file to the API.

### 2 Product Matching from woolworths and coles base in Name and Weight

- Run this Commands to start matching products That was not yet Matched.
```bash
node coles/getAllUnmatched
```
- This commands stores all unmatched products to the `UnMatchedAll` folder as JSON file.
```bash
node coles/packUnmatched
```
- This will get all products and get packed as JSON file separately by store (coles/0WoolworthsAll, coles/0ColesAll)
```bash
node coles/MatchingProducts
```
- this will Match all unmatched products and save it and store into `coles/matched` folder.
Note: change variable inside `coles/MatchingProducts` function at this line `(nameSimilarity >= % && weightSimilarity >= % && nameSimilarity > bestScore)` with your prefered percentage. 
Note: INPUT VALUE: integer | replace % with the actual input
```bash
node coles/readMatchedJSON
```
- this will get all unique matched with defined score and will be stored in the `PackedMatched.json` folder after the matched is confirmed to be accurate matched run the next function
```bash
```
- Open `PackedMatched.json`  file to manually check one by one to see if Product images Matched, if products are not matched remove from file.
```bash
node coles/parseMatchedJSON
```
- This command Will store all Manually checked Matches into `colesOutput.json` file. Once stored copy all the key-value pair into `matchedList.json` inside `Matched_Barcodes` folder.
```bash
node coles/removeNewMatched
```
- To remove the new Matched products from the UnMatchedAll file to prevent repeating.
```bash
node coles/removeNewMatched2
```
- To remove all new matched to avoid repeating products while matching.
note: only use if you intend to repeat and lower the matching percentage in `node coles/MatchingProducts`, and also if you're sure that the products you deleted have no matches.
## 3.Uploading All UnMatched Products To The API

- Run the Following Commands to Start Uploading `UNMATCHED` Products to the API.
```bash
node coles/getAllUnmatched
```
- This commands stores all unmatched products to the `UnMatchedAll` folder as JSON file.
```bash
node transformUnmatched
```
- This will reformat the JSON file to be accepted by the API.
```bash
node pushUnmatchedToAPI
```
- This will be the one to upload All Matched products from `UnMatchedAll` folder with the date that was set in the `.env` file to the API.


