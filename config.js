/* tools.gantry.work site config. Edit the IDs here; nothing fires until an ID is filled in.
   Where to get each one:
   - linkedinPartnerId: LinkedIn Campaign Manager > Analyze > Insight Tag > "I will install the tag myself" > the partner id in _linkedin_partner_id.
   - metaPixelId: Meta Events Manager > Data sources > your Pixel > Settings > Pixel ID.
   - visitorId: company-level visitor identification. provider 'leadfeeder' needs the Leadfeeder/Dealfront tracker id (Settings > Tracking script, the id in ldfdr(...)); provider 'snitcher' needs the Snitcher site id (Install > the id in the snippet).
   - captureForm: the Tally form used by "Email me this result" (hidden fields tool, result, page).
   - checked: default "figures last checked" date shown in the trust strip; pages can override with <meta name="gantry-checked" content="YYYY-MM-DD">. */
window.GANTRY_CFG = {
  linkedinPartnerId: '',
  metaPixelId: '',
  visitorId: { provider: '', id: '' },
  captureForm: 'X55QDY',
  checked: '2026-10-28',
  calLink: 'https://cal.com/sayed.r/20min'
};
