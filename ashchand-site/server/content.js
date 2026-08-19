const db = require('./db');
const { parseJson } = require('./helpers');

const JSON_COLUMNS = {
  blocks: ['data'],
  form_fields: ['options'],
  enquiries: ['data'],
};

function hydrate(table, row) {
  if (!row) return row;
  const out = { ...row };
  for (const col of JSON_COLUMNS[table] || []) {
    out[col] = parseJson(row[col], col === 'data' ? {} : []);
  }
  return out;
}

function hydrateAll(table, rows) {
  return rows.map(row => hydrate(table, row));
}

function safeLimit(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, 500);
}

// --- Pages & blocks --------------------------------------------------------
function getPage(slug, { preview = false } = {}) {
  const page = db.prepare(`SELECT * FROM pages WHERE slug = ?${preview ? '' : " AND status = 'published'"}`).get(slug);
  if (!page) return null;
  return { ...page, blocks: getBlocks(page.id, { preview }) };
}

function getBlocks(pageId, { preview = false } = {}) {
  const rows = db.prepare(`
    SELECT * FROM blocks WHERE page_id = ?${preview ? '' : ' AND is_visible = 1'} ORDER BY sort_order, created_at
  `).all(pageId);
  return hydrateAll('blocks', rows);
}

function listPages() {
  return db.prepare('SELECT * FROM pages ORDER BY sort_order, title').all();
}

// --- Site furniture --------------------------------------------------------
function listNav(location) {
  return db.prepare('SELECT * FROM nav_items WHERE location = ? ORDER BY sort_order, label').all(location);
}

function listFormFields({ includeInactive = false } = {}) {
  const sql = `SELECT * FROM form_fields ${includeInactive ? '' : 'WHERE is_active = 1'} ORDER BY sort_order, created_at`;
  return hydrateAll('form_fields', db.prepare(sql).all());
}

function listEnquiries({ status = null, limit = 200 } = {}) {
  let sql = 'SELECT * FROM enquiries WHERE 1=1';
  const params = [];
  if (status) { sql += ' AND status = ?'; params.push(status); }
  sql += ` ORDER BY created_at DESC LIMIT ${safeLimit(limit) || 200}`;
  return hydrateAll('enquiries', db.prepare(sql).all(...params));
}

function listMedia() {
  return db.prepare('SELECT * FROM media ORDER BY created_at DESC').all();
}

// Only the contact block needs data resolved at render time.
function resolveBlockSource(block) {
  if (block.type === 'contact') return { fields: listFormFields() };
  return {};
}

function counts() {
  const one = sql => db.prepare(sql).get().n;
  return {
    pages: one('SELECT COUNT(*) AS n FROM pages'),
    sections: one('SELECT COUNT(*) AS n FROM blocks'),
    enquiries: one('SELECT COUNT(*) AS n FROM enquiries'),
    new_enquiries: one("SELECT COUNT(*) AS n FROM enquiries WHERE status = 'new'"),
    media: one('SELECT COUNT(*) AS n FROM media'),
    form_fields: one('SELECT COUNT(*) AS n FROM form_fields WHERE is_active = 1'),
  };
}

module.exports = {
  hydrate, hydrateAll, getPage, getBlocks, listPages,
  listNav, listFormFields, listEnquiries, listMedia,
  resolveBlockSource, counts, safeLimit,
};
