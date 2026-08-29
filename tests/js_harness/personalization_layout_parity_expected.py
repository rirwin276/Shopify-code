"""Emit the server renderer's layout numbers for the JS parity harness.

The storefront preview and the print file must lay text out identically, or the
shopper approves one thing and receives another. This dumps `nn_layout` from
Printful_Automation so `personalization_layout_parity.js` can diff against it.

Usage:
    python tests/js_harness/personalization_layout_parity_expected.py \
        [--automation /path/to/Printful_Automation] > expected.json
"""
import argparse
import json
import os
import sys

BOXES = [
    (1000, 1000),
    (800, 1600),
    (3000, 500),
    (2000, 300),
    (500, 5000),
    (640, 640),
]
STATES = [(1, True), (2, True), (1, False), (2, False), (0, True), (0, False)]

DEFAULT_AUTOMATION = os.path.join(os.path.dirname(__file__), "..", "..", "..", "Printful_Automation")


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--automation", default=DEFAULT_AUTOMATION,
                    help="path to the Printful_Automation checkout")
    args = ap.parse_args()

    root = os.path.abspath(args.automation)
    if not os.path.isdir(root):
        print(f"Printful_Automation not found at {root}", file=sys.stderr)
        return 2
    sys.path.insert(0, root)

    from pro_builders.common.personalization import nn_layout

    out = {}
    for w, h in BOXES:
        for lines, has_number in STATES:
            lay = nn_layout(float(w), float(h), name_lines=lines, has_number=has_number)
            out[f"{w}x{h}|{lines}|{1 if has_number else 0}"] = {
                "topOffset": round(lay["top_offset"], 6),
                "bands": [round(b, 6) for b in lay["bands"]],
                "lineGap": round(lay["line_gap"], 6),
                "gap": round(lay["gap"], 6),
                "namesH": round(lay["names_h"], 6),
                "numberTop": round(lay["number_top"], 6),
                "numberH": round(lay["number_h"], 6),
            }
    json.dump(out, sys.stdout, indent=2, sort_keys=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
