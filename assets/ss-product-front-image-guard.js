/*
  Stella & Sage — Product Front Image Guard
  Keeps product pages from initially landing on a back/rear mockup while preserving
  Shopify's normal selected-color variant image behavior.
*/
(function () {
  'use strict';

  var path = window.location.pathname || '';
  var template = document.querySelector('main[data-template]');
  var templateName = template ? String(template.getAttribute('data-template') || '') : '';
  var isProductPage = path.indexOf('/products/') !== -1 || templateName.indexOf('product') !== -1;
  if (!isProductPage) return;

  var BACK_WORDS = ['back', 'rear'];
  var FRONT_WORDS = ['front', 'primary', 'main'];
  var runCount = 0;

  function textOf(el) {
    if (!el) return '';
    var bits = [];
    if (el.getAttribute) {
      bits.push(el.getAttribute('alt') || '');
      bits.push(el.getAttribute('aria-label') || '');
      bits.push(el.getAttribute('data-media-id') || '');
      bits.push(el.getAttribute('data-alt') || '');
      bits.push(el.getAttribute('title') || '');
    }
    if (el.dataset) {
      try { bits.push(JSON.stringify(el.dataset)); } catch (e) {}
    }
    if (el.textContent) bits.push(el.textContent);
    var img = el.querySelector && el.querySelector('img');
    if (img) {
      bits.push(img.getAttribute('alt') || '');
      bits.push(img.getAttribute('src') || '');
      bits.push(img.getAttribute('srcset') || '');
    }
    return bits.filter(Boolean).join(' ').toLowerCase();
  }

  function isBackMedia(el) {
    var t = textOf(el);
    return BACK_WORDS.some(function (word) { return t.indexOf(word) !== -1; });
  }

  function isFrontMedia(el) {
    var t = textOf(el);
    return FRONT_WORDS.some(function (word) { return t.indexOf(word) !== -1; });
  }

  function getGalleryRoot() {
    return document.querySelector('media-gallery') ||
      document.querySelector('[data-product-media-gallery]') ||
      document.querySelector('.product-media-gallery') ||
      document.querySelector('.product__media-gallery') ||
      document.querySelector('.product__media-wrapper') ||
      document.querySelector('.product-media-container') ||
      document;
  }

  function getSelectedColor() {
    var checked = document.querySelector(
      'input[type="radio"][name*="Color"]:checked, input[type="radio"][name*="color"]:checked, input[type="radio"][id*="Color"]:checked, input[type="radio"][id*="color"]:checked'
    );
    if (checked) return checked.value || checked.getAttribute('data-option-value') || '';

    var selects = Array.prototype.slice.call(document.querySelectorAll('select'));
    var colorSelect = selects.find(function (s) {
      var name = String((s.name || '') + ' ' + (s.id || '')).toLowerCase();
      return name.indexOf('color') !== -1;
    });
    return colorSelect ? colorSelect.value : '';
  }

  function getCurrentVisibleImage(root) {
    var images = Array.prototype.slice.call(root.querySelectorAll('img')).filter(function (img) {
      var rect = img.getBoundingClientRect();
      return rect.width > 90 && rect.height > 90 && rect.bottom > 0 && rect.right > 0;
    });

    images.sort(function (a, b) {
      var ar = a.getBoundingClientRect();
      var br = b.getBoundingClientRect();
      return (ar.top - br.top) || (ar.left - br.left);
    });

    return images[0] || null;
  }

  function getClickableMediaControls(root) {
    return Array.prototype.slice.call(root.querySelectorAll(
      'button, a, [role="button"], .thumbnail, .slider-counter__link, [aria-controls], [data-media-id]'
    )).filter(function (el) {
      if (el.closest && el.closest('form')) return false;
      var rect = el.getBoundingClientRect();
      return rect.width >= 0 && rect.height >= 0;
    });
  }

  function getSlides(root) {
    return Array.prototype.slice.call(root.querySelectorAll(
      '[data-media-id], .product__media-item, .product-media, li, slide-show-slide, slideshow-slide, .slider__slide'
    )).filter(function (el) {
      var img = el.querySelector && el.querySelector('img');
      if (!img) return false;
      var rect = img.getBoundingClientRect();
      return rect.width > 80 && rect.height > 80;
    });
  }

  function scoreCandidate(el, color) {
    var t = textOf(el);
    var score = 0;
    if (isBackMedia(el)) score -= 100;
    if (isFrontMedia(el)) score += 80;
    if (color && t.indexOf(String(color).toLowerCase()) !== -1) score += 45;
    if (!isBackMedia(el)) score += 10;
    return score;
  }

  function chooseBest(list, color) {
    if (!list.length) return null;
    return list.slice().sort(function (a, b) {
      return scoreCandidate(b, color) - scoreCandidate(a, color);
    })[0];
  }

  function activateBestFront(reason) {
    var root = getGalleryRoot();
    var color = getSelectedColor();
    var controls = getClickableMediaControls(root);
    var bestControl = chooseBest(controls, color);

    if (bestControl && scoreCandidate(bestControl, color) > -20 && typeof bestControl.click === 'function') {
      bestControl.click();
      return true;
    }

    var slides = getSlides(root);
    var bestSlide = chooseBest(slides, color);
    if (bestSlide && bestSlide.scrollIntoView) {
      try {
        bestSlide.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'start' });
      } catch (e) {
        bestSlide.scrollIntoView(false);
      }
      return true;
    }

    return false;
  }

  function guardLandingImage(reason) {
    var root = getGalleryRoot();
    var current = getCurrentVisibleImage(root);
    if (!current) return;

    /*
      Only intervene when the visible/landing image looks like a back image,
      or during the first couple of startup passes. After color selection,
      Shopify gets to do its normal variant sync unless it lands on a back image.
    */
    if (isBackMedia(current) || runCount < 2) {
      activateBestFront(reason);
    }
    runCount += 1;
  }

  function scheduleGuard(reason, delays) {
    delays.forEach(function (delay) {
      window.setTimeout(function () { guardLandingImage(reason); }, delay);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    scheduleGuard('initial-load', [60, 260, 700, 1300]);
  });

  window.addEventListener('load', function () {
    scheduleGuard('window-load', [60, 400]);
  });

  document.addEventListener('change', function (event) {
    var target = event.target;
    if (!target) return;

    var label = String((target.name || '') + ' ' + (target.id || '') + ' ' + (target.value || '')).toLowerCase();
    if (label.indexOf('color') !== -1 || target.matches('input[type="radio"], select')) {
      scheduleGuard('variant-change', [180, 420]);
    }
  });

  ['variant:change', 'product:variant-change', 'shopify:section:load'].forEach(function (eventName) {
    document.addEventListener(eventName, function () {
      scheduleGuard(eventName, [160, 420]);
    });
  });
})();
