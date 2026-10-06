(function () {
'use strict';
const K = window.CALC;
const $ = id => document.getElementById(id);
const ev = (n, p) => { try { gtag('event', n, Object.assign({ calc: K }, p || {})); } catch (e) {} };
const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
const num = v => { const s = String(v == null ? '' : v).replace(/[^0-9.\-]/g, ''); if (s === '' || s === '-' || s === '.') return NaN; const n = parseFloat(s); return isFinite(n) ? n : NaN; };
const cur = () => (($('cur') && $('cur').value) || 'S$').trim();
const money = x => isFinite(x) ? (x < 0 ? '−' : '') + cur() + Math.abs(x).toLocaleString('en-SG', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
const pct = x => isFinite(x) ? (Math.round(x * 100) / 100).toLocaleString('en-SG', { maximumFractionDigits: 2 }) + '%' : '—';
const int = x => isFinite(x) ? Math.round(x).toLocaleString('en-SG') : '—';
const G = 'style="color:#f2cf6e"';
const link = (href, t, ext) => `<a ${G} href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
const review = m => link(`https://tools.gantry.work/review.html?utm_source=tools&utm_medium=${m}`, 'Book a free 20-minute review', true);
const f = (id, label, val, ph, type) => `<div class="f"><label for="${id}">${label}</label><input type="${type || 'text'}" ${type === 'date' ? '' : 'inputmode="decimal"'} id="${id}" value="${val == null ? '' : val}" placeholder="${ph || ''}"></div>`;
const sel = (id, label, opts, v) => `<div class="f"><label for="${id}">${label}</label><select id="${id}">${opts.map(o => `<option value="${o[0]}"${o[0] === v ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></div>`;
const tile = (id, label) => `<div class="tile"><b id="${id}">—</b><span>${label}</span></div>`;
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const fdate = d => d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

const CALCS = {
  breakeven: {
    html: `<div class="g4">${f('fixed', 'Fixed costs per month', '12000', 'rent, salaries, software')}${f('price', 'Selling price per unit', '50')}${f('vc', 'Variable cost per unit', '30', 'cost of goods, packaging, fees')}${f('cur', 'Currency', 'S$')}</div>
      <div class="g4" style="margin-top:10px">${f('target', 'Target profit per month (optional)', '', 'e.g. 5000')}${f('actual', 'Units you sell now (optional)', '', 'e.g. 800')}</div>
      <div class="tiles">${tile('t1', 'Break-even units / month')}${tile('t2', 'Break-even sales / month')}${tile('t3', 'Contribution per unit')}${tile('t4', 'Contribution margin')}</div>`,
    calc() {
      const F = num($('fixed').value), P = num($('price').value), V = num($('vc').value), T = num($('target').value), A = num($('actual').value);
      if (!(P > 0) || !(V >= 0) || !(F >= 0)) return { msg: 'Enter fixed costs, a selling price and a variable cost.' };
      if (P <= V) return { msg: 'The selling price must be higher than the variable cost per unit; otherwise every sale loses money and there is no break-even point.' };
      const cm = P - V, cmr = cm / P, units = Math.ceil(F / cm - 1e-9), sales = units * P;
      $('t1').textContent = int(units); $('t2').textContent = money(sales); $('t3').textContent = money(cm); $('t4').textContent = pct(cmr * 100);
      let out = `<b style="color:#fff">You need to sell ${int(units)} units (${money(sales)}) a month to cover ${money(F)} of fixed costs.</b> Every unit after that adds ${money(cm)} of profit.`;
      if (T > 0) { const tu = Math.ceil((F + T) / cm - 1e-9); out += ` To make ${money(T)} profit a month you need ${int(tu)} units (${money(tu * P)} in sales).`; }
      if (A > 0) { const mos = (A - units) / A * 100; out += A >= units ? ` At ${int(A)} units you are ${int(A - units)} units above break-even: a margin of safety of ${pct(mos)}, and a profit of about ${money(A * cm - F)} a month.` : ` At ${int(A)} units you are ${int(units - A)} units short of break-even, a loss of about ${money(F - A * cm)} a month.`; }
      out += ` Raising the price by 5% would lower break-even to ${int(Math.ceil(F / (P * 1.05 - V) - 1e-9))} units. ${link('profit-margin-calculator.html', 'Check margins product by product')} · ${review('breakeven-result')}`;
      return { out, used: true };
    }
  },
  dso: {
    html: `<div class="g4">${f('ar', 'Accounts receivable (owed to you)', '120000', 'end of period, or average')}${f('sales', 'Credit sales in the period', '240000')}${sel('days', 'Period', [['30', '30 days (a month)'], ['90', '90 days (a quarter)'], ['365', '365 days (a year)']], '90')}${f('terms', 'Your payment terms (days)', '30')}</div>
      <div class="g4" style="margin-top:10px">${f('cur', 'Currency', 'S$')}</div>
      <div class="tiles">${tile('t1', 'Days sales outstanding')}${tile('t2', 'Days beyond your terms')}${tile('t3', 'Credit sales per day')}${tile('t4', 'Cash tied up beyond terms')}</div>`,
    calc() {
      const AR = num($('ar').value), S = num($('sales').value), D = num($('days').value), TR = num($('terms').value);
      if (!(AR >= 0) || !(S > 0)) return { msg: 'Enter what customers owe you and your credit sales for the period.' };
      const dso = AR / S * D, daily = S / D, late = isFinite(TR) ? dso - TR : NaN, tied = late > 0 ? late * daily : 0;
      $('t1').textContent = isFinite(dso) ? dso.toFixed(1) + ' days' : '—'; $('t2').textContent = isFinite(late) ? (late > 0 ? late.toFixed(1) + ' days' : 'none') : '—'; $('t3').textContent = money(daily); $('t4').textContent = money(tied);
      let out = `<b style="color:#fff">Your DSO is ${dso.toFixed(1)} days.</b> On average, a sale is collected ${dso.toFixed(0)} days after it is made. `;
      out += late > 0 ? `That is ${late.toFixed(1)} days longer than your ${int(TR)}-day terms, so about ${money(tied)} of cash is sitting with customers that should already be in your bank. Bringing DSO back to your terms frees that cash once. ` : `That is within your ${int(TR)}-day terms. Keep it there with reminders that go out on their own. `;
      out += `See who is holding it up with the ${link('ar-aging-report.html', 'free AR aging report')}, then ${link('invoice-chaser.html', 'write the reminders')}. ${review('dso-result')}`;
      return { out, used: true };
    }
  },
  gst: {
    html: `<div class="g4">${sel('mode', 'Calculate', [['add', 'Add GST to a price'], ['remove', 'Remove GST from a price']], 'add')}${f('amt', 'Amount', '1000')}${f('rate', 'GST rate %', '9')}${f('cur', 'Currency', 'S$')}</div>
      <div class="tiles">${tile('t1', 'Price before GST')}${tile('t2', 'GST')}${tile('t3', 'Price including GST')}${tile('t4', 'GST fraction of the total')}</div>
      <div class="f" style="margin-top:14px"><label for="list">Several amounts? Paste one per line</label><textarea id="list" rows="4" placeholder="1250&#10;89.90&#10;430"></textarea></div><div id="listOut"></div>`,
    calc() {
      const mode = $('mode').value, A = num($('amt').value), R = num($('rate').value);
      if (!(A >= 0) || !(R >= 0)) return { msg: 'Enter an amount and a GST rate.' };
      const r2 = x => Math.round((x + Number.EPSILON) * 100) / 100;
      const split = a => mode === 'add' ? [a, r2(a * R / 100), r2(a + r2(a * R / 100))] : [r2(a - r2(a * R / (100 + R))), r2(a * R / (100 + R)), a];
      const [net, gst, gross] = split(A);
      $('t1').textContent = money(net); $('t2').textContent = money(gst); $('t3').textContent = money(gross); $('t4').textContent = `${R}/${100 + R}`;
      const lines = $('list').value.split('\n').map(num).filter(x => x >= 0);
      if (lines.length) { const rows = lines.map(split); const tot = rows.reduce((s, r) => [s[0] + r[0], s[1] + r[1], s[2] + r[2]], [0, 0, 0]);
        $('listOut').innerHTML = `<div class="tw" style="margin-top:10px"><table class="pt" style="min-width:0"><thead><tr><th>#</th><th>Before GST</th><th>GST</th><th>Incl. GST</th></tr></thead><tbody>${rows.map((r, i) => `<tr><td>${i + 1}</td><td>${money(r[0])}</td><td>${money(r[1])}</td><td>${money(r[2])}</td></tr>`).join('')}<tr style="font-weight:800"><td>Total</td><td>${money(tot[0])}</td><td>${money(tot[1])}</td><td>${money(tot[2])}</td></tr></tbody></table></div>`; } else $('listOut').innerHTML = '';
      const out = `<b style="color:#fff">${mode === 'add' ? `${money(net)} plus ${R}% GST is ${money(gross)}` : `${money(gross)} including ${R}% GST is ${money(net)} before GST`}</b>, with GST of ${money(gst)}. Making an invoice? The free ${link('invoice-generator.html', 'invoice generator')} adds GST and switches to a tax invoice for you. Prices for a whole list: the ${link('profit-margin-calculator.html', 'price list tool')} shows prices incl. GST.`;
      return { out, used: true };
    }
  },
  duedate: {
    html: `<div class="g4">${f('idate', 'Invoice date', '', '', 'date')}${sel('terms', 'Payment terms', [['0', 'Due on receipt'], ['7', 'Net 7'], ['14', 'Net 14'], ['15', 'Net 15'], ['30', 'Net 30'], ['45', 'Net 45'], ['60', 'Net 60'], ['90', 'Net 90'], ['eom30', 'Net 30 EOM (end of month)'], ['custom', 'Custom number of days']], '30')}${f('cdays', 'Custom days', '', 'only for custom')}${f('asat', 'Check against date', '', '', 'date')}</div>
      <div class="g4" style="margin-top:10px">${f('amt', 'Invoice amount (optional)', '', 'e.g. 4800')}${f('rate', 'Late interest % a year (optional)', '', 'only if your terms allow it')}${f('cur', 'Currency', 'S$')}</div>
      <div class="tiles">${tile('t1', 'Due date')}${tile('t2', 'Status')}${tile('t3', 'Days overdue')}${tile('t4', 'Late interest so far')}</div>`,
    init() { const t = new Date(); $('idate').value = iso(t); $('asat').value = iso(t); },
    calc() {
      const id = $('idate').value ? new Date($('idate').value + 'T00:00:00') : null, as = $('asat').value ? new Date($('asat').value + 'T00:00:00') : new Date();
      if (!id || isNaN(id)) return { msg: 'Enter the invoice date.' };
      const t = $('terms').value; let due = new Date(id);
      if (t === 'eom30') { due = new Date(id.getFullYear(), id.getMonth() + 1, 0); due.setDate(due.getDate() + 30); }
      else { const d = t === 'custom' ? num($('cdays').value) : num(t); if (!(d >= 0)) return { msg: 'Enter the custom number of days.' }; due.setDate(due.getDate() + d); }
      as.setHours(0, 0, 0, 0); const diff = Math.round((as - due) / 86400000), A = num($('amt').value), R = num($('rate').value);
      const interest = diff > 0 && A > 0 && R > 0 ? A * R / 100 * diff / 365 : 0;
      $('t1').textContent = fdate(due); $('t2').textContent = diff > 0 ? 'Overdue' : diff === 0 ? 'Due today' : `Due in ${-diff} days`; $('t3').textContent = diff > 0 ? int(diff) : '0'; $('t4').textContent = interest ? money(interest) : '—';
      let out = `<b style="color:#fff">An invoice dated ${fdate(id)} on ${$('terms').selectedOptions[0].text} terms is due on ${fdate(due)}.</b> `;
      out += diff > 0 ? `On ${fdate(as)} it is ${diff} days overdue${interest ? `, and ${R}% a year adds about ${money(interest)} of late interest` : ''}. ${diff <= 14 ? 'Time for a friendly reminder.' : diff <= 44 ? 'Time for a firm reminder and a phone call.' : 'Time for a final notice.'} The ${link('invoice-chaser.html', 'free reminder writer')} drafts it for you. ` : `Send a short courtesy reminder about three days before. `;
      out += `Chasing more than a few invoices? ${link('https://www.gantry.work/p/xero-invoice-reminders-automation?utm_source=tools&utm_medium=duedate-result', 'Set reminders to send automatically', true)} (free Make setup).`;
      return { out, used: true };
    }
  },
  priceincrease: {
    html: `<h3 style="margin-bottom:8px;font-size:16px">1. Percentage change between two prices</h3><div class="g4">${f('oldp', 'Old price', '40')}${f('newp', 'New price', '44')}${f('cur', 'Currency', 'S$')}</div>
      <div class="tiles">${tile('t1', 'Price increase')}${tile('t2', 'Increase in money')}${tile('t3', 'Price × 1.05 (5% up)')}${tile('t4', 'Price × 1.10 (10% up)')}</div>
      <h3 style="margin:22px 0 8px;font-size:16px">2. What to charge when your costs go up</h3><div class="g4">${f('cost', 'Old cost per unit', '28')}${f('ncost', 'New cost per unit', '31')}${sel('keep', 'Keep the same', [['margin', 'margin %'], ['profit', 'profit per unit']], 'margin')}${sel('rnd', 'Round up to', [['none', 'No rounding'], ['0.90', '.90 endings'], ['1', 'Whole dollars']], 'none')}</div>
      <div class="tiles">${tile('t5', 'New price')}${tile('t6', 'Price increase needed')}${tile('t7', 'Margin at old price, new cost')}${tile('t8', 'Margin at new price')}</div>`,
    calc() {
      const O = num($('oldp').value), N = num($('newp').value);
      if (!(O > 0) || !(N >= 0)) return { msg: 'Enter the old and new price.' };
      const inc = (N - O) / O * 100; $('t1').textContent = (inc >= 0 ? '+' : '') + pct(inc); $('t2').textContent = (N - O >= 0 ? '+' : '') + money(N - O); $('t3').textContent = money(O * 1.05); $('t4').textContent = money(O * 1.10);
      let out = `<b style="color:#fff">${money(O)} to ${money(N)} is a ${inc >= 0 ? 'rise' : 'fall'} of ${pct(Math.abs(inc))}.</b> `;
      const C = num($('cost').value), NC = num($('ncost').value);
      if (C >= 0 && NC >= 0 && O > C) {
        const m = (O - C) / O, keep = $('keep').value; let np = keep === 'margin' ? (m < 1 ? NC / (1 - m) : NaN) : NC + (O - C);
        const rd = $('rnd').value; if (rd === '0.90') { let v = Math.floor(np) + 0.9; if (v < np - 1e-9) v += 1; np = v; } else if (rd === '1') np = Math.ceil(np - 1e-9);
        const need = (np - O) / O * 100, mOld = (O - NC) / O * 100, mNew = (np - NC) / np * 100;
        $('t5').textContent = money(np); $('t6').textContent = '+' + pct(need); $('t7').textContent = pct(mOld); $('t8').textContent = pct(mNew);
        out += `When the cost goes from ${money(C)} to ${money(NC)}, keeping the same ${keep === 'margin' ? 'margin of ' + pct(m * 100) : 'profit of ' + money(O - C)} means charging <b style="color:#fff">${money(np)}</b>, a ${pct(need)} increase. Leave the price at ${money(O)} and your margin drops to ${pct(mOld)}. `;
      } else { ['t5', 't6', 't7', 't8'].forEach(i => $(i).textContent = '—'); }
      out += `Doing this for a whole price list? The ${link('profit-margin-calculator.html', 'free price list tool')} reprices every product to a target margin. ${review('price-increase-result')}`;
      return { out, used: true };
    }
  },
  grossprofit: {
    html: `<div class="g4">${f('rev', 'Revenue (sales, excl. GST)', '180000')}${f('cogs', 'Cost of goods sold', '126000', 'or fill the three boxes below')}${f('opex', 'Operating expenses (optional)', '40000', 'rent, salaries, marketing')}${f('cur', 'Currency', 'S$')}</div>
      <div class="g4" style="margin-top:10px">${f('open', 'COGS helper: opening stock', '', 'optional')}${f('purch', 'Purchases', '', 'optional')}${f('close', 'Closing stock', '', 'optional')}</div>
      <div class="tiles">${tile('t1', 'Gross profit')}${tile('t2', 'Gross profit margin')}${tile('t3', 'Net (operating) profit')}${tile('t4', 'Net profit margin')}</div>`,
    calc() {
      const R = num($('rev').value), op = num($('open').value), pu = num($('purch').value), cl = num($('close').value), X = num($('opex').value);
      let C = num($('cogs').value), helper = false;
      if (op >= 0 && pu >= 0 && cl >= 0 && isFinite(op + pu + cl)) { C = op + pu - cl; helper = true; $('cogs').value = C.toFixed(2); }
      if (!(R > 0) || !(C >= 0)) return { msg: 'Enter revenue and cost of goods sold (or opening stock, purchases and closing stock).' };
      const gp = R - C, gm = gp / R * 100, np = isFinite(X) ? gp - X : NaN, nm = np / R * 100;
      $('t1').textContent = money(gp); $('t2').textContent = pct(gm); $('t3').textContent = money(np); $('t4').textContent = isFinite(nm) ? pct(nm) : '—';
      let out = `<b style="color:#fff">Gross profit is ${money(gp)}, a gross margin of ${pct(gm)}.</b> ${helper ? `Cost of goods sold was worked out as opening stock plus purchases minus closing stock. ` : ''}`;
      if (isFinite(np)) out += `After ${money(X)} of operating expenses, profit is ${money(np)}, a net margin of ${pct(nm)}. `;
      out += `Every 1% of gross margin is worth ${money(R / 100)} on these sales. Find which products drag it down with the ${link('profit-margin-calculator.html', 'price list tool')}. ${review('gross-profit-result')}`;
      return { out, used: true };
    }
  }
,
  edge: {
    html: `<div class="g4">${f('sub', 'Software subscription, year 1 (S$)', '6000', 'licences in the quotation')}${f('impl', 'Implementation services (S$)', '22000', 'setup, data migration, training')}${sel('size', 'Company size', [['sme', 'SME (up to S$100m sales or 200 staff)'], ['non', 'Non-SME']], 'sme')}${sel('cores', 'Core functions covered', [['1', '1'], ['2', '2'], ['3', '3'], ['4', '4'], ['5', '5 or more']], '4')}</div>
      <div class="g4" style="margin-top:10px">${sel('local', 'Local shareholding', [['yes', 'At least 30% Singaporean or PR'], ['no', 'Less than 30%']], 'yes')}${sel('pre', 'Vendor', [['yes', 'Pre-approved vendor'], ['no', 'Not pre-approved']], 'yes')}${f('usedd', 'Already used this year: S$30k digital sub-cap (S$)', '0')}${f('usedt', 'Already used this year: S$100k overall cap (S$)', '0')}</div>
      <div class="tiles">${tile('t1', 'Estimated grant')}${tile('t2', 'Your net cost')}${tile('t3', 'Effective support')}${tile('t4', 'Typical approval time')}</div>`,
    calc() {
      const S = num($('sub').value), I = num($('impl').value), ud = num($('usedd').value) || 0, ut = num($('usedt').value) || 0;
      const total = (S || 0) + (I || 0);
      if (!(total > 0)) return { msg: 'Enter the software and implementation costs from your quotation.' };
      const sme = $('size').value === 'sme', rate = sme ? 0.5 : 0.3, cores = parseInt($('cores').value, 10), local = $('local').value === 'yes', pre = $('pre').value === 'yes';
      const raw = total * rate, roomD = Math.max(0, 30000 - ud), roomT = Math.max(0, 100000 - ut);
      let grant = Math.min(raw, roomD, roomT), why = [];
      if (!local) { grant = 0; why.push('EDGE needs at least 30% local (Singaporean or PR) shareholding'); }
      if (cores < 3) { grant = 0; why.push('an integrated enterprise system such as an ERP must cover at least 3 core functions (for example sales, inventory and accounting)'); }
      $('t1').textContent = money(grant); $('t2').textContent = money(total - grant); $('t3').textContent = pct(grant / total * 100); $('t4').textContent = pre ? 'About 1 week' : 'About 10 weeks';
      let out;
      if (grant === 0) out = `<b style="color:#fff">On these answers the project would not qualify:</b> ${why.join('; and ')}. `;
      else {
        const capped = grant < raw - 0.005;
        out = `<b style="color:#fff">Estimated EDGE grant: ${money(grant)}, so your net cost is ${money(total - grant)}.</b> That is ${sme ? 'the SME rate of up to 50%' : 'the non-SME rate of up to 30%'}${capped ? `, limited by the ${roomD <= roomT ? 'S$30,000 sub-cap for digital solutions and enterprise systems' : 'S$100,000 annual cap'} (${money(raw)} before the cap)` : ''}. `;
        out += `You pay the vendor first and claim afterwards; claims for digital solutions and enterprise systems open from 1 November 2026. ${pre ? 'With a pre-approved vendor, Enterprise Singapore quotes about a week to process the application.' : 'With a vendor that is not pre-approved, expect about 10 weeks to process.'} Apply before you sign or pay anything. `;
      }
      out += `This is an estimate: Enterprise Singapore decides the activity, the support level and which costs qualify. Not sure how your quotation should be split? ${review('edge-calculator-result')}`;
      return { out, used: true };
    }
  },
  invcost: {
    html: `<div class="g4">${f('users', 'People who need a login', '5')}${f('locs', 'Stock locations (warehouses, shops)', '2')}${f('orders', 'Sales orders per month', '300')}${sel('batch', 'Batch, lot or serial tracking?', [['no', 'No'], ['yes', 'Yes']], 'no')}</div>
      <div class="g4" style="margin-top:10px">${f('fx', 'S$ per US$1', '1.28', 'exchange rate')}${f('setup', 'Your setup budget (S$, optional)', '', 'training, data import')}</div>
      <div class="tiles">${tile('t1', 'Lowest 12-month cost')}${tile('t2', 'Cheapest fit')}${tile('t3', 'Highest 12-month cost')}${tile('t4', 'Per user per month (lowest)')}</div>`,
    calc() {
      const U = Math.round(num($('users').value)), L = Math.round(num($('locs').value)), O = num($('orders').value), R = num($('fx').value), B = $('batch').value === 'yes', SU = num($('setup').value) || 0;
      if (!(U >= 1) || !(L >= 1) || !(O >= 0) || !(R > 0)) return { msg: 'Enter users, locations, orders per month and an exchange rate.' };
      const res = [];
      // Zoho Inventory, SGD, billed annually (zoho.com/inventory/pricing, checked 6 Oct 2026)
      const ZP = [['Free', 0, 50, 1, 2], ['Standard', 39, 500, 2, 2], ['Professional', 109, 3000, 2, 4], ['Premium', 169, 7500, 2, 6], ['Enterprise', 329, 15000, 7, 10]];
      const zf = ZP.filter(p => O <= p[2] && !(B && (p[0] === 'Free' || p[0] === 'Standard')) && !(p[0] === 'Free' && (U > 1 || L > 2)));
      if (zf.length) { const z = zf.map(p => ({ p, m: p[1] + Math.max(0, U - p[3]) * 10 + Math.max(0, L - p[4]) * 12 })).sort((a, b) => a.m - b.m)[0]; res.push({ n: 'Zoho Inventory', plan: z.p[0], y: z.m * 12, note: 'SGD, billed yearly; extra users S$10 and locations S$12 a month' }); }
      else res.push({ n: 'Zoho Inventory', plan: '', y: NaN, note: 'over 15,000 orders a month: ask Zoho' });
      // inFlow, USD billed annually (inflowinventory.com/software-pricing-inflow)
      const IP = [['Lite', 99, 2, 1], ['Core', 299, 5, 5], ['Pro', 499, 10, 1e9], ['Max', 699, 20, 1e9]];
      const ifit = IP.filter(p => L <= p[3]).map(p => ({ p, m: p[1] + Math.max(0, U - p[2]) * 29 + (B ? 39 : 0) })).sort((a, b) => a.m - b.m)[0];
      res.push({ n: 'inFlow Inventory', plan: ifit.p[0], y: (ifit.m * 12 + (ifit.p[0] === 'Lite' ? 0 : 499)) * R, note: `USD; extra users US$29 a month${B ? ', serial-number add-on US$39 a month' : ''}${ifit.p[0] === 'Lite' ? '' : ', US$499 onboarding'}` });
      // Cin7 Core, USD (cin7.com/pricing): users and yearly order volume per plan
      const CP = [['Standard', 349, 5, 6000], ['Pro', 599, 10, 24000], ['Advanced', 1199, 15, 120000]];
      const c = CP.find(p => U <= p[2] && O * 12 <= p[3]);
      res.push(c ? { n: 'Cin7 Core', plan: c[0], y: c[1] * 12 * R, note: 'USD; unlimited locations; batch and serial included' } : { n: 'Cin7 Core', plan: '', y: NaN, note: 'beyond Advanced limits: price on request' });
      // Unleashed, USD paid monthly (unleashedsoftware.com/pricing): 100 orders included, order upgrades
      const up = O <= 100 ? 0 : O <= 500 ? 70 : O <= 1500 ? 200 : O <= 3000 ? 320 : 490;
      const uc = [['Core', 399, 3, 69], ['Pro', 729, 5, 89]].map(p => ({ p, m: p[1] + Math.max(0, U - p[2]) * p[3] + up })).sort((a, b) => a.m - b.m)[0];
      res.push({ n: 'Unleashed', plan: uc.p[0], y: uc.m * 12 * R, note: `USD; ${up ? 'order upgrade US$' + up + ' a month; ' : ''}onboarding US$449 to US$5,549 extra` });
      // Odoo Standard, USD per user billed yearly (odoo.com/pricing), all apps
      res.push({ n: 'Odoo', plan: 'Standard', y: 16.90 * U * 12 * R, note: 'USD per user, billed yearly, all apps incl. accounting; implementation extra' });
      const ok = res.filter(r => isFinite(r.y)).sort((a, b) => a.y - b.y);
      const lo = ok[0], hi = ok[ok.length - 1];
      $('t1').textContent = money(lo.y + SU); $('t2').textContent = lo.n; $('t3').textContent = money(hi.y + SU); $('t4').textContent = money(lo.y / 12 / U);
      let out = `<b style="color:#fff">For ${U} users, ${L} location${L > 1 ? 's' : ''} and ${int(O)} orders a month, 12 months of licences run from ${money(lo.y)} (${lo.n}) to ${money(hi.y)} (${hi.n}).</b>${SU ? ` Your setup budget of ${money(SU)} is added to the tiles.` : ''}<br>`;
      out += res.map(r => `${r.n}${r.plan ? ' ' + r.plan : ''}: <b style="color:#fff">${isFinite(r.y) ? money(r.y) : 'n/a'}</b> (${r.note})`).join('<br>');
      out += `<br>List prices checked 6 October 2026, before taxes and promotions; USD plans converted at your rate. Katana is usage-based and Sortly tracks items without costing stock, so they are not priced here. Full comparison: ${link('https://www.gantry.work/p/best-inventory-software-small-business?utm_source=tools&utm_medium=inventory-cost-calculator', 'the best inventory software for small business', true)}. Choosing between these, or between an inventory app and an ERP? ${review('inventory-cost-result')}`;
      return { out, used: true };
    }
  }
};
const C = CALCS[K]; if (!C) return;
$('app').innerHTML = `<div class="pc"><div class="box">${C.html}<p class="hint" id="out" style="margin-top:14px;font-size:14.5px;line-height:1.6"></p><div class="msg" id="msg"></div><div class="row-acts"><button id="copyBtn">Copy result</button><button id="resetBtn">Reset example</button></div></div></div>`;
if (C.init) C.init();
const DEF = {}; document.querySelectorAll('#app input, #app select, #app textarea').forEach(el => { DEF[el.id] = el.value; });
try { const s = JSON.parse(store.get('calc_' + K, '{}')); Object.keys(s).forEach(k => { if ($(k) && k !== 'idate' && k !== 'asat') $(k).value = s[k]; }); } catch (e) {}
let counted = false, edits = 0;
function run(user) {
  $('msg').textContent = '';
  const r = C.calc() || {};
  if (r.msg) { $('msg').textContent = r.msg; $('out').innerHTML = ''; return; }
  $('out').innerHTML = r.out || '';
  const s = {}; document.querySelectorAll('#app input, #app select, #app textarea').forEach(el => { s[el.id] = el.value; }); store.set('calc_' + K, JSON.stringify(s));
  if (user && r.used && !counted && ++edits >= 2) { counted = true; countUse(); }
}
document.querySelectorAll('#app input, #app select, #app textarea').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => run(true)));
$('resetBtn').onclick = () => { Object.keys(DEF).forEach(k => { if ($(k)) $(k).value = DEF[k]; }); if (C.init) C.init(); run(false); };
$('copyBtn').onclick = async () => { const t = $('out').innerText; try { await navigator.clipboard.writeText(t); $('copyBtn').textContent = 'Copied'; setTimeout(() => $('copyBtn').textContent = 'Copy result', 1500); } catch (e) { prompt('Copy:', t); } ev('calc_copy'); };
function countUse() {
  const used = parseInt(store.get('tae_calc_' + K, '0'), 10) + 1; store.set('tae_calc_' + K, String(used)); ev('calc_use', { run: used });
  if ($('gate') && used >= 4 && store.get('nl_subscribed', '') !== '1' && parseInt(store.get('calc_gate_skips', '0'), 10) < 2) setTimeout(() => { $('gate').classList.remove('hidden'); ev('calc_gate_shown'); }, 1200);
}
if ($('gateDone')) $('gateDone').onclick = () => { store.set('nl_subscribed', '1'); $('gate').classList.add('hidden'); ev('calc_gate_done'); };
if ($('gateSkip')) $('gateSkip').onclick = () => { store.set('calc_gate_skips', String(parseInt(store.get('calc_gate_skips', '0'), 10) + 1)); $('gate').classList.add('hidden'); ev('calc_gate_skip'); };
document.addEventListener('click', e => { const a = e.target.closest('a'); if (a && /review\.html|make\.com|gantry\.work\/p\//.test(a.href)) ev('calc_cta', { href: a.href.slice(0, 80) }); });
run(false);
})();
