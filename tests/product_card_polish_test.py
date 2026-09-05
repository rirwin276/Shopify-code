# -*- coding: utf-8 -*-
"""The storefront product card: its size range, its price, its badge.

Three things were wrong on a live store and each fails differently.

The size range is LOGIC, so it is executed rather than read: the real Liquid is
pulled out of the snippet and run. The trap in it is ordering — size names do
not sort alphabetically, so the range has to come from the option's own order
or a card reads "3XL–XS".

The price and the badge are STYLING, so they are asserted as values. The price
was 14px mid-grey, which a shopper on a phone reported as almost not being
there. The badge was a near-black pill sitting on the product photo, invisible
on exactly the dark garments a team orders.

    python3 tests/product_card_polish_test.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from liquid import Environment

ROOT = Path(__file__).resolve().parents[1]
CARD = (ROOT / "snippets" / "product-card.liquid").read_text(encoding="utf-8")

FAILURES = []


def check(name, ok, detail=""):
    if ok:
        print("PASS - " + name)
    else:
        print("FAIL - " + name + (": " + detail if detail else ""), file=sys.stderr)
        FAILURES.append(name)


# --- the size range, executed ------------------------------------------------
start = CARD.index("{%- assign ss_size_range = '' -%}")
end = CARD.index("<div class=\"ss-meta-row\">", start)
SIZE_SRC = CARD[start:end]

env = Environment()
tpl = env.from_string(SIZE_SRC + "[{{ ss_size_range }}]")


def size_range(options):
    out = tpl.render(p={"options_with_values": options})
    return re.search(r"\[(.*?)\]", out, re.S).group(1)


def opt(name, values):
    return {"name": name, "values": values}


check("an adult run reads smallest to largest",
      size_range([opt("Size", ["XS", "S", "M", "L", "XL", "2XL", "3XL"])]) == "XS–3XL")

check("a youth run reads as youth",
      size_range([opt("Size", ["S", "M", "L"])]) == "S–L")

check("the range follows the option's order, not the alphabet",
      size_range([opt("Size", ["XS", "S", "M", "L", "XL"])]) == "XS–XL",
      "sorting size names gives 'XL–XS', which is how this goes wrong quietly")

check("a colour option is not mistaken for sizes",
      size_range([opt("Color", ["Black", "White"])]) == "",
      "the card would print 'Black–White' where the sizes go")

check("Size is found whatever position it is in",
      size_range([opt("Color", ["Black"]), opt("Size", ["S", "M", "L"])]) == "S–L")

check("the option name is matched case-insensitively",
      size_range([opt("SIZE", ["S", "M", "L"])]) == "S–L")

check("a one-size product says nothing",
      size_range([opt("Size", ["One Size"])]) == "",
      "'One Size–One Size' is worse than no line at all")

check("a product with no size option says nothing",
      size_range([opt("Color", ["Black", "Grey"])]) == "")

check("a product with no options at all says nothing",
      size_range([]) == "")

# Newer Shopify hands option values as objects rather than strings.
check("option values given as objects still work",
      size_range([opt("Size", [{"name": "XS"}, {"name": "M"}, {"name": "3XL"}])]) == "XS–3XL",
      "the card would print the object instead of the size")


# --- the price, asserted -----------------------------------------------------
price_rule = re.search(r"\.ss-price \{(.*?)\}", CARD, re.S)
check("the price rule exists", bool(price_rule))
if price_rule:
    body = price_rule.group(1)
    check("the price is no longer mid-grey",
          "#555555" not in body,
          "that is the colour reported as almost invisible on a phone")
    check("the price is dark", "#111111" in body)
    check("the price is bold", "font-weight: 700" in body)
    check("the price is at least 16px",
          bool(re.search(r"font-size:\s*1[6-9]px", body)),
          "14px on a phone is what started this")

mobile = CARD[CARD.index("@media screen and (max-width: 767px)"):]
check("the phone breakpoint states the price for itself",
      ".ss-price" in mobile and "#111111" in mobile,
      "whatever washed it out on mobile could wash it out again")


# --- the badge, asserted -----------------------------------------------------
badge = re.search(r"\.ss-includes-badge \{(.*?)\}", CARD, re.S)
check("the badge rule exists", bool(badge))
if badge:
    body = badge.group(1)
    check("the badge is no longer a near-black pill",
          "rgba(17, 16, 14, 0.82)" not in body,
          "invisible on the dark garments that most need the label")
    check("the badge is light",
          "rgba(255, 255, 255" in body,
          "it sits on the photo and has to read on a black hoodie")
    check("the badge has dark ink", "#16150f" in body)
    check("the badge separates itself from a pale stage",
          "border" in body and "box-shadow" in body,
          "a white pill on a white stage needs an edge")

if FAILURES:
    print("\nFAILED: " + ", ".join(FAILURES), file=sys.stderr)
    raise SystemExit(1)
print("\nALL OK")
