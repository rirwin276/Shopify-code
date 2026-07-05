/* Stella & Sage — EC8000 tote personalization live preview.
   Draws the customer's Name/Number over the current garment-color back
   photo. This is an APPROXIMATION for the shopper — the authoritative print
   file is rendered server-side at fulfillment time from the same typed
   values (see Printful_Automation pro_builders/ec8000/personalize.py), so
   what prints always matches what was submitted even if this preview's
   exact typography drifts a little from the real thing. */
(function () {
  'use strict';

  // Must match pro_builders/ec8000/personalize.py BACK_BBOX_PCT exactly —
  // this is the approved print-safe zone from back_calibration.json.
  var BBOX_PCT = { left: 31.6, top: 45.4, width: 37.0, height: 37.0 };
  var TEXT_COLORS = { White: '#ffffff', Black: '#141414', Gold: '#b7a36a' };
  var FONT_FAMILY = "'Big Shoulders', sans-serif";

  var _fontLoaded = false;
  function ensureFont(cb) {
    if (_fontLoaded) { cb(); return; }
    if (!document.getElementById('ss-pers-font-link')) {
      var link = document.createElement('link');
      link.id = 'ss-pers-font-link';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Big+Shoulders:wght@700&display=swap';
      document.head.appendChild(link);
    }
    if (document.fonts && document.fonts.load) {
      document.fonts.load('700 100px "Big Shoulders"').then(function () {
        _fontLoaded = true; cb();
      }).catch(function () { cb(); });
    } else {
      setTimeout(cb, 300);
    }
  }

  function fitFontSize(ctx, text, maxW, maxH, startSize, minSize) {
    var size = startSize;
    while (size > minSize) {
      ctx.font = '700 ' + size + 'px ' + FONT_FAMILY;
      var w = ctx.measureText(text).width;
      if (w <= maxW && size <= maxH) return size;
      size -= 4;
    }
    return minSize;
  }

  function initWidget(root) {
    var canvas = root.querySelector('[data-ss-pers-canvas]');
    var nameInput = root.querySelector('[data-ss-pers-name]');
    var numberInput = root.querySelector('[data-ss-pers-number]');
    var colorInput = root.querySelector('[data-ss-pers-color-input]');
    var swatches = root.querySelectorAll('[data-ss-pers-colors] .ss-pers-swatch');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    var scriptEl = document.querySelector('script[src*="ss-tote-personalize.js"]');
    var mockupsUrl = scriptEl ? scriptEl.getAttribute('data-mockups-url') : '';
    var currentColor = root.getAttribute('data-initial-color') || '';
    var backMap = {};
    var bgImg = null;

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
        // cover-fit
        var scale = Math.max(w / bgImg.width, h / bgImg.height);
        var dw = bgImg.width * scale, dh = bgImg.height * scale;
        ctx.drawImage(bgImg, (w - dw) / 2, (h - dh) / 2, dw, dh);
      }

      var name = (nameInput && nameInput.value || '').toUpperCase();
      var number = (numberInput && numberInput.value || '');
      if (!name && !number) return;

      var boxW = w * BBOX_PCT.width / 100;
      var boxH = h * BBOX_PCT.height / 100;
      var boxLeft = w * BBOX_PCT.left / 100;
      var boxTop = h * BBOX_PCT.top / 100;
      var color = TEXT_COLORS[colorInput ? colorInput.value : 'Gold'] || '#b7a36a';

      ctx.fillStyle = color;
      ctx.textBaseline = 'alphabetic';

      var nameZoneH = boxH * 0.30;
      var numberZoneH = boxH - nameZoneH - boxH * 0.06;

      if (name) {
        var nameSize = fitFontSize(ctx, name, boxW, nameZoneH, Math.floor(boxH / 3), 14);
        ctx.font = '700 ' + nameSize + 'px ' + FONT_FAMILY;
        var nameW = ctx.measureText(name).width;
        ctx.fillText(name, boxLeft + (boxW - nameW) / 2, boxTop + nameSize * 0.85);
      }
      if (number) {
        var numSize = fitFontSize(ctx, number, boxW, numberZoneH, Math.floor(boxH), 30);
        ctx.font = '700 ' + numSize + 'px ' + FONT_FAMILY;
        var numW = ctx.measureText(number).width;
        var numTop = boxTop + nameZoneH + boxH * 0.06;
        ctx.fillText(number, boxLeft + (boxW - numW) / 2, numTop + numSize * 0.85);
      }
    }

    // Sanitize as-you-type, mirroring the server-side allowlist.
    if (nameInput) {
      nameInput.addEventListener('input', function () {
        nameInput.value = nameInput.value.replace(/[^A-Za-z '-]/g, '');
        draw();
      });
    }
    if (numberInput) {
      numberInput.addEventListener('input', function () {
        numberInput.value = numberInput.value.replace(/[^0-9]/g, '').slice(0, 2);
        draw();
      });
    }
    swatches.forEach(function (btn) {
      btn.addEventListener('click', function () {
        swatches.forEach(function (b) {
          b.classList.remove('ss-pers-swatch--active');
          b.setAttribute('aria-checked', 'false');
        });
        btn.classList.add('ss-pers-swatch--active');
        btn.setAttribute('aria-checked', 'true');
        if (colorInput) colorInput.value = btn.getAttribute('data-color');
        draw();
      });
    });

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

    ensureFont(function () {
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
