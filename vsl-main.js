/* tools.gantry.work: the main video (review-main, 12 Nov 2026) and the inline booking calendar for the capture pages.
   Used by review.html, review-call.html, automation-help/ and health-check/. Loaded with defer, after /track.js.

   1. Player. Markup (written into each page so the poster has its size before any script runs):
        <div class="vslm" data-page="call" data-action="#bookHead">
          <div class="vslm-box"><img src="/review-main.jpg" width="1280" height="720" alt="...">
            <button type="button" class="vslm-play"><i></i><span>Tap for sound</span></button></div>
        </div>
      Nothing plays by itself and no video bytes are fetched until the visitor taps: the tap creates the <video>, so it starts with sound.
      Phones (up to 699 px wide) get the 9:16 cut and the box grows to fit it; wider screens get the 16:9 cut.
      GA4, one event name per step (the house rule: distinct names, no new custom dimension needed):
        vsl_main_view (the player came on screen) > vsl_main_play > vsl_main_25 > vsl_main_50 > vsl_main_75 > vsl_main_90 > vsl_main_complete,
        each with page, source, campaign and cut (wide | tall). vsl_main_cta {watched} when a [data-vslm-cta] link is used.
      window.GantryVsl.watched() = percent of the video seen so far, -1 if it never started.

   2. Calendar. GantryBook.mount('#holderId', { page, notes, onBooked }) puts the 20-minute calendar inline (the same embed as review-call.html)
      and passes notes into the booking form. GA4: vsl_calendar_view {page} when it is mounted, review_booked {page, source, campaign} on a booking.
      A booking also opens the free tools for good on this browser (gantry_unlocked), as it does on the review pages.
   3. Lead gate. GantryGate.open(...): the "See your result" form (Tally RWMRB9) shown before any result; see the notes at that section.
   The only data this file passes on is what the page hands it for the booking notes and the form's hidden fields (the visitor's answers). */
(function () {
  'use strict';
  var FILES = { wide: ['/review-main.mp4', '/review-main.jpg'], tall: ['/review-main-v.mp4', '/review-main-v.jpg'] }, VTT = '/review-main.vtt';
  var ev = function (n, p) { try { window.gtag('event', n, p); } catch (e) {} };
  function src() {
    if (window.gSrc) return window.gSrc;
    try { var q = new URLSearchParams(location.search); return String(q.get('utm_medium') || q.get('from') || document.referrer || 'direct').slice(0, 90); } catch (e) { return 'unknown'; }
  }
  function base(page, o) { o = o || {}; o.page = page; o.source = src(); o.campaign = window.gCamp || 'none'; return o; }
  var players = [];

  function player(root) {
    if (root.__vslm) return; root.__vslm = true;
    var page = root.getAttribute('data-page') || 'page', frame = root.querySelector('.vslm-box'), btn = root.querySelector('.vslm-play');
    if (!frame || !btn) return;
    var v = null, cut = 'wide', started = false, done = false, marks = { 25: 0, 50: 0, 75: 0, 90: 0 }, seen = false;
    var api = { watched: function () { return started && v ? Math.round(v.currentTime / (v.duration || 1) * 100) : -1; }, pause: function () { try { if (v) v.pause(); } catch (e) {} }, page: page };
    players.push(api);
    if ('IntersectionObserver' in window) new IntersectionObserver(function (e, o) { if (e[0].isIntersecting && !seen) { seen = true; o.disconnect(); ev('vsl_main_view', base(page)); } }, { threshold: 0.5 }).observe(frame);
    function go() { var p; try { p = v.play(); } catch (e) {} if (p && p.catch) p.catch(function () {}); }
    function build() {
      var phone = !!(window.matchMedia && matchMedia('(max-width: 699px)').matches);
      cut = phone ? 'tall' : 'wide';
      v = document.createElement('video');
      v.className = 'vslm-video'; v.controls = true; v.playsInline = true; v.setAttribute('playsinline', ''); v.preload = 'auto'; v.poster = FILES[cut][1];
      v.setAttribute('aria-label', 'Video, about a minute and a half. An AI voice speaking for Sayed explains the free 20-minute systems review.');
      var s = document.createElement('source'); s.src = FILES[cut][0]; s.type = 'video/mp4'; v.appendChild(s);
      var tr = document.createElement('track'); tr.kind = 'captions'; tr.src = VTT; tr.srclang = 'en'; tr.label = 'English'; v.appendChild(tr);
      v.addEventListener('playing', function () {
        if (!started) { started = true; ev('vsl_main_play', base(page, { cut: cut, muted: v.muted ? 1 : 0 })); }
        try { if (window.gVsl && window.gVsl.pause) window.gVsl.pause(); } catch (e) {}   /* the short video on the same page stops */
      });
      v.addEventListener('timeupdate', function () {
        if (!v.duration) return; var pct = v.currentTime / v.duration * 100;
        [25, 50, 75, 90].forEach(function (k) { if (pct >= k && !marks[k]) { marks[k] = 1; ev('vsl_main_' + k, base(page, { cut: cut })); } });
      });
      v.addEventListener('ended', function () {
        if (!done) { done = true; ev('vsl_main_complete', base(page, { cut: cut })); }
        btn.querySelector('span').textContent = 'Watch again'; btn.hidden = false; btn.classList.add('again');
        var t = null; try { t = document.querySelector(root.getAttribute('data-action') || ''); } catch (e) {}
        if (t) { t.classList.add('nudge'); setTimeout(function () { t.classList.remove('nudge'); }, 2600);
          if (root.getAttribute('data-scroll') !== 'no') { try { t.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) {} } }
      });
      v.addEventListener('error', function () { btn.hidden = false; }, true);
      if (phone) frame.classList.add('is-tall');
      frame.appendChild(v);
      if (phone) setTimeout(function () { try { frame.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {} }, 60);
    }
    btn.addEventListener('click', function () {
      if (!v) build(); else { try { v.currentTime = 0; } catch (e) {} }
      btn.hidden = true; go();
    });
    var other = document.getElementById('vslVideo');
    if (other) other.addEventListener('play', function () { api.pause(); });
  }
  function scan() { var n = document.querySelectorAll('.vslm'); for (var i = 0; i < n.length; i++) player(n[i]); }
  var watched = function () { var w = -1; players.forEach(function (p) { w = Math.max(w, p.watched()); }); return w; };
  window.GantryVsl = { scan: scan, watched: watched, pause: function () { players.forEach(function (p) { p.pause(); }); } };

  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('[data-vslm-cta]') : null; if (!a) return;
    var pg = a.getAttribute('data-vslm-cta') || 'page';
    ev('vsl_main_cta', base(pg, { watched: watched() }));
    /* the button leads to the calendar on the same page, so it counts as the same lead click a link to the booking page used to be */
    ev('lead_click', { link_target: 'inline-calendar', tool_name: pg });
    try { if (window.gantryLead) window.gantryLead('review_click'); } catch (x) {}
  }, true);

  /* ---- inline calendar ---- */
  var CAL_LINK = (window.GANTRY_CFG && window.GANTRY_CFG.calLink ? window.GANTRY_CFG.calLink : 'https://cal.com/sayed.r/20min').replace(/^https?:\/\/(app\.)?cal\.com\//, '');
  var calCount = 0;
  function mount(sel, opt) {
    var holder = document.querySelector(sel); if (!holder || holder.__cal) return false; holder.__cal = true;
    opt = opt || {}; var page = opt.page || 'page', ns = 'capture' + (++calCount);   /* one namespace per calendar: a page can hold two (the gate's fallback and the result's) */
    holder.style.minHeight = '560px';
    (function (C, A, L) {
      var p = function (a, ar) { a.q.push(ar); }; var d = C.document;
      C.Cal = C.Cal || function () {
        var cal = C.Cal; var ar = arguments;
        if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement('script')).src = A; cal.loaded = true; }
        if (ar[0] === L) {
          var api = function () { p(api, arguments); };
          var namespace = ar[1]; api.q = api.q || [];
          if (typeof namespace === 'string') { cal.ns[namespace] = cal.ns[namespace] || api; p(cal.ns[namespace], ar); p(cal, ['initNamespace', namespace]); }
          else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
    })(window, 'https://app.cal.com/embed/embed.js', 'init');
    var Cal = window.Cal;
    Cal('init', ns, { origin: 'https://app.cal.com' });
    var cfg = { layout: 'month_view', theme: 'dark' };
    if (opt.notes) cfg.notes = String(opt.notes).slice(0, 700);
    Cal.ns[ns]('inline', { elementOrSelector: sel, config: cfg, calLink: CAL_LINK });
    Cal.ns[ns]('on', { action: 'bookingSuccessful', callback: function () {
      ev('review_booked', base(page));
      try { localStorage.setItem('gantry_unlocked', '1'); } catch (e) {}
      if (typeof opt.onBooked === 'function') { try { opt.onBooked(); } catch (e) {} }
    } });
    Cal.ns[ns]('ui', { theme: 'dark', hideEventTypeDetails: false, layout: 'month_view', cssVarsPerTheme: { dark: { 'cal-brand': '#c9a227' }, light: { 'cal-brand': '#2A2FB0' } } });
    ev('vsl_calendar_view', base(page));
    return true;
  }
  /* mount when the holder is about to come on screen (the calendar script is heavy, so it never loads before it is needed) */
  function mountWhenNear(sel, opt) {
    var holder = document.querySelector(sel); if (!holder) return;
    if (!('IntersectionObserver' in window)) { mount(sel, opt); return; }
    new IntersectionObserver(function (e, o) { if (e[0].isIntersecting) { o.disconnect(); mount(sel, opt); } }, { rootMargin: '600px 0px' }).observe(holder);
  }
  window.GantryBook = { mount: mount, mountWhenNear: mountWhenNear };

  /* ---- 3. Lead gate (owner's rule, 12 Nov 2026: "no leakages"; nobody sees a result before the form is sent) ----
     GantryGate.open('#holder', { source, answers, score, title, sub, calNotes, onCaptured })
     Shows the existing Tally form RWMRB9 ("See your result": name, work email, company) inside the page, with the hidden fields
     source, answers, score and page filled through the embed address. onCaptured runs only when Tally reports the submission:
     a window "message" whose data (string or object) has event "Tally.FormSubmitted" for form RWMRB9. There is no skip link.
     If the form gives no sign of life within about 8 seconds (blocked script, offline), a plain button opens the same form with the same
     fields in a new tab and the booking calendar is shown; the result stays closed, because this page cannot see a form sent in another tab.
     Embed rules that matter (27 Oct 2026): never set the iframe src before embed.js has run, no transparent background, white box with padding.
     GA4: lead_gate_shown {source}, lead_captured {source}, lead_gate_fallback {source}. The page itself fires quiz_complete {source} first. */
  var GATE_FORM = 'RWMRB9', PRIV = 'Your answers and email go to Sayed through Tally and are used only to reply to you.', gate = null, tallyAsked = false;
  var enc = encodeURIComponent;
  function cleanPage() {
    var base = location.origin + location.pathname;
    try { var q = new URLSearchParams(location.search), keep = [];
      ['utm_source', 'utm_medium', 'utm_campaign', 'from'].forEach(function (k) { var v = q.get(k); if (v) keep.push(k + '=' + enc(String(v).slice(0, 60))); });
      return base + (keep.length ? '?' + keep.join('&') : ''); } catch (e) { return base; }
  }
  function gateQuery(o) {
    return 'source=' + enc(String(o.source || 'page').slice(0, 60)) + '&answers=' + enc(String(o.answers || '').slice(0, 900)) + '&score=' + enc(String(o.score || '').slice(0, 120)) + '&page=' + enc(cleanPage());
  }
  /* gate events: source = the page that was completed (the same value the page sends with quiz_complete and Tally stores); from = where the visit came from */
  function gateEv(source) { return { source: source, page: source, from: src(), campaign: window.gCamp || 'none' }; }
  function el(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function loadTally(frame) {
    if (window.Tally) { try { window.Tally.loadEmbeds(); } catch (e) {} return; }
    if (tallyAsked) return; tallyAsked = true;
    var s = document.createElement('script'); s.src = 'https://tally.so/widgets/embed.js'; s.async = true;
    s.onload = function () { try { window.Tally.loadEmbeds(); } catch (e) {} };
    s.onerror = function () { tallyAsked = false; try { frame.src = frame.getAttribute('data-tally-src'); } catch (e) {} };
    document.head.appendChild(s);
  }
  function gateFallback() {
    if (!gate || gate.alive || gate.done || gate.fell) return; gate.fell = true;
    gate.fall.hidden = false;
    ev('lead_gate_fallback', gateEv(gate.source));
    mount('#lgCal', { page: gate.source, notes: gate.opt.calNotes || gate.opt.answers });
  }
  function openGate(sel, opt) {
    var host = document.querySelector(sel); if (!host) return false;
    opt = opt || {}; var source = opt.source || 'page', q = gateQuery(opt);
    if (gate && gate.timer) clearTimeout(gate.timer);
    host.textContent = ''; host.hidden = false; host.classList.add('lg');
    var h = el('h2', 'lg-h', opt.title || 'Your result is ready.'); h.tabIndex = -1;
    var frame = document.createElement('iframe'); frame.className = 'lg-frame'; frame.title = 'See your result'; frame.setAttribute('frameborder', '0');
    frame.setAttribute('data-tally-src', 'https://tally.so/embed/' + GATE_FORM + '?alignLeft=1&hideTitle=1&dynamicHeight=1&' + q);
    var fall = el('div', 'lg-fall'); fall.hidden = true;
    fall.appendChild(el('p', '', 'The form has not loaded here. A blocker or a weak connection can stop it. Open it in a new tab to send your answers. Your result stays closed on this page until the form is sent from this page, so if the box above appears later, use that one.'));
    var a = el('a', 'lg-btn', 'Open the form in a new tab'); a.href = 'https://tally.so/r/' + GATE_FORM + '?' + q; a.target = '_blank'; a.rel = 'noopener'; fall.appendChild(a);
    fall.appendChild(el('h3', '', 'Or book the free 20 minutes now'));
    var cal = el('div', 'lg-cal'); cal.id = 'lgCal'; fall.appendChild(cal);
    host.appendChild(h);
    host.appendChild(el('p', 'lg-sub', opt.sub || 'One short form: your name and work email. Send it and your result opens on this page straight away.'));
    host.appendChild(frame); host.appendChild(el('p', 'lg-priv', PRIV)); host.appendChild(fall);
    gate = { host: host, frame: frame, fall: fall, source: source, opt: opt, alive: false, done: false, fell: false, timer: setTimeout(gateFallback, opt.wait || 8000) };
    loadTally(frame);
    ev('lead_gate_shown', gateEv(source));
    try { h.focus({ preventScroll: true }); var top = host.getBoundingClientRect().top; if (top < 0 || top > window.innerHeight * 0.5) host.scrollIntoView({ block: 'start' }); } catch (e) {}
    return true;
  }
  window.addEventListener('message', function (e) {
    var d = e.data; if (typeof d === 'string') { if (d.indexOf('Tally.') < 0) return; try { d = JSON.parse(d); } catch (x) { return; } }
    if (!gate || gate.done || !d || typeof d.event !== 'string' || d.event.indexOf('Tally.') !== 0) return;
    var fid = d.payload && (d.payload.formId || d.payload.form_id), mine = fid ? fid === GATE_FORM : (e.source && e.source === gate.frame.contentWindow);
    if (!mine) return;
    if (d.event !== 'Tally.FormSubmitted') { gate.alive = true; clearTimeout(gate.timer); return; }   /* FormLoaded, FormPageView: the form is there */
    gate.done = true; clearTimeout(gate.timer);
    ev('lead_captured', gateEv(gate.source));
    try { localStorage.setItem('gantry_lead', String(Date.now())); } catch (x) {}
    try { if (window.gantryLead) window.gantryLead('lead_gate'); } catch (x) {}
    var g = gate; g.host.textContent = ''; g.host.hidden = true;
    if (typeof g.opt.onCaptured === 'function') g.opt.onCaptured();
  });
  window.GantryGate = { open: openGate, form: GATE_FORM, url: function (o) { return 'https://tally.so/r/' + GATE_FORM + '?' + gateQuery(o || {}); }, privacy: PRIV, isOpen: function () { return !!(gate && !gate.done); },
    close: function () { if (gate && !gate.done) { clearTimeout(gate.timer); gate.host.textContent = ''; gate.host.hidden = true; gate = null; } } };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', scan); else scan();
})();
