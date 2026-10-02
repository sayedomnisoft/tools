(function () {
'use strict';
const MODE = window.CALC_MODE === 'markup' ? 'markup' : 'margin';
const PCT = MODE === 'margin' ? 'Margin' : 'Markup';
const PAGES = { margin: ['profit-margin-calculator.html', 'Profit margin calculator'], markup: ['markup-calculator.html', 'Markup calculator'] };
const $ = id => document.getElementById(id);
const ev = (n, p) => { try { gtag('event', n, Object.assign({ calc_mode: MODE }, p || {})); } catch (e) {} };
const store = {
  getJ(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  setJ(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => { const s = String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''); if (s === '' || s === '-' || s === '.') return NaN; const n = parseFloat(s); return isFinite(n) ? n : NaN; };
const r2 = x => Math.round((x + Number.EPSILON) * 100) / 100;
const cur = () => ($('cur') && $('cur').value || '').trim();
const money = x => { if (!isFinite(x)) return '—'; const c = cur(); return (x < 0 ? '−' : '') + c + Math.abs(x).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
const pct = x => isFinite(x) ? (Math.round(x * 10000) / 100).toLocaleString('en-SG', { maximumFractionDigits: 2 }) + '%' : '—';
// margin m and markup k are fractions
const m2k = m => m / (1 - m), k2m = k => k / (1 + k);
const toFrac = v => MODE === 'margin' ? v / 100 : k2m(v / 100); // user % -> margin fraction

$('app').innerHTML = `
<nav class="pc-tabs">${Object.keys(PAGES).map(k => `<a href="${PAGES[k][0]}"${k === MODE ? ' class="on" aria-current="page"' : ''}>${PAGES[k][1]}</a>`).join('')}<a href="invoice-generator.html">Invoice generator</a></nav>
<div class="pc">
 <div class="box">
  <h2>Quick calculator</h2>
  <p class="hint">Fill in any two of cost, selling price and ${PCT.toLowerCase()}; the third is worked out (highlighted). Use prices excluding GST.</p>
  <div class="g4">
   <div class="f"><label for="c">Cost</label><input type="text" inputmode="decimal" id="c" data-q="c" placeholder="e.g. 35.00"></div>
   <div class="f"><label for="p">Selling price</label><input type="text" inputmode="decimal" id="p" data-q="p" placeholder="e.g. 50.00"></div>
   <div class="f"><label for="x">${PCT} %</label><input type="text" inputmode="decimal" id="x" data-q="x" placeholder="${MODE === 'margin' ? 'e.g. 30' : 'e.g. 40'}"></div>
   <div class="f"><label for="cur">Currency</label><input type="text" id="cur" maxlength="5" value="S$"></div>
  </div>
  <div class="tiles">
   <div class="tile"><b id="tProfit">—</b><span>Profit per unit</span></div>
   <div class="tile"><b id="tMargin">—</b><span>Gross margin</span></div>
   <div class="tile"><b id="tMarkup">—</b><span>Markup</span></div>
   <div class="tile"><b id="tGst">—</b><span>Price incl. <input type="text" inputmode="decimal" id="gst" value="9" aria-label="GST rate" style="width:42px;padding:2px 4px;font-size:12px;display:inline-block">% GST</span></div>
  </div>
  <div class="msg" id="qMsg"></div>
  <div class="g3" style="margin-top:14px">
   <div class="f"><label for="fixed">Break-even: fixed costs per month</label><input type="text" inputmode="decimal" id="fixed" placeholder="rent, salaries, software"></div>
   <div class="f" style="grid-column:span 2;align-self:end"><div class="sum" id="beOut" style="margin:0 0 10px">Add your monthly fixed costs to see how many units cover them.</div></div>
  </div>
 </div>

 <div class="box">
  <h2>Price a whole list</h2>
  <p class="hint">Paste your products from Excel or Google Sheets (item, cost, and current price if you have one), or upload a CSV. Every item gets a price that hits your target ${PCT.toLowerCase()}, and the ones below target are flagged. Nothing is uploaded; it all runs in your browser.</p>
  <textarea id="list" rows="7" placeholder="Item, Cost, Price&#10;A4 copier paper (box of 5), 18.20, 26.00&#10;Toner cartridge, 64.00, 89.00"></textarea>
  <div class="g4" style="margin-top:10px">
   <div class="f"><label for="tgt">Target ${PCT.toLowerCase()} %</label><input type="text" inputmode="decimal" id="tgt" value="${MODE === 'margin' ? '35' : '50'}"></div>
   <div class="f"><label for="rnd">Round prices up to</label><select id="rnd"><option value="none">No rounding</option><option value="0.05">Nearest 5 cents</option><option value="0.90">.90 endings</option><option value="0.99">.99 endings</option><option value="1">Whole dollars</option></select></div>
   <div class="f"><label for="csvIn">Or upload CSV</label><input type="file" id="csvIn" accept=".csv,text/csv,text/plain"></div>
   <div class="f"><label class="chk" style="margin-top:2px"><input type="checkbox" id="keep" checked> Never lower a current price</label><label class="chk" style="margin-top:8px"><input type="checkbox" id="incl"> Show prices incl. GST</label></div>
  </div>
  <div class="row-acts">
   <button class="b1" id="runBtn">Calculate prices</button>
   <button id="sampleBtn">Use a sample list</button>
   <button id="csvBtn">Download CSV</button>
   <button id="copyBtn">Copy for Excel</button>
  </div>
  <div class="msg" id="lMsg"></div>
  <div id="out"></div>
 </div>
</div>`;
const toastEl = document.createElement('div'); toastEl.className = 'toast hidden'; document.body.appendChild(toastEl);
const toast = m => { toastEl.textContent = m; toastEl.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.add('hidden'), 2200); };

// ---------- quick calculator ----------
const S = store.getJ('pc_state', {});
let order = Array.isArray(S.order) ? S.order.filter(k => ['c', 'p', 'x'].includes(k)).slice(-2) : [];
['c', 'p', 'x', 'cur', 'gst', 'fixed', 'tgt', 'rnd'].forEach(k => { if (S[k] !== undefined && $(k)) $(k).value = S[k]; });
if (S.list) $('list').value = S.list;
if (S.incl) $('incl').checked = true;
if (S.keep === false) $('keep').checked = false;
// a value saved for a different mode's % field is not reused
if (S.mode && S.mode !== MODE) { $('x').value = ''; $('tgt').value = MODE === 'margin' ? '35' : '50'; order = order.filter(k => k !== 'x'); }
function saveState() {
  const o = { order, mode: MODE, incl: $('incl').checked, keep: $('keep').checked, list: $('list').value.length < 20000 ? $('list').value : '' };
  ['c', 'p', 'x', 'cur', 'gst', 'fixed', 'tgt', 'rnd'].forEach(k => { o[k] = $(k).value; });
  store.setJ('pc_state', o);
}
function quick() {
  ['c', 'p', 'x'].forEach(k => $(k).classList.remove('solved'));
  $('qMsg').textContent = '';
  let c = num($('c').value), p = num($('p').value), x = num($('x').value);
  const known = order.filter(k => isFinite(num($(k).value)));
  if (known.length === 2) {
    const solve = ['c', 'p', 'x'].find(k => !known.includes(k));
    const m = isFinite(x) ? toFrac(x) : NaN;
    if (solve === 'x') {
      if (p > 0) { x = MODE === 'margin' ? (p - c) / p * 100 : (c > 0 ? (p - c) / c * 100 : NaN); }
      else x = NaN;
      $('x').value = isFinite(x) ? String(r2(x)) : '';
    } else if (solve === 'p') {
      if (!(m < 1)) { $('qMsg').textContent = 'A margin must be below 100%: no price can make the profit equal to the whole price.'; p = NaN; }
      else p = c / (1 - m);
      $('p').value = isFinite(p) ? String(r2(p)) : '';
    } else {
      c = isFinite(m) ? p * (1 - m) : NaN;
      $('c').value = isFinite(c) ? String(r2(c)) : '';
    }
    $(solve).classList.add('solved');
  }
  c = num($('c').value); p = num($('p').value);
  const ok = isFinite(c) && isFinite(p) && p > 0;
  const profit = ok ? p - c : NaN, margin = ok ? profit / p : NaN, markup = ok && c > 0 ? profit / c : NaN;
  const g = num($('gst').value);
  $('tProfit').textContent = money(profit);
  $('tMargin').textContent = pct(margin);
  $('tMarkup').textContent = pct(markup);
  $('tGst').textContent = ok ? money(p * (1 + (isFinite(g) ? g : 0) / 100)) : '—';
  if (ok && profit < 0) $('qMsg').textContent = 'The selling price is below cost: every sale loses ' + money(-profit) + '.';
  const F = num($('fixed').value);
  if (isFinite(F) && F > 0) {
    if (ok && profit > 0) { const u = Math.ceil(F / profit - 1e-9); $('beOut').innerHTML = `Sell <b>${u.toLocaleString('en-SG')} units</b> a month (<b>${money(u * p)}</b> in sales) to cover <b>${money(F)}</b> of fixed costs. Every unit after that adds ${money(profit)} of profit.`; }
    else $('beOut').textContent = 'Enter a cost and a selling price above cost to see your break-even.';
  } else $('beOut').textContent = 'Add your monthly fixed costs to see how many units cover them.';
  saveState();
}
document.querySelectorAll('[data-q]').forEach(el => el.addEventListener('input', () => {
  const k = el.dataset.q; order = order.filter(o => o !== k);
  if (el.value.trim() !== '') order.push(k);
  order = order.slice(-2); quick();
}));
['cur', 'gst', 'fixed'].forEach(id => $(id).addEventListener('input', () => { quick(); if (lastRows) runList(false); }));

// ---------- price list ----------
function parseCSV(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(l => l.trim() !== '');
  if (!lines.length) return [];
  const d = lines[0].includes('\t') ? '\t' : (lines[0].split(';').length > lines[0].split(',').length ? ';' : ',');
  return lines.map(line => {
    const out = []; let cell = '', q = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (q) { if (ch === '"') { if (line[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += ch; }
      else if (ch === '"') q = true; else if (ch === d) { out.push(cell); cell = ''; } else cell += ch;
    }
    out.push(cell); return out.map(s => s.trim());
  });
}
function mapCols(rows) {
  const h = rows[0].map(s => s.toLowerCase());
  const find = re => h.findIndex(s => re.test(s));
  const ci = find(/cost|buy|purchase|cogs|landed/), pi = h.findIndex(s => /price|sell|retail|rrp|selling/.test(s) && !/cost|buy|purchase/.test(s));
  const isHeader = ci >= 0 || (pi >= 0 && rows[0].every(s => !isFinite(num(s))));
  if (isHeader) {
    let ni = find(/item|product|name|description|sku|code/); if (ni < 0) ni = [0, 1, 2].find(i => i !== ci && i !== pi);
    return { start: 1, ni, ci: ci >= 0 ? ci : 1, pi };
  }
  // no header: first text column is the name, then cost, then price
  const r = rows[0]; const ni = r.findIndex(s => !isFinite(num(s)));
  const nums = r.map((s, i) => i).filter(i => i !== ni && isFinite(num(r[i])));
  return { start: 0, ni: ni < 0 ? -1 : ni, ci: nums[0], pi: nums.length > 1 ? nums[1] : -1 };
}
function roundUp(P, mode) {
  if (!isFinite(P)) return P;
  if (mode === '0.05') return Math.ceil(P * 20 - 1e-9) / 20;
  if (mode === '1') return Math.ceil(P - 1e-9);
  if (mode === '0.90' || mode === '0.99') { const e = mode === '0.90' ? 0.9 : 0.99; let v = Math.floor(P) + e; if (v < P - 1e-9) v += 1; return r2(v); }
  return Math.ceil(r2(P * 100) - 1e-9) / 100;
}
let lastRows = null, counted = false;
function runList(user) {
  $('lMsg').textContent = ''; $('out').innerHTML = '';
  const rows = parseCSV($('list').value);
  if (!rows.length) { if (user) $('lMsg').textContent = 'Paste a list first, or click "Use a sample list".'; lastRows = null; return; }
  const tv = num($('tgt').value);
  const m = isFinite(tv) ? toFrac(tv) : NaN;
  if (!(m >= 0 && m < 1)) { $('lMsg').textContent = MODE === 'margin' ? 'Enter a target margin between 0 and 99%.' : 'Enter a target markup of 0% or more.'; return; }
  const map = mapCols(rows), keep = $('keep').checked, rnd = $('rnd').value, g = num($('gst').value), gf = 1 + (isFinite(g) ? g : 0) / 100, incl = $('incl').checked;
  const items = []; let skipped = 0;
  for (let i = map.start; i < rows.length; i++) {
    const r = rows[i], c = num(r[map.ci]);
    if (!isFinite(c) || c < 0) { skipped++; continue; }
    const name = map.ni >= 0 ? r[map.ni] : 'Item ' + (items.length + 1);
    const p = map.pi >= 0 ? num(r[map.pi]) : NaN;
    const curM = isFinite(p) && p > 0 ? (p - c) / p : NaN;
    let sug = roundUp(c / (1 - m), rnd); const kept = keep && isFinite(p) && p >= sug; if (kept) sug = p;
    const newM = sug > 0 ? (sug - c) / sug : NaN;
    items.push({ name, c, p, curM, sug, newM, kept, low: isFinite(curM) && curM < m - 1e-9 });
  }
  if (!items.length) { $('lMsg').textContent = 'No rows with a cost were found. Put the item in the first column and the cost in the second, or add a header row such as "Item, Cost, Price".'; lastRows = null; return; }
  lastRows = { items, m, incl, gf, tv };
  const withP = items.filter(x => isFinite(x.curM)), low = items.filter(x => x.low);
  const avg = a => a.length ? a.reduce((s, x) => s + x, 0) / a.length : NaN;
  const fmtPct = f => MODE === 'margin' ? pct(f) : pct(m2k(f));
  const showP = v => money(incl ? v * gf : v);
  let s = `<div class="sum"><b>${items.length}</b> items priced for a <b>${pct(tv / 100)}</b> ${PCT.toLowerCase()}${MODE === 'markup' ? ` (a ${pct(m)} margin)` : ''}.`;
  if (withP.length) s += ` <b>${low.length}</b> of ${withP.length}${withP.length < items.length ? ' with a current price' : ''} ${low.length === 1 ? 'is' : 'are'} below target. Average ${PCT.toLowerCase()} now <b>${fmtPct(avg(withP.map(x => x.curM)))}</b>, after repricing <b>${fmtPct(avg(withP.map(x => x.newM)))}</b>.`;
  const raise = items.filter(x => !x.kept && isFinite(x.p) && x.sug > x.p).length;
  if (withP.length) s += ` <b>${raise}</b> price${raise === 1 ? '' : 's'} to raise${keep ? '; prices already above target are kept' : ''}.`;
  if (skipped) s += ` ${skipped} row${skipped > 1 ? 's' : ''} without a cost skipped.`;
  if (incl) s += ' Prices shown include GST.';
  s += '</div>';
  s += `<div class="tw"><table class="pt"><thead><tr><th>Item</th><th>Cost</th><th>Current price</th><th>Current ${PCT.toLowerCase()}</th><th>Suggested price</th><th>New ${PCT.toLowerCase()}</th><th>Change</th></tr></thead><tbody>`;
  s += items.map(x => `<tr class="${x.low ? 'low' : ''}"><td>${esc(x.name)}</td><td>${money(x.c)}</td><td>${isFinite(x.p) ? showP(x.p) : '—'}</td><td class="${x.low ? 'bad' : (isFinite(x.curM) ? 'good' : '')}">${isFinite(x.curM) ? fmtPct(x.curM) : '—'}</td><td class="${x.kept ? '' : 'new'}">${showP(x.sug)}</td><td>${fmtPct(x.newM)}</td><td>${x.kept ? 'keep' : isFinite(x.p) ? (x.sug - x.p >= 0 ? '+' : '') + money(r2((x.sug - x.p) * (incl ? gf : 1))) : '—'}</td></tr>`).join('');
  s += '</tbody></table></div>';
  $('out').innerHTML = s;
  saveState();
  if (user) { ev('pc_list_run', { items: items.length, low: low.length }); if (!counted) { counted = true; countUse(); } }
}
function tableRows() {
  if (!lastRows) return null;
  const { items, incl, gf } = lastRows, P = v => isFinite(v) ? r2(incl ? v * gf : v).toFixed(2) : '';
  const conv = f => isFinite(f) ? (Math.round((MODE === 'margin' ? f : m2k(f)) * 10000) / 100).toFixed(2) : '';
  const head = ['Item', 'Cost', 'Current price' + (incl ? ' incl GST' : ''), 'Current ' + PCT.toLowerCase() + ' %', 'Suggested price' + (incl ? ' incl GST' : ''), 'New ' + PCT.toLowerCase() + ' %', 'Below target', 'Action'];
  return [head].concat(items.map(x => [x.name, x.c.toFixed(2), P(x.p), conv(x.curM), P(x.sug), conv(x.newM), x.low ? 'yes' : '', x.kept ? 'keep price' : (isFinite(x.p) ? (x.sug > x.p ? 'raise' : 'lower') : 'new price')]));
}
$('runBtn').onclick = () => runList(true);
['tgt', 'rnd', 'incl', 'keep'].forEach(id => $(id).addEventListener(id === 'tgt' ? 'input' : 'change', () => { if (lastRows) runList(false); else saveState(); }));
$('list').addEventListener('input', saveState);
$('sampleBtn').onclick = () => {
  $('list').value = ['Item, Cost, Price', 'A4 copier paper (box of 5), 18.20, 26.00', 'Toner cartridge black, 64.00, 89.00', 'Ballpoint pens (box of 50), 6.50, 12.90', 'Desk organiser, 9.80, 14.50', 'Office chair C-200, 118.00, 185.00', 'Whiteboard 120 x 90 cm, 52.00, 69.00', 'Stapler heavy duty, 11.40, 15.90', 'Shredder 12-sheet, 96.00, 139.00', 'Label printer, 74.00, 99.00', 'Storage boxes (pack of 10), 21.00, 29.90'].join('\n');
  runList(true); ev('pc_sample');
};
$('csvIn').onchange = e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const rd = new FileReader(); rd.onload = () => { $('list').value = String(rd.result); runList(true); ev('pc_csv_upload'); }; rd.readAsText(f);
};
$('csvBtn').onclick = () => {
  const t = tableRows(); if (!t) { $('lMsg').textContent = 'Calculate prices first.'; return; }
  const csv = t.map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'price-list-' + MODE + '-' + String(lastRows.tv).replace(/[^0-9.]/g, '') + 'pct.csv'; a.click();
  ev('pc_csv'); countUse();
};
$('copyBtn').onclick = async () => {
  const t = tableRows(); if (!t) { $('lMsg').textContent = 'Calculate prices first.'; return; }
  const tsv = t.map(r => r.join('\t')).join('\n');
  try { await navigator.clipboard.writeText(tsv); toast('Copied. Paste into Excel or Google Sheets.'); } catch (e) { prompt('Copy this:', tsv); }
  ev('pc_copy');
};

// ---------- newsletter gate ----------
function countUse() {
  const used = parseInt(store.get('tae_pricecalc', '0'), 10) + 1; store.set('tae_pricecalc', String(used));
  ev('pc_use', { run: used });
  const g = $('gate');
  if (g && used >= 4 && store.get('nl_subscribed', '') !== '1' && parseInt(store.get('pc_gate_skips', '0'), 10) < 2) setTimeout(() => { g.classList.remove('hidden'); ev('pc_gate_shown', { run: used }); }, 800);
}
if ($('gateDone')) $('gateDone').onclick = () => { store.set('nl_subscribed', '1'); $('gate').classList.add('hidden'); ev('pc_gate_done'); };
if ($('gateSkip')) $('gateSkip').onclick = () => { store.set('pc_gate_skips', String(parseInt(store.get('pc_gate_skips', '0'), 10) + 1)); $('gate').classList.add('hidden'); ev('pc_gate_skip'); };
['guideBtn', 'makeBtn', 'reviewLink'].forEach(id => { const a = $(id); if (a) a.addEventListener('click', () => ev('pc_cta', { cta: id })); });

quick();
if ($('list').value.trim()) runList(false);
})();
