# Coles API Category & Store Data

## 📂 API Category Tree Example
**Base Endpoint:**
```
https://www.coles.com.au/_next/data/{build_id}/en/browse/{category}.json
```

### Example Requests
- Page 1: 
``` 
https://www.coles.com.au/_next/data/20250821.3-a6d9f2c5f0c136fb8edbeaaf0f9e7befc4d6158d/en/browse/meat-seafood.json?slug=meat-seafood
```

- Page 2: 
``` 
https://www.coles.com.au/_next/data/20250821.3-a6d9f2c5f0c136fb8edbeaaf0f9e7befc4d6158d/en/browse/meat-seafood.json?page=2&slug=meat-seafood
```

### Updated Build ID
```
- `20250620.3-ce1dc0c1ee75056f6459c7b5a86343069f8b66a3`
```

**Example with updated build:**
```
https://www.coles.com.au/_next/data/20250620.3-ce1dc0c1ee75056f6459c7b5a86343069f8b66a3/en/browse/meat-seafood.json?page=2&slug=meat-seafood
```


### Query String Parameters
- `page` → page number  
- `slug` → category slug (e.g., `meat-seafood`)

---

# 🛒 Coles Product

## 📦 Identifier
- `"gtin":` `4006387135478`   ← unique product key  
- `"id":` `7207437`           ← internal Coles ID (lookup)

---

## 💲 Pricing (Value to Track)
- `"now":` $4.50  
- `"was":` $9.00  
- `"saveAmount":` $4.50  
- `"savePercent":` 50%  
- `"unitPrice":` $40.91 per 1kg  
- `"promotionType":` SPECIAL (PERCENT_OFF)  
- `"priceDescription":` 1/2 Price  

---

## 🏷️ Product Info
- `"name":` Steamed Salmon Portions Natural  
- `"brand":` Ocean Blue  
- `"description":` OCEAN BLUE STEAMED SALMON PORTIONS NATURAL 110G  
- `"size":` 110g  
- `"availability":` InStoreAndOnline  

---

## 🖼️ Images
- `"imageUri":` `/7/7207437.jpg` (default)

---

## 📂 Category Path
- `"tradeProfitCentre":` DAIRY  
- `"categoryGroup":` DAIRY  
- `"category":` SMOKED & CURED FISH  
- `"subCategory":` HOT SMOKED DY  
- `"className":` HOT SMOKED  

---

## 🌐 Online Hierarchy
- `"aisle":` Smoked And Cured Fish  
- `"category":` Seafood  
- `"subCategory":` Meat & Seafood  
- `"categoryId":` 8892671  
- `"aisleId":` 8892678  
- `"subCategoryId":` 7238  


# 🛒 Coles Product Stock Indicators

This document explains how to interpret **In-Stock** and **Out-of-Stock** signals from Coles product JSON responses.

---

## ✅ In-Stock Indicators

| Key                   | Value | Meaning                           |
|------------------------|-------|-----------------------------------|
| `"IsInStock"`          | true  | Product is in stock               |
| `"IsAvailable"`        | true  | Product is available for purchase |
| `"IsPurchasable"`      | true  | Can be added to cart              |
| `"InstoreIsAvailable"` | true  | Available in physical store       |
| `"InstoreIsPurchasable"` | true | Purchasable in store             |
| `"Price"`              | > 0   | Product has a valid price         |
| `"NextAvailabilityDate"` | "2025-06-25" | ⚠️ Indicates future restock (can be queued or pre-ordered, but still purchasable now if stock remains) |

---

## ❌ Out-of-Stock Indicators

| Key                   | Value  | Meaning                         |
|------------------------|--------|---------------------------------|
| `"IsInStock"`          | false  | Product is not in stock         |
| `"IsAvailable"`        | false  | Not available for purchase      |
| `"IsPurchasable"`      | false  | Cannot be added to cart         |
| `"InstoreIsAvailable"` | false  | Not available in physical store |
| `"InstoreIsPurchasable"` | false | Not purchasable in store       |

---

## 📌 Usage Notes
- **True values** = product can be listed, added to cart, and purchased.  
- **False values** = product cannot be purchased (online or in-store).  
- **`NextAvailabilityDate`** may indicate upcoming restock, useful for alerts or back-in-stock notifications.  

---

## ✅ Summary
- Use `"IsInStock"` and `"IsPurchasable"` as **primary stock flags**.  
- Use `"InstoreIsAvailable"` and `"InstoreIsPurchasable"` to distinguish **store-only availability**.  
- Use `"NextAvailabilityDate"` for **future restock prediction**.  
