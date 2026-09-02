"""The pin logic in the private-store catalog, EXECUTED rather than read.

This exists because three separate checks passed while the pin was completely
broken on the storefront. Each of them looked at the section as text — is the
attribute written somewhere, is the rule present in some file — and text was
never the question. The question is whether the Liquid evaluates.

The bug it missed: `{% if ss_tag | downcase | strip == ss_pin_tag %}`. Shopify
Liquid does not permit filters inside an `if` condition; the tag has to be
normalised into its own variable first. Written inline the condition never
became true, so `data-ss-pinned` was never stamped, so nothing sorted — while
the admin list reordered correctly and made the feature look like it worked.

python-liquid rejects filter-in-if the same way Shopify does, so it is used
here as the oracle. The pin block is extracted from the SHIPPED section rather
than restated, which is the whole point: a copy would have kept passing.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest

liquid = pytest.importorskip("liquid", reason="python-liquid provides the Shopify-Liquid oracle")
from liquid import Environment  # noqa: E402

SECTION = Path(__file__).resolve().parent.parent / "sections" / "private-store-collection-catalog.liquid"
SOURCE = SECTION.read_text(encoding="utf-8")


def _pin_block() -> str:
    """The pin-detection Liquid, lifted out of the shipped section."""
    start = SOURCE.index("{% assign ss_pin_tag")
    end = SOURCE.index("{% endfor %}", start) + len("{% endfor %}")
    block = SOURCE[start:end]
    # Drop the explanatory {% comment %}, which carries a {% raw %} example.
    return re.sub(r"\{%-?\s*comment\s*-?%\}[\s\S]*?\{%-?\s*endcomment\s*-?%\}", "", block)


PIN_BLOCK = _pin_block()
PROBE = PIN_BLOCK + "{% if ss_is_pinned %}PINNED{% else %}NOT{% endif %}"


def _render(tags, handle="westview-baseball"):
    return Environment().from_string(PROBE).render(
        product={"tags": tags}, private_handle=handle
    ).strip()


def test_the_pin_block_is_valid_liquid():
    """Filters in an if condition parse locally and fail on Shopify. This is
    the exact defect that shipped, so it gets its own named assertion."""
    Environment().from_string(PIN_BLOCK)


def test_no_filter_is_used_inside_an_if_condition_anywhere_in_the_section():
    offenders = [
        line.strip()
        for line in SOURCE.splitlines()
        if re.search(r"\{%-?\s*(?:if|elsif|unless)\b[^%]*\|", line)
    ]
    assert not offenders, (
        "Shopify Liquid does not allow filters in a condition; assign first.\n"
        + "\n".join(offenders)
    )


@pytest.mark.parametrize("tags", [
    ["westview-baseball", "pinned--westview-baseball"],
    ["pinned--westview-baseball"],
    ["PINNED--WESTVIEW-BASEBALL"],          # Shopify preserves the case an admin sent
    ["  pinned--westview-baseball  "],      # and tags can carry whitespace
    ["custom-build", "pinned--westview-baseball", "pro-shirt-m2580"],
])
def test_a_pinned_product_is_detected(tags):
    assert _render(tags) == "PINNED"


@pytest.mark.parametrize("tags", [
    [],
    ["westview-baseball"],
    ["custom-build", "pro-shirt-m2580", "personalized-back"],
    ["pinned--some-other-store"],           # another store's pin must not leak in
    ["pinned"],
    ["unpinned--westview-baseball"],
])
def test_an_unpinned_product_is_not_detected(tags):
    assert _render(tags) == "NOT"


def test_the_handle_is_what_scopes_the_pin():
    """The same tag must read as pinned for its own store and not another."""
    tags = ["pinned--westview-baseball"]
    assert _render(tags, handle="westview-baseball") == "PINNED"
    assert _render(tags, handle="eastvale-soccer") == "NOT"


def test_the_tag_matches_what_the_backend_writes():
    """studio-uploader builds f"pinned--{handle}". If that convention ever
    changes it has to change in all three layers, so it is pinned down here."""
    assert "'pinned--' | append: private_handle" in SOURCE


def test_the_attribute_is_stamped_from_the_evaluated_flag():
    """Not merely present in the file — actually gated on ss_is_pinned."""
    assert re.search(r"\{%\s*if ss_is_pinned\s*%\}data-ss-pinned=\"true\"", SOURCE), (
        "data-ss-pinned must be emitted from the flag this block computes"
    )
