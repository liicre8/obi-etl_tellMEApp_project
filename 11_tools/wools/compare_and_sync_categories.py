# File: 03_staging/wools/jobs/compare_and_sync.py
import os
import json
import argparse
import copy
import re

# ---------------- IO helpers ----------------
def load(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

def save(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(obj, f, indent=2, ensure_ascii=False)

# ---------------- utils ----------------
def norm(s: str) -> str:
    return (s or "").strip().casefold()

_slug_re = re.compile(r"[^a-z0-9]+")
def slugify(s: str) -> str:
    """
    Very safe, deterministic slug fallback if UrlFriendlyName is missing.
    Mirrors Woolworths-style slugs enough for browse URLs.
    """
    s = (s or "").strip().lower()
    s = _slug_re.sub("-", s).strip("-")
    return s or "unknown"

def ww_url(l1_slug: str, l2_slug: str, l3_slug: str) -> str:
    return f"https://www.woolworths.com.au/shop/browse/{l1_slug}/{l2_slug}/{l3_slug}"

def node_id(node) -> str:
    return (node or {}).get("NodeId") or ""

def is_specials(node) -> bool:
    """True if NodeId has _SPECIALS (case-insensitive). Applies to L1/L2/L3."""
    return "_specials" in node_id(node).casefold()

# ---------------- robust blocklist loaders ----------------
def load_level1_block(path):
    """
    Accepts:
      - list: ["Baby", "Alcohol", ...]
      - dict keyed by brand: {"Woolworths": [...] } or any single-key dict
    Returns: set of normalized Level-1 names.
    """
    data = load(path)
    if isinstance(data, list):
        return {norm(x) for x in data}
    if isinstance(data, dict):
        for k in ("Woolworths", "Wools", "Woolies", "Coles"):
            if k in data and isinstance(data[k], list):
                return {norm(x) for x in data[k]}
        if len(data) == 1:
            v = next(iter(data.values()))
            if isinstance(v, list):
                return {norm(x) for x in v}
    raise ValueError(
        f"Invalid {path} format. Expected a list or a dict like {{'Woolworths': [...]}}"
    )

def load_levelN_block(path):
    """
    Accepts dict like:
      { "Baby": ["Nappies & Nappy Pants", ...], ... }
    Returns dict with normalized keys and values: { lX_norm: {child_norm, ...}, ... }
    """
    data = load(path)
    if not isinstance(data, dict):
        raise ValueError(f"Invalid {path} format. Expected an object mapping.")
    out = {}
    for k, vals in data.items():
        if isinstance(vals, list):
            out[norm(k)] = {norm(v) for v in vals}
    return out

# ---------------- schema accessors (Woolworths) ----------------
def normalize_l1(data):
    """
    Ensure JSON root is a single L1 dict. Some files wrap it in a list.
    Returns dict or None if empty.
    """
    if isinstance(data, list):
        return data[0] if data else None
    return data

def children(node):
    ch = (node or {}).get("Children")
    return ch if isinstance(ch, list) else []

def l1_name(node): return (node or {}).get("Description") or ""
def l1_slug(node):
    return (node or {}).get("UrlFriendlyName") or slugify(l1_name(node))
def l1_id(node):   return node_id(node)

def l2_name(node): return (node or {}).get("Description") or ""
def l2_slug(node):
    return (node or {}).get("UrlFriendlyName") or slugify(l2_name(node))
def l2_id(node):   return node_id(node)

def l3_name(node): return (node or {}).get("Description") or ""
def l3_slug(node):
    return (node or {}).get("UrlFriendlyName") or slugify(l3_name(node))
def l3_id(node):   return node_id(node)

def iter_l2_blocks(l1_data):
    # Treat all direct children of L1 as L2 for robustness
    for l2 in children(l1_data):
        yield l2

def iter_l3_nodes(l2_node):
    for l3 in children(l2_node):
        yield l3

# ---------------- pruning ----------------
def prune_snapshot(l1_data, lvl1_block, lvl2_block, lvl3_block):
    """
    Return a deep-copied version of Level-1 data with L2/L3 removed by blocklists
    and with ANY node having NodeId *_SPECIALS* removed.
    If Level-1 is blocked (by name) or *_SPECIALS*, return None.
    """
    if l1_data is None:
        return None

    if is_specials(l1_data) or norm(l1_name(l1_data)) in lvl1_block:
        return None

    out = copy.deepcopy(l1_data)
    pruned_l2 = []
    l1_key = norm(l1_name(l1_data))

    for l2 in iter_l2_blocks(l1_data):
        # Skip specials L2 or blocklisted L2 by name
        if is_specials(l2) or norm(l2_name(l2)) in lvl2_block.get(l1_key, set()):
            continue

        allowed_l3 = []
        blocked_l3 = lvl3_block.get(norm(l2_name(l2)), set())
        for l3 in iter_l3_nodes(l2):
            # Skip specials L3 or blocklisted L3 by name
            if is_specials(l3) or norm(l3_name(l3)) in blocked_l3:
                continue
            allowed_l3.append(l3)

        if not allowed_l3:
            # drop this L2 entirely if no L3 remain
            continue

        nb = copy.deepcopy(l2)
        nb["Children"] = allowed_l3
        pruned_l2.append(nb)

    out["Children"] = pruned_l2
    return out

# ---------------- diff helpers ----------------
def make_aisle_entry(l1, l2, l3):
    """Build the aisle entry with NodeIdLevel1, ParentNode, aisleId, aisle, url."""
    return {
        "NodeIdLevel1": l1_id(l1),
        "ParentNode": l2_name(l2),
        "aisleId": l3_id(l3),
        "aisle": l3_name(l3),
        "url": ww_url(l1_slug(l1), l2_slug(l2), l3_slug(l3)),
    }

def compare(old_l1, new_l1, lvl2_block, lvl3_block):
    """
    Compare two Level-1 payloads and return:
      {
        "new_level_2": [ { "name": <L2 name>, "aisles": [<entry> ...] }, ... ],
        "new_level_3": { <L2 name>: [<entry> ...], ... }
      }
    Blocklists and *_SPECIALS* are respected.
    """
    diff = {"new_level_2": [], "new_level_3": {}}

    # If new L1 is specials, nothing to compare
    if is_specials(new_l1):
        return diff

    # Map old L2 name -> set of old L3 names (excluding specials)
    old_l2_map = {}
    for b in iter_l2_blocks(old_l1 or {"Children": []}):
        if is_specials(b):
            continue
        old_l2_map[l2_name(b)] = {l3_name(x) for x in iter_l3_nodes(b) if not is_specials(x)}

    l1_key = norm(l1_name(new_l1))
    for l2 in iter_l2_blocks(new_l1):
        l2n = l2_name(l2)
        if is_specials(l2) or norm(l2n) in lvl2_block.get(l1_key, set()):
            continue

        blocked_l3 = lvl3_block.get(norm(l2n), set())
        old_l3_names = old_l2_map.get(l2n)

        if old_l3_names is None:
            # brand-new L2 -> list all allowed L3 (excluding specials)
            aisles = []
            for l3 in iter_l3_nodes(l2):
                if is_specials(l3) or norm(l3_name(l3)) in blocked_l3:
                    continue
                aisles.append(make_aisle_entry(new_l1, l2, l3))
            if aisles:
                diff["new_level_2"].append({"name": l2n, "aisles": aisles})
            continue

        # existing L2 -> only list new L3 (excluding specials)
        for l3 in iter_l3_nodes(l2):
            nm = l3_name(l3)
            if is_specials(l3) or norm(nm) in blocked_l3:
                continue
            if nm not in old_l3_names:
                diff["new_level_3"].setdefault(l2n, []).append(
                    make_aisle_entry(new_l1, l2, l3)
                )

    return diff

# ---------------- main ----------------
def main(old_dir, new_dir, cfg_dir, out_path, sync):
    # Load blocklists (robust to format differences)
    lvl1_block = load_level1_block(os.path.join(cfg_dir, "level_1.json"))
    lvl2_block = load_levelN_block(os.path.join(cfg_dir, "level_2.json"))
    lvl3_block = load_levelN_block(os.path.join(cfg_dir, "level_3.json"))

    new_level_1, new_level_2, new_level_3 = [], {}, {}

    for fn in os.listdir(new_dir):
        if not fn.endswith(".json"):
            continue

        slug = fn[:-5]
        new_path = os.path.join(new_dir, fn)
        old_path = os.path.join(old_dir, f"{slug}.json")

        new_data = normalize_l1(load(new_path))
        if new_data is None:
            # empty or invalid file; skip gracefully
            continue

        # Skip entire L1 if specials
        if is_specials(new_data):
            if sync and os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except OSError:
                    pass
            continue

        l1_title = l1_name(new_data)
        l1_key = norm(l1_title)

        # If Level-1 is blocklisted by name -> ensure old is removed, skip
        if l1_key in lvl1_block:
            if sync and os.path.exists(old_path):
                try:
                    os.remove(old_path)
                except OSError:
                    pass
            continue

        # No old file -> report all allowed (filtered) L2/L3 as "new_level_1"
        if not os.path.exists(old_path):
            l1_full = {}
            for l2 in iter_l2_blocks(new_data):
                if is_specials(l2) or norm(l2_name(l2)) in lvl2_block.get(l1_key, set()):
                    continue
                lst = []
                blocked_l3 = lvl3_block.get(norm(l2_name(l2)), set())
                for l3 in iter_l3_nodes(l2):
                    if is_specials(l3) or norm(l3_name(l3)) in blocked_l3:
                        continue
                    lst.append(make_aisle_entry(new_data, l2, l3))
                if lst:
                    l1_full[l2_name(l2)] = lst
            if l1_full:
                new_level_1.append({l1_title: l1_full})

            if sync:
                pruned = prune_snapshot(new_data, lvl1_block, lvl2_block, lvl3_block)
                if pruned is not None:
                    save(old_path, pruned)
            continue

        # Compare with existing old (normalize & allow empty)
        old_loaded = normalize_l1(load(old_path))
        if old_loaded is None or is_specials(old_loaded):
            old_loaded = {"Children": []}  # defensive default (ignore specials root)

        diff = compare(old_loaded, new_data, lvl2_block, lvl3_block)
        if diff["new_level_2"]:
            new_level_2.setdefault(l1_title, []).extend(diff["new_level_2"])
        if diff["new_level_3"]:
            # merge per-L2 lists (avoid overwriting)
            bucket = new_level_3.setdefault(l1_title, {})
            for k, v in diff["new_level_3"].items():
                bucket.setdefault(k, []).extend(v)

        # Sync pruned snapshot (removes any specials + blocks)
        if sync:
            pruned = prune_snapshot(new_data, lvl1_block, lvl2_block, lvl3_block)
            if pruned is not None:
                save(old_path, pruned)
            else:
                try:
                    if os.path.exists(old_path):
                        os.remove(old_path)
                except OSError:
                    pass

    # Write diff report
    report = {
        "new_level_1": new_level_1,
        "new_level_2": new_level_2,
        "new_level_3": new_level_3,
    }
    save(out_path, report)

    # ------- Console summary -------
    print(f"✅ Report written to {out_path}")
    if sync:
        print("✅ old/ folder synced (filters + *_SPECIALS removed)")

    # Section summaries (only print if there are findings)
    n1 = len(new_level_1)
    n2 = sum(len(v) for v in new_level_2.values())
    n3 = sum(len(v) for l1 in new_level_3.values() for v in l1.values())

    if n1 or n2 or n3:
        print("📊 Summary of new categories found:")
        if n1:
            l1_names = [list(item.keys())[0] for item in new_level_1]
            print(f"  • new_level_1: {n1} L1 file(s) → {', '.join(l1_names[:10])}" + (" ..." if len(l1_names) > 10 else ""))
        if n2:
            per_l1 = [f"{l1}({len(entries)})" for l1, entries in new_level_2.items()]
            print(f"  • new_level_2: {n2} L2 group(s) across {len(new_level_2)} L1 → {', '.join(per_l1[:10])}" + (" ..." if len(per_l1) > 10 else ""))
        if n3:
            per_l1l2 = []
            for l1, by_l2 in new_level_3.items():
                for l2, arr in by_l2.items():
                    per_l1l2.append(f"{l1}/{l2}({len(arr)})")
            print(f"  • new_level_3: {n3} L3 aisle(s) across {len(new_level_3)} L1 → {', '.join(per_l1l2[:10])}" + (" ..." if len(per_l1l2) > 10 else ""))
    else:
        print("ℹ️ No new Level-1, Level-2, or Level-3 items found.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--old", default="03_staging/wools/categories")
    parser.add_argument("--new", default="02_raw/wools/categories")
    parser.add_argument("--cfg", default="07_configs/wools/blocks")
    parser.add_argument("--out", default="03_staging/wools/checks/new_categories.json")
    parser.add_argument(
        "--sync", action="store_true",
        help="after compare, write pruned new→old so blocklists & *_SPECIALS are enforced",
    )
    args = parser.parse_args()
    main(args.old, args.new, args.cfg, args.out, args.sync)



# 1) To compare the old vs new files
# py -3 11_tools/wools/compare_and_sync_categories.py --sync