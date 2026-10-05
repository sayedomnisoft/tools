/* Labels links to Gantry guides that are scheduled but not yet published. */
(function () {
  var D = {"payment-reminder-email-templates": "2026-10-07T02:00:00Z", "profit-margin-formula": "2026-10-10T02:00:00Z", "how-to-calculate-hours-worked": "2026-10-12T02:00:00Z", "how-to-make-an-invoice": "2026-10-14T02:00:00Z", "whatsapp-crm-small-business": "2026-10-15T02:00:00Z", "automate-quotes-google-sheets-docs": "2026-10-16T02:00:00Z", "margin-vs-markup": "2026-10-17T02:00:00Z", "receipt-template": "2026-10-19T02:00:00Z", "purchase-order-template-google-sheets": "2026-10-20T02:00:00Z", "quotation-template": "2026-10-21T02:00:00Z", "accounts-receivable-aging-report": "2026-10-22T02:00:00Z", "automate-employee-onboarding": "2026-10-23T02:00:00Z", "days-sales-outstanding-formula": "2026-10-24T02:00:00Z", "invoice-vs-receipt": "2026-10-26T02:00:00Z", "approval-workflow-google-sheets": "2026-10-27T02:00:00Z", "statement-of-account-template": "2026-10-28T02:00:00Z", "purchase-order-vs-invoice": "2026-10-29T02:00:00Z", "month-end-close-checklist": "2026-10-31T02:00:00Z", "wati-alternatives": "2026-10-08T02:00:00Z", "stripe-to-quickbooks": "2026-10-09T02:00:00Z", "shopify-to-quickbooks": "2026-10-06T02:00:00Z", "woocommerce-to-xero": "2026-10-13T02:00:00Z"};
  var M = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var now = Date.now();
  document.querySelectorAll('a[href*="gantry.work/p/"]').forEach(function (a) {
    var m = a.href.match(/\/p\/([a-z0-9-]+)/); if (!m || !D[m[1]]) return;
    var t = new Date(D[m[1]]); if (t.getTime() <= now) return;
    var s = document.createElement('span'); s.className = 'soon';
    s.textContent = ' (publishes ' + t.getDate() + ' ' + M[t.getMonth()] + ')';
    s.style.cssText = 'font-size:.85em;opacity:.75;white-space:nowrap';
    a.parentNode.insertBefore(s, a.nextSibling);
  });
})();
