/* The Gantry tools: usage tracking for GA4 (G-EW5Y0JHSF9). Loaded on every tools page.
   - tool_view: which tool was opened (tool_name, tool_category)
   - tool_engaged: first real interaction with the tool (input, select, button)
   - lead_click / affiliate_click: review bookings and partner links
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
    [/health-check|erp-roi|erp-readiness|edge-grant|inventory-software-cost|month-end-close|cost-of-manual-work/, 'erp'],
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
    if (ctl && !link) { engaged = true; ev('tool_engaged', { first_action: e.type }); return; }
    if (e.type === 'click' && cat !== 'hub' && !hasControls() && (sum || (link && !/linkedin\.com/.test(link.getAttribute('href') || '')))) {
      engaged = true; ev('tool_engaged', { first_action: sum ? 'expand' : 'link' });
    }
  }
  document.addEventListener('input', onEngage, true);
  document.addEventListener('change', onEngage, true);
  document.addEventListener('click', onEngage, true);

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '';
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
    var l = document.createElement('p'); l.style.cssText = 'text-align:center;font-size:12px;opacity:.7;margin:18px 0 70px';
    l.innerHTML = '<a href="/privacy.html" style="color:inherit">Privacy and cookies</a>';
    document.body.appendChild(l);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ui); else ui();
})();
