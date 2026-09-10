#!/usr/bin/env python3
"""Show which telemetry bytes moved between captures from `cli.py log`.

    python3 tools/blobdiff.py blobs.tsv           # only bytes nothing decodes
    python3 tools/blobdiff.py blobs.tsv --all     # every byte that changed
    python3 tools/blobdiff.py --selftest

A byte that moves while you drive, charge or run the A/C is a byte worth
decoding; one that never moves across a varied capture is not telemetry.
"""

from __future__ import annotations

import argparse
import sys
from collections import defaultdict

# Byte -> field, mirroring parse_blob() in custom_components/carlinko/api.py.
DECODED: dict[int, str] = {
    2: "doors", 3: "unlocked", 4: "trunk", 5: "hv_state", 8: "windows", 9: "sunroof",
    12: "volt12", 13: "volt12", 14: "speed", 15: "speed",
    18: "odometer", 19: "odometer", 20: "odometer",
    23: "ac_on", 24: "ac_temp", 28: "battery_pct", 29: "range_km", 30: "range_km",
    55: "consumption", 56: "charge_mode", 57: "charge_state",
    58: "charge_remain_min", 59: "charge_remain_min",
    62: "charge_power_kw", 63: "charge_power_kw", 68: "wltc_range", 69: "wltc_range",
}
DECODED.update({44 + i: f"tyre_{p}_pressure" for i, p in enumerate(("fl", "fr", "rl", "rr"))})
DECODED.update({48 + i: f"tyre_{p}_temp" for i, p in enumerate(("fl", "fr", "rl", "rr"))})


def movements(blobs: list[str]) -> dict[int, set[int]]:
    """byte index -> the distinct values it took across the capture."""
    seen: dict[int, set[int]] = defaultdict(set)
    for hex_str in blobs:
        for i, v in enumerate(bytes.fromhex(hex_str)):
            seen[i].add(v)
    return {i: vals for i, vals in seen.items() if len(vals) > 1}


def report(blobs: list[str], show_all: bool) -> list[str]:
    moved = movements(blobs)
    out = []
    for i in sorted(moved):
        name = DECODED.get(i)
        if name and not show_all:
            continue
        vals = sorted(moved[i])
        shown = ", ".join(str(v) for v in vals[:8]) + ("…" if len(vals) > 8 else "")
        out.append(f"b{i:<3} {name or '— UNDECODED —':<20} {len(vals):>3} values: {shown}")
    return out


def selftest() -> None:
    a = "00" * 10
    b = "00" * 9 + "05"          # only b9 differs
    assert set(movements([a, b])) == {9}
    assert movements([a, a]) == {}
    assert report([a, b], show_all=False) == []          # b9 is decoded (sunroof)
    assert report([a, b], show_all=True)[0].startswith("b9  ")
    c = "00" * 40 + "07" + "00" * 32                     # b40 is undecoded
    assert report([a.ljust(146, "0"), c], show_all=False)[0].startswith("b40")
    print("selftest ok")


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("file", nargs="?", help="TSV written by `cli.py log`")
    ap.add_argument("--all", action="store_true", help="include bytes the integration already decodes")
    ap.add_argument("--selftest", action="store_true")
    args = ap.parse_args()
    if args.selftest:
        selftest()
        return 0
    if not args.file:
        ap.error("give a capture file, or --selftest")

    blobs = [ln.split("\t")[-1].strip() for ln in open(args.file) if ln.strip()]
    if len(blobs) < 2:
        print("need at least 2 captures to diff", file=sys.stderr)
        return 1
    lines = report(blobs, args.all)
    print(f"{len(blobs)} captures\n")
    print("\n".join(lines) if lines else "nothing moved that isn't already decoded")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
