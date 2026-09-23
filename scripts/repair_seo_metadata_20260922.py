"""Apply the reviewed September 22 SEO repair without touching storefront behavior.

Run from the repository root. Exact-match guards stop on source drift. This does
not call Shopify, change robots.txt, deploy Railway, or modify customer data.
"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
MARKER = 'SS SEO metadata ownership: layout owns primary metadata'


def replace_once(text: str, old: str, new: str) -> str:
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f'Expected exactly one match, found {count}: {old[:100]!r}')
    return text.replace(old, new, 1)


def main() -> None:
    theme_path = ROOT / 'layout/theme.liquid'
    meta_path = ROOT / 'snippets/meta-tags.liquid'
    theme = theme_path.read_text()
    meta = meta_path.read_text()
    if MARKER in theme:
        print('SEO repair already applied; no changes.')
        return

    # Keep existing private-store checks; add only known utility routes.
    theme = replace_once(theme,
        '      assign is_private_store_product = false\n',
        "      assign is_private_store_product = false\n"
        "      assign ss_seo_is_utility = false\n"
        "      assign ss_seo_utility_pages = 'portal,admin-powers,join-store,super-admin' | split: ','\n"
        "      if request.page_type == 'page'\n"
        "        if ss_seo_utility_pages contains page.handle or template.suffix == 'start-team-store'\n"
        "          assign ss_seo_is_utility = true\n"
        "        endif\n"
        "      elsif request.page_type == 'search' or request.page_type == 'cart' or request.page_type == '404'\n"
        "        assign ss_seo_is_utility = true\n"
        "      endif\n")
    theme = replace_once(theme,
        "{%- elsif is_private_store_collection or is_private_store_product or request.page_type == 'list-collections' -%}",
        "{%- elsif is_private_store_collection or is_private_store_product or ss_seo_is_utility or request.page_type == 'list-collections' -%}")

    # Keep the same selected sharing image, but render it once in meta-tags.
    preview_tags = '''        <meta property="og:image" content="{{ ss_preview_img | image_url: width: 1200 }}">
        <meta property="og:image:secure_url" content="{{ ss_preview_img | image_url: width: 1200 }}">
        <meta property="og:image:width" content="1200">
        <meta property="og:image:height" content="630">
        <meta property="og:title" content="{{ ss_store_entry.name }} | Private Studio">
        <meta name="twitter:image" content="{{ ss_preview_img | image_url: width: 1200 }}">
'''
    theme = replace_once(theme, preview_tags, '')

    old_copy = '''      if request.page_type == 'index'
        assign ss_seo_title = 'Custom Team Merch Stores | No Minimums | Stella & Sage'
        assign ss_seo_description = 'Create a private custom team merch store in about 15 minutes. No minimum orders, upfront inventory, size collection, or payment chasing.'
      elsif request.page_type == 'page' and page.handle == 'private-storefronts'
        assign ss_seo_title = 'How Custom Team Merch Stores Work | Stella & Sage'
        assign ss_seo_description = 'See how teams, military units, first responders, fundraisers, and groups can launch a private merch store with no minimum order or inventory.'
      elsif request.page_type == 'page' and page.handle == 'resources'
        assign ss_seo_title = 'Free Team Logo Prompts & Upload Guide | Stella & Sage'
        assign ss_seo_description = 'Create an upload-ready sports or group logo with free prompts, transparent-background guidance, cleanup tools, and a practical print checklist.'
      endif'''
    new_copy = '''      if request.page_type == 'index'
        assign ss_seo_title = 'Free Team Stores & Custom Spirit Wear | Stella & Sage'
        assign ss_seo_description = 'Create a free team store for custom shirts, hoodies, and spirit wear. No minimums or inventory. Parents order online; we ship directly to their homes.'
      elsif request.page_type == 'page' and page.handle == 'private-storefronts'
        assign ss_seo_title = 'How Free Team Stores Work | Stella & Sage'
        assign ss_seo_description = 'See how to start a free private team store, add custom apparel, and let parents order directly. No minimums, inventory, or collecting sizes and payments.'
      elsif request.page_type == 'page' and page.handle == 'request-storefront-form'
        assign ss_seo_title = 'Create a Free Team Store | Stella & Sage'
        assign ss_seo_description = 'Start your free team apparel store with a logo and team name. Create custom spirit wear with no minimum orders, then share your store with your group.'
      elsif request.page_type == 'page' and page.handle == 'resources'
        assign ss_seo_title = 'Free Team Logo Prompts & Upload Guide | Stella & Sage'
        assign ss_seo_description = 'Create an upload-ready sports or group logo with free prompts, transparent-background guidance, cleanup tools, and a practical print checklist.'
      elsif request.page_type == 'page' and page.handle == 'support'
        assign ss_seo_title = 'Team Store, Order & Shipping Support | Stella & Sage'
        assign ss_seo_description = 'Get help with Stella & Sage orders, shipping, personalization, and your team store. Find delivery estimates, made-to-order policies, and contact support.'
      elsif request.page_type == 'blog' and blog.handle == 'news'
        assign ss_seo_title = 'Team Store & Spirit Wear Guides | Stella & Sage'
        assign ss_seo_description = 'Practical guides to free team stores, school spirit wear, custom apparel, and print-ready logos. Help your group order without collecting sizes or payments.'
      endif

      assign ss_seo_title_check = ss_seo_title | strip_html | downcase | replace: '&amp;', '&'
      assign ss_seo_shop_check = shop.name | strip_html | downcase | replace: '&amp;', '&'
      assign ss_seo_has_brand = false
      if ss_seo_title_check contains ss_seo_shop_check or ss_seo_title_check contains 'stella & sage'
        assign ss_seo_has_brand = true
      endif'''
    theme = replace_once(theme, old_copy, new_copy)
    theme = replace_once(theme, '{{ ss_seo_title }}', '{{ ss_seo_title | escape }}')
    theme = replace_once(theme,
        "{%- unless ss_seo_title contains shop.name %} &ndash; {{ shop.name }}{% endunless -%}",
        "{%- unless ss_seo_has_brand %} &ndash; {{ shop.name | escape }}{% endunless -%}")
    theme = replace_once(theme,
        "    {%- render 'meta-tags' -%}",
        "    {%- comment -%} " + MARKER + "; the snippet owns social metadata. {%- endcomment -%}\n"
        "    {%- render 'meta-tags', primary_metadata_in_layout: true, seo_title: ss_seo_title, seo_description: ss_seo_description, store_preview_image: ss_preview_img, store_preview_entry: ss_store_entry -%}")
    theme = replace_once(theme,
        'Custom online merch stores for teams, schools, clubs, and organizations. Print-on-demand apparel with your logo — no inventory, no minimums — with built-in team fundraising. Veteran owned and operated.',
        'Free private team stores for custom spirit wear and apparel. Teams, schools, clubs, and groups order online with no minimums or upfront inventory. Orders ship directly to each buyer. Veteran owned and operated.')

    # render has isolated variable scope: explicitly passed SEO values are needed.
    meta = replace_once(meta, '  assign og_title = page_title | default: shop.name',
                        '  assign og_title = seo_title | default: page_title | default: shop.name')
    meta = replace_once(meta,
        '  assign og_description = page_description | default: shop.description | default: shop.name',
        '  assign og_description = seo_description | default: page_description | default: shop.description | default: shop.name\n'
        "  if store_preview_image != blank and store_preview_entry != blank\n"
        "    assign og_title = store_preview_entry.name | append: ' | Private Studio'\n"
        '  endif')

    # Password layout still relies on the snippet for its complete document head.
    meta = replace_once(meta, '<meta charset="utf-8">',
                        '{%- unless primary_metadata_in_layout -%}\n<meta charset="utf-8">')
    meta = replace_once(meta,
        '<meta\n  name="view-transition"',
        '{%- endunless -%}\n<meta\n  name="view-transition"')
    meta = replace_once(meta, '<meta\n  name="theme-color"\n  content=""\n>',
                        '{%- unless primary_metadata_in_layout -%}\n<meta\n  name="theme-color"\n  content=""\n>\n{%- endunless -%}')
    meta = replace_once(meta, '\n<title>\n', '\n{%- unless primary_metadata_in_layout -%}\n<title>\n')
    meta = meta.rstrip() + '\n{%- endunless -%}\n'

    image_start = meta.index('{%- if page_image -%}')
    image_end = meta.index('{%- endif -%}', image_start) + len('{%- endif -%}')
    meta = meta[:image_start] + '''{%- liquid
  assign ss_social_image = store_preview_image | default: page_image
  if ss_social_image != blank
    assign ss_social_image_url = ss_social_image | image_url: width: 1200
    assign ss_social_image_prefix = ss_social_image_url | slice: 0, 2
    if ss_social_image_prefix == '//'
      assign ss_social_image_url = ss_social_image_url | prepend: 'https:'
    endif
    assign ss_social_image_url = ss_social_image_url | replace: 'http:', 'https:'
  endif
-%}
{%- if ss_social_image != blank -%}
  <meta property="og:image" content="{{ ss_social_image_url | escape }}">
  <meta property="og:image:secure_url" content="{{ ss_social_image_url | escape }}">
  <meta name="twitter:image" content="{{ ss_social_image_url | escape }}">
{%- endif -%}''' + meta[image_end:]

    # Stage all transformations in memory before any write.
    assert theme.count(MARKER) == 1
    assert 'built-in team fundraising' not in theme
    assert 'SS_LEGACY_FORM_ROUTING_DISABLED = true' in meta
    theme_path.write_text(theme)
    meta_path.write_text(meta)

    # Update only these two keys in saved deployment payloads, where present.
    # This is not a deployment and does not modify the older ops branch.
    for manifest in ('main_deploy/assets.json', 'preview_deploy/assets.json'):
        path = ROOT / manifest
        if not path.exists():
            continue
        entries = json.loads(path.read_text())
        changed = False
        for entry in entries:
            if entry.get('key') == 'layout/theme.liquid':
                entry['value'] = theme
                changed = True
            elif entry.get('key') == 'snippets/meta-tags.liquid':
                entry['value'] = meta
                changed = True
        if changed:
            path.write_text(json.dumps(entries, indent=2, ensure_ascii=False) + '\n')
    print('Repaired primary/social metadata, public page copy, utility noindex, and organization description.')


if __name__ == '__main__':
    main()
