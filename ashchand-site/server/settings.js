const db = require('./db');

// Defaults double as the schema for the admin's Settings screen. The colour
// and type values are the ones from the approved design.
const DEFAULTS = [
  // --- Identity ---
  { key: 'site_name', label: 'Name', group: 'brand', type: 'text', value: 'Ash Chand' },
  { key: 'brand_mark', label: 'Logo letter', group: 'brand', type: 'text', value: 'A' },
  { key: 'brand_wordmark', label: 'Wordmark', group: 'brand', type: 'text', value: 'ASH CHAND' },
  { key: 'location', label: 'Location line', group: 'brand', type: 'text', value: 'Ash Chand / Melbourne, Australia' },
  { key: 'favicon_emoji', label: 'Favicon emoji', group: 'brand', type: 'text', value: '◆' },

  // --- Theme ---
  { key: 'color_paper', label: 'Paper (background)', group: 'theme', type: 'color', value: '#f7f3eb' },
  { key: 'color_ink', label: 'Ink (text and dark sections)', group: 'theme', type: 'color', value: '#151310' },
  { key: 'color_oxblood', label: 'Oxblood (accent)', group: 'theme', type: 'color', value: '#7e1f30' },
  { key: 'color_butter', label: 'Butter (highlight sections)', group: 'theme', type: 'color', value: '#f1d28a' },
  { key: 'color_muted', label: 'Muted text', group: 'theme', type: 'color', value: '#64605a' },
  { key: 'font_serif', label: 'Display font stack', group: 'theme', type: 'text', value: '"DM Serif Display", Georgia, serif' },
  { key: 'font_sans', label: 'Body font stack', group: 'theme', type: 'text', value: 'Manrope, Arial, sans-serif' },
  { key: 'font_import_url', label: 'Google Fonts URL', group: 'theme', type: 'text', value: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap' },
  { key: 'show_progress_bar', label: 'Show scroll progress bar', group: 'theme', type: 'checkbox', value: '1' },
  { key: 'custom_css', label: 'Custom CSS', group: 'theme', type: 'textarea', value: '' },

  // --- Footer & links ---
  { key: 'domain_label', label: 'Domain shown in the footer', group: 'footer', type: 'text', value: 'ashchand.com.au' },
  { key: 'footer_legal', label: 'Copyright line', group: 'footer', type: 'text', value: '© 2026 Ash Chand' },

  // --- Contact ---
  { key: 'contact_email', label: 'Email enquiries are sent about (optional)', group: 'contact', type: 'text', value: '' },
  { key: 'form_submit_label', label: 'Submit button label', group: 'contact', type: 'text', value: 'Send it through ↗' },
  { key: 'form_success_heading', label: 'Success heading', group: 'contact', type: 'text', value: 'Thank you — it is with me.' },
  { key: 'form_success_message', label: 'Success message', group: 'contact', type: 'textarea', value: 'I read every enquiry myself and will come back to you shortly.' },
  { key: 'form_note', label: 'Note under the form', group: 'contact', type: 'textarea', value: 'Your details stay with me. No lists, no forwarding.' },
  { key: 'form_notify_email', label: 'Notify this address on new enquiries', group: 'contact', type: 'text', value: '' },

  // --- SEO ---
  { key: 'seo_title', label: 'Page title', group: 'seo', type: 'text', value: 'Ash Chand — Leadership, culture and neuroinclusion' },
  { key: 'seo_description', label: 'Meta description', group: 'seo', type: 'textarea', value: 'Ash Chand is a CEO, facilitator and writer helping organisations get better at humans.' },
  { key: 'seo_og_image', label: 'Social share image', group: 'seo', type: 'image', value: '' },
  { key: 'site_url', label: 'Canonical site URL', group: 'seo', type: 'text', value: 'https://www.ashchand.com.au' },
  { key: 'analytics_id', label: 'Google Analytics ID (G-XXXX)', group: 'seo', type: 'text', value: '' },
  { key: 'head_scripts', label: 'Extra <head> HTML', group: 'seo', type: 'textarea', value: '' },
];

const GROUP_LABELS = {
  brand: 'Name & identity',
  theme: 'Colours & type',
  footer: 'Footer',
  contact: 'Contact form',
  seo: 'SEO & tracking',
};

function ensureDefaults() {
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  db.transaction(() => {
    for (const item of DEFAULTS) insert.run(item.key, item.value);
  })();
}

function all() {
  ensureDefaults();
  const out = {};
  for (const item of DEFAULTS) out[item.key] = item.value;
  for (const row of db.prepare('SELECT key, value FROM settings').all()) out[row.key] = row.value;
  return out;
}

function get(key, fallback = '') {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (row) return row.value;
  const def = DEFAULTS.find(d => d.key === key);
  return def ? def.value : fallback;
}

function set(key, value) {
  db.prepare(`
    INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).run(key, value == null ? '' : String(value));
}

function setMany(obj) {
  db.transaction(entries => {
    for (const [key, value] of entries) set(key, value);
  })(Object.entries(obj));
}

function schema() {
  const values = all();
  return {
    groups: Object.entries(GROUP_LABELS).map(([key, label]) => ({ key, label })),
    fields: DEFAULTS.map(d => ({ ...d, value: values[d.key] })),
  };
}

module.exports = { DEFAULTS, GROUP_LABELS, ensureDefaults, all, get, set, setMany, schema };
