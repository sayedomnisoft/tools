/* tools.gantry.work shared UI (added 2026-10-28, light look and booking places 2026-11-17).
   1. Header: "The Gantry" wordmark (home) and a small outlined "Book 20 min" button.
   2. Trust line under the page title: who built this and when the figures were last checked.
   3. Next-step ladder under every result: "Book the free 20 minutes" is the primary button; under it, (a) email me this result +
      the 1-page fix plan (Tally, optional, never a gate) and (b) a 2-minute video on this number. Calculators on calc.js call
      GantryLadder.render(); hand-built tools get it attached automatically when their result box appears.
   4. Tidy page order: the tool column, then a booking card, related tools, the short answer, the long guide folded into a
      <details>, the byline and a quiet footer. Booking-only CTA blocks (.auto with nothing but review links) step aside for the card.
   GA4: review_cta_click {cta: tool_header | tool_card | tool_ladder, tool_name, page: 'tool'} on every booking click.
   Nothing typed into a tool is sent. The email form carries only the address, the company (optional) and the headline result.
   Skipped on review*, privacy and go/ pages; the home page (tools-home) carries its header and card in the HTML (build_hub.py). */
(function () {
  'use strict';
  var cfg = window.GANTRY_CFG || {};
  var FORM = cfg.captureForm || 'X55QDY';
  var path = location.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '').replace(/(^|\/)index$/, '') || 'tools-home';
  var SKIP = /^(review|privacy|go)/.test(path);
  var FRAMED = false; try { FRAMED = window.top !== window.self; } catch (e) { FRAMED = true; }
  var $ = function (id) { return document.getElementById(id); };
  var ev = function (n, p) { try { window.gtag('event', n, Object.assign({ tool_name: path }, p || {})); } catch (e) {} };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  function niceDate(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? parseInt(m[3], 10) + ' ' + M[parseInt(m[2], 10) - 1] + ' ' + m[1] : iso; }
  var ARROW = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></svg>';
  var MAIL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" d="M3 6h18v12H3zM3 7l9 7 9-7"/></svg>';
  var PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 8.5v7l6-3.5z" fill="currentColor"/></svg>';
  function bookUrl(campaign, extra) {
    return '/review-call.html?utm_source=tools&utm_medium=' + encodeURIComponent(path) + '&utm_campaign=' + campaign + (extra || '');
  }
  function track(a, cta) { a.addEventListener('click', function () { ev('review_cta_click', { cta: cta, page: 'tool' }); }); }

  /* ---- 1. Header ---- */
  function header() {
    if (SKIP || FRAMED || $('gt-top') || !document.body) return;
    var h = document.createElement('header'); h.id = 'gt-top'; h.className = 'gt-top noprint';
    h.innerHTML = '<a class="gt-mark" href="/index.html" aria-label="The Gantry, all free tools">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="square" d="M3 21V4h18v17M3 9h18M8 9v5M16 9v5"/></svg>The Gantry</a>' +
      '<a class="gt-hbtn" href="' + bookUrl('tool_header') + '">Book 20 min</a>';
    document.body.insertBefore(h, document.body.firstChild);
    track(h.querySelector('.gt-hbtn'), 'tool_header');
    /* the old "THE GANTRY · TOOLS" line at the top of the column is now the header */
    var b = document.querySelector('.brand');
    if (b && /gantry/i.test(b.textContent) && b === firstContent(b.parentNode)) b.classList.add('gt-home');
    document.documentElement.classList.add('gt-ui');
  }
  function firstContent(p) { var c = p && p.firstElementChild; while (c && /^(SCRIPT|STYLE|NOSCRIPT)$/.test(c.tagName)) c = c.nextElementSibling; return c; }

  /* ---- 2. Trust line ---- */
  function trust() {
    if (SKIP || $('gantry-trust')) return;
    var h1 = document.querySelector('h1'); if (!h1) return;
    var meta = document.querySelector('meta[name="gantry-checked"]');
    var checked = niceDate((meta && meta.content) || cfg.checked || '');
    var d = document.createElement('div'); d.id = 'gantry-trust'; d.className = 'trust';
    d.innerHTML = '<img src="/sayed-320.jpg" alt="" width="28" height="28" loading="lazy">' +
      '<div class="trust-t"><b>Built by Sayed Rashid</b>, ex-auditor, 38 systems live.' +
      (checked ? ' <span class="tr-chk">Figures checked ' + esc(checked) + '.</span>' : '') + '</div>';
    var after = h1.nextElementSibling && h1.nextElementSibling.classList.contains('sub') ? h1.nextElementSibling : h1;
    after.parentNode.insertBefore(d, after.nextSibling);
  }

  /* ---- 3. Ladder ---- */
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
    var rq = '&tool=' + encodeURIComponent(path) + (result ? '&result=' + encodeURIComponent(result.slice(0, 120)) : '');
    var vurl = '/review.html?offer=video&utm_source=tools&utm_medium=' + encodeURIComponent(path) + rq;
    var curl = bookUrl('tool_ladder', rq);
    var first = !host.firstChild;
    host.className = 'ladder';
    host.innerHTML = '<p class="ladder-fix">' + esc(fix) + '</p>' +
      '<div class="ladder-steps">' +
      '<a class="ls ls-call" data-k="call" href="' + curl + '">Book the free 20 minutes ' + ARROW + '</a>' +
      '<div class="ls-alt"><button type="button" class="ls ls-email" data-k="email">' + MAIL + '<span>Email me this result + the 1-page fix plan</span></button>' +
      '<a class="ls" data-k="video" href="' + vurl + '">' + PLAY + '<span>Get a 2-minute video on this number</span></a></div></div>' +
      '<div class="ladder-form" hidden><iframe data-tally-src="' + tallySrc(result) + '" loading="lazy" title="Email me this result" style="width:100%;border:0;min-height:300px;background:#fff;border-radius:12px"></iframe>' +
      '<p class="ladder-thanks" hidden><b>Sent.</b> Your result and the one-page fix plan are on their way. If you would rather talk it through, the booking button above still works.</p></div>' +
      '<p class="ladder-note">All free. Nothing you typed is sent; the email form carries only your address, your company and the headline result.</p>';
    var form = host.querySelector('.ladder-form'), frame = host.querySelector('iframe');
    host.querySelector('.ls-email').addEventListener('click', function () {
      var open = form.hidden; form.hidden = !open;
      if (open) { loadTally(frame); ev('result_email_open', { result_band: result.slice(0, 60) }); setTimeout(function () { try { form.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {} }, 150); }
    });
    host.querySelectorAll('a.ls').forEach(function (a) { a.addEventListener('click', function () { ev('ladder_click', { step: a.getAttribute('data-k'), result_band: result.slice(0, 60) }); }); });
    track(host.querySelector('.ls-call'), 'tool_ladder');
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

  /* ---- 3b. Auto-attach on hand-built tools ---- */
  function headline() {
    try { var r = JSON.parse(sessionStorage.getItem('gantry_result') || 'null'); if (r && r.tool === path) return r.label; } catch (e) {}
    var v = $('verdict'); return v ? v.textContent.trim().slice(0, 120) : '';
  }
  function autoAttach() {
    if ($('ladder')) return; // calc.js pages render their own
    var box = $('result') || $('results'); if (!box) return;
    var host = document.createElement('div'); host.id = 'ladder';
    var cta = box.querySelector('a.cta'); if (cta) box.insertBefore(host, cta); else box.appendChild(host);
    /* the result box's own "book a review" button repeats the ladder's first step: the ladder carries it now */
    if (cta && /review(-call)?\.html/.test(cta.getAttribute('href') || '') && !/offer=/.test(cta.getAttribute('href') || '')) cta.classList.add('gt-dup-cta');
    var show = function () { if (box.classList.contains('hidden') || box.hidden) return; render(host, { result: headline() }); };
    new MutationObserver(function () { show(); }).observe(box, { attributes: true, attributeFilter: ['class', 'hidden'] });
    show();
  }
  function pending() {
    var h = $('ladder'), last = window.__gantryLast;
    if (h && !h.firstChild && last && last.result) { if (window.gantryResult) window.gantryResult(last.result); render(h, { result: last.result }); }
  }

  /* ---- 4. Booking card and page order ---- */
  function bookCard() {
    var d = document.createElement('section'); d.id = 'gt-book'; d.className = 'gt-book noprint'; d.setAttribute('aria-labelledby', 'gtBookH');
    d.innerHTML = '<h2 id="gtBookH">Want a second pair of eyes on this?</h2>' +
      '<p class="gt-b-l">Bring this number to a free 20-minute call. You leave with three fixes, ranked by payoff.</p>' +
      '<a class="gt-b-btn" href="' + bookUrl('tool_card') + '">Book the free 20 minutes ' + ARROW + '</a>' +
      '<p class="gt-b-fine">Real examples, not slides.</p>' +
      '<div class="gt-b-who"><img src="/sayed-320.jpg" alt="Sayed Rashid" width="40" height="40" loading="lazy"><span><b>Sayed Rashid</b> · Ex-auditor · 38 systems live</span></div>';
    track(d.querySelector('.gt-b-btn'), 'tool_card');
    return d;
  }
  function onlyBooking(el) {
    var a = el.querySelectorAll('a[href]'); if (!a.length) return false;
    for (var i = 0; i < a.length; i++) if (!/review(-call)?\.html/.test(a[i].getAttribute('href'))) return false;
    return true;
  }
  function kids(card, sel) { return Array.prototype.filter.call(card.children, function (c) { return c.matches(sel); }); }
  function tidy() {
    if (SKIP || FRAMED || $('gt-book')) return;
    var card = document.querySelector('body > .card') || document.querySelector('.card') || document.querySelector('body > main, body > .wrap'); if (!card) return;
    var after = document.createElement('div'); after.className = 'gt-after';
    card.parentNode.insertBefore(after, card.nextSibling);
    var mw = getComputedStyle(card).maxWidth; if (mw && mw !== 'none' && parseFloat(mw) > 300) after.style.maxWidth = Math.min(parseFloat(mw), 900) + 'px';
    kids(card, '.auto').forEach(function (a) { if (onlyBooking(a)) a.classList.add('gt-dup'); });
    after.appendChild(bookCard());
    var move = function (sel) { kids(card, sel).forEach(function (el) { after.appendChild(el); }); };
    /* on a tool page the short answer and the long guide come after the tool; on a guide page the text is the page and stays put */
    var tool = Array.prototype.filter.call(card.querySelectorAll('#app, #form, #quiz, #intro, #inputBox, #ckf, .pc, .dm, input:not([type=hidden]), select, textarea'),
      function (el) { return !el.closest('.guide, .answer, .auto'); })[0] || null;
    move('.related');
    if (tool) move('.answer:not(button)');
    kids(card, '.guide').forEach(function (g) {
      var long = tool && !g.contains(tool) && (g.textContent || '').replace(/\s+/g, ' ').length > 700;
      if (!long) return;
      var det = document.createElement('details'); det.className = 'gt-more';
      var h = g.querySelector('h2'), lead = h ? h.textContent.trim() : 'How it works';
      det.innerHTML = '<summary>' + esc(lead.length > 64 ? 'How it works, worked examples and questions' : lead + ', with examples and questions') + '</summary>';
      det.appendChild(g); after.appendChild(det);
      if (location.hash && g.querySelector(location.hash.replace(/[^#\w-]/g, ''))) det.open = true;
      det.addEventListener('toggle', function () { if (det.open) ev('guide_open'); });
    });
    move('.byline');
    kids(card, 'p.noprint').forEach(function (p) { if (/Privacy/.test(p.textContent)) { p.removeAttribute('style'); p.className = 'gt-privacy-note noprint'; after.appendChild(p); } });
    footer(after);
  }
  function footer(after) {
    if ($('gt-foot')) return;
    var f = document.createElement('footer'); f.id = 'gt-foot'; f.className = 'gt-foot noprint';
    f.innerHTML = '<span>The Gantry · Singapore</span><nav aria-label="More from The Gantry"><a href="/index.html">All free tools</a><a href="https://www.gantry.work">Newsletter</a><a href="/privacy.html">Privacy</a></nav>';
    after.parentNode.insertBefore(f, after.nextSibling);
    /* the small "Privacy and cookies" link from /track.js: one privacy link in the footer is enough */
    var move = function () { document.querySelectorAll('.gantry-privacy').forEach(function (l) { if (l.parentNode) l.parentNode.removeChild(l); }); };
    move(); document.addEventListener('DOMContentLoaded', move);
  }

  function init() { header(); trust(); autoAttach(); pending(); tidy(); }
  window.GantryLadder = { render: render, trust: trust };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
