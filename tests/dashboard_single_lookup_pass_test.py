# -*- coding: utf-8 -*-
"""Runs the dashboard's single metaobject pass and checks what it produces.

The section used to read each store's metaobject four separate times — to sort
it, to total product counts, to gather logo URLs for the duplicate check, and
to draw its card. Shopify caps how many metaobjects one request may read, so a
dashboard with enough stores spent that budget partway down its own list and
every lookup after it came back empty. A card with no metaobject renders as
"building", which is why stores past the tenth showed as building, showed a
neighbour's name, and set the ready-poll reloading the page forever.

Everything is now read once into a delimited record. That moves the risk from
"too many lookups" to "the record is assembled or parsed wrong", which is a
silent, off-by-one kind of wrong — a store quietly wearing the field next door.
So the real Liquid is extracted from the section and executed here against
stubbed metaobjects, rather than read.

WHAT THIS DOES NOT PROVE: python-liquid is not Shopify's Liquid. It agrees on
the things this record format depends on (interior empty fields survive a
split, which is asserted below), but a Shopify-only drop or filter behaviour
could still differ. This catches assembly and parsing mistakes, not a Shopify
dialect surprise — the dashboard still wants looking at on a preview theme.

    python3 tests/dashboard_single_lookup_pass_test.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from liquid import Environment

ROOT = Path(__file__).resolve().parents[1]
SECTION = (ROOT / "sections" / "seller-dashboard.liquid").read_text(encoding="utf-8")

FAILURES = []


def check(name, ok, detail=""):
    if ok:
        print("PASS - " + name)
    else:
        print("FAIL - " + name + (": " + detail if detail else ""), file=sys.stderr)
        FAILURES.append(name)


def extract(start_marker, end_marker):
    a = SECTION.index(start_marker)
    b = SECTION.index(end_marker, a) + len(end_marker)
    return SECTION[a:b]


# The pass itself, verbatim from the section.
PASS_SRC = extract("{%- comment -%}\n  ss-one-lookup",
                   "{% assign all_clean_urls = all_clean_urls | append: '|' %}")

# How the card loop takes a record apart, verbatim from the section.
READ_SRC = extract("{%- comment -%}\n                      Everything this card needs was read once",
                   "{% if tile_name == blank %}{% assign tile_name = handle | replace: '-', ' ' | capitalize %}{% endif %}")

env = Environment()


def image_url(media, width=None):
    """Stands in for Shopify's image_url: enough to tell the sizes apart."""
    if not isinstance(media, dict):
        return ""
    return "{}?width={}".format(media.get("src", ""), width)


env.add_filter("image_url", image_url)


def metaobject(handle, *, name=None, ready=False, collection=None, status="",
               clean_url=None, logo_src=None, system_handle="__same__"):
    """A stubbed custom_shop entry.

    Fields are modelled as plain values rather than objects with a .value,
    because that is what the section's `entry.field.value | default: entry.field`
    idiom resolves to on a real store: asking a string for .value misses, and
    the default hands back the string. Modelling a field as {"value": ...}
    instead makes the default return the WRAPPER — which then passes a
    `!= blank` test and gets used as a collection handle. That is a stub
    artifact, not a section bug, and it is worth stating because it looked
    exactly like one.
    """
    entry = {
        "system": {"handle": handle if system_handle == "__same__" else system_handle},
        "is_fully_ready": ready,
        "status": status,
        "name": name or "",
        "collection_handle": collection or "",
        "logo_clean_url": clean_url or "",
        "logo_clean": "",
        "logo_clean_url_": "",
        # A file reference resolves to a MediaImage, whose dimensions live on
        # preview_image — a plain .width belongs to an image object, not a
        # media one. Both shapes are exercised: see media_logo below.
        "logo": {"width": 900, "src": logo_src} if logo_src else "",
    }
    return entry


def run_pass(handles, entries, collections, admin=()):
    """Render the real pass and return its records, parsed."""
    member_blob = "".join("||{}||".format(h) for h in handles)
    admin_blob = "".join("||{}||".format(h) for h in admin)

    probe = (
        PASS_SRC
        + "\n<<<TOTAL:{{ total_products_all }}>>>"
        + "<<<CLEAN:{{ all_clean_urls }}>>>"
        + "<<<COUNT:{{ store_records | size }}>>>"
        + "{% for rec in store_records %}<<<REC:{{ rec }}>>>{% endfor %}"
    )
    out = env.from_string(probe).render(
        member_handles_blob=member_blob,
        admin_handles_blob=admin_blob,
        shop={"metaobjects": {"custom_shop": entries}},
        collections=collections,
    )

    records = []
    for raw in re.findall(r"<<<REC:(.*?)>>>", out, re.S):
        if not raw.strip():
            continue
        records.append(raw.split("~;~"))
    total = int(re.search(r"<<<TOTAL:(-?\d+)>>>", out).group(1))
    clean = re.search(r"<<<CLEAN:(.*?)>>>", out, re.S).group(1)
    return records, total, clean


FIELDS = ["handle", "ready", "collection", "products", "status",
          "clean", "logo", "logo_big", "name", "terminator"]


def as_dict(rec):
    return dict(zip(FIELDS, rec))


# ---------------------------------------------------------------------------
# A dashboard with every shape of store on it.
# ---------------------------------------------------------------------------
# Order matters. A field that is not reset each iteration keeps the previous
# store's value, so the stores that carry nothing are placed directly after the
# ones that carry everything: "sleeper" follows two stores with clean logo URLs
# and its own logo, and "no-meta" — which resolves to no metaobject at all —
# follows the one store that is asleep.
HANDLES = ["raptors-3978", "twinned-a-3978", "twinned-b-3978",
           "sleeper-3978", "no-meta-3978", "media-logo-3978",
           "admin-store-3978", "impostor-3978"]

ENTRIES = {
    "raptors-3978": metaobject("raptors-3978", name="Raptors Football", ready=True,
                               collection="raptors-collection", logo_src="cdn/raptors.png"),
    # No metaobject at all — the case the lookup budget produces.
    "twinned-a-3978": metaobject("twinned-a-3978", name="Twin A", ready=True,
                                 clean_url="cdn/shared-clean.png"),
    "twinned-b-3978": metaobject("twinned-b-3978", name="Twin B", ready=True,
                                 clean_url="cdn/shared-clean.png"),
    "sleeper-3978": metaobject("sleeper-3978", name="Sleeper", ready=True, status="Sleeping"),
    # Logo as a MediaImage: no top-level width, dimensions on preview_image.
    # Testing only `.width` says "no picture here" for every store shaped this
    # way, which is how a store with a perfectly good logo ended up showing its
    # initials.
    "media-logo-3978": {
        "system": {"handle": "media-logo-3978"},
        "is_fully_ready": True,
        "status": "",
        "name": "Media Logo Club",
        "collection_handle": "",
        "logo_clean_url": "",
        "logo_clean": "",
        "logo_clean_url_": "",
        "logo": {"preview_image": {"width": 900}, "src": "cdn/media-logo.png"},
    },
    "admin-store-3978": metaobject("admin-store-3978", name="Admin Store", ready=False),
    # Returns a DIFFERENT store's metaobject: must be discarded.
    "impostor-3978": metaobject("impostor-3978", name="Somebody Else", ready=True,
                                system_handle="totally-other-3978"),
}

COLLECTIONS = {
    "raptors-collection": {"products_count": 11, "title": "Raptors Football"},
    "no-meta-3978": {"products_count": 7, "title": "North Coast Paddling Club"},
    "twinned-a-3978": {"products_count": 3, "title": "Twin A"},
    "twinned-b-3978": {"products_count": 4, "title": "Twin B"},
    "sleeper-3978": {"products_count": 5, "title": "Sleeper"},
    "admin-store-3978": {"products_count": 2, "title": "Admin Store"},
    "impostor-3978": {"products_count": 6, "title": "Real Impostor Store"},
    "media-logo-3978": {"products_count": 9, "title": "Media Logo Club"},
}

records, total, clean_blob = run_pass(HANDLES, ENTRIES, COLLECTIONS, admin=["admin-store-3978"])
by_handle = {r[0]: as_dict(r) for r in records}

check("every store produces exactly one record", len(records) == len(HANDLES),
      "got %d for %d stores" % (len(records), len(HANDLES)))

check("every record has all ten fields", all(len(r) == 10 for r in records),
      "widths " + str(sorted({len(r) for r in records})))

check("the terminator is intact on every record",
      all(r[-1] == "end" for r in records),
      "a short record slides every later field by one")

# Ordering: admin first, then live, then building.
check("admin stores sort first", records[0][0] == "admin-store-3978")
check("the unresolvable store sorts with the building ones",
      records[-1][0] in ("no-meta-3978", "impostor-3978"))

# The store with no metaobject at all.
missing = by_handle["no-meta-3978"]
check("a store with no metaobject still gets a record", missing["handle"] == "no-meta-3978")
check("and is not claimed to be ready", missing["ready"] == "0")
check("and takes its name from its own collection",
      missing["name"] == "North Coast Paddling Club",
      "got %r — a prettified handle is what sellers were seeing" % missing["name"])
check("and still counts its products", missing["products"] == "7")

# The lookup that returns somebody else.
impostor = by_handle["impostor-3978"]
check("a metaobject for another store is discarded",
      impostor["name"] != "Somebody Else",
      "got %r — the card is wearing a neighbour's identity" % impostor["name"])
check("and the card falls back to its own collection title",
      impostor["name"] == "Real Impostor Store")
check("and is not promoted to ready on that store's say-so", impostor["ready"] == "0")

# Ordinary resolved store.
raptors = by_handle["raptors-3978"]
check("a resolved store keeps its metaobject name", raptors["name"] == "Raptors Football")
check("and its own collection handle", raptors["collection"] == "raptors-collection")
check("and that collection's product count", raptors["products"] == "11")
check("and is marked ready", raptors["ready"] == "1")
check("and carries both logo sizes",
      raptors["logo"] == "cdn/raptors.png?width=512" and raptors["logo_big"] == "cdn/raptors.png?width=1200",
      "got %r / %r" % (raptors["logo"], raptors["logo_big"]))

# The leak this section has been patched for twice. Liquid has no block scope,
# so a `for` body shares one variable space across iterations: any field not
# written this time round still holds the PREVIOUS store's value. "sleeper" is
# positioned right after two stores that DO carry a clean logo URL and a
# collection handle, and carries neither itself.
sleeper = by_handle["sleeper-3978"]
check("a store with no clean logo url does not inherit the previous store's",
      sleeper["clean"] == "",
      "got %r — a run of cards would wear one store's picture" % sleeper["clean"])
check("nor its logo",
      sleeper["logo"] == "" and sleeper["logo_big"] == "",
      "got %r / %r" % (sleeper["logo"], sleeper["logo_big"]))
check("and falls back to its own collection handle",
      sleeper["collection"] == "sleeper-3978",
      "got %r — that is the store above's collection" % sleeper["collection"])

check("a store with no metaobject does not inherit the previous store's status",
      missing["status"] == "",
      "got %r — an unresolvable card would render as asleep" % missing["status"])

check("status is normalised for the sleep check",
      by_handle["sleeper-3978"]["status"] == "sleeping",
      "got %r — 'Sleeping' would never match" % by_handle["sleeper-3978"]["status"])

check("a logo held as a MediaImage is found, not skipped",
      by_handle["media-logo-3978"]["logo"] == "cdn/media-logo.png?width=512",
      "got %r — a store with a real logo would show its initials"
      % by_handle["media-logo-3978"]["logo"])

check("product counts total across every store",
      total == 11 + 7 + 3 + 4 + 5 + 2 + 6 + 9,
      "got %d" % total)

# The shared-clean-URL check the card loop runs against this blob.
shared = "cdn/shared-clean.png"
check("a clean logo URL used by two stores is seen twice in the blob",
      clean_blob.count(shared) == 2,
      "the duplicate check cannot fire, and both cards keep the shared picture")
check("the blob ends with its separator",
      clean_blob.endswith("|"),
      "a duplicate whose second use is last would count as unique")

# ---------------------------------------------------------------------------
# Round trip: the card loop's own field reads, run against a real record.
# ---------------------------------------------------------------------------
read_probe = (
    "{% assign ss_fs = '~;~' %}{% assign all_clean_urls = clean %}"
    "{% assign handle = rec | split: ss_fs | first %}"
    + READ_SRC
    + "|name={{ tile_name }}|ready={{ is_fully_ready }}|coll={{ collection_handle }}"
    + "|products={{ product_count }}|status={{ tile_status }}|logo={{ tile_logo_file }}"
    + "|clean={{ tile_logo_clean }}|onboarding={{ tile_onboarding_image }}"
    # The slice opens the card loop's own `{% if handle != blank %}` and the
    # section closes it further down, past the end marker. Close it here.
    + "{% endif %}"
)
read_tpl = env.from_string(read_probe)


def read_back(handle):
    raw = "~;~".join(by_handle[handle][f] for f in FIELDS)
    out = read_tpl.render(rec=raw, clean=clean_blob)
    return dict(p.split("=", 1) for p in out.strip().split("|") if "=" in p)


r = read_back("raptors-3978")
check("the card reads back the name it was given", r["name"] == "Raptors Football")
check("the card reads back readiness", r["ready"] == "true")
check("the card reads back the collection", r["coll"] == "raptors-collection")
check("the card reads back the product count", r["products"] == "11")
check("the card reads back the logo url", r["logo"] == "cdn/raptors.png?width=512")
check("the onboarding image is the large size, not the card size",
      r["onboarding"] == "cdn/raptors.png?width=1200")

t = read_back("twinned-a-3978")
check("a logo URL two stores share is dropped by the card",
      t["clean"] == "",
      "got %r — both cards would show the same picture" % t["clean"])

s = read_back("sleeper-3978")
check("the card reads back a normalised status", s["status"] == "sleeping")

m = read_back("no-meta-3978")
check("an unresolvable card shows its collection title, not its handle",
      m["name"] == "North Coast Paddling Club")

# ---------------------------------------------------------------------------
# The section must not have grown a second lookup back.
# ---------------------------------------------------------------------------
lookups = re.findall(r"\{%\s*assign \w+ = shop\.metaobjects\.custom_shop\[", SECTION)
check("the section reads a store's metaobject in exactly one place",
      len(lookups) == 1,
      "found %d — the lookup budget is what broke this dashboard" % len(lookups))

if FAILURES:
    print("\nFAILED: " + ", ".join(FAILURES), file=sys.stderr)
    raise SystemExit(1)
print("\nALL OK")
