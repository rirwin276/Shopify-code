(function() {
  'use strict';

  // Fundraising state persists through the secure App Proxy relay — no admin
  // secret is ever exposed to the browser (the relay injects it server-side,
  // matching every other admin action on this page).
  var AP_PROXY_URL = '/apps/ss';
  var _SS_HANDLE   = encodeURIComponent((window.SSAP && SSAP.shopHandle) || '');
  var FR_ENDPOINT  = AP_PROXY_URL + '/relay/store/' + _SS_HANDLE + '/fundraising';
  var FR_STRIPE_CONNECT = FR_ENDPOINT + '/stripe/connect';
  var FR_STRIPE_STATUS  = FR_ENDPOINT + '/stripe/status';

  // ── State ─────────────────────────────────────────────────
  var _state = {
    step: 1,
    maxStep: 1,            // furthest step the user has reached (for resume)
    termsAgreed: false,
    stripeConnected: false,
    stripeAccountId: '',
    cause: '',
    amount: 4,
    goal: 0,
    endDate: '',
    visibility: 'public',
    enabled: false,
    totalRaised: 0,
  };

  // ── Draft persistence (resume where you left off) ──────────
  // In-progress setup is saved to localStorage so an admin can close the wizard
  // and pick up exactly where they left off. A live fundraiser from the server
  // always supersedes the draft.
  var DRAFT_KEY = 'ss_fr_draft_' + ((window.SSAP && SSAP.shopHandle) || '');
  function saveDraft() {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({
        step: _state.step,
        maxStep: _state.maxStep,
        termsAgreed: _state.termsAgreed,
        stripeConnected: _state.stripeConnected,
        stripeAccountId: _state.stripeAccountId,
        cause: _state.cause,
        amount: _state.amount,
        goal: _state.goal,
        endDate: _state.endDate,
        visibility: _state.visibility,
        _savedAt: Date.now()
      }));
    } catch (e) { /* storage disabled — non-fatal */ }
  }
  function loadDraft() {
    try {
      var raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }
  function clearDraft() {
    try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
  }
  // Advance to a step, remembering the furthest point reached.
  function goToStep(n) {
    if (n < 1 || n > 5) return;
    _state.step = n;
    if (n > _state.maxStep) _state.maxStep = n;
    renderStep();
  }

  // ── DOM refs ───────────────────────────────────────────────
  var overlay      = document.getElementById('apFrwOverlay');
  var launchBtn    = document.getElementById('apFrLaunchBtn');
  var closeBtn     = document.getElementById('apFrwClose');
  var settingsRow  = document.getElementById('apFrSettingsRow');
  var editFromSettings = document.getElementById('apFrEditFromSettings');
  // Zone
  var frZoneEmpty  = document.getElementById('apFrZoneEmpty');
  var frZoneActive = document.getElementById('apFrZoneActive');
  var frDetailsBtn = document.getElementById('apFrDetailsBtn');
  // Details modal
  var frdOverlay   = document.getElementById('apFrdOverlay');
  var frdClose     = document.getElementById('apFrdClose');
  var frdEditBtn   = document.getElementById('apFrdEditBtn');
  var frdStopBtn   = document.getElementById('apFrdStopBtn');

  // Steps
  var steps = [null,
    document.getElementById('apFrwStep1'),
    document.getElementById('apFrwStep2'),
    document.getElementById('apFrwStep3'),
    document.getElementById('apFrwStep4'),
    document.getElementById('apFrwStep5'),
  ];
  // Pills
  var pills = [null,
    document.getElementById('apFrwPill1'),
    document.getElementById('apFrwPill2'),
    document.getElementById('apFrwPill3'),
    document.getElementById('apFrwPill4'),
    document.getElementById('apFrwPill5'),
  ];

  var stepTitles = [null,
    'Fundraising for your team store',
    'How the money gets there',
    'Connect the cause',
    'Set up your fundraiser',
    'Choose what customers see',
  ];
  var stepSubs = [null,
    'The most seamless way to raise money — set up in under 5 minutes.',
    'Stripe handles every transfer automatically — here\'s what the recipient needs.',
    'Link the cause\'s bank via Stripe Express — takes about 5 minutes.',
    'Name your cause, set your per-item amount, goal, and end date.',
    'Transparency drives sales. Choose how much to show publicly.',
  ];
  var stepLabels = [null,'Step 1 of 5','Step 2 of 5','Step 3 of 5','Step 4 of 5','Step 5 of 5'];

  // ── Open / close ───────────────────────────────────────────
  function openWizard(startAtStep) {
    _state.step = startAtStep || 1;
    renderStep();
    overlay.classList.add('open');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeWizard() {
    overlay.classList.remove('open');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeWizard);
  if (overlay)  overlay.addEventListener('click', function(e){ if(e.target===overlay) closeWizard(); });
  // Resume at the furthest step previously reached (or step 1 for a fresh start).
  if (launchBtn) launchBtn.addEventListener('click', function(){ openWizard(_state.maxStep || 1); });
  if (editFromSettings) editFromSettings.addEventListener('click', function(){ openWizard(4); });

  function openDetails() {
    if (!frdOverlay) return;
    frdOverlay.classList.add('open');
    frdOverlay.setAttribute('aria-hidden','false');
    document.body.style.overflow = 'hidden';
  }
  function closeDetails() {
    if (!frdOverlay) return;
    frdOverlay.classList.remove('open');
    frdOverlay.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
  }
  if (frDetailsBtn) frDetailsBtn.addEventListener('click', openDetails);
  if (frdClose)     frdClose.addEventListener('click', closeDetails);
  if (frdOverlay)   frdOverlay.addEventListener('click', function(e){ if(e.target===frdOverlay) closeDetails(); });
  if (frdEditBtn)   frdEditBtn.addEventListener('click', function(){ closeDetails(); openWizard(4); });
  if (frdStopBtn) {
    frdStopBtn.addEventListener('click', async function(){
      if (!confirm('End this fundraiser? Products will be repriced back to their base prices. Any unpaid balance stays owed and is still payable.')) return;
      frdStopBtn.disabled = true; frdStopBtn.textContent = 'Stopping…';
      try {
        var res = await fetch(FR_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enabled:false, amount:0, cause_name:'', show_bar:false, goal:0, end_date:'' }),
          cache: 'no-store'
        });
        var j = await res.json().catch(function(){ return {}; });
        if (!res.ok || !j || j.ok === false) {
          throw new Error((j && j.error) || ('Stop failed with HTTP ' + res.status));
        }
        clearDraft();
        _state.enabled = false;
        _state.maxStep = 1;
        _state.step = 1;
        _state.stripeConnected = false;
        _state.totalRaised = 0;
        closeDetails();
        _renderActiveState(j);
        _startPricingPoll('stop');
      } catch (e) {
        alert('Fundraiser was not stopped. ' + (e.message || 'Please try again.'));
      } finally { frdStopBtn.disabled=false; frdStopBtn.textContent='Stop'; }
    });
  }

  // ── Render step ────────────────────────────────────────────
  function renderStep() {
    var s = _state.step;
    // Show/hide step panels via class (inline display can't beat !important CSS)
    for (var i=1; i<=5; i++) {
      if (!steps[i]) continue;
      steps[i].style.display = '';                 // clear any leftover inline display
      steps[i].classList.toggle('ap-frw-active', i === s);
    }
    // Pills
    for (var j=1; j<=5; j++) {
      if (!pills[j]) continue;
      pills[j].className = 'ap-frw-pill' + (j<s ? ' done' : j===s ? ' active' : '');
    }
    // Hero text
    var titleEl = document.getElementById('apFrwTitle');
    var subEl   = document.getElementById('apFrwSubtitle');
    var lblEl   = document.getElementById('apFrwStepLabel');
    if (titleEl) titleEl.textContent = stepTitles[s];
    if (subEl)   subEl.textContent   = stepSubs[s];
    if (lblEl)   lblEl.textContent   = stepLabels[s];
    // Scroll the body back to top whenever the step changes
    var activeBody = steps[s] ? steps[s].querySelector('.ap-frw-body') : null;
    if (activeBody) activeBody.scrollTop = 0;
    saveDraft();
  }

  // ── Step 1 nav ─────────────────────────────────────────────
  var step1Next = document.getElementById('apFrwStep1Next');
  var termsCheck = document.getElementById('apFrwTermsCheck');
  if (step1Next) {
    step1Next.addEventListener('click', function(){
      if (!termsCheck || !termsCheck.checked) {
        var label = document.querySelector('label[for="apFrwTermsCheck"]');
        if (label) { label.style.outline = '2px solid #f59e0b'; setTimeout(function(){ label.style.outline = ''; }, 1800); }
        if (termsCheck) termsCheck.focus();
        return;
      }
      _state.termsAgreed = true;
      goToStep(2);
    });
  }
  if (termsCheck) {
    termsCheck.addEventListener('change', function(){ _state.termsAgreed = this.checked; saveDraft(); });
  }

  // ── Step 2 nav (About Stripe) ──────────────────────────────
  var step2Back = document.getElementById('apFrwStep2Back');
  var step2Next = document.getElementById('apFrwStep2Next');
  if (step2Back) step2Back.addEventListener('click', function(){ goToStep(1); });
  if (step2Next) step2Next.addEventListener('click', function(){ goToStep(3); });

  // ── Step 3 nav (Stripe Connect) ────────────────────────────
  var step3Back = document.getElementById('apFrwStep3Back');
  var step3Next = document.getElementById('apFrwStep3Next');
  var stripeConnectBtn = document.getElementById('apFrwStripeConnectBtn');
  var stripeConnectedEl = document.getElementById('apFrwStripeConnected');
  var stripeStatusEl    = document.getElementById('apFrwStripeStatus');
  var stripeAcctEl      = document.getElementById('apFrwStripeAcctId');

  if (step3Back) step3Back.addEventListener('click', function(){ goToStep(2); });
  if (step3Next) step3Next.addEventListener('click', function(){
    // Allow skipping Stripe connect for now (will be required before live)
    goToStep(4);
    // Set max date to 1 year and default to 90 days out
    var dateEl = document.getElementById('apFrwEndDate');
    if (dateEl && !dateEl.value) {
      var d = new Date(); d.setFullYear(d.getFullYear()+1);
      dateEl.max = d.toISOString().split('T')[0];
      dateEl.value = new Date(Date.now() + 90*864e5).toISOString().split('T')[0];
    }
  });
  // Reflect a connected Stripe account in the UI (used on connect + on resume).
  function _showStripeConnected() {
    if (stripeStatusEl)    stripeStatusEl.style.display = 'none';
    if (stripeConnectedEl) stripeConnectedEl.style.display = '';
    if (stripeAcctEl)      stripeAcctEl.textContent = _state.stripeAccountId || 'connected';
  }
  if (stripeConnectBtn) {
    stripeConnectBtn.addEventListener('click', async function(){
      stripeConnectBtn.disabled = true;
      var orig = stripeConnectBtn.textContent;
      stripeConnectBtn.textContent = 'Opening Stripe…';
      try {
        // Save the draft so we resume on this step after the Stripe round-trip.
        _state.maxStep = Math.max(_state.maxStep || 1, 3);
        saveDraft();
        // Preserve the existing Admin Powers query string, especially ?shop=<handle>,
        // then add the Stripe return marker. Dropping ?shop breaks store-specific
        // admin access after Stripe redirects back.
        var returnUrlObj = new URL(window.location.href);
        returnUrlObj.searchParams.set('fr_stripe', 'return');
        var returnUrl = returnUrlObj.toString();
        var res = await fetch(FR_STRIPE_CONNECT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ return_url: returnUrl, refresh_url: returnUrl }),
          cache: 'no-store'
        });
        var j = await res.json().catch(function(){ return {}; });
        if (j && j.ok && j.url) {
          if (j.account_id) { _state.stripeAccountId = j.account_id; saveDraft(); }
          window.location.href = j.url;   // Stripe-hosted onboarding
          return;
        }
        alert('Could not start Stripe setup. ' + ((j && j.error) || 'Please try again.'));
      } catch (e) {
        alert('Could not reach Stripe setup. Please check your connection and try again.');
      } finally {
        stripeConnectBtn.disabled = false;
        stripeConnectBtn.textContent = orig;
      }
    });
  }

  // After returning from Stripe-hosted onboarding, confirm the account status.
  async function _checkStripeReturn() {
    if (window.location.search.indexOf('fr_stripe=return') === -1) return;
    // Clean the marker param first regardless of outcome.
    try {
      var cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete('fr_stripe');
      window.history.replaceState({}, '', cleanUrl.pathname + cleanUrl.search + cleanUrl.hash);
    } catch (e) {}
    try {
      var res = await fetch(FR_STRIPE_STATUS, { cache: 'no-store' });
      var j = await res.json().catch(function(){ return {}; });
      if (j && j.connected) {
        _state.stripeConnected = true;
        if (j.account_id) _state.stripeAccountId = j.account_id;
        _showStripeConnected();
        saveDraft();
      }
      // Reopen wizard to show the Stripe result. Step 4 if connected, else 3.
      openWizard(_state.stripeConnected ? 4 : 3);
    } catch (e) {
      // Status check failed (network/server error). Open Step 3 so the admin
      // can see the connect button and retry rather than seeing a blank page.
      openWizard(3);
    }
  }

  // ── Step 4 fields + nav ────────────────────────────────────
  var step4Back   = document.getElementById('apFrwStep4Back');
  var step4Next   = document.getElementById('apFrwStep4Next');
  var amountEl    = document.getElementById('apFrwAmount');
  var amtA        = document.getElementById('apFrwAmtA');
  var amtB        = document.getElementById('apFrwAmtB');
  var amtDisplay  = document.getElementById('apFrwAmtDisplay');
  var amtDownBtn  = document.getElementById('apFrwAmtDown');
  var amtUpBtn    = document.getElementById('apFrwAmtUp');

  function updateCalc() {
    var v = parseInt(amountEl ? amountEl.value : '4') || 0;
    v = Math.max(1, Math.min(8, v));
    _state.amount = v;
    if (amountEl)   amountEl.value      = v;
    if (amtA)       amtA.textContent    = v;
    if (amtB)       amtB.textContent    = v + 1;
    if (amtDisplay) amtDisplay.textContent = v;
    saveDraft();
  }
  if (amtDownBtn) amtDownBtn.addEventListener('click', function(){
    if (amountEl) amountEl.value = Math.max(1, (parseInt(amountEl.value) || 4) - 1);
    updateCalc();
  });
  if (amtUpBtn) amtUpBtn.addEventListener('click', function(){
    if (amountEl) amountEl.value = Math.min(8, (parseInt(amountEl.value) || 4) + 1);
    updateCalc();
  });
  if (step4Back) step4Back.addEventListener('click', function(){ goToStep(3); });
  // Keep draft in sync as the admin types so nothing is lost on close.
  ['apFrwCause','apFrwGoal','apFrwEndDate'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.addEventListener('input', function(){
      var causeEl = document.getElementById('apFrwCause');
      var goalEl  = document.getElementById('apFrwGoal');
      var dateEl  = document.getElementById('apFrwEndDate');
      _state.cause   = causeEl ? causeEl.value.trim() : _state.cause;
      _state.goal    = parseInt(goalEl ? goalEl.value : '0') || 0;
      _state.endDate = dateEl ? dateEl.value : '';
      saveDraft();
    });
  });
  if (step4Next) step4Next.addEventListener('click', function(){
    var causeEl = document.getElementById('apFrwCause');
    var goalEl  = document.getElementById('apFrwGoal');
    var dateEl  = document.getElementById('apFrwEndDate');
    var cause = (causeEl ? causeEl.value : '').trim();
    if (!cause) {
      if (causeEl) { causeEl.focus(); causeEl.style.borderColor='#f59e0b'; setTimeout(function(){ causeEl.style.borderColor=''; },1800); }
      return;
    }
    _state.cause   = cause;
    _state.goal    = parseInt(goalEl ? goalEl.value : '0') || 0;
    _state.endDate = dateEl ? dateEl.value : '';
    updateCalc();
    goToStep(5);
  });

  // ── Step 5 visibility toggles + launch ────────────────────
  var step5Back    = document.getElementById('apFrwStep5Back');
  var step5Launch  = document.getElementById('apFrwStep5Launch');

  document.querySelectorAll('.ap-frw-toggle-row[data-val]').forEach(function(row){
    row.addEventListener('click', function(){
      document.querySelectorAll('.ap-frw-toggle-row[data-val]').forEach(function(r){
        r.classList.remove('selected');
        var rb = r.querySelector('input[type=radio]');
        if (rb) rb.checked = false;
      });
      this.classList.add('selected');
      var rb = this.querySelector('input[type=radio]');
      if (rb) { rb.checked = true; _state.visibility = rb.value; saveDraft(); }
    });
  });

  if (step5Back) step5Back.addEventListener('click', function(){ goToStep(4); });
  if (step5Launch) {
    step5Launch.addEventListener('click', async function(){
      step5Launch.disabled = true;
      step5Launch.textContent = 'Launching…';
      try {
        if (!_state.stripeConnected || !_state.stripeAccountId) {
          alert('Connect Stripe before launching this fundraiser. This prevents money from being collected without a payout account.');
          goToStep(3);
          return;
        }
        var payload = {
          enabled: true,
          amount: _state.amount,
          cause_name: _state.cause,
          show_bar: _state.visibility === 'public',
          goal: _state.goal,
          end_date: _state.endDate,
          stripe_account_id: _state.stripeAccountId,
          stripe_connected: _state.stripeConnected,
          setup_step: 5,
        };
        var res = await fetch(FR_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          cache: 'no-store'
        });
        var j = await res.json().catch(function(){ return {}; });
        if (!res.ok || !j || j.ok === false) {
          throw new Error((j && j.error) || ('Launch failed with HTTP ' + res.status));
        }
        _state.enabled = true;
        clearDraft();   // setup complete — no half-finished draft to resume
        closeWizard();
        _renderActiveState(j);
        _startPricingPoll('launch');
      } catch (e) {
        alert('Fundraiser was not launched. ' + (e.message || 'Please try again.'));
        return;
      } finally {
        step5Launch.disabled = false;
        step5Launch.textContent = 'Launch Fundraiser';
      }
    });
  }

  // ── Pricing status poller ──────────────────────────────────
  // After Launch or Stop, repricing runs in a background thread on the backend.
  // Poll every 2 s (up to 60 s) and update the persistent banner so the admin
  // knows whether prices actually changed. The banner lives outside frZoneActive
  // and therefore remains visible even after Stop hides the active zone.
  var _pricingPollTimer = null;
  function _startPricingPoll(context) {
    var banner = document.getElementById('apFrPricingBanner');
    if (!banner) return;

    function _showBanner(msg, type) {
      banner.textContent = msg;
      banner.className = 'fr-banner--' + type;
      banner.style.display = msg ? '' : 'none';
      // Mirror into zone subtitle and details modal for the launch case when
      // those elements are still visible.
      var subEl = document.getElementById('apFrZoneSub');
      var dtlEl = document.getElementById('apFrdSubtitle');
      if (subEl) subEl.textContent = msg;
      if (dtlEl) dtlEl.textContent = msg;
    }

    if (_pricingPollTimer) clearInterval(_pricingPollTimer);
    var attempts = 0;
    var maxAttempts = 30; // 30 × 2 s = 60 s

    _pricingPollTimer = setInterval(async function() {
      attempts++;
      if (attempts > maxAttempts) { clearInterval(_pricingPollTimer); return; }
      try {
        var res = await fetch(FR_ENDPOINT, { cache: 'no-store' });
        var j = await res.json().catch(function(){ return {}; });
        var status = j && j.pricing_status;
        var err    = ((j && j.pricing_error) || '').slice(0, 200);
        var errSuffix = err ? ' (' + err + ')' : '';

        if (context === 'launch') {
          if (status === 'pending')   _showBanner('Fundraiser launched. Product pricing is still updating…', 'pending');
          if (status === 'succeeded') _showBanner('Fundraiser active. Product prices updated.', 'success');
          if (status === 'skipped')   _showBanner('Fundraiser active. Product prices were already correct.', 'success');
          if (status === 'failed')    _showBanner('Fundraiser setup saved, but product pricing failed. Do not take orders until this is fixed.' + errSuffix, 'error');
        } else {
          if (status === 'pending')   _showBanner('Stopping fundraiser. Product prices are being restored…', 'pending');
          if (status === 'succeeded') _showBanner('Fundraiser stopped. Product prices restored.', 'success');
          if (status === 'skipped')   _showBanner('Fundraiser stopped. No price restore needed.', 'success');
          if (status === 'failed')    _showBanner('Fundraiser stop was saved, but product price restore failed. Check products before taking orders.' + errSuffix, 'error');
        }

        // Keep error banners visible indefinitely; clear success after 8 s.
        if (status && status !== 'pending') {
          clearInterval(_pricingPollTimer);
          if (status !== 'failed') {
            setTimeout(function(){ banner.style.display = 'none'; }, 8000);
          }
        }
      } catch (e) { /* ignore transient poll errors */ }
    }, 2000);
  }

  // ── Active state rendering ─────────────────────────────────
  function _renderActiveState(data) {
    var enabled = data && data.enabled;

    // Zone toggle — class on parent drives CSS visibility as well so the empty
    // state can't flash in before JS runs on repeat page loads.
    var frZoneEl = document.getElementById('apFrZone');
    if (frZoneEl) frZoneEl.classList.toggle('ap-fr-zone--active', !!enabled);
    if (frZoneEmpty)  frZoneEmpty.style.display  = enabled ? 'none' : 'flex';
    if (frZoneActive) frZoneActive.style.display = enabled ? '' : 'none';
    if (settingsRow)  settingsRow.style.display  = enabled ? '' : 'none';
    if (!enabled) {
      // Ensure the launch button has correct green styling regardless of CSS cascade
      var btn = document.getElementById('apFrLaunchBtn');
      if (btn) {
        btn.style.cssText = [
          'background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%)',
          'color:#fff',
          'border:none',
          'border-radius:10px',
          'padding:10px 18px',
          'font-size:13px',
          'font-weight:700',
          'cursor:pointer',
          'white-space:nowrap',
          'flex-shrink:0',
          'transition:opacity 0.15s',
        ].join(';');
      }
      return;
    }

    var cause  = (data.cause_name || '').trim() || 'Your Fundraiser';
    var amt    = parseInt(data.amount || 0);
    var raised = parseFloat(data.total_raised || 0);
    var goal   = parseFloat(data.goal || 0);
    var endDate= data.end_date || '';
    var showBar = !!data.show_bar;

    // ── Zone active band ──
    var zoneTitleEl   = document.getElementById('apFrZoneTitle');
    var zoneSubEl     = document.getElementById('apFrZoneSub');
    var zoneRaisedEl  = document.getElementById('apFrZoneRaised');
    var zoneGoalEl    = document.getElementById('apFrZoneGoal');
    var zoneProgWrap  = document.getElementById('apFrZoneProgressWrap');
    var zoneBarFill   = document.getElementById('apFrZoneBarFill');

    var msLeft = endDate ? (new Date(endDate) - new Date()) : 0;
    var daysLeft = (endDate && msLeft > 0) ? Math.ceil(msLeft/864e5) : 0;

    if (zoneTitleEl) zoneTitleEl.textContent = cause;
    if (zoneSubEl) {
      var sub = '$' + amt + ' per item · +$1 fee · auto-repriced';
      if (daysLeft > 0) sub += ' · ' + daysLeft + ' day' + (daysLeft === 1 ? '' : 's') + ' left';
      zoneSubEl.textContent = sub;
    }
    if (zoneRaisedEl) zoneRaisedEl.textContent = '$' + raised.toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:0});

    // Progress bar only shows when there's a goal to track.
    if (goal > 0 && zoneProgWrap) {
      zoneProgWrap.style.display = '';
      var zpct = Math.min(100, (raised/goal)*100);
      if (zoneBarFill) zoneBarFill.style.width = zpct.toFixed(1) + '%';
      if (zoneGoalEl) zoneGoalEl.textContent = 'of $' + goal.toLocaleString('en-US',{maximumFractionDigits:0}) + ' goal';
    } else if (zoneProgWrap) {
      zoneProgWrap.style.display = 'none';
    }

    // ── Details modal ──
    var frdTitle  = document.getElementById('apFrdTitle');
    var frdCause  = document.getElementById('apFrdCauseName');
    var frdRaised = document.getElementById('apFrdStatRaised');
    var frdGoalCell = document.getElementById('apFrdStatGoalCell');
    var frdGoal   = document.getElementById('apFrdStatGoal');
    var frdDaysCell = document.getElementById('apFrdStatDaysCell');
    var frdDays   = document.getElementById('apFrdStatDays');
    var frdAmt    = document.getElementById('apFrdStatAmt');
    var frdHoW    = document.getElementById('apFrdHowItWorks');
    var frdVis    = document.getElementById('apFrdVisibility');
    var frdEndRow = document.getElementById('apFrdEndDateRow');
    var frdEndEl  = document.getElementById('apFrdEndDate');
    var frdProgWrap = document.getElementById('apFrdProgressWrap');
    var frdProgFill = document.getElementById('apFrdProgressFill');
    var frdProgLbl  = document.getElementById('apFrdProgressLabel');
    var srTitle = document.getElementById('apFrSettingsRowTitle');
    var srSub   = document.getElementById('apFrSettingsRowSub');

    if (frdTitle) frdTitle.textContent = cause + ' Fundraiser';
    if (frdCause) frdCause.textContent = cause;
    if (frdRaised) frdRaised.textContent = '$' + raised.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
    if (frdAmt) frdAmt.textContent = '$' + amt;
    if (frdHoW) frdHoW.textContent = '$' + amt + ' per item donated · +$1 processing fee · cause receives $' + amt + ' per sale';
    if (frdVis) frdVis.textContent = showBar ? 'Progress bar visible to shoppers' : 'Hidden from public storefront';

    if (goal > 0) {
      if (frdGoalCell) frdGoalCell.style.display = '';
      if (frdGoal) frdGoal.textContent = '$' + goal.toLocaleString('en-US',{maximumFractionDigits:0});
      if (frdProgWrap) frdProgWrap.style.display = '';
      var pct = Math.min(100, (raised/goal)*100);
      if (frdProgFill) frdProgFill.style.width = pct.toFixed(1) + '%';
      if (frdProgLbl)  frdProgLbl.textContent  = pct.toFixed(0) + '% of $' + goal.toLocaleString('en-US',{maximumFractionDigits:0}) + ' goal';
    } else {
      if (frdGoalCell) frdGoalCell.style.display = 'none';
      if (frdProgWrap) frdProgWrap.style.display = 'none';
    }

    if (endDate) {
      if (frdEndRow) frdEndRow.style.display = '';
      if (frdEndEl) frdEndEl.textContent = new Date(endDate).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
      if (msLeft > 0) {
        if (frdDaysCell) frdDaysCell.style.display = '';
        if (frdDays) frdDays.textContent = Math.ceil(msLeft/864e5);
      } else if (frdDaysCell) { frdDaysCell.style.display = 'none'; }
    } else {
      if (frdEndRow) frdEndRow.style.display = 'none';
      if (frdDaysCell) frdDaysCell.style.display = 'none';
    }

    if (srTitle) srTitle.textContent = '💚 ' + cause + ' Fundraiser — Active';
    if (srSub)   srSub.textContent   = '$' + amt + ' per item · $' + raised.toFixed(2) + ' raised' + (goal>0?' of $'+goal+' goal':'') + (endDate?' · ends '+endDate:'');
  }

  // Apply a set of fundraiser fields to _state and the form inputs.
  function _applyToForm(d) {
    if (!d) return;
    if (d.cause != null || d.cause_name != null) _state.cause = d.cause || d.cause_name || '';
    if (d.amount  != null) _state.amount  = parseInt(d.amount) || 4;
    if (d.goal    != null) _state.goal    = parseFloat(d.goal) || 0;
    if (d.endDate != null || d.end_date != null) _state.endDate = d.endDate || d.end_date || '';
    var causeEl  = document.getElementById('apFrwCause');
    var goalEl   = document.getElementById('apFrwGoal');
    var dateEl   = document.getElementById('apFrwEndDate');
    if (causeEl && _state.cause)   causeEl.value = _state.cause;
    if (amountEl)                  amountEl.value = _state.amount;
    if (goalEl && _state.goal)     goalEl.value  = _state.goal;
    if (dateEl && _state.endDate)  dateEl.value  = _state.endDate;
    updateCalc();
  }

  // Restore an in-progress (not yet launched) setup so the admin can resume.
  function _restoreDraft() {
    var d = loadDraft();
    if (!d) return;
    _state.maxStep        = parseInt(d.maxStep) || 1;
    _state.termsAgreed    = !!d.termsAgreed;
    _state.stripeConnected= !!d.stripeConnected;
    _state.stripeAccountId= d.stripeAccountId || '';
    _state.visibility     = d.visibility || 'public';
    _applyToForm(d);
    if (_state.termsAgreed && termsCheck) termsCheck.checked = true;
    if (_state.stripeConnected) _showStripeConnected();
    // Reflect saved visibility selection in the toggle rows
    document.querySelectorAll('.ap-frw-toggle-row[data-val]').forEach(function(r){
      var on = r.getAttribute('data-val') === _state.visibility;
      r.classList.toggle('selected', on);
      var rb = r.querySelector('input[type=radio]');
      if (rb) rb.checked = on;
    });
  }

  // ── Load existing fundraising state on page load ───────────
  async function _loadState() {
    var serverActive = false;
    var j = {};
    try {
      var r = await fetch(FR_ENDPOINT, { cache: 'no-store' });
      j = await r.json().catch(function(){ return {}; });
    } catch(e) { j = {}; /* store may not have a fundraiser yet */ }

    if (j && j.ok !== false && j.enabled) {
      serverActive = true;
      _state.enabled = true;
      _state.totalRaised = parseFloat(j.total_raised || 0);
      _applyToForm(j);
      // Require both stripe_connected AND stripe_account_id — having an
      // account ID alone doesn't mean onboarding is complete.
      if (j.stripe_connected && j.stripe_account_id) {
        _state.stripeConnected = true;
        _state.stripeAccountId = j.stripe_account_id;
      } else {
        _state.stripeConnected = false;
        _state.stripeAccountId = j.stripe_account_id || '';
      }
      _renderActiveState(j);
      clearDraft();
    } else {
      // No active fundraiser — explicitly render the empty state so the
      // "Start a Fundraiser" button is revealed only in this case.
      _renderActiveState({ enabled: false });
    }
    if (!serverActive) _restoreDraft();
    // Only check the Stripe return if there's no live fundraiser already active.
    // Await so the wizard opens after state is fully settled.
    if (!serverActive) await _checkStripeReturn();
  }

  _loadState();
})();
