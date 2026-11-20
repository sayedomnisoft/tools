// 20 Nov 2026: Singapore itemised payslip maker (MOM's 12 items, page updated 14 Mar 2024). Nothing leaves the browser.
(function () {
'use strict';
const $ = id => document.getElementById(id);
const ev = (n, p) => { try { gtag('event', n, Object.assign({ calc: 'payslip' }, p || {})); } catch (e) {} };
const num = v => { const s = String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''); const n = parseFloat(s); return isFinite(n) ? n : 0; };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const money = x => 'S$' + (x < 0 ? '-' : '') + Math.abs(x).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fd = v => { if (!v) return ''; const d = new Date(v + 'T00:00:00'); return isNaN(d) ? '' : d.toLocaleDateString('en-SG', { day: 'numeric', month: 'short', year: 'numeric' }); };
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const store = { get(k) { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };

const GROUPS = [['allow', 'Allowances', [['Transport allowance', '150']]], ['addl', 'Additional payments', [['Public holiday pay', '']]], ['ded', 'Deductions', [['Employee CPF contribution', '547'], ['No-pay leave', '']]]];
function rowHtml(g, d, a) { return `<div class="ps-row"><input type="text" data-g="${g}" data-k="d" value="${esc(d)}" placeholder="Description" aria-label="Description"><input type="text" inputmode="decimal" data-g="${g}" data-k="a" value="${esc(a)}" placeholder="0.00" aria-label="Amount"><button type="button" class="ps-x" aria-label="Remove line">×</button></div>`; }

const now = new Date(), m0 = new Date(now.getFullYear(), now.getMonth(), 1), m1 = new Date(now.getFullYear(), now.getMonth() + 1, 0);
$('psapp').innerHTML = `<div class="pc"><div class="box">
  <div class="g4">
    <div class="f"><label for="er">Employer (full name)</label><input type="text" id="er" value="Example Trading Pte Ltd"></div>
    <div class="f"><label for="ee">Employee (full name)</label><input type="text" id="ee" value="Tan Mei Ling"></div>
    <div class="f"><label for="role">Job title or staff ID (optional)</label><input type="text" id="role" value="Sales Coordinator"></div>
    <div class="f"><label for="paid">Date of payment</label><input type="date" id="paid" value="${iso(m1)}"></div>
  </div>
  <div class="g4" style="margin-top:12px">
    <div class="f"><label for="ps">Salary period start</label><input type="date" id="ps" value="${iso(m0)}"></div>
    <div class="f"><label for="pe">Salary period end</label><input type="date" id="pe" value="${iso(m1)}"></div>
    <div class="f"><label for="basis">Paid by</label><select id="basis"><option value="month">Month</option><option value="hour">Hour</option><option value="day">Day</option><option value="piece">Piece</option></select></div>
    <div class="f"><label for="basic" id="basicL">Basic salary for the month</label><input type="text" inputmode="decimal" id="basic" value="2400"></div>
  </div>
  <div class="g4" id="unitsRow" style="margin-top:12px;display:none">
    <div class="f"><label for="units" id="unitsL">Hours worked</label><input type="text" inputmode="decimal" id="units" value=""></div>
  </div>
  ${GROUPS.map(([g, t, rows]) => `<h3 class="ps-h">${t}</h3><div id="g_${g}">${rows.map(r => rowHtml(g, r[0], r[1])).join('')}</div><button type="button" class="ps-add" data-add="${g}">+ Add a line</button>`).join('')}
  <h3 class="ps-h">Overtime</h3>
  <div class="g4">
    <div class="f"><label for="oth">Overtime hours</label><input type="text" inputmode="decimal" id="oth" value="10"></div>
    <div class="f"><label for="otp">Overtime pay</label><input type="text" inputmode="decimal" id="otp" value=""></div>
    <div class="f"><label for="ops">Overtime period start (if different)</label><input type="date" id="ops" value=""></div>
    <div class="f"><label for="ope">Overtime period end (if different)</label><input type="date" id="ope" value=""></div>
  </div>
  <p class="ps-note" id="otNote"></p>
  <div class="g4" style="margin-top:6px">
    <div class="f"><label for="ercpf">Employer CPF (optional, for information)</label><input type="text" inputmode="decimal" id="ercpf" value="466"></div>
  </div>
  <div class="row-acts" style="margin-top:16px"><button id="printBtn" class="primary">Print or save as PDF</button><button id="csvBtn">Download for Excel (CSV)</button><button id="resetBtn">Reset example</button></div>
  <div class="msg" id="msg"></div>
</div>
<div id="printroot"><div class="paper" id="paper"></div></div></div>`;

const DEF = $('psapp').innerHTML;
function rows(g) { return [...document.querySelectorAll(`#g_${g} .ps-row`)].map(r => ({ d: r.querySelector('[data-k=d]').value.trim(), a: num(r.querySelector('[data-k=a]').value) })).filter(r => r.a); }
function otAuto() {
  const b = $('basis').value, B = num($('basic').value), H = num($('oth').value);
  if (b === 'month' && B > 0 && H > 0) { const hr = 12 * B / (52 * 44); return { pay: Math.round(hr * 1.5 * H * 100) / 100, txt: `MOM formula: 12 × ${money(B)} ÷ (52 × 44) = ${money(hr)} an hour × 1.5 × ${H} hours = ${money(hr * 1.5 * H)}. Type over it if your contract pays more.` }; }
  if (b === 'hour' && B > 0 && H > 0) return { pay: Math.round(B * 1.5 * H * 100) / 100, txt: `${money(B)} an hour × 1.5 × ${H} hours.` };
  return { pay: 0, txt: H > 0 ? 'Enter the overtime pay: for daily or piece rates, the hourly basic rate is the day or week pay divided by the hours worked.' : '' };
}
function data() {
  const b = $('basis').value, B = num($('basic').value), U = num($('units').value);
  const basicPay = b === 'month' ? B : B * U;
  const auto = otAuto(), otManual = $('otp').value.trim() !== '' && $('otp').dataset.manual === '1';
  const otPay = otManual ? num($('otp').value) : auto.pay;
  if (!otManual) $('otp').value = otPay ? otPay.toFixed(2) : '';
  $('otNote').textContent = auto.txt;
  const A = rows('allow'), X = rows('addl'), D = rows('ded');
  const sum = a => a.reduce((s, r) => s + r.a, 0);
  const gross = basicPay + sum(A) + sum(X) + otPay, net = gross - sum(D);
  return { er: $('er').value.trim(), ee: $('ee').value.trim(), role: $('role').value.trim(), paid: $('paid').value, ps: $('ps').value, pe: $('pe').value, b, B, U, basicPay, A, X, D, oth: num($('oth').value), otPay, ops: $('ops').value, ope: $('ope').value, ercpf: num($('ercpf').value), gross, net };
}
function render() {
  const d = data(), unit = { hour: 'hour', day: 'day', piece: 'piece' }[d.b];
  const line = (n, label, val, cls) => `<tr class="${cls || ''}"><td class="pn">${n}</td><td>${label}</td><td class="pa">${val}</td></tr>`;
  const list = (n, label, arr, neg) => arr.length ? arr.map((r, i) => line(i ? '' : n, esc(r.d || label), (neg ? '−' : '') + money(r.a))).join('') : line(n, label, money(0));
  let h = `<div class="pp-head"><div><div class="pp-t">PAYSLIP</div><div class="pp-er">${esc(d.er) || '<i>Employer name</i>'}</div></div><div class="pp-meta"><div><span>Employee</span> ${esc(d.ee) || '<i>Employee name</i>'}</div>${d.role ? `<div><span>Role / ID</span> ${esc(d.role)}</div>` : ''}<div><span>Salary period</span> ${fd(d.ps)} to ${fd(d.pe)}</div><div><span>Date of payment</span> ${fd(d.paid)}</div></div></div>`;
  h += `<table class="pp-tab"><thead><tr><th class="pn">MOM item</th><th>Description</th><th class="pa">Amount</th></tr></thead><tbody>`;
  h += line(4, d.b === 'month' ? 'Basic salary' : `Basic pay (${money(d.B)} ${unit === 'hour' ? 'an' : 'a'} ${unit} × ${d.U} ${unit}s)`, money(d.basicPay));
  h += list(6, 'Allowances', d.A) + list(7, 'Additional payments', d.X);
  if (d.oth || d.otPay) { h += line(9, 'Overtime hours worked', `${d.oth} h`) + line(10, 'Overtime pay', money(d.otPay)); if (d.ops || d.ope) h += line(11, 'Overtime payment period', `${fd(d.ops)} to ${fd(d.ope)}`); }
  h += line('', '<b>Gross pay</b>', `<b>${money(d.gross)}</b>`, 'pp-sub') + list(8, 'Deductions', d.D, true);
  h += line(12, '<b>Net salary paid</b>', `<b>${money(d.net)}</b>`, 'pp-net') + '</tbody></table>';
  if (d.ercpf) h += `<p class="pp-foot">Employer CPF contribution (not deducted from pay): ${money(d.ercpf)}</p>`;
  h += `<p class="pp-foot">Items 1 to 3 and 5 (employer, employee, payment date, salary period) are in the header. Keep payroll records for 2 years (MOM).</p>`;
  $('paper').innerHTML = h;
  $('msg').textContent = d.net < 0 ? 'Deductions are larger than gross pay: check the amounts.' : '';
  store.set('payslip_v1', { er: d.er });
  return d;
}
function csv(d) {
  const q = v => `"${String(v).replace(/"/g, '""')}"`, L = [['MOM item', 'Field', 'Value']];
  L.push([1, 'Employer', d.er], [2, 'Employee', d.ee], [3, 'Date of payment', d.paid], [4, 'Basic salary', d.basicPay.toFixed(2)], [5, 'Salary period', `${d.ps} to ${d.pe}`]);
  d.A.forEach(r => L.push([6, r.d || 'Allowance', r.a.toFixed(2)])); d.X.forEach(r => L.push([7, r.d || 'Additional payment', r.a.toFixed(2)])); d.D.forEach(r => L.push([8, r.d || 'Deduction', (-r.a).toFixed(2)]));
  L.push([9, 'Overtime hours', d.oth], [10, 'Overtime pay', d.otPay.toFixed(2)]); if (d.ops || d.ope) L.push([11, 'Overtime period', `${d.ops} to ${d.ope}`]);
  L.push([12, 'Net salary paid', d.net.toFixed(2)]);
  return L.map(r => r.map(q).join(',')).join('\r\n');
}
function wire() {
  document.querySelectorAll('#psapp input, #psapp select').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', e => {
    if (e.target.id === 'otp') e.target.dataset.manual = e.target.value.trim() ? '1' : '';
    if (e.target.id === 'basis') { const b = $('basis').value; $('unitsRow').style.display = b === 'month' ? 'none' : ''; $('basicL').textContent = b === 'month' ? 'Basic salary for the month' : `Basic rate per ${b}`; $('unitsL').textContent = { hour: 'Hours worked', day: 'Days worked', piece: 'Pieces completed' }[b] || ''; }
    render(); touched();
  }));
  document.querySelectorAll('[data-add]').forEach(b => b.onclick = () => { $('g_' + b.dataset.add).insertAdjacentHTML('beforeend', rowHtml(b.dataset.add, '', '')); wire(); render(); });
  document.querySelectorAll('.ps-x').forEach(b => b.onclick = () => { b.parentElement.remove(); render(); });
  $('printBtn').onclick = () => { if (window.gantryRun && window.gantryRun() === false) return; render(); ev('payslip_print'); window.print(); };
  $('csvBtn').onclick = () => { if (window.gantryRun && window.gantryRun() === false) return; const d = render(); const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['﻿' + csv(d)], { type: 'text/csv' })); a.download = `payslip-${(d.ee || 'employee').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${d.pe || 'period'}.csv`; document.body.appendChild(a); a.click(); a.remove(); ev('payslip_csv'); };
  $('resetBtn').onclick = () => { $('psapp').innerHTML = DEF; wire(); render(); };
}
let edits = 0, counted = false;
function touched() { if (!counted && ++edits >= 3) { counted = true; ev('calc_use', { run: 1 }); try { if (window.gantryResult) window.gantryResult('Payslip made'); } catch (e) {} } }
const saved = store.get('payslip_v1'); if (saved && saved.er) $('er').value = saved.er;
wire(); render();
})();
