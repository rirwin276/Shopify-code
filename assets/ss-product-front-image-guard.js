/*
  Stella & Sage — Product Gallery Arrows

  Safe front-end helper: does NOT auto-select images and does NOT click the main
  product image. It only adds visible previous/next buttons that proxy to the
  theme's existing safe slider buttons when available, with a scroll fallback.
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

  function isUnsafe(el) {
    if (!el) return true;
    var text = [
      el.getAttribute && el.getAttribute('aria-label'),
      el.getAttribute && el.getAttribute('class'),
      el.textContent
    ].filter(Boolean).join(' ').toLowerCase();
    return text.indexOf('zoom') !== -1 ||
      text.indexOf('modal') !== -1 ||
      text.indexOf('open media') !== -1 ||
      (el.matches && el.matches('[aria-haspopup="dialog"], modal-opener')) ||
      (el.closest && el.closest('modal-opener, product-modal, .product-media-modal'));
  }

  function nativeButton(root, direction) {
    var selectors = direction === 'next'
      ? ['.slider-button--next', 'button[name="next"]', '[aria-label*="Next"]', '[aria-label*="next"]']
      : ['.slider-button--prev', 'button[name="previous"]', '[aria-label*="Previous"]', '[aria-label*="previous"]'];

    for (var i = 0; i < selectors.length; i += 1) {
      var btn = root.querySelector(selectors[i]);
      if (btn && !isUnsafe(btn) && typeof btn.click === 'function') return btn;
    }
    return null;
  }

  function scrollFallback(root, direction) {
    var slider = root.querySelector('.slider, ul, [data-slider], .product__media-list') || root;
    var amount = Math.max(280, Math.round(root.getBoundingClientRect().width * 0.72));
    try {
      slider.scrollBy({ left: direction === 'next' ? amount : -amount, behavior: 'smooth' });
    } catch (e) {
      slider.scrollLeft += direction === 'next' ? amount : -amount;
    }
  }

  function move(direction) {
    var root = galleryRoot();
    if (!root) return;
    var btn = nativeButton(root, direction);
    if (btn) {
      btn.click();
      return;
    }
    scrollFallback(root, direction);
  }

  function ensureArrows() {
    var root = galleryRoot();
    if (!root || root.querySelector('.ss-gallery-arrow')) return;

    var prev = document.createElement('button');
    prev.type = 'button';
    prev.className = 'ss-gallery-arrow ss-gallery-arrow--prev';
    prev.setAttribute('aria-label', 'Previous product image');
    prev.textContent = '‹';
    prev.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      move('prev');
    });

    var next = document.createElement('button');
    next.type = 'button';
    next.className = 'ss-gallery-arrow ss-gallery-arrow--next';
    next.setAttribute('aria-label', 'Next product image');
    next.textContent = '›';
    next.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      move('next');
    });

    root.appendChild(prev);
    root.appendChild(next);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureArrows, { once: true });
  } else {
    ensureArrows();
  }
  window.setTimeout(ensureArrows, 500);
  window.setTimeout(ensureArrows, 1400);
})();
