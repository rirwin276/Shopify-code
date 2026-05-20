/*
  Stella & Sage — Stable Product Gallery

  Aggressive but safe product-page gallery replacement.
  - Does not touch add-to-cart, variants, checkout, URLs, forms, or endpoints.
  - Does not click product images or open zoom/lightbox.
  - Reads the product media already rendered by Shopify, then renders a clean
    custom hero + thumbnails + arrows inside the media area.
*/
(function () {
  'use strict';

  var path = window.location.pathname || '';
  var template = document.querySelector('main[data-template]');
  var templateName = template ? String(template.getAttribute('data-template') || '') : '';
  var isProductPage = path.indexOf('/products/') !== -1 || templateName.indexOf('product') !== -1;
  if (!isProductPage) return;

  function galleryRoot() {
    return document.querySelector('media-gallery') ||
      document.querySelector('.product-media-gallery') ||
      document.querySelector('.product__media-wrapper');
  }

  function bestSrc(img) {
    var srcset = img.getAttribute('srcset') || '';
    if (srcset) {
      var parts = srcset.split(',').map(function (p) { return p.trim(); }).filter(Boolean);
      if (parts.length) {
        var last = parts[parts.length - 1].split(' ')[0];
        if (last) return last;
      }
    }
    return img.currentSrc || img.getAttribute('src') || '';
  }

  function normalizeUrl(url) {
    return String(url || '')
      .replace(/([?&])width=\d+/g, '$1')
      .replace(/([?&])height=\d+/g, '$1')
      .replace(/[?&]+$/g, '')
      .replace(/&&/g, '&');
  }

  function collectMedia(root) {
    var preferred = Array.prototype.slice.call(root.querySelectorAll(
      '.product__media img, .product-media-container img, .slider__slide img, [data-media-id] img'
    ));
    var fallback = Array.prototype.slice.call(root.querySelectorAll('img'));
    var candidates = preferred.length ? preferred : fallback;
    var seen = {};
    var media = [];

    candidates.forEach(function (img) {
      if (!img) return;
      if (img.closest && img.closest('.ss-pro-gallery')) return;
      if (img.closest && img.closest('.thumbnail-list')) return;

      var src = bestSrc(img);
      if (!src || src.indexOf('data:') === 0) return;

      var key = normalizeUrl(src);
      if (!key || seen[key]) return;
      seen[key] = true;

      var alt = img.getAttribute('alt') || '';
      media.push({ src: src, alt: alt, key: key });
    });

    return media;
  }

  function selectedColor() {
    var checked = document.querySelector(
      'input[type="radio"][name*="Color"]:checked, input[type="radio"][name*="color"]:checked, input[type="radio"][id*="Color"]:checked, input[type="radio"][id*="color"]:checked'
    );
    if (checked) return checked.value || checked.getAttribute('data-option-value') || '';
    return '';
  }

  function findBestIndex(media, color) {
    if (!media.length) return 0;
    var colorText = String(color || '').toLowerCase();
    if (!colorText) return 0;
    for (var i = 0; i < media.length; i += 1) {
      var hay = String((media[i].alt || '') + ' ' + (media[i].src || '')).toLowerCase();
      if (hay.indexOf(colorText) !== -1) return i;
    }
    return 0;
  }

  function render(root, media) {
    if (root.querySelector('.ss-pro-gallery')) return;
    if (!media.length) return;

    root.classList.add('ss-pro-gallery-mounted');

    var gallery = document.createElement('div');
    gallery.className = 'ss-pro-gallery';
    gallery.innerHTML = [
      '<div class="ss-pro-gallery__stage">',
      '  <button type="button" class="ss-pro-gallery__arrow ss-pro-gallery__arrow--prev" aria-label="Previous product image">‹</button>',
      '  <img class="ss-pro-gallery__hero" alt="">',
      '  <button type="button" class="ss-pro-gallery__arrow ss-pro-gallery__arrow--next" aria-label="Next product image">›</button>',
      '</div>',
      '<div class="ss-pro-gallery__thumbs" aria-label="Product images"></div>'
    ].join('');

    root.insertBefore(gallery, root.firstChild);

    var hero = gallery.querySelector('.ss-pro-gallery__hero');
    var thumbs = gallery.querySelector('.ss-pro-gallery__thumbs');
    var index = findBestIndex(media, selectedColor());

    function setIndex(nextIndex) {
      if (!media.length) return;
      index = (nextIndex + media.length) % media.length;
      hero.src = media[index].src;
      hero.alt = media[index].alt || 'Product image';
      Array.prototype.slice.call(thumbs.querySelectorAll('button')).forEach(function (btn, i) {
        btn.classList.toggle('is-active', i === index);
        btn.setAttribute('aria-current', i === index ? 'true' : 'false');
      });
    }

    media.forEach(function (item, i) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ss-pro-gallery__thumb';
      btn.setAttribute('aria-label', 'View product image ' + (i + 1));
      btn.innerHTML = '<img alt="" src="' + item.src.replace(/"/g, '&quot;') + '">';
      btn.addEventListener('click', function () { setIndex(i); });
      thumbs.appendChild(btn);
    });

    gallery.querySelector('.ss-pro-gallery__arrow--prev').addEventListener('click', function () {
      setIndex(index - 1);
    });
    gallery.querySelector('.ss-pro-gallery__arrow--next').addEventListener('click', function () {
      setIndex(index + 1);
    });

    document.addEventListener('change', function (event) {
      var target = event.target;
      if (!target) return;
      var label = String((target.name || '') + ' ' + (target.id || '') + ' ' + (target.value || '')).toLowerCase();
      if (label.indexOf('color') === -1) return;
      var matched = findBestIndex(media, selectedColor());
      setIndex(matched);
    });

    setIndex(index);
  }

  function init() {
    var root = galleryRoot();
    if (!root) return false;
    var media = collectMedia(root);
    if (!media.length) return false;
    render(root, media);
    return true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  var tries = 0;
  var timer = window.setInterval(function () {
    tries += 1;
    if (init() || tries > 12) window.clearInterval(timer);
  }, 250);
})();
