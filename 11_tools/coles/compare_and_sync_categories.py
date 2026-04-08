# File: 11_tools/coles/compare_and_sync_categories.py
import os
import json
import shutil
import argparse
import copy

# ---------- IO helpers ----------
def load(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def save(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)

# ---------- string normalization ----------
def norm(s):
    return (s or "").strip().casefold()

def build_url(l1, l2_tok, l3_tok):
    return f"https://www.coles.com.au/browse/{l1}/{l2_tok}/{l3_tok}"

# ---------- pruning ----------
def prune_snapshot(data, lvl1_block, lvl2_block, lvl3_block):
    """
    Return a deep-copied version of `data` with L2/L3 items removed per filters.
    If L1 is blocklisted, return None.
    """
    l1_name = data.get("originalName")
    if norm(l1_name) in lvl1_block:
        return None

    out = copy.deepcopy(data)
    pruned_l2 = []
    for block in data.get("catalogGroupView", []):
        l2_name = block.get("originalName")
        if norm(l2_name) in lvl2_block.get(norm(l1_name), set()):
            continue

        # keep only allowed L3s
        allowed_l3 = []
        for c in block.get("catalogGroupView", []):
            l3_name = c.get("originalName")
            if norm(l3_name) in lvl3_block.get(norm(l2_name), set()):
                continue
            allowed_l3.append(c)

        if not allowed_l3:
            # If all L3s are removed, drop this L2 block entirely
            continue

        nb = copy.deepcopy(block)
        nb["catalogGroupView"] = allowed_l3
        pruned_l2.append(nb)

    out["catalogGroupView"] = pruned_l2
    return out

# ---------- diffing (respects filters) ----------
def compare(old, new, lvl2_block, lvl3_block):
    diff = {"new_level2": [], "new_level3": {}}

    old_l2 = {b.get("originalName"): b for b in old.get("catalogGroupView", [])}
    l1_name = new.get("originalName")
    l1_key = norm(l1_name)

    for block in new.get("catalogGroupView", []):
        l2_name = block.get("originalName")
        if norm(l2_name) in lvl2_block.get(l1_key, set()):
            continue

        if l2_name not in old_l2:
            aisles = []
            for c in block.get("catalogGroupView", []):
                if norm(c.get("originalName")) in lvl3_block.get(norm(l2_name), set()):
                    continue
                aisles.append({
                    "aisleId": c["id"],
                    "aisle": c["originalName"],
                    "url": build_url(new["seoToken"], block["seoToken"], c["seoToken"])
                })
            if aisles:
                diff["new_level2"].append({"name": l2_name, "aisles": aisles})
            continue

        # existing L2: look for new L3s
        old_l3_names = {c.get("originalName") for c in old_l2[l2_name].get("catalogGroupView", [])}
        for c in block.get("catalogGroupView", []):
            l3_name = c.get("originalName")
            if norm(l3_name) in lvl3_block.get(norm(l2_name), set()):
                continue
            if l3_name not in old_l3_names:
                entry = {
                    "aisleId": c["id"],
                    "aisle": l3_name,
                    "url": build_url(new["seoToken"], block["seoToken"], c["seoToken"])
                }
                diff["new_level3"].setdefault(l2_name, []).append(entry)

    return diff

# ---------- main ----------
def main(old_dir, new_dir, cfg_dir, out_path, sync):
    # load filters
    lvl1_filters_raw = load(os.path.join(cfg_dir, "level_1.json"))["Coles"]
    lvl2_filters_raw = load(os.path.join(cfg_dir, "level_2.json"))
    lvl3_filters_raw = load(os.path.join(cfg_dir, "level_3.json"))

    # normalize filters for robust matching
    lvl1_block = {norm(x) for x in lvl1_filters_raw}
    lvl2_block = {norm(k): {norm(v) for v in vals} for k, vals in lvl2_filters_raw.items()}
    lvl3_block = {norm(k): {norm(v) for v in vals} for k, vals in lvl3_filters_raw.items()}

    new_level_1 = []
    new_level_2 = {}
    new_level_3 = {}

    new_slugs = set()

    for fn in os.listdir(new_dir):
        if not fn.endswith(".json"):
            continue

        slug = fn[:-5]
        new_slugs.add(slug)
        new_path = os.path.join(new_dir, fn)
        old_path = os.path.join(old_dir, f"{slug}.json")

        new_data = load(new_path)
        l1_name_val = new_data.get("originalName")
        l1_key = norm(l1_name_val)

        # If L1 is blocklisted: remove any existing old file and skip
        if l1_key in lvl1_block:
            if sync and os.path.exists(old_path):
                os.remove(old_path)
            continue

        # If this L1 file doesn't exist in old → treat whole L1 as "new"
        if not os.path.exists(old_path):
            # build Level-1 report honoring filters
            l1_full = {}
            for block in new_data.get("catalogGroupView", []):
                l2_name = block.get("originalName")
                if norm(l2_name) in lvl2_block.get(l1_key, set()):
                    continue
                l3_list = []
                for c in block.get("catalogGroupView", []):
                    l3_name = c.get("originalName")
                    if norm(l3_name) in lvl3_block.get(norm(l2_name), set()):
                        continue
                    l3_list.append({
                        "aisleId": c["id"],
                        "aisle": l3_name,
                        "url": build_url(new_data["seoToken"], block["seoToken"], c["seoToken"])
                    })
                if l3_list:
                    l1_full[l2_name] = l3_list

            if l1_full:
                new_level_1.append({l1_name_val: l1_full})

            if sync:
                pruned = prune_snapshot(new_data, lvl1_block, lvl2_block, lvl3_block)
                if pruned is not None:
                    save(old_path, pruned)
            continue

        # existing old file → compute diffs (filters respected)
        old_data = load(old_path)
        diff = compare(old_data, new_data, lvl2_block, lvl3_block)

        if diff["new_level2"]:
            new_level_2[l1_name_val] = diff["new_level2"]
        if diff["new_level3"]:
            new_level_3[l1_name_val] = diff["new_level3"]

        # sync with pruned snapshot
        if sync:
            pruned = prune_snapshot(new_data, lvl1_block, lvl2_block, lvl3_block)
            if pruned is not None:
                save(old_path, pruned)
            else:
                # L1 became blocked since last run → delete old file
                if os.path.exists(old_path):
                    os.remove(old_path)

    # write report
    report = {
        "new_level_1": new_level_1,
        "new_level_2": new_level_2,
        "new_level_3": new_level_3
    }
    save(out_path, report)

    print("✅ Report written to", out_path)
    if sync:
        print("✅ old/ folder synced with pruned snapshot (filters applied)")

    # ------- Console summary -------
    n1 = len(new_level_1)
    n2 = sum(len(v) for v in new_level_2.values())
    n3 = sum(len(v) for by_l2 in new_level_3.values() for v in by_l2.values())

    if n1 or n2 or n3:
        print("📊 Summary of new categories found:")
        if n1:
            l1_names = [next(iter(item.keys())) for item in new_level_1]
            preview = ", ".join(l1_names[:10]) + (" ..." if len(l1_names) > 10 else "")
            print(f"  • new_level_1: {n1} L1 file(s) → {preview}")
        if n2:
            per_l1 = [f"{l1}({len(entries)})" for l1, entries in new_level_2.items()]
            preview = ", ".join(per_l1[:10]) + (" ..." if len(per_l1) > 10 else "")
            print(f"  • new_level_2: {n2} L2 group(s) across {len(new_level_2)} L1 → {preview}")
        if n3:
            per_l1l2 = []
            for l1, by_l2 in new_level_3.items():
                for l2, arr in by_l2.items():
                    per_l1l2.append(f"{l1}/{l2}({len(arr)})")
            preview = ", ".join(per_l1l2[:10]) + (" ..." if len(per_l1l2) > 10 else "")
            print(f"  • new_level_3: {n3} L3 aisle(s) across {len(new_level_3)} L1 → {preview}")
    else:
        print("ℹ️ No new Level-1, Level-2, or Level-3 items found.")

    # ---------- NEW: refresh seo_tokens.json ----------
    seo_tokens = []
    for fn in os.listdir(old_dir):   # <--- use staging (old_dir), not new_dir
        if not fn.endswith(".json"):
            continue
        data = load(os.path.join(old_dir, fn))
        token = data.get("seoToken")
        if token:
            seo_tokens.append(token)

    seo_tokens.sort()
    seo_tokens_path = os.path.join("07_configs", "coles", "lookups", "seo_tokens.json")
    save(seo_tokens_path, {"Coles": seo_tokens})
    print(f"✅ seo_tokens.json refreshed with {len(seo_tokens)} tokens → {seo_tokens_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--old", default="03_staging/coles/categories")
    parser.add_argument("--new", default="02_raw/coles/categories")
    parser.add_argument("--cfg", default="07_configs/coles/blocks")
    parser.add_argument("--out", default="03_staging/coles/checks/new_categories.json")
    parser.add_argument(
        "--sync", action="store_true",
        help="after compare, write pruned new→old so blocklists are enforced"
    )
    args = parser.parse_args()
    main(args.old, args.new, args.cfg, args.out, args.sync)


# 1) To compare the old vs new coles categories
# py -3 11_tools/coles/compare_and_sync_categories.py --sync
