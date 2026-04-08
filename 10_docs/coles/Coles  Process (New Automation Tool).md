Coles:

1. Fetching coles build id
   File: 01_ingestion/engines/coles/fetch_build_id.js
   # npm run get:buildid

2. Fetching coles json data using axios w/ api url
   File: 01_ingestion/engines/coles/fetch_all_tree.js
   # npm run get:coles-tree

3. After run the fetch data, check the list if there's `New` in category.
   e.g. 🔄 Updated L1_category_list.json with 1 new category: "Big Pack Value"

4. For double checking, to check the newest found category cause it might be already in block list.
   # py -3 11_tools/coles/manage_filters.py list

5. Add a new Level-1 category under “Coles” block list
   # py -3 11_tools/coles/manage_filters.py add-level1 Coles "Big Pack Value"

   Add a new Level-2 category under an existing Level-1 (“Baby”)
   # py -3 11_toolsn/coles/manage_filters.py add-level2 "Baby" "New Promo Items"

   Add a new Level-3 aisle under a Level-2 (“Baby Clothing”)
   # py -3 11_tools/coles/manage_filters.py add-level3 "Baby Clothing" "Baby Socks"

6. To transform/cleaned the raw categories tree to be transferred: 03_staging/coles/categories 
   # py -3 11_tools/coles/compare_and_sync_categories.py --sync

   If none or no data find out.
   e.g. ℹ️ No new Level-1, Level-2, or Level-3 items found.



🛠 Suggested running scripts in 11_tools/

1. compare_and_sync_categories.py
   * Compares raw vs staging categories.
   * Produces a report (03_staging/coles/checks/new_categories.json).
   * With --sync, updates staging with pruned snapshot.

2. insert_aisle.py
   
   * Admin tool to add/update aisles (Level-3) or even new Level-2 under an L1.
   * Writes directly to your Coles mapping store in 07_configs/coles/mappings/.
   * Always backups before overwrite.


























3. manage_filters.py (optional, but useful if your blocklists grow)



* View, add, or remove entries in 07_configs/coles/blocks/level_1.json, level_2.json, level_3.json.
* Ensures no duplicates, consistent casing, and validates JSON.



4. view_new_categories.py (lighter, for CI/CD)



* Runs in check-only mode (like compare_and_sync_categories.py --no-sync).
* Fails CI if new categories exist, forcing you to update configs/mappings first.









