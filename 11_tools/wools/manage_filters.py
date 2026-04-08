#File: 06_orchestration/coles/scripts/manage_filters.py

import json, os, argparse
from colorama import init, Fore, Style

init(autoreset=True)

# Point to your filters directory
CFG = "07_configs/wools/blocks"

# Load a given JSON (name without .json) from CFG
def load(name):
    path = os.path.join(CFG, name + ".json")
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data, path

# Save updated JSON back to path
def save(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, sort_keys=True)
    print(Fore.GREEN + f"✅ Updated {path}")

# Add an entry to level_1.json under the given source key
def add_level1(source, name):
    data, path = load("level_1")
    lst = data.setdefault(source, [])
    if name in lst:
        print(Fore.YELLOW + f"⚠️ '{name}' already exists in level_1[{source}]")
    else:
        lst.append(name)
        lst.sort(key=lambda x: x.lower())  # keep A-Z order
        save(path, data)
        print(Fore.GREEN + f"✅ Added '{name}' to level_1[{source}]")

# Add an entry to level_2.json under the given parent key
def add_level2(parent, name):
    data, path = load("level_2")
    lst = data.setdefault(parent, [])
    if name in lst:
        print(Fore.YELLOW + f"⚠️ '{name}' already exists in level_2[{parent}]")
    else:
        lst.append(name)
        lst.sort(key=lambda x: x.lower())
        save(path, data)
        print(Fore.GREEN + f"✅ Added '{name}' to level_2[{parent}]")

# Add an entry to level_3.json under the given parent key
def add_level3(parent, name):
    data, path = load("level_3")
    lst = data.setdefault(parent, [])
    if name in lst:
        print(Fore.YELLOW + f"⚠️ '{name}' already exists in level_3[{parent}]")
    else:
        lst.append(name)
        lst.sort(key=lambda x: x.lower())
        save(path, data)
        print(Fore.GREEN + f"✅ Added '{name}' to level_3[{parent}]")


# Print contents of all three filter files
def list_all():
    for lvl in ("level_1", "level_2", "level_3"):
        data, _ = load(lvl)
        print(Fore.CYAN + f"\n── {lvl}.json ──")
        for k, v in data.items():
            print(Fore.YELLOW + f"[{k}]")
            for item in v:
                print(Fore.WHITE + "  • " + Fore.GREEN + item)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Manage filter JSONs: level_1.json, level_2.json, level_3.json"
    )
    sub = parser.add_subparsers(dest="cmd")

    # list all filters
    sub.add_parser("list", help="List contents of all filter files")

    # add-level1 <source> <name>
    a1 = sub.add_parser("add-level1", help="Add a Level-1 category under a source key")
    a1.add_argument("source", help="Top-level source (e.g., Coles)")
    a1.add_argument("name", help="Level-1 category name to add")

    # add-level2 <parent> <name>
    a2 = sub.add_parser("add-level2", help="Add a Level-2 category under a Level-1 parent")
    a2.add_argument("parent", help="Level-1 parent name")
    a2.add_argument("name", help="Level-2 category name to add")

    # add-level3 <parent> <name>
    a3 = sub.add_parser("add-level3", help="Add a Level-3 category under a Level-2 parent")
    a3.add_argument("parent", help="Level-2 parent name")
    a3.add_argument("name", help="Level-3 category name to add")

    args = parser.parse_args()
    if args.cmd == "list":
        list_all()
    elif args.cmd == "add-level1":
        add_level1(args.source, args.name)
    elif args.cmd == "add-level2":
        add_level2(args.parent, args.name)
    elif args.cmd == "add-level3":
        add_level3(args.parent, args.name)
    else:
        parser.print_help()



# 1) List everything in your filters
# py -3 11_tools/wools/manage_filters.py list

# 2) Add a new Level-1 category under “Coles”
# py -3 11_tools/wools/manage_filters.py add-level1 Coles "Back To School"

# 3) Add a new Level-2 category under an existing Level-1 (“Baby”)
# py -3 11_toolsn/wools/manage_filters.py add-level2 "Baby" "New Promo Items"

# 4) Add a new Level-3 aisle under a Level-2 (“Baby Clothing”)
# py -3 11_tools/wools/manage_filters.py add-level3 "Baby Clothing" "Baby Socks"
