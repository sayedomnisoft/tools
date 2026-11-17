/* tools.gantry.work: the sticky "book the free 20 minutes" bar (16 Nov 2026).
   Used by review.html, review-video.html, review-tools.html and review-call.html. Load with defer:
     <script src="/sticky-book.js" defer data-page="hub" data-after="#heroBook" data-hide="#finalCta" data-href="review-call.html"></script>
   data-page   GA4 label (hub | video | tools | call)
   data-after  the hero button: the bar shows once this has scrolled up out of view
   data-hide   comma list: while any of these is on screen the bar steps aside (final CTA, a form, the booking calendar)
   data-href   where "Book" goes; the page's query string is carried (utm_*, tool, result, in_camp, access...)
   data-scroll instead of data-href: a same-page anchor ("See the open times" on review-call.html); the bar scrolls there
   Phones: a bar fixed to the bottom, above the home indicator. 900 px and wider: the same bar as a compact centred card.
   It sits above the one-time privacy notice from /track.js while that is open. The body gets bottom padding so nothing is covered.
   Slots line: the count is read live from the public Cal.com slots feed (the same read-only feed review-call.html uses), cached for
   5 minutes in this tab. No number is ever shown that was not read; if the feed fails or shows nothing, a plain line stands instead.
   GA4: sticky_book_view {page} once when it first appears, sticky_book_click {page, slots (-1 = not read), source}.
   On review-call.html the bar has id="sticky", so the existing booking callback there removes it once a call is booked. */
(function () {
  'use strict';
  var me = document.currentScript || document.querySelector('script[src*="sticky-book.js"]');
  if (!me || window.__redir || document.getElementById('sticky')) return;
  try { if (window.GANTRY_EMBED === true || window.top !== window.self) return; } catch (e) { return; }
  var D = function (k) { return me.getAttribute('data-' + k) || ''; };
  var PAGE = D('page') || 'page', AFTER = D('after'), HIDE = D('hide'), HREF = D('href'), SCROLL = D('scroll');
  /* 2026-11-17: data-title replaces the bar's heading; data-attn="1" adds the attention motion (tool pages after the third use) */
  var TITLE = D('title') || 'Free 20-min systems review', ATTN = D('attn') === '1';
  var CAL = 'sayed.r/20min', TZ = 'Asia/Singapore', FALLBACK = 'Only a few slots open each week';
  var slots = -1;
  var ev = function (n, p) { try { if (typeof window.gtag === 'function') { p = p || {}; p.page = PAGE; p.source = window.gSrc || 'unknown'; p.campaign = window.gCamp || 'none'; window.gtag('event', n, p); } } catch (e) {} };

  var css = [
    '#sticky{position:fixed;left:0;right:0;bottom:0;z-index:9990;padding:0 10px calc(10px + env(safe-area-inset-bottom));pointer-events:none;',
    'transform:translateY(calc(100% + 24px));visibility:hidden;transition:transform .32s cubic-bezier(.16,1,.3,1),visibility 0s linear .32s}',
    '#sticky.on{transform:none;visibility:visible;transition:transform .32s cubic-bezier(.16,1,.3,1),visibility 0s}',
    '#sticky .sb-in{pointer-events:auto;display:flex;align-items:center;gap:10px;max-width:560px;margin:0 auto;padding:10px 10px 10px 14px;',
    'background:#141a5a;border:1px solid rgba(242,207,110,.55);border-radius:16px;box-shadow:0 10px 32px rgba(0,0,0,.5),0 2px 6px rgba(0,0,0,.3);',
    'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;color:#fff}',
    '#sticky .sb-t{flex:1 1 auto;min-width:0;line-height:1.25}',
    '#sticky .sb-t b{display:block;font-size:14.5px;letter-spacing:-.1px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#sticky .sb-s{display:flex;align-items:center;gap:6px;margin-top:3px;font-size:12.5px;color:rgba(255,255,255,.82);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '#sticky .sb-s i{flex:none;width:7px;height:7px;border-radius:50%;background:#5fd38d;box-shadow:0 0 0 3px rgba(95,211,141,.18)}',
    '#sticky .sb-s.fb i{background:#f2cf6e;box-shadow:0 0 0 3px rgba(242,207,110,.18)}',
    '#sticky .sb-b{flex:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:46px;padding:0 16px;border-radius:12px;',
    'font-size:16px;font-weight:800;text-decoration:none;color:#14142a;background:linear-gradient(180deg,#f2cf6e,#c9a227);',
    'box-shadow:0 4px 14px rgba(201,162,39,.35);transition:transform .12s ease,box-shadow .12s ease;white-space:nowrap}',
    '#sticky .sb-b,#sticky .sb-b:visited,#sticky .sb-b:hover{color:#14142a}',
    '#sticky .sb-b:hover{transform:translateY(-1px);box-shadow:0 8px 22px rgba(201,162,39,.45)}',
    '#sticky .sb-b:focus-visible{outline:3px solid #fff;outline-offset:3px}',
    '@media (max-width:359px){#sticky .sb-t b{font-size:13.5px}#sticky .sb-b{padding:0 12px;font-size:15px}}',
    '@media (min-width:400px){#sticky .sb-t b{font-size:15.5px}#sticky .sb-b{padding:0 20px}}',
    '@media (min-width:900px){#sticky{padding-bottom:calc(18px + env(safe-area-inset-bottom))}#sticky .sb-in{max-width:520px;padding:10px 10px 10px 18px}}',
    '@media (prefers-reduced-motion:reduce){#sticky,#sticky.on{transition:none}#sticky .sb-b{transition:none}}',
    'body.sb-pad{padding-bottom:calc(96px + env(safe-area-inset-bottom)) !important}',
    '@media print{#sticky{display:none}}',
    '#sticky.attn.on .sb-in{animation:sbIn .7s cubic-bezier(.34,1.56,.64,1) both}',
    '#sticky.attn .sb-b{position:relative;overflow:hidden;animation:sbNudge 4.8s ease-in-out 1.2s infinite}',
    '#sticky.attn .sb-b::after{content:"";position:absolute;top:0;bottom:0;left:-60%;width:45%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.65),transparent);transform:skewX(-18deg);animation:sbShine 4.8s ease-in-out 1.6s infinite}',
    '#sticky.attn .sb-s i{animation:sbDot 1.6s ease-in-out infinite}',
    '@keyframes sbIn{from{transform:translateY(40px) scale(.96);opacity:0}to{transform:none;opacity:1}}',
    '@keyframes sbNudge{0%,78%,100%{transform:none}82%{transform:translateY(-4px) rotate(-1.5deg)}86%{transform:translateY(0) rotate(1.5deg)}90%{transform:translateY(-2px) rotate(-.8deg)}94%{transform:none}}',
    '@keyframes sbShine{0%,70%{left:-60%}90%,100%{left:130%}}',
    '@keyframes sbDot{50%{transform:scale(1.5)}}',
    '@media (prefers-reduced-motion:reduce){#sticky.attn .sb-in,#sticky.attn .sb-b,#sticky.attn .sb-b::after,#sticky.attn .sb-s i{animation:none}}'
  ].join('');
  var st = document.createElement('style'); st.id = 'sticky-css'; st.textContent = css; document.head.appendChild(st);

  /* the link carries the query string, as every option link on these pages does */
  var href = HREF;
  if (HREF) { try { var q = location.search; var h = HREF.split('#'); href = h[0] + (q ? (h[0].indexOf('?') >= 0 ? '&' + q.slice(1) : q) : '') + (h[1] ? '#' + h[1] : ''); } catch (e) {} }
  else href = SCROLL || '#';

  var bar = document.createElement('div');
  bar.id = 'sticky'; bar.setAttribute('role', 'region'); bar.setAttribute('aria-label', 'Book the free 20-minute systems review');
  if (ATTN) bar.className = 'attn';
  bar.innerHTML = '<div class="sb-in"><div class="sb-t"><b>' + TITLE.replace(/</g, '&lt;') + '</b><span class="sb-s fb"><i aria-hidden="true"></i><span class="sb-l">' + FALLBACK + '</span></span></div>' +
    '<a class="sb-b" href="' + href.replace(/"/g, '&quot;') + '">Book <span aria-hidden="true">&rarr;</span></a></div>';
  document.body.appendChild(bar);
  document.body.classList.add('sb-pad');
  var btn = bar.querySelector('.sb-b'), line = bar.querySelector('.sb-l'), lineBox = bar.querySelector('.sb-s');
  btn.setAttribute('aria-label', SCROLL ? 'Book: see the open times' : 'Book the free 20 minutes');

  btn.addEventListener('click', function (e) {
    ev('sticky_book_click', { slots: slots });
    try { if (window.gVsl && window.gVsl.pause) window.gVsl.pause(); if (window.GantryVsl) window.GantryVsl.pause(); } catch (x) {}
    if (SCROLL) {
      var t = document.querySelector(SCROLL); if (!t) return;
      e.preventDefault();
      var rm = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
      try { t.scrollIntoView({ behavior: rm ? 'auto' : 'smooth', block: 'start' }); } catch (x) { t.scrollIntoView(); }
      try { if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); } catch (x) {}
      try { history.replaceState(null, '', location.pathname + location.search + SCROLL); } catch (x) {}
    }
  });

  /* show / hide: shown once the hero button is above the screen, unless something in data-hide is on screen */
  var past = !AFTER, blockers = 0, seen = false, shown = false;
  function apply() {
    var on = past && blockers === 0;
    if (on === shown) return; shown = on;
    bar.classList.toggle('on', on);
    if (on && !seen) { seen = true; ev('sticky_book_view', { slots: slots }); }
  }
  if ('IntersectionObserver' in window) {
    var a = AFTER ? document.querySelector(AFTER) : null;
    if (AFTER && a) new IntersectionObserver(function (e) { var x = e[e.length - 1]; past = !x.isIntersecting && x.boundingClientRect.top < 0; apply(); }).observe(a);
    else if (AFTER) past = true;
    var vis = new Map();
    var io = new IntersectionObserver(function (e) {
      e.forEach(function (x) { vis.set(x.target, x.isIntersecting); });
      blockers = 0; vis.forEach(function (v, el) { if (v && !el.hidden && el.offsetParent !== null) blockers++; }); apply();
    }, { rootMargin: '0px 0px -60px 0px' });
    if (HIDE) HIDE.split(',').forEach(function (s) { s = s.trim(); if (!s) return; try { document.querySelectorAll(s).forEach(function (el) { io.observe(el); }); } catch (x) {} });
  } else { past = true; }
  apply();

  /* the one-time privacy notice (fixed, bottom 12px, from /track.js): the bar rides above it while it is open */
  function lift() {
    var n = document.getElementById('gantry-notice'), off = 0, h = n ? n.getBoundingClientRect().height : 0;   /* fixed, so offsetParent is always null */
    if (h > 0) off = h + 12 + 2;
    bar.style.bottom = off ? off + 'px' : '';
  }
  lift();
  try { new MutationObserver(lift).observe(document.body, { childList: true }); } catch (e) {}
  window.addEventListener('resize', lift, { passive: true });

  /* slots line, read live */
  function say(n) {
    if (n > 0) { slots = n; line.textContent = n + (n === 1 ? ' slot' : ' slots') + ' open right now'; lineBox.classList.remove('fb'); }
    else { slots = n === 0 ? 0 : -1; line.textContent = FALLBACK; lineBox.classList.add('fb'); }
  }
  try { var c = JSON.parse(sessionStorage.getItem('gantry_slots') || 'null'); if (c && Date.now() - c.t < 300000 && typeof c.n === 'number') { say(c.n); return; } } catch (e) {}
  if (!window.fetch || !window.Intl) return;
  try {
    var ymd = function (d) { var o = {}; new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d).forEach(function (p) { o[p.type] = p.value; }); return o.year + '-' + o.month + '-' + o.day; };
    var now = new Date(), start = ymd(now), end = ymd(new Date(now.getTime() + 14 * 86400000));
    var ctl = window.AbortController ? new AbortController() : null, to = ctl ? setTimeout(function () { ctl.abort(); }, 7000) : 0;
    fetch('https://api.cal.com/v2/slots?eventTypeSlug=' + encodeURIComponent(CAL.split('/')[1]) + '&username=' + encodeURIComponent(CAL.split('/')[0]) + '&start=' + start + '&end=' + end + '&timeZone=' + encodeURIComponent(TZ),
      { headers: { 'cal-api-version': '2024-09-04' }, credentials: 'omit', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw 0; return r.json(); })
      .then(function (j) {
        clearTimeout(to); if (!j || !j.data || typeof j.data !== 'object') throw 0;
        var t = new Date(), n = 0;
        Object.keys(j.data).forEach(function (k) { if (Array.isArray(j.data[k])) j.data[k].forEach(function (s) { if (s && s.start && new Date(s.start) > t) n++; }); });
        say(n);
        try { sessionStorage.setItem('gantry_slots', JSON.stringify({ n: n, t: Date.now() })); } catch (e) {}
      })
      .catch(function () { clearTimeout(to); say(-1); });
  } catch (e) {}
})();
