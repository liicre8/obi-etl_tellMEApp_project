# 🛒 Coles Product Final Schema

This schema is the standardized model returned by `toFinal(raw, locInitStoreId, tellMeCategoryMap)`.

---

## 📦 Identifier Fields
- `"source_id":` *(string)*  
  - Derived from `raw.id`  
  - Unique per product  

- `"source_url":` *(string)*  
  - Format: `https://www.coles.com.au/product/{slug}-{id}`  
  - `slug` comes from `onlineHeirs[0].subCategory` → lowercased, spaces → dashes  

- `"barcode":` *(string \| null)*  
  - Derived from `raw.gtin`  
  - GTIN barcode (primary key if available)  

---

## 🏷️ Human-Readable Fields
- `"name":` *(string)*  
  - Format: `${raw.brand} ${raw.name} | ${raw.size}`  
  - Example: `"Ocean Blue Steamed Salmon Portions Natural | 110g"`  

- `"image_url":` *(string)*  
  - Format: `https://cdn.productimages.coles.com.au/productimages{raw.imageUris[0].uri}`  
  - Example: `/7/7207437.jpg` → full CDN URL  

- `"weight":` *(string)*  
  - Derived from `raw.size`  
  - Example: `"110g"`  

---

## 🗂️ Category Metadata
- `"category_id":` *(string \| null)*  
  - Resolved via `tellMeCategoryMap[heir.subCategoryId]` or slug  

- `"level1":` *(string \| null)*  
  - `raw.onlineHeirs[0].subCategory`  

- `"level2":` *(string \| null)*  
  - `raw.onlineHeirs[0].category`  

- `"level3":` *(string \| null)*  
  - `raw.onlineHeirs[0].aisle`  

---

## 🛍️ Shop Info
- `"shop":` *(string)*  
  - Constant: `"coles"`  

---

## 💲 Pricing Array
- `"prices":` *(array of objects)*  

Each entry includes:  
- `"state":` *(string)* → hardcoded `"NSW"` (or derive from `locInitStoreId`)  
- `"price":` *(string)* → current price in cents (`Math.round(raw.pricing.now * 100)`)  
- `"price_per_unit":` *(string)* → per-unit price in cents (`Math.round(raw.pricing.unit.price * 100)`)  
- `"price_unit":` *(string)* → formatted as `${quantity}${type}` from `raw.pricing.unit`  

Example:
```json
"prices": [
  {
    "state": "NSW",
    "price": "450",
    "price_per_unit": "4091",
    "price_unit": "1kg"
  }
]
```

✅ Example Final Object
```
{
  "source_id": "7207437",
  "source_url": "https://www.coles.com.au/product/meat-seafood-7207437",
  "name": "Ocean Blue Steamed Salmon Portions Natural | 110g",
  "image_url": "https://cdn.productimages.coles.com.au/productimages/7/7207437.jpg",
  "barcode": "4006387135478",
  "category_id": "",
  "level1": "Meat & Seafood",
  "level2": "Seafood",
  "level3": "Smoked And Cured Fish",
  "shop": "coles",
  "weight": "110g",
  "prices": [
    {
      "state": "NSW",
      "price": "450",
      "price_per_unit": "4091",
      "price_unit": "1kg"
    }
  ]
}
```
---

👉 This schema doc makes it clear how `toFinal` normalizes Coles raw data into a **stable, GTIN-aware, category-linked, price-centric product model**. 

# 🛒 Coles Product Final Schema (Visual Diagram)

```text
┌───────────────────────────────┐
│         Coles Raw API         │
└───────────────┬───────────────┘
                │
                ▼
     ┌─────────────────────────┐
     │       toFinal()         │
     └───────────┬─────────────┘
                 │
                 ▼
     ┌─────────────────────────┐
     │   Final Product Model   │
     └─────────────────────────┘
                 │
─────────────────┼──────────────────────────────────────────────
                 │
     ┌─────────────────────────┐
     │ 📦 Identifier           │
     ├─────────────────────────┤
     │ source_id   ← raw.id    │
     │ source_url  ← slug+id   │
     │ barcode     ← raw.gtin  │
     └─────────────────────────┘

     ┌─────────────────────────┐
     │ 🏷️ Human Fields         │
     ├─────────────────────────┤
     │ name       ← brand+name+size │
     │ image_url  ← imageUris[0].uri│
     │ weight     ← raw.size        │
     └─────────────────────────┘

     ┌─────────────────────────┐
     │ 🗂️ Category Metadata    │
     ├─────────────────────────┤
     │ category_id ← tellMeCategoryMap[subCategoryId or slug] │
     │ level1      ← onlineHeirs[0].subCategory               │
     │ level2      ← onlineHeirs[0].category                  │
     │ level3      ← onlineHeirs[0].aisle                     │
     └─────────────────────────┘

     ┌─────────────────────────┐
     │ 🛍️ Shop Info            │
     ├─────────────────────────┤
     │ shop = "coles"          │
     └─────────────────────────┘

     ┌─────────────────────────┐
     │ 💲 Prices [array]       │
     ├─────────────────────────┤
     │ state          = "NSW"                      │
     │ price          ← Math.round(pricing.now*100)│
     │ price_per_unit ← Math.round(pricing.unit.price*100) │
     │ price_unit     ← unitQuantity+unitType      │
     └─────────────────────────┘
```
---
This shows:  
- **Left column:** final model blocks.  
- **Right arrows:** where each field is derived from (`raw`, `heir`, or constants).  
- **Pricing** is emphasized as the value-tracked block.  



# 🛒 Coles Product Final Schema (Mermaid Diagram)

```mermaid
flowchart TD

    A[Coles Raw API (raw)] --> B[toFinal() transform]

    B --> C1[📦 Identifier]
    B --> C2[🏷️ Human Fields]
    B --> C3[🗂️ Category Metadata]
    B --> C4[🛍️ Shop Info]
    B --> C5[💲 Prices]

    %% Identifier
    C1 --> D1["source_id ← raw.id"]
    C1 --> D2["source_url ← slug + raw.id"]
    C1 --> D3["barcode ← raw.gtin"]

    %% Human Fields
    C2 --> E1["name ← brand + name + size"]
    C2 --> E2["image_url ← imageUris[0].uri"]
    C2 --> E3["weight ← raw.size"]

    %% Category Metadata
    C3 --> F1["category_id ← tellMeCategoryMap[subCategoryId or slug]"]
    C3 --> F2["level1 ← onlineHeirs[0].subCategory"]
    C3 --> F3["level2 ← onlineHeirs[0].category"]
    C3 --> F4["level3 ← onlineHeirs[0].aisle"]

    %% Shop Info
    C4 --> G1["shop = 'coles'"]

    %% Prices
    C5 --> H1["state = 'NSW' (or from locInitStoreId)"]
    C5 --> H2["price ← Math.round(pricing.now*100)"]
    C5 --> H3["price_per_unit ← Math.round(pricing.unit.price*100)"]
    C5 --> H4["price_unit ← unitQuantity + unitType"]
```

![alt text](<coles _raw_api.png>)