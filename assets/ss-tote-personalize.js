/* Stella & Sage — Name & Number personalization live preview.
   The FONT and TEXT COLOR come from the product's admin-configured
   personalization metafield (data attributes on the widget) — the customer
   only types the name and number. This canvas is an approximation for the
   shopper; the authoritative print file is rendered server-side at
   fulfillment from the same values (Printful_Automation
   pro_builders/ec8000/personalize.py), so what prints always matches what
   was ordered. */
(function () {
  'use strict';

  // Must match personalize.py BACK_BBOX_PCT — the approved print-safe zone
  // from the product's back calibration.
  var BBOX_PCT = { left: 31.6, top: 45.4, width: 37.0, height: 37.0 };

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

    var ctx = canvas.getContext('2d');
    var scriptEl = document.querySelector('script[src*="ss-tote-personalize.js"]');
    var mockupsUrl = scriptEl ? scriptEl.getAttribute('data-mockups-url') : '';
    var currentColor = root.getAttribute('data-initial-color') || '';
    var backMap = {};
    var bgImg = null;

    function setFont(size) {
      ctx.font = fontWeight + ' ' + size + 'px \'' + fontFamily + '\', sans-serif';
    }

    function fitSize(text, maxW, maxH, start, floor) {
      var size = Math.max(start, floor);
      while (size > floor) {
        setFont(size);
        if (ctx.measureText(text).width <= maxW && size <= maxH) return size;
        size -= 4;
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

      // Mirror the server layout: name zone on top, dominant number below,
      // combined block centered vertically in the print box.
      var gap = boxH * 0.05;
      var nameZoneH = boxH * 0.28;
      var numberZoneH = boxH - nameZoneH - gap;

      var nameSize = name ? fitSize(name, boxW, nameZoneH, Math.floor(nameZoneH), 12) : 0;
      var numSize = number ? fitSize(number, boxW, numberZoneH, Math.floor(numberZoneH), 24) : 0;

      var nameH = name ? nameSize * 0.74 : 0;
      var numH = number ? numSize * 0.74 : 0;
      var blockH = nameH + (name && number ? gap : 0) + numH;
      var y = boxTop + Math.max(0, (boxH - blockH) / 2);

      if (name) {
        setFont(nameSize);
        var nw = ctx.measureText(name).width;
        ctx.fillText(name, boxLeft + (boxW - nw) / 2, y + nameH);
        y += nameH + gap;
      }
      if (number) {
        setFont(numSize);
        var mw = ctx.measureText(number).width;
        ctx.fillText(number, boxLeft + (boxW - mw) / 2, y + numH);
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
