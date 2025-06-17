// //File Path: woolworths/index2.js
import dotenv from 'dotenv';
dotenv.config();
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import RateLimiter from "../RateLimit/index.js";
import fs from "fs";
import safeNavigate from "./controllers/helpers/safeNavigate.js";
import handleSteps from "./controllers/helpers/steps.js";
import mongoose from "mongoose";
.0
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
  "Mozilla/5.0 (Android 11; Mobile; rv:109.0) Gecko/20100101 Firefox/109.0",
  "Mozilla/5.0 (Linux; Android 11; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36 OPR/68.0.2254.63568",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_0_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
];

//const mylocation = ["nsw", "vic", "qld", "wa", "sa", "tas", "act", "nt"];
// const mylocation = ["nsw", "vic", "qld", "wa"];
//const mylocation = ["tas", "act", "nt"];
const mylocation = ["nsw"];

const getPrices = (priceInCents, priceInCentsPerUnits, unit) => {
  const prices = [];
      prices.push({
        state: "nsw".toUpperCase(),
        price: priceInCents ? parseFloat(Number(priceInCents).toFixed(2)) : null,
        price_per_unit: priceInCentsPerUnits ? parseFloat(Number(priceInCentsPerUnits).toFixed(2)) : null,
        price_unit: unit ? unit : "",
      });
  return prices;
};

let pageReset = 0;
let booool = false;
const WOOLWORTHS_API_ENDPOINT = "https://www.woolworths.com.au/apis/ui/browse/category";
const CATEGORIES = [
  // { id: '1_717A94B', name: 'Baby', url: '/shop/browse/baby', location: '/shop/browse/baby' },
  // { id: '1_DEB537E', name: 'Bakery', url: '/shop/browse/bakery', location: '/shop/browse/bakery' },
  // { id: '1_6E4F4E4', name: 'Dairy, Eggs & Fridge', url: '/shop/browse/dairy-eggs-fridge', location: '/shop/browse/dairy-eggs-fridge' },
  // { id: '1_3151F6F', name: 'Deli & Chilled Meals', url: '/shop/browse/deli-chilled-meals', location: '/shop/browse/deli-chilled-meals' },
  // { id: '1_5AF3A0A', name: 'Drinks', url: '/shop/browse/drinks', location: '/shop/browse/drinks' },

  // { id: '1_ACA2FC2', name: 'Freezer', url: '/shop/browse/freezer', location: '/shop/browse/freezer' },
  // { id: '1_8D61DD6', name: 'Beauty', url: '/shop/browse/beauty-personal-care', location: '/shop/browse/beauty-personal-care' },
  // { id: '1_894D0A8', name: 'Personal Care', url: '/shop/browse/personal-care', location: '/shop/browse/personal-care' },
  // { id: '1_9851658', name: 'Health & Wellness', url: '/shop/browse/health-wellness', location: '/shop/browse/health-wellness' },
  // { id: '1_2432B58', name: 'Household', url: '/shop/browse/cleaning-maintenance', location: '/shop/browse/cleaning-maintenance' },

  // { id: '1_39FD49C', name: 'Pantry', url: '/shop/browse/pantry', location: '/shop/browse/pantry' },
  // { id: '1_61D6FEB', name: 'Pet', url: '/shop/browse/pet', location: '/shop/browse/pet' },
  // { id: '1_DEA3ED5', name: 'Home & Lifestyle', url: '/shop/browse/home-lifestyle', location: '/shop/browse/home-lifestyle' },
  // { id: '1_717445A', name: 'Snacks & Confectionery', url: '/shop/browse/snacks-confectionery', location: '/shop/browse/snacks-confectionery' },
  // { id: '1_9E92C35', name: 'Back to School', url: '/shop/browse/back-to-school', location: '/shop/browse/back-to-school' },


  //[1]// { id: '1_717A94B', name: 'Baby', url: '/shop/browse/baby', location: '/shop/browse/baby' },
  // { id: '1_9834884', name: 'Nappies', url: '/shop/browse/baby/nappies', location: '/shop/browse/baby/nappies' },
  // { id: '1_67E0CDB', name: 'Wipes & Changing', url: '/shop/browse/baby/wipes-changing', location: '/shop/browse/baby/wipes-changing' },
  // { id: '1_CDCF6CF', name: 'Baby Food', url: '/shop/browse/baby/baby-food', location: '/shop/browse/baby/baby-food' },
  // { id: '1_261C240', name: 'Baby Formula & Toddler Milk', url: '/shop/browse/baby/baby-formula-toddler-milk', location: '/shop/browse/baby/baby-formula-toddler-milk' },
  // { id: '1_EA73E9D', name: 'Bath & Skincare', url: '/shop/browse/baby/bath-skincare', location: '/shop/browse/baby/bath-skincare' },
  // { id: '1_F711B70', name: 'Bottles & Baby Feeding', url: '/shop/browse/baby/bottles-baby-feeding', location: '/shop/browse/baby/bottles-baby-feeding' },
  // { id: '1_6C80D4E', name: 'Health & Safety', url: '/shop/browse/baby/health-safety', location: '/shop/browse/baby/health-safety' },
  // { id: '1_A500F4B', name: 'Toys & Playtime', url: '/shop/browse/baby/toys-playtime', location: '/shop/browse/baby/toys-playtime' },
  // { id: '1_0BBE46A', name: 'Baby Travel & Accessories', url: '/shop/browse/baby/baby-travel-accessories', location: '/shop/browse/baby/baby-travel-accessories' },
  // { id: '1_07A6F29', name: 'Pregnancy Care & Family Planning', url: '/shop/browse/baby/pregnancy-care-family-planning', location: '/shop/browse/baby/pregnancy-care-family-planning' },
  // { id: '1_E07A831', name: 'Baby & Toddler Clothing', url: '/shop/browse/baby/baby-toddler-clothing', location: '/shop/browse/baby/baby-toddler-clothing' },

  //// No Proper Schema
  // { id: '1_EE7E479', name: 'Baby Furniture', url: '/shop/browse/baby/baby-furniture', location: '/shop/browse/baby/baby-furniture' },
  // { id: '1_D0D8BA0', name: 'Nursery & Sleeping', url: '/shop/browse/baby/nursery-sleeping', location: '/shop/browse/baby/nursery-sleeping' },
  
  //[2]// { id: '1_DEB537E', name: 'Bakery', url: '/shop/browse/bakery', location: '/shop/browse/bakery' },
  // { id: '1_5402F90', name: 'In-Store Bakery', url: '/shop/browse/bakery/in-store-bakery', location: '/shop/browse/bakery/in-store-bakery' },
  // { id: '1_62B7AA0', name: 'Packaged Bread & Bakery', url: '/shop/browse/bakery/packaged-bread-bakery', location: '/shop/browse/bakery/packaged-bread-bakery' },


  //[3]// { id: '1_6E4F4E4', name: 'Dairy, Eggs & Fridge', url: '/shop/browse/dairy-eggs-fridge', location: '/shop/browse/dairy-eggs-fridge' },
  // { id: '1_B7EF010', name: 'Cheese', url: '/shop/browse/dairy-eggs-fridge/cheese', location: '/shop/browse/dairy-eggs-fridge/cheese' },
  // { id: '1_223D9D6', name: 'Milk', url: '/shop/browse/dairy-eggs-fridge/milk', location: '/shop/browse/dairy-eggs-fridge/milk' },
  // { id: '1_AC76873', name: 'Yoghurt', url: '/shop/browse/dairy-eggs-fridge/yoghurt', location: '/shop/browse/dairy-eggs-fridge/yoghurt' },
  // { id: '1_91794DD', name: 'Cream, Custard & Desserts', url: '/shop/browse/dairy-eggs-fridge/cream-custard-desserts', location: '/shop/browse/dairy-eggs-fridge/cream-custard-desserts' },
  // { id: '1_85274A0', name: 'Eggs, Butter & Margarine', url: '/shop/browse/dairy-eggs-fridge/eggs-butter-margarine', location: '/shop/browse/dairy-eggs-fridge/eggs-butter-margarine' },
  // { id: '1_D2B0685', name: 'Dips & Pate', url: '/shop/browse/dairy-eggs-fridge/dips-pate', location: '/shop/browse/dairy-eggs-fridge/dips-pate' },
  // { id: '1_626AB17', name: 'Ready to Eat Meals', url: '/shop/browse/dairy-eggs-fridge/ready-to-eat-meals', location: '/shop/browse/dairy-eggs-fridge/ready-to-eat-meals' },
  // { id: '1_D3D428B', name: 'Fresh Pasta & Sauces', url: '/shop/browse/dairy-eggs-fridge/fresh-pasta-sauces', location: '/shop/browse/dairy-eggs-fridge/fresh-pasta-sauces' },
  // { id: '1_00ED79B', name: 'Vegetarian & Vegan', url: '/shop/browse/dairy-eggs-fridge/vegetarian-vegan', location: '/shop/browse/dairy-eggs-fridge/vegetarian-vegan' },
  // { id: '1_914C9DE', name: 'International Foods', url: '/shop/browse/dairy-eggs-fridge/international-foods', location: '/shop/browse/dairy-eggs-fridge/international-foods' },
  
  //[4]// { id: '1_3151F6F', name: 'Deli & Chilled Meats', url: '/shop/browse/deli-chilled-meals', location: '/shop/browse/deli-chilled-meals' },
  // { id: '1_696F07C', name: 'Deli Meats', url: '/shop/browse/deli-chilled-meals/deli-meats', location: '/shop/browse/deli-chilled-meals/deli-meats' },
  // { id: '1_CA60E21', name: 'Deli Specialties', url: '/shop/browse/deli-chilled-meals/deli-specialties', location: '/shop/browse/deli-chilled-meals/deli-specialties' },
  // { id: '1_C152362', name: 'Ready to Eat Meals', url: '/shop/browse/deli-chilled-meals/ready-to-eat-meals', location: '/shop/browse/deli-chilled-meals/ready-to-eat-meals' },
  // { id: '1_D24079A', name: 'Vegetarian & Vegan', url: '/shop/browse/deli-chilled-meals/vegetarian-vegan', location: '/shop/browse/deli-chilled-meals/vegetarian-vegan' },
  
  //[5]// { id: '1_5AF3A0A', name: 'Drinks', url: '/shop/browse/drinks', location: '/shop/browse/drinks' },
  // { id: '1_C078A81', name: 'Chilled Drinks', url: '/shop/browse/drinks/chilled-drinkss', location: '/shop/browse/drinks/chilled-drinks' },
  // { id: '1_C693949', name: 'Soft Drinks', url: '/shop/browse/drinks/soft-drinks', location: '/shop/browse/drinks/soft-drinks' },
  // { id: '1_9ACE8BE', name: 'Cordials, Juices & Iced Teas', url: '/shop/browse/drinks/cordials-juices-iced-teas', location: '/shop/browse/drinks/cordials-juices-iced-teas' },
  // { id: '1_EF54199', name: 'Water', url: '/shop/browse/drinks/water', location: '/shop/browse/drinks/water' },
  // { id: '1_B3C6B0A', name: 'Sports & Energy Drinks', url: '/shop/browse/drinks/sports-energy-drinks', location: '/shop/browse/drinks/sports-energy-drinks' },
  // { id: '1_341A912', name: 'Tea', url: '/shop/browse/drinks/tea', location: '/shop/browse/drinks/tea' },
  // { id: '1_3DB16DE', name: 'Coffee', url: '/shop/browse/drinks/coffee', location: '/shop/browse/drinks/coffee' },
  // { id: '1_F4FDD26', name: 'Flavoured Milk', url: '/shop/browse/drinks/flavoured-milk', location: '/shop/browse/drinks/flavoured-milk' },
  // { id: '1_159A4FB', name: 'Long Life Milk', url: '/shop/browse/drinks/long-life-milk', location: '/shop/browse/drinks/long-life-milk' },
  // { id: '1_C82527E', name: 'Low & Non Alcoholic Drinks', url: '/shop/browse/drinks/low-non-alcoholic-drinks', location: '/shop/browse/drinks/low-non-alcoholic-drinks' },
 
   //// No Proper Schema  
   // { id: '1_6A19A68', name: 'Home Brew', url: '/shop/browse/drinks/home-brew', location: '/shop/browse/drinks/home-brew' },

  //[6]// { id: '1_ACA2FC2', name: 'Freezer', url: '/shop/browse/freezer', location: '/shop/browse/freezer' },
  // { id: '1_5CE3A44', name: 'Frozen Meals', url: '/shop/browse/freezer/frozen-meals', location: '/shop/browse/freezer/frozen-meals' },
  // { id: '1_22C1314', name: 'Chips & Wedges', url: '/shop/browse/freezer/chips-wedges', location: '/shop/browse/freezer/chips-wedges' },
  // { id: '1_B0FFC5D', name: 'Frozen Seafood', url: '/shop/browse/freezer/frozen-seafood', location: '/shop/browse/freezer/frozen-seafood' },
  // { id: '1_7BE3AEA', name: 'Frozen Meat', url: '/shop/browse/freezer/frozen-meat', location: '/shop/browse/freezer/frozen-meat' },
  // { id: '1_7732C14', name: 'Frozen Pizzas', url: '/shop/browse/freezer/frozen-pizzas', location: '/shop/browse/freezer/frozen-pizzas' },
  // { id: '1_A96D7F8', name: 'Frozen Vegetables', url: '/shop/browse/freezer/frozen-vegetables', location: '/shop/browse/freezer/frozen-vegetables' },
  // { id: '1_4B53D5A', name: 'Frozen Fruit', url: '/shop/browse/freezer/frozen-fruit', location: '/shop/browse/freezer/frozen-fruit' },
  // { id: '1_D04DE47', name: 'Ice Cream', url: '/shop/browse/freezer/ice-cream', location: '/shop/browse/freezer/ice-cream' },
  // { id: '1_80CCBDB', name: 'Frozen Desserts', url: '/shop/browse/freezer/frozen-desserts', location: '/shop/browse/freezer/frozen-desserts' },
  // { id: '1_BEADFEA', name: 'Frozen Party Food', url: '/shop/browse/freezer/frozen-party-food', location: '/shop/browse/freezer/frozen-party-food' },
  // { id: '1_45977FE', name: 'Frozen Pies & Sausage Rolls', url: '/shop/browse/freezer/frozen-pies-sausage-rolls', location: '/shop/browse/freezer/frozen-pies-sausage-rolls' },
  
  //// No Proper Schema
  // { id: '1_3382FC2', name: 'Frozen Gluten Free', url: '/shop/browse/freezer/frozen-gluten-free', location: '/shop/browse/freezer/frozen-gluten-free' },

  //[7]// { id: '1_8D61DD6', name: 'Beauty', url: '/shop/browse/beauty-personal-care', location: '/shop/browse/beauty-personal-care' },
  // { id: '1_4DEA168', name: 'Cosmetics', url: '/shop/browse/beauty/cosmetics', location: '/shop/browse/beauty/cosmetics' },
  // { id: '1_5F369A0', name: 'Beauty Tools & Nails', url: '/shop/browse/beauty/beauty-tools-nails', location: '/shop/browse/beauty/beauty-tools-nails' },
  // { id: '1_9FE5A96', name: 'Skincare & Body', url: '/shop/browse/beauty/skincare-body', location: '/shop/browse/beauty/skincare-body' },
  // { id: '1_9F80E70', name: 'Hair Care', url: '/shop/browse/beauty/hair-care', location: '/shop/browse/beauty/hair-care' },
  // { id: '1_20B7910', name: 'Hair Colour', url: '/shop/browse/beauty/hair-colour', location: '/shop/browse/beauty/hair-colour' },
  
  //[8]// { id: '1_894D0A8', name: 'Personal Care', url: '/shop/browse/personal-care', location: '/shop/browse/personal-care' },
  // { id: '1_4290CA1', name: 'Womens Hair Removal', url: '/shop/browse/personal-care/women-s-hair-removal', location: '/shop/browse/personal-care/women-s-hair-removal' },
  // { id: '1_8B886DE', name: 'Shower, Bath & Body', url: '/shop/browse/personal-care/shower-bath-body', location: '/shop/browse/personal-care/shower-bath-body' },
  // { id: '1_098A313', name: 'Hair Care', url: '/shop/browse/personal-care/hair-care', location: '/shop/browse/personal-care/hair-care' },
  // { id: '1_6DCE3C5', name: 'Oral Care', url: '/shop/browse/personal-care/oral-care', location: '/shop/browse/personal-care/oral-care' },
  // { id: '1_DCFD79C', name: 'Mens Care', url: '/shop/browse/personal-care/men-s-care', location: '/shop/browse/personal-care/men-s-care' },
  // { id: '1_A6EDC50', name: 'Period & Continence Care', url: '/shop/browse/personal-care/period-continence-care', location: '/shop/browse/personal-care/period-continence-care' },
  // { id: '1_990EF76', name: 'Sun Protection', url: '/shop/browse/personal-care/sun-protection', location: '/shop/browse/personal-care/sun-protection' },
  // { id: '1_D771F24', name: 'Travel Toiletries & Minis', url: '/shop/browse/personal-care/travel-toiletries-minis', location: '/shop/browse/personal-care/travel-toiletries-minis' },
  
  //[9]// { id: '1_9851658', name: 'Health & Wellness', url: '/shop/browse/health-wellness', location: '/shop/browse/health-wellness' },
  // { id: '1_855EAED', name: 'Health Foods', url: '/shop/browse/health-wellness/health-foods', location: '/shop/browse/health-wellness/health-foods' },
  // { id: '1_67B032F', name: 'Vitamins', url: '/shop/browse/health-wellness/vitamins', location: '/shop/browse/health-wellness/vitamins' },
  // { id: '1_18B863A', name: 'Diet & Sports Nutrition', url: '/shop/browse/health-wellness/diet-sports-nutrition', location: '/shop/browse/health-wellness/diet-sports-nutrition' },
  // { id: '1_329A89C', name: 'First Aid & Medicinal', url: '/shop/browse/health-wellness/first-aid-medicinal', location: '/shop/browse/health-wellness/first-aid-medicinal' },      
  
  //[10]// { id: '1_2432B58', name: 'Cleaning & Maintenance', url: '/shop/browse/cleaning-maintenance', location: '/shop/browse/cleaning-maintenance'}
  // { id: '1_2F587AA', name: 'Laundry', url: '/shop/browse/cleaning-maintenance/laundry', location: '/shop/browse/cleaning-maintenance/laundry' },
  // { id: '1_A2E3843', name: 'Kitchen', url: '/shop/browse/cleaning-maintenance/kitchen', location: '/shop/browse/cleaning-maintenance/kitchen' },
  // { id: '1_691F830', name: 'Toilet Paper, Tissues & Paper Towels', url: '/shop/browse/cleaning-maintenance/toilet-paper-tissues-paper-towels', location: '/shop/browse/cleaning-maintenance/toilet-paper-tissues-paper-towels' },
  // { id: '1_6174AF3', name: 'Cleaning Goods', url: '/shop/browse/cleaning-maintenance/cleaning-goods', location: '/shop/browse/cleaning-maintenance/cleaning-goods' },
  // { id: '1_AF39A7A', name: 'Pest Control', url: '/shop/browse/cleaning-maintenance/pest-control', location: '/shop/browse/cleaning-maintenance/pest-control' },
  // { id: '1_F364D22', name: 'Garden & Outdoors', url: '/shop/browse/cleaning-maintenance/garden-outdoors', location: '/shop/browse/cleaning-maintenance/garden-outdoors' },
  // { id: '1_8AF7215', name: 'Hardware', url: '/shop/browse/cleaning-maintenance/hardware', location: '/shop/browse/cleaning-maintenance/hardware' },
  
  //[11]// { id: '1_39FD49C', name: 'Pantry', url: '/shop/browse/pantry', location: '/shop/browse/pantry' },
  // { id: '1_C7A623D', name: 'Breakfast & Spreads', url: '/shop/browse/pantry/breakfast-spreads', location: '/shop/browse/pantry/breakfast-spreads' },
  // { id: '1_8A702B7', name: 'Tea & Coffee', url: '/shop/browse/pantry/tea-coffee', location: '/shop/browse/pantry/tea-coffee' },
  // { id: '1_0B44952', name: 'Long Life Milk', url: '/shop/browse/pantry/long-life-milk', location: '/shop/browse/pantry/long-life-milk' },
  // { id: '1_8458E3A', name: 'Baking', url: '/shop/browse/pantry/baking', location: '/shop/browse/pantry/baking' },
  // { id: '1_F779C5C', name: 'Herbs & Spices', url: '/shop/browse/pantry/herbs-spices', location: '/shop/browse/pantry/herbs-spices' },
  // { id: '1_F43CC25', name: 'Condiments', url: '/shop/browse/pantry/condiments', location: '/shop/browse/pantry/condiments' },
  // { id: '1_23C59D3', name: 'Canned Food & Instant Meals', url: '/shop/browse/pantry/canned-food-instant-meals', location: '/shop/browse/pantry/canned-food-instant-meals' },
  // { id: '1_B5F8608', name: 'Pasta, Rice & Grains', url: '/shop/browse/pantry/pasta-rice-grains', location: '/shop/browse/pantry/pasta-rice-grains' },
  // { id: '1_83608CE', name: 'Cooking Sauces & Recipe Bases', url: '/shop/browse/pantry/cooking-sauces-recipe-bases', location: '/shop/browse/pantry/cooking-sauces-recipe-bases' },
  // { id: '1_53601CD', name: 'International Foods', url: '/shop/browse/pantry/international-foods', location: '/shop/browse/pantry/international-foods' },
  // { id: '1_69A326C', name: 'Desserts', url: '/shop/browse/pantry/desserts', location: '/shop/browse/pantry/desserts' },
  // { id: '1_EEEE0B7', name: 'Muesli Bars & Snack Bars', url: '/shop/browse/pantry/muesli-bars-snack-bars', location: '/shop/browse/pantry/muesli-bars-snack-bars' },
  // { id: '1_E216643', name: 'Oil & Vinegar', url: '/shop/browse/pantry/oil-vinegar', location: '/shop/browse/pantry/oil-vinegar' },
 
  
  //[12]// { id: '1_61D6FEB', name: 'Pet', url: '/shop/browse/pet', location: '/shop/browse/pet' },
  // { id: '1_1969229', name: 'Cat & Kitten', url: '/shop/browse/pet/cat-kitten', location: '/shop/browse/pet/cat-kitten' },
  // { id: '1_EF205FA', name: 'Dog & Puppy', url: '/shop/browse/pet/dog-puppy', location: '/shop/browse/pet/dog-puppy' },
  // { id: '1_C7C6294', name: 'Birds, Fish & Small Pets', url: '/shop/browse/pet/birds-fish-small-pets', location: '/shop/browse/pet/birds-fish-small-pets' },

  // [13]// { id: '1_DEA3ED5', name: 'Home & Lifestyle', url: '/shop/browse/home-lifestyle', location: '/shop/browse/home-lifestyle' },
  // { id: '1_889CCA1', name: 'Dining & Entertaining', url: '/shop/browse/home-lifestyle/dining-entertaining', location: '/shop/browse/home-lifestyle/dining-entertaining' },
  // { id: '1_792C364', name: 'Party Supplies', url: '/shop/browse/home-lifestyle/party-supplies', location: '/shop/browse/home-lifestyle/party-supplies' },
  // { id: '1_6D2541E', name: 'Kitchenware & Storage', url: '/shop/browse/home-lifestyle/kitchenware-storage', location: '/shop/browse/home-lifestyle/kitchenware-storage' },
  // { id: '1_DB03E11', name: 'Home Appliances', url: '/shop/browse/home-lifestyle/home-appliances', location: '/shop/browse/home-lifestyle/home-appliances' },
  // { id: '1_DC2126B', name: 'Home Decor & Furniture', url: '/shop/browse/home-lifestyle/home-decor-furniture', location: '/shop/browse/home-lifestyle/home-decor-furniture' },
  // { id: '1_821B14C', name: 'Bathroom Towels & Accessories', url: '/shop/browse/home-lifestyle/bathroom-towels-accessories', location: '/shop/browse/home-lifestyle/bathroom-towels-accessories' },
  // { id: '1_3D142C0', name: 'Clothing & Accessories', url: '/shop/browse/home-lifestyle/clothing-accessories', location: '/shop/browse/home-lifestyle/clothing-accessories' },
  // { id: '1_CAAEDBB', name: 'Stationery & Office Supplies', url: '/shop/browse/home-lifestyle/stationery-office-supplies', location: '/shop/browse/home-lifestyle/stationery-office-supplies' },
  // { id: '1_BD834F5', name: 'Toys & Games', url: '/shop/browse/home-lifestyle/toys-games', location: '/shop/browse/home-lifestyle/toys-games' },
  // { id: '1_0D0883E', name: 'Books & Magazines', url: '/shop/browse/home-lifestyle/books-magazines', location: '/shop/browse/home-lifestyle/books-magazines' },
  // { id: '1_003F162', name: 'Luggage & Travel', url: '/shop/browse/home-lifestyle/luggage-travel', location: '/shop/browse/home-lifestyle/luggage-travel' },
  
  
  //[14]// { id: '1_717445A', name: 'Snacks & Confectionery', url: '/shop/browse/snacks-confectionery', location: '/shop/browse/snacks-confectionery' },
  // { id: '1_B3139DF', name: 'Confectionery', url: '/shop/browse/snacks-confectionery/confectionery', location: '/shop/browse/snacks-confectionery/confectionery' },
  // { id: '1_12FABCA', name: 'Gum, Mints & Lozenges', url: '/shop/browse/snacks-confectionery/gum-mints-lozenges', location: '/shop/browse/snacks-confectionery/gum-mints-lozenges' },
  // { id: '1_3F5B6B6', name: 'Chips', url: '/shop/browse/snacks-confectionery/chips', location: '/shop/browse/snacks-confectionery/chips' },
  // { id: '1_99CAF0C', name: 'Snacks', url: '/shop/browse/snacks-confectionery/snacks', location: '/shop/browse/snacks-confectionery/snacks' },
  // { id: '1_3F5B6B6', name: 'Chips', url: '/shop/browse/snacks-confectionery/chips', location: '/shop/browse/snacks-confectionery/chips' },
  // { id: '1_99CAF0C', name: 'Snacks', url: '/shop/browse/snacks-confectionery/snacks', location: '/shop/browse/snacks-confectionery/snacks' },
  // { id: '1_6F15A6A', name: 'Biscuits & Crackers', url: '/shop/browse/snacks-confectionery/biscuits-crackers', location: '/shop/browse/snacks-confectionery/biscuits-crackers' },

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
    const page = (await browser2.newPage()).removeAllListeners("request");
    // const page = await browser2.newPage();
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.43");
    await page.setExtraHTTPHeaders({
      Referer: "https://www.woolworths.com.au/",
    });
    const loadedCookies = JSON.parse(fs.readFileSync("./woolworths/cookies.json", "utf-8"));
    await page.setCookie(...loadedCookies);
    await safeNavigate(page, "https://www.woolworths.com.au");
    // await delay(60000)
    // await delay(60000)
    // await delay(60000)
    // await delay(60000)
    await delay(2000);
    await page.reload();
    await delay(3000);
    await page.reload();
    await delay(3000);
    // await delay(60000)
    // await delay(60000)
    if (!booool) {
      console.log("1");
      booool = true;
    } else {
      await delay(5000);
      for (let i = 1; i > 5; i++) {
        await delay(3000);
        await page.reload();
      }
      await delay(20000);
      console.log("2");
    }
    //await handleSteps(page, mylocation[i], "https://www.woolworths.com.au");
    // const cookies = await page.cookies();
    // console.log('Extracted Cookies:', cookies);

    // Save cookies to a file or database (optional)
    // fs.writeFileSync('./woolworths/cookies.json', JSON.stringify(cookies, null, 2));
    // await delay(60000);

    await Promise.allSettled(
      CATEGORIES.map(async (category, index) => {
        let page2;
        page2 = (await browser2.newPage()).removeAllListeners("request");
        const randomUserAgent = userAgents[index];
        await page2.setUserAgent(randomUserAgent);
        await page2.setExtraHTTPHeaders({
          Referer: "https://www.woolworths.com.au/",
        });
        await safeNavigate(page2, "https://www.woolworths.com.au");
        await delay(20000);

        // const content = await page2.evaluate(() => document.body.innerText);

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

        const products = await scrapeCategory(page2, category, mylocation[i], page, browser2);
        console.log("category:", category, "Number of products:", products.length);
        await page2.close();
      })
    );
    console.log("all done in location:", mylocation[i]);
    // await browser2.close();
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
    pageSize: 36,
    sortType: "Name",
    url: category.url,
    location: category.location,
    formatObject: `{\"name\":\"${category.name}\"}`,
    isSpecial: false,
    isBundle: false,
    isMobile: false,
    filters: [],
    token: "",
    gpBoost: 0,
    isHideUnavailableProducts: true,
    isRegisteredRewardCardPromotion: false,
    enableAdReRanking: false,
    // sortType: 'TraderRelevance',
    groupEdmVariants: true,
    categoryVersion: "v2",
  };

  const res = await callFetch(page, body);
  // console.log('First category response:', res);

  const numProducts = res.TotalRecordCount || 0;
  const numPages = Math.ceil(numProducts / 36);
  console.log("Products: ", numProducts, "Pages: ", numPages);
  console.log("Pages: ", numPages);

  const productRes = [];

  for (let i = 1; i <= numPages; i++) {
    console.log("pageResetvalue", pageReset);
    if (pageReset > 20) {
      const loadedCookies = JSON.parse(fs.readFileSync("./woolworths/cookies.json", "utf-8"));
      await page.setCookie(...loadedCookies);
      await safeNavigate(page, "https://www.woolworths.com.au");
      // await page.goto('https://www.woolworths.com.au', { waitUntil: 'domcontentloaded' });
      // await delay(20000)
      for (let i = 1; i > 5; i++) {
        await delay(4000);
        await p.reload();
      }
      await delay(20000);
      for (let i = 1; i > 3; i++) {
        await delay(2500);
        await page.reload();
      }
      console.log("creating new page");
      await delay(5000);
      page.removeAllListeners("request");
      const content = await page.evaluate(() => document.body.innerText);
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
        // await browser2.close();
        // return [];
      }

      await page.setBypassCSP(true);
      pageReset = 0;
    }
    pageReset = pageReset + 1;
    body.pageNumber = i;
    body.location = `${category.location}?pageNumber=${i}`;
    body.url = `${category.url}?pageNumber=${i}`;
    const products = await scrapeURL(page, body, myloc);
    console.log("Number of products:", products.length, "on page:", i);
    if (products && products.length === 0) {
      console.log("No more products:");
      break;
    }
    productRes.push(...products);
    // await delay(1000)
  }
  // if (productRes && productRes.length > 0) console.log('all products', productRes.length)
  return productRes;
};

const scrapeURL = async (page, request, myloc) => {
  const res = await callFetch(page, request);

  if (!res.Bundles) {
    console.log("Failed to scrape category: ", request.categoryId, res);
    return [];
  }

  const products = res.Bundles.map((bundle) => {
    const product = bundle.Products[0];
    const location = myloc;
    const inputString = product.CupMeasure || "";

    // Extract values
    const price = parseFloat(product.InstorePrice || product.Price);
    // const priceOnly = price.replace("$", "");
    const price2 = parseFloat(product.CupPrice || product.InstoreCupPrice);
    const priceInCents = parseFloat(price) * 100;
    const priceInCentsPerUnits = parseFloat(price2) * 100;
    // Remove numbers and keep only letters
    const unit = (() => {
      if (!inputString) return "";
      const match = inputString.match(/^(\d*)([a-zA-Z]+)$/);
      if (!match) return inputString.toUpperCase();
      const [, num, u] = match;
      return `${num || "1"}${u.toUpperCase()}`;
    })();

    return {
      name: product.DisplayName,
      discounted_from: product.WasPrice,
      image_url: product.DetailsImagePaths[0].replace("cdn1", "cdn0"),
      shop: "Woolworths",
      source_url: `https://www.woolworths.com.au/shop/productdetails/${product.Stockcode}/${product.UrlFriendlyName}`,
      retailer_product_id: product.Stockcode,
      barcode: product.Barcode,
      name: product.DisplayName,
      realName: product.name,
      isNew: product.IsNew,
      weight: product.PackageSize, //CupMeasure,
      category: product.AdditionalAttributes.piesdepartmentnamesjson,
      subCategory: product.AdditionalAttributes.piescategorynamesjson,
      extensionCategory: product.AdditionalAttributes.piessubcategorynamesjson,
      prices: getPrices(priceInCents, priceInCentsPerUnits, unit),
    };
  });
  if (products.length > 0) {
    for (const data of products) {
      const q = await Product.findOne({ retailer_product_id: data.retailer_product_id });
      if (!q) {
        // console.log('Product not found. Creating new product:', { ...data });
        const createdProduct = await Product.create({ ...data });
        // console.log('Created product:', createdProduct);
      } else {
        const updatedPrices = [...q.prices];
        let priceUpdated = false;

        // Compare and update prices
        for (let i = 0; i < updatedPrices.length; i++) {
          if (data.prices > 0 && updatedPrices > 0) {
            if (updatedPrices[i].state.toLowerCase() === data.prices[0].state.toLowerCase()) {
              // Compare location
              updatedPrices[i].price = data.prices[0].price;
              updatedPrices[i].price_per_unit = data.prices[0].price_per_unit;
              updatedPrices[i].price_unit = data.prices[0].price_unit;
              priceUpdated = true;
              break;
            }
          }
        }

        // If no match, push the new price data
        if (!priceUpdated) {
          updatedPrices.push(data.prices[0]);
        }
        await Product.findByIdAndUpdate(q._id, { $set: { prices: updatedPrices } }, { new: true });
      }
    }
  }
  return products;
};

const callFetch = async (page, request) => {
  const retries = 99999;
  for (let i = 0; i < retries; i++) {
    try {
      const a = await page.evaluate(
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
      if (a.error || !a || a === undefined) {
        console.error("Error in fetch:", a.error);
        throw new Error("");
      }
      return a;
    } catch (err) {
      console.error(`Attempt ${i + 1} failed: ${err}`);
      if (i === retries - 1) throw err;
      await delay(2000);
    }
  }
};


// import dotenv from 'dotenv';
// import puppeteer from "puppeteer-extra";
// import StealthPlugin from "puppeteer-extra-plugin-stealth";
// import RateLimiter from "../RateLimit/index.js";
// import fs from "fs";
// import safeNavigate from "./controllers/helpers/safeNavigate.js";
// import Product from "./models/products.js";
// import dbConnect from "./db/dbConnect.js";

// dotenv.config();
// puppeteer.use(StealthPlugin());

// const userAgents = [
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:103.0) Gecko/20100101 Firefox/103.0",
//   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Version/14.1.2 Safari/537.36",
//   "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36 Edg/114.0.1823.43",
//   "Mozilla/5.0 (Linux; Android 11; Pixel 4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36"
// ];

// const locations = [
//   { code: "nsw", name: "New South Wales", location: "/shop/browse/baby" },
// ];

// const CATEGORIES = [
//   { id: '1_717A94B', name: 'Baby', url: '/shop/browse/baby', location: '/shop/browse/baby' },
//   // { id: '1_DEB537E', name: 'Bakery', url: '/shop/browse/bakery', location: '/shop/browse/bakery' },
//   // { id: '1_6E4F4E4', name: 'Dairy, Eggs & Fridge', url: '/shop/browse/dairy-eggs-fridge', location: '/shop/browse/dairy-eggs-fridge' },
//   // { id: '1_3151F6F', name: 'Deli & Chilled Meats', url: '/shop/browse/deli-chilled-meals', location: '/shop/browse/deli-chilled-meals' },
//   // { id: '1_5AF3A0A', name: 'Drinks', url: '/shop/browse/drinks', location: '/shop/browse/drinks' }
// ];

// const WOOLWORTHS_API_ENDPOINT = "https://www.woolworths.com.au/apis/ui/browse/category";
// const WOOLWORTHS_URL = "https://www.woolworths.com.au";
// const SPEED_LIMIT = 20;
// const MAX_RETRIES = 3;
// const PAGE_SIZE = 24;

// function delay(time) {
//   return new Promise((resolve) => setTimeout(resolve, time));
// }

// const getPrices = (priceInCents, priceInCentsPerUnits, unit, state) => {
//   return [{
//     state: state.toUpperCase(),
//     price: priceInCents ? parseFloat(Number(priceInCents).toFixed(2)) : null,
//     price_per_unit: priceInCentsPerUnits ? parseFloat(Number(priceInCentsPerUnits).toFixed(2)) : null,
//     price_unit: unit || "",
//   }];
// };

// const formatPriceUnit = (inputString) => {
//   if (!inputString) return "";
  
//   let unit = inputString.replace(/[0-9]/g, "");
  
//   if (unit === "EA" || unit === "ea") {
//     return "1" + unit;
//   }
  
//   if (unit && unit !== "1EA" && unit !== "1ea") {
//     const numMatch = inputString.match(/\d+/);
//     if (numMatch) {
//       return numMatch[0] + unit;
//     } else {
//       return "1" + unit;
//     }
//   }
  
//   return unit;
// };

// const callFetch = async (page, request, retryCount = 0) => {
//   try {
//     const response = await page.evaluate(
//       async (request, url) => {
//         return await fetch(url, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//           },
//           body: JSON.stringify(request),
//         })
//           .then((res) => res.json())
//           .catch((err) => ({ error: err.message }));
//       },
//       request,
//       WOOLWORTHS_API_ENDPOINT
//     );

//     if (response.error || !response) {
//       throw new Error(`API Error: ${response.error || 'Invalid response'}`);
//     }

//     return response;
//   } catch (error) {
//     console.error(`Fetch attempt ${retryCount + 1} failed:`, error.message);
    
//     if (retryCount < MAX_RETRIES) {
//       await delay(2000 * (retryCount + 1)); // Exponential backoff
//       return callFetch(page, request, retryCount + 1);
//     }
    
//     throw error;
//   }
// };

// const processProducts = async (products, locationCode) => {
//   const processedProducts = products.map((product) => {
//     const price = parseFloat(product.InstorePrice || product.Price);
//     const price2 = parseFloat(product.CupPrice || product.InstoreCupPrice);
//     const priceInCents = parseFloat(price) * 100;
//     const priceInCentsPerUnits = parseFloat(price2) * 100;
//     const unit = formatPriceUnit(product.CupMeasure || "");

//     return {
//       name: product.DisplayName,
//       discounted_from: product.WasPrice,
//       image_url: product.DetailsImagePaths?.[0]?.replace("cdn1", "cdn0"),
//       shop: "Woolworths",
//       source_url: `https://www.woolworths.com.au/shop/productdetails/${product.Stockcode}/${product.UrlFriendlyName}`,
//       retailer_product_id: product.Stockcode,
//       barcode: product.Barcode,
//       realName: product.name,
//       isNew: product.IsNew,
//       weight: product.PackageSize,
//       category: product.AdditionalAttributes?.piesdepartmentnamesjson,
//       subCategory: product.AdditionalAttributes?.piescategorynamesjson,
//       extensionCategory: product.AdditionalAttributes?.piessubcategorynamesjson,
//       prices: getPrices(priceInCents, priceInCentsPerUnits, unit, locationCode),
//     };
//   });

//   // Save to database
//   for (const productData of processedProducts) {
//     try {
//       const existingProduct = await Product.findOne({ 
//         retailer_product_id: productData.retailer_product_id 
//       });

//       if (!existingProduct) {
//         await Product.create(productData);
//         console.log(`Created new product: ${productData.name}`);
//       } else {
//         const updatedPrices = [...existingProduct.prices];
//         let priceUpdated = false;

//         // Update existing location price or add new location
//         for (let i = 0; i < updatedPrices.length; i++) {
//           if (updatedPrices[i].state.toLowerCase() === productData.prices[0].state.toLowerCase()) {
//             updatedPrices[i] = productData.prices[0];
//             priceUpdated = true;
//             break;
//           }
//         }

//         if (!priceUpdated) {
//           updatedPrices.push(productData.prices[0]);
//         }

//         await Product.findByIdAndUpdate(
//           existingProduct._id, 
//           { $set: { prices: updatedPrices } }, 
//           { new: true }
//         );
//         console.log(`Updated product: ${productData.name} for ${locationCode}`);
//       }
//     } catch (error) {
//       console.error(`Error saving product ${productData.name}:`, error);
//     }
//   }

//   return processedProducts;
// };

// const scrapeCategoryProducts = async (browser, category, locationConfig) => {
//   let allProducts = [];
//   let pageNumber = 1;
//   let hasMorePages = true;
//   let totalProductsReportedByApi = 0;

//   console.log(`Starting to scrape ${category.name} in ${locationConfig.name}`);

//   while (hasMorePages) {
//     const page = await browser.newPage();
    
//     try {
//       // Set random user agent
//       const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
//       await page.setUserAgent(randomUserAgent);
      
//       await page.setExtraHTTPHeaders({
//         Referer: "https://www.woolworths.com.au/",
//       });

//       // Optimize page by blocking unnecessary resources
//       await page.setRequestInterception(true);
//       page.on("request", (req) => {
//         if (!["document", "xhr", "fetch"].includes(req.resourceType())) {
//           return req.abort();
//         }
//         req.continue();
//       });

//       const requestBody = {
//         categoryId: category.id,
//         pageNumber: pageNumber,
//         pageSize: PAGE_SIZE,
//         sortType: "Name",
//         url: category.url,
//         location: locationConfig.location,
//         formatObject: `{\"name\":\"${category.name}\"}`,
//         isSpecial: false,
//         isBundle: false,
//         isMobile: false,
//         filters: [],
//         token: "",
//         gpBoost: 0,
//         isHideUnavailableProducts: true,
//         isRegisteredRewardCardPromotion: false,
//         enableAdReRanking: false,
//         groupEdmVariants: true,
//         categoryVersion: "v2",
//       };

//       const apiResponse = await callFetch(page, requestBody);

//       // Capture total count from API if available (first page only)
//       if (apiResponse?.TotalRecordCount !== undefined && totalProductsReportedByApi === 0) {
//         totalProductsReportedByApi = apiResponse.TotalRecordCount;
//         console.log(`API reported total products for ${category.name} in ${locationConfig.name}: ${totalProductsReportedByApi}`);
//       }

//       // Check if we have valid bundles and products
//       if (apiResponse?.Bundles && apiResponse.Bundles.length > 0) {
//         const productsOnPage = apiResponse.Bundles[0]?.Products || [];

//         if (productsOnPage.length > 0) {
//           allProducts = allProducts.concat(productsOnPage);
//           console.log(`Scraped ${productsOnPage.length} products from page ${pageNumber} for category: ${category.name} in ${locationConfig.name}`);
//           pageNumber++;
          
//           // Small delay between pages to be respectful
//           await delay(1000);
//         } else {
//           // No products on this page - we're done
//           hasMorePages = false;
//           console.log(`No more products found on page ${pageNumber} for category: ${category.name} in ${locationConfig.name}. Stopping.`);
//         }
//       } else {
//         // No valid bundles - we're done
//         hasMorePages = false;
//         console.log(`No valid bundles received for page ${pageNumber} for category: ${category.name} in ${locationConfig.name}. Stopping.`);
//       }

//     } catch (error) {
//       console.error(`Error scraping page ${pageNumber} for category ${category.name} in ${locationConfig.name}:`, error);
//       hasMorePages = false; // Stop on error to prevent infinite loops
//     } finally {
//       await page.close();
//     }
//   }

//   console.log(`Finished scraping ${category.name} in ${locationConfig.name}. Total products collected: ${allProducts.length}`);
  
//   // Optional verification against API reported total
//   if (totalProductsReportedByApi > 0 && allProducts.length !== totalProductsReportedByApi) {
//     console.warn(`Warning: Collected ${allProducts.length} products, but API reported ${totalProductsReportedByApi} for ${category.name} in ${locationConfig.name}.`);
//   }

//   return allProducts;
// };

// const setupBrowser = async () => {
//   return await puppeteer.launch({
//     headless: false,
//     executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
//     userDataDir: process.env.CHROME_PATH,
//     args: [
//       '--no-sandbox',
//       '--disable-setuid-sandbox',
//       '--disable-blink-features=AutomationControlled'
//     ]
//   });
// };

// const initializePage = async (browser) => {
//   const page = await browser.newPage();
//   await page.setUserAgent(userAgents[0]);
//   await page.setExtraHTTPHeaders({
//     Referer: "https://www.woolworths.com.au/",
//   });

//   // Load cookies if they exist
//   try {
//     const loadedCookies = JSON.parse(fs.readFileSync("./woolworths/cookies.json", "utf-8"));
//     await page.setCookie(...loadedCookies);
//   } catch (error) {
//     console.log("No existing cookies found or error loading cookies");
//   }

//   await safeNavigate(page, WOOLWORTHS_URL);
//   await delay(3000);
  
//   return page;
// };

// // Main execution function
// (async () => {
//   try {
//     await dbConnect();
//     console.log("Connected to database");

//     const rateLimit = new RateLimiter(SPEED_LIMIT, 5);
//     const browser = await setupBrowser();

//     for (const location of locations) {
//       console.log(`\n=== Starting scraping for ${location.name} ===`);
      
//       // Initialize a page for this location
//       const mainPage = await initializePage(browser);
      
//       // Process all categories for this location
//       const categoryPromises = CATEGORIES.map(async (category, index) => {
//         try {
//           // Add small delay between category starts to avoid overwhelming the server
//           await delay(index * 1000);
          
//           const products = await scrapeCategoryProducts(browser, category, location);
          
//           if (products.length > 0) {
//             await processProducts(products, location.code);
//           }
          
//           return products;
//         } catch (error) {
//           console.error(`Failed to process category ${category.name} for ${location.name}:`, error);
//           return [];
//         }
//       });

//       // Wait for all categories to complete for this location
//       const results = await Promise.allSettled(categoryPromises);
      
//       let totalProducts = 0;
//       results.forEach((result, index) => {
//         if (result.status === 'fulfilled') {
//           totalProducts += result.value.length;
//           console.log(`✓ ${CATEGORIES[index].name}: ${result.value.length} products`);
//         } else {
//           console.log(`✗ ${CATEGORIES[index].name}: Failed - ${result.reason}`);
//         }
//       });

//       console.log(`=== Completed ${location.name}: ${totalProducts} total products ===\n`);
      
//       await mainPage.close();
//       await delay(5000); // Pause between locations
//     }

//     await browser.close();
//     console.log("🎉 All scraping completed successfully!");

//   } catch (error) {
//     console.error("Fatal error:", error);
//     process.exit(1);
//   }
// })();

