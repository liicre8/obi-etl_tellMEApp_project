## In your project structure:

### Pipelines (ETL flow):

Ingestion jobs live in `01_ingestion/.`

Transforms (cleaning, mapping, aggregations) happen inside the data layers (03_staging/, 04_curated/) as part of the pipeline code.

Running scripts (manual, diagnostic, helpers):

Everything you manually execute (compare raw vs staging, sync staging, check categories, validate schema, backfills, exports, etc.) belongs in 11_tools/.

These scripts usually read/write the layer folders (02_raw/, 03_staging/, 04_curated/) but don’t live inside them.

**📂 Clear separation**
03_staging/              # data outputs (JSON, parquet, etc.)
  products/cleaned/...
  categories/cleaned/...
  checks/...

11_tools/                # runnable scripts/utilities
  check_categories.py
  compare_raw_vs_staging.py
  sync_raw_to_staging.py
  utils/                 # shared helper functions
    file_io.py
    diff.py
    cleaning.py

**✅ Rule of thumb**

Data lives in the layer folders (02_raw, 03_staging, 04_curated).

Scripts that act on the data live in 11_tools/.

That way, staging/curated stay clean as data zones, while 11_tools/ is your toolbox for checks, validation, and sync jobs.



**🛠 Suggested running scripts in 11_tools/**

**1. compare_and_sync_categories.py**
   * Compares raw vs staging categories.
   * Produces a report (03_staging/coles/checks/new_categories.json).
   * With --sync, updates staging with pruned snapshot.

**2. insert_aisle.py**
   
   * Admin tool to add/update aisles (Level-3) or even new Level-2 under an L1.
   * Writes directly to your Coles mapping store in 07_configs/coles/mappings/.
   * Always backups before overwrite.




**On Product better to make tags based:**
{
  name: "Tassal Smoked Salmon 150g",
  tags: ["fresh", "seafood", "entertaining", "chilled"]
}
