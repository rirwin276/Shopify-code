/*
  Stella & Sage — Product Front Image Guard
  Purpose:
  - Product pages should open on the front/primary image, not the back print image.
  - Variant/color changes should still follow Shopify's selected variant image.
  - If Shopify lands on a back/rear media item, this gently pushes the gallery to the matching front/primary media.
*/
(function () {
  'use strict';

  var isProductPage = document.body && (
    document.body.className.indexOf('template-product') !== -1 ||
    (document.querySelector('main[data-template]') && String(document.querySelector('main[data-template]').dataset.template || '').indexOf('product') !== -1) ||
    window.location.pathname.indexOf('/products/') !== -1
  );

  if (!isProductPage) return;

  var BACK_WORDS = ['back', 'rear'];
  var FRONT_WORDS = ['front', 'primary', 'main'];
  var lastRun = 0;

  function lower(value) {
    return String(value || '').toLowerCase();
  }

  function textOf(el) {
    if (!el) return '';
    var bits = [];

    if (el.getAttribute) {
      bits.push(el.getAttribute('alt'));
      bits.push(el.getAttribute('aria-label'));
      bits.push(el.getAttribute('title'));
      bits.push(el.getAttribute('href'));
      bits.push(el.getAttribute('src'));
    }

    if (el.dataset) {
      Object.keys(el.dataset).forEach(function (key) {
        bits.push(el.dataset[key]);
      });
    }

    var img = el.querySelector && el.querySelector('img');
    if (img) {
      bits.push(img.getAttribute('alt'));
      bits.push(img.getAttribute('src'));
    }

    bits.push(el.textContent);
    return lower(bits.filter(Boolean).join(' '));
  }

  function hasWord(text, words) {
    return words.some(function (word) { return text.indexOf(word) !== -1; });
  }

  function isBack(el) {
    return hasWord(textOf(el), BACK_WORDS);
  }

  function isFront(el) {
    return hasWord(textOf(el), FRONT_WORDS);
  }

  function getGalleryRoot() {
    return document.querySelector('media-gallery') ||
      document.querySelector('[data-product-media-gallery]') ||
      document.querySelector('.product-media-gallery') ||
      document.querySelector('.product__media-gallery') ||
      document.querySelector('.product__media-wrapper') ||
      document.querySelector('[data-product-information]') ||
      document;
  }

  function isVisibleEnough(el) {
    if (!el || !el.getBoundingClientRect) return false;
    var rect = el.getBoundingClientRect();
    return rect.width > 80 && rect.height > 80;
  }

  function getSelectedColor() {
    var checked = document.querySelector('input[type="radio"][name*="Color"]:checked, input[type="radio"][name*="color"]:checked, input[type="radio"][id*="Color"]:checked, input[type="radio"][id*="color"]:checked');
    if (checked) return checked.value || checked.getAttribute('data-option-value') || '';

    var selects = Array.prototype.slice.call(document.querySelectorAll('select'));
    var colorSelect = selects.find(function (select) {
      return lower((select.name || '') + ' ' + (select.id || '')).indexOf('color') !== -1;
    });

    return colorSelect ? colorSelect.value : '';
  }

  function elementMatchesColor(el, color) {
    if (!color) return false;
    var t = textOf(el);
    var c = lower(color).trim();
    if (!c) return false;
    return t.indexOf(c) !== -1 || t.indexOf(c.replace(/\s+/g, '-')) !== -1 || t.indexOf(c.replace(/\s+/g, '_')) !== -1;
  }

  function visibleMediaElements(root) {
    var selector = '[data-media-id], .product__media-item, .product-media, .product-media-container, slide-show-slide, slideshow-slide, li';
    return Array.prototype.slice.call(root.querySelectorAll(selector)).filter(function (el) {
      var img = el.querySelector && el.querySelector('img');
      return img && isVisibleEnough(img);
    });
  }

  function thumbElements(root) {
    var selector = 'button, a, [role="button"], .thumbnail, .slider-counter__link, [data-media-id]';
    return Array.prototype.slice.call(root.querySelectorAll(selector)).filter(function (el) {
      var t = textOf(el);
      return t || (el.querySelector && el.querySelector('img'));
    });
  }

  function clickThumbFor(best, root) {
    if (!best) return false;

    var mediaId = best.getAttribute && best.getAttribute('data-media-id');
    var productMediaId = best.getAttribute && best.getAttribute('data-product-media-id');
    var id = mediaId || productMediaId || '';

    if (id) {
      var escaped = (window.CSS && CSS.escape) ? CSS.escape(id) : id.replace(/"/g, '\\"');
      var related = root.querySelector('button[data-media-id="' + escaped + '"], a[data-media-id="' + escaped + '"], [aria-controls="' + escaped + '"], [data-target="' + escaped + '"]');
      if (related && related !== best && typeof related.click === 'function') {
        related.click();
        return true;
      }
    }

    if (typeof best.click === 'function') {
      best.click();
      return true;
    }

    return false;
  }

  function scrollToElement(el) {
    if (!el || !el.scrollIntoView) return false;
    el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'start' });
    return true;
  }

  function chooseBest(candidates, color) {
    if (!candidates.length) return null;

    return candidates.find(function (el) { return elementMatchesColor(el, color) && isFront(el); }) ||
      candidates.find(function (el) { return elementMatchesColor(el, color) && !isBack(el); }) ||
      candidates.find(function (el) { return isFront(el); }) ||
      candidates.find(function (el) { return !isBack(el); }) ||
      candidates[0];
  }

  function currentVisibleLooksBack(root) {
    var imgs = Array.prototype.slice.call(root.querySelectorAll('img')).filter(isVisibleEnough);
    if (!imgs.length) return false;

    var first = imgs[0];
    var parent = first.closest('[data-media-id], .product__media-item, .product-media, .product-media-container, li') || first;
    return isBack(first) || isBack(parent);
  }

  function forceFront(options) {
    var now = Date.now();
    if (now - lastRun < 120) return;
    lastRun = now;

    var root = getGalleryRoot();
    var color = options && options.color ? options.color : getSelectedColor();
    var candidates = visibleMediaElements(root);
    var best = chooseBest(candidates, color);

    if (best && clickThumbFor(best, root)) return;
    if (best && scrollToElement(best)) return;

    var thumbs = thumbElements(root);
    var bestThumb = chooseBest(thumbs, color);
    if (bestThumb && clickThumbFor(bestThumb, root)) return;
  }

  function guardOnlyIfBack() {
    var root = getGalleryRoot();
    if (currentVisibleLooksBack(root)) {
      forceFront({});
    }
  }

  function boot() {
    forceFront({});
    window.setTimeout(forceFront, 180);
    window.setTimeout(guardOnlyIfBack, 520);
    window.setTimeout(guardOnlyIfBack, 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener('change', function (event) {
    var target = event.target;
    if (!target) return;

    var nameBlob = lower((target.name || '') + ' ' + (target.id || '') + ' ' + (target.value || ''));
    var looksVariantControl = target.matches('input[type="radio"], select') || nameBlob.indexOf('color') !== -1 || nameBlob.indexOf('option') !== -1;
    if (!looksVariantControl) return;

    /* Let Shopify change the selected variant first, then only correct if it lands on a back image. */
    window.setTimeout(guardOnlyIfBack, 260);
    window.setTimeout(guardOnlyIfBack, 700);
  });

  ['variant:change', 'product:variant-change', 'shopify:section:load'].forEach(function (eventName) {
    document.addEventListener(eventName, function () {
      window.setTimeout(guardOnlyIfBack, 260);
      window.setTimeout(guardOnlyIfBack, 700);
    });
  });
})();
