/* tools.gantry.work: the four ICP checks (20 Nov 2026): rescue checklist, close scorecard, parts checklist, migration test.
   Each page carries <script type="application/json" id="icpData"> with {mode, ...}. mode:
   - "check": items [{g, t, fix}] the reader ticks when true for them; unticked items are the gaps, listed in page order.
   - "quiz":  questions [{q, a:[3 answers], gap}] scored 0, 1, 2 (2 = the weak answer); bands [{max, name, v}].
   The result is computed in the browser; nothing is sent anywhere. GA4: icp_start, icp_result {tool, score, band}. */
(function () {
  'use strict';
  var el = document.getElementById('icpData'); if (!el) return;
  var D = JSON.parse(el.textContent), root = document.getElementById('icpTool'), out = document.getElementById('icpResult');
  var tool = D.tool, started = false;
  function ev(n, p) { try { window.gtag('event', n, p); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function start() { if (!started) { started = true; ev('icp_start', { tool: tool }); } }
  function band(score) { for (var i = 0; i < D.bands.length; i++) if (score <= D.bands[i].max) return D.bands[i]; return D.bands[D.bands.length - 1]; }
  function show(head, big, b, gaps, gapHead) {
    out.innerHTML = '<div class="icp-res-in"><p class="icp-eye">' + esc(head) + '</p><p class="icp-big">' + big + '</p>' +
      (b ? '<h3 class="icp-band">' + esc(b.name) + '</h3><p>' + esc(b.v) + '</p>' : '') +
      (gaps && gaps.length ? '<p class="icp-eye">' + esc(gapHead) + '</p><ol class="icp-gaps">' + gaps.map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('') + '</ol>' : '') +
      '<a class="cta icp-book" href="' + esc(D.book) + '">' + esc(D.bookLabel) + '</a>' +
      '<p class="icp-small">' + esc(D.bookNote) + '</p></div>';
    out.hidden = false;
    try { if (window.gantryResult) window.gantryResult(D.title + ': ' + head + ' ' + big.replace(/<[^>]+>/g, '') + (b ? ' (' + b.name + ')' : '')); } catch (e) {}
    ev('icp_result', { tool: tool, score: big.replace(/<[^>]+>/g, ''), band: b ? b.name : '' });
    out.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  if (D.mode === 'check') {
    var html = '', g = null;
    D.items.forEach(function (it, i) {
      if (it.g !== g) { if (g !== null) html += '</div>'; g = it.g; html += '<div class="icp-group"><p class="icp-gh">' + esc(g) + '</p>'; }
      html += '<label class="icp-row"><input type="checkbox" data-i="' + i + '"><span>' + esc(it.t) + '</span></label>';
    });
    html += '</div><button type="button" class="cta icp-go" id="icpGo">' + esc(D.goLabel) + '</button>';
    root.innerHTML = html;
    root.addEventListener('change', start);
    document.getElementById('icpGo').addEventListener('click', function () {
      start();
      var boxes = root.querySelectorAll('input[type=checkbox]'), gaps = [], yes = 0;
      [].forEach.call(boxes, function (b) { if (b.checked) yes++; else gaps.push(D.items[+b.getAttribute('data-i')].fix); });
      var missing = D.items.length - yes;
      show(D.scoreHead, missing + '<small> of ' + D.items.length + ' missing</small>', band(missing), gaps.slice(0, 5), D.gapHead);
    });
  }

  if (D.mode === 'quiz') {
    var h = '';
    D.questions.forEach(function (q, i) {
      h += '<fieldset class="icp-q"><legend><span>' + (i + 1) + '.</span> ' + esc(q.q) + '</legend>';
      q.a.forEach(function (a, j) { h += '<label class="icp-opt"><input type="radio" name="q' + i + '" value="' + j + '"><span>' + esc(a) + '</span></label>'; });
      h += '</fieldset>';
    });
    h += '<p class="icp-miss" id="icpMiss" hidden></p><button type="button" class="cta icp-go" id="icpGo">' + esc(D.goLabel) + '</button>';
    root.innerHTML = h;
    root.addEventListener('change', start);
    document.getElementById('icpGo').addEventListener('click', function () {
      start();
      var score = 0, gaps = [], left = 0;
      D.questions.forEach(function (q, i) {
        var c = root.querySelector('input[name=q' + i + ']:checked');
        if (!c) { left++; return; }
        var v = +c.value; score += v; if (v === 2) gaps.push(q.gap);
      });
      var miss = document.getElementById('icpMiss');
      if (left) { miss.textContent = left + (left === 1 ? ' question is' : ' questions are') + ' still open. Answer every one for a fair score.'; miss.hidden = false; return; }
      miss.hidden = true;
      show(D.scoreHead, score + '<small> / ' + (D.questions.length * 2) + '</small>', band(score), gaps.slice(0, 5), D.gapHead);
    });
  }

})();
