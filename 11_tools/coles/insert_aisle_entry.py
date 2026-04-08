#File: 11_tools/coles/insert_aisle_entry.py
import os
import json

TELL_ME_MAP_DIR = "07_configs/coles/mappings/tell_me"

def insert_aisle(filepath, target_key, new_aisle):
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    target_str = str(target_key).strip().lower()
    inserted = False
    already_exists = False
    found = False

    def walk(node):
        nonlocal inserted, already_exists, found
        if isinstance(node, list):
            for item in node:
                walk(item)
        elif isinstance(node, dict):
            node_name = str(node.get("name", "")).strip().lower()
            node_id = str(node.get("tmId", "")).strip()

            if target_str in (node_name, node_id) and node.get("level") in (2, 3):
                found = True
                children = node.setdefault("children", [])

                if any(str(c.get("aisleId")) == str(new_aisle.get("aisleId")) for c in children):
                    already_exists = True
                    return

                children.append(new_aisle)
                children.sort(key=lambda x: x.get("aisle", "").lower())
                inserted = True
                return

            for key in ("children", "subCategories"):
                if key in node:
                    walk(node[key])

    walk(data)

    if inserted:
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        print(f"✅ Inserted into '{target_key}' in {os.path.basename(filepath)}")
    elif already_exists:
        print(f"⛔ Aisle already exists in '{target_key}' in {os.path.basename(filepath)}")
    elif not found:
        print(f"⚠️ No Level 2 or 3 category named or id '{target_key}' found in {os.path.basename(filepath)}")

def get_filename_from_keyword(keyword):
    keyword = keyword.strip().lower()
    for fname in os.listdir(TELL_ME_MAP_DIR):
        if fname.endswith(".json") and keyword in fname.lower():
            return os.path.join(TELL_ME_MAP_DIR, fname)
    return None

def main():
    file_key = input("Enter the target file keyword (e.g., 'baby', 'bakery'): ").strip()
    filepath = get_filename_from_keyword(file_key)

    if not filepath or not os.path.exists(filepath):
        print(f"❌ No matching file for keyword '{file_key}'")
        return

    category_key = input("Enter the target category name or tmId (Level 2 or 3): ").strip()
    aisle_input = input("Paste the aisle JSON (single line): ").strip()

    try:
        aisle_json = json.loads(aisle_input)
    except json.JSONDecodeError:
        print("❌ Invalid JSON")
        return

    insert_aisle(filepath, category_key, aisle_json)

if __name__ == "__main__":
    main()


# 1) To insert the aisle
# py 11_tools/coles/insert_aisle_entry.py
# Enter the target file keyword (e.g., 'baby', 'bakery'): dairy-eggs-fridge
    # baby
    # bakery
    # dairy-eggs-fridge
    # drinks
    # freezer
    # fruit-veg
    # health-beauty
    # household
    # poultry-meat-seafood
    # pantry
    # pet
    # deli-chilled-meats
# Enter the target category name or tmId (Level 2 or 3): 22103
# Paste the aisle JSON (single line): { "aisleId": "8915810", "aisle": "Cream", "url": "https:www.coles.com.au/browse/dairy-eggs-fridge/cream-custard/cream" }