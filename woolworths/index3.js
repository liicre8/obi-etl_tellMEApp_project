// // File Path: woolworths/index2.js
import dotenv from 'dotenv';
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RateLimiter from "../RateLimit/index.js";
import fs from "fs";
import safeNavigate from "./controllers/helpers/safeNavigate.js";
import handleSteps from "./controllers/helpers/steps.js";
import location from '../woolworths/constant/location.js';
import mongoose from "mongoose";
import Product from "./models/products.js";
import dbConnect from "./db/dbConnect.js";

// Add stealth plugin
puppeteer.use(StealthPlugin());

const userAgents = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.1.2 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.43",
  "Mozilla/5.0 (Linux; Android 11; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Android 11; Mobile; rv:109.0) Gecko/20100101 Firefox/109.0",
  "Mozilla/5.0 (Linux; Android 11; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 OPR/68.0.2254.63568",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
];

// Location configuration - can be extended to support multiple states
const mylocation = ["nsw"];

// Location mapping for Woolworths
const LOCATION_MAPPING = {
  "nsw": {
    state: "NSW",
    postcode: "2000", // Sydney CBD as default
    suburb: "Sydney",
    stateCode: "nsw"
  },
  "vic": {
    state: "VIC", 
    postcode: "3000",
    suburb: "Melbourne",
    stateCode: "vic"
  },
  "qld": {
    state: "QLD",
    postcode: "4053", 
    suburb: "Stafford",
    stateCode: "qld"
  },
  "wa": {
    state: "WA",
    postcode: "6000",
    suburb: "Highgate", 
    stateCode: "wa"
  },
  "sa": {
    state: "SA",
    postcode: "5061",
    suburb: "Unley",
    stateCode: "sa"
  },
  "tas": {
    state: "TAS",
    postcode: "7005",
    suburb: "Sandy Bay",
    stateCode: "tas"
  },
  "act": {
    state: "ACT",
    postcode: "2609",
    suburb: "Canberra Airport",
    stateCode: "act"
  },
  "nt": {
    state: "NT",
    postcode: "0810",
    suburb: "Casuarina",
    stateCode: "nt"
  }
};


const getPrices = (priceInCents, priceInCentsPerUnits, unit, locationCode) => {
  const prices = [];
  const location = LOCATION_MAPPING[locationCode.toLowerCase()] || LOCATION_MAPPING["nsw"];
  
  prices.push({
    state: location.state,
    price: priceInCents ? parseFloat((priceInCents / 100).toFixed(2)) : null,
    price_per_unit: priceInCentsPerUnits ? parseFloat((priceInCentsPerUnits / 100).toFixed(2)) : null,
    price_unit: unit ? unit : "",
  });
  return prices;
};

// Function to check if user is logged in
const checkLoginStatus = async (page) => {
  try {
    console.log("Checking login status...");
    
    // Wait for page to load and check for login indicators
    await page.waitForTimeout(3000);
    
    // Check for common login indicators
    const loginIndicators = await page.evaluate(() => {
      // Check for "Sign in" button or text
      const signInButton = document.querySelector('[data-testid="signin-button"]') || 
                          document.querySelector('button[aria-label*="Sign in"]') ||
                          document.querySelector('a[href*="login"]') ||
                          document.querySelector('button:contains("Sign in")');
      
      // Check for user account elements
      const userAccount = document.querySelector('[data-testid="user-account"]') ||
                         document.querySelector('.user-menu') ||
                         document.querySelector('[aria-label*="Account"]');
      
      // Check for "Hi" greeting which indicates logged in status
      const greeting = document.querySelector('[data-testid="greeting"]') ||
                      Array.from(document.querySelectorAll('*')).find(el => 
                        el.textContent && el.textContent.toLowerCase().includes('hi '));
      
      return {
        hasSignInButton: !!signInButton,
        hasUserAccount: !!userAccount,
        hasGreeting: !!greeting,
        signInText: signInButton ? signInButton.textContent : null,
        greetingText: greeting ? greeting.textContent : null
      };
    });
    
    console.log("Login indicators:", loginIndicators);
    
    // Determine if logged in based on indicators
    const isLoggedIn = !loginIndicators.hasSignInButton || loginIndicators.hasGreeting;
    
    console.log(`Login status: ${isLoggedIn ? 'LOGGED IN' : 'NOT LOGGED IN'}`);
    return isLoggedIn;
  } catch (error) {
    console.error("Error checking login status:", error);
    return false;
  }
};

// Function to set up location
const setupLocation = async (page, locationCode) => {
  try {
    console.log(`Setting up location for: ${locationCode.toUpperCase()}`);
    
    const location = LOCATION_MAPPING[locationCode.toLowerCase()];
    if (!location) {
      console.error(`Unknown location code: ${locationCode}`);
      return false;
    }
    
    // Look for location/delivery area selector
    const locationSetup = await page.evaluate(async (loc) => {
      // Common selectors for location/delivery setup
      const locationSelectors = [
        '[data-testid="delivery-selector"]',
        '[data-testid="location-selector"]', 
        'button[aria-label*="delivery"]',
        'button[aria-label*="location"]',
        '.delivery-selector',
        '.location-selector',
        'button:contains("Delivery")',
        'button:contains("Location")'
      ];
      
      let locationButton = null;
      for (const selector of locationSelectors) {
        locationButton = document.querySelector(selector);
        if (locationButton) break;
      }
      
      if (locationButton) {
        locationButton.click();
        return { success: true, found: 'location_button' };
      }
      
      // Check if location is already set by looking for postcode or suburb
      const locationText = document.body.textContent || '';
      if (locationText.includes(loc.postcode) || locationText.includes(loc.suburb)) {
        return { success: true, found: 'already_set', location: loc.suburb };
      }
      
      return { success: false, found: 'none' };
    }, location);
    
    if (locationSetup.success && locationSetup.found === 'already_set') {
      console.log(`Location already set to: ${locationSetup.location}`);
      return true;
    }
    
    if (locationSetup.success && locationSetup.found === 'location_button') {
      console.log("Location selector clicked, waiting for modal...");
      await page.waitForTimeout(2000);
      
      // Try to enter postcode or select location
      const locationSet = await page.evaluate(async (loc) => {
        // Look for postcode input
        const postcodeInput = document.querySelector('input[placeholder*="postcode"]') ||
                             document.querySelector('input[placeholder*="Postcode"]') ||
                             document.querySelector('input[name*="postcode"]') ||
                             document.querySelector('input[id*="postcode"]');
        
        if (postcodeInput) {
          postcodeInput.value = loc.postcode;
          postcodeInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          // Wait a bit for suggestions
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Look for submit button
          const submitButton = document.querySelector('button[type="submit"]') ||
                              document.querySelector('button:contains("Set location")') ||
                              document.querySelector('button:contains("Confirm")');
          
          if (submitButton) {
            submitButton.click();
            return { success: true, action: 'postcode_entered' };
          }
        }
        
        // Alternative: look for suburb in dropdown or list
        const suburbElements = Array.from(document.querySelectorAll('*')).filter(el => 
          el.textContent && el.textContent.includes(loc.suburb)
        );
        
        if (suburbElements.length > 0) {
          suburbElements[0].click();
          return { success: true, action: 'suburb_selected' };
        }
        
        return { success: false, action: 'none' };
      }, location);
      
      if (locationSet.success) {
        console.log(`Location setup completed: ${locationSet.action}`);
        await page.waitForTimeout(3000); // Wait for location to be applied
        return true;
      }
    }
    
    console.log("Could not set up location automatically, proceeding with default");
    return true; // Continue even if location setup fails
  } catch (error) {
    console.error("Error setting up location:", error);
    return true; // Continue even if there's an error
  }
};

let pageReset = 0;
let booool = false;
const WOOLWORTHS_API_ENDPOINT = "https://www.woolworths.com.au/apis/ui/browse/category";

const CATEGORIES = [
  
  // { id: '1_717A94B', name: 'Baby', url: '/shop/browse/baby', location: '/shop/browse/baby', formatObject: "{\"name\":\"Baby\"}" },
  // { id: '1_DEB537E', name: 'Bakery', url: '/shop/browse/bakery', location: '/shop/browse/bakery', formatObject: "{\"name\":\"Bakery\"}" },
  // { id: '1_6E4F4E4', name: 'Dairy, Eggs & Fridge', url: '/shop/browse/dairy-eggs-fridge', location: '/shop/browse/dairy-eggs-fridge', formatObject: "{\"name\":\"Dairy, Eggs & Fridge\"}" },
  // { id: '1_3151F6F', name: 'Deli & Chilled Meals', url: '/shop/browse/deli-chilled-meals', location: '/shop/browse/deli-chilled-meals', formatObject: "{\"name\":\"Deli & Chilled Meals\"}" },
  // { id: '1_5AF3A0A', name: 'Drinks', url: '/shop/browse/drinks', location: '/shop/browse/drinks', formatObject: "{\"name\":\"Drinks\"}"},
  // { id: '1_ACA2FC2', name: 'Freezer', url: '/shop/browse/freezer', location: '/shop/browse/freezer', formatObject: "{\"name\":\"Freezer\"}" },
  // { id: '1_8D61DD6', name: 'Beauty', url: '/shop/browse/beauty-personal-care', location: '/shop/browse/beauty-personal-care', formatObject: "{\"name\":\"Beauty\"}" },
  // { id: '1_894D0A8', name: 'Personal Care', url: '/shop/browse/personal-care', location: '/shop/browse/personal-care', formatObject: "{\"name\":\"Personal Care\"}" },
  // { id: '1_9851658', name: 'Health & Wellness', url: '/shop/browse/health-wellness', location: '/shop/browse/health-wellness', formatObject: "{\"name\":\"Health & Wellness\"}" },
  // { id: '1_2432B58', name: 'Household', url: '/shop/browse/cleaning-maintenance', location: '/shop/browse/cleaning-maintenance', formatObject: "{\"name\":\"Household\"}" },

  // { id: '1_39FD49C', name: 'Pantry', url: '/shop/browse/pantry', location: '/shop/browse/pantry', formatObject: "{\"name\":\"Pantry\"}" },
  // { id: '1_61D6FEB', name: 'Pet', url: '/shop/browse/pet', location: '/shop/browse/pet', formatObject: "{\"name\":\"Pet\"}" },
  // { id: '1_DEA3ED5', name: 'Home & Lifestyle', url: '/shop/browse/home-lifestyle', location: '/shop/browse/home-lifestyle', formatObject: "{\"name\":\"Home & Lifestyle\"}" },
  // { id: '1_717445A', name: 'Snacks & Confectionery', url: '/shop/browse/snacks-confectionery', location: '/shop/browse/snacks-confectionery', formatObject: "{\"name\":\"Snacks & Confectionery\"}" },

  // { id: '1-E5BEE36E', name: 'Fruit & Veg', url: '/shop/browse/fruit-veg', location: '/shop/browse/fruit-veg', formatObject: "{\"name\":\"Fruit & Veg\"}" },
  // { id: '1_D5A2236', name: 'Poultry, Meat & Seafood', url: '/shop/browse/poultry-meat-seafood', location: '/shop/browse/poultry-meat-seafood', formatObject: "{\"name\":\"Poultry, Meat & Seafood\"}" },



  //  0 Products - T&P 30 - BTA - 8 - BTC - 9 -- No Barcodes -- In coles there's no categories on this
  //Test//{ id: '1_A500F4B', name: 'Toys & Playtime', url: '/shop/browse/baby/toys-playtime', location: '/shop/browse/baby/toys-playtime' },
  // { id: '1_3FD3314', name: 'Interactive Toys', url: '/shop/browse/baby/toys-playtime/interactive-toys', location: '/shop/browse/baby/toys-playtime/interactive-toys' },
  // { id: '1_66717AC', name: 'Play Mats & Activity Gyms', url: '/shop/browse/baby/toys-playtime/play-mats-activity-gyms', location: '/shop/browse/baby/toys-playtime/play-mats-activity-gyms' },
  // { id: '1_E2D6C0C', name: 'Activity Centres & Walkers', url: '/shop/browse/baby/toys-playtime/activity-centres-walkers', location: '/shop/browse/baby/toys-playtime/activity-centres-walkers' },
  // { id: '1_C9A2F47', name: 'Playpens & Playsets', url: '/shop/browse/baby/toys-playtime/playpens-playsets', location: '/shop/browse/baby/toys-playtime/playpens-playsets' },
  // { id: '1_4A1238C', name: 'Rockers & Bouncers', url: '/shop/browse/baby/toys-playtime/rockers-bouncers', location: '/shop/browse/baby/toys-playtime/rockers-bouncers' },

  // No Barcode --- No products found this in coles baby categories
  //Test// { id: '1_0BBE46A', name: 'Baby Travel & Accessories', url: '/shop/browse/baby/baby-travel-accessories', location: '/shop/browse/baby/baby-travel-accessories' },
  // { id: '1_8766AA5', name: 'Carriers', url: '/shop/browse/baby/baby-travel-accessories/carriers', location: '/shop/browse/baby/baby-travel-accessories/carriers' },
  // { id: '1_99FE0F7', name: 'Car Seats', url: '/shop/browse/baby/baby-travel-accessories/car-seats', location: '/shop/browse/baby/baby-travel-accessories/car-seats' },
  // { id: '1_B4EC5B3', name: 'Prams', url: '/shop/browse/baby/baby-travel-accessories/prams', location: '/shop/browse/baby/baby-travel-accessories/prams' },
  // { id: '1_F5D7F6D', name: 'Strollers', url: '/shop/browse/baby/baby-travel-accessories/strollers', location: '/shop/browse/baby/baby-travel-accessories/strollers' },
  
  // No barcodes and prices 
  //Test// { id: '1_E07A831', name: 'Baby & Toddler Clothing', url: '/shop/browse/baby/baby-toddler-clothing', location: '/shop/browse/baby/baby-toddler-clothing' },
  // { id: '1_D16A085', name: 'Newborn', url: '/shop/browse/baby/baby-toddler-clothing/newborn', location: '/shop/browse/baby/baby-toddler-clothing/newborn' },
  // { id: '1_F1C089F', name: 'Toddler', url: '/shop/browse/baby/baby-toddler-clothing/toddler', location: '/shop/browse/baby/baby-toddler-clothing/toddler' },
  // { id: '1_D791FDB', name: 'Accessories', url: '/shop/browse/baby/baby-toddler-clothing/accessories', location: '/shop/browse/baby/baby-toddler-clothing/accessories' },

  // O Products -- No Barcodes
  // { id: '1_DC2126B', name: 'Home Decor & Furniture', url: '/shop/browse/home-lifestyle/home-decor-furniture', location: '/shop/browse/home-lifestyle/home-decor-furniture' },
  // { id: '1_821B14C', name: 'Bathroom Towels & Accessories', url: '/shop/browse/home-lifestyle/bathroom-towels-accessories', location: '/shop/browse/home-lifestyle/bathroom-towels-accessories' },
  
  // 0 Products -- No Barcodes
  // { id: '1_003F162', name: 'Luggage & Travel', url: '/shop/browse/home-lifestyle/luggage-travel', location: '/shop/browse/home-lifestyle/luggage-travel' },
  
  
  //// No Proper Schema -- Baby
  // { id: '1_EE7E479', name: 'Baby Furniture', url: '/shop/browse/baby/baby-furniture', location: '/shop/browse/baby/baby-furniture' },
  // { id: '1_D0D8BA0', name: 'Nursery & Sleeping', url: '/shop/browse/baby/nursery-sleeping', location: '/shop/browse/baby/nursery-sleeping' },
  
  //// No Proper Schema -- Home Brew
  // { id: '1_6A19A68', name: 'Home Brew', url: '/shop/browse/drinks/home-brew', location: '/shop/browse/drinks/home-brew' },
  
  // O Products -- No Barcodes
  //{ id: '1_DB03E11', name: 'Home Appliances', url: '/shop/browse/home-lifestyle/home-appliances', location: '/shop/browse/home-lifestyle/home-appliances' },
  // { id: '1_BD834F5', name: 'Toys & Games', url: '/shop/browse/home-lifestyle/toys-games', location: '/shop/browse/home-lifestyle/toys-games' },
  // { id: '1_0D0883E', name: 'Books & Magazines', url: '/shop/browse/home-lifestyle/books-magazines', location: '/shop/browse/home-lifestyle/books-magazines' },

];

const WOOLWORTHS_URL = "https://www.woolworths.com.au";
const SPEED_LIMIT = 30000;

function delay(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

(async () => {
  await dbConnect();
  const name = "Woolworths";
  const rateLimit = new RateLimiter(SPEED_LIMIT, 5);
  const browser2 = await puppeteer.launch({
    headless: false,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    userDataDir: process.env.CHROME_PATH,
  });

  for (let i = 0; i < mylocation.length; i++) {
    const currentLocation = mylocation[i];
    console.log(`\n=== Processing location: ${currentLocation.toUpperCase()} ===`);
    
    const page = (await browser2.newPage()).removeAllListeners("request");
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.43");
    await page.setExtraHTTPHeaders({
      Referer: "https://www.woolworths.com.au/",
    });
    
    // Load cookies
    const loadedCookies = JSON.parse(fs.readFileSync("./woolworths/cookies.json", "utf-8"));
    await page.setCookie(...loadedCookies);
    
    // Navigate to main page
    await safeNavigate(page, "https://www.woolworths.com.au");
    await delay(3000);
    
    // Check login status
    const isLoggedIn = await checkLoginStatus(page);
    
    if (!isLoggedIn) {
      console.log("⚠️  User is not logged in. Please log in manually or check cookies.");
      console.log("Continuing with scraping but prices might not be accurate...");
    } else {
      console.log("✅ User is logged in successfully!");
    }
    
    // Setup location
    console.log(`Setting up location for ${currentLocation}...`);
    await setupLocation(page, currentLocation);
    
    // Refresh page to ensure location is applied
    await page.reload();
    await delay(3000);
    await page.reload();
    await delay(3000);

    if (!booool) {
      console.log("First location setup complete");
      booool = true;
    } else {
      await delay(5000);
      for (let j = 1; j < 5; j++) {
        await delay(3000);
        await page.reload();
      }
      await delay(20000);
      console.log("Additional location setup complete");
    }

    await Promise.allSettled(
      CATEGORIES.map(async (category, index) => {
        let page2;
        page2 = (await browser2.newPage()).removeAllListeners("request");
        const randomUserAgent = userAgents[index % userAgents.length];
        await page2.setUserAgent(randomUserAgent);
        await page2.setExtraHTTPHeaders({
          Referer: "https://www.woolworths.com.au/",
        });
        await safeNavigate(page2, "https://www.woolworths.com.au");
        await delay(20000);

        const htmlOnly = async (page) => {
          await page.removeAllListeners("request");
          await page.setRequestInterception(true);
          page.on("request", (req) => {
            if (!["document", "xhr", "fetch"].includes(req.resourceType())) {
              return req.abort();
            }
            req.continue();
          });
        };
        await htmlOnly(page2);

        try {
          await safeNavigate(page2, WOOLWORTHS_URL);
        } catch (err) {
          console.log("Failed to load page: ", err);
          await browser2.close();
          return [];
        }

        await page2.setBypassCSP(true);

        const products = await scrapeCategory(page2, category, currentLocation, page, browser2);
        console.log("category:", category.name, "Number of products:", products.length);
        await page2.close();
      })
    );
    console.log("all done in location:", currentLocation);
    await delay(3000);
    console.log("1");
    await delay(3000);
    console.log("2");
  }
  console.log("all is done");
})();

const scrapeCategory = async (page, category, myloc, p, browser) => {
  console.log("Scraping category: ", category.name);

  const body = {
    categoryId: category.id,
    pageNumber: 1,
    pageSize: 24,
    sortType: "TraderRelevance",
    activePersonalizedViewType: "",
    categoryVersion: "v2",
    enableAdReRanking: false,
    filters: [],
    flags: {
      enablePersonalizationCategoryRestriction: false
    },
    formatObject: category.formatObject || `{\"name\":\"${category.name}\"}`,
    gpBoost: 0,
    groupEdmVariants: false,
    isBundle: false,
    isHideUnavailableProducts: false,
    isMobile: false,
    isRegisteredRewardCardPromotion: false,
    isSpecial: false,
    location: category.location,
    token: "",
    url: category.url,
  };

  // First, get the initial response to check if there are products
  const res = await callFetch(page, body);
  console.log('First category response status:', res ? 'Success' : 'Failed');

  if (!res || !res.Bundles) {
    console.log("No bundles found in initial response for category:", category.name);
    return [];
  }

  const productRes = [];
  let pageNumber = 1;
  let hasProducts = true;

  // Continue scraping until we get empty bundles or no products
  while (hasProducts) {
    console.log("pageResetvalue", pageReset);
    
    if (pageReset > 190) {
      const loadedCookies = JSON.parse(fs.readFileSync("./woolworths/cookies.json", "utf-8"));
      await page.setCookie(...loadedCookies);
      await safeNavigate(page, "https://www.woolworths.com.au");
      
      for (let i = 1; i < 5; i++) {
        await delay(4000);
        await p.reload();
      }
      await delay(20000);
      for (let i = 1; i < 3; i++) {
        await delay(2500);
        await page.reload();
      }
      console.log("creating new page");
      await delay(5000);
      page.removeAllListeners("request");
      
      const htmlOnly = async (page) => {
        await page.setRequestInterception(true);
        page.on("request", (req) => {
          if (!["document", "xhr", "fetch"].includes(req.resourceType())) {
            return req.abort();
          }
          req.continue();
        });
      };
      await htmlOnly(page);

      try {
        await safeNavigate(page, WOOLWORTHS_URL);
      } catch (err) {
        console.log("Failed to load page: ", err);
      }

      await page.setBypassCSP(true);
      pageReset = 0;
    }
    
    pageReset = pageReset + 1;
    
    // Update body for current page
    body.pageNumber = pageNumber;
    body.location = pageNumber === 1 ? category.location : `${category.location}?pageNumber=${pageNumber}`;
    body.url = pageNumber === 1 ? category.url : `${category.url}?pageNumber=${pageNumber}`;
    
    const products = await scrapeURL(page, body, myloc);
    console.log("Number of products:", products.length, "on page:", pageNumber);
    
    if (products && products.length === 0) {
      console.log("No more products found on page:", pageNumber);
      hasProducts = false;
      break;
    }
    
    if (products && products.length > 0) {
      productRes.push(...products);
    }
    
    pageNumber++;
    await delay(1000);
  }
  
  console.log("Total products scraped for category", category.name, ":", productRes.length);
  return productRes;
};

// Fix 2: Update the scrapeURL function to pass parameters in correct order
const scrapeURL = async (page, request, myloc) => {
  const res = await callFetch(page, request);

  if (!res || !res.Bundles) {
    console.log("Failed to scrape category: ", request.categoryId, "Response:", res);
    return [];
  }

  if (res.Bundles.length === 0) {
    console.log("Empty bundles array for page:", request.pageNumber);
    return [];
  }

  const products = res.Bundles.map((bundle) => {
  if (!bundle.Products || bundle.Products.length === 0) {
    return null;
  }

  const product = bundle.Products[0];

  // ✅ Skip if barcode is null or undefined
  if (!product.Barcode) {
    return null;
  }

  // Extract prices
  const price = parseFloat(product.InstorePrice || product.Price);
  const price2 = parseFloat(product.CupPrice || product.InstoreCupPrice);
  const priceInCents = isNaN(price) ? null : price * 100;
  const priceInCentsPerUnits = isNaN(price2) ? null : price2 * 100;

  // Unit handling
  const inputString = product.CupMeasure || "";
  let unit = "";
  if (inputString.trim()) {
    const trimmedInput = inputString.trim().toUpperCase();
    unit = /\d/.test(trimmedInput) ? trimmedInput : "1" + trimmedInput;
  } else {
    unit = "1EA";
  }

  const pricesArray = getPrices(priceInCents, priceInCentsPerUnits, unit, myloc);
  const priceObj = pricesArray[0];

  // ✅ Only check `state` and `price` are NOT null
  if (!priceObj || !priceObj.state || priceObj.price == null) {
    return null;
  }

  return {
    name: product.DisplayName,
    discounted_from: product.WasPrice,
    image_url: product.DetailsImagePaths[0].replace("cdn1", "cdn0"),
    shop: "Woolworths",
    source_url: `https://www.woolworths.com.au/shop/productdetails/${product.Stockcode}/${product.UrlFriendlyName}`,
    retailer_product_id: product.Stockcode,
    barcode: product.Barcode,
    realName: product.name,
    isNew: product.IsNew,
    weight: product.PackageSize,
    category: product.AdditionalAttributes.piesdepartmentnamesjson,
    subCategory: product.AdditionalAttributes.piescategorynamesjson,
    extensionCategory: product.AdditionalAttributes.piessubcategorynamesjson,
    prices: pricesArray,
  };
});


  // Filter out null products
  const validProducts = products.filter(product => product !== null);

  if (validProducts.length > 0) {
    for (const data of validProducts) {
      const q = await Product.findOne({ retailer_product_id: data.retailer_product_id });
      if (!q) {
        const createdProduct = await Product.create({ ...data });
      } else {
        const updatedPrices = [...q.prices];
        let priceUpdated = false;

        for (let i = 0; i < updatedPrices.length; i++) {
          if (data.prices.length > 0 && updatedPrices.length > 0) {
            if (updatedPrices[i].state.toLowerCase() === data.prices[0].state.toLowerCase()) {
              updatedPrices[i].price = data.prices[0].price;
              updatedPrices[i].price_per_unit = data.prices[0].price_per_unit;
              updatedPrices[i].price_unit = data.prices[0].price_unit;
              priceUpdated = true;
              break;
            }
          }
        }

        if (!priceUpdated && data.prices.length > 0) {
          updatedPrices.push(data.prices[0]);
        }
        await Product.findByIdAndUpdate(q._id, { $set: { prices: updatedPrices } }, { new: true });
      }
    }
  }
  return validProducts;
};


const callFetch = async (page, request) => {
  const retries = 3;
  for (let i = 0; i < retries; i++) {
    try {
      const response = await page.evaluate(
        async (request, url) => {
          return await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(request),
          })
            .then((res) => res.json())
            .catch((err) => ({ error: err.message }));
        },
        request,
        WOOLWORTHS_API_ENDPOINT
      );
      
      if (response.error || !response) {
        console.error("Error in fetch:", response.error);
        throw new Error(response.error || "Unknown fetch error");
      }
      
      return response;
    } catch (err) {
      console.error(`Attempt ${i + 1} failed: ${err.message}`);
      if (i === retries - 1) {
        console.error("All fetch attempts failed");
        return null;
      }
      await delay(2000);
    }
  }
};

// import dotenv from 'dotenv';
// dotenv.config();

// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";
// import RateLimiter from "../RateLimit/index.js";
// import fs from "fs";
// import safeNavigate from "./controllers/helpers/safeNavigate.js";
// import handleSteps from "./controllers/helpers/steps.js";
// import mongoose from "mongoose";
// import Product from "./models/products.js";
// import dbConnect from "./db/dbConnect.js";

// // Add stealth plugin
// puppeteer.use(StealthPlugin());

// const userAgents = [
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0",
//   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.1.2 Safari/537.36",
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.43",
//   "Mozilla/5.0 (Linux; Android 11; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36",
//   "Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1",
//   "Mozilla/5.0 (Android 11; Mobile; rv:109.0) Gecko/20100101 Firefox/109.0",
//   "Mozilla/5.0 (Linux; Android 11; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 OPR/68.0.2254.63568",
//   "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
// ];

// // ✅ Define location here (change "nsw" to whatever you want to scrape)
// const mylocation = ["nsw"];

// const getPrices = (priceInCents, priceInCentsPerUnits, unit, locationCode) => {
//   const prices = [];
//   prices.push({
//     state: locationCode.toUpperCase(),
//     price: priceInCents ? parseFloat(Number(priceInCents).toFixed(2)) : null,
//     price_per_unit: priceInCentsPerUnits ? parseFloat(Number(priceInCentsPerUnits).toFixed(2)) : null,
//     price_unit: unit ? unit : "",
//   });
//   return prices;
// };

// const delay = (time) => new Promise(resolve => setTimeout(resolve, time));

// let pageReset = 0;
// let booool = false;
// const WOOLWORTHS_API_ENDPOINT = "https://www.woolworths.com.au/apis/ui/browse/category";

// const CATEGORIES = [
// //   { id: '1_717A94B', name: 'Baby', url: '/shop/browse/baby', location: '/shop/browse/baby', formatObject: "{\"name\":\"Baby\"}" },
// { id: '1_DEB537E', name: 'Bakery', url: '/shop/browse/bakery', location: '/shop/browse/bakery', formatObject: "{\"name\":\"Bakery\"}" },
// // { id: '1_6E4F4E4', name: 'Dairy, Eggs & Fridge', url: '/shop/browse/dairy-eggs-fridge', location: '/shop/browse/dairy-eggs-fridge', formatObject: "{\"name\":\"Dairy, Eggs & Fridge\"}" },
// // { id: '1_3151F6F', name: 'Deli & Chilled Meals', url: '/shop/browse/deli-chilled-meals', location: '/shop/browse/deli-chilled-meals', formatObject: "{\"name\":\"Deli & Chilled Meals\"}" },
// // { id: '1_5AF3A0A', name: 'Drinks', url: '/shop/browse/drinks', location: '/shop/browse/drinks', formatObject: "{\"name\":\"Drinks\"}"},
// // { id: '1_ACA2FC2', name: 'Freezer', url: '/shop/browse/freezer', location: '/shop/browse/freezer', formatObject: "{\"name\":\"Freezer\"}" },
// // { id: '1_8D61DD6', name: 'Beauty', url: '/shop/browse/beauty-personal-care', location: '/shop/browse/beauty-personal-care', formatObject: "{\"name\":\"Beauty\"}" },
// // { id: '1_894D0A8', name: 'Personal Care', url: '/shop/browse/personal-care', location: '/shop/browse/personal-care', formatObject: "{\"name\":\"Personal Care\"}" },
// // { id: '1_9851658', name: 'Health & Wellness', url: '/shop/browse/health-wellness', location: '/shop/browse/health-wellness', formatObject: "{\"name\":\"Health & Wellness\"}" },
// // { id: '1_2432B58', name: 'Household', url: '/shop/browse/cleaning-maintenance', location: '/shop/browse/cleaning-maintenance', formatObject: "{\"name\":\"Household\"}" },

// // { id: '1_39FD49C', name: 'Pantry', url: '/shop/browse/pantry', location: '/shop/browse/pantry', formatObject: "{\"name\":\"Pantry\"}" },
// // { id: '1_61D6FEB', name: 'Pet', url: '/shop/browse/pet', location: '/shop/browse/pet', formatObject: "{\"name\":\"Pet\"}" },
// { id: '1_DEA3ED5', name: 'Home & Lifestyle', url: '/shop/browse/home-lifestyle', location: '/shop/browse/home-lifestyle', formatObject: "{\"name\":\"Home & Lifestyle\"}" },
// // { id: '1_717445A', name: 'Snacks & Confectionery', url: '/shop/browse/snacks-confectionery', location: '/shop/browse/snacks-confectionery', formatObject: "{\"name\":\"Snacks & Confectionery\"}" },

// // { id: '1-E5BEE36E', name: 'Fruit & Veg', url: '/shop/browse/fruit-veg', location: '/shop/browse/fruit-veg', formatObject: "{\"name\":\"Fruit & Veg\"}" },
// // { id: '1_D5A2236', name: 'Poultry, Meat & Seafood', url: '/shop/browse/poultry-meat-seafood', location: '/shop/browse/poultry-meat-seafood', formatObject: "{\"name\":\"Poultry, Meat & Seafood\"}" },

// ];

// const WOOLWORTHS_URL = "https://www.woolworths.com.au";
// const SPEED_LIMIT = 2000;

// (async () => {
//   await dbConnect();
//   const name = "Woolworths";
//   const rateLimit = new RateLimiter(SPEED_LIMIT, 5);
//   const browser2 = await puppeteer.launch({
//     headless: false,
//     executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
//     userDataDir: process.env.CHROME_PATH,
//   });

//   for (let i = 0; i < mylocation.length; i++) {
//     const currentLocation = mylocation[i];
//     console.log(`\n=== Processing location: ${currentLocation.toUpperCase()} ===`);

//     const page = (await browser2.newPage()).removeAllListeners("request");
//     await page.setUserAgent(userAgents[0]);
//     await page.setExtraHTTPHeaders({
//       Referer: WOOLWORTHS_URL,
//     });

//     const loadedCookies = JSON.parse(fs.readFileSync("./woolworths/cookies.json", "utf-8"));
//     await page.setCookie(...loadedCookies);

//     await safeNavigate(page, WOOLWORTHS_URL);
//     await delay(2000);
//     await page.reload();
//     await delay(3000);
//     await page.reload();
//     await delay(3000);

//     // ✅ Set location using handleSteps (same as index.js)
//     await handleSteps(page, currentLocation, WOOLWORTHS_URL);

//     if (!booool) {
//       console.log("\x1b[1m\x1b[32m%s\x1b[0m", "✅ First location setup complete");
//       booool = true;
//     } else {
//       await delay(5000);
//       for (let j = 1; j < 5; j++) {
//         await delay(3000);
//         await page.reload();
//       }
//       await delay(20000);
//       console.log("Additional location setup complete");
//     }

//     await Promise.allSettled(
//       CATEGORIES.map(async (category, index) => {
//         const page2 = (await browser2.newPage()).removeAllListeners("request");
//         await page2.setUserAgent(userAgents[index % userAgents.length]);
//         await page2.setExtraHTTPHeaders({
//           Referer: WOOLWORTHS_URL,
//         });

//         const htmlOnly = async (page) => {
//           await page.setRequestInterception(true);
//           page.on("request", (req) => {
//             if (!["document", "xhr", "fetch"].includes(req.resourceType())) return req.abort();
//             req.continue();
//           });
//         };

//         await safeNavigate(page2, WOOLWORTHS_URL);
//         await delay(20000);
//         await htmlOnly(page2);
//         await page2.setBypassCSP(true);

//         const products = await scrapeCategory(page2, category, currentLocation, page, browser2);
//         console.log("category:", category.name, "Number of products:", products.length);
//         await page2.close();
//       })
//     );

//     console.log("all done in location:", currentLocation);
//     await delay(3000);
//     console.log("1");
//     await delay(3000);
//     console.log("2");
//   }

//   console.log("all is done");
// })();

// const scrapeCategory = async (page, category, myloc, p, browser) => {
//   const productRes = [];
//   console.log("\x1b[36mScraping category:\x1b[0m", category.name); // Cyan
//   const body = {
//     categoryId: category.id,
//     pageNumber: 1,
//     pageSize: 24,
//     sortType: "TraderRelevance",
//     activePersonalizedViewType: "",
//     categoryVersion: "v2",
//     enableAdReRanking: false,
//     filters: [],
//     flags: {
//       enablePersonalizationCategoryRestriction: false,
//     },
//     formatObject: category.formatObject || `{\"name\":\"${category.name}\"}`,
//     gpBoost: 0,
//     groupEdmVariants: false,
//     isBundle: false,
//     isHideUnavailableProducts: false,
//     isMobile: false,
//     isRegisteredRewardCardPromotion: false,
//     isSpecial: false,
//     location: category.location,
//     token: "",
//     url: category.url,
//   };

//   const res = await callFetch(page, body);
//   console.log("First category response status:", res ? "\x1b[32mSuccess\x1b[0m" : "\x1b[31mFailed\x1b[0m");

//   let pageNumber = 1;
//   let hasProducts = true;

//   while (hasProducts) {
//     console.log("pageResetvalue", "\x1b[33m" + pageReset + "\x1b[0m"); // Yellow

//     if (pageReset > 15) {
//       const loadedCookies = JSON.parse(fs.readFileSync("./woolworths/cookies.json", "utf-8"));
//       await page.setCookie(...loadedCookies);
//       await safeNavigate(page, WOOLWORTHS_URL);

//       for (let i = 1; i < 5; i++) {
//         await delay(4000);
//         await p.reload();
//       }
//       await delay(20000);

//       for (let i = 1; i < 3; i++) {
//         await delay(2500);
//         await page.reload();
//       }

//       await delay(5000);
//       page.removeAllListeners("request");
//       pageReset = 0;
//     }

//     pageReset++;
//     body.pageNumber = pageNumber;
//     body.location = pageNumber === 1 ? category.location : `${category.location}?pageNumber=${pageNumber}`;
//     body.url = pageNumber === 1 ? category.url : `${category.url}?pageNumber=${pageNumber}`;

//     const products = await scrapeURL(page, body, myloc);

//     if (!products || products.length === 0) {
//       console.log(`Empty bundles array for page: ${pageNumber}`);
//       console.log(`Number of products: 0 on page: ${pageNumber}`);
//       console.log(`No more products found on page: ${pageNumber}`);
//       hasProducts = false;
//       break;
//     }

//     console.log("Number of products:", "\x1b[35m" + products.length + "\x1b[0m", "on page:", "\x1b[35m" + pageNumber + "\x1b[0m"); // Magenta

//     productRes.push(...products);
//     pageNumber++;
//     await delay(1000);
//   }

//   console.log("Total products scraped for category", category.name, ":", "\x1b[32m" + productRes.length + "\x1b[0m"); // Green
//   return productRes;
// };


// const scrapeURL = async (page, request, myloc) => {
//   const res = await callFetch(page, request);
//   if (!res || !res.Bundles) return [];

//   const products = res.Bundles.map(bundle => {
//     const product = bundle.Products?.[0];
//     if (!product) return null;

//     const inputString = product.CupMeasure || "";
//     const price = parseFloat(product.InstorePrice || product.Price);
//     const price2 = parseFloat(product.CupPrice || product.InstoreCupPrice);
//     const priceInCents = parseFloat(price) * 100;
//     const priceInCentsPerUnits = parseFloat(price2) * 100;

//     const unit = (() => {
//       if (!inputString) return "";
//       const match = inputString.match(/^(\d*)([a-zA-Z]+)$/);
//       if (!match) return inputString.toUpperCase();
//       const [, num, u] = match;
//       return `${num || "1"}${u.toUpperCase()}`;
//     })();

//     return {
//       name: product.DisplayName,
//       discounted_from: product.WasPrice,
//       image_url: product.DetailsImagePaths?.[0]?.replace("cdn1", "cdn0") || "",
//       shop: "Woolworths",
//       source_url: `https://www.woolworths.com.au/shop/productdetails/${product.Stockcode}/${product.UrlFriendlyName}`,
//       retailer_product_id: product.Stockcode,
//       barcode: product.Barcode,
//       realName: product.name,
//       isNew: product.IsNew,
//       weight: product.PackageSize,
//       category: product.AdditionalAttributes?.piesdepartmentnamesjson || "",
//       subCategory: product.AdditionalAttributes?.piescategorynamesjson || "",
//       extensionCategory: product.AdditionalAttributes?.piessubcategorynamesjson || "",
//       prices: getPrices(priceInCents, priceInCentsPerUnits, unit, myloc),
//     };
//   }).filter(Boolean);

//   for (const data of products) {
//     const q = await Product.findOne({ retailer_product_id: data.retailer_product_id });
//     if (!q) {
//       await Product.create({ ...data });
//     } else {
//       const updatedPrices = [...q.prices];
//       let priceUpdated = false;
//       for (let i = 0; i < updatedPrices.length; i++) {
//         if (updatedPrices[i].state.toLowerCase() === data.prices[0].state.toLowerCase()) {
//           updatedPrices[i] = data.prices[0];
//           priceUpdated = true;
//           break;
//         }
//       }
//       if (!priceUpdated) updatedPrices.push(data.prices[0]);
//       await Product.findByIdAndUpdate(q._id, { $set: { prices: updatedPrices } }, { new: true });
//     }
//   }

//   return products;
// };

// const callFetch = async (page, request) => {
//   for (let i = 0; i < 3; i++) {
//     try {
//       const response = await page.evaluate(async (request, url) => {
//         return await fetch(url, {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify(request),
//         }).then(res => res.json()).catch(err => ({ error: err.message }));
//       }, request, WOOLWORTHS_API_ENDPOINT);

//       if (response?.error || !response) throw new Error(response.error || "Unknown fetch error");
//       return response;

//     } catch (err) {
//       console.error(`Attempt ${i + 1} failed: ${err.message}`);
//       await delay(2000);
//     }
//   }
//   return null;
// };
