# File: 01_ingestions/coles/fetch_pyrmont_products.py

import requests
import json
import os

# --- Browser headers ---
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json, text/plain, */*",
    "Referer": "https://www.coles.com.au/",
    "Origin": "https://www.coles.com.au",
    "Connection": "keep-alive"
}

# --- Load cookies.json (exported from browser/Puppeteer) ---
def load_cookies(session, cookies_path=None):
    if cookies_path is None:
        # Always look in the same folder as this script
        cookies_path = os.path.join(os.path.dirname(__file__), "cookies.json")

    if os.path.exists(cookies_path):
        with open(cookies_path, "r", encoding="utf-8") as f:
            cookies = json.load(f)
            for c in cookies:
                if "name" in c and "value" in c:
                    session.cookies.set(c["name"], c["value"])
        print(f"🍪 Loaded cookies from {cookies_path}")
    else:
        print(f"⚠️ No cookies.json found at {cookies_path} — API may block you.")


# --- 1. Lookup locations (confirm Pyrmont) ---
def fetch_location(session):
    url = "https://www.coles.com.au/api/bff/locations/search"
    params = {
        "latitude": -33.867139,
        "longitude": 151.207114,
        "distance": 50,
        "numberOfLocations": 20
    }
    resp = session.get(url, params=params, timeout=15)
    try:
        data = resp.json()
    except Exception:
        print("❌ Location API blocked")
        print(resp.text[:400])
        return None

    for loc in data.get("locations", []):
        if loc.get("locationName") == "Coles Pyrmont":
            print("✅ Found Coles Pyrmont:", loc["fulfillmentStore"]["storeId"])
            return loc["fulfillmentStore"]["storeId"]
    print("❌ Coles Pyrmont not found")
    return None

# --- 2. Fetch product JSON for a category ---
def fetch_products(session, store_id, slug="meat-seafood", page=1):
    build_id = "20250821.3-a6d9f2c5f0c136fb8edbeaaf0f9e7befc4d6158d"  # dynamic, update if needed
    url = f"https://www.coles.com.au/_next/data/{build_id}/en/browse/{slug}.json"
    params = {"slug": slug}
    if page > 1:
        params["page"] = page

    resp = session.get(url, params=params, timeout=15)
    try:
        data = resp.json()
        print(f"✅ Got products for {slug} (page {page})")
        return data
    except Exception:
        print("❌ Product API blocked")
        print(resp.text[:400])
        return None

# --- Main flow ---
if __name__ == "__main__":
    session = requests.Session()
    session.headers.update(HEADERS)
    load_cookies(session)

    store_id = fetch_location(session)
    if store_id:
        data = fetch_products(session, store_id, slug="meat-seafood", page=1)
        if data:
            # Example: print first product names
            try:
                products = data["pageProps"]["results"]["products"]
                for p in products[:5]:
                    print("-", p.get("name"))
            except Exception:
                print("⚠️ Could not parse products JSON")
