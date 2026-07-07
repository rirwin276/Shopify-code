/* Stella & Sage — Name & Number personalization live preview.
   The FONT, TEXT COLOR, and print-zone box come from the product's
   admin-configured personalization metafield (data attributes on the
   widget) — the customer only types the name and number. This canvas is an
   approximation for the shopper; the authoritative print file is rendered
   server-side at fulfillment from the same values (Printful_Automation
   pro_builders/common/personalization.py), so what prints always matches
   what was ordered. Works for every personalizable product (tote, tees,
   hoodie) — the model-specific bbox and mockups endpoint ride in the
   metafield/Liquid data attributes, with EC8000 values as fallbacks. */
(function () {
  'use strict';

  function loadFont(family, weight, cb) {
    var id = 'ss-pers-font-' + family.replace(/\W+/g, '-');
    if (!document.getElementById(id)) {
      var link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family='
        + family.replace(/ /g, '+') + ':wght@' + weight + '&display=swap';
      document.head.appendChild(link);
    }
    if (document.fonts && document.fonts.load) {
      document.fonts.load(weight + ' 100px "' + family + '"').then(cb).catch(cb);
    } else {
      setTimeout(cb, 300);
    }
  }

  function initWidget(root) {
    var canvas = root.querySelector('[data-ss-pers-canvas]');
    var nameInput = root.querySelector('[data-ss-pers-name]');
    var numberInput = root.querySelector('[data-ss-pers-number]');
    if (!canvas) return;

    var fontFamily = root.getAttribute('data-font-family') || 'Big Shoulders';
    var fontWeight = root.getAttribute('data-font-weight') || '700';
    var colorHex = root.getAttribute('data-color-hex') || '#141414';
    var maxName = parseInt(root.getAttribute('data-max-name') || '14', 10);
    var maxNumber = parseInt(root.getAttribute('data-max-number') || '2', 10);
    var fontCss = fontWeight + 'px \'' + fontFamily + '\', sans-serif';

    // The mockup-photo print-zone box for THIS product (EC8000 calibrated
    // values as fallback for products built before the metafield carried it).
    var BBOX_PCT = {
      left: parseFloat(root.getAttribute('data-bbox-left') || '31.6'),
      top: parseFloat(root.getAttribute('data-bbox-top') || '45.4'),
      width: parseFloat(root.getAttribute('data-bbox-width') || '37'),
      height: parseFloat(root.getAttribute('data-bbox-height') || '37')
    };

    var ctx = canvas.getContext('2d');
    var scriptEl = document.querySelector('script[src*="ss-tote-personalize.js"]');
    var mockupsUrl = root.getAttribute('data-mockups-url')
      || (scriptEl ? scriptEl.getAttribute('data-mockups-url') : '');
    var currentColor = root.getAttribute('data-initial-color') || '';
    var backMap = {};
    var bgImg = null;

    function setFont(size) {
      ctx.font = fontWeight + ' ' + size + 'px \'' + fontFamily + '\', sans-serif';
    }

    // Ink-based measurement, mirroring the server's adaptive two-pass fit
    // (Printful_Automation personalization.py:render_back_png) so the
    // preview matches what actually prints.
    function inkMetrics(text, size) {
      setFont(size);
      var m = ctx.measureText(text);
      if (m.actualBoundingBoxAscent !== undefined) {
        return { h: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent, ascent: m.actualBoundingBoxAscent };
      }
      return { h: size * 0.74, ascent: size * 0.74 };
    }

    function fitSize(text, maxW, maxH, floor) {
      var size = Math.max(Math.floor(maxH), floor);
      while (size > floor) {
        setFont(size);
        var m = ctx.measureText(text);
        var h = (m.actualBoundingBoxAscent !== undefined)
          ? m.actualBoundingBoxAscent + m.actualBoundingBoxDescent
          : size * 0.74;
        if (m.width <= maxW && h <= maxH) return size;
        size -= 2;
      }
      return floor;
    }

    function loadBg(colorName) {
      var url = backMap[colorName] || backMap[Object.keys(backMap)[0]] || '';
      if (!url) { bgImg = null; draw(); return; }
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { bgImg = img; draw(); };
      img.onerror = function () { bgImg = null; draw(); };
      img.src = url;
    }

    function draw() {
      var w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f5f1e8';
      ctx.fillRect(0, 0, w, h);
      if (bgImg) {
        var scale = Math.max(w / bgImg.width, h / bgImg.height);
        var dw = bgImg.width * scale, dh = bgImg.height * scale;
        ctx.drawImage(bgImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
      }

      var name = (nameInput && nameInput.value || '').toUpperCase();
      var number = (numberInput && numberInput.value || '');
      if (!name && !number) return;

      // The print file fills the whole print area with a 3% margin — mirror
      // that inside the photo's print-area box.
      var rawW = w * BBOX_PCT.width / 100;
      var rawH = h * BBOX_PCT.height / 100;
      var inset = rawW * 0.03;
      var boxLeft = w * BBOX_PCT.left / 100 + inset;
      var boxTop = h * BBOX_PCT.top / 100 + inset;
      var boxW = rawW - inset * 2;
      var boxH = rawH - inset * 2;

      ctx.fillStyle = colorHex;
      ctx.textBaseline = 'alphabetic';

      // Consistent jersey layout — the NAME is pinned to the TOP of the print
      // box in a fixed band; the NUMBER is centered in the band below. Fixed
      // zones (matching the server's NN_NAME_ZONE_PCT / NN_GAP_PCT) mean the
      // number's size never moves the name — "7" and "88" leave the name in
      // exactly the same spot.
      var NAME_ZONE_PCT = 0.30, GAP_PCT = 0.04;
      var gap = boxH * GAP_PCT;
      var fitW = boxW * 0.98;
      var nameZoneH = boxH * NAME_ZONE_PCT;
      var numberZoneH = boxH - nameZoneH - gap;

      if (name) {
        var nameSize = fitSize(name, fitW, nameZoneH, 12);
        var nameInk = inkMetrics(name, nameSize);
        setFont(nameSize);
        var nw = ctx.measureText(name).width;
        // Ink top pinned to the top of the print box.
        ctx.fillText(name, boxLeft + (boxW - nw) / 2, boxTop + nameInk.ascent);
      }
      if (number) {
        var numSize = fitSize(number, fitW, numberZoneH, 24);
        var numInk = inkMetrics(number, numSize);
        setFont(numSize);
        var mw = ctx.measureText(number).width;
        // Centered within its fixed band below the name.
        var zoneTop = boxTop + nameZoneH + gap;
        var numY = zoneTop + Math.max(0, (numberZoneH - numInk.h) / 2) + numInk.ascent;
        ctx.fillText(number, boxLeft + (boxW - mw) / 2, numY);
      }
    }

    // Sanitize as-you-type, mirroring the server-side allowlist.
    if (nameInput) {
      nameInput.addEventListener('input', function () {
        nameInput.value = nameInput.value.replace(/[^A-Za-z '-]/g, '').slice(0, maxName);
        draw();
      });
    }
    if (numberInput) {
      numberInput.addEventListener('input', function () {
        numberInput.value = numberInput.value.replace(/[^0-9]/g, '').slice(0, maxNumber);
        draw();
      });
    }

    // The theme's own add-to-cart handler silently no-ops on an invalid form
    // (checkValidity with no reportValidity) — surface the native validation
    // tooltip so "Name and Number are required" is visible. Purely additive.
    var form = root.closest('form');
    var submitBtn = form && form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (form && !form.checkValidity()) form.reportValidity();
      });
    }

    // Follow garment color changes (theme's native variant-change event).
    document.addEventListener('variant:update', function (e) {
      try {
        var resource = e && e.detail && e.detail.resource;
        var name2 = resource && (resource.option1 || resource.title);
        if (name2 && name2 !== currentColor) {
          currentColor = name2;
          loadBg(currentColor);
        }
      } catch (_err) { /* ignore */ }
    });

    loadFont(fontFamily, fontWeight, function () {
      if (mockupsUrl) {
        fetch(mockupsUrl)
          .then(function (r) { return r.json(); })
          .then(function (data) {
            backMap = (data && data.back) || {};
            loadBg(currentColor);
          })
          .catch(function () { draw(); });
      } else {
        draw();
      }
    });
  }

  function boot() {
    document.querySelectorAll('[data-ss-pers]').forEach(initWidget);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
