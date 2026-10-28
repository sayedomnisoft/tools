/* tools.gantry.work shared UI (added 2026-10-28).
   1. Trust strip under the page title: who built this, when the figures were last checked, what happens next.
   2. Next-step ladder under every result: (a) email me this result + the 1-page fix plan (Tally, optional, never a gate),
      (b) a 2-minute video on this number, (c) book 20 minutes. Calculators on calc.js call GantryLadder.render();
      hand-built tools get it attached automatically when their result box appears.
   Nothing typed into a tool is sent. The email form carries only the address, the company (optional) and the headline result. */
(function () {
  'use strict';
  var cfg = window.GANTRY_CFG || {};
  var FORM = cfg.captureForm || 'X55QDY';
  var CAL = cfg.calLink || 'https://cal.com/sayed.r/20min';
  var path = location.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '').replace(/(^|\/)index$/, '') || 'tools-home';
  var $ = function (id) { return document.getElementById(id); };
  var ev = function (n, p) { try { window.gtag('event', n, Object.assign({ tool_name: path }, p || {})); } catch (e) {} };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function niceDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? parseInt(m[3], 10) + ' ' + M[parseInt(m[2], 10) - 1] + ' ' + m[1] : iso; }

  /* ---- 1. Trust strip ---- */
  function trust() {
    if (/^(review|privacy|go)/.test(path) || $('gantry-trust')) return;
    var h1 = document.querySelector('h1'); if (!h1) return;
    var meta = document.querySelector('meta[name="gantry-checked"]');
    var checked = niceDate((meta && meta.content) || cfg.checked || '');
    var d = document.createElement('div'); d.id = 'gantry-trust'; d.className = 'trust';
    d.innerHTML = '<img src="/sayed.jpg" alt="Sayed Rashid" width="46" height="46" loading="lazy">' +
      '<div class="trust-t"><b>Built by Sayed Rashid</b>, ex-auditor, 30+ systems projects across Singapore, Indonesia, Malaysia and Cambodia.' +
      (checked ? ' <span class="chk">Figures last checked ' + esc(checked) + '.</span>' : '') +
      '<div class="next3"><span>What happens next:</span> <em>1</em> your number <em>2</em> a 2-minute video on it, if you want one <em>3</em> 20 minutes on Zoom, if it is worth it. All free.</div></div>';
    var after = h1.nextElementSibling && h1.nextElementSibling.classList.contains('sub') ? h1.nextElementSibling : h1;
    after.parentNode.insertBefore(d, after.nextSibling);
  }

  /* ---- 2. Ladder ---- */
  var FIX = {
    'cost-of-manual-work': function () { return 'The first fix most 10 to 30 person firms make is one shared record for orders, so the same line is never typed twice.'; },
    'month-end-close': function () { return 'The first fix is usually recording stock and invoices as they happen, so finance stops rebuilding the month from files.'; },
    'erp-readiness': function () { return 'Your next step depends on the weakest area: data first, then process, then the system.'; },
    'health-check': function () { return 'The one leak above is where the first fix goes. Everything else can wait a quarter.'; },
    'progress-claim-calculator': function () { return 'Most claim delays are admin, not disputes: make "stage reached on site" and "claim ready" the same event.'; },
    'job-costing-calculator': function () { return 'A gap in week six is a warning you can act on; the same gap at handover is a write-off.'; },
    'slow-moving-stock-calculator': function () { return 'Clear the dead band first: the cash comes back once, and the provision stops growing.'; },
    'stock-take-variance-calculator': function () { return 'Variance clusters on a few SKUs. Fix how those are received and picked before counting more often.'; },
    'landed-cost-calculator': function () { return 'If your selling price was set from the supplier price alone, your margin is thinner than your reports say.'; },
    'dso-calculator': function () { return 'Reminders on day 7 and a statement each month usually bring DSO back to your terms within two cycles.'; },
    'edge-grant-calculator': function () { return 'Apply before you sign anything; a signed quote or deposit makes the cost ineligible.'; }
  };
  function tallySrc(result) {
    return 'https://tally.so/embed/' + FORM + '?alignLeft=1&hideTitle=1&dynamicHeight=1&tool=' + encodeURIComponent(path) + '&result=' + encodeURIComponent(String(result || '').slice(0, 140)) + '&page=' + encodeURIComponent(location.href.split('?')[0]);
  }
  var tallyLoading = false;
  function loadTally(frame) {
    if (window.Tally) { try { window.Tally.loadEmbeds(); } catch (e) {} return; }
    if (tallyLoading) return; tallyLoading = true;
    var s = document.createElement('script'); s.src = 'https://tally.so/widgets/embed.js'; s.async = true;
    s.onload = function () { try { window.Tally.loadEmbeds(); } catch (e) {} };
    s.onerror = function () { frame.src = frame.getAttribute('data-tally-src'); };
    document.head.appendChild(s);
  }
  function render(host, o) {
    if (!host) return;
    o = o || {};
    var result = o.result || '';
    var fix = o.fix || (FIX[path] ? FIX[path](result) : 'Tell me which number surprised you and I will show you the first fix.');
    var vurl = '/review.html?offer=video&utm_source=tools&utm_medium=' + encodeURIComponent(path) + '&tool=' + encodeURIComponent(path) + (result ? '&result=' + encodeURIComponent(result.slice(0, 120)) : '');
    var curl = '/review.html?utm_source=tools&utm_medium=' + encodeURIComponent(path) + '&tool=' + encodeURIComponent(path) + (result ? '&result=' + encodeURIComponent(result.slice(0, 120)) : '');
    var first = !host.firstChild;
    host.className = 'ladder';
    host.innerHTML = '<p class="ladder-fix">' + esc(fix) + '</p>' +
      '<div class="ladder-steps">' +
      '<button type="button" class="ls ls-email" data-k="email"><em>1</em><span>Email me this result + the 1-page fix plan</span></button>' +
      '<a class="ls" data-k="video" href="' + vurl + '"><em>2</em><span>Get a 2-minute video on this number</span></a>' +
      '<a class="ls" data-k="call" href="' + curl + '"><em>3</em><span>Book 20 minutes on Zoom</span></a></div>' +
      '<div class="ladder-form" hidden><iframe data-tally-src="' + tallySrc(result) + '" loading="lazy" title="Email me this result" style="width:100%;border:0;min-height:300px;background:#fff;border-radius:12px"></iframe>' +
      '<p class="ladder-thanks" hidden><b>Sent.</b> Your result and the one-page fix plan are on their way. If you would rather talk it through, step 2 or 3 above still works.</p></div>' +
      '<p class="ladder-note">All free. Nothing you typed is sent; the email form carries only your address, your company and the headline result.</p>';
    var form = host.querySelector('.ladder-form'), frame = host.querySelector('iframe');
    host.querySelector('.ls-email').addEventListener('click', function () {
      var open = form.hidden; form.hidden = !open;
      if (open) { loadTally(frame); ev('result_email_open', { result_band: result.slice(0, 60) }); setTimeout(function () { try { form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {} }, 150); }
    });
    host.querySelectorAll('a.ls').forEach(function (a) { a.addEventListener('click', function () { ev('ladder_click', { step: a.getAttribute('data-k'), result_band: result.slice(0, 60) }); }); });
    if (first) ev('ladder_shown', { result_band: result.slice(0, 60) });
    host._gantryResult = result;
  }
  window.addEventListener('message', function (e) {
    var d = e.data; if (typeof d === 'string') { try { d = JSON.parse(d); } catch (x) { return; } }
    if (!d || d.event !== 'Tally.FormSubmitted') return;
    var hosts = document.querySelectorAll('.ladder'); if (!hosts.length) return;
    hosts.forEach(function (h) { var t = h.querySelector('.ladder-thanks'), f = h.querySelector('iframe'); if (t) { t.hidden = false; } if (f) f.style.display = 'none'; });
    var r = hosts[0]._gantryResult || '';
    ev('result_email_capture', { result_band: r.slice(0, 60) });
    try { window.gantryLead && window.gantryLead('email_capture'); } catch (x) {}
    try { localStorage.setItem('nl_subscribed', '1'); } catch (x) {}
  });

  /* ---- 3. Auto-attach on hand-built tools ---- */
  function headline() {
    try { var r = JSON.parse(sessionStorage.getItem('gantry_result') || 'null'); if (r && r.tool === path) return r.label; } catch (e) {}
    var v = $('verdict'); return v ? v.textContent.trim().slice(0, 120) : '';
  }
  function autoAttach() {
    if ($('ladder')) return; // calc.js pages render their own
    var box = $('result') || $('results'); if (!box) return;
    var host = document.createElement('div'); host.id = 'ladder';
    var cta = box.querySelector('a.cta'); if (cta) box.insertBefore(host, cta); else box.appendChild(host);
    var done = false;
    var show = function () { if (box.classList.contains('hidden') || box.hidden) return; render(host, { result: headline() }); done = true; };
    new MutationObserver(function () { show(); }).observe(box, { attributes: true, attributeFilter: ['class', 'hidden'] });
    show();
  }
  function pending() {
    var h = $('ladder'), last = window.__gantryLast;
    if (h && !h.firstChild && last && last.result) { if (window.gantryResult) window.gantryResult(last.result); render(h, { result: last.result }); }
  }
  function init() { trust(); autoAttach(); pending(); }
  window.GantryLadder = { render: render, trust: trust };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
