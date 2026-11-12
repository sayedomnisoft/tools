/* Kit guides on tools.gantry.work (added 2026-11-12): Copy buttons on the message templates, the PDF and LinkedIn
   click events, and four small sums (days to get paid, stock variance in dollars, 13-week closing balances, close cost).
   Nothing typed here is sent anywhere. /track.js counts the view (tool_view) and the first real use (tool_engaged);
   this file adds kit_copy, kit_pdf_download, kit_second_step_click and kit_calc so each kind of use can be told apart. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var path = location.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '') || 'tools-home';
  function ev(n, p) {
    try { var o = { tool_name: path, tool_category: 'guide' }; for (var k in (p || {})) o[k] = p[k]; if (window.gtag) window.gtag('event', n, o); } catch (e) {}
  }
  function num(el) { var v = parseFloat(el && el.value); return isFinite(v) ? v : NaN; }
  function fmt(v, d) { return (Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString('en-SG', { minimumFractionDigits: 0, maximumFractionDigits: d || 0 }); }
  function money(v) { return (v < 0 ? '-' : '') + 'S$' + fmt(Math.abs(v), 0); }
  function signed(v) { return (v > 0 ? '+' : v < 0 ? '-' : '') + 'S$' + fmt(Math.abs(v), 0); }
  var calcSeen = {}, timers = {};
  // one kit_calc per sum per page load; the headline result is kept for the review page a moment after typing stops
  function used(name, label) {
    if (!calcSeen[name]) { calcSeen[name] = true; ev('kit_calc', { calc: name }); }
    clearTimeout(timers[name]);
    timers[name] = setTimeout(function () { try { if (window.gantryResult) window.gantryResult(label); } catch (e) {} }, 1200);
  }

  /* ---- Copy buttons ---- */
  function plain(el) {
    var t = (el.innerText || el.textContent || '').replace(/ /g, ' ');
    return t.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  function copy() {
    var btns = document.querySelectorAll('.kt-copy');
    for (var i = 0; i < btns.length; i++) (function (b) {
      var label = b.textContent;
      b.addEventListener('click', function () {
        var src = $(b.getAttribute('data-copy')); if (!src) return;
        var text = plain(src);
        var done = function () { b.textContent = 'Copied'; b.classList.add('done'); setTimeout(function () { b.textContent = label; b.classList.remove('done'); }, 1800); };
        var old = function () {
          try {
            var ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
            document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); done();
          } catch (e) {}
        };
        try { navigator.clipboard.writeText(text).then(done, old); } catch (e) { old(); }
        ev('kit_copy', { template: b.getAttribute('data-copy') });
      });
    })(btns[i]);
  }

  /* ---- PDF and LinkedIn clicks ---- */
  function links() {
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
      if (a.classList.contains('kt-dl')) ev('kit_pdf_download', { file: (a.getAttribute('href') || '').split('/').pop() });
      if (a.classList.contains('kt-li')) ev('kit_second_step_click', { keyword: a.getAttribute('data-keyword') || '' });
    }, true);
  }

  /* ---- 1. days to get paid ---- */
  function dso() {
    var out = $('kt-dso-out'); if (!out) return;
    var f = { owed: $('kt-owed'), sales: $('kt-sales'), days: $('kt-days'), terms: $('kt-terms') }, touched = false;
    function draw() {
      var owed = num(f.owed), sales = num(f.sales), days = num(f.days), terms = num(f.terms);
      if (!(owed >= 0) || !(sales > 0) || !(days > 0) || !(terms >= 0)) { out.className = 'fl-out bad'; out.innerHTML = 'Fill in all four boxes. Credit sales and days in the period must be more than zero.'; return; }
      var d = owed / sales * days, late = d - terms, tied = sales / days * late;
      var h = 'Days to get paid<span class="big">' + fmt(d, 1) + ' days</span>';
      if (late > 0.05) h += 'On ' + fmt(terms, 0) + '-day terms that is <b>' + fmt(late, 1) + ' days late</b>. Cash tied up beyond your terms: <b>about ' + money(tied) + '</b>.';
      else h += 'That is inside your ' + fmt(terms, 0) + '-day terms. Keep the routine going and work it out again next month.';
      out.className = 'fl-out ' + (late > 0.05 ? 'bad' : 'ok'); out.innerHTML = h;
      if (touched) used('days-to-get-paid', fmt(d, 1) + ' days to get paid' + (late > 0.05 ? ', ' + fmt(late, 1) + ' days late' : ''));
    }
    for (var k in f) f[k].addEventListener('input', function () { touched = true; draw(); });
    draw();
  }

  /* ---- 2. stock variance in dollars ---- */
  function variance() {
    var host = $('kt-var-rows'), out = $('kt-var-out'); if (!host || !out) return;
    var touched = false, add = $('kt-var-add');
    function rows() { return host.querySelectorAll('.kt-row'); }
    function draw() {
      var R = rows(), shorts = 0, overs = 0, rec = 0, worst = null, n = 0;
      for (var i = 0; i < R.length; i++) {
        var inp = R[i].querySelectorAll('input'), s = num(inp[0]), c = num(inp[1]), u = num(inp[2]), cell = R[i].querySelector('.kt-v');
        if (!(s >= 0) || !(c >= 0) || !(u >= 0)) { cell.textContent = ''; cell.className = 'kt-v'; continue; }
        var v = (c - s) * u; n++; rec += s * u;
        if (v < 0) shorts += v; else overs += v;
        cell.textContent = signed(v); cell.className = 'kt-v' + (v < 0 ? ' neg' : v > 0 ? ' pos' : '');
        if (v < 0 && (!worst || v < worst.v)) worst = { v: v, name: R[i].querySelector('.kt-nm').textContent, units: s - c };
      }
      if (!n) { out.className = 'fl-out bad'; out.innerHTML = 'Fill in at least one line: system quantity, counted quantity and unit cost.'; return; }
      var net = shorts + overs, gross = overs - shorts;
      var h = 'Net variance<span class="big">' + signed(net) + '</span>' + (rec > 0 ? 'That is ' + fmt(Math.abs(net) / rec * 100, 1) + '% of the ' + money(rec) + ' in the records. ' : '') +
        'Shorts <b>' + signed(shorts) + '</b>, overs <b>' + signed(overs) + '</b>. Out of place in total: <b>' + money(gross) + '</b>.';
      if (worst) h += ' Recount <b>' + worst.name + '</b> first: ' + fmt(worst.units, 2) + ' units short and ' + money(-worst.v) + (shorts < 0 ? ', which is ' + fmt(worst.v / shorts * 100, 0) + '% of the shorts.' : '.');
      out.className = 'fl-out ' + (net < 0 ? 'bad' : 'ok'); out.innerHTML = h;
      if (touched) used('stock-variance', 'Stock count net variance ' + signed(net));
    }
    host.addEventListener('input', function () { touched = true; draw(); });
    if (add) add.addEventListener('click', function () {
      var R = rows(); if (R.length >= 12) { add.disabled = true; return; }
      var r = R[R.length - 1].cloneNode(true), name = 'Item ' + String.fromCharCode(65 + R.length), inp = r.querySelectorAll('input');
      r.querySelector('.kt-nm').textContent = name;
      for (var i = 0; i < inp.length; i++) { inp[i].value = ''; inp[i].setAttribute('aria-label', name + ': ' + ['system quantity', 'counted quantity', 'unit cost in dollars'][i]); }
      host.appendChild(r); inp[0].focus(); touched = true; draw();
      if (rows().length >= 12) add.disabled = true;
    });
    draw();
  }

  /* ---- 3. thirteen closing balances ---- */
  function cash() {
    var host = $('kt-wks'), out = $('kt-cash-out'); if (!host || !out) return;
    var open = $('kt-open'), floor = $('kt-floor'), touched = false;
    function draw() {
      var R = host.querySelectorAll('.kt-wk[data-w]'), bal = num(open), fl = num(floor), list = [], bad = !isFinite(bal);
      for (var i = 0; i < R.length; i++) {
        var inp = R[i].querySelectorAll('input'), a = num(inp[0]), b = num(inp[1]), cell = R[i].querySelector('.kt-c');
        R[i].classList.remove('low');
        if (bad || !isFinite(a) || !isFinite(b)) { bad = true; cell.textContent = ''; continue; }
        bal = bal + a - b; cell.textContent = fmt(bal, 1); cell.className = 'kt-c' + (bal < 0 ? ' neg' : '');
        list.push({ i: i, bal: bal, name: R[i].getAttribute('data-w') });
      }
      if (bad) { out.className = 'fl-out bad'; out.innerHTML = 'Fill in the opening balance, and money in and money out for every week. Use 0 for a week with nothing.'; return; }
      var s = list.slice().sort(function (x, y) { return x.bal - y.bal || x.i - y.i; }), t1 = s[0], t2 = s[1];
      R[t1.i].classList.add('low');
      var under = isFinite(fl) ? list.filter(function (x) { return x.bal < fl; }) : [];
      var h = 'Tightest week<span class="big">Week of ' + t1.name + ': closes at ' + fmt(t1.bal, 1) + '</span>Second tightest: week of <b>' + t2.name + '</b>, closing at <b>' + fmt(t2.bal, 1) + '</b>. ';
      if (isFinite(fl)) h += under.length ? '<b>' + under.length + ' of 13 weeks</b> close below your floor of ' + fmt(fl, 1) + '. Pick one move for the tightest week and make the call today.' : 'No week closes below your floor of ' + fmt(fl, 1) + '.';
      out.className = 'fl-out ' + (t1.bal < (isFinite(fl) ? fl : 0) ? 'bad' : 'ok'); out.innerHTML = h;
      if (touched) used('13-week-cash', 'Tightest week ' + t1.name + ' closes at ' + fmt(t1.bal, 1));
    }
    host.addEventListener('input', function () { touched = true; draw(); });
    open.addEventListener('input', function () { touched = true; draw(); });
    floor.addEventListener('input', function () { touched = true; draw(); });
    var reset = $('kt-cash-reset');
    if (reset) reset.addEventListener('click', function () {
      var all = document.querySelectorAll('#kt-cash input'); for (var i = 0; i < all.length; i++) all[i].value = all[i].defaultValue; draw();
    });
    var clear = $('kt-cash-clear');
    if (clear) clear.addEventListener('click', function () {
      var all = host.querySelectorAll('input'); for (var i = 0; i < all.length; i++) all[i].value = '0'; open.value = '0'; touched = true; draw(); open.focus();
    });
    draw();
  }

  /* ---- 4. what a close costs ---- */
  function closeCost() {
    var out = $('kt-close-out'); if (!out) return;
    var f = { p: $('kt-people'), h: $('kt-hours'), d: $('kt-cdays'), r: $('kt-rate'), t: $('kt-target') }, touched = false;
    function draw() {
      var p = num(f.p), h = num(f.h), d = num(f.d), r = num(f.r), t = num(f.t);
      if (!(p > 0) || !(h > 0) || !(d > 0) || !(r >= 0) || !(t > 0)) { out.className = 'fl-out bad'; out.innerHTML = 'Fill in all five boxes with numbers above zero.'; return; }
      var hrs = p * h * d * 12, cost = hrs * r, hrs2 = p * h * t * 12, cost2 = hrs2 * r;
      var s = 'Your close costs<span class="big">' + money(cost) + ' a year</span>' + fmt(p, 1) + ' people x ' + fmt(h, 1) + ' hours a day x ' + fmt(d, 1) + ' days x 12 closes = <b>' + fmt(hrs, 0) + ' hours</b>. ';
      if (t < d) s += 'At ' + fmt(t, 1) + ' days it is ' + fmt(hrs2, 0) + ' hours, or ' + money(cost2) + '. The gap is <b>' + fmt(hrs - hrs2, 0) + ' hours and ' + money(cost - cost2) + ' a year</b>.';
      else s += 'Your target is not shorter than today, so there is no gap to show.';
      out.className = 'fl-out ok'; out.innerHTML = s;
      if (touched) used('close-cost', 'Close costs ' + money(cost) + ' a year');
    }
    for (var k in f) f[k].addEventListener('input', function () { touched = true; draw(); });
    draw();
  }

  function init() { copy(); links(); dso(); variance(); cash(); closeCost(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
