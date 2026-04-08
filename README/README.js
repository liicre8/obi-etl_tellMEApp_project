function toFinal(raw, locInitStoreId, tellMeCategoryMap) {
  const heir = raw.onlineHeirs?.[0] || {};
  const slug = heir.subCategory
    ?.toLowerCase()
    .replace(/ & /g, '-')
    .replace(/\s+/g, '-');

  // Resolve category_id by numeric heir.subCategoryId or fallback by slug
  const categoryId =
    tellMeCategoryMap[heir.subCategoryId] || tellMeCategoryMap[slug] || null;

  // Price math, rounded to cents
  const nowCents     = Math.round(raw.pricing.now * 100);
  const perUnitCents = Math.round(raw.pricing.unit.price * 100);
  const unitQuantity = raw.pricing.unit.ofMeasureQuantity;
  const unitType     = raw.pricing.unit.ofMeasureType;

  return {
    // 1. Unique key first
    source_id:      String(raw.id),                                     // derived from raw.id

    // 2. URL back to the Coles page
    source_url:     `https://www.coles.com.au/product/${slug}-${raw.id}`,// derived from slug (heir.subCategory) + raw.id

    // 3. Human-readable fields
    name:           `${raw.brand} ${raw.name} | ${raw.size}`,           // derived from raw.brand, raw.name, raw.size
    image_url:      `https://cdn.productimages.coles.com.au/productimages${raw.imageUris[0].uri}`, // derived from raw.imageUris[0].uri
    barcode:        raw.gtin || null,                                   // derived from raw.gtin

    // 4. Category metadata
    category_id:    categoryId,                                         // resolved via tellMeCategoryMap[heir.subCategoryId] or slug
    level1:         heir.subCategory   || null,                        // derived from raw.onlineHeirs[0].subCategory
    level2:         heir.category      || null,                        // derived from raw.onlineHeirs[0].category
    level3:         heir.aisle         || null,                        // derived from raw.onlineHeirs[0].aisle

    // 5. Shop, weight, pricing
    shop:           'coles',                                            // constant
    weight:         raw.size,                                           // derived from raw.size
    prices: [{
      state:          'NSW',                                            // fixed per run (or derive from locInitStoreId)
      price:          String(nowCents),                                 // Math.round(raw.pricing.now * 100)
      price_per_unit: String(perUnitCents),                            // Math.round(raw.pricing.unit.price * 100)
      price_unit:     `${unitQuantity}${unitType}`                     // derived from raw.pricing.unit.ofMeasureQuantity & ofMeasureType
    }]
  };
}
