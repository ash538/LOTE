const db = require('./db');

// Every key here is editable in the admin (Settings + Theme screens). The
// defaults double as the schema: the admin builds its form from this list.
const DEFAULTS = [
  // --- Brand ---
  { key: 'site_name', label: 'Site name', group: 'brand', type: 'text', value: 'LOTE Marketing' },
  { key: 'site_tagline', label: 'Tagline', group: 'brand', type: 'text', value: 'Multicultural marketing that actually reaches people' },
  { key: 'logo_text', label: 'Logo text (used when no logo image)', group: 'brand', type: 'text', value: 'LOTE' },
  { key: 'logo_image', label: 'Logo image', group: 'brand', type: 'image', value: '' },
  { key: 'logo_image_height', label: 'Logo height (px)', group: 'brand', type: 'text', value: '34' },
  { key: 'favicon_emoji', label: 'Favicon emoji', group: 'brand', type: 'text', value: '◍' },

  // --- Theme ---
  { key: 'color_paper', label: 'Background', group: 'theme', type: 'color', value: '#faf7f2' },
  { key: 'color_ink', label: 'Text', group: 'theme', type: 'color', value: '#141414' },
  { key: 'color_primary', label: 'Primary', group: 'theme', type: 'color', value: '#1f3d2b' },
  { key: 'color_accent', label: 'Accent', group: 'theme', type: 'color', value: '#e2542c' },
  { key: 'color_muted', label: 'Muted surface', group: 'theme', type: 'color', value: '#efe9df' },
  { key: 'color_footer', label: 'Footer background', group: 'theme', type: 'color', value: '#141414' },
  { key: 'font_heading', label: 'Heading font stack', group: 'theme', type: 'text', value: '"Fraunces", "Georgia", serif' },
  { key: 'font_body', label: 'Body font stack', group: 'theme', type: 'text', value: '"Inter", "Helvetica Neue", Arial, sans-serif' },
  { key: 'font_import_url', label: 'Google Fonts URL', group: 'theme', type: 'text', value: 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap' },
  { key: 'heading_scale', label: 'Heading scale (0.8 – 1.3)', group: 'theme', type: 'text', value: '1' },
  { key: 'radius', label: 'Corner radius (px)', group: 'theme', type: 'text', value: '18' },
  { key: 'container_width', label: 'Max content width (px)', group: 'theme', type: 'text', value: '1240' },
  { key: 'button_style', label: 'Button style', group: 'theme', type: 'select', options: ['pill', 'rounded', 'square'], value: 'pill' },
  { key: 'custom_css', label: 'Custom CSS', group: 'theme', type: 'textarea', value: '' },

  // --- Contact ---
  { key: 'contact_email', label: 'Email', group: 'contact', type: 'text', value: 'hello@lotemarketing.com.au' },
  { key: 'contact_phone', label: 'Phone', group: 'contact', type: 'text', value: '+61 3 9000 0000' },
  { key: 'contact_address', label: 'Address', group: 'contact', type: 'textarea', value: 'Level 2, 108 Sydney Road\nBrunswick VIC 3056' },
  { key: 'contact_abn', label: 'ABN', group: 'contact', type: 'text', value: '' },
  { key: 'social_linkedin', label: 'LinkedIn URL', group: 'contact', type: 'text', value: '' },
  { key: 'social_instagram', label: 'Instagram URL', group: 'contact', type: 'text', value: '' },
  { key: 'social_facebook', label: 'Facebook URL', group: 'contact', type: 'text', value: '' },
  { key: 'social_x', label: 'X URL', group: 'contact', type: 'text', value: '' },

  // --- Footer ---
  { key: 'footer_heading', label: 'Footer heading', group: 'footer', type: 'text', value: 'Got a brief that needs to reach every community?' },
  { key: 'footer_cta_label', label: 'Footer button label', group: 'footer', type: 'text', value: 'Start a conversation' },
  { key: 'footer_cta_url', label: 'Footer button URL', group: 'footer', type: 'text', value: '/contact' },
  { key: 'footer_note', label: 'Acknowledgement / note', group: 'footer', type: 'textarea', value: 'We acknowledge the Traditional Custodians of the lands on which we work, and pay our respects to Elders past and present.' },
  { key: 'footer_legal', label: 'Copyright line', group: 'footer', type: 'text', value: '© LOTE Marketing. All rights reserved.' },

  // --- SEO & integrations ---
  { key: 'seo_title_suffix', label: 'Title suffix', group: 'seo', type: 'text', value: 'LOTE Marketing' },
  { key: 'seo_description', label: 'Default meta description', group: 'seo', type: 'textarea', value: 'LOTE Marketing is a multicultural marketing and communications agency helping government, health and not-for-profit clients reach culturally and linguistically diverse audiences.' },
  { key: 'seo_og_image', label: 'Default social share image', group: 'seo', type: 'image', value: '' },
  { key: 'site_url', label: 'Canonical site URL', group: 'seo', type: 'text', value: '' },
  { key: 'analytics_id', label: 'Google Analytics ID (G-XXXX)', group: 'seo', type: 'text', value: '' },
  { key: 'head_scripts', label: 'Extra <head> HTML', group: 'seo', type: 'textarea', value: '' },

  // --- Forms ---
  { key: 'form_heading', label: 'Enquiry form heading', group: 'forms', type: 'text', value: 'Tell us about your project' },
  { key: 'form_intro', label: 'Enquiry form intro', group: 'forms', type: 'textarea', value: 'Fill in what you know and we will come back to you within one business day.' },
  { key: 'form_submit_label', label: 'Submit button label', group: 'forms', type: 'text', value: 'Send enquiry' },
  { key: 'form_success_message', label: 'Success message', group: 'forms', type: 'textarea', value: 'Thanks — your enquiry has landed with our team. We will be in touch shortly.' },
  { key: 'form_notify_email', label: 'Notify this address on new enquiries', group: 'forms', type: 'text', value: '' },
];

const GROUP_LABELS = {
  brand: 'Brand',
  theme: 'Theme & typography',
  contact: 'Contact details',
  footer: 'Footer',
  seo: 'SEO & tracking',
  forms: 'Enquiry form',
};

function ensureDefaults() {
  const insert = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  const tx = db.transaction(() => {
    for (const item of DEFAULTS) insert.run(item.key, item.value);
  });
  tx();
}

function all() {
  ensureDefaults();
  const rows = db.prepare('SELECT key, value FROM settings').all();
  const out = {};
  for (const item of DEFAULTS) out[item.key] = item.value;
  for (const row of rows) out[row.key] = row.value;
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
  const tx = db.transaction(entries => {
    for (const [key, value] of entries) set(key, value);
  });
  tx(Object.entries(obj));
}

// Schema + current values, for the admin settings screen.
function schema() {
  const values = all();
  return {
    groups: Object.entries(GROUP_LABELS).map(([key, label]) => ({ key, label })),
    fields: DEFAULTS.map(d => ({ ...d, value: values[d.key] })),
  };
}

module.exports = { DEFAULTS, GROUP_LABELS, ensureDefaults, all, get, set, setMany, schema };
