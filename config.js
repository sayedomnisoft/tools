/* tools.gantry.work site config. Edit the IDs here; nothing fires until an ID is filled in.
   Where to get each one:
   - linkedinPartnerId: LinkedIn Campaign Manager > Measure > Insight Tag > "I will install the tag myself" > the partner id in _linkedin_partner_id.
   - linkedinConversionId: Campaign Manager > Measure > Conversion tracking > "Book a call click" (event-specific, created 30 Oct 2026); fires on cal.com / review.html clicks via gantryLead().
   - metaPixelId: Meta Events Manager > Data sources > your Pixel > Settings > Pixel ID.
   - visitorId: company-level visitor identification. provider 'leadfeeder' needs the Leadfeeder/Dealfront tracker id (Settings > Tracking script, the id in ldfdr(...)); provider 'snitcher' needs the Snitcher site id (Install > the id in the snippet).
   - captureForm: the Tally form used by "Email me this result" (hidden fields tool, result, page).
   - checked: default "figures last checked" date shown in the trust strip; pages can override with <meta name="gantry-checked" content="YYYY-MM-DD">. */
window.GANTRY_CFG = {
  linkedinPartnerId: '9947994',
  linkedinConversionId: 30232532,
  metaPixelId: '',
  visitorId: { provider: '', id: '' },
  captureForm: 'X55QDY',
  checked: '2026-10-28',
  calLink: 'https://cal.com/sayed.r/20min'
};
