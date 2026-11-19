/* tools.gantry.work: printable starter kits beside the partner buttons (19 Nov 2026, conversion pass).
   Markup on the page: <div class="kc" data-kit="wati|make|jotform" data-next="<partner link through /go/>" data-next-label="..."></div>
   What it does: shows the kit (cover image, three things inside, one button). The button opens the existing "See your result"
   Tally form RWMRB9 (GantryGate in /vsl-main.js, hidden fields source = kit-<kit>, answers = kit name and page). When Tally reports
   the submission, the PDF link and the partner next step appear on the page. A browser that already sent the form before
   (localStorage gantry_lead) gets the download straight away. Nothing is emailed from here and no other data is sent.
   GA4: kit_view {kit}, kit_claim_click {kit}, kit_download {kit}, kit_next_click {kit}. lead_captured comes from /vsl-main.js. */
(function () {
  'use strict';
  var KITS = {
    wati: { name: 'The WATI 7-Day Trial Kit', pdf: '/kits/The-WATI-7-Day-Trial-Kit.pdf', img: '/kits/wati-kit-p1.jpg', pages: 3,
      items: ['The 30-minute preparation sheet: your top five customer questions and the numbers to beat',
        'One job a day for the 7 days, with a line to write each day\'s answer',
        'The eight-point go-live checklist to clear before the first payment'],
      extra: '<a href="/wati-free-trial-plan.html#icsBox">Put the 7 days in your calendar</a> as well.' },
    make: { name: 'The First Automation Kit for Make', pdf: '/kits/The-First-Automation-Kit-for-Make.pdf', img: '/kits/make-kit-p1.jpg', pages: 2,
      items: ['Five first jobs that usually fit the free plan, and how to pick yours',
        'The credit sum, worked through once and blank for your own job',
        'A seven-step build list and a one-page record for the scenario'],
      extra: 'Size your own job with <a href="/make-credit-calculator.html">the credit calculator</a>.' },
    jotform: { name: 'The Mobile Job Sheet Kit', pdf: '/kits/The-Mobile-Job-Sheet-Kit.pdf', img: '/kits/jotform-kit-p1.jpg', pages: 2,
      items: ['The field list: each line of the paper sheet and its Jotform element',
        'Which plan you need, worked out from your own visits a day',
        'The seven build steps and a first-week rollout on site'],
      extra: '' }
  };
  var ev = function (n, p) { try { window.gtag('event', n, p); } catch (e) {} };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function known() { try { return !!localStorage.getItem('gantry_lead'); } catch (e) { return false; } }
  var n = 0;
  function build(root) {
    if (root.__kc) return; root.__kc = true;
    var key = root.getAttribute('data-kit'), k = KITS[key]; if (!k) return;
    var id = 'kc' + (++n), next = root.getAttribute('data-next') || '', nextLabel = root.getAttribute('data-next-label') || '';
    var page = location.pathname.replace(/^\//, '').replace(/\.html$/, '') || 'home';
    root.innerHTML =
      '<div class="kc-in">' +
        '<img class="kc-img" src="' + k.img + '" width="300" height="424" alt="Page 1 of ' + esc(k.name) + '" loading="lazy">' +
        '<div class="kc-body">' +
          '<p class="kc-eye">Free printable kit, ' + k.pages + ' pages</p>' +
          '<h2 class="kc-h" id="' + id + 'h">' + esc(k.name) + '</h2>' +
          '<ul class="kc-list">' + k.items.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' +
          '<button type="button" class="kc-btn" id="' + id + 'b">Get the kit</button>' +
          '<p class="kc-small">Your name and work email, then the PDF opens on this page. No newsletter unless you ask for one.</p>' +
        '</div>' +
      '</div>' +
      '<div class="kc-gate" id="' + id + 'g" hidden></div>' +
      '<div class="kc-done" id="' + id + 'd" hidden>' +
        '<p class="kc-ok">Your kit is ready.</p>' +
        '<a class="kc-dl" href="' + k.pdf + '" target="_blank" rel="noopener" data-kc="dl">Open the PDF</a>' +
        (k.extra ? '<p class="kc-small">' + k.extra + '</p>' : '') +
        (next ? '<p class="kc-next-h">Next step, with the kit beside you:</p><a class="cta kc-next" href="' + esc(next) + '" target="_blank" rel="sponsored noopener" data-kc="next">' + esc(nextLabel || 'Start free') + '</a><p class="disc">Affiliate link: if you sign up through it, The Gantry may earn a commission at no extra cost to you.</p>' : '') +
      '</div>';
    root.setAttribute('aria-labelledby', id + 'h');
    var btn = document.getElementById(id + 'b'), gate = document.getElementById(id + 'g'), done = document.getElementById(id + 'd');
    function open() {
      root.querySelector('.kc-in').hidden = true; gate.hidden = true; done.hidden = false;
      try { done.querySelector('.kc-dl').focus({ preventScroll: true }); } catch (e) {}
    }
    btn.addEventListener('click', function () {
      ev('kit_claim_click', { kit: key, page: page });
      if (known()) { open(); return; }
      if (window.GantryGate) {
        btn.disabled = true; gate.hidden = false;
        window.GantryGate.open('#' + id + 'g', { source: 'kit-' + key, answers: 'Kit: ' + k.name + ' | page: ' + page, score: 'kit',
          title: 'One short form, then the kit opens here.', sub: 'Your name and work email. The PDF link appears on this page as soon as you send it.',
          onCaptured: function () { btn.disabled = false; open(); } });
      } else {
        location.href = 'https://tally.so/r/RWMRB9?source=kit-' + key + '&answers=' + encodeURIComponent('Kit: ' + k.name + ' | page: ' + page) + '&score=kit';
      }
    });
    done.addEventListener('click', function (e) {
      var a = e.target.closest ? e.target.closest('a[data-kc]') : null; if (!a) return;
      ev(a.getAttribute('data-kc') === 'dl' ? 'kit_download' : 'kit_next_click', { kit: key, page: page });
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { o.disconnect(); ev('kit_view', { kit: key, page: page }); } }, { threshold: 0.4 }).observe(root);
  }
  function scan() { [].forEach.call(document.querySelectorAll('.kc[data-kit]'), build); }
  window.GantryKits = { scan: scan };   /* pages that write a box later (the WATI fit check result) call this again */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
