(function () {
  'use strict';
  var dialog = document.getElementById('apPrintGuide');
  var opener = document.getElementById('apPrintGuideOpen');
  if (!dialog || !opener) return;
  // Escape the initially hidden Add tab so the required guide is visible immediately.
  document.body.appendChild(dialog);
  var context = window.SSAP || {};
  var checkbox = document.getElementById('apPrintGuideAck');
  var label = document.getElementById('apPrintGuideAckLabel');
  var close = document.getElementById('apPrintGuideClose');
  var submit = document.getElementById('apPrintGuideContinue');
  var status = document.getElementById('apPrintGuideStatus');
  var preview = !!context.isProspectDemo && !context.customerId;
  var previewKey = 'ss-print-guide:v1:preview:' + String(context.shopHandle || '');
  var acknowledged = context.printGuideRead === true;
  if (preview) { try { acknowledged = localStorage.getItem(previewKey) === 'read'; } catch (_) {} }
  var eligible = !!context.shopHandle && (!!context.customerId || preview);
  var required = eligible && !acknowledged, saving = false;
  function openGuide() {
    required = eligible && !acknowledged;
    close.hidden = required;
    label.hidden = !required;
    checkbox.checked = false;
    submit.disabled = required;
    submit.textContent = required ? 'I’ve read it — continue' : 'Done';
    status.textContent = '';
    if (!dialog.open) dialog.showModal();
    dialog.querySelector('.ap-print-guide-content').scrollTop = 0;
  }
  opener.addEventListener('click', openGuide);
  close.addEventListener('click', function () { if (!required) dialog.close(); });
  dialog.addEventListener('cancel', function (event) { if (required || saving) event.preventDefault(); });
  dialog.addEventListener('close', function () { opener.focus(); });
  checkbox.addEventListener('change', function () { submit.disabled = saving || !checkbox.checked; });
  submit.addEventListener('click', async function () {
    if (saving) return;
    if (!required) { dialog.close(); return; }
    if (!checkbox.checked) return;
    saving = true; submit.disabled = true; submit.textContent = 'Saving…'; status.textContent = '';
    try {
      if (preview) {
        try { localStorage.setItem(previewKey, 'read'); } catch (_) { /* Still read for this page visit. */ }
      } else {
        if (!context.customerId || !context.shopHandle) throw new Error('Please sign in to save your acknowledgement.');
        var response = await fetch('/apps/ss/relay/store/' + encodeURIComponent(context.shopHandle) + '/printing-guide', {
          method:'POST', credentials:'same-origin', headers:{'Content-Type':'application/json'},
          body:JSON.stringify({version:'v1', acknowledged:true})
        });
        var data = await response.json();
        if (!response.ok || data.ok !== true) throw new Error('Could not save your acknowledgement. Please try again.');
      }
      acknowledged = true; context.printGuideRead = true; required = false;
      dialog.close();
    } catch (error) {
      status.textContent = error.message || 'Could not save. Please try again.';
    } finally {
      saving = false; submit.disabled = !checkbox.checked;
      submit.textContent = 'I’ve read it — continue';
    }
  });
  if (required) openGuide();
})();
