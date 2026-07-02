#File: 11_tools/coles/list_new_categories.py

import json, os
from colorama import init, Fore

init(autoreset=True)

def format_aisle(aisle):
    return f'{{"aisleId": "{aisle["aisleId"]}", "aisle": "{aisle["aisle"]}", "url": "{aisle["url"]}"}}'

def list_new_categories():
    path = "03_staging/coles/checks/new_categories.json"
    if not os.path.exists(path):
        print(Fore.RED + "❌ File not found:", path)
        return

    with open(path, "r", encoding="utf-8") as f:
        new_data = json.load(f)

    print(Fore.MAGENTA + "── new_categories.json ──")

    for lvl, val in new_data.items():
        print(Fore.CYAN + f"\n▶ {lvl}:")
        if isinstance(val, dict):
            for parent, children in val.items():
                print(Fore.YELLOW + f"  [{parent}]")
                # Handle new_level_2 style
                if isinstance(children, list):
                    for entry in children:
                        if isinstance(entry, dict) and "name" in entry and "aisles" in entry:
                            print(Fore.GREEN + f"    • {entry['name']}")
                            for aisle in entry["aisles"]:
                                print(Fore.WHITE + f"      - {format_aisle(aisle)}")
                        else:
                            print(Fore.GREEN + f"    • {entry}")
                # Handle new_level_3 and nested new_level_1 style
                elif isinstance(children, dict):
                    for subcat, aisles in children.items():
                        print(Fore.GREEN + f"    • {subcat}")
                        for aisle in aisles:
                            print(Fore.WHITE + f"      - {format_aisle(aisle)}")
                else:
                    print(Fore.RED + "    [Unsupported structure]")
        elif isinstance(val, list):
            for item in val:
                if isinstance(item, dict):  # e.g., for new_level_1
                    for parent, l2s in item.items():
                        print(Fore.YELLOW + f"  [{parent}]")
                        for l2_name, aisles in l2s.items():
                            print(Fore.GREEN + f"    • {l2_name}")
                            for aisle in aisles:
                                print(Fore.WHITE + f"      - {format_aisle(aisle)}")
                else:
                    print(Fore.GREEN + f"  • {item}")
        else:
            print(Fore.RED + "  [Unexpected format]")

if __name__ == "__main__":
    list_new_categories()



# 1) To show the list of new categories
# Run this command:s
# py 11_tools/coles/list_new_categories.py