/* Flagship guides on tools.gantry.work (added 2026-11-11): the stepped InvoiceNow route, the Peppol ID builder
   and the three-way match checker. Nothing typed here is sent anywhere. Views and first use are tracked by /track.js. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var still = false;
  try { still = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
  function inView(el, cb) {
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { io.disconnect(); cb(); } }); }, { threshold: 0.35 });
    io.observe(el);
  }

  /* ---- 1. stepped route (InvoiceNow) ---- */
  function route() {
    var fig = $('fl-route'); if (!fig) return;
    var steps = fig.querySelectorAll('.fl-step'), n = steps.length, cur = 1, timer = null;
    var pp = $('fl-pp'), live = $('fl-live');
    function show(i, say) {
      cur = ((i - 1 + n) % n) + 1;
      fig.setAttribute('data-step', String(cur));
      for (var k = 0; k < n; k++) steps[k].classList.toggle('on', k === cur - 1);
      if (say && live) live.textContent = 'Stop ' + cur + ' of ' + n + ': ' + steps[cur - 1].textContent.replace(/\s+/g, ' ').trim();
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } if (pp) pp.textContent = 'Play'; }
    function play() { stop(); timer = setInterval(function () { show(cur + 1, false); }, 3200); if (pp) pp.textContent = 'Pause'; }
    fig.classList.add('is-live');
    show(1, false);
    for (var k = 0; k < n; k++) (function (i) { steps[i].addEventListener('click', function () { stop(); show(i + 1, true); }); })(k);
    $('fl-prev').addEventListener('click', function () { stop(); show(cur - 1, true); });
    $('fl-next').addEventListener('click', function () { stop(); show(cur + 1, true); });
    pp.addEventListener('click', function () { if (timer) stop(); else { show(cur + 1, false); play(); } });
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); });
    if (!still) inView(fig, play);
  }

  /* ---- 2. Peppol ID builder ---- */
  function peppol() {
    var inp = $('fl-uen'), out = $('fl-pid'); if (!inp || !out) return;
    function draw() {
      var u = inp.value.toUpperCase().replace(/[^0-9A-Z]/g, '');
      if (!u) { out.className = 'fl-out'; out.innerHTML = 'Type a UEN above to see the Peppol ID it becomes.'; return; }
      if (!/^[0-9A-Z]{9,10}$/.test(u) || !/[A-Z]$/.test(u)) {
        out.className = 'fl-out bad';
        out.innerHTML = 'That does not look like a UEN yet. Copy it from your ACRA business profile: letters and numbers only, ending in a letter.';
        return;
      }
      out.className = 'fl-out ok';
      out.innerHTML = 'Peppol ID for this UEN<span class="big">0195:SGUEN' + u + '</span>The ID only works after your solution provider registers it in the SG Peppol Directory.';
    }
    inp.addEventListener('input', draw); draw();
  }

  /* ---- 3. three-way match checker ---- */
  function money(v) { return 'S$' + (Math.round(v * 100) / 100).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function qty(v) { return (Math.round(v * 100) / 100).toLocaleString('en-SG', { maximumFractionDigits: 2 }); }
  function match() {
    var fig = $('fl-match'); if (!fig) return;
    var ids = ['poq', 'pop', 'grq', 'inq', 'inp', 'tol'], f = {}, touched = false;
    ids.forEach(function (k) { f[k] = $('fl-' + k); });
    var out = $('fl-check');
    function txt(id, s) { var e = $(id); if (e) e.textContent = s; }
    function mark(id, ok) {
      var e = $(id); if (!e) return;
      var was = / ok$| ok /.test(' ' + e.getAttribute('class') + ' '), base = 'mk ' + e.getAttribute('data-c') + (ok ? ' ok' : ' bad');
      e.setAttribute('class', base);
      if (touched && !still && was !== ok) { void e.getBoundingClientRect(); e.setAttribute('class', base + ' pulse'); }
    }
    function val(id, ok, s) { var e = $(id); if (!e) return; e.textContent = s; e.setAttribute('class', 'ckv ' + e.getAttribute('data-c') + (ok ? '' : ' bad')); }
    function draw() {
      var v = {}, bad = false;
      ids.forEach(function (k) { v[k] = parseFloat(f[k].value); if (!isFinite(v[k]) || v[k] < 0) bad = true; });
      if (bad) { out.className = 'fl-out bad'; out.innerHTML = 'Fill in all six boxes with numbers of zero or more.'; return; }
      var d1 = v.grq - v.poq, d2 = v.inq - v.grq, pd = v.inp - v.pop, lim = v.pop * v.tol / 100;
      var priceOk = Math.abs(pd) <= lim + 1e-9, over = pd > lim + 1e-9;
      var payQ = Math.min(v.inq, v.grq), payP = over ? v.pop : v.inp;
      var bill = v.inq * v.inp, pay = payQ * payP, gap = bill - pay;
      txt('sv-poq', qty(v.poq)); txt('sv-pop', money(v.pop)); txt('sv-grq', qty(v.grq)); txt('sv-inq', qty(v.inq)); txt('sv-inp', money(v.inp));
      mark('mk1', d1 === 0); mark('mk2', d2 === 0); mark('mk3', priceOk);
      val('cv1', d1 === 0, d1 === 0 ? 'same' : (d1 < 0 ? qty(-d1) + ' short' : qty(d1) + ' extra'));
      val('cv2', d2 === 0, d2 === 0 ? 'same' : (d2 > 0 ? qty(d2) + ' billed, not received' : qty(-d2) + ' not billed yet'));
      val('cv3', priceOk, pd === 0 ? 'same' : (priceOk ? 'within tolerance' : money(Math.abs(pd)) + (pd > 0 ? ' higher' : ' lower')));
      var clean = d1 === 0 && d2 === 0 && priceOk;
      var vb = $('sv-vb'); if (vb) vb.setAttribute('class', 'vb' + (gap > 0.004 || !clean ? ' bad' : ''));
      txt('sv-vt', gap > 0.004 ? 'Pay ' + money(pay) + ' of ' + money(bill) : 'Pay ' + money(pay));
      var L = [];
      if (clean) L.push('All three documents agree. Pay the invoice in full.');
      if (d2 > 0) L.push('Billed for ' + qty(d2) + ' more than arrived. Pay for the ' + qty(v.grq) + ' you received and ask the supplier for a credit note for the rest.');
      if (d2 < 0) L.push('Billed for ' + qty(-d2) + ' fewer than arrived. Pay this invoice and expect a second one for the balance. Keep the receipt open until it comes.');
      if (over) L.push('Unit price is ' + money(pd) + ' above the order. Pay at the order price and hold the difference until the buyer confirms the new price in writing, or the supplier sends a credit note.');
      if (pd > 0 && priceOk) L.push('Unit price is ' + money(pd) + ' above the order, inside your tolerance. Pay it, and tell the buyer so the next order carries the right price.');
      if (pd < 0) L.push('Unit price is ' + money(-pd) + ' below the order. Pay the invoice as billed and update your price list.');
      if (d1 < 0) L.push(qty(-d1) + ' ordered but not delivered. Decide today: keep the order open for the balance, or close it so nobody receives against it later.');
      if (d1 > 0) L.push(qty(d1) + ' more arrived than you ordered. Decide whether to keep or return the extra before any invoice for it is paid.');
      var head = 'Pay <b>' + money(pay) + '</b>' + (gap > 0.004 ? ' of the ' + money(bill) + ' billed. Hold or claim back <b>' + money(gap) + '</b>.' : '.') + ' <span class="fl-note">Before GST.</span>';
      out.className = 'fl-out ' + (clean ? 'ok' : 'bad');
      out.innerHTML = head + '<ul><li>' + L.join('</li><li>') + '</li></ul>';
      if (touched) { try { if (window.gantryResult) window.gantryResult('3-way check: pay ' + money(pay) + ' of ' + money(bill)); } catch (e) {} }
    }
    ids.forEach(function (k) { f[k].addEventListener('input', function () { touched = true; fig.classList.remove('is-anim'); draw(); }); });
    var again = $('fl-again');
    if (again) again.addEventListener('click', function () {
      var d = { poq: 100, pop: '12.00', grq: 96, inq: 100, inp: '12.00', tol: 0 };
      ids.forEach(function (k) { f[k].value = d[k]; }); touched = false; draw();
      if (!still) { fig.classList.remove('is-anim'); void fig.offsetWidth; fig.classList.add('is-anim'); }
    });
    draw();
    if (!still) inView(fig, function () { fig.classList.add('is-anim'); });
  }

  function init() { route(); peppol(); match(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
