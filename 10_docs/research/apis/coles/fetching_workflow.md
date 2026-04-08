# 🛒 Coles Fetching Data Workflow & Medallion Architecture

---

## 🔐 Incapsula (Imperva) Protection
Coles uses **Incapsula bot protection**.  
Direct `axios` requests are blocked unless cookies/headers are set correctly.

---

## 📑 Category Page Counts
- Fruit & Vegetables — Page 1–12  
- Meat & Seafood — Page 1–10  
- Dairy, Eggs & Fridge — Page 1–38  
- Bakery — Page 1–11  
- Deli — Page 1–11  
- Pantry — Page 1–95  
- Dietary & World Foods — Page 1–63  
- Chips, Chocolates & Snacks — Page 1–31  
- Drinks — Page 1–29  
- Frozen — Page 1–22  
- Household — Page 1–58  
- Health & Beauty — Page 1–58  
- Baby — Page 1–13  
- Pet — Page 1–18  
- Liquorland — Page 1  

---

## ⚙️ Fetching Workflow
1. **Load Coles homepage in Puppeteer**  
   - Simulate NSW location (e.g. Pyrmont, Marrickville).  
   - Pass Incapsula protection ✅  

2. **Extract cookies after Puppeteer load**  
   - Save into a `cookies.json` file.  

3. **Use axios for category fetches**  
   - Fruit & Vegetables → Pages 1–12  
   - Meat & Seafood → Pages 1–10  
   - Dairy, Eggs & Fridge → Pages 1–38  
   - … continue sequentially until all categories are fetched.  

---

## 🛡️ CAPTCHA & Blocking Risk
- ✅ Puppeteer initial load = safe  
- ✅ Sequential category fetch = safe  
- ✅ Rate limit: 1 request / 300–500ms = safe  
- ❌ Aggressive burst (all 570 pages at once) = **high risk of block**  

### Safety Recommendations
- Delay: **250–500ms between requests**  
- Max: **3–4 requests/second**  
- Fetch: **sequentially per category**  
- Headers:  
  ```json
  {
    "Cookie": cookieHeader,
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
    "Referer": "https://www.coles.com.au/browse/fruit-vegetables"
  }
  ```
- Detect fallback: if response is HTML (not JSON), pause & retry
- Retry failed pages after 1–2 minutes


🏗️ Medallion Architecture Flow

1. Bronze (Raw)

- Scrape Build ID from Coles website

- Scrape parent categories via API JSON

- Double-check location store ID

2. Silver (Refined)

- Map parent categories to Level 2 & Level 3 categories

- Use tell_me config to align category IDs

3. Gold (Curated)

- Finalize schema (GTIN, barcode, pricing, category hierarchy)

- Store clean JSON with category + product mappings



🗂️ Category Hierarchy Example (onlineHeirs)
```
"onlineHeirs": [
  {
    "aisle": "Kebabs",               // Level 3 category
    "category": "Bbq, Sausages & Burgers", // Level 2 category
    "subCategory": "Meat & Seafood", // Parent label
    "categoryId": "8892656",         // Level 2 categoryId
    "aisleId": "8892659",            // Level 3 aisleId
    "subCategoryId": "7238"          // Level 1 parent categoryId
  }
]
```

# 🖼️ Product Image & Source URL
## Image URL

## From JSON:
```
"imageUris": [
  {
    "altText": "",
    "type": "default",
    "uri": "/3/3900020.jpg"
  }
]
```

# ➡️ Full image link:
```
https://cdn.productimages.coles.com.au/productimages/3/3900020.jpg
```
## Source URL
## From JSON:

```
"id": 3900020,
"description": "COLES LAMB KEBABS 450GRAM"
```

# #️ Full product URL:
```
https://www.coles.com.au/product/coles-lamb-kebabs-450g-3900020
```

## ✅ Summary
- Use Puppeteer once to bypass Incapsula → extract cookies.
- Fetch categories with axios, sequentially + delayed.
- Track Build ID + Store ID for API consistency.
- Product URLs and images are always derivable from Coles JSON.
