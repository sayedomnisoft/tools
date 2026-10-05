(function () {
'use strict';
const MODE = window.SOA_MODE === 'statement' ? 'statement' : 'aging';
const DAY = 86400000;
const $ = id => document.getElementById(id);
const ev = (n, p) => { try { gtag('event', n, Object.assign({ soa_mode: MODE }, p || {})); } catch (e) {} };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  getJ(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  setJ(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl = s => esc(s).replace(/\n/g, '<br>');
const r2 = x => Math.round((x + Number.EPSILON) * 100) / 100;
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
const fdate = d => d ? d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
const cur = () => ($('cur').value || '').trim();
const money = x => { if (!isFinite(x)) return '—'; const c = cur(); return (x < 0 ? '−' : '') + c + Math.abs(x).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); };
const pctS = x => isFinite(x) ? (Math.round(x * 1000) / 10).toLocaleString('en-SG') + '%' : '—';

// ---------- UI ----------
const ST = store.getJ('soa_state', {});
const BIZ0 = { name: '', addr: '', uen: '', gst: '', email: '', phone: '', pay: '', logo: '' };
let biz = Object.assign({}, BIZ0, store.getJ('dm_biz', {}));

const agingBox = `
 <div class="box soa-hidden" id="agingBox">
  <h2>AR aging report</h2>
  <p class="hint" id="agingHint"></p>
  <div class="tiles">
   <div class="tile"><b id="tTotal">—</b><span>Total receivable</span></div>
   <div class="tile"><b id="tOver">—</b><span id="tOverL">Overdue</span></div>
   <div class="tile"><b id="t60">—</b><span>Over 60 days</span></div>
   <div class="tile"><b id="tDso">—</b><span>DSO <input type="text" inputmode="decimal" id="sales" placeholder="sales 90d" aria-label="Credit sales in the last 90 days" style="width:86px;padding:2px 5px;font-size:12px;display:inline-block"></span></div>
  </div>
  <div class="g4" style="margin-top:12px">
   <div class="f"><label for="sortBy">Sort customers by</label><select id="sortBy"><option value="total">Largest balance</option><option value="old">Oldest debt first</option><option value="name">Name</option></select></div>
  </div>
  <div class="tw" style="margin-top:12px" id="agingTable"></div>
  <p class="hint" id="agingCta" style="margin-top:14px;font-size:14px;line-height:1.55"></p>
  <div class="row-acts">
   <button class="b1" id="agPrint">Print or save PDF</button>
   <button id="agCsv">Download CSV</button>
   <button id="agCopy">Copy for Excel</button>
   <button id="toSoa">Make customer statements ↓</button>
  </div>
 </div>`;
const soaBox = `
 <div class="box soa-hidden" id="soaBox">
  <h2>Statements of account</h2>
  <p class="hint">One statement per customer, listing their open invoices, the total due and how old it is. Print one, print them all (each on its own page), or copy an email to send with it.</p>
  <details class="dm-biz" id="bizBox"><summary>Your business <small>saved in this browser; shared with the free document makers</small></summary>
   <div class="g2">
    <div class="f wide"><label for="b_name">Business name</label><input type="text" id="b_name" data-b="name" placeholder="Example Trading Pte Ltd"></div>
    <div class="f wide"><label for="b_addr">Address</label><textarea id="b_addr" data-b="addr" rows="2"></textarea></div>
    <div class="f"><label for="b_uen">UEN / company no.</label><input type="text" id="b_uen" data-b="uen"></div>
    <div class="f"><label for="b_email">Email</label><input type="text" id="b_email" data-b="email"></div>
    <div class="f"><label for="b_phone">Phone</label><input type="text" id="b_phone" data-b="phone"></div>
    <div class="f"><label for="logoIn">Logo</label><input type="file" id="logoIn" accept="image/png,image/jpeg,image/webp"></div>
    <div class="f wide"><label for="b_pay">Payment details</label><textarea id="b_pay" data-b="pay" rows="2" placeholder="PayNow UEN 201234567K&#10;or Example Bank 123-456789-0"></textarea></div>
   </div>
  </details>
  <div class="g2">
   <div class="f"><label for="custSel">Customer</label><select id="custSel"></select></div>
   <div class="f"><label class="chk" style="margin-top:26px"><input type="checkbox" id="made" checked> Show a small "made with The Gantry free tools" line</label></div>
   <div class="f wide"><label for="msg">Message on the statement</label><textarea id="msg" rows="3"></textarea></div>
  </div>
  <div class="row-acts">
   <button class="b1" id="soaPrint">Print or save this statement</button>
   <button id="soaAll">Print all statements</button>
   <button id="soaEmail">Copy email text</button>
   <button id="soaMail">Open in email</button>
  </div>
  <div class="prev-wrap"><div class="paper" id="paper"></div></div>
 </div>`;
$('app').innerHTML = `
<nav class="soa-tabs"><a href="ar-aging-report.html"${MODE === 'aging' ? ' class="on"' : ''}>AR aging report</a><a href="statement-of-account-generator.html"${MODE === 'statement' ? ' class="on"' : ''}>Statement of account</a><a href="invoice-chaser.html">Overdue reminders</a><a href="invoice-generator.html">Invoice generator</a></nav>
<div class="pc">
 <div class="box" id="inBox">
  <h2>1. Add your open invoices</h2>
  <p class="hint">Export the aged receivables or open invoices report from Xero, QuickBooks or any accounting software as CSV or Excel. Drop the CSV here, or copy the rows from Excel and paste them below. It needs a customer, an amount due, and a due date or invoice date. Your data is never uploaded or stored.</p>
  <div class="drop" id="drop"><b>Drop a CSV file here</b> or click to choose one<input type="file" id="file" accept=".csv,text/csv,text/plain" hidden></div>
  <textarea id="paste" rows="5" placeholder="…or paste from Excel: Customer, Invoice no, Invoice date, Due date, Amount due"></textarea>
  <div class="g4" style="margin-top:10px">
   <div class="f"><label for="asat">As at</label><input type="text" id="asat" placeholder="YYYY-MM-DD"></div>
   <div class="f"><label for="basis">Age invoices by</label><select id="basis"><option value="due">Days past due date</option><option value="inv">Days since invoice date</option></select></div>
   <div class="f"><label for="datefmt">Dates like 03/08/2026 are</label><select id="datefmt"><option value="dmy">Day / month / year</option><option value="mdy">Month / day / year</option></select></div>
   <div class="f"><label for="terms">No due date? Invoice date + days</label><input type="text" inputmode="numeric" id="terms" value="30"></div>
   <div class="f"><label for="cur">Currency</label><input type="text" id="cur" value="S$" maxlength="5"></div>
  </div>
  <div class="row-acts">
   <button class="b1" id="runBtn">Build the report</button>
   <button id="sampleBtn">Try it with sample data</button>
  </div>
  <div class="msg" id="err"></div>
 </div>
 ${MODE === 'aging' ? agingBox + soaBox : soaBox + agingBox}
</div>`;
const pr = document.createElement('div'); pr.id = 'printroot'; document.body.appendChild(pr);
const toastEl = document.createElement('div'); toastEl.className = 'toast hidden'; document.body.appendChild(toastEl);
const toast = m => { toastEl.textContent = m; toastEl.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.add('hidden'), 2400); };

['basis', 'datefmt', 'terms', 'cur', 'sales', 'msg', 'sortBy'].forEach(k => { if (ST[k] !== undefined && $(k)) $(k).value = ST[k]; });
if (ST.made === false) $('made').checked = false;
$('asat').value = iso(new Date());
const DEFMSG = 'Below are the invoices open on your account as at the statement date. If you have already paid, thank you, and please send us the remittance advice. If any invoice is disputed, let us know so we can resolve it.';
if (!$('msg').value) $('msg').value = DEFMSG;
function saveState() { const o = { made: $('made').checked }; ['basis', 'datefmt', 'terms', 'cur', 'sales', 'msg', 'sortBy'].forEach(k => { o[k] = $(k).value; }); store.setJ('soa_state', o); }
document.querySelectorAll('[data-b]').forEach(el => { el.value = biz[el.dataset.b] || ''; el.addEventListener('input', () => { biz[el.dataset.b] = el.value; store.setJ('dm_biz', biz); drawStatement(); }); });
if (!biz.name) $('bizBox').open = true;
$('logoIn').onchange = e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const rd = new FileReader(); rd.onload = () => { const img = new Image(); img.onload = () => {
    const s = Math.min(1, 480 / img.width, 200 / img.height), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); biz.logo = c.toDataURL('image/png'); store.setJ('dm_biz', biz); drawStatement();
  }; img.src = rd.result; }; rd.readAsDataURL(f);
};

// ---------- parsing ----------
function parseCSV(text) {
  const d = text.includes('\t') ? '\t' : ',';
  const rows = []; let row = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
    else if (c === '"' && cell === '') q = true;
    else if (c === d) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
  return rows.map(r => r.map(x => x.trim())).filter(r => r.some(x => x !== ''));
}
const MON = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
function parseDate(s, fmt) {
  if (!s) return null; s = String(s).trim();
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/); if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
  m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3})[A-Za-z]*[\s-,]+(\d{2,4})$/); if (m && MON[m[2].toLowerCase()] !== undefined) return new Date(+(m[3].length === 2 ? '20' + m[3] : m[3]), MON[m[2].toLowerCase()], +m[1]);
  m = s.match(/^([A-Za-z]{3})[A-Za-z]*\s+(\d{1,2}),?\s+(\d{4})$/); if (m && MON[m[1].toLowerCase()] !== undefined) return new Date(+m[3], MON[m[1].toLowerCase()], +m[2]);
  m = s.match(/^(\d{1,2})[\/.](\d{1,2})[\/.](\d{2,4})$/);
  if (m) { const y = +(m[3].length === 2 ? '20' + m[3] : m[3]); return fmt === 'mdy' ? new Date(y, +m[1] - 1, +m[2]) : new Date(y, +m[2] - 1, +m[1]); }
  if (/^\d{5}$/.test(s)) { const d = new Date(1899, 11, 30); d.setDate(d.getDate() + parseInt(s, 10)); return d; }
  return null;
}
function parseAmt(s) {
  if (s == null) return NaN; s = String(s).trim(); if (!s || s === '-') return NaN;
  const neg = /^\(.*\)$/.test(s) || /\bCR$/i.test(s) || /^-/.test(s.replace(/^[^0-9\-(]*/, ''));
  const n = parseFloat(s.replace(/[^0-9.]/g, '')); return isFinite(n) ? (neg ? -n : n) : NaN;
}
const norm = h => h.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_*#:]+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
const PICK = {
  cust: [/^(contact|customer|client|name|customer name|contact name|account|account name|debtor)$/, /customer|contact|client|debtor/],
  idate: [/^(invoice date|date|inv date|txn date|transaction date|document date|issue date)$/, /invoice date|issue date/],
  due: [/^(due date|due|payment due)$/, /due date/],
  inv: [/^(invoice number|invoice no\.?|inv no\.?|num|no\.?|number|invoice|reference|ref|document number|doc no\.?)$/, /invoice|num|ref|doc/],
  amt: [/^(amount due|balance|open balance|outstanding|amount outstanding|due amount|balance due|invoice amount due|amount owing|owing)$/, /due|balance|outstanding|owing/, /^(total|amount|invoice total)$/],
  email: [/e-?mail/]
};
function findHeader(rows) {
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const r = rows[i].map(norm), has = re => r.some(x => re.test(x));
    if ((has(/due|balance|outstanding|amount|total|owing/)) && (has(/customer|contact|client|name|debtor|account/) || has(/date/))) return i;
  }
  return -1;
}
function colIndex(head, key, used) {
  for (const re of PICK[key]) { const i = head.findIndex((h, j) => re.test(h) && !used.includes(j)); if (i >= 0) return i; }
  return -1;
}
let INV = [], CUST = [], counted = false;
function build(text, source) {
  $('err').textContent = '';
  const rows = parseCSV(text); const h = findHeader(rows);
  if (h < 0) { $('err').textContent = "I couldn't find the column headings. The data needs columns for the amount due and a due date or invoice date (and ideally the customer)."; ev('soa_error', { why: 'no_header' }); return; }
  const head = rows[h].map(norm), used = [], c = {};
  ['cust', 'idate', 'due', 'inv', 'amt', 'email'].forEach(k => { c[k] = colIndex(head, k, used); if (c[k] >= 0) used.push(c[k]); });
  if (c.amt < 0 || (c.due < 0 && c.idate < 0)) { $('err').textContent = 'I need an amount due column and either a due date or an invoice date.'; ev('soa_error', { why: 'missing_cols' }); return; }
  const fmt = $('datefmt').value, terms = parseInt($('terms').value, 10) || 0;
  const asat = parseDate($('asat').value, 'dmy') || new Date(); asat.setHours(0, 0, 0, 0);
  const basis = $('basis').value;
  INV = []; let group = '', skipped = 0;
  for (const r of rows.slice(h + 1)) {
    const nonEmpty = r.filter(x => x !== '');
    // grouped reports (e.g. Xero detail): a row holding only a contact name starts a group
    if (c.cust < 0 && nonEmpty.length === 1 && !isFinite(parseAmt(nonEmpty[0])) && !parseDate(nonEmpty[0], fmt)) { if (!/^total/i.test(nonEmpty[0])) group = nonEmpty[0]; continue; }
    const cust = c.cust >= 0 ? r[c.cust] : group;
    const amt = parseAmt(r[c.amt]);
    if (/^total/i.test(cust || '') || /^total/i.test(r[0] || '') || !isFinite(amt) || Math.abs(amt) < 0.005) continue;
    if (!cust) { skipped++; continue; }
    const idate = c.idate >= 0 ? parseDate(r[c.idate], fmt) : null;
    let due = c.due >= 0 ? parseDate(r[c.due], fmt) : null;
    if (!due && idate) { due = new Date(idate); due.setDate(due.getDate() + terms); }
    const ref = basis === 'inv' ? (idate || due) : (due || idate);
    if (!ref) { skipped++; continue; }
    const age = Math.round((asat - ref) / DAY);
    INV.push({ cust: cust.trim(), no: c.inv >= 0 ? r[c.inv] : '', idate, due, amt: r2(amt), email: c.email >= 0 ? r[c.email] : '', age });
  }
  if (!INV.length) { $('err').textContent = 'No open invoices found. Check that the amount column holds the balance still owed and that the date format setting matches your file.'; ev('soa_error', { why: 'none' }); return; }
  const by = {};
  INV.forEach(i => { const k = i.cust.toLowerCase(); (by[k] = by[k] || { cust: i.cust, email: '', invs: [] }).invs.push(i); if (i.email && !by[k].email) by[k].email = i.email; });
  CUST = Object.values(by).map(x => { x.invs.sort((a, b) => (a.idate || a.due) - (b.idate || b.due)); x.b = buckets(x.invs); x.total = r2(x.b.reduce((s, v) => s + v, 0)); x.maxAge = Math.max(...x.invs.map(i => i.age)); return x; });
  $('agingBox').classList.remove('soa-hidden'); $('soaBox').classList.remove('soa-hidden');
  $('custSel').innerHTML = CUST.slice().sort((a, b) => a.cust.localeCompare(b.cust)).map(x => `<option value="${esc(x.cust.toLowerCase())}">${esc(x.cust)} · ${money(x.total)}</option>`).join('');
  const worst = CUST.slice().sort((a, b) => b.maxAge - a.maxAge || b.total - a.total)[0];
  $('custSel').value = worst.cust.toLowerCase();
  drawAging(); drawStatement(); saveState();
  if (skipped) $('err').textContent = skipped + ' row' + (skipped > 1 ? 's' : '') + ' without a customer or date skipped.';
  ev('soa_build', { source, invoices: INV.length, customers: CUST.length });
  if (!counted) { counted = true; countUse(); }
  ($(MODE === 'aging' ? 'agingBox' : 'soaBox')).scrollIntoView({ behavior: 'smooth', block: 'start' });
}
const LABELS = () => $('basis').value === 'inv' ? ['0–30', '31–60', '61–90', '91–120', '120+'] : ['Current', '1–30', '31–60', '61–90', '90+'];
function bucketOf(age) {
  if ($('basis').value === 'inv') return age <= 30 ? 0 : age <= 60 ? 1 : age <= 90 ? 2 : age <= 120 ? 3 : 4;
  return age <= 0 ? 0 : age <= 30 ? 1 : age <= 60 ? 2 : age <= 90 ? 3 : 4;
}
function buckets(invs) { const b = [0, 0, 0, 0, 0]; invs.forEach(i => { b[bucketOf(i.age)] += i.amt; }); return b.map(r2); }

// ---------- aging report ----------
function sortedCust() {
  const s = $('sortBy').value, a = CUST.slice();
  if (s === 'name') a.sort((x, y) => x.cust.localeCompare(y.cust));
  else if (s === 'old') a.sort((x, y) => (y.b[4] - x.b[4]) || (y.b[3] - x.b[3]) || (y.b[2] - x.b[2]) || (y.total - x.total));
  else a.sort((x, y) => y.total - x.total);
  return a;
}
function totals() { const t = [0, 0, 0, 0, 0]; CUST.forEach(x => x.b.forEach((v, i) => { t[i] += v; })); const tot = r2(t.reduce((s, v) => s + v, 0)); return { t: t.map(r2), tot }; }
function drawAging() {
  if (!CUST.length) return;
  const L = LABELS(), { t, tot } = totals(), inv = $('basis').value === 'inv';
  const over = inv ? NaN : r2(tot - t[0]), o60 = inv ? r2(t[2] + t[3] + t[4]) : r2(t[3] + t[4]);
  $('tTotal').textContent = money(tot);
  $('tOver').textContent = inv ? money(r2(tot - t[0])) : money(over) + ' · ' + pctS(tot ? over / tot : NaN);
  $('tOverL').textContent = inv ? 'Older than 30 days' : 'Overdue';
  $('t60').textContent = money(o60) + ' · ' + pctS(tot ? o60 / tot : NaN);
  const sales = parseAmt($('sales').value);
  $('tDso').textContent = sales > 0 ? Math.round(tot / sales * 90) + ' days' : '—';
  $('agingHint').textContent = `${INV.length} open invoice${INV.length === 1 ? '' : 's'} across ${CUST.length} customer${CUST.length === 1 ? '' : 's'}, as at ${fdate(parseDate($('asat').value, 'dmy') || new Date())}, aged by ${inv ? 'invoice date' : 'due date'}. Amounts over 60 days are highlighted.`;
  const cls = i => (inv ? i >= 2 : i >= 3) ? (i === 4 ? 'b90' : 'b60') : '';
  let h = `<table class="pt"><thead><tr><th>Customer</th>${L.map(l => `<th>${l}</th>`).join('')}<th>Total</th></tr></thead><tbody>`;
  h += sortedCust().map(x => `<tr><td class="cn">${esc(x.cust)}</td>${x.b.map((v, i) => `<td class="${v ? cls(i) : ''}">${v ? money(v) : '–'}</td>`).join('')}<td><b>${money(x.total)}</b></td></tr>`).join('');
  h += `<tr class="tot"><td class="cn">Total</td>${t.map(v => `<td>${money(v)}</td>`).join('')}<td>${money(tot)}</td></tr>`;
  h += `<tr class="pc"><td class="cn">% of total</td>${t.map(v => `<td>${pctS(tot ? v / tot : NaN)}</td>`).join('')}<td>100%</td></tr></tbody></table>`;
  $('agingTable').innerHTML = h;
  const G = 'style="color:#f2cf6e"';
  $('agingCta').innerHTML = (o60 > 0 ? `<b style="color:#fff">${money(o60)} is more than 60 days old.</b> Statements and staged reminders bring most of it in. ` : `<b style="color:#fff">Nothing over 60 days. Well done.</b> Keep it that way with reminders that go out on their own. `) +
    `<a ${G} href="invoice-chaser.html">Write this month's reminders now</a>, or <a ${G} href="https://www.gantry.work/p/xero-invoice-reminders-automation?utm_source=tools&utm_medium=ar-aging-result" target="_blank" rel="noopener">set them to send automatically</a> with a free Make setup. Receivables spread across spreadsheets and inboxes? <a ${G} href="https://tools.gantry.work/review.html?utm_source=tools&utm_medium=ar-aging-result" target="_blank" rel="noopener">Book a free 20-minute review</a>.`;
}
function agingRows() {
  const L = LABELS(), { t, tot } = totals();
  return [['Customer'].concat(L, ['Total'])].concat(sortedCust().map(x => [x.cust].concat(x.b.map(v => v.toFixed(2)), [x.total.toFixed(2)])), [['Total'].concat(t.map(v => v.toFixed(2)), [tot.toFixed(2)])]);
}
$('agCsv').onclick = () => {
  const csv = agingRows().map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')).join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = 'ar-aging-' + $('asat').value + '.csv'; a.click();
  ev('soa_aging_csv'); countUse();
};
$('agCopy').onclick = async () => { const tsv = agingRows().map(r => r.join('\t')).join('\n'); try { await navigator.clipboard.writeText(tsv); toast('Copied. Paste into Excel or Google Sheets.'); } catch (e) { prompt('Copy this:', tsv); } ev('soa_aging_copy'); };
$('agPrint').onclick = () => {
  const L = LABELS(), { t, tot } = totals(), asat = parseDate($('asat').value, 'dmy') || new Date();
  let h = `<div class="paper"><div class="pp-top"><div class="pp-from"><b>${biz.name ? esc(biz.name) : 'Aged receivables'}</b></div><div class="pp-title"><h2>AGED RECEIVABLES</h2><table class="pp-meta"><tr><td>As at</td><td>${fdate(asat)}</td></tr><tr><td>Aged by</td><td>${$('basis').value === 'inv' ? 'invoice date' : 'due date'}</td></tr></table></div></div>`;
  h += `<table class="pi"><thead><tr><th>Customer</th>${L.map(l => `<th class="r">${l}</th>`).join('')}<th class="r">Total</th></tr></thead><tbody>`;
  h += sortedCust().map(x => `<tr><td>${esc(x.cust)}</td>${x.b.map(v => `<td class="r">${v ? money(v) : '–'}</td>`).join('')}<td class="r"><b>${money(x.total)}</b></td></tr>`).join('');
  h += `<tr><td><b>Total</b></td>${t.map(v => `<td class="r"><b>${money(v)}</b></td>`).join('')}<td class="r"><b>${money(tot)}</b></td></tr></tbody></table>`;
  if ($('made').checked) h += '<div class="pp-made">Made with the free AR aging report tool at tools.gantry.work</div>';
  pr.innerHTML = h + '</div>';
  ev('soa_aging_print'); countUse(); printWithTitle('AR aging ' + $('asat').value);
};
$('toSoa').onclick = () => $('soaBox').scrollIntoView({ behavior: 'smooth', block: 'start' });
$('sortBy').onchange = () => { drawAging(); saveState(); };
$('sales').addEventListener('input', () => { drawAging(); saveState(); });

// ---------- statements ----------
const curCust = () => CUST.find(x => x.cust.toLowerCase() === $('custSel').value) || CUST[0];
function statementHTML(x) {
  const asat = parseDate($('asat').value, 'dmy') || new Date(), L = LABELS();
  const from = [biz.addr && nl(biz.addr), biz.uen && 'UEN: ' + esc(biz.uen), [biz.email, biz.phone].filter(Boolean).map(esc).join(' · ')].filter(Boolean).join('<br>');
  const overdue = r2(x.invs.filter(i => i.due && Math.round((asat - i.due) / DAY) > 0).reduce((s, i) => s + i.amt, 0));
  let h = `<div class="pp-top"><div class="pp-from">${biz.logo ? `<img src="${biz.logo}" alt="">` : ''}<b>${biz.name ? esc(biz.name) : '<span class="ph">Your business name</span>'}</b><br>${from || '<span class="ph">Add your address and UEN under "Your business"</span>'}</div>
   <div class="pp-title"><h2>STATEMENT OF ACCOUNT</h2><table class="pp-meta"><tr><td>Statement date</td><td>${fdate(asat)}</td></tr><tr><td>Total due</td><td><b>${money(x.total)}</b></td></tr>${overdue > 0 ? `<tr><td>Overdue</td><td>${money(overdue)}</td></tr>` : ''}</table></div></div>`;
  h += `<div><div class="pp-lbl">Customer</div><b>${esc(x.cust)}</b>${x.email ? '<br>' + esc(x.email) : ''}</div>`;
  if ($('msg').value.trim()) h += `<div class="pp-block">${nl($('msg').value.trim())}</div>`;
  h += `<table class="pi"><thead><tr><th>Invoice date</th><th>Invoice no.</th><th class="hideS">Due date</th><th class="r">Days overdue</th><th class="r">Amount due</th></tr></thead><tbody>`;
  h += x.invs.map(i => { const od = i.due ? Math.round((asat - i.due) / DAY) : NaN; return `<tr><td>${i.idate ? fdate(i.idate) : '–'}</td><td>${esc(i.no || (i.amt < 0 ? 'Credit' : '–'))}</td><td class="hideS">${i.due ? fdate(i.due) : '–'}</td><td class="r${od > 30 ? ' od' : ''}">${od > 0 ? od : (isFinite(od) ? 'not yet due' : '–')}</td><td class="r">${money(i.amt)}</td></tr>`; }).join('');
  h += `</tbody></table><div class="pp-due"><span>Total due</span><span>${money(x.total)}</span></div>`;
  h += `<table class="pp-age"><tr>${L.map(l => `<th>${l}</th>`).join('')}<th>Total</th></tr><tr>${x.b.map(v => `<td>${money(v)}</td>`).join('')}<td><b>${money(x.total)}</b></td></tr></table>`;
  if (biz.pay) h += `<div class="pp-block"><div class="pp-lbl">How to pay</div>${nl(biz.pay)}</div>`;
  if ($('made').checked) h += '<div class="pp-made">Made with the free statement of account generator at tools.gantry.work</div>';
  return h;
}
function drawStatement() { if (!CUST.length) return; $('paper').innerHTML = statementHTML(curCust()); }
$('custSel').onchange = drawStatement;
$('msg').addEventListener('input', () => { drawStatement(); saveState(); });
$('made').onchange = () => { drawStatement(); saveState(); };
function printWithTitle(t) { const old = document.title; document.title = t; window.print(); setTimeout(() => { document.title = old; }, 1500); }
$('soaPrint').onclick = () => { const x = curCust(); pr.innerHTML = '<div class="paper">' + statementHTML(x) + '</div>'; ev('soa_print'); countUse(); printWithTitle('Statement of account - ' + x.cust + ' - ' + $('asat').value); };
$('soaAll').onclick = () => { pr.innerHTML = CUST.slice().sort((a, b) => a.cust.localeCompare(b.cust)).map(x => '<div class="paper">' + statementHTML(x) + '</div>').join(''); ev('soa_print_all', { customers: CUST.length }); countUse(); printWithTitle('Statements of account - ' + $('asat').value); };
function emailText(x) {
  const asat = parseDate($('asat').value, 'dmy') || new Date();
  const lines = x.invs.map(i => `- ${i.no || 'Invoice'}${i.idate ? ', ' + fdate(i.idate) : ''}: ${money(i.amt)}${i.due && Math.round((asat - i.due) / DAY) > 0 ? ' (' + Math.round((asat - i.due) / DAY) + ' days overdue)' : ''}`).join('\n');
  return { subject: `Statement of account as at ${fdate(asat)}: ${money(x.total)} due`, body: `Hi,\n\nPlease find your statement of account as at ${fdate(asat)} attached. The open invoices are:\n\n${lines}\n\nTotal due: ${money(x.total)}\n${biz.pay ? '\nPayment details:\n' + biz.pay + '\n' : ''}\nIf you have already paid, thank you, and please send us the remittance advice. If anything looks wrong, just reply and we will sort it out.\n\nThanks,\n${biz.name || ''}` };
}
$('soaEmail').onclick = async () => { const e = emailText(curCust()), t = 'Subject: ' + e.subject + '\n\n' + e.body; try { await navigator.clipboard.writeText(t); toast('Email copied. Attach the PDF statement.'); } catch (er) { prompt('Copy this:', t); } ev('soa_email_copy'); };
$('soaMail').onclick = () => { const x = curCust(), e = emailText(x); ev('soa_mailto'); location.href = 'mailto:' + encodeURIComponent(x.email || '') + '?subject=' + encodeURIComponent(e.subject) + '&body=' + encodeURIComponent(e.body); };

// ---------- inputs ----------
const SAMPLE = `Customer,Invoice Number,Invoice Date,Due Date,Amount Due,Email
Harbour Logistics Pte Ltd,INV-1042,{d-95},{d-65},"3,480.00",accounts@example.com
Harbour Logistics Pte Ltd,INV-1077,{d-50},{d-20},"1,260.00",accounts@example.com
Harbour Logistics Pte Ltd,INV-1131,{d-12},{d+18},"2,045.00",accounts@example.com
Northpoint Cafe,INV-1090,{d-40},{d-10},640.50,owner@example.com
Northpoint Cafe,CN-0031,{d-30},{d-30},-120.00,owner@example.com
Lumen Interiors,INV-1101,{d-68},{d-38},"2,150.00",
Kopi Corner Group,INV-1015,{d-130},{d-100},"5,900.00",finance@example.com
Kopi Corner Group,INV-1066,{d-75},{d-45},"1,430.00",finance@example.com
Sunrise Clinic,INV-1120,{d-20},{d+10},980.00,admin@example.com
Bayview Engineering,INV-1124,{d-45},{d-15},"4,312.80",ap@example.com`;
$('runBtn').onclick = () => { if (!$('paste').value.trim()) { $('err').textContent = 'Drop a CSV file above, or paste your rows into the box first.'; return; } build($('paste').value, 'paste'); };
$('sampleBtn').onclick = () => {
  const t = new Date(); const s = SAMPLE.replace(/\{d([+-]\d+)\}/g, (_, n) => { const d = new Date(t); d.setDate(d.getDate() + parseInt(n, 10)); return iso(d); });
  $('paste').value = s; $('asat').value = iso(new Date());
  if (!biz.name) { biz = Object.assign(biz, { name: 'Bright Supplies Pte Ltd', addr: '10 Example Road, #01-01\nSingapore 123456', uen: '201912345K', email: 'accounts@example.com', pay: biz.pay || 'PayNow UEN 201912345K\nor Example Bank 123-456789-0' }); store.setJ('dm_biz', biz); document.querySelectorAll('[data-b]').forEach(el => { el.value = biz[el.dataset.b] || ''; }); }
  ev('soa_sample'); build(s, 'sample');
};
const drop = $('drop');
drop.onclick = () => $('file').click();
const readFile = f => { if (!f) return; f.text().then(t => { $('paste').value = t.length < 200000 ? t : ''; build(t, 'file'); }); };
$('file').onchange = e => readFile(e.target.files[0]);
drop.ondragover = e => { e.preventDefault(); drop.classList.add('over'); };
drop.ondragleave = () => drop.classList.remove('over');
drop.ondrop = e => { e.preventDefault(); drop.classList.remove('over'); readFile(e.dataTransfer.files[0]); };
['basis', 'asat', 'datefmt', 'terms', 'cur'].forEach(id => $(id).addEventListener('change', () => { saveState(); if (INV.length && $('paste').value.trim()) build($('paste').value, 'rerun'); }));

// ---------- newsletter gate ----------
function countUse() {
  const used = parseInt(store.get('tae_soa', '0'), 10) + 1; store.set('tae_soa', String(used));
  ev('soa_use', { run: used });
  const g = $('gate');
  if (g && used >= 4 && store.get('nl_subscribed', '') !== '1' && parseInt(store.get('soa_gate_skips', '0'), 10) < 2) setTimeout(() => { g.classList.remove('hidden'); ev('soa_gate_shown', { run: used }); }, 800);
}
if ($('gateDone')) $('gateDone').onclick = () => { store.set('nl_subscribed', '1'); $('gate').classList.add('hidden'); ev('soa_gate_done'); };
if ($('gateSkip')) $('gateSkip').onclick = () => { store.set('soa_gate_skips', String(parseInt(store.get('soa_gate_skips', '0'), 10) + 1)); $('gate').classList.add('hidden'); ev('soa_gate_skip'); };
['guideBtn', 'makeBtn', 'reviewLink'].forEach(id => { const a = $(id); if (a) a.addEventListener('click', () => ev('soa_cta', { cta: id })); });
})();
