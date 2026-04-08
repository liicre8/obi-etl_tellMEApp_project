#File: 08_scripts/run_ingest.sh
#!/usr/bin/env bash
set -euo pipefail

echo "🟢 Starting Ingestion Layer…"
echo

# 1. Fetch Next.js build ID
echo "1️⃣  Fetching build ID…"
npm run get:buildid
echo "   → Inspect the build ID output (e.g. in console or a .buildId file)."
echo "   Press [Enter] when you're ready to continue."
read -r
echo

# 2. Sanity‐check Coles parent categories
echo "2️⃣  Sanity‐checking Coles parent categories…"
npm run check:coles:parents
echo "   → Review the CSV(s) created under temp/coles/CheckerColesPar (or console logs)."
echo "   Press [Enter] when you're ready to continue."
read -r
echo

# 3. Actually pull Coles parent categories
echo "3️⃣  Pulling Coles parent categories…"
npm run get:coles:parents
echo "   → Inspect src/scripts/coles/parents.json (or wherever that script writes)."
echo "   Press [Enter] when you're ready to continue."
read -r
echo

# 4. Pull full Coles category hierarchy
echo "4️⃣  Fetching full Coles category hierarchy…"
npm run get:colesHierarchy
echo "   → Check your 02_raw/<YYYYMMDD>/browse.json (or the output folder of that step)."
echo "   Press [Enter] when you're ready to continue."
read -r
echo

# 5. Verify level-2 & level-3 categories against previous run
echo "5️⃣  Verifying level-2 & level-3 categories…"
npm run check:levels
echo "   → Review CSVs under temp/coles/CheckerLevels/CSV for any anomalies."
echo "   Press [Enter] when you're ready to continue."
read -r
echo

# 6. Generate new level-2 & level-3 lists
echo "6️⃣  Generating new level-2 & level-3 lists…"
npm run gen:levels
echo "   → Inspect configs/shared/filtered/level-2.js and level-3.js (or your filtered outputs)."
echo "   Press [Enter] when you're ready to finish."
read -r
echo

echo "✅ Ingestion complete!"
