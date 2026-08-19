const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

const db = require('../db');
const auth = require('../auth');
const content = require('../content');
const settingsStore = require('../settings');
const { BLOCKS, defaultsFor } = require('../blocks');
const { uniqueSlug, parseJson, boolInt, slugify } = require('../helpers');

const router = express.Router();

// --- Collection definitions ------------------------------------------------
// One place that says what an editor may write to each table.
const COLLECTIONS = {
  services: {
    table: 'services',
    slugFrom: 'title',
    fields: ['title', 'slug', 'summary', 'body', 'icon', 'image', 'status', 'seo_description'],
    jsonFields: ['capabilities'],
    boolFields: ['is_featured'],
    order: 'sort_order, title',
  },
  work: {
    table: 'work',
    slugFrom: 'title',
    fields: ['title', 'slug', 'client', 'sector', 'year', 'summary', 'challenge', 'approach', 'body',
      'hero_image', 'thumbnail', 'status', 'seo_description'],
    jsonFields: ['gallery', 'results', 'service_tags'],
    boolFields: ['is_featured'],
    order: 'sort_order, created_at DESC',
  },
  insights: {
    table: 'insights',
    slugFrom: 'title',
    fields: ['title', 'slug', 'excerpt', 'body', 'category', 'author', 'hero_image', 'published_at',
      'status', 'seo_description'],
    jsonFields: [],
    boolFields: ['is_featured'],
    order: 'published_at DESC',
  },
  team: {
    table: 'team',
    fields: ['name', 'role', 'bio', 'photo', 'email', 'linkedin', 'languages', 'status'],
    jsonFields: [],
    boolFields: [],
    order: 'sort_order, name',
  },
  testimonials: {
    table: 'testimonials',
    fields: ['quote', 'person', 'role', 'org', 'photo', 'status'],
    jsonFields: [],
    boolFields: [],
    order: 'sort_order',
  },
  clients: {
    table: 'clients',
    fields: ['name', 'logo', 'url', 'status'],
    jsonFields: [],
    boolFields: [],
    order: 'sort_order, name',
  },
  nav: {
    table: 'nav_items',
    fields: ['location', 'label', 'url', 'group_label'],
    jsonFields: [],
    boolFields: ['is_button', 'new_tab'],
    order: 'location, sort_order',
  },
  'form-fields': {
    table: 'form_fields',
    fields: ['name', 'label', 'type', 'placeholder', 'help', 'width'],
    jsonFields: ['options'],
    boolFields: ['is_required', 'is_active'],
    order: 'sort_order',
  },
};

const hasColumn = (table, column) =>
  db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === column);

// Two fields sharing a key would overwrite each other in the submitted data.
function uniqueFieldName(base, ignoreId) {
  let name = base;
  for (let n = 2; ; n += 1) {
    const clash = ignoreId
      ? db.prepare('SELECT id FROM form_fields WHERE name = ? AND id != ?').get(name, ignoreId)
      : db.prepare('SELECT id FROM form_fields WHERE name = ?').get(name);
    if (!clash) return name;
    name = `${base}_${n}`;
  }
}

function buildValues(def, body, { existing = null } = {}) {
  const values = {};

  for (const field of def.fields) {
    if (body[field] !== undefined) values[field] = body[field] == null ? '' : String(body[field]);
  }
  for (const field of def.jsonFields || []) {
    if (body[field] !== undefined) values[field] = JSON.stringify(parseJson(body[field], []));
  }
  for (const field of def.boolFields || []) {
    if (body[field] !== undefined) values[field] = boolInt(body[field]);
  }
  if (body.sort_order !== undefined && hasColumn(def.table, 'sort_order')) {
    values.sort_order = Number(body.sort_order) || 0;
  }

  if (def.slugFrom) {
    const wanted = values.slug || body.slug || (existing ? existing.slug : '') || values[def.slugFrom] || body[def.slugFrom];
    values.slug = uniqueSlug(db, def.table, wanted, existing ? existing.id : null);
  }
  // A form field always needs a usable key: clearing the box in the admin
  // regenerates it from the label rather than saving an empty name, which
  // would break every submission of the public form.
  if (def.table === 'form_fields' && (values.name !== undefined || !existing)) {
    const source = values.name || values.label || (existing && existing.label) || 'field';
    values.name = uniqueFieldName(slugify(source, 'field').replace(/-/g, '_'), existing ? existing.id : null);
  }
  return values;
}

function nextSortOrder(table) {
  if (!hasColumn(table, 'sort_order')) return 0;
  const row = db.prepare(`SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM ${table}`).get();
  return row.n;
}

function listCollection(key) {
  const def = COLLECTIONS[key];
  const rows = db.prepare(`SELECT * FROM ${def.table} ORDER BY ${def.order}`).all();
  return content.hydrateAll(def.table, rows);
}

router.get('/collections/:key', auth.requireAuth, (req, res) => {
  const def = COLLECTIONS[req.params.key];
  if (!def) return res.status(404).json({ error: 'Unknown collection' });
  res.json(listCollection(req.params.key));
});

router.get('/collections/:key/:id', auth.requireAuth, (req, res) => {
  const def = COLLECTIONS[req.params.key];
  if (!def) return res.status(404).json({ error: 'Unknown collection' });
  const row = db.prepare(`SELECT * FROM ${def.table} WHERE id = ?`).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(content.hydrate(def.table, row));
});

router.post('/collections/:key', auth.requireAuth, (req, res) => {
  const def = COLLECTIONS[req.params.key];
  if (!def) return res.status(404).json({ error: 'Unknown collection' });

  const values = buildValues(def, req.body || {});
  if (values.sort_order === undefined) values.sort_order = nextSortOrder(def.table);
  values.id = uuidv4();

  const cols = Object.keys(values);
  db.prepare(`INSERT INTO ${def.table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`)
    .run(...cols.map(c => values[c]));

  const row = db.prepare(`SELECT * FROM ${def.table} WHERE id = ?`).get(values.id);
  res.status(201).json(content.hydrate(def.table, row));
});

router.put('/collections/:key/:id', auth.requireAuth, (req, res) => {
  const def = COLLECTIONS[req.params.key];
  if (!def) return res.status(404).json({ error: 'Unknown collection' });

  const existing = db.prepare(`SELECT * FROM ${def.table} WHERE id = ?`).get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const values = buildValues(def, req.body || {}, { existing });
  const cols = Object.keys(values);
  if (cols.length) {
    const setSql = cols.map(c => `${c} = ?`).join(', ');
    const touch = hasColumn(def.table, 'updated_at') ? ", updated_at = datetime('now')" : '';
    db.prepare(`UPDATE ${def.table} SET ${setSql}${touch} WHERE id = ?`).run(...cols.map(c => values[c]), req.params.id);
  }

  const row = db.prepare(`SELECT * FROM ${def.table} WHERE id = ?`).get(req.params.id);
  res.json(content.hydrate(def.table, row));
});

router.delete('/collections/:key/:id', auth.requireAuth, (req, res) => {
  const def = COLLECTIONS[req.params.key];
  if (!def) return res.status(404).json({ error: 'Unknown collection' });
  db.prepare(`DELETE FROM ${def.table} WHERE id = ?`).run(req.params.id);
  res.json({ ok: true });
});

// Drag-and-drop reordering.
router.post('/collections/:key/reorder', auth.requireAuth, (req, res) => {
  const def = COLLECTIONS[req.params.key];
  if (!def) return res.status(404).json({ error: 'Unknown collection' });
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const stmt = db.prepare(`UPDATE ${def.table} SET sort_order = ? WHERE id = ?`);
  db.transaction(() => ids.forEach((id, index) => stmt.run(index, id)))();
  res.json({ ok: true });
});

// --- Pages & blocks --------------------------------------------------------
router.get('/pages', auth.requireAuth, (req, res) => res.json(content.listPages()));

router.get('/pages/:id', auth.requireAuth, (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!page) return res.status(404).json({ error: 'Page not found' });
  res.json({ ...page, blocks: content.getBlocks(page.id, { preview: true }) });
});

router.post('/pages', auth.requireAuth, (req, res) => {
  const body = req.body || {};
  const id = uuidv4();
  const slug = uniqueSlug(db, 'pages', body.slug || body.title || 'page');
  db.prepare(`
    INSERT INTO pages (id, slug, title, nav_label, status, show_in_nav, sort_order, seo_title, seo_description, og_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, slug, body.title || 'Untitled page', body.nav_label || '', body.status || 'draft',
    boolInt(body.show_in_nav), Number(body.sort_order) || nextSortOrder('pages'),
    body.seo_title || '', body.seo_description || '', body.og_image || ''
  );
  res.status(201).json(db.prepare('SELECT * FROM pages WHERE id = ?').get(id));
});

router.put('/pages/:id', auth.requireAuth, (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!page) return res.status(404).json({ error: 'Page not found' });

  const body = req.body || {};
  // Routed pages (home, contact…) keep their slug so links never break.
  const slug = page.is_locked ? page.slug : uniqueSlug(db, 'pages', body.slug || body.title || page.slug, page.id);

  db.prepare(`
    UPDATE pages SET slug = ?, title = ?, nav_label = ?, status = ?, show_in_nav = ?,
      sort_order = ?, seo_title = ?, seo_description = ?, og_image = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(
    slug,
    body.title !== undefined ? body.title : page.title,
    body.nav_label !== undefined ? body.nav_label : page.nav_label,
    body.status !== undefined ? body.status : page.status,
    body.show_in_nav !== undefined ? boolInt(body.show_in_nav) : page.show_in_nav,
    body.sort_order !== undefined ? Number(body.sort_order) : page.sort_order,
    body.seo_title !== undefined ? body.seo_title : page.seo_title,
    body.seo_description !== undefined ? body.seo_description : page.seo_description,
    body.og_image !== undefined ? body.og_image : page.og_image,
    page.id
  );
  res.json(db.prepare('SELECT * FROM pages WHERE id = ?').get(page.id));
});

router.delete('/pages/:id', auth.requireAuth, (req, res) => {
  const page = db.prepare('SELECT * FROM pages WHERE id = ?').get(req.params.id);
  if (!page) return res.status(404).json({ error: 'Page not found' });
  if (page.is_locked) return res.status(400).json({ error: 'This page is part of the site structure and cannot be deleted.' });
  db.prepare('DELETE FROM pages WHERE id = ?').run(page.id);
  res.json({ ok: true });
});

router.get('/block-types', auth.requireAuth, (req, res) => res.json(BLOCKS));

router.post('/pages/:pageId/blocks', auth.requireAuth, (req, res) => {
  const page = db.prepare('SELECT id FROM pages WHERE id = ?').get(req.params.pageId);
  if (!page) return res.status(404).json({ error: 'Page not found' });

  const type = req.body.type;
  if (!BLOCKS.some(b => b.type === type)) return res.status(400).json({ error: 'Unknown block type' });

  const id = uuidv4();
  const next = db.prepare('SELECT COALESCE(MAX(sort_order), -1) + 1 AS n FROM blocks WHERE page_id = ?').get(page.id).n;
  const data = Object.assign(defaultsFor(type), parseJson(req.body.data, {}));
  db.prepare('INSERT INTO blocks (id, page_id, type, data, sort_order) VALUES (?, ?, ?, ?, ?)')
    .run(id, page.id, type, JSON.stringify(data), next);

  res.status(201).json(content.hydrate('blocks', db.prepare('SELECT * FROM blocks WHERE id = ?').get(id)));
});

router.put('/blocks/:id', auth.requireAuth, (req, res) => {
  const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(req.params.id);
  if (!block) return res.status(404).json({ error: 'Block not found' });

  const data = req.body.data !== undefined ? JSON.stringify(parseJson(req.body.data, {})) : block.data;
  const visible = req.body.is_visible !== undefined ? boolInt(req.body.is_visible) : block.is_visible;
  db.prepare("UPDATE blocks SET data = ?, is_visible = ?, updated_at = datetime('now') WHERE id = ?")
    .run(data, visible, block.id);

  res.json(content.hydrate('blocks', db.prepare('SELECT * FROM blocks WHERE id = ?').get(block.id)));
});

router.delete('/blocks/:id', auth.requireAuth, (req, res) => {
  db.prepare('DELETE FROM blocks WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.post('/blocks/:id/duplicate', auth.requireAuth, (req, res) => {
  const block = db.prepare('SELECT * FROM blocks WHERE id = ?').get(req.params.id);
  if (!block) return res.status(404).json({ error: 'Block not found' });
  const id = uuidv4();
  db.prepare('INSERT INTO blocks (id, page_id, type, data, sort_order, is_visible) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, block.page_id, block.type, block.data, block.sort_order + 1, block.is_visible);
  db.prepare('UPDATE blocks SET sort_order = sort_order + 2 WHERE page_id = ? AND sort_order > ? AND id != ?')
    .run(block.page_id, block.sort_order, id);
  res.status(201).json(content.hydrate('blocks', db.prepare('SELECT * FROM blocks WHERE id = ?').get(id)));
});

router.post('/pages/:pageId/blocks/reorder', auth.requireAuth, (req, res) => {
  const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
  const stmt = db.prepare('UPDATE blocks SET sort_order = ? WHERE id = ? AND page_id = ?');
  db.transaction(() => ids.forEach((id, index) => stmt.run(index, id, req.params.pageId)))();
  res.json({ ok: true });
});

// --- Settings --------------------------------------------------------------
router.get('/settings', auth.requireAuth, (req, res) => res.json(settingsStore.schema()));

router.put('/settings', auth.requireAdmin, (req, res) => {
  const allowed = new Set(settingsStore.DEFAULTS.map(d => d.key));
  const updates = {};
  for (const [key, value] of Object.entries(req.body || {})) {
    if (allowed.has(key)) updates[key] = value;
  }
  settingsStore.setMany(updates);
  res.json(settingsStore.schema());
});

// --- Enquiries -------------------------------------------------------------
router.get('/enquiries', auth.requireAuth, (req, res) => {
  res.json(content.listEnquiries({ status: req.query.status || null }));
});

router.put('/enquiries/:id', auth.requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM enquiries WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE enquiries SET status = ?, notes = ? WHERE id = ?')
    .run(req.body.status || row.status, req.body.notes !== undefined ? req.body.notes : row.notes, row.id);
  res.json(content.hydrate('enquiries', db.prepare('SELECT * FROM enquiries WHERE id = ?').get(row.id)));
});

router.delete('/enquiries/:id', auth.requireAuth, (req, res) => {
  db.prepare('DELETE FROM enquiries WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

router.get('/enquiries.csv', auth.requireAuth, (req, res) => {
  const rows = content.listEnquiries({ limit: 5000 });
  const keys = [...new Set(rows.flatMap(r => Object.keys(r.data || {})))];
  const header = ['Received', 'Status', 'Source page', ...keys];
  const escape = v => `"${String(v == null ? '' : Array.isArray(v) ? v.join('; ') : v).replace(/"/g, '""')}"`;
  const lines = [header.map(escape).join(',')];
  for (const row of rows) {
    lines.push([row.created_at, row.status, row.source_page, ...keys.map(k => row.data[k])].map(escape).join(','));
  }
  res.type('text/csv').attachment('enquiries.csv').send(lines.join('\n'));
});

// --- Media -----------------------------------------------------------------
const { UPLOAD_DIR } = require('../../paths');

// Uploads are served from the site's own origin, so the extension is derived
// from an allowlisted MIME type rather than trusted from the filename —
// otherwise "photo.html" declared as image/png would be served as a live page.
const ALLOWED_IMAGE_TYPES = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = ALLOWED_IMAGE_TYPES[file.mimetype];
      const base = slugify(path.basename(file.originalname, path.extname(file.originalname)), 'image').slice(0, 40);
      cb(null, `${Date.now()}-${base}${ext}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) => {
    const ok = Object.prototype.hasOwnProperty.call(ALLOWED_IMAGE_TYPES, file.mimetype);
    // SVG is excluded deliberately: it can carry script and would run on our
    // own origin. Convert to PNG before uploading.
    cb(ok ? null : new Error('Only PNG, JPEG, GIF, WebP or AVIF images can be uploaded.'), ok);
  },
});

router.get('/media', auth.requireAuth, (req, res) => {
  res.json(content.listMedia().map(m => ({ ...m, url: `/uploads/${m.filename}` })));
});

router.post('/media', auth.requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const id = uuidv4();
  db.prepare('INSERT INTO media (id, filename, original_name, mime, size, alt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.body.alt || '');
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(id);
  res.status(201).json({ ...row, url: `/uploads/${row.filename}` });
});

router.delete('/media/:id', auth.requireAuth, (req, res) => {
  const row = db.prepare('SELECT * FROM media WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  fs.promises.unlink(path.join(UPLOAD_DIR, row.filename)).catch(() => {});
  db.prepare('DELETE FROM media WHERE id = ?').run(row.id);
  res.json({ ok: true });
});

// --- Dashboard & account ---------------------------------------------------
router.get('/overview', auth.requireAuth, (req, res) => {
  res.json({
    counts: content.counts(),
    recent_enquiries: content.listEnquiries({ limit: 5 }),
    user: req.user,
  });
});

router.post('/account/password', auth.requireAuth, (req, res) => {
  const { password } = req.body || {};
  if (!password || String(password).length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters.' });
  }
  auth.changePassword(req.user.id, password);
  res.json({ ok: true, message: 'Password updated — please sign in again.' });
});

router.get('/users', auth.requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at').all());
});

router.post('/users', auth.requireAdmin, (req, res) => {
  const { email, name, password, role } = req.body || {};
  if (!email || !password || String(password).length < 8) {
    return res.status(400).json({ error: 'Email and a password of at least 8 characters are required.' });
  }
  if (db.prepare('SELECT id FROM users WHERE email = ?').get(String(email).toLowerCase())) {
    return res.status(400).json({ error: 'That email already has an account.' });
  }
  res.status(201).json(auth.createUser({ email, name, password, role: role === 'admin' ? 'admin' : 'editor' }));
});

router.delete('/users/:id', auth.requireAdmin, (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'You cannot delete your own account.' });
  if (db.prepare('SELECT COUNT(*) AS n FROM users').get().n <= 1) {
    return res.status(400).json({ error: 'At least one account must remain.' });
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// --- Session ---------------------------------------------------------------
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  // Keyed by address *and* account, so one person's typos cannot lock out a
  // colleague sharing the office IP.
  const session = auth.login(email, password, `${req.ip || 'unknown'}|${String(email || '').toLowerCase()}`);
  if (session && session.blocked) {
    return res.status(429).json({ error: 'Too many failed attempts. Try again in 15 minutes.' });
  }
  if (!session) return res.status(401).json({ error: 'Wrong email or password.' });

  res.cookie(auth.COOKIE, session.token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: auth.SESSION_DAYS * 864e5,
  });
  res.json({ ok: true, user: session.user });
});

router.post('/logout', (req, res) => {
  auth.logout(auth.tokenFromRequest(req));
  res.clearCookie(auth.COOKIE);
  res.json({ ok: true });
});

router.get('/me', (req, res) => {
  const user = auth.userForToken(auth.tokenFromRequest(req));
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  res.json(user);
});

// Multer and validation errors should read like the rest of the API.
router.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
  res.status(status).json({ error: err.message || 'Request failed' });
});

module.exports = router;
