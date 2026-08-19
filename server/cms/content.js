const db = require('./db');
const { parseJson, richText, excerptFrom, formatDate, readTime } = require('./helpers');

const JSON_COLUMNS = {
  services: ['capabilities'],
  work: ['gallery', 'results', 'service_tags'],
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

const publishedOnly = (preview) => (preview ? '' : " AND status = 'published'");

// Query strings reach these helpers directly, so a limit is only honoured when
// it is a sane positive integer.
function safeLimit(value) {
  const n = Math.floor(Number(value));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(n, 500);
}

// --- Pages -----------------------------------------------------------------
function getPage(slug, { preview = false } = {}) {
  const page = db.prepare(`SELECT * FROM pages WHERE slug = ?${publishedOnly(preview)}`).get(slug);
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

// --- Collections -----------------------------------------------------------
function listServices({ preview = false, limit = null, featuredOnly = false } = {}) {
  let sql = `SELECT * FROM services WHERE 1=1${publishedOnly(preview)}`;
  if (featuredOnly) sql += ' AND is_featured = 1';
  sql += ' ORDER BY sort_order, title';
  const max = safeLimit(limit);
  if (max) sql += ` LIMIT ${max}`;
  return hydrateAll('services', db.prepare(sql).all());
}

function getService(slug, { preview = false } = {}) {
  return hydrate('services', db.prepare(`SELECT * FROM services WHERE slug = ?${publishedOnly(preview)}`).get(slug));
}

function listWork({ preview = false, limit = null, featuredOnly = false, sector = null } = {}) {
  let sql = `SELECT * FROM work WHERE 1=1${publishedOnly(preview)}`;
  const params = [];
  if (featuredOnly) sql += ' AND is_featured = 1';
  if (sector) { sql += ' AND sector = ?'; params.push(sector); }
  sql += ' ORDER BY sort_order, created_at DESC';
  const max = safeLimit(limit);
  if (max) sql += ` LIMIT ${max}`;
  return hydrateAll('work', db.prepare(sql).all(...params));
}

function getWork(slug, { preview = false } = {}) {
  const item = hydrate('work', db.prepare(`SELECT * FROM work WHERE slug = ?${publishedOnly(preview)}`).get(slug));
  if (!item) return null;
  const siblings = listWork({ preview }).filter(w => w.id !== item.id).slice(0, 2);
  return { ...item, related: siblings };
}

function workSectors() {
  return db.prepare("SELECT DISTINCT sector FROM work WHERE status = 'published' AND sector != '' ORDER BY sector")
    .all().map(r => r.sector);
}

function listInsights({ preview = false, limit = null, category = null } = {}) {
  let sql = `SELECT * FROM insights WHERE 1=1${publishedOnly(preview)}`;
  const params = [];
  if (category) { sql += ' AND category = ?'; params.push(category); }
  sql += ' ORDER BY published_at DESC, created_at DESC';
  const max = safeLimit(limit);
  if (max) sql += ` LIMIT ${max}`;
  return db.prepare(sql).all(...params).map(decorateInsight);
}

function decorateInsight(row) {
  if (!row) return row;
  return {
    ...row,
    excerpt: row.excerpt || excerptFrom(row.body),
    date_label: formatDate(row.published_at),
    read_time: readTime(row.body),
  };
}

function getInsight(slug, { preview = false } = {}) {
  const row = db.prepare(`SELECT * FROM insights WHERE slug = ?${publishedOnly(preview)}`).get(slug);
  if (!row) return null;
  const related = listInsights({ preview, limit: 3 }).filter(i => i.id !== row.id).slice(0, 2);
  return { ...decorateInsight(row), body_html: richText(row.body), related };
}

function insightCategories() {
  return db.prepare("SELECT DISTINCT category FROM insights WHERE status = 'published' AND category != '' ORDER BY category")
    .all().map(r => r.category);
}

function listTeam({ preview = false, limit = null } = {}) {
  let sql = `SELECT * FROM team WHERE 1=1${publishedOnly(preview)} ORDER BY sort_order, name`;
  const max = safeLimit(limit);
  if (max) sql += ` LIMIT ${max}`;
  return db.prepare(sql).all();
}

function listTestimonials({ preview = false, limit = null } = {}) {
  let sql = `SELECT * FROM testimonials WHERE 1=1${publishedOnly(preview)} ORDER BY sort_order, created_at`;
  const max = safeLimit(limit);
  if (max) sql += ` LIMIT ${max}`;
  return db.prepare(sql).all();
}

function listClients({ preview = false } = {}) {
  return db.prepare(`SELECT * FROM clients WHERE 1=1${publishedOnly(preview)} ORDER BY sort_order, name`).all();
}

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

// Data a block needs from its collection, resolved at render time so content
// edits show up everywhere the block is used.
function resolveBlockSource(block, { preview = false } = {}) {
  const data = block.data || {};
  const limit = data.limit ? Number(data.limit) : null;
  switch (block.type) {
    case 'services_list':
      return { items: listServices({ preview, limit, featuredOnly: !!data.featured_only }) };
    case 'work_grid':
      return { items: listWork({ preview, limit, featuredOnly: !!data.featured_only }), sectors: workSectors() };
    case 'insights_list':
      return { items: listInsights({ preview, limit: limit || 3 }) };
    case 'logos':
      return { items: listClients({ preview }) };
    case 'testimonials':
      return { items: listTestimonials({ preview, limit: limit || 3 }) };
    case 'team_grid':
      return { items: listTeam({ preview, limit }) };
    case 'contact_form':
      return { fields: listFormFields() };
    default:
      return {};
  }
}

function counts() {
  const one = sql => db.prepare(sql).get().n;
  return {
    pages: one('SELECT COUNT(*) AS n FROM pages'),
    services: one('SELECT COUNT(*) AS n FROM services'),
    work: one('SELECT COUNT(*) AS n FROM work'),
    insights: one('SELECT COUNT(*) AS n FROM insights'),
    team: one('SELECT COUNT(*) AS n FROM team'),
    enquiries: one('SELECT COUNT(*) AS n FROM enquiries'),
    new_enquiries: one("SELECT COUNT(*) AS n FROM enquiries WHERE status = 'new'"),
    media: one('SELECT COUNT(*) AS n FROM media'),
  };
}

module.exports = {
  hydrate, hydrateAll, getPage, getBlocks, listPages,
  listServices, getService, listWork, getWork, workSectors,
  listInsights, getInsight, insightCategories, decorateInsight,
  listTeam, listTestimonials, listClients, listNav,
  listFormFields, listEnquiries, listMedia,
  resolveBlockSource, counts,
};
