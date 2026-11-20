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
const G = 'style="color:var(--blue)"';
const link = (href, t, ext) => `<a ${G} href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t}</a>`;
const review = m => link(`https://tools.gantry.work/review.html?utm_source=tools&utm_medium=${m}`, 'Book a free 20-minute review', true) + ' or ' + link(`https://tools.gantry.work/review.html?offer=video&utm_source=tools&utm_medium=${m}`, 'get a 2-minute video on this number', true);
const f = (id, label, val, ph, type) => `<div class="f"><label for="${id}">${label}</label><input type="${type || 'text'}" ${type === 'date' ? '' : 'inputmode="decimal"'} id="${id}" value="${val == null ? '' : val}" placeholder="${ph || ''}"></div>`;
const sel = (id, label, opts, v) => `<div class="f"><label for="${id}">${label}</label><select id="${id}">${opts.map(o => `<option value="${o[0]}"${o[0] === v ? ' selected' : ''}>${o[1]}</option>`).join('')}</select></div>`;
const tile = (id, label) => `<div class="tile"><b id="${id}">—</b><span>${label}</span></div>`;
const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const fdate = d => d.toLocaleDateString('en-SG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

// 20 Nov 2026: shared 2027 data for ph2027 and dl2027. Holidays from MOM's public holidays page (updated 19 Jun 2026).
const PH27 = [['2027-01-01', "New Year's Day"], ['2027-02-06', 'Chinese New Year'], ['2027-02-07', 'Chinese New Year (day 2)'], ['2027-03-10', 'Hari Raya Puasa'], ['2027-03-26', 'Good Friday'], ['2027-05-01', 'Labour Day'], ['2027-05-17', 'Hari Raya Haji'], ['2027-05-20', 'Vesak Day'], ['2027-08-09', 'National Day'], ['2027-10-28', 'Deepavali'], ['2027-12-25', 'Christmas Day']];
const PH27_OFF = new Set(PH27.map(h => h[0]).concat(['2027-02-08']));
const dOf = s => new Date(s + 'T00:00:00');
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const longd = d => `${DAYS[d.getDay()].slice(0, 3)} ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
const nextWorking = d => { const x = new Date(d); while (x.getDay() === 0 || x.getDay() === 6 || PH27_OFF.has(iso(x))) x.setDate(x.getDate() + 1); return x; };
const eom = (y, m1) => new Date(y, m1, 0);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const fileOut = (name, mime, text) => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800); } catch (e) { prompt('Copy:', text); } };
const makeIcs = (cal, items) => { const st = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, ''); const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Gantry//tools.gantry.work//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + icsEsc(cal)];
  items.forEach((it, i) => { const d = dOf(it.date), n = new Date(d); n.setDate(n.getDate() + 1); L.push('BEGIN:VEVENT', 'UID:' + it.date.replace(/-/g, '') + '-' + i + '-' + cal.replace(/[^a-z0-9]/gi, '').toLowerCase() + '@tools.gantry.work', 'DTSTAMP:' + st, 'DTSTART;VALUE=DATE:' + it.date.replace(/-/g, ''), 'DTEND;VALUE=DATE:' + iso(n).replace(/-/g, ''), 'SUMMARY:' + icsEsc(it.title), 'DESCRIPTION:' + icsEsc(it.note || ''), 'TRANSP:TRANSPARENT', 'END:VEVENT'); });
  L.push('END:VCALENDAR'); return L.join('\r\n') + '\r\n'; };
const makeCsv = (head, rows) => '\ufeff' + [head].concat(rows).map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n') + '\r\n';
const listTable = (head, rows) => `<div class="tw" style="margin-top:14px"><table style="margin:0"><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const btnRow = `<div class="row-acts" style="margin-top:12px"><button type="button" id="icsBtn">Add to my calendar (.ics)</button><button type="button" id="csvBtn">Download for Excel (CSV)</button><button type="button" id="prtBtn">Print</button></div>`;
const phNote = (d, w, plain, db, dg) => { const day = d.getDay(); if (day === 0) return 'Rest day (Sunday): the next working day, Monday 8 February, is the paid holiday'; if (day === 6 && w === '5') return "Non-working day: another day off, or one extra day's pay at the gross rate" + (dg ? ' (' + money(dg) + ')' : ''); if (day === 6) return 'Working day for you: a paid day off'; return "Paid day off. If worked: an extra day's pay at the basic rate" + (db ? ' (' + money(db) + ')' : ''); };

const CALCS = {
  notice: {
    // 19 Nov 2026: Singapore notice period (MOM: includes the day notice is given, rest days and public holidays; month-end rule from MOM's 30 Jan example).
    html: `<div class="g4">${f('gdate', 'Date notice is given', '', '', 'date')}${sel('basis', 'Notice period', [['contract', 'As stated in the contract'], ['act', 'Not in contract: by length of service']], 'contract')}${f('nlen', 'Length', '1')}${sel('unit', 'Unit', [['months', 'Months'], ['weeks', 'Weeks'], ['days', 'Days']], 'months')}</div>
      <div class="g4" style="margin-top:10px">${f('start', 'Employment start date (for length of service)', '', '', 'date')}${f('sal', 'Monthly gross salary (optional)', '', 'basic + contractual allowances')}${sel('wdays', 'Working days a week', [['5', '5 days'], ['5.5', '5.5 days'], ['6', '6 days']], '5')}${f('cur', 'Currency', 'S$')}</div>
      <div class="g4" style="margin-top:10px">${f('leave', 'Annual leave used to offset (optional)', '', 'working days, needs employer OK')}${f('early', 'Leaving earlier on (optional)', '', '', 'date')}</div>
      <div class="tiles">${tile('t1', 'Last day of notice')}${tile('t2', 'Calendar days counted')}${tile('t3', 'Last working day after leave offset')}${tile('t4', 'Salary in lieu')}</div>`,
    init() { const t = new Date(); $('gdate').value = iso(t); },
    calc() {
      const D = s => s ? new Date(s + 'T00:00:00') : null, g = D($('gdate').value);
      if (!g || isNaN(g)) return { msg: 'Enter the date notice is given.' };
      let n = num($('nlen').value), unit = $('unit').value, why = '';
      if ($('basis').value === 'act') {
        const st = D($('start').value);
        if (!st || isNaN(st) || st > g) return { msg: 'Enter the employment start date (before the notice date) to use the length-of-service rule.' };
        const wk = (g - st) / 864e5 / 7, yrs = (g.getFullYear() - st.getFullYear()) - ((g.getMonth() < st.getMonth() || (g.getMonth() === st.getMonth() && g.getDate() < st.getDate())) ? 1 : 0);
        if (wk < 26) { n = 1; unit = 'days'; why = 'less than 26 weeks of service'; } else if (yrs < 2) { n = 1; unit = 'weeks'; why = '26 weeks to less than 2 years of service'; } else if (yrs < 5) { n = 2; unit = 'weeks'; why = '2 to less than 5 years of service'; } else { n = 4; unit = 'weeks'; why = '5 years or more of service'; }
      }
      if (!(n > 0) || Math.round(n) !== n) return { msg: 'Enter the notice length as a whole number.' };
      let end;
      if (unit === 'days') { end = new Date(g); end.setDate(end.getDate() + n - 1); }
      else if (unit === 'weeks') { end = new Date(g); end.setDate(end.getDate() + 7 * n - 1); }
      else { const y = g.getFullYear(), m = g.getMonth() + n, last = new Date(y, m + 1, 0).getDate(); end = g.getDate() > last ? new Date(y, m, last) : new Date(y, m, g.getDate() - 1); }
      const cal = Math.round((end - g) / 864e5) + 1, W = num($('wdays').value) || 5;
      const wval = d => { const k = d.getDay(); return k === 0 ? 0 : k === 6 ? (W >= 6 ? 1 : W === 5.5 ? 0.5 : 0) : 1; };
      const span = (a, b) => { let t = 0; const d = new Date(a); while (d <= b) { t += wval(d); d.setDate(d.getDate() + 1); } return t; };
      const L = num($('leave').value); let lastWork = end;
      if (L > 0) { let left = L; const d = new Date(end); while (left > 0 && d >= g) { left -= wval(d); d.setDate(d.getDate() - 1); } while (d > g && wval(d) === 0) d.setDate(d.getDate() - 1); lastWork = d < g ? g : d; }
      const S = num($('sal').value), day = S > 0 ? 12 * S / (52 * W) : NaN, ea = D($('early').value);
      let lieu = NaN, lieuTxt = '';
      if (S > 0) {
        if (ea && !isNaN(ea) && ea < end) { const from = new Date(ea); from.setDate(from.getDate() + 1); const wd = span(from, end); lieu = wd * day; lieuTxt = `Leaving on ${fdate(ea)} leaves ${wd} working days of notice unserved: ${wd} × daily gross rate ${money(day)} = ${money(lieu)} in lieu.`; }
        else { lieu = unit === 'months' ? n * S : unit === 'weeks' ? n * 12 * S / 52 : n * day; lieuTxt = `Paying the whole notice in lieu instead of working it would be about ${money(lieu)}.`; }
      }
      $('t1').textContent = fdate(end); $('t2').textContent = int(cal); $('t3').textContent = L > 0 ? fdate(lastWork) : '—'; $('t4').textContent = S > 0 ? money(lieu) : '—';
      const label = `${n} ${unit === 'months' ? (n === 1 ? 'month' : 'months') : unit === 'weeks' ? (n === 1 ? 'week' : 'weeks') : (n === 1 ? 'day' : 'days')}`;
      let out = `<b style="color:var(--ink)">Notice given on ${fdate(g)} with ${label} of notice ends on ${fdate(end)}.</b> `;
      if (why) out += `With no notice period in the contract, the Employment Act minimum for ${why} is ${label}. `;
      out += `The count includes the day notice is given, rest days and public holidays (${cal} calendar days). `;
      if (L > 0) out += `Using ${L} days of annual leave to offset it, with the employer's agreement, brings the last working day forward to about ${fdate(lastWork)}; leave used this way is not paid out, and public holidays in between push it later. `;
      if (S > 0) out += lieuTxt + ` Daily gross rate = 12 × ${money(S)} ÷ (52 × ${W}) = ${money(day)}. CPF contributions are not required on salary in lieu of notice. `;
      out += `Notice must be given in writing. Rules here follow MOM's guidance for the Employment Act; your contract or company policy may set longer notice. ${link('timesheet-calculator.html', 'Timesheet and overtime calculator')} · ${review('notice-result')}`;
      return { out, used: true, headline: `Last day of notice ${fdate(end)}` };
    }
  },
  overtime: {
    // 20 Nov 2026: Singapore overtime under Part 4 of the Employment Act (MOM hours-of-work page, updated 24 Jul 2025): hourly basic = 12 x monthly basic / (52 x 44); OT >= 1.5x; non-workmen covered up to S$2,600 (rate capped at S$13.60), workmen up to S$4,500; 72 h a month; pay within 14 days of the salary period end.
    html: `<div class="g4">${sel('basis', 'Paid by', [['month', 'Month (monthly-rated)'], ['day', 'Day (daily-rated)'], ['hour', 'Hour (hourly-rated)']], 'month')}${f('basic', 'Basic pay (month, day or hour)', '2400', 'basic only, no allowances')}${f('hpd', 'Working hours a day (daily-rated only)', '8')}${sel('who', 'Employee type', [['nonwork', 'Non-workman (office, retail, service)'], ['workman', 'Workman (manual work)']], 'nonwork')}</div>
      <div class="g4" style="margin-top:10px">${f('oth', 'Overtime hours this month', '20')}${sel('mult', 'Overtime rate', [['1.5', '1.5x (the legal minimum)'], ['2', '2x (if your contract pays more)']], '1.5')}${f('pend', 'Last day of salary period (optional)', '', '', 'date')}${f('cur', 'Currency', 'S$')}</div>
      <div class="tiles">${tile('t1', 'Hourly basic rate')}${tile('t2', 'Overtime rate per hour')}${tile('t3', 'Overtime pay')}${tile('t4', 'Pay by (14 days)')}</div>`,
    calc() {
      const b = $('basis').value, B = num($('basic').value), H = num($('hpd').value), O = num($('oth').value), M = num($('mult').value) || 1.5, wk = $('who').value === 'workman';
      if (!(B > 0)) return { msg: 'Enter the basic pay: monthly, daily or hourly, without allowances.' };
      if (!(O >= 0)) return { msg: 'Enter the overtime hours (0 or more).' };
      let hr, how;
      if (b === 'month') { hr = 12 * B / (52 * 44); how = `12 × ${money(B)} ÷ (52 × 44) = ${money(hr)} an hour`; }
      else if (b === 'day') { if (!(H > 0)) return { msg: 'Enter the working hours a day.' }; hr = B / H; how = `${money(B)} a day ÷ ${H} hours = ${money(hr)} an hour`; }
      else { hr = B; how = `${money(B)} an hour`; }
      const thr = wk ? 4500 : 2600, monthly = b === 'month' ? B : null;
      const covered = monthly == null || monthly <= thr;
      let rateBase = hr, capped = false;
      if (!wk && covered && hr > 13.60) { rateBase = 13.60; capped = true; }
      const otr = rateBase * M, pay = otr * O;
      let due = null; if ($('pend').value) { due = new Date($('pend').value + 'T00:00:00'); if (!isNaN(due)) due.setDate(due.getDate() + 14); else due = null; }
      $('t1').textContent = money(hr); $('t2').textContent = money(otr); $('t3').textContent = money(pay); $('t4').textContent = due ? fdate(due) : 'add period end';
      let out = `<b style="color:var(--ink)">${int(O)} hours of overtime at ${money(otr)} an hour is ${money(pay)}.</b> Hourly basic rate: ${how}. Overtime pay = hourly basic rate × ${M} × ${int(O)} hours${capped ? `, with the hourly rate capped at S$13.60 because MOM caps it for non-workmen` : ''}. `;
      if (!covered) out += `<br><br><b>Note:</b> with a monthly basic salary of ${money(monthly)}, this ${wk ? 'workman' : 'non-workman'} is above the S$${thr.toLocaleString('en-SG')} limit for Part 4 of the Employment Act, so the legal overtime rules do not apply. Overtime, if any, follows the employment contract; the figure above is what 1.5x would cost. `;
      if (O > 72) out += `<br><br><b>Over the limit:</b> MOM allows up to 72 overtime hours a month unless the employer has an exemption. `;
      out += due ? `Overtime for a salary period ending ${fdate(new Date($('pend').value + 'T00:00:00'))} must be paid by ${fdate(due)} (within 14 days). ` : `Overtime must be paid within 14 days after the last day of the salary period. `;
      out += `Allowances, bonuses and AWS are not part of the basic rate. Put the hours and the pay on the itemised payslip: the free ${link('payslip-generator-singapore.html', 'payslip generator')} has the fields MOM asks for. Doing this by hand for a whole team every month? ${review('overtime-result')}`;
      return { out, used: true, headline: `Overtime pay ${money(pay)} for ${int(O)} hours at ${money(otr)} an hour` };
    }
  },
  reorder: {
    // 20 Nov 2026: reorder point = lead-time demand + safety stock; safety stock by z-score (demand and optional lead-time variability) or the max-minus-average method.
    html: `<div class="g4">${f('d', 'Average daily demand (units)', '40')}${f('lt', 'Average lead time (days)', '7')}${sel('m', 'Safety stock method', [['z', 'Service level (z-score)'], ['mx', 'Max minus average'], ['days', 'Fixed days of cover'], ['none', 'No safety stock']], 'z')}${sel('sl', 'Service level', [['1.282', '90% (z 1.28)'], ['1.645', '95% (z 1.65)'], ['1.881', '97% (z 1.88)'], ['2.054', '98% (z 2.05)'], ['2.326', '99% (z 2.33)']], '1.645')}</div>
      <div class="g4" style="margin-top:10px">${f('sd', 'Std deviation of daily demand', '12', 'z-score method')}${f('slt', 'Std deviation of lead time (days, optional)', '', 'z-score method')}${f('md', 'Max daily demand', '60', 'max-minus-average')}${f('mlt', 'Max lead time (days)', '10', 'max-minus-average')}</div>
      <div class="g4" style="margin-top:10px">${f('cov', 'Days of cover (fixed-days method)', '3')}${f('oh', 'Stock on hand + on order (optional)', '', 'to check if you should order')}${f('uc', 'Unit cost (optional)', '', 'to value the safety stock')}${f('cur', 'Currency', 'S$')}</div>
      <div class="tiles">${tile('t1', 'Reorder point')}${tile('t2', 'Safety stock')}${tile('t3', 'Demand during lead time')}${tile('t4', 'Order now?')}</div>`,
    calc() {
      const d = num($('d').value), L = num($('lt').value), m = $('m').value, z = num($('sl').value), sd = num($('sd').value), sl = num($('slt').value), md = num($('md').value), ml = num($('mlt').value), cov = num($('cov').value), oh = num($('oh').value), uc = num($('uc').value);
      if (!(d > 0) || !(L > 0)) return { msg: 'Enter the average daily demand and the average lead time in days.' };
      const ltd = d * L; let ss = 0, how = '';
      if (m === 'z') {
        if (!(sd >= 0)) return { msg: 'Enter the standard deviation of daily demand (Excel: =STDEV.S of your daily sales).' };
        if (sl > 0) { ss = z * Math.sqrt(L * sd * sd + d * d * sl * sl); how = `z ${z.toFixed(2)} × √(${L} × ${sd}² + ${d}² × ${sl}²) = ${int(Math.ceil(ss))}, rounded up`; }
        else { ss = z * sd * Math.sqrt(L); how = `z ${z.toFixed(2)} × ${sd} × √${L} = ${int(Math.ceil(ss))}, rounded up`; }
      } else if (m === 'mx') {
        if (!(md >= d) || !(ml >= L)) return { msg: 'Max daily demand and max lead time must be at least the averages.' };
        ss = md * ml - d * L; how = `(${md} × ${ml}) − (${d} × ${L}) = ${int(ss)}`;
      } else if (m === 'days') { if (!(cov >= 0)) return { msg: 'Enter the days of cover.' }; ss = d * cov; how = `${d} a day × ${cov} days = ${int(ss)}`; }
      ss = Math.ceil(ss); const rop = Math.ceil(ltd + ss);
      $('t1').textContent = int(rop) + ' units'; $('t2').textContent = int(ss) + ' units'; $('t3').textContent = int(ltd) + ' units';
      const hasOh = oh >= 0 && $('oh').value.trim() !== '';
      $('t4').textContent = hasOh ? (oh <= rop ? 'Yes, order now' : `Not yet (${int(Math.floor((oh - rop) / d))} days)`) : 'add stock';
      let out = `<b style="color:var(--ink)">Reorder when stock falls to ${int(rop)} units.</b> Demand during the lead time is ${d} × ${L} = ${int(ltd)} units${m !== 'none' ? `, plus ${int(ss)} units of safety stock (${how})` : ''}. `;
      if (m === 'z') out += `At this service level you should run out in about ${pct((1 - ({ '1.282': .90, '1.645': .95, '1.881': .97, '2.054': .98, '2.326': .99 })[$('sl').value]) * 100)} of order cycles. `;
      if (uc > 0) out += `The safety stock ties up about ${money(ss * uc)} of cash. `;
      if (hasOh) out += oh <= rop ? `With ${int(oh)} units on hand and on order you are at or below the reorder point: place the order today. ` : `With ${int(oh)} units on hand and on order you reach the reorder point in about ${int(Math.floor((oh - rop) / d))} days. `;
      const pv = ({ '1.282': .90, '1.645': .95, '1.881': .97, '2.054': .98, '2.326': .99 })[$('sl').value] || .95; out += `Excel: =${d} * ${L} + NORM.S.INV(${pv}) * STDEV.S(range) * SQRT(${L}) gives the z-score result for a ${Math.round(pv * 100)}% service level. Recalculate when demand or the supplier changes. Checking this for hundreds of items by hand? A system can raise the purchase order at the reorder point. ${review('reorder-result')}`;
      return { out, used: true, headline: `Reorder point ${int(rop)} units (safety stock ${int(ss)})` };
    }
  },
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
      let out = `<b style="color:var(--ink)">You need to sell ${int(units)} units (${money(sales)}) a month to cover ${money(F)} of fixed costs.</b> Every unit after that adds ${money(cm)} of profit.`;
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
      let out = `<b style="color:var(--ink)">Your DSO is ${dso.toFixed(1)} days.</b> On average, a sale is collected ${dso.toFixed(0)} days after it is made. `;
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
      const out = `<b style="color:var(--ink)">${mode === 'add' ? `${money(net)} plus ${R}% GST is ${money(gross)}` : `${money(gross)} including ${R}% GST is ${money(net)} before GST`}</b>, with GST of ${money(gst)}. Making an invoice? The free ${link('invoice-generator.html', 'invoice generator')} adds GST and switches to a tax invoice for you. Prices for a whole list: the ${link('profit-margin-calculator.html', 'price list tool')} shows prices incl. GST.`;
      return { out, used: true };
    }
  },
  duedate: {
    html: `<div class="g4">${f('idate', 'Invoice date', '', '', 'date')}${sel('terms', 'Payment terms', [['0', 'Due on receipt'], ['7', 'Net 7'], ['14', 'Net 14'], ['15', 'Net 15'], ['30', 'Net 30'], ['45', 'Net 45'], ['60', 'Net 60'], ['90', 'Net 90'], ['eom30', 'Net 30 EOM (end of month)'], ['custom', 'Custom number of days']], '30')}${f('cdays', 'Custom days', '', 'only for custom')}${f('asat', 'Check against date', '', '', 'date')}</div>
      <div class="g4" style="margin-top:10px">${f('amt', 'Invoice amount (optional)', '', 'e.g. 4800')}${f('rate', 'Late interest % a year (optional)', '', 'only if your terms allow it')}${f('cur', 'Currency', 'S$')}</div>
      <div class="g4" style="margin-top:10px">${f('dpct', 'Early payment discount % (optional)', '', 'e.g. 2 for 2/10 net 30')}${f('ddays', 'Discount if paid within (days)', '', 'e.g. 10')}</div>
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
      let out = `<b style="color:var(--ink)">An invoice dated ${fdate(id)} on ${$('terms').selectedOptions[0].text} terms is due on ${fdate(due)}.</b> `;
      out += diff > 0 ? `On ${fdate(as)} it is ${diff} days overdue${interest ? `, and ${R}% a year adds about ${money(interest)} of late interest` : ''}. ${diff <= 14 ? 'Time for a friendly reminder.' : diff <= 44 ? 'Time for a firm reminder and a phone call.' : 'Time for a final notice.'} The ${link('invoice-chaser.html', 'free reminder writer')} drafts it for you. ` : `Send a short courtesy reminder about three days before. `;
      const DP = num($('dpct').value), DD = num($('ddays').value), NT = Math.round((due - id) / 86400000);
      if (DP > 0 && DP < 100 && DD >= 0 && NT > DD) { const dl = new Date(id); dl.setDate(dl.getDate() + DD); const apr = DP / (100 - DP) * 365 / (NT - DD) * 100; out += `<br><br><b>Early payment discount ${DP}/${DD} net ${NT}:</b> paying by ${fdate(dl)} takes ${DP}% off${A > 0 ? `, so ${money(A * (1 - DP / 100))} instead of ${money(A)} (a saving of ${money(A * DP / 100)})` : ''}. Skipping the discount is like borrowing for ${NT - DD} days at about ${pct(apr)} a year (${DP} ÷ ${100 - DP} × 365 ÷ ${NT - DD}), so take it unless your cash costs more than that. `; }
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
      let out = `<b style="color:var(--ink)">${money(O)} to ${money(N)} is a ${inc >= 0 ? 'rise' : 'fall'} of ${pct(Math.abs(inc))}.</b> `;
      const C = num($('cost').value), NC = num($('ncost').value);
      if (C >= 0 && NC >= 0 && O > C) {
        const m = (O - C) / O, keep = $('keep').value; let np = keep === 'margin' ? (m < 1 ? NC / (1 - m) : NaN) : NC + (O - C);
        const rd = $('rnd').value; if (rd === '0.90') { let v = Math.floor(np) + 0.9; if (v < np - 1e-9) v += 1; np = v; } else if (rd === '1') np = Math.ceil(np - 1e-9);
        const need = (np - O) / O * 100, mOld = (O - NC) / O * 100, mNew = (np - NC) / np * 100;
        $('t5').textContent = money(np); $('t6').textContent = '+' + pct(need); $('t7').textContent = pct(mOld); $('t8').textContent = pct(mNew);
        out += `When the cost goes from ${money(C)} to ${money(NC)}, keeping the same ${keep === 'margin' ? 'margin of ' + pct(m * 100) : 'profit of ' + money(O - C)} means charging <b style="color:var(--ink)">${money(np)}</b>, a ${pct(need)} increase. Leave the price at ${money(O)} and your margin drops to ${pct(mOld)}. `;
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
      let out = `<b style="color:var(--ink)">Gross profit is ${money(gp)}, a gross margin of ${pct(gm)}.</b> ${helper ? `Cost of goods sold was worked out as opening stock plus purchases minus closing stock. ` : ''}`;
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
      const full = total * rate, raw = Math.min(total, 60000) * rate, roomD = Math.max(0, 30000 - ud), roomT = Math.max(0, 100000 - ut);
      let grant = Math.min(raw, roomD, roomT), why = [];
      if (!local) { grant = 0; why.push('EDGE needs at least 30% local (Singaporean or PR) shareholding'); }
      if (cores < 3) { grant = 0; why.push('an integrated enterprise system such as an ERP must cover at least 3 core functions (for example sales, inventory and accounting)'); }
      $('t1').textContent = money(grant); $('t2').textContent = money(total - grant); $('t3').textContent = pct(grant / total * 100); $('t4').textContent = pre ? 'About 1 week' : 'About 10 weeks';
      let out;
      if (grant === 0) out = `<b style="color:var(--ink)">On these answers the project would not qualify:</b> ${why.join('; and ')}. `;
      else {
        const capped = grant < full - 0.005, byRoom = grant < raw - 0.005;
        out = `<b style="color:var(--ink)">Estimated EDGE grant: ${money(grant)}, so your net cost is ${money(total - grant)}.</b> That is ${sme ? 'the SME rate of up to 50%' : 'the non-SME rate of up to 30%'}${capped ? (byRoom ? `, limited by the ${roomD <= roomT ? 'S$30,000 sub-cap for digital solutions and enterprise systems' : 'S$100,000 annual cap'} (${money(raw)} before the cap)` : `, limited by the S$60,000 cap on qualifying cost for an integrated ERP (${money(full)} before the cap; the most is S$30,000 for an SME and S$18,000 for a non-SME)`) : ''}. Software counts for up to 12 months; GST and maintenance are not covered. `;
        out += `You pay the vendor first and claim afterwards; it is a single final claim once the project is delivered and paid in full. Claims open from 1 January 2027 for an ERP or other integrated enterprise system, and from 1 December 2026 for single-function digital solutions and pre-scoped equipment. ${pre ? 'With a pre-approved vendor, Enterprise Singapore quotes about a week to process the application.' : 'With a vendor that is not pre-approved, expect about 10 weeks to process.'} Apply before you sign or pay anything. `;
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
      let out = `<b style="color:var(--ink)">For ${U} users, ${L} location${L > 1 ? 's' : ''} and ${int(O)} orders a month, 12 months of licences run from ${money(lo.y)} (${lo.n}) to ${money(hi.y)} (${hi.n}).</b>${SU ? ` Your setup budget of ${money(SU)} is added to the tiles.` : ''}<br>`;
      out += res.map(r => `${r.n}${r.plan ? ' ' + r.plan : ''}: <b style="color:var(--ink)">${isFinite(r.y) ? money(r.y) : 'n/a'}</b> (${r.note})`).join('<br>');
      out += `<br>List prices checked 6 October 2026, before taxes and promotions; USD plans converted at your rate. Katana is usage-based and Sortly tracks items without costing stock, so they are not priced here. Full comparison: ${link('https://www.gantry.work/p/inventory-management-software-singapore-sme-guide?utm_source=tools&utm_medium=inventory-cost-calculator', 'the inventory software guide for Singapore SMEs', true)}. Choosing between these, or between an inventory app and an ERP? ${review('inventory-cost-result')}`;
      return { out, used: true };
    }
  },
  progressclaim: {
    html: `<div class="g4">${f('cv', 'Contract sum (excl. GST)', '186000')}${f('pc', 'Work done to date (% of contract)', '40', 'cumulative, e.g. 40')}${f('vo', 'Approved variations to date', '0', 'value of work done on VOs')}${f('mos', 'Materials on site (if allowed)', '0')}</div>
      <div class="g4" style="margin-top:10px">${f('ret', 'Retention %', '5')}${f('cap', 'Retention cap (% of contract sum)', '', 'leave blank if none')}${f('prev', 'Previous claims certified (net of retention)', '17670')}${f('gst', 'GST %', '9')}</div>
      <div class="g4" style="margin-top:10px">${f('cur', 'Currency', 'S$')}</div>
      <div class="tiles">${tile('t1', 'This claim (before GST)')}${tile('t2', 'Total with GST')}${tile('t3', 'Retention held to date')}${tile('t4', 'Certified so far')}</div>`,
    calc() {
      const CV = num($('cv').value), PC = num($('pc').value), VO = num($('vo').value) || 0, MOS = num($('mos').value) || 0, R = num($('ret').value) || 0, CAP = num($('cap').value), PREV = num($('prev').value) || 0, G = num($('gst').value) || 0;
      if (!(CV > 0) || !(PC >= 0)) return { msg: 'Enter the contract sum and the percentage of work done to date.' };
      const work = CV * PC / 100, gross = work + VO + MOS;
      let ret = gross * R / 100; const capv = isFinite(CAP) && CAP > 0 ? CV * CAP / 100 : Infinity; const capped = ret > capv; if (capped) ret = capv;
      const net = gross - ret, claim = net - PREV, gst = claim > 0 ? claim * G / 100 : 0, total = claim + gst;
      $('t1').textContent = money(claim); $('t2').textContent = money(total); $('t3').textContent = money(ret); $('t4').textContent = money(PREV);
      if (claim <= 0) return { out: `<b style="color:var(--ink)">Nothing to claim this period.</b> Net value to date ${money(net)} is not above the ${money(PREV)} already certified. Check the percentage complete, or whether a previous claim was entered gross instead of net of retention.`, used: true };
      let out = `<b style="color:var(--ink)">Progress claim this period: ${money(claim)} before GST, ${money(total)} with ${G}% GST.</b> Work done to date ${money(work)}${VO ? ` plus variations ${money(VO)}` : ''}${MOS ? ` plus materials on site ${money(MOS)}` : ''} = gross ${money(gross)}; less ${R}% retention ${money(ret)}${capped ? ` (capped at ${CAP}% of the contract sum)` : ''} = net ${money(net)}; less ${money(PREV)} certified before. `;
      out += `Retention of ${money(ret)} is now held against you; half is usually released at completion and the rest after the defects liability period, so diarise both. Claim cumulatively every period and serve it by the date your contract sets (if it is silent, the SOP Act default is the last day of the month). `;
      out += `Is finished work sitting unclaimed because the site team told finance late? ${review('progress-claim-result')}`;
      return { out, used: true, headline: `Progress claim ${money(claim)} before GST (${money(total)} with GST)` };
    }
  },
  jobcost: {
    html: `<div class="g4">${f('cv', 'Contract or quoted value', '186000')}${f('bud', 'Cost budget for the job', '140000')}${f('pc', 'Work complete (%)', '40')}${f('billed', 'Billed to the customer so far', '18600')}</div>
      <div class="g4" style="margin-top:10px">${f('mat', 'Materials and supplier bills to date', '54400')}${f('hrs', 'Labour hours to date', '260')}${f('rate', 'Average labour cost per hour', '32.72')}${f('sub', 'Subcontractors and other costs to date', '0')}</div>
      <div class="g4" style="margin-top:10px">${f('cur', 'Currency', 'S$')}</div>
      <div class="tiles">${tile('t1', 'Cost to date')}${tile('t2', 'Budget used vs work done')}${tile('t3', 'Projected final cost')}${tile('t4', 'Done but not yet billed')}</div>`,
    calc() {
      const CV = num($('cv').value), B = num($('bud').value), PC = num($('pc').value), BL = num($('billed').value) || 0, MAT = num($('mat').value) || 0, H = num($('hrs').value) || 0, RT = num($('rate').value) || 0, SUB = num($('sub').value) || 0;
      if (!(B > 0) || !(PC >= 0)) return { msg: 'Enter the cost budget and how much of the job is complete.' };
      const lab = H * RT, cost = MAT + lab + SUB, used = cost / B * 100, proj = PC > 0 ? cost / (PC / 100) : NaN, over = isFinite(proj) ? proj - B : NaN, earned = CV > 0 ? CV * PC / 100 : NaN, unbilled = isFinite(earned) ? earned - BL : NaN, margin = isFinite(proj) && CV > 0 ? (CV - proj) / CV * 100 : NaN;
      $('t1').textContent = money(cost); $('t2').textContent = isFinite(used) ? `${pct(used)} vs ${pct(PC)}` : '—'; $('t3').textContent = money(proj); $('t4').textContent = money(unbilled);
      const gap = used - PC;
      let out = `<b style="color:var(--ink)">Cost to date is ${money(cost)}: ${pct(used)} of the budget spent with ${pct(PC)} of the work done.</b> That is materials ${money(MAT)}, labour ${money(lab)} (${int(H)} h at ${money(RT)}) and other ${money(SUB)}. `;
      if (isFinite(proj)) out += gap > 2 ? `At this rate the job finishes at about ${money(proj)}, roughly ${money(over)} over the ${money(B)} budget${isFinite(margin) ? `, leaving a ${pct(margin)} margin on the contract` : ''}. Check whether the gap is timing (materials bought ahead of use) or a real overrun (more hours than quoted) while there is still time to act. ` : gap < -2 ? `At this rate the job finishes at about ${money(proj)}, under budget by ${money(-over)}. Make sure all supplier bills and hours are actually booked to this job before you trust that. ` : `At this rate the job lands close to budget, at about ${money(proj)}. `;
      if (isFinite(unbilled)) out += unbilled > 0 ? `Billing lags the work: ${money(earned)} is earned but only ${money(BL)} invoiced, so ${money(unbilled)} of finished work is unbilled while wages and suppliers are paid. ` : `Billing is ahead of or level with the work done. `;
      out += `Want to see this per job without a spreadsheet? ${review('job-costing-result')}`;
      return { out, used: true, headline: `${pct(used)} of budget used at ${pct(PC)} complete; projected ${isFinite(over) ? (over >= 0 ? 'overrun ' : 'saving ') + money(Math.abs(over)) : 'n/a'}` };
    }
  },
  slowstock: {
    html: `<div class="g4">${f('qty', 'Quantity on hand', '480')}${f('cost', 'Unit cost', '12.50')}${f('use', 'Average monthly usage or sales (units)', '35', 'last 6 to 12 months')}${f('last', 'Months since last sale or issue', '2')}</div>
      <div class="g4" style="margin-top:10px">${f('p1', 'Provision % if cover is 6 to 12 months', '25')}${f('p2', 'Provision % if cover is 12 to 24 months', '50')}${f('p3', 'Provision % if over 24 months or no movement', '100')}${f('cur', 'Currency', 'S$')}</div>
      <div class="tiles">${tile('t1', 'Months of cover')}${tile('t2', 'Class')}${tile('t3', 'Stock value')}${tile('t4', 'Suggested provision')}</div>
      <div class="f" style="margin-top:14px"><label for="list">Whole list? Paste one line per item: name, quantity, unit cost, monthly usage</label><textarea id="list" rows="4" placeholder="SKU-001, 480, 12.50, 35&#10;SKU-002, 90, 48, 0"></textarea></div><div id="listOut"></div>`,
    calc() {
      const Q = num($('qty').value), C = num($('cost').value), U = num($('use').value), L = num($('last').value) || 0, P = [num($('p1').value) || 0, num($('p2').value) || 0, num($('p3').value) || 0];
      const cls = (q, u, last) => { const cover = u > 0 ? q / u : Infinity; if (!(q > 0)) return ['none', 0, 0]; if (cover === Infinity || last >= 12) return ['dead (no movement)', cover, P[2]]; if (cover > 24) return ['dead', cover, P[2]]; if (cover > 12) return ['very slow', cover, P[1]]; if (cover > 6) return ['slow', cover, P[0]]; if (cover > 3) return ['watch', cover, 0]; return ['healthy', cover, 0]; };
      if (!(Q >= 0) || !(C >= 0) || !(U >= 0)) return { msg: 'Enter quantity, unit cost and average monthly usage.' };
      const [k, cover, pp] = cls(Q, U, L), val = Q * C, prov = val * pp / 100;
      $('t1').textContent = cover === Infinity ? 'no movement' : cover.toFixed(1); $('t2').textContent = k; $('t3').textContent = money(val); $('t4').textContent = money(prov);
      const lines = $('list').value.split('\n').map(l => l.split(/[,\t;]/).map(x => x.trim())).filter(a => a.length >= 3 && isFinite(num(a[1])));
      let listTxt = '';
      if (lines.length) {
        const rows = lines.map(a => { const q = num(a[1]), c = num(a[2]) || 0, u = num(a[3]) || 0; const [kk, cv, p2] = cls(q, u, 0); return { n: a[0], q, c, u, k: kk, cover: cv, val: q * c, prov: q * c * p2 / 100 }; });
        const tv = rows.reduce((s, r) => s + r.val, 0), tp = rows.reduce((s, r) => s + r.prov, 0), slow = rows.filter(r => /slow|dead/.test(r.k));
        const sv = slow.reduce((s, r) => s + r.val, 0);
        $('listOut').innerHTML = `<div class="tw" style="margin-top:10px"><table class="pt" style="min-width:0"><thead><tr><th>Item</th><th>Cover (mo)</th><th>Class</th><th>Value</th><th>Provision</th></tr></thead><tbody>${rows.sort((a, b) => (b.cover === Infinity ? 1e9 : b.cover) - (a.cover === Infinity ? 1e9 : a.cover)).map(r => `<tr><td>${r.n}</td><td>${r.cover === Infinity ? 'none' : r.cover.toFixed(1)}</td><td>${r.k}</td><td>${money(r.val)}</td><td>${money(r.prov)}</td></tr>`).join('')}<tr style="font-weight:800"><td>Total (${rows.length} items)</td><td></td><td>${slow.length} slow or dead</td><td>${money(tv)}</td><td>${money(tp)}</td></tr></tbody></table></div>`;
        listTxt = ` Across the ${rows.length} items pasted, ${slow.length} are slow or dead, holding ${money(sv)} of ${money(tv)} (${pct(tv ? sv / tv * 100 : 0)}), with a suggested provision of ${money(tp)}.`;
      } else $('listOut').innerHTML = '';
      let out = `<b style="color:var(--ink)">${cover === Infinity ? 'No movement: this item is dead stock' : `${cover.toFixed(1)} months of cover: ${k}`}, ${money(val)} of cash on the shelf${pp ? `, suggested provision ${money(prov)} (${pp}%)` : ''}.</b>${listTxt} `;
      out += pp >= 50 ? `Decide this month: sell it off at cost, bundle it, return it to the supplier, or write it off and free the space. Every month it sits, the provision grows and the cash does not come back. ` : pp ? `Stop reordering it, drop the reorder point to zero and move it with a promotion or a bundle before it crosses 12 months. ` : `Keep buying it, but check that the reorder quantity matches ${U > 0 ? int(U) + ' units a month' : 'real usage'} rather than the supplier's pack size. `;
      out += `Seeing this for every SKU every month needs stock and sales in one place. ${review('slow-stock-result')}`;
      return { out, used: true, headline: `${cover === Infinity ? 'No movement' : cover.toFixed(1) + ' months of cover'}: ${k}, ${money(val)} on hand` };
    }
  },
  stocktake: {
    html: `<div class="f"><label for="list">Paste your count: one line per item as name, system quantity, counted quantity, unit cost (cost optional)</label><textarea id="list" rows="6" placeholder="Laksa paste 1kg, 120, 117, 8.40&#10;Rice 25kg, 40, 40, 38&#10;Cooking oil 20L, 18, 21, 42"></textarea></div>
      <div class="g4" style="margin-top:10px">${f('tol', 'Tolerance (% per line counts as accurate)', '2')}${f('cur', 'Currency', 'S$')}</div>
      <div class="tiles">${tile('t1', 'Record accuracy')}${tile('t2', 'Lines within tolerance')}${tile('t3', 'Net variance (value)')}${tile('t4', 'Absolute variance (value)')}</div><div id="listOut"></div>`,
    calc() {
      const T = num($('tol').value) || 0;
      const rows = $('list').value.split('\n').map(l => l.split(/[,\t;]/).map(x => x.trim())).filter(a => a.length >= 3 && isFinite(num(a[1])) && isFinite(num(a[2]))).map(a => { const sq = num(a[1]), cq = num(a[2]), c = num(a[3]) || 0; const d = cq - sq; return { n: a[0], sq, cq, c, d, dv: d * c, pctd: sq ? Math.abs(d) / sq * 100 : (cq ? 100 : 0) }; });
      if (!rows.length) return { msg: 'Paste at least one line: name, system quantity, counted quantity and, if you have it, unit cost.' };
      const exact = rows.filter(r => r.d === 0).length, within = rows.filter(r => r.pctd <= T).length, net = rows.reduce((s, r) => s + r.dv, 0), abs = rows.reduce((s, r) => s + Math.abs(r.dv), 0), sysv = rows.reduce((s, r) => s + r.sq * r.c, 0), hasCost = rows.some(r => r.c > 0);
      const acc = exact / rows.length * 100, accT = within / rows.length * 100;
      $('t1').textContent = pct(acc); $('t2').textContent = `${within} of ${rows.length} (${pct(accT)})`; $('t3').textContent = hasCost ? money(net) : 'add unit costs'; $('t4').textContent = hasCost ? money(abs) : 'add unit costs';
      const top = rows.slice().sort((a, b) => Math.abs(b.dv) - Math.abs(a.dv) || Math.abs(b.d) - Math.abs(a.d)).slice(0, 10);
      $('listOut').innerHTML = `<div class="tw" style="margin-top:10px"><table class="pt" style="min-width:0"><thead><tr><th>Item</th><th>System</th><th>Counted</th><th>Variance</th><th>%</th><th>Value</th></tr></thead><tbody>${top.map(r => `<tr><td>${r.n}</td><td>${int(r.sq)}</td><td>${int(r.cq)}</td><td>${r.d > 0 ? '+' : ''}${int(r.d)}</td><td>${pct(r.pctd)}</td><td>${r.c ? money(r.dv) : '—'}</td></tr>`).join('')}</tbody></table></div>`;
      let out = `<b style="color:var(--ink)">${pct(acc)} of lines matched exactly (${exact} of ${rows.length}); ${pct(accT)} are within your ${T}% tolerance.</b> `;
      if (hasCost) out += `The net variance is ${money(net)}, but the absolute variance is ${money(abs)} (${pct(sysv ? abs / sysv * 100 : 0)} of the ${money(sysv)} system value): overs and shorts cancel in the total while both are real errors. `;
      out += accT >= 95 ? `That is a good result; most operations target 95% or better. Keep the cycle counts going on the A items. ` : accT >= 85 ? `Fair, but below the 95% most operations aim for. Look at the top variances above: they usually trace to a few receiving or picking habits rather than theft. ` : `Below 85% the stock figure cannot be trusted for purchasing or costing. Count the top-value items weekly until the causes are fixed, then widen the counts. `;
      out += `Keeping accuracy up without a wall-to-wall count every quarter means cycle counting from a live system. ${review('stock-take-result')}`;
      return { out, used: true, headline: `Stock accuracy ${pct(accT)} within ${T}% (${exact} of ${rows.length} exact)${hasCost ? ', absolute variance ' + money(abs) : ''}` };
    }
  },
  ph2027: {
    // 20 Nov 2026: MOM public holidays 2027 (updated 19 Jun 2026); entitlement and pay (updated 30 Jul 2025); day rate = 12 x monthly (basic or gross) / (52 x days a week) (MOM monthly and daily salary, updated 8 Dec 2025).
    html: `<div class="g4">${sel('wk', 'Working days a week', [['5', '5 days (Saturday off, Sunday rest day)'], ['5.5', '5.5 days'], ['6', '6 days']], '5')}${f('basic', 'Monthly basic salary', '3000', 'basic only')}${f('gross', 'Monthly gross salary', '3300', 'basic + contractual allowances')}${f('nw', 'Public holidays worked in 2027', '1')}</div>
      <div class="g4" style="margin-top:10px">${f('staff', 'Number of staff like this (optional)', '1')}${f('cur', 'Currency', 'S$')}</div>
      <div class="tiles">${tile('t1', "Day's basic rate (working a holiday)")}${tile('t2', "Day's gross rate (holiday paid out)")}${tile('t3', 'Extra pay for holidays worked')}${tile('t4', 'Saturday holidays to give back')}</div>
      ${btnRow}<div id="phList"></div>`,
    init() {
      const items = () => PH27.map(h => ({ date: h[0], title: h[1] + ' (Singapore public holiday)', note: 'Source: MOM public holidays 2027, tools.gantry.work/singapore-public-holidays-2027.html' })).concat([{ date: '2027-02-08', title: 'Public holiday in lieu of Chinese New Year (rest day Sunday)', note: 'MOM: Monday 8 February 2027 is a public holiday if your rest day falls on 7 February 2027.' }]).sort((a, b) => a.date < b.date ? -1 : 1);
      $('icsBtn').onclick = () => { fileOut('singapore-public-holidays-2027.ics', 'text/calendar', makeIcs('Singapore public holidays 2027', items())); ev('calc_download', { kind: 'ics' }); };
      $('csvBtn').onclick = () => { const w = $('wk').value; fileOut('singapore-public-holidays-2027.csv', 'text/csv', makeCsv(['Date', 'Day', 'Holiday', 'For your staff'], items().map(it => { const d = dOf(it.date); return [it.date, DAYS[d.getDay()], it.title.replace(' (Singapore public holiday)', ''), phNote(d, w, true)]; }))); ev('calc_download', { kind: 'csv' }); };
      $('prtBtn').onclick = () => { ev('calc_download', { kind: 'print' }); window.print(); };
    },
    calc() {
      const W = num($('wk').value), B = num($('basic').value), G0 = num($('gross').value), N = num($('nw').value), S = num($('staff').value);
      if (!(B > 0)) return { msg: 'Enter the monthly basic salary.' };
      const G = G0 > 0 ? G0 : B; if (G < B) return { msg: 'Gross salary includes the basic salary, so it cannot be lower than the basic.' };
      const n = N >= 0 ? N : 0, st = S > 0 ? S : 1;
      const db = 12 * B / (52 * W), dg = 12 * G / (52 * W);
      const sats = PH27.filter(h => dOf(h[0]).getDay() === 6), satN = W === 5 ? sats.length : 0;
      const extra = db * n * st, satCost = dg * satN * st;
      $('t1').textContent = money(db); $('t2').textContent = money(dg); $('t3').textContent = money(extra); $('t4').textContent = satN ? `${satN} days (or ${money(satCost)})` : 'none';
      window.__phW = String(W);
      let out = `<b style="color:var(--ink)">Each public holiday worked costs ${money(db)} extra${st > 1 ? ` per person (${money(extra)} for ${int(st)} staff working ${int(n)})` : `, so ${int(n)} worked is ${money(extra)}`}.</b> Day's basic rate = 12 × ${money(B)} ÷ (52 × ${W}) = ${money(db)}. `;
      out += satN ? `On a 5-day week, ${sats.map(h => longd(dOf(h[0]))).join(', ')} fall on your non-working Saturday: give another day off for each, or pay one extra day at the gross rate, 12 × ${money(G)} ÷ (52 × 5) = ${money(dg)}, which is ${money(satCost)} for the year${st > 1 ? ` across ${int(st)} staff` : ''}. ` : `On a ${W}-day week Saturday is a working day, so the three Saturday holidays are simply paid days off. `;
      out += `Chinese New Year's second day is Sunday 7 February, so Monday 8 February is the paid holiday for anyone whose rest day is Sunday. Put the extra pay on the ${link('payslip-generator-singapore.html', 'itemised payslip')}. Doing this by hand every month? ${review('ph2027-result')}`;
      const rows = PH27.map(h => { const d = dOf(h[0]); return [longd(d), esc(h[1]), esc(phNote(d, String(W), false, db, dg))]; });
      rows.splice(3, 0, [longd(dOf('2027-02-08')), 'Holiday in lieu of Chinese New Year', 'Paid day off for staff whose rest day is Sunday']);
      $('phList').innerHTML = listTable(['Date', 'Holiday', `For staff on a ${W}-day week`], rows);
      return { out, used: true, headline: `Working a 2027 public holiday costs ${money(db)} extra a day` };
    }
  },
  dl2027: {
    // 20 Nov 2026: IRAS GST due dates (9 Oct 2026), CPF due date (21 Jan 2025), IRAS AIS (20 Aug 2026), IRAS CIT basics (ECI 3 months, 20 Oct 2026), Form C-S 30 Nov (10 Aug 2026), ACRA AR 7 months non-listed (14 May 2026), AGM 6 months (11 Feb 2026).
    html: `<div class="g4">${sel('fye', 'Financial year end', MON.map((m, i) => [String(i + 1), m]), '12')}${sel('gst', 'GST accounting periods', [['q1', 'Quarters from Jan (Jan to Mar)'], ['q2', 'Quarters from Feb (Feb to Apr)'], ['q3', 'Quarters from Mar (Mar to May)'], ['m', 'Monthly'], ['no', 'Not GST registered']], 'q1')}${sel('giro', 'GST paid by GIRO?', [['no', 'No'], ['yes', 'Yes']], 'no')}${sel('emp', 'Do you have employees?', [['yes', 'Yes'], ['no', 'No']], 'yes')}</div>
      <div class="g4" style="margin-top:10px">${sel('agm', 'Do you hold an AGM?', [['hold', 'Yes, we hold one'], ['skip', 'Exempt or dispensed']], 'hold')}${sel('obr', 'Share capital and an overseas branch register?', [['no', 'No (most companies)'], ['yes', 'Yes (8 months to file)']], 'no')}</div>
      <div class="tiles">${tile('t1', 'Deadlines in 2027')}${tile('t2', 'Next deadline')}${tile('t3', 'Annual return to ACRA')}${tile('t4', 'ECI')}</div>
      ${btnRow}<div id="dlList"></div>`,
    init() {
      $('icsBtn').onclick = () => { fileOut('singapore-business-deadlines-2027.ics', 'text/calendar', makeIcs('Business deadlines 2027', window.__dl || [])); ev('calc_download', { kind: 'ics' }); };
      $('csvBtn').onclick = () => { fileOut('singapore-business-deadlines-2027.csv', 'text/csv', makeCsv(['Date', 'Day', 'What is due', 'Source'], (window.__dl || []).map(it => [it.date, DAYS[dOf(it.date).getDay()], it.title, it.src]))); ev('calc_download', { kind: 'csv' }); };
      $('prtBtn').onclick = () => { ev('calc_download', { kind: 'print' }); window.print(); };
    },
    calc() {
      const F = parseInt($('fye').value, 10), g = $('gst').value, giro = $('giro').value === 'yes', emp = $('emp').value === 'yes', agm = $('agm').value === 'hold', ar8 = $('obr').value === 'yes';
      const L = [], add = (d, title, src, note) => { if (d.getFullYear() === 2027) L.push({ date: iso(d), title, src, note: (note ? note + ' ' : '') + 'Source: ' + src }); };
      const S = { gst: 'IRAS GST filing due dates', cpf: 'CPF Board due date for CPF contributions', ais: 'IRAS Auto-Inclusion Scheme', cit: 'IRAS basic guide to corporate income tax', cs: 'IRAS Form C-S/C-S (Lite)/C guidance', ar: 'ACRA annual return deadlines', agm: 'ACRA AGM due dates' };
      const fyl = y => `${eom(y, F).getDate()} ${MON[F - 1]} ${y}`;
      [2025, 2026, 2027].forEach(y => {
        add(eom(y, F + 3), `ECI for the year ended ${fyl(y)}`, S.cit, 'Within 3 months of the year end, unless the company qualifies for the ECI filing waiver.');
        if (agm) add(eom(y, F + 6), `AGM for the year ended ${fyl(y)}`, S.agm, 'Non-listed companies: within 6 months of the year end.');
        add(eom(y, F + (ar8 ? 8 : 7)), `Annual return to ACRA for the year ended ${fyl(y)}`, S.ar, ar8 ? '8 months: share capital and an overseas branch register.' : 'Non-listed companies: within 7 months of the year end.');
      });
      add(new Date(2027, 10, 30), 'Form C-S, C-S (Lite) or C for YA 2027 (financial year ended in 2026)', S.cs, 'Due by 30 November every year.');
      if (g !== 'no') {
        const ends = g === 'm' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] : g === 'q1' ? [3, 6, 9, 12] : g === 'q2' ? [1, 4, 7, 10] : [2, 5, 8, 11];
        [2026, 2027].forEach(y => ends.forEach(e => {
          const pe = eom(y, e), ps = new Date(y, e - (g === 'm' ? 1 : 3), 1), due = eom(y, e + 1);
          const per = g === 'm' ? `${MON[e - 1]} ${pe.getFullYear()}` : `${MON[ps.getMonth()].slice(0, 3)} ${ps.getFullYear()} to ${MON[pe.getMonth()].slice(0, 3)} ${pe.getFullYear()}`;
          const wk = due.getDay() === 0 || due.getDay() === 6 ? ' Falls on a weekend: file before it.' : '';
          add(due, `GST return${giro ? '' : ' and payment'} for ${per}`, S.gst, 'One month after the end of the accounting period.' + wk);
          if (giro) add(nextWorking(new Date(due.getFullYear(), due.getMonth() + 1, 15)), `GST GIRO deduction for ${per}`, S.gst, 'IRAS deducts on the 15th of the month after the due date, or the next working day.');
        }));
      }
      if (emp) {
        for (let m = 0; m < 12; m++) { const forM = new Date(2026, 11 + m, 1), raw = new Date(2027, m, 14), d = nextWorking(raw);
          add(d, `CPF contributions for ${MON[forM.getMonth()]} ${forM.getFullYear()}`, S.cpf, iso(d) === iso(raw) ? 'Pay by the 14th of the following month.' : `The 14th is a ${DAYS[raw.getDay()] === 'Saturday' || DAYS[raw.getDay()] === 'Sunday' ? DAYS[raw.getDay()] : 'public holiday'}, so the deadline moves to the next working day.`); }
        add(new Date(2027, 2, 1), 'Employment income for 2026 (IR8A): submit under AIS, or give to employees', S.ais, 'By 1 March. AIS is compulsory with 5 or more employees.');
      }
      L.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : 0); window.__dl = L;
      const today = iso(new Date()), nx = L.find(x => x.date >= today), ar = L.find(x => /Annual return/.test(x.title)), eci = L.find(x => /^ECI/.test(x.title));
      $('t1').textContent = int(L.length); $('t2').textContent = nx ? longd(dOf(nx.date)) : 'none left in 2027'; $('t3').textContent = ar ? longd(dOf(ar.date)) : 'not in 2027'; $('t4').textContent = eci ? longd(dOf(eci.date)) : 'not in 2027';
      let out = `<b style="color:var(--ink)">${int(L.length)} deadlines in 2027 for a company with a ${MON[F - 1]} year end${g === 'no' ? '' : ', ' + (g === 'm' ? 'monthly' : 'quarterly') + ' GST'}${emp ? ' and staff' : ''}.</b> ${nx ? `The next one is ${longd(dOf(nx.date))}: ${esc(nx.title)}. ` : ''}`;
      out += `Every date comes from the IRAS, CPF Board or ACRA page named in the list. Download the list into your calendar so nobody has to remember it. Chasing these dates from three systems? ${review('dl2027-result')}`;
      $('dlList').innerHTML = listTable(['Date', 'What is due', 'Source'], L.map(x => [longd(dOf(x.date)), esc(x.title) + (/weekend|moves/.test(x.note) ? `<br><span style="font-size:13px;color:var(--ink-3)">${esc(x.note.split(' Source:')[0])}</span>` : ''), esc(x.src)]));
      return { out, used: true, headline: `${L.length} business deadlines in 2027 for a ${MON[F - 1]} year end` };
    }
  },
  landedcost: {
    html: `<div class="g4">${f('price', 'Supplier price per unit (foreign currency)', '8.50')}${f('units', 'Units in the shipment', '1200')}${f('fx', 'Exchange rate (S$ per 1 unit of that currency)', '1.35', 'e.g. 1.35 for USD')}${f('cur', 'Your currency', 'S$')}</div>
      <div class="g4" style="margin-top:10px">${f('freight', 'Freight to Singapore (S$)', '1800')}${f('ins', 'Insurance (S$)', '60')}${f('duty', 'Customs duty %', '0', 'most goods 0; liquor, tobacco, vehicles, petroleum differ')}${f('gst', 'Import GST %', '9')}</div>
      <div class="g4" style="margin-top:10px">${f('local', 'Local charges: port, handling, delivery (S$)', '450')}${sel('reg', 'GST registered?', [['yes', 'Yes, I claim import GST back'], ['no', 'No, import GST is a cost']], 'yes')}</div>
      <div class="tiles">${tile('t1', 'Landed cost per unit')}${tile('t2', 'Uplift over supplier price')}${tile('t3', 'Total landed cost')}${tile('t4', 'Import GST payable')}</div>`,
    calc() {
      const P = num($('price').value), N = num($('units').value), FX = num($('fx').value), FR = num($('freight').value) || 0, IN = num($('ins').value) || 0, D = num($('duty').value) || 0, G = num($('gst').value) || 0, LC = num($('local').value) || 0, reg = $('reg').value === 'yes';
      if (!(P > 0) || !(N > 0) || !(FX > 0)) return { msg: 'Enter the supplier price, the number of units and the exchange rate.' };
      const fob = P * N * FX, cif = fob + FR + IN, duty = cif * D / 100, gstv = (cif + duty) * G / 100, landed = cif + duty + LC + (reg ? 0 : gstv), unit = landed / N, supplierUnit = P * FX, uplift = (unit / supplierUnit - 1) * 100;
      $('t1').textContent = money(unit); $('t2').textContent = pct(uplift); $('t3').textContent = money(landed); $('t4').textContent = money(gstv);
      let out = `<b style="color:var(--ink)">Landed cost is ${money(unit)} per unit, ${pct(uplift)} above the ${money(supplierUnit)} supplier price.</b> Goods ${money(fob)} + freight ${money(FR)} + insurance ${money(IN)} = CIF ${money(cif)}${duty ? ` + duty ${money(duty)}` : ''} + local charges ${money(LC)}${reg ? '' : ` + import GST ${money(gstv)} (not claimable, so it is part of your cost)`} = ${money(landed)}. `;
      out += reg ? `Import GST of ${money(gstv)} is paid at import on CIF plus duty and claimed back in your GST return, so it is cash flow, not cost. ` : `Because you are not GST registered, the ${money(gstv)} import GST stays in your cost. `;
      out += `Price from ${money(unit)}, not ${money(supplierUnit)}: at a 30% margin that means selling at ${money(unit / 0.7)} rather than ${money(supplierUnit / 0.7)}. ${link('profit-margin-calculator.html', 'Set the price')} · ${review('landed-cost-result')}`;
      return { out, used: true, headline: `Landed cost ${money(unit)} per unit, ${pct(uplift)} above supplier price` };
    }
  }
};
const C = CALCS[K]; if (!C) return;
$('app').innerHTML = `<div class="pc"><div class="box">${C.html}<p class="hint" id="out" style="margin-top:18px;font-size:16.5px;line-height:1.6"></p><div class="msg" id="msg"></div><div id="ladder"></div><div class="row-acts"><button id="copyBtn">Copy result</button><button id="resetBtn">Reset example</button></div></div></div>`;
if (C.init) C.init();
const DEF = {}; document.querySelectorAll('#app input, #app select, #app textarea').forEach(el => { DEF[el.id] = el.value; });
try { const s = JSON.parse(store.get('calc_' + K, '{}')); Object.keys(s).forEach(k => { if ($(k) && k !== 'idate' && k !== 'asat' && k !== 'gdate') $(k).value = s[k]; }); } catch (e) {}
let counted = false, edits = 0;
function run(user) {
  $('msg').textContent = '';
  const r = C.calc() || {};
  if (r.msg) { $('msg').textContent = r.msg; $('out').innerHTML = ''; return; }
  $('out').innerHTML = r.out || '';
  try { const hb = $('out').querySelector('b'); const head = (r.headline || (hb ? hb.textContent : '')).replace(/\s+/g, ' ').trim().slice(0, 120); if (head) { window.__gantryLast = { result: head }; if (window.gantryResult) window.gantryResult(head); if (window.GantryLadder) window.GantryLadder.render($('ladder'), { result: head }); } } catch (e) {}
  const s = {}; document.querySelectorAll('#app input, #app select, #app textarea').forEach(el => { s[el.id] = el.value; }); store.set('calc_' + K, JSON.stringify(s));
  if (user && r.used && !counted && ++edits >= 2) { counted = true; countUse(); }
}
document.querySelectorAll('#app input, #app select, #app textarea').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => run(true)));
$('resetBtn').onclick = () => { Object.keys(DEF).forEach(k => { if ($(k)) $(k).value = DEF[k]; }); if (C.init) C.init(); run(false); };
$('copyBtn').onclick = async () => { const t = $('out').innerText; try { await navigator.clipboard.writeText(t); $('copyBtn').textContent = 'Copied'; setTimeout(() => $('copyBtn').textContent = 'Copy result', 1500); } catch (e) { prompt('Copy:', t); } ev('calc_copy'); };
function countUse() {
  const used = parseInt(store.get('tae_calc_' + K, '0'), 10) + 1; store.set('tae_calc_' + K, String(used)); ev('calc_use', { run: used });
  // Newsletter prompt only on browsers that already asked for the video or booked: everyone else meets review-limit.html after three uses (/track.js).
  if ($('gate') && used >= 4 && store.get('gantry_unlocked', '') === '1' && store.get('nl_subscribed', '') !== '1' && parseInt(store.get('calc_gate_skips', '0'), 10) < 2) setTimeout(() => { $('gate').classList.remove('hidden'); ev('calc_gate_shown'); }, 1200);
}
if ($('gateDone')) $('gateDone').onclick = () => { store.set('nl_subscribed', '1'); $('gate').classList.add('hidden'); ev('calc_gate_done'); };
if ($('gateSkip')) $('gateSkip').onclick = () => { store.set('calc_gate_skips', String(parseInt(store.get('calc_gate_skips', '0'), 10) + 1)); $('gate').classList.add('hidden'); ev('calc_gate_skip'); };
document.addEventListener('click', e => { const a = e.target.closest('a'); if (a && /review\.html|make\.com|gantry\.work\/p\//.test(a.href)) ev('calc_cta', { href: a.href.slice(0, 80) }); });
run(false);
})();
