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
    var name2Input = root.querySelector('[data-ss-pers-name2]');
    var numberInput = root.querySelector('[data-ss-pers-number]');
    var line2Wrap = root.querySelector('[data-ss-pers-line2-wrap]');
    var addLineBtn = root.querySelector('[data-ss-pers-addline]');
    var removeLineBtn = root.querySelector('[data-ss-pers-removeline]');
    if (!canvas) return;

    var fontFamily = root.getAttribute('data-font-family') || 'Big Shoulders';
    var fontWeight = root.getAttribute('data-font-weight') || '700';
    var colorHex = root.getAttribute('data-color-hex') || '#141414';
    var maxName = parseInt(root.getAttribute('data-max-name') || '14', 10);
    var maxNumber = parseInt(root.getAttribute('data-max-number') || '3', 10);
    var fontCss = fontWeight + 'px \'' + fontFamily + '\', sans-serif';

    // The mockup-photo print-zone box for THIS product (EC8000 calibrated
    // values as fallback for products built before the metafield carried it).
    var BBOX_PCT = {
      left: parseFloat(root.getAttribute('data-bbox-left') || '31.6'),
      top: parseFloat(root.getAttribute('data-bbox-top') || '45.4'),
      width: parseFloat(root.getAttribute('data-bbox-width') || '37'),
      height: parseFloat(root.getAttribute('data-bbox-height') || '37')
    };

    // Layout geometry, shared verbatim with the server render
    // (Printful_Automation personalization.py :: nn_layout). Products built
    // before these rode in the metafield fall back to the same constants.
    var TOP_OFFSET_PCT = parseFloat(root.getAttribute('data-top-offset-pct') || '0.10');
    var NAME_ZONE_PCT = parseFloat(root.getAttribute('data-name-zone-pct') || '0.28');
    var NAME2_ZONE_PCT = parseFloat(root.getAttribute('data-name2-zone-pct') || '0.21');
    var LINE_GAP_PCT = parseFloat(root.getAttribute('data-line-gap-pct') || '0.02');
    var GAP_PCT = parseFloat(root.getAttribute('data-gap-pct') || '0.04');
    var NUMBER_MIN_SHARE = parseFloat(root.getAttribute('data-number-min-share') || '0.20');

    var ctx = canvas.getContext('2d');
    var scriptEl = document.querySelector('script[src*="ss-tote-personalize.js"]');
    var mockupsUrl = root.getAttribute('data-mockups-url')
      || (scriptEl ? scriptEl.getAttribute('data-mockups-url') : '');

    // Camo ink: the admin picked a pattern instead of a flat color. The tile
    // path is relative to the automation server — resolve it against the
    // mockups URL origin. Until the tile loads (or if patterns are
    // unsupported), the representative hex draws as a fallback.
    var colorPattern = root.getAttribute('data-color-pattern') || '';
    var colorTilePath = root.getAttribute('data-color-tile') || '';
    var camoTileImg = null;
    if (colorPattern && colorTilePath && mockupsUrl) {
      try {
        var tileUrl = new URL(colorTilePath, new URL(mockupsUrl).origin).href;
        var t = new Image();
        t.crossOrigin = 'anonymous';
        t.onload = function () { camoTileImg = t; draw(); };
        t.src = tileUrl;
      } catch (_e) { /* fallback to solid hex */ }
    }

    function textPaint(boxW) {
      if (camoTileImg) {
        try {
          var pat = ctx.createPattern(camoTileImg, 'repeat');
          if (pat && pat.setTransform && typeof DOMMatrix !== 'undefined') {
            var sc = (boxW / 4.5) / camoTileImg.width;
            pat.setTransform(new DOMMatrix().scale(sc, sc));
            return pat;
          }
        } catch (_e) { /* fallback below */ }
      }
      return colorHex;
    }
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

    // Mirror of personalization.py :: nn_layout. Allocates the vertical bands
    // for the name/number stack inside the print box, and guarantees the stack
    // fits: bands and gaps scale down rather than letting ink run off the box.
    // One name line plus a number reproduces the original fixed geometry.
    function nnLayout(boxW, boxH, nameLines, hasNumber) {
      var topOffset = boxH * TOP_OFFSET_PCT;
      var avail = Math.max(0, boxH - topOffset);
      var n = Math.max(0, nameLines);
      var lineGap = n > 1 ? boxW * LINE_GAP_PCT : 0;
      var band = n ? boxW * (n > 1 ? NAME2_ZONE_PCT : NAME_ZONE_PCT) : 0;
      var namesH = band * n + lineGap * Math.max(0, n - 1);
      var gap = 0;
      var numberH = 0;
      var i;

      if (n && !hasNumber) {
        // Nothing below the names — let them grow, but capped so a two-letter
        // name doesn't swell to fill the whole shirt.
        var grown = (avail - lineGap * (n - 1)) / n;
        band = Math.min(grown, boxW * NAME_ZONE_PCT * 1.8);
        namesH = band * n + lineGap * Math.max(0, n - 1);
      } else if (hasNumber && !n) {
        namesH = 0;
        numberH = avail;
      } else if (n && hasNumber) {
        gap = boxW * GAP_PCT;
        // Containment: on a very wide, short print area the name bands alone
        // would push the number off the bottom edge. Scale the names down so
        // the number keeps its minimum share instead of letting ink escape.
        var maxNamesH = Math.max(0, avail * (1 - NUMBER_MIN_SHARE) - gap);
        if (namesH > maxNamesH && namesH > 0) {
          var shrink = maxNamesH / namesH;
          band *= shrink;
          lineGap *= shrink;
          namesH = maxNamesH;
        }
        numberH = Math.max(0, avail - namesH - gap);
      }

      // With only one kind of content the allocation can leave slack below it —
      // a lone name pinned under the collar with an empty shirt beneath looks
      // like a mistake. Centre the block in that case. Never when a name AND a
      // number are present: that layout fills the box already and must not move.
      var used = namesH + gap + numberH;
      if (!(n && hasNumber) && used < avail) {
        topOffset += (avail - used) / 2;
      }

      var bands = [];
      for (i = 0; i < n; i++) bands.push(band);
      return {
        topOffset: topOffset,
        bands: bands,
        lineGap: lineGap,
        gap: gap,
        namesH: namesH,
        numberTop: topOffset + namesH + gap,
        numberH: numberH
      };
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

      var lines = nameLines().map(function (t) { return t.toUpperCase(); });
      var number = currentNumber();
      if (!lines.length && !number) return;

      // The print file fills the whole print area with a 3% margin — mirror
      // that inside the photo's print-area box.
      var rawW = w * BBOX_PCT.width / 100;
      var rawH = h * BBOX_PCT.height / 100;
      var inset = rawW * 0.03;
      var boxLeft = w * BBOX_PCT.left / 100 + inset;
      var boxTop = h * BBOX_PCT.top / 100 + inset;
      var boxW = rawW - inset * 2;
      var boxH = rawH - inset * 2;

      ctx.fillStyle = textPaint(boxW);
      ctx.textBaseline = 'alphabetic';

      // Jersey geometry, allocated by the shared layout (matches the server
      // render + editor overlay): the layout starts a fixed offset below the
      // box top (jersey names sit below the collar); each NAME line lives in
      // its own band; the NUMBER starts below the name block + gap. A long
      // name shrinks WITHIN its band — it never moves the number.
      var lay = nnLayout(boxW, boxH, lines.length, !!number);
      var fitW = boxW * 0.98;

      var cursor = boxTop + lay.topOffset;
      for (var i = 0; i < lines.length; i++) {
        var bandH = lay.bands[i];
        // The floor tracks the band, so a band narrowed by the containment
        // rule can never be overrun by a minimum font size.
        var lineFloor = Math.min(12, Math.max(4, bandH * 0.9));
        var lineSize = fitSize(lines[i], fitW, bandH, lineFloor);
        var lineInk = inkMetrics(lines[i], lineSize);
        setFont(lineSize);
        var lw = ctx.measureText(lines[i]).width;
        // Ink top pinned to the top of this line's band.
        ctx.fillText(lines[i], boxLeft + (boxW - lw) / 2, cursor + lineInk.ascent);
        cursor += bandH + lay.lineGap;
      }
      if (lines.length) cursor -= lay.lineGap; // no trailing gap after the last line

      if (number) {
        // Start line sits below the name block — or at the top offset when
        // there is no name, so a number on its own owns the whole box.
        var numberTop = lines.length ? cursor + lay.gap : boxTop + lay.topOffset;
        var numberAvailH = Math.max(0, (boxTop + boxH) - numberTop);
        var numFloor = Math.min(24, Math.max(4, numberAvailH * 0.9));
        var numSize = fitSize(number, fitW, numberAvailH, numFloor);
        var numInk = inkMetrics(number, numSize);
        setFont(numSize);
        var mw = ctx.measureText(number).width;
        ctx.fillText(number, boxLeft + (boxW - mw) / 2, numberTop + numInk.ascent);
      }
    }

    // --- what the buyer has actually filled in ----------------------------

    function line2Active() {
      return !!(line2Wrap && !line2Wrap.classList.contains('ss-pers-hidden'));
    }
    function nameLines() {
      var out = [];
      var first = (nameInput && nameInput.value || '').trim();
      var second = (line2Active() && name2Input && name2Input.value || '').trim();
      if (first) out.push(first);
      if (second) out.push(second);
      return out;
    }
    function currentNumber() {
      return (numberInput && numberInput.value || '').trim();
    }

    // Sanitize as-you-type, mirroring the server-side allowlist. Periods are
    // allowed so initials and abbreviations survive: J.R., St. Mary.
    function wireNameInput(input) {
      if (!input) return;
      input.addEventListener('input', function () {
        input.value = input.value.replace(/[^A-Za-z '.-]/g, '').slice(0, maxName);
        onFieldsChanged();
      });
    }
    wireNameInput(nameInput);
    wireNameInput(name2Input);
    if (numberInput) {
      numberInput.addEventListener('input', function () {
        numberInput.value = numberInput.value.replace(/[^0-9/-]/g, '').slice(0, maxNumber);
        onFieldsChanged();
      });
    }

    // --- the optional second name line -------------------------------------

    function setLine2(open) {
      if (!line2Wrap) return;
      line2Wrap.classList.toggle('ss-pers-hidden', !open);
      if (addLineBtn) addLineBtn.classList.toggle('ss-pers-hidden', open);
      if (name2Input) {
        if (!open) name2Input.value = '';
        else name2Input.focus();
      }
      onFieldsChanged();
    }
    if (addLineBtn) addLineBtn.addEventListener('click', function () { setLine2(true); });
    if (removeLineBtn) removeLineBtn.addEventListener('click', function () { setLine2(false); });

    // --- validation ---------------------------------------------------------

    var form = root.closest('form');

    // Nothing filled in at all has nothing to print, so that IS a hard stop.
    // Hanging it off native validation means the theme's own add-to-cart
    // handler (product-form.js checkValidity) already honours it.
    function syncValidity() {
      if (!nameInput) return;
      var anything = nameLines().length > 0 || !!currentNumber();
      nameInput.setCustomValidity(anything ? '' : 'Add a name or a number so we know what to print.');
    }

    // Leaving ONE side blank is usually deliberate, so it asks rather than
    // blocks. Returns the message to confirm, or '' when nothing is owed.
    function warningMessage() {
      var hasName = nameLines().length > 0;
      var hasNumber = !!currentNumber();
      if (hasName === hasNumber) return '';  // both filled, or both blank (hard stop)
      return hasName
        ? 'This will print with no number — just the name.'
        : 'This will print with no name — just the number.';
    }

    var warnModal = (root.parentElement || document).querySelector('[data-ss-pers-warn]');
    var warnBody = warnModal && warnModal.querySelector('[data-ss-pers-warn-body]');
    var confirmed = false;
    var pendingAction = null;

    function showWarn(message, onConfirm) {
      // With no modal markup, never stand between the buyer and the sale.
      if (!warnModal) { onConfirm(); return; }
      if (warnBody) warnBody.textContent = message;
      pendingAction = onConfirm;
      // Move to <body>: an ancestor with a CSS transform would otherwise
      // become the containing block and break position:fixed.
      if (warnModal.parentNode !== document.body) document.body.appendChild(warnModal);
      warnModal.classList.remove('ss-pers-hidden');
      warnModal.setAttribute('aria-hidden', 'false');
      var go = warnModal.querySelector('[data-ss-pers-warn-confirm]');
      if (go) go.focus();
    }

    function hideWarn() {
      if (!warnModal) return;
      warnModal.classList.add('ss-pers-hidden');
      warnModal.setAttribute('aria-hidden', 'true');
      pendingAction = null;
    }

    if (warnModal) {
      Array.prototype.forEach.call(
        warnModal.querySelectorAll('[data-ss-pers-warn-cancel]'),
        function (el) { el.addEventListener('click', hideWarn); }
      );
      var confirmBtn = warnModal.querySelector('[data-ss-pers-warn-confirm]');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function () {
          var act = pendingAction;
          confirmed = true;
          hideWarn();
          updateAcceleratedButtons();
          if (act) act();
        });
      }
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && !warnModal.classList.contains('ss-pers-hidden')) hideWarn();
      });
    }

    // Catch the add-to-cart click before the theme's own handlers see it —
    // document capture runs ahead of listeners bound anywhere inside.
    document.addEventListener('click', function (e) {
      if (confirmed || !form) return;
      var target = e.target;
      if (!target || !target.closest) return;
      var btn = target.closest('[type="submit"]');
      if (!btn || !form.contains(btn)) return;
      var message = warningMessage();
      if (!message) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      showWarn(message, function () { btn.click(); });
    }, true);

    // Backstop for any path that submits the form without a button click.
    if (form) {
      form.addEventListener('submit', function (e) {
        if (confirmed) return;
        var message = warningMessage();
        if (!message) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        showWarn(message, function () {
          if (form.requestSubmit) form.requestSubmit(); else form.submit();
        });
      }, true);
    }

    // Shop Pay and the other accelerated buttons are rendered by Shopify and
    // go straight to checkout, so a click inside them cannot be intercepted.
    // While a confirmation is owed they are held back instead, which is the
    // only way the warning cannot be skipped.
    var accelNote = null;
    function updateAcceleratedButtons() {
      var el = (form && form.querySelector('.accelerated-checkout-block'))
        || document.querySelector('.accelerated-checkout-block');
      if (!el || !el.parentNode) return;
      var held = !confirmed && !!warningMessage();
      el.classList.toggle('ss-pers-accel-held', held);
      if (held) {
        el.setAttribute('aria-disabled', 'true');
        if (!accelNote) {
          accelNote = document.createElement('p');
          accelNote.className = 'ss-pers-accel-note';
          accelNote.textContent = 'Use Add to cart to confirm your personalization first.';
        }
        if (accelNote.nextSibling !== el) el.parentNode.insertBefore(accelNote, el);
      } else {
        el.removeAttribute('aria-disabled');
        if (accelNote && accelNote.parentNode) accelNote.parentNode.removeChild(accelNote);
      }
    }

    // Any edit invalidates an earlier confirmation — the buyer may have just
    // fixed the very thing they were asked about.
    function onFieldsChanged() {
      confirmed = false;
      syncValidity();
      updateAcceleratedButtons();
      draw();
    }

    // The theme's add-to-cart handler silently no-ops on an invalid form
    // (checkValidity with no reportValidity) — surface the native tooltip so
    // the hard stop is actually visible. Purely additive.
    var submitBtn = form && form.querySelector('[type="submit"]');
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        if (form && !form.checkValidity()) form.reportValidity();
      });
    }

    syncValidity();
    updateAcceleratedButtons();

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
