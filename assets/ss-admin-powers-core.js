(function(){
  // ── REBUILDING TOAST ─────────────────────────────────────────
  function apShowRebuildingToast() {
    // If a toast is already on-screen, don't stack them
    if (document.querySelector('.ap-rebuilding-toast')) return;

    var toast = document.createElement('div');
    toast.className = 'ap-rebuilding-toast';
    toast.innerHTML =
      '<strong>✅ Thank you — your placement and colors are saved.</strong><br>' +
      'We’re rebuilding this auto-build product now. Allow 2–4 minutes, then refresh ' +
      'this page to see the updated mockups. If it still looks off, you can edit the ' +
      'placement again or build a fresh one. ' +
      '<button type="button" class="ap-rebuilding-toast__close" aria-label="Dismiss">✕</button>';
    document.body.appendChild(toast);
    toast.querySelector('.ap-rebuilding-toast__close')
      .addEventListener('click', function(){ toast.remove(); });
    // Auto-dismiss after 15s so the admin view returns to a clean state.
    setTimeout(function(){ if (toast && toast.parentNode) toast.remove(); }, 15000);
  }

  (function apMaybeShowRebuildingToast(){
    try {
      var params = new URLSearchParams(window.location.search);
      if (params.get('rebuilding') !== '1') return;
      apShowRebuildingToast();
      // Clean ?rebuilding=1 from the URL so a page refresh doesn't re-show the toast
      if (window.history && window.history.replaceState) {
        var cleanParams = new URLSearchParams(window.location.search);
        cleanParams.delete('rebuilding');
        var qs = cleanParams.toString();
        var clean = window.location.origin + window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
        window.history.replaceState({}, document.title, clean);
      }
    } catch(_e){}
  })();

  // ── SMART TOOLTIPS ───────────────────────────────────────────
  function apInstallSmartTooltip(anchor, bubble, opts) {
    if (!anchor || !bubble) return;
    opts = opts || {};
    var gap = opts.gap || 10;
    var margin = opts.margin || 12;
    var arrow = opts.arrow || bubble.querySelector('.ap-smart-tooltip-arrow');
    var hideTimer = null;
    var isPointerOverAnchor = false;
    var isFocusActive = false;

    function isMobileTooltipBlocked() {
      return window.matchMedia && window.matchMedia('(max-width: 700px)').matches;
    }

    function place() {
      if (isMobileTooltipBlocked()) {
        bubble.style.display = 'none';
        return;
      }

      clearTimeout(hideTimer);
      bubble.style.display = 'block';
      bubble.style.visibility = 'hidden';
      bubble.style.position = 'fixed';
      bubble.style.bottom = 'auto';
      bubble.style.right = 'auto';
      bubble.style.transform = 'none';
      bubble.style.zIndex = opts.zIndex || 10050;

      var anchorRect = anchor.getBoundingClientRect();
      var vw = window.innerWidth || document.documentElement.clientWidth;
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var bRect = bubble.getBoundingClientRect();
      var bubbleW = bRect.width;
      var bubbleH = bRect.height;
      var anchorCenter = anchorRect.left + (anchorRect.width / 2);

      var roomAbove = anchorRect.top;
      var roomBelow = vh - anchorRect.bottom;
      var placement = (roomAbove >= bubbleH + gap + margin || roomAbove >= roomBelow) ? 'top' : 'bottom';

      var top;
      if (placement === 'top') {
        top = anchorRect.top - bubbleH - gap;
        if (top < margin) {
          placement = 'bottom';
          top = anchorRect.bottom + gap;
        }
      } else {
        top = anchorRect.bottom + gap;
        if (top + bubbleH > vh - margin && roomAbove > roomBelow) {
          placement = 'top';
          top = anchorRect.top - bubbleH - gap;
        }
      }

      top = Math.max(margin, Math.min(top, vh - bubbleH - margin));
      var left = anchorCenter - (bubbleW / 2);
      left = Math.max(margin, Math.min(left, vw - bubbleW - margin));

      bubble.style.top = Math.round(top) + 'px';
      bubble.style.left = Math.round(left) + 'px';
      bubble.style.visibility = 'visible';
      bubble.setAttribute('data-placement', placement);

      if (arrow) {
        var arrowSize = arrow.offsetWidth || 12;
        var arrowLeft = anchorCenter - left - (arrowSize / 2);
        arrowLeft = Math.max(14, Math.min(arrowLeft, bubbleW - 14 - arrowSize));
        arrow.style.left = Math.round(arrowLeft) + 'px';
        arrow.style.right = 'auto';
        arrow.style.transform = 'rotate(45deg)';
        arrow.style.background = '#11100e';

        if (placement === 'top') {
          arrow.style.top = 'auto';
          arrow.style.bottom = '-' + Math.round(arrowSize / 2) + 'px';
          arrow.style.borderRight = '1px solid rgba(255,255,255,0.09)';
          arrow.style.borderBottom = '1px solid rgba(255,255,255,0.09)';
          arrow.style.borderLeft = '0';
          arrow.style.borderTop = '0';
        } else {
          arrow.style.bottom = 'auto';
          arrow.style.top = '-' + Math.round(arrowSize / 2) + 'px';
          arrow.style.borderLeft = '1px solid rgba(255,255,255,0.09)';
          arrow.style.borderTop = '1px solid rgba(255,255,255,0.09)';
          arrow.style.borderRight = '0';
          arrow.style.borderBottom = '0';
        }
      }
    }

    function hide() {
      hideTimer = setTimeout(function(){
        bubble.style.display = 'none';
        bubble.style.visibility = 'hidden';
      }, 40);
    }

    anchor.addEventListener('mouseenter', function(){ isPointerOverAnchor = true; place(); });
    anchor.addEventListener('focusin', function(){ isFocusActive = true; place(); });
    anchor.addEventListener('mouseleave', function(){ isPointerOverAnchor = false; hide(); });
    anchor.addEventListener('focusout', function(){ isFocusActive = false; hide(); });
    window.addEventListener('resize', function(){ if (bubble.style.display === 'block' && (isPointerOverAnchor || isFocusActive)) place(); });
    window.addEventListener('scroll', function(){
      if (bubble.style.display === 'block') {
        bubble.style.display = 'none';
        bubble.style.visibility = 'hidden';
      }
    }, true);
  }

  apInstallSmartTooltip(
    document.querySelector('.ap-share-help'),
    document.getElementById('apShareHelpBubble'),
    { gap: 12, margin: 14, zIndex: 10060 }
  );

  // ── BC3413 EDITOR MODAL ─────────────────────────────────────
  var apEditorOverlay = document.getElementById('apEditorOverlay');
  var apEditorIframe  = document.getElementById('apEditorIframe');
  var apEditorClose   = document.getElementById('apEditorClose');
  var _apEditorKeydown = null;

  function apOpenEditorModal(url) {
    if (!apEditorOverlay || !apEditorIframe) {
      // Modal DOM missing — fall back to new tab so the user isn't stuck
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    apEditorIframe.src = url;
    apEditorOverlay.classList.add('open');
    apEditorOverlay.setAttribute('aria-hidden', 'false');
    document.body.classList.add('ap-editor-open');
    _apEditorKeydown = function(e){ if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); apCloseEditorModal(); } };
    document.addEventListener('keydown', _apEditorKeydown);
  }

  function apCloseEditorModal() {
    if (!apEditorOverlay || !apEditorIframe) return;
    apEditorOverlay.classList.remove('open');
    apEditorOverlay.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('ap-editor-open');
    // Clear iframe so the editor stops running (and next open starts fresh)
    apEditorIframe.src = 'about:blank';
    if (_apEditorKeydown) {
      document.removeEventListener('keydown', _apEditorKeydown);
      _apEditorKeydown = null;
    }
  }

  // Expose close + open for other scopes (render function attaches click handlers)
  window.apOpenEditorModal  = apOpenEditorModal;
  window.apCloseEditorModal = apCloseEditorModal;

  // Close button + backdrop click
  if (apEditorClose) {
    apEditorClose.addEventListener('click', apCloseEditorModal);
  }
  if (apEditorOverlay) {
    apEditorOverlay.addEventListener('click', function(e){
      // Only close on direct backdrop clicks, not on dialog content
      if (e.target === apEditorOverlay) apCloseEditorModal();
    });
  }

  // postMessage listener — editor signals save/close from inside the iframe
  window.addEventListener('message', function(e){
    var data = e && e.data;
    if (!data || typeof data !== 'object') return;
    // Validate origin against the known editor base URL to reject messages
    // from unrelated frames. Falls back to allowing the message if the base
    // URL is unavailable (shouldn't happen in practice).
    try {
      var _expectedOrigin = new URL(SSAP.editorBaseUrl || '').origin;
      var _railwayOrigin = new URL(SSAP.railwayUrl || '').origin;
      if (_expectedOrigin && e.origin !== _expectedOrigin && e.origin !== _railwayOrigin) return;
    } catch(_origErr){}
    if (data.type === 'bc3413_placement_saved') {
      apCloseEditorModal();
      var handle = data.product_handle;
      var jobId  = data.job_id;
      if (jobId && handle) {
        apStartInlineRebuilding(handle, jobId);
      } else {
        // Fallback: no job_id (old async flow or missing handle)
        apShowRebuildingToast();
      }
    } else if (data.type === 'bc3413_close') {
      apCloseEditorModal();
    } else if (data.type === 'bc3001y_placement_saved') {
      apCloseEditorModal();
      var bc3001yHandle = data.product_handle;
      var bc3001yJobId  = data.job_id;
      if (bc3001yJobId && bc3001yHandle) {
        apStartInlineRebuilding(bc3001yHandle, bc3001yJobId);
      } else {
        apShowRebuildingToast();
      }
    } else if (data.type === 'bc3001y_close') {
      apCloseEditorModal();
    } else if (data.type === 'nl6733_placement_saved') {
      apCloseEditorModal();
      var nl6733Handle = data.product_handle; var nl6733JobId = data.job_id;
      if (nl6733JobId && nl6733Handle) { apStartInlineRebuilding(nl6733Handle, nl6733JobId); } else { apShowRebuildingToast(); }
    } else if (data.type === 'nl6733_close') {
      apCloseEditorModal();
    } else if (data.type === 'mc1790_placement_saved') {
      apCloseEditorModal();
      var mc1790Handle = data.product_handle; var mc1790JobId = data.job_id;
      if (mc1790JobId && mc1790Handle) { apStartInlineRebuilding(mc1790Handle, mc1790JobId); } else { apShowRebuildingToast(); }
    } else if (data.type === 'mc1790_close') {
      apCloseEditorModal();
    } else if (data.type === 'm2580_placement_saved') {
      apCloseEditorModal();
      var m2580Handle = data.product_handle; var m2580JobId = data.job_id;
      if (m2580JobId && m2580Handle) { apStartInlineRebuilding(m2580Handle, m2580JobId); } else { apShowRebuildingToast(); }
    } else if (data.type === 'm2580_close') {
      apCloseEditorModal();
    } else if (data.type === 'cc1467y_placement_saved') {
      apCloseEditorModal();
      var cc1467yHandle = data.product_handle; var cc1467yJobId = data.job_id;
      if (cc1467yJobId && cc1467yHandle) { apStartInlineRebuilding(cc1467yHandle, cc1467yJobId); } else { apShowRebuildingToast(); }
    } else if (data.type === 'cc1467y_close') {
      apCloseEditorModal();
    } else if (data.type === 'studio-uploader:done' && data.slot === 'settings-logo' && data.session_id) {
      if (typeof window.apSettingsHandleLogoDone === 'function') {
        window.apSettingsHandleLogoDone(data);
      }
    }
  });

  // ── INLINE REBUILDING PROGRESS ───────────────────────────────
  function apCssEscape(s) {
    if (window.CSS && CSS.escape) return CSS.escape(s);
    return String(s).replace(/[^\w-]/g, function(c) { return '\\' + c; });
  }

  function apEscapeAttr(s) {
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function apFindRowByEditButton(handle) {
    var btn = document.querySelector('.ap-edit-placement-btn[data-product-handle="' + apCssEscape(handle) + '"]');
    return btn ? btn.closest('.ap-product-row') : null;
  }

  function apStartInlineRebuilding(productHandle, jobId) {
    var row = document.querySelector('.ap-product-row[data-product-handle="' + apCssEscape(productHandle) + '"]')
           || apFindRowByEditButton(productHandle);
    if (!row) return;

    var actions = row.querySelector('.ap-product-row__actions');
    if (!actions) return;

    actions.dataset.apOriginalActions = actions.innerHTML;
    actions.innerHTML =
      '<div class="ap-rebuilding-inline" data-job-id="' + apEscapeAttr(jobId) + '" data-product-handle="' + apEscapeAttr(productHandle) + '">' +
        '<div class="ap-rebuilding-inline__bar"><div class="ap-rebuilding-inline__bar-fill"></div></div>' +
        '<div class="ap-rebuilding-inline__label">Rebuilding\u2026 <span class="ap-rebuilding-inline__step">starting</span></div>' +
      '</div>';

    apPollApplyStatus(productHandle, jobId, actions);
  }

  function apPollApplyStatus(handle, jobId, actionsEl) {
    var url = (SSAP.editorBaseUrl || '').replace(/\/editor\/bc3413\/?$/, '') +
              '/editor/bc3413/apply_status/' + encodeURIComponent(jobId) +
              '?secret=' + encodeURIComponent(SSAP.editorSecret || '');

    var tries = 0;
    var maxTries = 240;      // 240 × 3 s = 12 minute hard cap
    var intervalMs = 3000;   // poll every 3 s
    var consecutiveErrors = 0;

    function tick() {
      tries++;
      fetch(url).then(function(r){ return r.json(); }).then(function(j){
        consecutiveErrors = 0;
        var wrap = actionsEl.querySelector('.ap-rebuilding-inline');
        if (!wrap) return;
        var stepEl = wrap.querySelector('.ap-rebuilding-inline__step');

        if (j.status === 'succeeded') {
          wrap.classList.add('ap-rebuilding-inline--success');
          wrap.querySelector('.ap-rebuilding-inline__label').textContent = '✅ Rebuild complete — refreshing…';
          setTimeout(function(){ window.location.reload(); }, 1500);
          return;
        }
        if (j.status === 'failed') {
          wrap.classList.add('ap-rebuilding-inline--error');
          wrap.querySelector('.ap-rebuilding-inline__label').textContent =
            '❌ Rebuild failed: ' + (j.error || 'unknown error');
          setTimeout(function(){
            if (actionsEl.dataset.apOriginalActions) {
              actionsEl.innerHTML = actionsEl.dataset.apOriginalActions;
              delete actionsEl.dataset.apOriginalActions;
            }
          }, 6000);
          return;
        }
        if (stepEl) {
          stepEl.textContent = (j.progress || j.current_step || j.status || 'working') + '\u2026';
        }
        if (tries < maxTries) {
          setTimeout(tick, intervalMs);
        } else {
          if (stepEl) stepEl.textContent = 'taking longer than expected \u2014 check back soon';
        }
      }).catch(function(){
        consecutiveErrors++;
        var wrap = actionsEl.querySelector('.ap-rebuilding-inline');
        var stepEl = wrap && wrap.querySelector('.ap-rebuilding-inline__step');
        if (stepEl && consecutiveErrors >= 3) {
          stepEl.textContent = 'connection issues \u2014 retrying\u2026';
        }
        if (tries < maxTries) setTimeout(tick, intervalMs);
      });
    }

    tick();
  }

  // ── SHARE STORE MODAL ───────────────────────────────────────
  var apBtnShareStore = document.getElementById('apBtnShareStore');
  var apShareOverlay = document.getElementById('apShareOverlay');
  var apShareClose = document.getElementById('apShareClose');
  function apOpenShareModal(){
    if(!apShareOverlay) return;
    apShareOverlay.classList.add('open');
    apShareOverlay.setAttribute('aria-hidden', 'false');
  }
  function apCloseShareModal(){
    if(!apShareOverlay) return;
    apShareOverlay.classList.remove('open');
    apShareOverlay.setAttribute('aria-hidden', 'true');
  }
  if(apBtnShareStore) apBtnShareStore.addEventListener('click', apOpenShareModal);
  if(apShareClose) apShareClose.addEventListener('click', apCloseShareModal);
  if(apShareOverlay){
    apShareOverlay.addEventListener('click', function(e){ if(e.target === apShareOverlay) apCloseShareModal(); });
  }

  // ── MAIN TAB SWITCHING ──────────────────────────────────────
  var apProductsLoaded = false;

  document.querySelectorAll('.ap-main-tab-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var targetId = btn.getAttribute('data-main-tab');
      // Deactivate all tabs and panels
      document.querySelectorAll('.ap-main-tab-btn').forEach(function(b){ b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
      document.querySelectorAll('.ap-main-panel').forEach(function(p){ p.classList.remove('active'); });
      // Activate clicked tab and its panel
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      var panel = document.getElementById(targetId);
      if(panel) panel.classList.add('active');
      // Lazy-load products when Products tab is first clicked
      if((targetId === 'apPanelProducts' || targetId === 'apPanelAddProducts') && !apProductsLoaded){
        apProductsLoaded = true;
        apLoadProducts();
      }
    });
  });

  // TAB SWITCHING (inner tabs — Copy Link / QR Code)
  document.querySelectorAll('.ap-tab-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      var targetId = btn.getAttribute('data-tab');
      var scope = btn.closest('.ap-main-panel') || btn.closest('.ap-card') || document;
      scope.querySelectorAll('.ap-tab-content').forEach(function(c){ c.style.display = 'none'; });
      scope.querySelectorAll('.ap-tab-btn').forEach(function(b){ b.classList.remove('active'); });
      document.getElementById(targetId).style.display = 'block';
      btn.classList.add('active');
    });
  });

  // RADIO SYNC
  document.addEventListener('change', function(e){
    if(e.target && e.target.name === 'ap-joinmode'){
      document.querySelectorAll('.ap-radio').forEach(function(r){ r.classList.remove('selected'); });
      e.target.closest('.ap-radio').classList.add('selected');
      var apBlockPublic = document.getElementById('apBlockPublic');
      if(apBlockPublic) apBlockPublic.style.display = (e.target.value === 'public') ? 'block' : 'none';
    }
  });

  // QR CODE
  if(typeof QRCode !== 'undefined' && document.getElementById('ap-qrcode')){
    new QRCode(document.getElementById('ap-qrcode'), {
      text: SSAP.joinLink,
      width: 160, height: 160,
      colorDark: '#0f172a', colorLight: '#ffffff',
      correctLevel: QRCode.CorrectLevel.H
    });
  }

  var ADMIN_ACTION_URL = (SSAP.railwayUrl || '') + '/api/admin-action';

  function buildAdminActionPayload(action, payload){
    return Object.assign({
      action: action,
      shop_handle: String(SSAP.collectionHandle || ''),
      requested_by_customer_id: SSAP.customerId,
      requested_by_email: SSAP.customerEmail
    }, payload || {});
  }

  async function apPost(action, payload){
    if(!SSAP.railwayUrl){
      throw new Error('Admin backend URL is missing.');
    }

    return fetch(ADMIN_ACTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildAdminActionPayload(action, payload))
    });
  }
  function setStatus(el, msg, type){
    if(!el) return;
    el.textContent = msg;
    el.className = 'ap-status ' + (type || '');
  }

  function setStatusLines(el, lines, type){
    if(!el) return;
    el.innerHTML = '';
    el.className = 'ap-status ' + (type || '');
    (lines || []).forEach(function(lineText){
      var line = document.createElement('div');
      line.textContent = lineText;
      el.appendChild(line);
    });
  }

  // SAVE MODE (legacy join-mode UI is hidden in V13; guard in case it is re-enabled later)
  var apBtnSaveMode = document.getElementById('apBtnSaveMode');
  if(apBtnSaveMode){
    apBtnSaveMode.addEventListener('click', async function(){
      var btn = this;
      var checkedMode = document.querySelector('input[name="ap-joinmode"]:checked');
      if(!checkedMode) return;
      var mode = checkedMode.value;
      btn.disabled = true; btn.textContent = 'Saving…';
      setStatus(document.getElementById('apStatusMode'), '', '');
      try {
        var res = await apPost('set_join_mode', { join_mode: mode });
        if(!res.ok) throw new Error();
        setStatus(document.getElementById('apStatusMode'), '✅ Settings saved!', 'ok');
      } catch(e) {
        setStatus(document.getElementById('apStatusMode'), '❌ Error saving settings.', 'err');
      } finally {
        btn.disabled = false; btn.textContent = 'Save & Apply Settings';
      }
    });
  }

  // COPY LINK
  var apBtnCopy = document.getElementById('apBtnCopy');
  if(apBtnCopy) apBtnCopy.addEventListener('click', function(){
    var btn = this;
    var link = document.getElementById('apInputJoinLink').value;
    if(navigator.clipboard && window.isSecureContext){
      navigator.clipboard.writeText(link).then(function(){
        btn.textContent = 'Copied!';
        setTimeout(function(){ btn.textContent = 'Copy'; }, 1600);
      }).catch(function(){
        btn.textContent = 'Copy manually';
        setTimeout(function(){ btn.textContent = 'Copy'; }, 2400);
      });
    } else {
      // Fallback for non-HTTPS or unsupported browsers
      document.getElementById('apInputJoinLink').select();
      btn.textContent = 'Select & copy';
      setTimeout(function(){ btn.textContent = 'Copy'; }, 2400);
    }
  });

  // ADD / REMOVE MEMBERS
  function apGetMemberActionConfig(action, role){
    if(action === 'add'){
      if(role === 'remove-admin') return null;
      return {
        route: role === 'admin' ? 'add-admin' : 'add-member',
        successText: '✅ Added '
      };
    }
    if(action === 'remove-admin'){
      return {
        route: 'remove-admin',
        successText: '✅ Removed admin role for '
      };
    }
    return {
      route: 'remove-member',
      successText: '✅ Removed '
    };
  }

  async function handleMemberAction(action){
    var rawText = document.getElementById('apInputEmails').value || '';
    var emails = rawText.split(/[\s,;]+/).map(function(e){ return e.trim().toLowerCase(); }).filter(function(e){ return e.length > 0; });
    var role = document.getElementById('apInputRole').value;
    var statusEl = document.getElementById('apStatusMembers');
    var btnAdd = document.getElementById('apBtnAdd');
    var btnRemove = document.getElementById('apBtnRemove');
    var btnRemoveAdmin = document.getElementById('apBtnRemoveAdmin');
    var handle = String(SSAP.shopHandle || '').trim();
    var actionConfig = apGetMemberActionConfig(action, role);

    if(emails.length === 0){
      setStatus(statusEl, '⚠️ Please enter at least one email.', 'err');
      return;
    }
    if(!handle){
      setStatus(statusEl, '⚠️ Select a store first.', 'err');
      return;
    }
    if(!actionConfig){
      setStatus(statusEl, '⚠️ Choose Member or Admin when adding access.', 'err');
      return;
    }
    if((action === 'remove' || action === 'remove-admin') && !confirm((actionConfig.route === 'remove-admin' ? 'Remove admin role for ' : 'Remove access for ') + emails.length + ' email(s)?')) return;

    setStatus(statusEl, 'Processing…', '');
    btnAdd.disabled = true; btnRemove.disabled = true;
    if(btnRemoveAdmin) btnRemoveAdmin.disabled = true;

    try {
      var lines = [];
      var hasFailure = false;

      for (var i = 0; i < emails.length; i++) {
        var email = emails[i];
        var res = await fetch(
          '/apps/ss/relay/store/' + encodeURIComponent(handle) + '/' + actionConfig.route,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email }),
            cache: 'no-store'
          }
        );

        var errorPayload = await res.json().catch(function(){ return {}; });
        if (!res.ok || errorPayload.ok === false) {
          hasFailure = true;
          var errorMessage = errorPayload.error || errorPayload.message || ('HTTP ' + res.status);
          if (actionConfig.route === 'remove-admin' && /last admin/i.test(errorMessage || '')) {
            lines.push('❌ Cannot remove the last admin of this store');
          } else {
            lines.push('❌ ' + email + ': ' + errorMessage);
          }
          continue;
        }
        lines.push(actionConfig.successText + email);
      }

      if (!hasFailure) {
        document.getElementById('apInputEmails').value = '';
      }
      setStatusLines(statusEl, lines, hasFailure ? 'err' : 'ok');
    } catch(e) {
      setStatus(statusEl, '❌ Could not process request. ' + (e.message || ''), 'err');
    } finally {
      btnAdd.disabled = false; btnRemove.disabled = false;
      if(btnRemoveAdmin) btnRemoveAdmin.disabled = false;
    }
  }

  document.getElementById('apBtnAdd').addEventListener('click', function(){ handleMemberAction('add'); });
  document.getElementById('apBtnRemove').addEventListener('click', function(){ handleMemberAction('remove'); });
  document.getElementById('apBtnRemoveAdmin').addEventListener('click', function(){
    var roleSelect = document.getElementById('apInputRole');
    if(roleSelect) roleSelect.value = 'remove-admin';
    handleMemberAction('remove-admin');
  });

  // ── SLEEP / WAKE STORE ────────────────────────────────────
  var AP_PROXY_URL = '/apps/ss';
  var apStatusSleep = document.getElementById('apStatusSleep');

  function apSleepStatus(msg, type){
    if(!apStatusSleep) return;
    apStatusSleep.textContent = msg;
    apStatusSleep.className = 'ap-status ' + (type || '');
  }

  var apBtnSleepStore = document.getElementById('apBtnSleepStore');
  if(apBtnSleepStore){
    apBtnSleepStore.addEventListener('click', async function(){
      if(!confirm('Put "' + (SSAP.shopHandle || 'this store') + '" to sleep? All products will be deleted. Member tags are preserved.')) return;
      apBtnSleepStore.disabled = true;
      apBtnSleepStore.textContent = 'Putting to sleep\u2026';
      apSleepStatus('', '');
      try {
        var res = await fetch(AP_PROXY_URL + '/relay/store/' + encodeURIComponent(SSAP.shopHandle || '') + '/sleep', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        var data = await res.json();
        if(data.job_id || data.status === 'ok' || res.ok){
          apSleepStatus('\u2705 Store is going to sleep. Reloading\u2026', 'ok');
          setTimeout(function(){ window.location.reload(); }, 2000);
        } else {
          apSleepStatus('\u274C ' + (data.error || 'Failed'), 'err');
          apBtnSleepStore.disabled = false;
          apBtnSleepStore.textContent = '\ud83d\udca4 Put Store to Sleep';
        }
      } catch(e) {
        apSleepStatus('\u274C Network error: ' + (e.message || 'unknown'), 'err');
        apBtnSleepStore.disabled = false;
        apBtnSleepStore.textContent = '\ud83d\udca4 Put Store to Sleep';
      }
    });
  }

  var apBtnWakeStore = document.getElementById('apBtnWakeStore');
  if(apBtnWakeStore){
    apBtnWakeStore.addEventListener('click', async function(){
      if(!confirm('Wake up "' + (SSAP.shopHandle || 'this store') + '"? Printful will rebuild all products.')) return;
      apBtnWakeStore.disabled = true;
      apBtnWakeStore.textContent = 'Waking up\u2026';
      apSleepStatus('', '');
      try {
        var res = await fetch(AP_PROXY_URL + '/relay/store/' + encodeURIComponent(SSAP.shopHandle || '') + '/wakeup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        var data = await res.json();
        if(data.job_id || data.status === 'ok' || res.ok){
          apSleepStatus('\u2705 Store is waking up! Products are being rebuilt. Reloading\u2026', 'ok');
          setTimeout(function(){ window.location.reload(); }, 2000);
        } else {
          apSleepStatus('\u274C ' + (data.error || 'Failed'), 'err');
          apBtnWakeStore.disabled = false;
          apBtnWakeStore.textContent = '\u2600\ufe0f Wake Up Store';
        }
      } catch(e) {
        apSleepStatus('\u274C Network error: ' + (e.message || 'unknown'), 'err');
        apBtnWakeStore.disabled = false;
        apBtnWakeStore.textContent = '\u2600\ufe0f Wake Up Store';
      }
    });
  }

  // ── NUKE STORE ────────────────────────────────────────────
  var NUKE_BACKEND_URL = '/apps/ss';
  var NUKE_HANDLE = String(SSAP.shopHandle || '');
  var apNukeBtn = document.getElementById('apNukeBtn');
  var apNukeOverlay = document.getElementById('apNukeOverlay');
  var apNukeInput = document.getElementById('apNukeInput');
  var apNukeDestroy = document.getElementById('apNukeDestroy');
  var apNukeCancel = document.getElementById('apNukeCancel');
  var apNukeLog = document.getElementById('apNukeLog');

  function appendNukeLog(msg){
    apNukeLog.style.display = 'block';
    apNukeLog.textContent += msg + '\n';
    apNukeLog.scrollTop = apNukeLog.scrollHeight;
  }

  apNukeBtn && apNukeBtn.addEventListener('click', function(){
    apNukeInput.value = '';
    apNukeDestroy.disabled = true;
    apNukeLog.textContent = '';
    apNukeLog.style.display = 'none';
    apNukeOverlay.classList.add('open');
  });

  apNukeCancel && apNukeCancel.addEventListener('click', function(){
    apNukeOverlay.classList.remove('open');
  });

  apNukeOverlay && apNukeOverlay.addEventListener('click', function(e){
    if(e.target === apNukeOverlay) apNukeOverlay.classList.remove('open');
  });

  apNukeInput && apNukeInput.addEventListener('input', function(){
    apNukeDestroy.disabled = (apNukeInput.value.trim() !== 'gone');
  });

  apNukeDestroy && apNukeDestroy.addEventListener('click', async function(){
    if(apNukeInput.value.trim() !== 'gone') return;
    if(!NUKE_BACKEND_URL){
      appendNukeLog('ERROR: No backend URL configured.');
      return;
    }
    apNukeDestroy.disabled = true;
    apNukeCancel.disabled = true;
    appendNukeLog('Starting nuke for "' + NUKE_HANDLE + '"…');

    try {
      var res = await fetch(NUKE_BACKEND_URL + '/relay/storefront/' + encodeURIComponent(NUKE_HANDLE) + '/nuke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if(!res.ok){
        appendNukeLog('ERROR: ' + res.status + ' ' + res.statusText);
        apNukeDestroy.disabled = false;
        apNukeCancel.disabled = false;
        return;
      }

      var data = await res.json();
      var jobId = data.job_id;
      if(!jobId){
        appendNukeLog('ERROR: No job_id in response.');
        apNukeDestroy.disabled = false;
        apNukeCancel.disabled = false;
        return;
      }
      appendNukeLog('Job started: ' + jobId);

      var lastLog = 0;
      var pollInterval = setInterval(async function(){
        try {
          var pollRes = await fetch(NUKE_BACKEND_URL + '/relay/job/' + encodeURIComponent(jobId));
          if(!pollRes.ok){ appendNukeLog('Poll error: ' + pollRes.status); return; }
          var job = await pollRes.json();
          var lines = job.log || [];
          for(var i = lastLog; i < lines.length; i++){ appendNukeLog(lines[i]); }
          lastLog = lines.length;

          if(job.status === 'done'){
            clearInterval(pollInterval);
            appendNukeLog('✅ Store destroyed. Redirecting…');
            setTimeout(function(){ window.location.href = SSAP.dashboardUrl; }, 2000);
          } else if(job.status === 'error'){
            clearInterval(pollInterval);
            appendNukeLog('❌ Error: ' + (job.error || 'Unknown error'));
            apNukeCancel.disabled = false;
          }
        } catch(pollErr){
          appendNukeLog('Poll network error: ' + (pollErr.message || 'unknown'));
        }
      }, 2000);

    } catch(err){
      appendNukeLog('Network error: ' + (err.message || 'unknown'));
      apNukeDestroy.disabled = false;
      apNukeCancel.disabled = false;
    }
  });

  // ── PRODUCTS TAB ──────────────────────────────────────────────
  var apProductsSpinner         = document.getElementById('apProductsSpinner');
  var apProductsEmpty           = document.getElementById('apProductsEmpty');
  // One unified product list (custom/pro products are sorted first within it).
  var apProductsAllContainer    = document.getElementById('apProductsAllContainer');
  var apProductsContainer       = apProductsAllContainer; // legacy fallback for older helpers
  var apAllProductCount         = document.getElementById('apAllProductCount');
  var apStatusProducts          = document.getElementById('apStatusProducts');

  function apProductsStatus(msg, type){
    if(!apStatusProducts) return;
    apStatusProducts.textContent = msg;
    apStatusProducts.className = 'ap-status ' + (type || '');
  }

  function apProductTagsArray(tags){
    if(Array.isArray(tags)) return tags.map(function(t){ return String(t || '').toLowerCase().trim(); });
    if(typeof tags === 'string') return tags.split(',').map(function(t){ return String(t || '').toLowerCase().trim(); });
    return [];
  }

  function apIsCustomProduct(product){
    var tags = apProductTagsArray(product && product.tags);
    for(var i = 0; i < tags.length; i++){
      var t = tags[i];
      if(t === 'custom-build' || t.indexOf('custom-build--') === 0 || t.indexOf('pro-shirt') === 0) return true;
    }
    return false;
  }

  function apRefreshProductEmptyStates(mainCount, customCount, builderCount){
    mainCount = mainCount || 0;
    customCount = customCount || 0;
    builderCount = builderCount || 0;
    var storeCount = mainCount + customCount; // products live in the store (one list)
    var apBuilderProductCount = document.getElementById('apBuilderProductCount');
    var apCustomBuildersEmpty = document.getElementById('apCustomBuildersEmpty');
    if(apAllProductCount) apAllProductCount.textContent = String(storeCount);
    if(apBuilderProductCount) apBuilderProductCount.textContent = String(builderCount);
    if(apCustomBuildersSection) apCustomBuildersSection.style.display = builderCount ? 'block' : 'none';
    if(apCustomBuildersEmpty) apCustomBuildersEmpty.style.display = builderCount ? 'none' : 'block';
    if(apProductsEmpty) apProductsEmpty.style.display = storeCount ? 'none' : 'block';
  }

  function apPolishEditorButtons(actionsEl){
    if(!actionsEl) return;
    Array.prototype.slice.call(actionsEl.querySelectorAll('.ap-edit-placement-btn')).forEach(function(btn){
      if(/edit colors/i.test(btn.textContent || '')) btn.remove();
    });
    Array.prototype.slice.call(actionsEl.querySelectorAll('.ap-edit-placement-btn')).forEach(function(btn){
      var noLogo = /no logo/i.test(btn.textContent || '') || btn.classList.contains('ap-edit-placement-btn--disabled');
      btn.innerHTML = noLogo ? '✏️ Edit (add logo)' : '✏️ Edit';
      btn.title = noLogo
        ? 'Add a logo first before editing placement and colors.'
        : 'Click to adjust logo size, logo placement, and product color options.';
      if(!btn.parentNode.classList || !btn.parentNode.classList.contains('ap-product-editor-wrap')){
        var wrap = document.createElement('span');
        wrap.className = 'ap-product-editor-wrap';
        btn.parentNode.insertBefore(wrap, btn);
        wrap.appendChild(btn);
        var tip = document.createElement('span');
        tip.className = 'ap-product-editor-tip';
        tip.textContent = noLogo ? 'Add a logo first, then you can edit placement and colors.' : 'Adjust logo size, placement, and product colors.';
        wrap.appendChild(tip);
      }
    });
  }

  function apRenderProducts(products){
    if(apProductsAllContainer) apProductsAllContainer.innerHTML = '';
    if(apCustomBuildersContainer) apCustomBuildersContainer.innerHTML = '';
    var apMainCount = 0;
    var apCustomCount = 0;
    var apBuilderCount = 0;
    // Collect into two buckets so custom/pro products render first in the
    // single unified list (no visible section split — just ordering).
    var customRows = [];
    var mainRows = [];
    if(!products || products.length === 0){
      apRefreshProductEmptyStates(0, 0);
      return;
    }
    if(apProductsEmpty) apProductsEmpty.style.display = 'none';
    function _isBc3413Tag(t){
      return String(t || '').toLowerCase().trim().indexOf('bc3413_') === 0;
    }
    products.forEach(function(product){
      var isHidden = !!product.hidden;
      var isCustom = apIsCustomProduct(product);
      var row = document.createElement('div');
      row.className = 'ap-product-row';
      row.dataset.productHandle = product.handle || '';
      row.dataset.hidden = isHidden ? 'true' : 'false';

      var imgSrc = product.featured_image || product.image ||
                   (product.images && product.images[0] && (product.images[0].src || product.images[0])) ||
                   null;
      var imgEl;
      if(imgSrc){
        imgEl = document.createElement('img');
        imgEl.className = 'ap-product-thumb';
        imgEl.src = imgSrc;
        imgEl.alt = product.title || '';
        imgEl.loading = 'lazy';
        imgEl.decoding = 'async';
      } else {
        imgEl = document.createElement('div');
        imgEl.className = 'ap-product-thumb-empty';
        imgEl.textContent = '🖼️';
      }

      var titleEl = document.createElement('span');
      titleEl.className = 'ap-product-title';
      titleEl.style.cssText = 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      titleEl.textContent = product.title || product.id || '';

      var toggleBtn = document.createElement('button');
      toggleBtn.className = 'ap-btn--outline-sm';
      toggleBtn.textContent = isHidden ? 'Show' : 'Hide';
      toggleBtn.dataset.hidden = isHidden ? '1' : '0';

      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'ap-btn--danger-sm';
      deleteBtn.textContent = 'Delete';

      var actionsEl = document.createElement('div');
      actionsEl.className = 'ap-product-row__actions';
      actionsEl.appendChild(toggleBtn);
      actionsEl.appendChild(deleteBtn);

      // BC3413 placement editor — show for any product tagged bc3413_*
      var productTags = product.tags || [];
      var _tagListForProCheck = Array.isArray(productTags)
        ? productTags.map(function(t){ return String(t||'').toLowerCase().trim(); })
        : String(productTags||'').split(',').map(function(t){ return t.toLowerCase().trim(); });
      var isProEditorBuild = _tagListForProCheck.some(function(t){
        return t === 'custom-build' || t.indexOf('custom-build--') === 0 || t.indexOf('pro-shirt') === 0 || t === 'pro-editor' || t === 'custom-pro';
      });
      if(!isProEditorBuild){
      var isBc3413 = false;
      if(Array.isArray(productTags)){
        for(var ti = 0; ti < productTags.length; ti++){
          if(_isBc3413Tag(productTags[ti])){ isBc3413 = true; break; }
        }
      } else if(typeof productTags === 'string'){
        isBc3413 = productTags.split(',').some(_isBc3413Tag);
      }

      if(isBc3413 && SSAP.editorSecret){
        var logoSrc = SSAP.shopLogoSrc || '';
        var editorBtn;
        if(logoSrc){
          var editorUrl = SSAP.editorBaseUrl
            + '?logo_url=' + encodeURIComponent(logoSrc)
            + '&logo_kind=titan'
            + '&product_handle=' + encodeURIComponent(product.handle || '')
            + '&shop_handle=' + encodeURIComponent(SSAP.shopHandle || '')
            + '&secret=' + encodeURIComponent(SSAP.editorSecret)
            + '&mode=embedded';
          editorBtn = document.createElement('button');
          editorBtn.type = 'button';
          editorBtn.className = 'ap-edit-placement-btn';
          editorBtn.dataset.productHandle = product.handle || '';
          editorBtn.innerHTML = '✏️ Edit Placement';
          editorBtn.title = 'Adjust logo placement for this product only';
          editorBtn.addEventListener('click', function(){ apOpenEditorModal(editorUrl); });
          var editColorsBtn = document.createElement('button');
          editColorsBtn.type = 'button';
          editColorsBtn.className = 'ap-edit-placement-btn';
          editColorsBtn.innerHTML = '🎨 Edit Colors';
          editColorsBtn.title = 'Edit shirt colors for this product';
          editColorsBtn.addEventListener('click', function(){ apOpenEditorModal(editorUrl + '&tab=colors'); });
          actionsEl.appendChild(editorBtn);
          actionsEl.appendChild(editColorsBtn);
        } else {
          editorBtn = document.createElement('span');
          editorBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          editorBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          editorBtn.textContent = '✏️ Edit Placement (no logo)';
          var editColorsDisabledBtn = document.createElement('span');
          editColorsDisabledBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          editColorsDisabledBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          editColorsDisabledBtn.textContent = '🎨 Edit Colors (no logo)';
          actionsEl.appendChild(editorBtn);
          actionsEl.appendChild(editColorsDisabledBtn);
        }
      }

      // BC3413 Back placement editor — show for any product tagged bc3413_back
      function _isBc3413BackTag(t){
        return String(t || '').toLowerCase().trim() === 'bc3413_back';
      }
      var isBc3413Back = false;
      if(Array.isArray(productTags)){
        for(var bc3413BackTagIdx = 0; bc3413BackTagIdx < productTags.length; bc3413BackTagIdx++){
          if(_isBc3413BackTag(productTags[bc3413BackTagIdx])){ isBc3413Back = true; break; }
        }
      } else if(typeof productTags === 'string'){
        isBc3413Back = productTags.split(',').some(_isBc3413BackTag);
      }

      if(!isProEditorBuild && isBc3413Back && SSAP.editorSecret){
        var bc3413BackLogoSrc = SSAP.shopLogoSrc || '';
        var bc3413BackEditorBtn;
        if(bc3413BackLogoSrc){
          var bc3413BackEditorUrl = SSAP.editorBc3413BackBaseUrl
            + '?logo_url=' + encodeURIComponent(bc3413BackLogoSrc)
            + '&logo_kind=titan'
            + '&product_handle=' + encodeURIComponent(product.handle || '')
            + '&shop_handle=' + encodeURIComponent(SSAP.shopHandle || '')
            + '&secret=' + encodeURIComponent(SSAP.editorSecret)
            + '&mode=embedded';
          bc3413BackEditorBtn = document.createElement('button');
          bc3413BackEditorBtn.type = 'button';
          bc3413BackEditorBtn.className = 'ap-edit-placement-btn';
          bc3413BackEditorBtn.dataset.productHandle = product.handle || '';
          bc3413BackEditorBtn.innerHTML = '✏️ Edit BC3413 Back (beta)';
          bc3413BackEditorBtn.title = 'Adjust back logo placement for this product only';
          bc3413BackEditorBtn.addEventListener('click', function(){ apOpenEditorModal(bc3413BackEditorUrl); });
          var bc3413BackEditColorsBtn = document.createElement('button');
          bc3413BackEditColorsBtn.type = 'button';
          bc3413BackEditColorsBtn.className = 'ap-edit-placement-btn';
          bc3413BackEditColorsBtn.innerHTML = '🎨 Edit Colors (beta)';
          bc3413BackEditColorsBtn.title = 'Edit shirt colors for this product';
          bc3413BackEditColorsBtn.addEventListener('click', function(){ apOpenEditorModal(bc3413BackEditorUrl + '&tab=colors'); });
          actionsEl.appendChild(bc3413BackEditorBtn);
          actionsEl.appendChild(bc3413BackEditColorsBtn);
        } else {
          bc3413BackEditorBtn = document.createElement('span');
          bc3413BackEditorBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          bc3413BackEditorBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          bc3413BackEditorBtn.textContent = '✏️ Edit BC3413 Back (no logo)';
          var bc3413BackEditColorsDisabledBtn = document.createElement('span');
          bc3413BackEditColorsDisabledBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          bc3413BackEditColorsDisabledBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          bc3413BackEditColorsDisabledBtn.textContent = '🎨 Edit Colors (no logo)';
          actionsEl.appendChild(bc3413BackEditorBtn);
          actionsEl.appendChild(bc3413BackEditColorsDisabledBtn);
        }
      }

      // BC3001Y placement editor — show for any product tagged bc3001y_front
      function _isBc3001yTag(t){
        return String(t || '').toLowerCase().trim() === 'bc3001y_front';
      }
      var isBc3001y = false;
      if(Array.isArray(productTags)){
        for(var tagIndex = 0; tagIndex < productTags.length; tagIndex++){
          if(_isBc3001yTag(productTags[tagIndex])){ isBc3001y = true; break; }
        }
      } else if(typeof productTags === 'string'){
        isBc3001y = productTags.split(',').some(_isBc3001yTag);
      }

      if(!isProEditorBuild && isBc3001y && SSAP.editorSecret){
        var bc3001yLogoSrc = SSAP.shopLogoSrc || '';
        var bc3001yEditorBtn;
        if(bc3001yLogoSrc){
          var bc3001yEditorUrl = SSAP.editorBc3001yBaseUrl
            + '?logo_url=' + encodeURIComponent(bc3001yLogoSrc)
            + '&logo_kind=titan'
            + '&product_handle=' + encodeURIComponent(product.handle || '')
            + '&shop_handle=' + encodeURIComponent(SSAP.shopHandle || '')
            + '&secret=' + encodeURIComponent(SSAP.editorSecret)
            + '&mode=embedded';
          bc3001yEditorBtn = document.createElement('button');
          bc3001yEditorBtn.type = 'button';
          bc3001yEditorBtn.className = 'ap-edit-placement-btn';
          bc3001yEditorBtn.dataset.productHandle = product.handle || '';
          bc3001yEditorBtn.innerHTML = '✏️ Edit Placement';
          bc3001yEditorBtn.title = 'Adjust logo placement for this youth tee product only';
          bc3001yEditorBtn.addEventListener('click', function(){ apOpenEditorModal(bc3001yEditorUrl); });
          var bc3001yEditColorsBtn = document.createElement('button');
          bc3001yEditColorsBtn.type = 'button';
          bc3001yEditColorsBtn.className = 'ap-edit-placement-btn';
          bc3001yEditColorsBtn.innerHTML = '🎨 Edit Colors';
          bc3001yEditColorsBtn.title = 'Edit shirt colors for this product';
          bc3001yEditColorsBtn.addEventListener('click', function(){ apOpenEditorModal(bc3001yEditorUrl + '&tab=colors'); });
          actionsEl.appendChild(bc3001yEditorBtn);
          actionsEl.appendChild(bc3001yEditColorsBtn);
        } else {
          bc3001yEditorBtn = document.createElement('span');
          bc3001yEditorBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          bc3001yEditorBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          bc3001yEditorBtn.textContent = '✏️ Edit Placement (no logo)';
          var bc3001yEditColorsDisabledBtn = document.createElement('span');
          bc3001yEditColorsDisabledBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          bc3001yEditColorsDisabledBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          bc3001yEditColorsDisabledBtn.textContent = '🎨 Edit Colors (no logo)';
          actionsEl.appendChild(bc3001yEditorBtn);
          actionsEl.appendChild(bc3001yEditColorsDisabledBtn);
        }
      }

      // NL6733 placement editor — show for any product tagged nl6733_front
      function _isNl6733Tag(t){
        return String(t || '').toLowerCase().trim() === 'nl6733_front';
      }
      var isNl6733 = false;
      if(Array.isArray(productTags)){
        for(var nl6733TagIdx = 0; nl6733TagIdx < productTags.length; nl6733TagIdx++){
          if(_isNl6733Tag(productTags[nl6733TagIdx])){ isNl6733 = true; break; }
        }
      } else if(typeof productTags === 'string'){
        isNl6733 = productTags.split(',').some(_isNl6733Tag);
      }

      if(!isProEditorBuild && isNl6733 && SSAP.editorSecret){
        var nl6733LogoSrc = SSAP.shopLogoSrc || '';
        var nl6733EditorBtn;
        if(nl6733LogoSrc){
          var nl6733EditorUrl = SSAP.editorNl6733BaseUrl
            + '?logo_url=' + encodeURIComponent(nl6733LogoSrc)
            + '&logo_kind=titan'
            + '&product_handle=' + encodeURIComponent(product.handle || '')
            + '&shop_handle=' + encodeURIComponent(SSAP.shopHandle || '')
            + '&secret=' + encodeURIComponent(SSAP.editorSecret)
            + '&mode=embedded';
          nl6733EditorBtn = document.createElement('button');
          nl6733EditorBtn.type = 'button';
          nl6733EditorBtn.className = 'ap-edit-placement-btn';
          nl6733EditorBtn.dataset.productHandle = product.handle || '';
          nl6733EditorBtn.innerHTML = '✏️ Edit Placement';
          nl6733EditorBtn.title = 'Adjust logo placement for this product only';
          nl6733EditorBtn.addEventListener('click', function(){ apOpenEditorModal(nl6733EditorUrl); });
          var nl6733EditColorsBtn = document.createElement('button');
          nl6733EditColorsBtn.type = 'button';
          nl6733EditColorsBtn.className = 'ap-edit-placement-btn';
          nl6733EditColorsBtn.innerHTML = '🎨 Edit Colors';
          nl6733EditColorsBtn.title = 'Edit shirt colors for this product';
          nl6733EditColorsBtn.addEventListener('click', function(){ apOpenEditorModal(nl6733EditorUrl + '&tab=colors'); });
          actionsEl.appendChild(nl6733EditorBtn);
          actionsEl.appendChild(nl6733EditColorsBtn);
        } else {
          nl6733EditorBtn = document.createElement('span');
          nl6733EditorBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          nl6733EditorBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          nl6733EditorBtn.textContent = '✏️ Edit Placement (no logo)';
          var nl6733EditColorsDisabledBtn = document.createElement('span');
          nl6733EditColorsDisabledBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          nl6733EditColorsDisabledBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          nl6733EditColorsDisabledBtn.textContent = '🎨 Edit Colors (no logo)';
          actionsEl.appendChild(nl6733EditorBtn);
          actionsEl.appendChild(nl6733EditColorsDisabledBtn);
        }
      }

      // MC1790 placement editor — show for any product tagged mc1790_front
      function _isMc1790Tag(t){
        return String(t || '').toLowerCase().trim() === 'mc1790_front';
      }
      var isMc1790 = false;
      if(Array.isArray(productTags)){
        for(var mc1790TagIdx = 0; mc1790TagIdx < productTags.length; mc1790TagIdx++){
          if(_isMc1790Tag(productTags[mc1790TagIdx])){ isMc1790 = true; break; }
        }
      } else if(typeof productTags === 'string'){
        isMc1790 = productTags.split(',').some(_isMc1790Tag);
      }

      if(!isProEditorBuild && isMc1790 && SSAP.editorSecret){
        var mc1790LogoSrc = SSAP.shopLogoSrc || '';
        var mc1790EditorBtn;
        if(mc1790LogoSrc){
          var mc1790EditorUrl = SSAP.editorMc1790BaseUrl
            + '?logo_url=' + encodeURIComponent(mc1790LogoSrc)
            + '&logo_kind=titan'
            + '&product_handle=' + encodeURIComponent(product.handle || '')
            + '&shop_handle=' + encodeURIComponent(SSAP.shopHandle || '')
            + '&secret=' + encodeURIComponent(SSAP.editorSecret)
            + '&mode=embedded';
          mc1790EditorBtn = document.createElement('button');
          mc1790EditorBtn.type = 'button';
          mc1790EditorBtn.className = 'ap-edit-placement-btn';
          mc1790EditorBtn.dataset.productHandle = product.handle || '';
          mc1790EditorBtn.innerHTML = '✏️ Edit Placement';
          mc1790EditorBtn.title = 'Adjust logo placement for this product only';
          mc1790EditorBtn.addEventListener('click', function(){ apOpenEditorModal(mc1790EditorUrl); });
          var mc1790EditColorsBtn = document.createElement('button');
          mc1790EditColorsBtn.type = 'button';
          mc1790EditColorsBtn.className = 'ap-edit-placement-btn';
          mc1790EditColorsBtn.innerHTML = '🎨 Edit Colors';
          mc1790EditColorsBtn.title = 'Edit shirt colors for this product';
          mc1790EditColorsBtn.addEventListener('click', function(){ apOpenEditorModal(mc1790EditorUrl + '&tab=colors'); });
          actionsEl.appendChild(mc1790EditorBtn);
          actionsEl.appendChild(mc1790EditColorsBtn);
        } else {
          mc1790EditorBtn = document.createElement('span');
          mc1790EditorBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          mc1790EditorBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          mc1790EditorBtn.textContent = '✏️ Edit Placement (no logo)';
          var mc1790EditColorsDisabledBtn = document.createElement('span');
          mc1790EditColorsDisabledBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          mc1790EditColorsDisabledBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          mc1790EditColorsDisabledBtn.textContent = '🎨 Edit Colors (no logo)';
          actionsEl.appendChild(mc1790EditorBtn);
          actionsEl.appendChild(mc1790EditColorsDisabledBtn);
        }
      }

      // M2580 products:
      // - Existing standard M2580 products with only m2580_front keep the normal placement/color editor button.
      // - New Pro Builder custom M2580 products with custom-build/custom-build--... hide edit buttons for now.
      //
      // Keep all tags. Tags like M2580_front and M2580_front_back are still useful
      // for future bulk pricing, filtering, reporting, and operations. This logic
      // only controls whether this admin page renders an edit button.
      function _m2580TagList(){
        if(Array.isArray(productTags)){
          return productTags.map(function(t){ return String(t || '').toLowerCase().trim(); });
        }
        if(typeof productTags === 'string'){
          return productTags.split(',').map(function(t){ return String(t || '').toLowerCase().trim(); });
        }
        return [];
      }

      var m2580Tags = _m2580TagList();
      var isM2580 = m2580Tags.some(function(tag){
        return (
          tag === 'm2580_front' ||
          tag === 'm2580_front_back' ||
          tag === 'model--m2580' ||
          tag === 'pro-builder-m2580' ||
          tag === 'pro-shirt-m2580'
        );
      });
      var isM2580CustomBuild = isM2580 && m2580Tags.some(function(tag){
        return tag === 'custom-build' || tag.indexOf('custom-build--') === 0;
      });

      if(isM2580CustomBuild){
        // Intentionally append nothing for new M2580 Pro Builder custom products.
        // Existing-product rebuild/edit will be added later as a separate real workflow.
      } else if(!isProEditorBuild && isM2580 && SSAP.editorSecret){
        var m2580LogoSrc = SSAP.shopLogoSrc || '';
        var m2580EditorBtn;
        if(m2580LogoSrc){
          var m2580EditorUrl = SSAP.editorM2580BaseUrl
            + '?logo_url=' + encodeURIComponent(m2580LogoSrc)
            + '&logo_kind=titan'
            + '&product_handle=' + encodeURIComponent(product.handle || '')
            + '&shop_handle=' + encodeURIComponent(SSAP.shopHandle || '')
            + '&secret=' + encodeURIComponent(SSAP.editorSecret)
            + '&mode=embedded';
          m2580EditorBtn = document.createElement('button');
          m2580EditorBtn.type = 'button';
          m2580EditorBtn.className = 'ap-edit-placement-btn';
          m2580EditorBtn.dataset.productHandle = product.handle || '';
          m2580EditorBtn.innerHTML = '✏️ Edit Placement';
          m2580EditorBtn.title = 'Adjust logo placement for this product only';
          m2580EditorBtn.addEventListener('click', function(){ apOpenEditorModal(m2580EditorUrl); });
          var m2580EditColorsBtn = document.createElement('button');
          m2580EditColorsBtn.type = 'button';
          m2580EditColorsBtn.className = 'ap-edit-placement-btn';
          m2580EditColorsBtn.innerHTML = '🎨 Edit Colors';
          m2580EditColorsBtn.title = 'Edit shirt colors for this product';
          m2580EditColorsBtn.addEventListener('click', function(){ apOpenEditorModal(m2580EditorUrl + '&tab=colors'); });
          actionsEl.appendChild(m2580EditorBtn);
          actionsEl.appendChild(m2580EditColorsBtn);
        } else {
          m2580EditorBtn = document.createElement('span');
          m2580EditorBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          m2580EditorBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          m2580EditorBtn.textContent = '✏️ Edit Placement (no logo)';
          var m2580EditColorsDisabledBtn = document.createElement('span');
          m2580EditColorsDisabledBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          m2580EditColorsDisabledBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          m2580EditColorsDisabledBtn.textContent = '🎨 Edit Colors (no logo)';
          actionsEl.appendChild(m2580EditorBtn);
          actionsEl.appendChild(m2580EditColorsDisabledBtn);
        }
      }

      // CC1467Y placement editor — show for any product tagged cc1467y_front
      function _isCc1467yTag(t){
        return String(t || '').toLowerCase().trim() === 'cc1467y_front';
      }
      var isCc1467y = false;
      if(Array.isArray(productTags)){
        for(var cc1467yTagIdx = 0; cc1467yTagIdx < productTags.length; cc1467yTagIdx++){
          if(_isCc1467yTag(productTags[cc1467yTagIdx])){ isCc1467y = true; break; }
        }
      } else if(typeof productTags === 'string'){
        isCc1467y = productTags.split(',').some(_isCc1467yTag);
      }

      if(!isProEditorBuild && isCc1467y && SSAP.editorSecret){
        var cc1467yLogoSrc = SSAP.shopLogoSrc || '';
        var cc1467yEditorBtn;
        if(cc1467yLogoSrc){
          var cc1467yEditorUrl = SSAP.editorCc1467yBaseUrl
            + '?logo_url=' + encodeURIComponent(cc1467yLogoSrc)
            + '&logo_kind=titan'
            + '&product_handle=' + encodeURIComponent(product.handle || '')
            + '&shop_handle=' + encodeURIComponent(SSAP.shopHandle || '')
            + '&secret=' + encodeURIComponent(SSAP.editorSecret)
            + '&mode=embedded';
          cc1467yEditorBtn = document.createElement('button');
          cc1467yEditorBtn.type = 'button';
          cc1467yEditorBtn.className = 'ap-edit-placement-btn';
          cc1467yEditorBtn.dataset.productHandle = product.handle || '';
          cc1467yEditorBtn.innerHTML = '✏️ Edit Placement';
          cc1467yEditorBtn.title = 'Adjust logo placement for this product only';
          cc1467yEditorBtn.addEventListener('click', function(){ apOpenEditorModal(cc1467yEditorUrl); });
          var cc1467yEditColorsBtn = document.createElement('button');
          cc1467yEditColorsBtn.type = 'button';
          cc1467yEditColorsBtn.className = 'ap-edit-placement-btn';
          cc1467yEditColorsBtn.innerHTML = '🎨 Edit Colors';
          cc1467yEditColorsBtn.title = 'Edit shirt colors for this product';
          cc1467yEditColorsBtn.addEventListener('click', function(){ apOpenEditorModal(cc1467yEditorUrl + '&tab=colors'); });
          actionsEl.appendChild(cc1467yEditorBtn);
          actionsEl.appendChild(cc1467yEditColorsBtn);
        } else {
          cc1467yEditorBtn = document.createElement('span');
          cc1467yEditorBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          cc1467yEditorBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          cc1467yEditorBtn.textContent = '✏️ Edit Placement (no logo)';
          var cc1467yEditColorsDisabledBtn = document.createElement('span');
          cc1467yEditColorsDisabledBtn.className = 'ap-edit-placement-btn ap-edit-placement-btn--disabled';
          cc1467yEditColorsDisabledBtn.title = 'No logo on custom_shop metaobject — add a logo image first';
          cc1467yEditColorsDisabledBtn.textContent = '🎨 Edit Colors (no logo)';
          actionsEl.appendChild(cc1467yEditorBtn);
          actionsEl.appendChild(cc1467yEditColorsDisabledBtn);
        }
      }
      apPolishEditorButtons(actionsEl);
      } // end if(!isProEditorBuild)

      // Pro Builder re-edit button — shown only for pro-built products.
      // The pro-builder routes live on the Printful Automation app, not the
      // uploader app (SSAP.railwayUrl), so derive that origin from an existing
      // editor base URL (e.g. https://printfulautomation-production.up.railway.app/editor/bc3413).
      var _proBuilderOrigin = '';
      try { _proBuilderOrigin = new URL(SSAP.editorBaseUrl || SSAP.editorProShirtBc3413BaseUrl || '').origin; } catch(_e){ _proBuilderOrigin = ''; }
      if(isProEditorBuild && SSAP.editorSecret && _proBuilderOrigin){
        var _proTags = _tagListForProCheck;
        var _isCc1717Pro  = _proTags.some(function(t){ return t === 'pro-shirt-cc1717'  || t === 'pro-builder-cc1717'; });
        var _isM2580Pro   = _proTags.some(function(t){ return t === 'pro-shirt-m2580'   || t === 'pro-builder-m2580'; });
        var _isLs14003Pro = _proTags.some(function(t){ return t === 'pro-shirt-ls14003' || t === 'pro-builder-ls14003'; });
        var _proEditPath  = null;
        if(_isCc1717Pro)       _proEditPath = '/editor/pro-shirt/cc1717/edit';
        else if(_isM2580Pro)   _proEditPath = '/editor/pro-shirt/m2580/edit';
        else if(_isLs14003Pro) _proEditPath = '/editor/pro-shirt/ls14003/edit';
        if(_proEditPath){
          var _returnUrl = (window.location.origin + window.location.pathname + window.location.search);
          var _proEditUrl = _proBuilderOrigin + _proEditPath
            + '?product_handle=' + encodeURIComponent(product.handle || '')
            + '&shop_handle=' + encodeURIComponent(SSAP.shopHandle || '')
            + '&secret=' + encodeURIComponent(SSAP.editorSecret)
            + '&return_url=' + encodeURIComponent(_returnUrl)
            + '&mode=embedded';
          var _proEditBtn = document.createElement('button');
          _proEditBtn.type = 'button';
          _proEditBtn.className = 'ap-edit-placement-btn';
          _proEditBtn.innerHTML = '✏️ Edit';
          _proEditBtn.title = 'Re-open this product in the Pro Builder to adjust image, placement, or colors';
          _proEditBtn.addEventListener('click', (function(url){ return function(){ apOpenEditorModal(url); }; })(_proEditUrl));
          actionsEl.appendChild(_proEditBtn);
        }
      }

      // Subtle "Custom" badge on pro-built products so they're distinguishable
      // without needing a separate section header.
      if(isCustom){
        var badgeEl = document.createElement('span');
        badgeEl.className = 'ap-product-badge';
        badgeEl.textContent = 'Custom';
        row.appendChild(badgeEl);
      }

      row.appendChild(imgEl);
      row.appendChild(titleEl);
      row.appendChild(actionsEl);

      toggleBtn.addEventListener('click', function(){
        var curHidden = toggleBtn.dataset.hidden === '1';
        apToggleProductVisibility(product.id, curHidden, toggleBtn);
      });
      deleteBtn.addEventListener('click', function(){
        apDeleteProduct(product.id, product.title || product.id, row);
      });

      if(isCustom){
        apCustomCount++;
        customRows.push(row);
      } else {
        apMainCount++;
        mainRows.push(row);
      }
    }); // end products.forEach

    // Render custom/pro products first, then standard — one unified grid.
    if(apProductsAllContainer){
      customRows.forEach(function(r){ apProductsAllContainer.appendChild(r); });
      mainRows.forEach(function(r){ apProductsAllContainer.appendChild(r); });
    }

    // ── Add Products catalog cards ──────────────────────────────────────────
    // The pro-builder catalog cards are rendered by the standalone asset
    // assets/ss-admin-pro-builder-cards.js (catalog grid + product detail
    // modal). That asset owns #apCustomBuildersContainer, sets the
    // #apBuilderProductCount badge, and shows #apCustomBuildersSection.
    // We report a non-zero builder count here so apRefreshProductEmptyStates
    // keeps that section visible; the asset overwrites the exact count text
    // when it renders.
    apBuilderCount = 8;

    apRefreshProductEmptyStates(apMainCount, apCustomCount, apBuilderCount);
  }    // end apRenderProducts

  function apEscape(str){
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function apLoadProducts(options){
    options = options || {};
    var silent = !!options.silent;
    if(apProductsSpinner && !silent) apProductsSpinner.style.display = 'block';
    if(apProductsEmpty && !silent) apProductsEmpty.style.display = 'none';
    if(!silent){
      if(apProductsAllContainer) apProductsAllContainer.innerHTML = '';
      if(apCustomBuildersContainer) apCustomBuildersContainer.innerHTML = '';
      apProductsStatus('', '');
    }
    try {
      var res = await fetch(
        AP_PROXY_URL + '/relay/store/' + encodeURIComponent(SSAP.shopHandle || '') + '/products?ts=' + Date.now(),
        { cache: 'no-store' }
      );
      if(!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();
      var products = Array.isArray(data) ? data : (data.products || []);
      apRenderProducts(products);
    } catch(e){
      if(!silent) apProductsStatus('❌ Could not load products: ' + (e.message || 'unknown error'), 'err');
    } finally {
      if(apProductsSpinner && !silent) apProductsSpinner.style.display = 'none';
    }
  }

  async function apToggleProductVisibility(productId, currentHidden, btn){
    btn.disabled = true;
    apProductsStatus('Updating…', '');
    try {
      var res = await fetch(
        AP_PROXY_URL + '/relay/store/' + encodeURIComponent(SSAP.shopHandle || '') + '/products/' + encodeURIComponent(productId) + '/hide',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ hidden: !currentHidden })
        }
      );
      if(!res.ok) throw new Error('HTTP ' + res.status);
      var newHidden = !currentHidden;
      btn.textContent = newHidden ? 'Show' : 'Hide';
      btn.dataset.hidden = newHidden ? '1' : '0';
      var rowEl = btn.closest('.ap-product-row');
      if (rowEl) rowEl.dataset.hidden = newHidden ? 'true' : 'false';
      apProductsStatus('✅ Visibility updated.', 'ok');
    } catch(e){
      apProductsStatus('❌ Could not update visibility: ' + (e.message || 'unknown error'), 'err');
    } finally {
      btn.disabled = false;
    }
  }

  async function apDeleteProduct(productId, productTitle, row){
    if(!confirm('Delete ' + productTitle + '? This cannot be undone.')) return;
    apProductsStatus('Deleting…', '');
    try {
      var res = await fetch(
        AP_PROXY_URL + '/relay/store/' + encodeURIComponent(SSAP.shopHandle || '') + '/products/' + encodeURIComponent(productId),
        {
          method: 'DELETE'
        }
      );
      if(!res.ok) throw new Error('HTTP ' + res.status);
      row.remove();
      apProductsStatus('✅ Product deleted.', 'ok');
      var storeCountAfterDelete = apProductsAllContainer ? apProductsAllContainer.children.length : 0;
      var builderCountAfterDelete = apCustomBuildersContainer ? apCustomBuildersContainer.children.length : 0;
      apRefreshProductEmptyStates(storeCountAfterDelete, 0, builderCountAfterDelete);
    } catch(e){
      apProductsStatus('❌ Could not delete product: ' + (e.message || 'unknown error'), 'err');
    }
  }

  // Products is the default tab in V13, so load immediately.
  apProductsLoaded = true;
  apLoadProducts();

  // Quiet background refresh so newly built/rebuilt products show up without a manual browser refresh.
  setInterval(function(){
    if(document.hidden) return;
    var productsPanel = document.getElementById('apPanelProducts');
    if(productsPanel && productsPanel.classList.contains('active')){
      apLoadProducts({ silent: true });
    }
  }, 60000);

})();

// ── SETTINGS TAB ─────────────────────────────────────────────
(function(){
  var apSettingsNewSessionId = null;
  var apSettingsLogoChanged  = false;
  var apSettingsNameOriginal = SSAP.storeName;

  // Expose logo-done handler so the shared postMessage listener can call it
  window.apSettingsHandleLogoDone = function(data) {
    apSettingsNewSessionId = data.session_id;
    apSettingsLogoChanged  = true;
    // Close the editor overlay
    if (typeof window.apCloseEditorModal === 'function') window.apCloseEditorModal();
    // Show new logo preview
    var previewImg = document.createElement('img');
    previewImg.src = SSAP.railwayUrl + '/final-file/' + data.session_id + '?t=' + Date.now();
    previewImg.alt = 'New logo preview';
    previewImg.className = 'ap-settings-logo-new';
    var previewDiv = document.getElementById('apSettingsLogoPreview');
    if (previewDiv) {
      previewDiv.innerHTML = '';
      previewDiv.appendChild(previewImg);
    }
    var statusEl = document.getElementById('apSettingsLogoStatus');
    if (statusEl) statusEl.textContent = '✅ New logo selected — save to apply.';
    apSettingsUpdateRebuildWarning();
  };

  function apSettingsUpdateRebuildWarning() {
    var warningEl = document.getElementById('apSettingsRebuildWarning');
    if (warningEl) warningEl.style.display = apSettingsLogoChanged ? 'block' : 'none';
  }

  // Change Logo button — open studio-uploader in existing editor modal
  var apBtnChangeLogo = document.getElementById('apBtnChangeLogo');
  if (apBtnChangeLogo) {
    apBtnChangeLogo.addEventListener('click', function() {
      var titleEl = document.getElementById('apEditorTitle');
      if (titleEl) titleEl.textContent = '🖼️ Replace Store Logo';
      if (typeof window.apOpenEditorModal === 'function') {
        window.apOpenEditorModal(SSAP.railwayUrl + '/ui?slot=settings-logo&return=postmessage&embed=1');
      }
    });
  }

  // Save & Apply Settings button
  var apBtnSaveSettings = document.getElementById('apBtnSaveSettings');
  if (apBtnSaveSettings) {
    apBtnSaveSettings.addEventListener('click', async function() {
      var btn = this;
      var statusEl = document.getElementById('apStatusSettings');
      var storeName = document.getElementById('apSettingsName').value.trim();
      var nameChanged = (storeName !== apSettingsNameOriginal);
      var needsRebuild = apSettingsLogoChanged;

      if (!nameChanged && !apSettingsLogoChanged) {
        statusEl.className = 'ap-status err';
        statusEl.textContent = 'No changes to save.';
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Saving…';
      statusEl.className = 'ap-status';
      statusEl.textContent = '';

      try {
        var fd = new FormData();
        if (nameChanged) fd.append('store_name', storeName);
        if (apSettingsNewSessionId) fd.append('main_session_id', apSettingsNewSessionId);

        var r = await fetch(
          '/apps/ss/relay/store/' + encodeURIComponent(SSAP.shopHandle) + '/update-settings',
          {
            method: 'POST',
            body: fd,
            cache: 'no-store'
          }
        );
        var j = await r.json().catch(function(){ return {}; });
        if (!r.ok) throw new Error(j.error || 'Update failed');

        if (needsRebuild) {
          // Show the rebuild modal
          var overlay = document.getElementById('apRebuildOverlay');
          overlay.classList.add('open');
          overlay.setAttribute('aria-hidden', 'false');
          // After 5 seconds, redirect to dashboard
          setTimeout(function() {
            window.location.href = '/pages/portal';
          }, 5000);
        } else {
          // Name-only change — no rebuild
          statusEl.className = 'ap-status ok';
          statusEl.textContent = '✅ Store name updated!';
          apSettingsNameOriginal = storeName;
          btn.textContent = 'Save & Apply Settings';
          btn.disabled = false;
        }
      } catch(e) {
        statusEl.className = 'ap-status err';
        statusEl.textContent = '❌ ' + (e.message || 'Save failed');
        btn.textContent = 'Save & Apply Settings';
        btn.disabled = false;
      }
    });
  }
})();
