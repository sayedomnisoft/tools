(function () {
'use strict';
const T = window.DOC_TYPE;
const PAGES = { invoice: 'invoice-generator.html', quotation: 'quotation-generator.html', receipt: 'receipt-generator.html', po: 'purchase-order-generator.html', do: 'delivery-order-generator.html' };
const NAMES = { invoice: 'Invoice', quotation: 'Quotation', receipt: 'Receipt', po: 'Purchase order', do: 'Delivery order' };
const CONV = { quotation: ['invoice', 'do'], invoice: ['receipt', 'do'], do: ['invoice'], po: [], receipt: [] };
const CFGS = {
  invoice: { name: 'Invoice', prefix: 'INV-', party: 'Bill to', prices: true, pay: true,
    extra: [{ k: 'due', label: 'Due date', type: 'date', def: d => addDays(d.date, 30) }, { k: 'poref', label: 'Your PO no.', type: 'text', ph: 'optional' }],
    notes: 'Payment is due by the date above. Please quote the invoice number with your payment.' },
  quotation: { name: 'Quotation', prefix: 'QUO-', party: 'Prepared for', prices: true, pay: true,
    extra: [{ k: 'valid', label: 'Valid until', type: 'date', def: d => addDays(d.date, 30) }],
    notes: 'Prices are valid until the date above. 50% deposit on confirmation, balance on completion.', sign: ['Accepted by (name and signature)', 'Date'] },
  receipt: { name: 'Receipt', prefix: 'RCT-', party: 'Received from', prices: true,
    extra: [{ k: 'method', label: 'Paid by', type: 'select', opts: ['PayNow', 'Bank transfer', 'Cash', 'Card', 'Cheque', 'Other'] }, { k: 'payref', label: 'Payment reference', type: 'text', ph: 'e.g. transfer ref or cheque no.' }],
    notes: 'Thank you for your payment.', stamp: 'PAID' },
  po: { name: 'Purchase Order', prefix: 'PO-', party: 'Supplier', prices: true,
    extra: [{ k: 'deliv', label: 'Delivery date', type: 'date', def: d => addDays(d.date, 7) }, { k: 'shipto', label: 'Deliver to', type: 'textarea', ph: 'Delivery address, if different from ours', meta: false }],
    notes: 'Please quote this PO number on your delivery order and invoice. Goods are subject to inspection on receipt.', sign: ['Authorised by (name and signature)', 'Date'] },
  do: { name: 'Delivery Order', prefix: 'DO-', party: 'Deliver to', prices: false,
    extra: [{ k: 'ref', label: 'Customer PO / invoice no.', type: 'text', ph: 'optional' }],
    notes: 'Please check the goods on delivery and note any shortage or damage on this delivery order.', sign: ['Received in good order and condition by (name, signature, company stamp)', 'Date and time'] }
};
const C = CFGS[T];
if (!C) return;

const $ = id => document.getElementById(id);
const ev = (n, p) => { try { gtag('event', n, Object.assign({ doc_type: T }, p || {})); } catch (e) {} };
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} },
  getJ(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  setJ(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const nl = s => esc(s).replace(/\n/g, '<br>');
const r2 = x => Math.round((x + Number.EPSILON) * 100) / 100;
const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(/,/g, '')); return isFinite(n) ? n : 0; };
function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function addDays(s, n) { const d = new Date((s || iso(new Date())) + 'T00:00:00'); if (isNaN(d)) return ''; d.setDate(d.getDate() + n); return iso(d); }
const fdate = s => { if (!s) return ''; const d = new Date(s + 'T00:00:00'); return isNaN(d) ? s : d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }); };
const money = x => { const c = (D.cur || '').trim(); const a = Math.abs(x).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); return (x < 0 ? '−' : '') + (c ? (/[$€£¥₹]$/.test(c) ? c : c + ' ') : '') + a; };
const firstLine = s => String(s || '').split('\n')[0].trim();

function nextNo() {
  const last = store.get('dm_last_' + T, '');
  const m = last.match(/^(.*?)(\d+)(\D*)$/);
  if (m) return m[1] + String(parseInt(m[2], 10) + 1).padStart(m[2].length, '0') + m[3];
  return C.prefix + '0001';
}
function blank() {
  const d = { no: nextNo(), date: iso(new Date()), party: '', cur: store.get('dm_cur', 'S$'), tax: store.get('dm_tax', 'none'), rate: store.get('dm_rate', '9'), discount: '', notes: C.notes, made: true, x: {}, items: [{ d: '', q: '1', u: '', p: '' }] };
  C.extra.forEach(f => { d.x[f.k] = f.def ? f.def(d) : (f.opts ? f.opts[0] : ''); });
  return d;
}
const BIZ0 = { name: '', addr: '', uen: '', gst: '', email: '', phone: '', pay: '', logo: '' };
let biz = Object.assign({}, BIZ0, store.getJ('dm_biz', {}));
let D = store.getJ('dm_draft_' + T, null) || blank();
if (!D.items || !D.items.length) D.items = [{ d: '', q: '1', u: '', p: '' }];
D.x = D.x || {};

// Hand-off from another document type (e.g. quotation -> invoice)
const ho = store.getJ('dm_handoff', null);
if (ho && ho.to === T) {
  D = blank();
  D.party = ho.party || ''; D.cur = ho.cur || D.cur; D.tax = ho.tax || D.tax; D.rate = ho.rate || D.rate; D.discount = T === 'do' ? '' : (ho.discount || '');
  D.items = (ho.items || []).map(it => ({ d: it.d || '', q: it.q || '', u: it.u || '', p: T === 'do' ? '' : (it.p || '') }));
  if (!D.items.length) D.items = [{ d: '', q: '1', u: '', p: '' }];
  const ref = NAMES[ho.from] + ' ' + ho.no;
  if (T === 'do') D.x.ref = ho.no;
  else if (T === 'receipt') D.notes = 'Payment for ' + NAMES[ho.from].toLowerCase() + ' ' + ho.no + '. Thank you.';
  else D.notes = 'Ref: ' + ref + '\n' + C.notes;
  store.del('dm_handoff');
  ev('dm_handoff_in', { from: ho.from });
}

// ---------- build the form ----------
const extraField = f => {
  const id = 'x_' + f.k, wide = f.type === 'textarea' ? ' wide' : '';
  let input;
  if (f.type === 'select') input = `<select id="${id}" data-x="${f.k}">${f.opts.map(o => `<option>${esc(o)}</option>`).join('')}</select>`;
  else if (f.type === 'textarea') input = `<textarea id="${id}" data-x="${f.k}" rows="2" placeholder="${esc(f.ph || '')}"></textarea>`;
  else input = `<input type="${f.type}" id="${id}" data-x="${f.k}" placeholder="${esc(f.ph || '')}">`;
  return `<div class="f${wide}"><label for="${id}">${esc(f.label)}</label>${input}</div>`;
};
const lname = C.name.toLowerCase();
$('app').innerHTML = `
<nav class="dm-tabs" aria-label="Document types">${Object.keys(PAGES).map(k => `<a href="${PAGES[k]}"${k === T ? ' class="on" aria-current="page"' : ''}>${NAMES[k]}</a>`).join('')}</nav>
<div class="dm">
 <div class="dm-form">
  <details id="bizBox"><summary>Your business <small>saved in this browser, used on every document</small></summary>
   <div class="g2">
    <div class="f wide"><label for="b_name">Business name</label><input type="text" id="b_name" data-b="name" placeholder="Example Trading Pte Ltd"></div>
    <div class="f wide"><label for="b_addr">Address</label><textarea id="b_addr" data-b="addr" rows="2" placeholder="10 Example Road, #01-01&#10;Singapore 123456"></textarea></div>
    <div class="f"><label for="b_uen">UEN / company no.</label><input type="text" id="b_uen" data-b="uen"></div>
    <div class="f"><label for="b_gst">GST reg. no. <small>blank if not registered</small></label><input type="text" id="b_gst" data-b="gst"></div>
    <div class="f"><label for="b_email">Email</label><input type="text" id="b_email" data-b="email"></div>
    <div class="f"><label for="b_phone">Phone</label><input type="text" id="b_phone" data-b="phone"></div>
    ${C.pay ? '<div class="f wide"><label for="b_pay">Payment details</label><textarea id="b_pay" data-b="pay" rows="2" placeholder="PayNow UEN 201234567K&#10;or Example Bank 123-456789-0"></textarea></div>' : ''}
    <div class="f wide"><label for="logoIn">Logo <small>PNG or JPG; stays in your browser</small></label><input type="file" id="logoIn" accept="image/png,image/jpeg,image/webp"> <button type="button" id="logoRm" class="mini">Remove logo</button></div>
   </div>
  </details>
  <div class="sec"><h3>${esc(C.name)} details</h3><div class="g2">
    <div class="f"><label for="d_no">${esc(C.name)} number</label><input type="text" id="d_no" data-d="no"></div>
    <div class="f"><label for="d_date">Date</label><input type="date" id="d_date" data-d="date"></div>
    ${C.extra.map(extraField).join('')}
    <div class="f"><label for="d_cur">Currency</label><input type="text" id="d_cur" data-d="cur" maxlength="5"></div>
    <div class="f wide"><label for="d_party">${esc(C.party)}</label><textarea id="d_party" data-d="party" rows="3" placeholder="Name&#10;Address&#10;Attention / phone / email"></textarea></div>
  </div></div>
  <div class="sec"><h3>Items</h3>
    <div class="ihead${C.prices ? '' : ' nop'}"><span>Description</span><span>Qty</span><span>${C.prices ? 'Unit price' : 'Unit'}</span><span></span></div>
    <div id="items"></div><button type="button" id="addLine" class="mini">+ Add line</button></div>
  ${C.prices ? `<div class="sec"><div class="g2">
    <div class="f"><label for="d_tax">GST</label><select id="d_tax" data-d="tax"><option value="none">No GST</option><option value="add">Add GST to prices</option><option value="incl">Prices include GST</option></select></div>
    <div class="f"><label for="d_rate">GST rate %</label><input type="number" id="d_rate" data-d="rate" step="0.01" min="0"></div>
    <div class="f"><label for="d_disc">Discount (amount)</label><input type="number" id="d_disc" data-d="discount" step="0.01" min="0" placeholder="0.00"></div>
  </div><small id="gstWarn" class="warn hidden">Only GST-registered businesses may charge GST. Add your GST registration number under "Your business".</small></div>` : ''}
  <div class="sec"><div class="f wide"><label for="d_notes">Notes and terms</label><textarea id="d_notes" data-d="notes" rows="3"></textarea></div>
    <label class="chk"><input type="checkbox" id="d_made" data-d="made"> Show a small "made with The Gantry free tools" line</label></div>
  <div class="dm-acts">
    <button class="b1" id="pdfBtn">Download PDF or print</button>
    ${CONV[T].map(k => `<button class="cv" data-conv="${k}">Turn into ${NAMES[k].toLowerCase()}</button>`).join('')}
    <button id="copyBtn">Copy as text</button>
    <button id="exBtn">Fill with example</button>
    <button id="newBtn">New ${esc(lname)}</button>
  </div>
  <div class="f"><label for="recent">Open a recent ${esc(lname)}</label><select id="recent"></select></div>
 </div>
 <div class="dm-prev"><div class="paper" id="paper"></div>
  <p class="hint">Live preview. "Download PDF" opens your browser's print window: choose <b>Save as PDF</b>. Everything stays in this browser; nothing is uploaded.</p></div>
</div>`;
const pr = document.createElement('div'); pr.id = 'printroot'; document.body.appendChild(pr);
const toastEl = document.createElement('div'); toastEl.className = 'toast hidden'; document.body.appendChild(toastEl);
const toast = m => { toastEl.textContent = m; toastEl.classList.remove('hidden'); clearTimeout(toast.t); toast.t = setTimeout(() => toastEl.classList.add('hidden'), 2200); };
if (!biz.name) $('bizBox').open = true;

// ---------- state <-> form ----------
function fill() {
  document.querySelectorAll('[data-b]').forEach(el => { el.value = biz[el.dataset.b] || ''; });
  document.querySelectorAll('[data-d]').forEach(el => { if (el.type === 'checkbox') el.checked = D[el.dataset.d] !== false; else el.value = D[el.dataset.d] == null ? '' : D[el.dataset.d]; });
  document.querySelectorAll('[data-x]').forEach(el => { el.value = D.x[el.dataset.x] == null ? '' : D.x[el.dataset.x]; });
  drawItems(); drawRecent(); render();
}
function drawItems() {
  $('items').innerHTML = D.items.map((it, i) => `<div class="it${C.prices ? '' : ' nop'}">
    <input type="text" data-i="${i}" data-k="d" placeholder="Description" aria-label="Description, line ${i + 1}" value="${esc(it.d)}">
    <input type="number" step="any" min="0" data-i="${i}" data-k="q" placeholder="Qty" aria-label="Quantity, line ${i + 1}" value="${esc(it.q)}">
    ${C.prices ? `<input type="number" step="0.01" data-i="${i}" data-k="p" placeholder="0.00" aria-label="Unit price, line ${i + 1}" value="${esc(it.p)}">` : `<input type="text" data-i="${i}" data-k="u" placeholder="pcs" aria-label="Unit, line ${i + 1}" value="${esc(it.u)}">`}
    <button type="button" class="x" data-rm="${i}" aria-label="Remove line ${i + 1}">×</button></div>`).join('');
}
function save() {
  store.setJ('dm_biz', biz); store.setJ('dm_draft_' + T, D);
  if (C.prices) { store.set('dm_cur', D.cur || ''); store.set('dm_tax', D.tax); store.set('dm_rate', String(D.rate)); }
}
document.addEventListener('input', e => {
  const el = e.target;
  if (el.dataset.b) biz[el.dataset.b] = el.value;
  else if (el.dataset.d) D[el.dataset.d] = el.type === 'checkbox' ? el.checked : el.value;
  else if (el.dataset.x) D.x[el.dataset.x] = el.value;
  else if (el.dataset.i !== undefined) D.items[+el.dataset.i][el.dataset.k] = el.value;
  else return;
  if (el.dataset.d === 'date') C.extra.forEach(f => { if (f.def && !D.x['_' + f.k + '_edited']) { D.x[f.k] = f.def(D); const t = $('x_' + f.k); if (t) t.value = D.x[f.k]; } });
  if (el.dataset.x && C.extra.some(f => f.k === el.dataset.x && f.def)) D.x['_' + el.dataset.x + '_edited'] = true;
  save(); render();
});
document.addEventListener('change', e => { if (e.target.type === 'checkbox' && e.target.dataset.d) { D[e.target.dataset.d] = e.target.checked; save(); render(); } });
$('items').addEventListener('click', e => {
  const b = e.target.closest('[data-rm]'); if (!b) return;
  D.items.splice(+b.dataset.rm, 1); if (!D.items.length) D.items.push({ d: '', q: '1', u: '', p: '' });
  drawItems(); save(); render();
});
$('addLine').onclick = () => { D.items.push({ d: '', q: '1', u: '', p: '' }); drawItems(); save(); render(); const ins = $('items').querySelectorAll('input[data-k="d"]'); ins[ins.length - 1].focus(); };

$('logoIn').onchange = e => {
  const f = e.target.files && e.target.files[0]; if (!f) return;
  const rd = new FileReader();
  rd.onload = () => { const img = new Image(); img.onload = () => {
    const s = Math.min(1, 480 / img.width, 200 / img.height), c = document.createElement('canvas');
    c.width = Math.max(1, Math.round(img.width * s)); c.height = Math.max(1, Math.round(img.height * s));
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    biz.logo = c.toDataURL('image/png'); save(); render(); ev('dm_logo');
  }; img.src = rd.result; };
  rd.readAsDataURL(f);
};
$('logoRm').onclick = () => { biz.logo = ''; $('logoIn').value = ''; save(); render(); };

// ---------- calculation + preview ----------
function totals() {
  let sub = 0; D.items.forEach(it => { sub += r2(num(it.q) * num(it.p)); }); sub = r2(sub);
  const disc = Math.min(r2(num(D.discount)), sub), net = r2(sub - disc), rate = num(D.rate);
  let gst = 0, total = net, excl = net;
  if (D.tax === 'add') { gst = r2(net * rate / 100); total = r2(net + gst); }
  else if (D.tax === 'incl') { gst = r2(net * rate / (100 + rate)); excl = r2(net - gst); }
  return { sub, disc, net, gst, total, excl, rate };
}
const docTitle = () => (T === 'invoice' && C.prices && D.tax !== 'none') ? 'Tax Invoice' : C.name;
function paperHTML() {
  const ph = (v, p) => v ? nl(v) : `<span class="ph">${esc(p)}</span>`;
  const lines = D.items.filter(it => String(it.d).trim() || num(it.p) || (!C.prices && num(it.q)));
  const meta = [[C.name + ' no.', D.no], ['Date', fdate(D.date)]].concat(C.extra.filter(f => f.meta !== false && D.x[f.k]).map(f => [f.label, f.type === 'date' ? fdate(D.x[f.k]) : D.x[f.k]]));
  const from = [biz.addr && nl(biz.addr), biz.uen && 'UEN: ' + esc(biz.uen), biz.gst && 'GST reg. no.: ' + esc(biz.gst), [biz.email, biz.phone].filter(Boolean).map(esc).join(' · ')].filter(Boolean).join('<br>');
  let h = `<div class="pp-top"><div class="pp-from">${biz.logo ? `<img src="${biz.logo}" alt="">` : ''}<b>${ph(biz.name, 'Your business name')}</b><br>${from || '<span class="ph">Address, UEN, email</span>'}</div>
    <div class="pp-title"><h2>${esc(docTitle().toUpperCase())}</h2><table class="pp-meta">${meta.map(m => `<tr><td>${esc(m[0])}</td><td>${esc(m[1])}</td></tr>`).join('')}</table></div></div>`;
  h += `<div class="pp-parties"><div class="pp-party"><div class="pp-lbl">${esc(C.party)}</div>${ph(D.party, 'Name and address')}</div>`;
  if (T === 'po') h += `<div class="pp-party"><div class="pp-lbl">Deliver to</div>${D.x.shipto ? nl(D.x.shipto) : (biz.addr ? nl(biz.addr) : '<span class="ph">Our address</span>')}</div>`;
  h += '</div>';
  h += `<table class="pi"><thead><tr><th style="width:26px">#</th><th>Description</th><th class="r">Qty</th>${C.prices ? '<th class="r">Unit price</th><th class="r">Amount</th>' : '<th>Unit</th>'}</tr></thead><tbody>`;
  h += lines.length ? lines.map((it, i) => `<tr><td>${i + 1}</td><td>${nl(it.d)}</td><td class="r">${esc(it.q)}</td>${C.prices ? `<td class="r">${money(num(it.p))}</td><td class="r">${money(r2(num(it.q) * num(it.p)))}</td>` : `<td>${esc(it.u)}</td>`}</tr>`).join('')
    : `<tr><td>1</td><td><span class="ph">Item description</span></td><td class="r"><span class="ph">1</span></td>${C.prices ? '<td class="r"><span class="ph">0.00</span></td><td class="r"><span class="ph">0.00</span></td>' : '<td></td>'}</tr>`;
  h += '</tbody></table>';
  if (C.prices) {
    const t = totals(), rl = (t.rate % 1 ? t.rate : t.rate.toFixed(0)) + '%';
    h += '<div class="pp-tot">';
    if (t.disc > 0 || D.tax === 'add') h += `<div><span>Subtotal</span><span>${money(t.sub)}</span></div>`;
    if (t.disc > 0) h += `<div><span>Discount</span><span>−${money(t.disc)}</span></div>`;
    if (D.tax === 'add') { if (t.disc > 0) h += `<div><span>Total before GST</span><span>${money(t.net)}</span></div>`; h += `<div><span>GST ${rl}</span><span>${money(t.gst)}</span></div>`; }
    h += `<div class="grand"><span>${T === 'receipt' ? 'Amount received' : 'Total'}${D.tax !== 'none' ? ' (incl. GST)' : ''}</span><span>${money(t.total)}</span></div>`;
    if (D.tax === 'incl') h += `<div class="sm"><span>Total excl. GST</span><span>${money(t.excl)}</span></div><div class="sm"><span>GST ${rl} included</span><span>${money(t.gst)}</span></div>`;
    h += '</div>';
  }
  if (T === 'receipt') h += `<div class="pp-block"><b>Paid by:</b> ${esc(D.x.method || '')}${D.x.payref ? ' · <b>Ref:</b> ' + esc(D.x.payref) : ''}<br><span class="pp-stamp">PAID</span></div>`;
  if (C.pay && biz.pay) h += `<div class="pp-block"><div class="pp-lbl">Payment details</div>${nl(biz.pay)}</div>`;
  if (D.notes) h += `<div class="pp-block"><div class="pp-lbl">${T === 'receipt' ? 'Note' : 'Notes and terms'}</div>${nl(D.notes)}</div>`;
  if (C.sign) h += `<div class="pp-sign"><div>${esc(C.sign[0])}</div><div style="flex:0 0 32%">${esc(C.sign[1])}</div></div>`;
  if (D.made !== false) h += `<div class="pp-made">Made with the free ${esc(lname)} generator at tools.gantry.work</div>`;
  return h;
}
function render() {
  $('paper').innerHTML = paperHTML();
  const w = $('gstWarn'); if (w) w.classList.toggle('hidden', !(T !== 'po' && D.tax !== 'none' && !String(biz.gst || '').trim()));
}

// ---------- recent documents ----------
function drawRecent() {
  const docs = store.getJ('dm_docs', []).filter(d => d.t === T);
  $('recent').innerHTML = '<option value="">' + (docs.length ? 'Choose…' : 'None yet: they appear here after you download') + '</option>' + docs.map((d, i) => `<option value="${i}">${esc(d.no)} · ${esc(fdate(d.date))} · ${esc(d.party || '')}${d.total ? ' · ' + esc(d.total) : ''}</option>`).join('');
}
$('recent').onchange = e => {
  const docs = store.getJ('dm_docs', []).filter(d => d.t === T), d = docs[+e.target.value];
  if (!d) return; D = JSON.parse(JSON.stringify(d.d)); D.x = D.x || {}; save(); fill(); ev('dm_reopen');
};
function record() {
  const docs = store.getJ('dm_docs', []).filter(d => !(d.t === T && d.no === D.no));
  docs.unshift({ t: T, no: D.no, date: D.date, party: firstLine(D.party), total: C.prices ? money(totals().total) : '', d: D });
  store.setJ('dm_docs', docs.slice(0, 60));
  const last = store.get('dm_last_' + T, ''), m1 = last.match(/(\d+)\D*$/), m2 = String(D.no).match(/(\d+)\D*$/);
  if (m2 && (!m1 || parseInt(m2[1], 10) >= parseInt(m1[1], 10))) store.set('dm_last_' + T, D.no);
}

// ---------- actions ----------
function preparePrint() { pr.innerHTML = '<div class="paper">' + paperHTML() + '</div>'; }
window.addEventListener('beforeprint', preparePrint);
$('pdfBtn').onclick = () => {
  preparePrint(); record(); drawRecent(); countUse(); ev('dm_print');
  const old = document.title, who = firstLine(D.party);
  document.title = docTitle() + ' ' + D.no + (who ? ' - ' + who : '');
  window.print();
  setTimeout(() => { document.title = old; }, 1500);
};
document.querySelectorAll('[data-conv]').forEach(b => b.onclick = () => {
  const to = b.dataset.conv;
  record();
  store.setJ('dm_handoff', { to, from: T, no: D.no, party: D.party, cur: D.cur, tax: D.tax, rate: D.rate, discount: D.discount, items: D.items });
  ev('dm_convert', { to });
  location.href = PAGES[to];
});
$('newBtn').onclick = () => { if (String(D.no).trim()) record(); D = blank(); save(); fill(); ev('dm_new'); toast('New ' + lname + ' ' + D.no); };
$('copyBtn').onclick = async () => {
  const out = [docTitle().toUpperCase() + ' ' + D.no + ' · ' + fdate(D.date)];
  if (biz.name) out.push('From: ' + biz.name);
  if (D.party) out.push(C.party + ': ' + firstLine(D.party));
  C.extra.forEach(f => { if (f.meta !== false && D.x[f.k]) out.push(f.label + ': ' + (f.type === 'date' ? fdate(D.x[f.k]) : D.x[f.k])); });
  out.push('');
  D.items.filter(it => String(it.d).trim()).forEach((it, i) => out.push((i + 1) + '. ' + it.d + ' — ' + it.q + (C.prices ? ' × ' + money(num(it.p)) + ' = ' + money(r2(num(it.q) * num(it.p))) : ' ' + (it.u || ''))));
  if (C.prices) { const t = totals(); out.push(''); if (t.disc > 0) out.push('Discount: −' + money(t.disc)); if (D.tax === 'add') out.push('GST: ' + money(t.gst)); out.push('Total: ' + money(t.total) + (D.tax !== 'none' ? ' (incl. GST)' : '')); }
  if (C.pay && biz.pay) out.push('', 'Payment: ' + biz.pay.replace(/\n/g, ' / '));
  const txt = out.join('\n');
  try { await navigator.clipboard.writeText(txt); toast('Copied. Paste into email or WhatsApp.'); } catch (e) { prompt('Copy this text:', txt); }
  ev('dm_copy');
};
const EX = {
  invoice: { party: 'Example Customer Pte Ltd\n20 Sample Street, #05-02\nSingapore 654321\nAttn: Accounts Payable', items: [['Office chairs, model C-200', '6', '185'], ['Delivery and assembly', '1', '120']] },
  quotation: { party: 'Example Customer Pte Ltd\n20 Sample Street, #05-02\nSingapore 654321\nAttn: Ms Tan', items: [['Supply and install LED panel lights', '24', '68'], ['Dismantle and dispose of old fittings', '1', '280'], ['Labour, after office hours', '1', '450']] },
  receipt: { party: 'Example Customer Pte Ltd', items: [['Payment for invoice INV-0042', '1', '1230']] },
  po: { party: 'Example Supplies Pte Ltd\n8 Supplier Lane\nSingapore 456789\nAttn: Sales', items: [['A4 copier paper, 80gsm (box of 5 reams)', '20', '24.50'], ['Toner cartridge, black', '4', '96']] },
  do: { party: 'Example Customer Pte Ltd\n20 Sample Street, #05-02\nSingapore 654321\nAttn: Store receiving', items: [['Office chairs, model C-200', '6', 'pcs'], ['Assembly hardware kit', '6', 'sets']] }
};
$('exBtn').onclick = () => {
  if (!biz.name) biz = Object.assign(biz, { name: 'Example Trading Pte Ltd', addr: '10 Example Road, #01-01\nSingapore 123456', uen: '201912345K', email: 'accounts@example.com', phone: '+65 6123 4567', pay: biz.pay || 'PayNow UEN 201912345K\nor Example Bank 123-456789-0' });
  const e = EX[T]; D.party = e.party;
  D.items = e.items.map(r => C.prices ? { d: r[0], q: r[1], u: '', p: r[2] } : { d: r[0], q: r[1], u: r[2], p: '' });
  save(); fill(); ev('dm_example');
};

// ---------- newsletter gate (from the 4th download) ----------
function countUse() {
  const used = parseInt(store.get('tae_docmaker', '0'), 10) + 1; store.set('tae_docmaker', String(used));
  ev('dm_use', { run: used });
  const g = $('gate');
  if (g && used >= 4 && store.get('nl_subscribed', '') !== '1' && parseInt(store.get('dm_gate_skips', '0'), 10) < 2) {
    setTimeout(() => { g.classList.remove('hidden'); ev('dm_gate_shown', { run: used }); }, 800);
  }
}
if ($('gateDone')) $('gateDone').onclick = () => { store.set('nl_subscribed', '1'); $('gate').classList.add('hidden'); ev('dm_gate_done'); };
if ($('gateSkip')) $('gateSkip').onclick = () => { store.set('dm_gate_skips', String(parseInt(store.get('dm_gate_skips', '0'), 10) + 1)); $('gate').classList.add('hidden'); ev('dm_gate_skip'); };
['guideBtn', 'makeBtn', 'reviewLink'].forEach(id => { const a = $(id); if (a) a.addEventListener('click', () => ev('dm_cta', { cta: id })); });

fill(); save();
})();
