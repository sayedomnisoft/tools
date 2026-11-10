/* WATI guide pages (wati-*.html): CTA tracking, saved checklists, the two calculators, and a slim reminder bar.
   Prices are WATI's published Singapore prices as read on 10 Nov 2026 (wati.io/pricing). Update P when they change. */
(function () {
  'use strict';
  var P = { growthY: 119, growthM: 159, proY: 329, proM: 429, extraUser: 35, growthUsers: 3, proUsers: 5, extraNumber: 39, mktg: 0.0937, util: 0.0205, days: 22 };
  var page = location.pathname.replace(/^\/+|\/+$/g, '').replace(/\.html$/, '');
  var $ = function (id) { return document.getElementById(id); };
  var ev = function (n, p) { try { p = p || {}; p.page = page; p.tool_name = page; p.tool_category = 'guide'; gtag('event', n, p); } catch (e) {} };
  var ls = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  var money = function (n) { return 'S$' + Math.round(n).toLocaleString('en-SG'); };
  var num = function (id) { var el = $(id); if (!el) return 0; var v = parseFloat(String(el.value).replace(/,/g, '')); return isFinite(v) && v > 0 ? v : 0; };
  var AFF = (document.body.getAttribute('data-aff') || '');

  // Which button was clicked (top, result, bottom, bar). track.js already counts the click itself as affiliate_click.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[data-cta]') : null;
    if (a) ev('wati_cta', { cta: a.getAttribute('data-cta') });
  }, true);

  // Saved checklists: <ul class="cl" data-list="name"> with <input type="checkbox" data-k="id">
  Array.prototype.forEach.call(document.querySelectorAll('[data-list]'), function (box) {
    var key = 'wati_cl_' + box.getAttribute('data-list'), saved = {};
    try { saved = JSON.parse(ls.get(key) || '{}') || {}; } catch (e) {}
    var boxes = box.querySelectorAll('input[type=checkbox][data-k]');
    function paint(fromUser) {
      var done = 0;
      Array.prototype.forEach.call(boxes, function (c) { if (c.checked) done++; });
      var pr = document.querySelector('[data-progress="' + box.getAttribute('data-list') + '"]');
      if (pr) { pr.querySelector('span').textContent = done + ' of ' + boxes.length + ' done'; pr.querySelector('i').style.width = Math.round(100 * done / boxes.length) + '%'; }
      if (typeof window.watiListChanged === 'function') window.watiListChanged(box.getAttribute('data-list'), done, boxes.length, boxes);
      if (fromUser) ev('wati_check', { list: box.getAttribute('data-list'), done: done, of: boxes.length });
    }
    Array.prototype.forEach.call(boxes, function (c) {
      c.checked = !!saved[c.getAttribute('data-k')];
      c.addEventListener('change', function () { saved[c.getAttribute('data-k')] = c.checked ? 1 : 0; ls.set(key, JSON.stringify(saved)); paint(true); });
    });
    paint(false);
  });

  function planFor(people, monthly, needPro) {
    var pro = needPro || people > P.growthUsers, extra = Math.max(0, people - P.proUsers);
    var base = pro ? (monthly ? P.proM : P.proY) : (monthly ? P.growthM : P.growthY);
    return { name: pro ? 'Pro' : 'Growth', base: base, extra: extra, month: base + extra * P.extraUser };
  }
  window.watiPlanFor = planFor;

  // ---------- wati-fit-check ----------
  if ($('fitBtn')) {
    $('fitBtn').addEventListener('click', function () {
      var people = Math.max(1, Math.round(num('fPeople')) || 1), share = $('fShare').value, chats = num('fChats');
      var missed = num('fMissed'), value = num('fValue'), buy = Math.min(10, num('fBuy'));
      var bc = +$('fBroadcast').value, tr = +$('fTrace').value;
      var score = (people >= 6 ? 4 : people >= 4 ? 3 : people >= 2 ? 2 : 0) + ({ phone: 2, linked: 1, own: 3, tool: 0 })[share] + (chats >= 60 ? 2 : chats >= 20 ? 1 : 0) + bc + tr;
      var risk = missed * (buy / 10) * value * 52 / 12, hasMoney = missed > 0 && value > 0 && buy > 0;
      var pl = planFor(people, false, false), out = $('out'), h = '', verdict;
      var math = hasMoney
        ? '<div class="math">Your numbers: ' + missed + ' missed or late ' + (missed === 1 ? 'chat' : 'chats') + ' a week × ' + buy + ' in 10 who would have bought × ' + money(value) + ' an order × 52 weeks ÷ 12 months = about <b>' + money(risk) + ' a month</b> at risk.<br>A shared inbox for ' + people + (people === 1 ? ' person' : ' people') + ': <b>' + money(pl.month) + ' a month</b> on WATI\'s ' + pl.name + ' plan, billed yearly' + (pl.extra ? ' (' + money(pl.base) + ' plus ' + pl.extra + ' extra users at ' + money(P.extraUser) + ')' : '') + ', before Meta\'s per-message charges.</div>'
        : '<p class="src">Fill in the three money boxes (missed chats, order value, how many would have bought) to see whether it pays for itself in your own numbers.</p>';
      if (share === 'tool') {
        verdict = 'has_tool';
        h = '<h3>You already have the hard part</h3><p>You are on a shared inbox tool, so the question is price and fit, not whether you need one. Put your team size into the price page and compare it with what you pay now, line by line.</p><p><a class="cta-ghost" href="wati-pricing-singapore.html">Compare the price for ' + people + (people === 1 ? ' person' : ' people') + ' &rarr;</a></p>';
      } else if ((hasMoney && risk >= pl.month) || score >= 7) {
        verdict = 'fit';
        h = '<h3>A shared inbox is likely to pay for itself</h3>' + math +
          '<p>' + (hasMoney && risk >= pl.month ? 'On your own numbers, the chats you lose are worth more than the plan costs. ' : 'With ' + people + ' people replying' + (share === 'own' ? ' from their own numbers' : '') + ', nobody can see the whole picture, and that is where replies get lost. ') +
          'You do not have to decide today. The 7-day trial runs on your own number, so you can test whether your team would use it before any money moves.</p>' +
          '<p><b>What we would do next, in this order:</b></p><ol style="margin:0 0 12px 20px"><li><a href="wati-pricing-singapore.html">Check the full yearly cost for your team</a> (2 minutes).</li><li><a href="wati-free-trial-plan.html">Open the 7-day test plan</a> so the trial week answers your questions.</li><li>Start the trial when you have a free week.</li></ol>' +
          '<a class="cta" data-cta="result" href="' + AFF + '" target="_blank" rel="sponsored noopener" style="display:block;text-align:center">See the 7-day trial on WATI\'s site</a>' +
          '<p class="disc"><b>What happens when you click:</b> WATI\'s own website opens in a new tab. "Try for Free" is at the top. WATI\'s trial article says no payment details are needed to start. Affiliate link: if you sign up to WATI through it, The Gantry may earn a commission at no extra cost to you.</p>';
      } else if (people === 1) {
        verdict = 'stay_free';
        h = '<h3>Stay on the free WhatsApp Business app for now</h3>' + math +
          '<p>One person replying does not need a shared inbox. Paying for one now would add a monthly bill without fixing anything. Three free settings in the WhatsApp Business app do most of the work:</p><ul><li><b>Quick replies</b> for the five questions you answer every day.</li><li><b>Labels</b> such as New order, Waiting for payment and To follow up, so nothing sits unread.</li><li><b>An away message</b> with your reply hours, so customers know when to expect an answer.</li></ul><p>Come back to this check when a second person starts replying, or when you start sending the same update to many customers.</p>';
      } else {
        verdict = 'borderline';
        h = '<h3>Borderline: fix the free things first</h3>' + math +
          '<p>You are close to the point where a shared inbox makes sense, but not clearly past it. Try these for two weeks, then count the missed chats again:</p><ul><li><b>One owner per shift.</b> Name who answers customer WhatsApp in each half of the day.</li><li><b>Labels</b> in the WhatsApp Business app for New, Waiting for customer and Done.</li><li><b>Quick replies</b> for prices, opening hours and delivery questions.</li><li><b>A tally.</b> Each time a customer chases you for a reply, mark it. That number is what a shared inbox has to beat.</li></ul><p>If the tally is still above a few a week, run this check again with the real number. <a href="wati-pricing-singapore.html">See what it would cost for ' + people + ' people</a> so you know the figure to beat.</p>';
      }
      out.innerHTML = h; out.className = 'on';
      try { out.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) {}
      ev('wati_fit_result', { verdict: verdict, score: score, people: people, at_risk: Math.round(risk) });
    });
  }

  // ---------- wati-pricing-singapore ----------
  if ($('prPeople')) {
    var calc = function (fromUser) {
      var people = Math.max(1, Math.round(num('prPeople')) || 1), monthly = $('prBill').value === 'm';
      var needPro = false; Array.prototype.forEach.call(document.querySelectorAll('.prNeed'), function (c) { if (c.checked) needPro = true; });
      var nums = Math.round(num('prNums')), mk = num('prMk'), ut = num('prUt');
      var pl = planFor(people, monthly, needPro), meta = mk * P.mktg + ut * P.util, total = pl.month + nums * P.extraNumber + meta;
      $('tPlan').textContent = pl.name; $('tMonth').textContent = money(total); $('tYear').textContent = money(total * 12);
      $('tDay').textContent = 'S$' + (total / people / P.days).toFixed(2);
      var why = pl.name === 'Growth' ? 'Growth covers up to ' + P.growthUsers + ' users.' : (people > P.growthUsers ? 'Growth stops at ' + P.growthUsers + ' users and cannot add more, so ' + people + ' people need Pro.' : 'You ticked something that is only in Pro.');
      var lines = [pl.name + ' plan, ' + (monthly ? 'billed monthly' : 'billed yearly') + ': ' + money(pl.base) + ' a month'];
      if (pl.extra) lines.push(pl.extra + ' extra users × ' + money(P.extraUser) + ': ' + money(pl.extra * P.extraUser) + (monthly ? ' (extra-user price as shown on the yearly view; check the monthly view on WATI)' : ''));
      if (nums) lines.push(nums + ' extra WhatsApp number' + (nums > 1 ? 's' : '') + ' × ' + money(P.extraNumber) + ': ' + money(nums * P.extraNumber));
      if (meta) lines.push('Message charges (estimate at Meta\'s Singapore rates): S$' + meta.toFixed(2));
      var save = !monthly ? '' : ' Paying yearly instead would be ' + money((planFor(people, false, needPro).month - pl.month) * -12) + ' less over 12 months.';
      $('prWhy').innerHTML = '<b>' + why + '</b> ' + lines.join(' · ') + '.' + save;
      if (fromUser) ev('wati_price_calc', { people: people, plan: pl.name, billing: monthly ? 'monthly' : 'yearly', month: Math.round(total) });
    };
    var t; Array.prototype.forEach.call(document.querySelectorAll('#prForm input, #prForm select'), function (el) {
      el.addEventListener('input', function () { calc(false); clearTimeout(t); t = setTimeout(function () { calc(true); }, 1500); });
      el.addEventListener('change', function () { calc(false); });
    });
    calc(false);
  }

  // ---------- wati-go-live-checklist: readiness line ----------
  window.watiListChanged = function (list, done, of, boxes) {
    if (list !== 'golive') return; var el = $('out'); if (!el) return;
    var missing = []; Array.prototype.forEach.call(boxes, function (c) { if (!c.checked) missing.push(c.getAttribute('data-name')); });
    if (!done) { el.className = ''; el.innerHTML = ''; return; }
    el.className = 'on';
    el.innerHTML = done === of ? '<h3>Ready: 8 of 8</h3><p>Nothing on this list should stop you on the day. Connect the number from a laptop, in Chrome, signed in to both Facebook and WATI.</p>'
      : done >= of - 2 ? '<h3>Nearly ready: ' + done + ' of ' + of + '</h3><p>Sort these before you pay, because each one can stall the setup: <b>' + missing.join('; ') + '</b>.</p>'
      : '<h3>Not yet: ' + done + ' of ' + of + '</h3><p>Still open: <b>' + missing.join('; ') + '</b>. The trial does not need any of these, so you can test the inbox on your own number while you sort them out.</p>';
  };
  (function () { var b = document.querySelector('[data-list="golive"]'); if (b) { var bx = b.querySelectorAll('input[data-k]'), d = 0; Array.prototype.forEach.call(bx, function (c) { if (c.checked) d++; }); window.watiListChanged('golive', d, bx.length, bx); } })();

  // ---------- slim reminder bar, once the reader is 40% down the page ----------
  if (AFF && document.body.getAttribute('data-bar') !== 'off') {
    var shown = false, closed = false; try { closed = sessionStorage.getItem('wati_bar_x') === '1'; } catch (e) {}
    var onScroll = function () {
      if (shown || closed || $('gantry-notice')) return;
      var h = document.documentElement.scrollHeight - window.innerHeight;
      if (h < 600 || window.scrollY / h < 0.4) return;
      shown = true;
      var bar = document.createElement('div'); bar.id = 'watibar'; bar.className = 'on';
      bar.innerHTML = '<div class="in"><p>' + (document.body.getAttribute('data-bartext') || 'The 7-day trial runs on your own number.') + '<small>Affiliate link. Opens WATI\'s site in a new tab.</small></p><a data-cta="bar" href="' + AFF + '" target="_blank" rel="sponsored noopener">' + (document.body.getAttribute('data-barbtn') || 'See the trial on WATI') + '</a><button type="button" aria-label="Close">×</button></div>';
      document.body.appendChild(bar); document.body.style.paddingBottom = '70px';
      bar.querySelector('button').addEventListener('click', function () { bar.parentNode.removeChild(bar); document.body.style.paddingBottom = ''; closed = true; try { sessionStorage.setItem('wati_bar_x', '1'); } catch (e) {} ev('wati_bar_close'); });
      ev('wati_bar_show');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
  }
})();
