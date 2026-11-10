/* The Gantry tools: usage tracking for GA4 (G-EW5Y0JHSF9). Loaded on every tools page.
   - tool_view: which tool was opened (tool_name, tool_category)
   - tool_engaged: first real interaction with the tool (input, select, button)
   - lead_click / affiliate_click: review bookings and partner links
   - tool_limit_reached / tool_gate_redirect: third free use recorded / a fourth use tried and sent to review-limit.html
   - user property tool_interest: last tool category used (for GA4 audiences)
   Consent: EEA/UK/CH visitors are denied by default (set inline before GA config); everyone else can opt out here.
   Nothing typed into a tool is ever sent: only the tool name and the type of action. */
(function () {
  'use strict';
  var ID = 'G-EW5Y0JHSF9';
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== 'function') { window.gtag = function () { window.dataLayer.push(arguments); }; }
  var gtag = window.gtag;
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  // Pages without the inline GA snippet: load GA here (consent defaults first).
  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
      region: ['AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE','IS','LI','NO','GB','CH'] });
    gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' });
    if (store.get('gantry_optout') === '1') gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID; document.head.appendChild(s);
    gtag('js', new Date()); gtag('config', ID);
  }

  var path = location.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '').replace(/(^|\/)index$/, '') || 'tools-home';
  var CAT = [
    [/health-check|erp-roi|erp-readiness|edge-grant|inventory-software-cost|month-end-close|cost-of-manual-work|progress-claim|job-costing|landed-cost|slow-moving|stock-take|systems-checklist/, 'erp'],
    [/invoicenow/, 'invoicenow'],
    [/invoice-generator|receipt|quotation|delivery-order|purchase-order|statement-of-account|ar-aging|invoice-due-date|invoice-chaser|dso/, 'finance_docs'],
    [/profit-margin|markup|gross-profit|break-even|price-increase|gst-calculator/, 'pricing'],
    [/make-credit|whatsapp|automation-help|blueprints/, 'automation'],
    [/timesheet/, 'hr'],
    [/^review/, 'review'],
    [/tools-home|privacy/, 'hub']
  ];
  var cat = 'other';
  for (var i = 0; i < CAT.length; i++) { if (CAT[i][0].test(path)) { cat = CAT[i][1]; break; } }
  // New tools can declare their category: <meta name="gantry-tool-category" content="erp">
  var metaCat = document.querySelector('meta[name="gantry-tool-category"]');
  if (metaCat && metaCat.content) cat = metaCat.content.trim().toLowerCase();
  var base = { tool_name: path, tool_category: cat };
  function ev(n, p) { try { var o = {}; for (var k in base) o[k] = base[k]; for (var j in (p || {})) o[j] = p[j]; gtag('event', n, o); } catch (e) {} }

  // ---- Hand-off to the review page (added 2026-10-20) ----
  // 1) Remember where this visit came from (e.g. a LinkedIn DM link ?utm_source=linkedin&utm_campaign=close).
  // 2) Tools call window.gantryResult('S$45,600 a year on month-end') when they show a result.
  // 3) Any click to review.html carries tool, result and the original campaign, so the review page can
  //    open with their number and prefill it into the booking notes. Nothing typed into a tool is sent:
  //    only the headline result the visitor already sees, and only when they click through to book.
  var sess = {
    get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
  };
  try {
    var q0 = new URLSearchParams(location.search);
    if (q0.get('utm_source') && !/^review/.test(path)) {
      sess.set('gantry_in', JSON.stringify({ s: q0.get('utm_source') || '', m: q0.get('utm_medium') || '', c: q0.get('utm_campaign') || '' }));
    }
  } catch (e) {}
  window.gantryResult = function (label) {
    if (!label) return;
    sess.set('gantry_result', JSON.stringify({ tool: path, label: String(label).slice(0, 120) }));
    ev('tool_result', { result_band: String(label).slice(0, 60) });
  };
  function decorate(a) {
    var h = a.getAttribute('href') || '';
    if (!/review\.html/.test(h) || /^review/.test(path)) return;
    try {
      var u = new URL(h, location.href);
      if (!/gantry\.work$|github\.io$|^localhost$|^127\.0\.0\.1$/.test(u.hostname) && u.hostname !== location.hostname) return;
      var p = u.searchParams;
      if (!p.get('utm_source')) p.set('utm_source', 'tools');
      if (!p.get('utm_medium')) p.set('utm_medium', path);
      p.set('tool', path);
      var r = JSON.parse(sess.get('gantry_result') || 'null');
      if (r && r.tool === path) p.set('result', r.label);
      var inc = JSON.parse(sess.get('gantry_in') || 'null');
      if (inc) { if (inc.s) p.set('in_src', inc.s); if (inc.m) p.set('in_med', inc.m); if (inc.c) p.set('in_camp', inc.c); }
      a.setAttribute('href', u.toString());
    } catch (e) {}
  }
  ['mousedown', 'touchstart', 'click', 'auxclick', 'keydown'].forEach(function (t) {
    document.addEventListener(t, function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (a) decorate(a);
    }, true);
  });

  // ---- Three free uses, then the review page (added 2026-11-10; owner's rule: the tools are for people who raise a hand) ----
  // A "use" = a tool page where the visitor really did something (the same moment tool_engaged fires).
  // The same tool again within 30 minutes is the same use. Counted per browser in localStorage; nothing is sent.
  // After FREE_USES uses, the next use goes to review-limit.html (short video, three buttons: 2-minute video,
  // 20-minute slot, subscribe). The review pages set gantry_unlocked=1 when a
  // video is requested or a call is booked, and the tools stay open from then on. ?access=owner unlocks a browser.
  var FREE_USES = 3, REUSE_MS = 30 * 60 * 1000;
  var gated = cat !== 'hub' && cat !== 'review' && cat !== 'other' && !/automation-help/.test(path);
  function uses() { try { var a = JSON.parse(store.get('gantry_uses') || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; } }
  try { if (new URLSearchParams(location.search).get('access') === 'owner') store.set('gantry_unlocked', '1'); } catch (e) {}
  var unlocked = store.get('gantry_unlocked') === '1';
  function toLimit(n) {
    ev('tool_gate_redirect', { uses_count: n });
    var to = '/review-limit.html?utm_source=tools&utm_medium=' + encodeURIComponent(path) + '&utm_campaign=tool_limit&locked=1';
    setTimeout(function () { location.replace(to); }, 200);
  }
  if (gated && !unlocked) {
    var u0 = uses(), last = u0[u0.length - 1];
    if (u0.length >= FREE_USES && !(last && last.t === path && (Date.now() - last.at) < REUSE_MS)) {
      try { document.documentElement.style.visibility = 'hidden'; } catch (e) {}
      toLimit(u0.length);
      return;
    }
  }
  function useNote(n) {
    try {
      var o = document.getElementById('gantry-uses'); if (o && o.parentNode) o.parentNode.removeChild(o);
      var d = document.createElement('div'); d.id = 'gantry-uses'; d.setAttribute('role', 'status');
      d.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9998;max-width:320px;background:#141c5c;color:#fff;border:1px solid rgba(242,207,110,.5);border-radius:10px;padding:8px 12px;font:13px/1.4 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;box-shadow:0 6px 22px rgba(0,0,0,.3)';
      d.innerHTML = n < FREE_USES ? 'Free use ' + n + ' of ' + FREE_USES
        : '<b>Free use ' + n + ' of ' + FREE_USES + '.</b> After this one you get three free ways to go further: a 2-minute video, a 20-minute slot, or new tools by email. <a href="/review-limit.html?utm_source=tools&utm_medium=' + encodeURIComponent(path) + '&utm_campaign=tool_limit" style="color:#f2cf6e;white-space:nowrap">See them</a> <button type="button" aria-label="Close" style="background:transparent;border:0;color:#fff;cursor:pointer;font-size:15px;padding:0 0 0 6px">&times;</button>';
      d.addEventListener('click', function (e) { if (e.target && e.target.tagName === 'BUTTON') d.parentNode.removeChild(d); });
      document.body.appendChild(d);
      if (n < FREE_USES) setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 6000);
    } catch (e) {}
  }
  // One use = one page load with a real interaction (the same tool again within 30 minutes is the same use),
  // or one run on a tool with a Calculate or Download button: those call window.gantryRun() before each run.
  var loadUse = false, runs = 0;
  function pushUse(a) {
    a.push({ t: path, at: Date.now() }); store.set('gantry_uses', JSON.stringify(a.slice(-20))); loadUse = true;
    if (a.length === FREE_USES) ev('tool_limit_reached');
    if (a.length <= FREE_USES) useNote(a.length);
  }
  function countUse() {
    if (!gated || unlocked || loadUse) return;
    var a = uses(), l = a[a.length - 1];
    if (l && l.t === path && (Date.now() - l.at) < REUSE_MS) return;
    pushUse(a);
  }
  // Returns true when the run may go ahead. The first run of a page load rides on the use that the first input already counted;
  // every later run is a use of its own. With three uses spent, the next run goes to review-limit.html instead.
  window.gantryRun = function () {
    if (!gated || unlocked) return true;
    runs++;
    if (runs === 1 && loadUse) return true;
    var a = uses();
    if (a.length >= FREE_USES) { toLimit(a.length); return false; }
    pushUse(a);
    return true;
  };

  ev('tool_view');
  if (cat !== 'hub' && cat !== 'other') { try { gtag('set', 'user_properties', { tool_interest: cat }); } catch (e) {} }

  var engaged = false;
  // Tools with form controls: 'use' = typing, choosing, clicking a control or dropping a file.
  // Information tools with no form controls (lists, provider pages, downloads): 'use' = opening a section,
  // clicking an outbound or download link. Brand, privacy and notice clicks never count.
  var hasControls = function () { var c = document.querySelectorAll('input:not([type=hidden]), select, textarea, [contenteditable]'); for (var i = 0; i < c.length; i++) { if (c[i].offsetParent && !c[i].closest('#gantry-notice')) return true; } return false; };
  function onEngage(e) {
    if (engaged) return;
    var t = e.target;
    if (!t || !t.closest || t.closest('#gantry-notice') || t.closest('.brand') || t.closest('a[href*="privacy"]')) return;
    var ctl = t.closest('input, select, textarea, button, [contenteditable], .drop, label');
    var link = t.closest('a[href]'), sum = t.closest('summary, details');
    if (ctl && !link) { engaged = true; ev('tool_engaged', { first_action: e.type }); countUse(); return; }
    if (e.type === 'click' && cat !== 'hub' && !hasControls() && (sum || (link && !/linkedin\.com/.test(link.getAttribute('href') || '')))) {
      engaged = true; ev('tool_engaged', { first_action: sum ? 'expand' : 'link' }); countUse();
    }
  }
  document.addEventListener('input', onEngage, true);
  document.addEventListener('change', onEngage, true);
  document.addEventListener('click', onEngage, true);

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
    // 2026-11-10: on the review pages a link to review.html is the "back to the three options" link, not a new lead.
    if (/^review/.test(path) && /review\.html/.test(h) && !/cal\.com/.test(h)) return;
    if (/cal\.com\/sayed\.r|review\.html|automation-help/.test(h)) ev('lead_click', { link_target: h.split('?')[0].slice(0, 90) });
    else if (/affiliates\.wati|pc=gntrywk|make\.com/.test(h)) ev('affiliate_click', { link_target: h.split('?')[0].slice(0, 90) });
    else if (/gantry\.work\/p\//.test(h)) ev('guide_click', { link_target: h.split('?')[0].slice(0, 90) });
  }, true);

  // One-time notice + permanent small privacy link.
  function ui() {
    var css = 'position:fixed;left:12px;right:12px;bottom:12px;z-index:9999;max-width:560px;margin:0 auto;background:#141c5c;color:#fff;border:1px solid rgba(242,207,110,.5);border-radius:12px;padding:12px 14px;font:14px/1.45 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;box-shadow:0 8px 30px rgba(0,0,0,.35)';
    if (!store.get('gantry_notice')) {
      var d = document.createElement('div'); d.id = 'gantry-notice'; d.setAttribute('role', 'region'); d.setAttribute('aria-label', 'Privacy notice'); d.style.cssText = css;
      d.innerHTML = 'These free tools use Google Analytics cookies to count which tools are used and to show relevant Gantry ads elsewhere. Nothing you type is sent. <a href="/privacy.html" style="color:#f2cf6e">Privacy</a>' +
        '<div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap"><button type="button" data-k="ok" style="background:#f2cf6e;color:#14142a;border:0;border-radius:8px;padding:7px 14px;font-weight:700;cursor:pointer">OK</button>' +
        '<button type="button" data-k="no" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,.4);border-radius:8px;padding:7px 14px;cursor:pointer">Opt out</button></div>';
      d.addEventListener('click', function (e) {
        var k = e.target && e.target.getAttribute && e.target.getAttribute('data-k'); if (!k) return;
        store.set('gantry_notice', '1');
        if (k === 'no') { store.set('gantry_optout', '1'); gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' }); }
        d.parentNode.removeChild(d);
      });
      document.body.appendChild(d);
    }
    // Privacy link: inside the page's last card when there is one. Appended straight to <body> it became a
    // side column on pages whose body is a flex row, squeezing the tool on phones (fixed 2026-10-20).
    var l = document.createElement('p'); l.className = 'gantry-privacy';
    l.innerHTML = '<a href="/privacy.html" style="color:inherit">Privacy and cookies</a>';
    var cards = document.querySelectorAll('.card, main, .wrap, .container');
    var host = cards.length ? cards[cards.length - 1] : null;
    if (host && host.offsetParent !== null) {
      l.style.cssText = 'text-align:center;font-size:12px;opacity:.7;margin:22px 0 0;width:100%';
      host.appendChild(l);
    } else {
      l.style.cssText = 'text-align:center;font-size:12px;opacity:.7;margin:18px auto 70px;width:100%;flex:0 0 100%;align-self:stretch';
      document.body.appendChild(l);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui); else ui();

  // ---- Retargeting and company identification (added 2026-10-28). Everything here is OFF until an id is
  // filled in /config.js, and all of it respects the opt-out above (nothing loads when gantry_optout=1). ----
  var cfg = window.GANTRY_CFG || {};
  var optedOut = store.get('gantry_optout') === '1';
  function addScript(src, attrs) { var s = document.createElement('script'); s.async = true; s.src = src; for (var k in (attrs || {})) s.setAttribute(k, attrs[k]); document.head.appendChild(s); return s; }
  if (!optedOut && cfg.linkedinPartnerId) {
    window._linkedin_partner_id = String(cfg.linkedinPartnerId);
    window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
    window._linkedin_data_partner_ids.push(window._linkedin_partner_id);
    addScript('https://snap.licdn.com/li.lms-analytics/insight.min.js');
  }
  if (!optedOut && cfg.metaPixelId) {
    (function (f, b, e, v, n, t) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = true; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = true; t.src = v; b.head.appendChild(t); })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', String(cfg.metaPixelId)); window.fbq('track', 'PageView');
  }
  if (!optedOut && cfg.visitorId && cfg.visitorId.id) {
    if (cfg.visitorId.provider === 'leadfeeder') {
      window.ldfdr = window.ldfdr || function () { (window.ldfdr._q = window.ldfdr._q || []).push([].slice.call(arguments)); };
      addScript('https://sc.lfeeder.com/lftracker_v1_' + cfg.visitorId.id + '.js');
    } else if (cfg.visitorId.provider === 'snitcher') {
      addScript('https://snid.snitcher.com/' + cfg.visitorId.id + '.js');
    }
  }
  // Lead events for the pixels, mirrored from GA4 lead_click and result_email_capture.
  window.gantryLead = function (kind) {
    try { if (window.lintrk && cfg.linkedinConversionId) window.lintrk('track', { conversion_id: cfg.linkedinConversionId }); } catch (e) {}
    try { if (window.fbq) window.fbq('track', 'Lead', { content_name: kind || 'lead' }); } catch (e) {}
  };
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    var h = a ? (a.getAttribute('href') || '') : '';
    if (/^review/.test(path) && /review\.html/.test(h) && !/cal\.com/.test(h)) return;
    if (a && /cal\.com\/sayed\.r|review\.html/.test(h)) window.gantryLead('review_click');
  }, true);
})();
