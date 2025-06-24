# 🛒 Coles & Woolworths Data Workflow (2-PC Setup)

## 🔐 Login for Woolworths
* **URL**: https://www.woolworths.com.au/
* **Email**: `groceries397@gmail.com`
* **Password**: `ObiServices$1991`

## A. Scraping Woolworths

### ✅ 1. `index2.js` — General Scrape
* **Location**: Set only `nsw` in `constant/location.js`
* **CATEGORY Limit**: Only **5 category ID objects at a time** in `const CATEGORY`
* **Run**:
```bash
node woolworths/index2
```

### ✅ 2. `index.js` — Targeted Scrape
* **CATEGORY**: Use only:
   * `Fruit & Vegetables`
   * `Poultry, Meat & Seafood`
* **Locations**: Set **all locations** in `constant/location.js`
* **Run**:
```bash
node woolworths/index
```

## B. Scraping Coles

### ✅ 1. `index2.js` — General Scrape
* **CATEGORIES**: Limit to **50** in `coles/constant/categories.js` (`const CATEGORIES`), comment out the rest
* **Location**: Set only `nsw` in `coles/constant/location.js`

**👁 CAPTCHA Handling:**
```bash
node coles/getCookies
# Wait for: 🔎 Checking for CAPTCHA...
# Browser may open — solve CAPTCHA manually
# Wait for: ✅ CAPTCHA solved! Proceeding...
```

Then:
```bash
node coles/index2
```

### ✅ 2. `index1.js` — Targeted Scrape
* **CATEGORIES**: Limit to 50, only:
   * `Fruit & Vegetables`
   * `Poultry, Meat & Seafood`
* **Locations**: Set **all** in `coles/constant/location.js`

**👁 CAPTCHA Handling:**
```bash
node coles/getCookies
# Solve CAPTCHA manually if needed
```

Then:
```bash
node coles/index1
```

## C. Process Process Data

### ✅ 1. Setup Barcodes (After Coles Scraping)
Coles store products doesn't have barcodes.
Match Coles product data with existing barcode data from DB/API.
```bash
node coles/ColesfetchBarcode
```

### ✅ 2. Generate Final Products per Store
This creates cleaned product lists in the `data/` folder:
```bash
node woolworths/getProducts
```
```bash
node coles/getProducts
```

## D. Matching Products

### 🔁 Matching (Set to 95% Name Similarity)

#### 1. Cleanup Before Matching
Delete old data:
```bash
# Run this on terminal
rm coles/0ColesAll.json
rm coles/0WoolworthsAll.json
rm coles/colesOutput.json
rm coles/matched
```

#### 2. Pack Unmatched Products
```bash
node coles/getAllUnmatched
```

#### 3. Fetch fresh unmatched products
```bash
node transformUnmatched
```

```bash
# Run this command, it will create 0ColesAll.json and 0WoolworthsAll.json
node coles/packUnmatched
```
#### 4. Set Matching Threshold
In `coles/MatchingProducts.js`, set:
```js
nameSimilarity >= '95%'
```

#### 5. Run Matching Script
```bash
# Run the matching process it will save data to in path: coles/matched
node coles/MatchingProducts
```

* Look for:
```yaml
✅ Match Found! Name: 100% | Weight: 100%
```

### 🧪 Post-Matching Check

If not 100% matched:
```bash
node coles/readMatchedJSON
# → Check PackedMatched.json manually
# → Remove incorrect matches based on Coles/Woolworths URLs
```

If all matches are valid:
```bash
node coles/readMatchedJSON
```
```bash
node coles/parseMatchedJSON
```


* Then transfer `coleOutput.json` content to `Matched_Barcode/matchedList.json`
* After transfering those barcodes, transfer `PackedMatched.json` content by renaming it `PackedMatched8.json` or `PackedMatched5.json`  to `NewMatched/` folder.

* Then run this command to update those barcodes:

* To cleaned data NewMatched:
```bash
node coles/removeNewMatched
```
* And update MatchList Barcode:
```bash
node coles/removeNewMatched2
```

### 🔁 Matching (Set to 85% or 87%)
Repeat **the same process** as above with:
* `nameSimilarity >= '85%'` **or** `'87%'` in `MatchingProducts.js`

Then follow the same cleanup, matching, and manual review steps.

## E. Finalize Barcode Update and Push to API

### ✅ 1. Update Barcodes Locally
```bash
node coles/updateBarcodes
```
### ✅ 2. Match Woolworths and Coles Products via comparing barcodes
```bash
node 01MatchedP-Barcode
```
### ✅ 3. Push Matched to External API
```bash
node 02pushMatchedToAPI
```

## F. Handle Unmatched Products

### ✅ 1. Clean and Transform Unmatched
```bash
# Clean up current data unmatched folder
Path: src/UnMatchedAll/*

# Fetch fresh unmatched products
node coles/getAllUnmatched
node transformUnmatched
```

* `transformUnmatched` will clean `colesUnMatched.json` and `woolworthsUnMatched.json`

### ✅ 2. Push Unmatched to API
Set `startIndex = 0` in:
* `03pushUnmatchedToAPI-C.js`
* `04pushUnmatchedToAPI-W.js`

Then:
```bash
node 03pushUnmatchedToAPI-C
node 04pushUnmatchedToAPI-W
```

To check the Price changes, check `checking/` found `CheckingMD.js` and `CheckingUMD.js` change/set the date:
```bash
const yesterdayDate = '';
```
And run:

```bash
#For Matched
node checking/CheckingMD 
#For Unmatched
node checking/CheckingUMD 
```
After that check csv how many prices changes found in `audit` in `matched` &  `unmatched`folder.

## ✅ Summary: Daily Order of Operations

1. Scrape Woolworths (`index2.js` and `index.js`)
2. Scrape Coles (`index2.js` and `index1.js`)
   * Solve CAPTCHA if needed
3. Fetch Coles barcodes: `node coles/ColesfetchBarcode`
4. Generate product files: `getProducts` scripts
5. Pack and match data (95%, 85%, or 87%)
6. Review and finalize matched data
7. Update barcode list
8. Push matched and unmatched data to API

---

*This workflow ensures systematic data collection and processing from both major Australian grocery retailers while maintaining data quality through multiple validation steps.*