const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// GET /api/companies - List companies with contact/deal counts
router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = `
    SELECT c.*,
      (SELECT COUNT(*) FROM contacts WHERE company_id = c.id) AS contact_count,
      (SELECT COUNT(*) FROM deals WHERE company_id = c.id AND stage NOT IN ('won', 'lost')) AS open_deal_count
    FROM companies c WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ' AND (c.name LIKE ? OR c.domain LIKE ? OR c.industry LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  sql += ' ORDER BY c.name COLLATE NOCASE';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/companies/:id - Company with related contacts, deals, quotes
router.get('/:id', (req, res) => {
  const company = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!company) return res.status(404).json({ error: 'Company not found' });

  const contacts = db.prepare('SELECT * FROM contacts WHERE company_id = ? ORDER BY first_name COLLATE NOCASE').all(req.params.id);
  const deals = db.prepare('SELECT * FROM deals WHERE company_id = ? ORDER BY created_at DESC').all(req.params.id);
  const quotes = db.prepare('SELECT * FROM quotes WHERE company_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({ ...company, contacts, deals, quotes });
});

// POST /api/companies - Create a company
router.post('/', (req, res) => {
  const { name, domain, industry, phone, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO companies (id, name, domain, industry, phone, address, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, domain || '', industry || '', phone || '', address || '', notes || '');

  res.status(201).json(db.prepare('SELECT * FROM companies WHERE id = ?').get(id));
});

// PUT /api/companies/:id - Update a company
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Company not found' });

  const { name, domain, industry, phone, address, notes } = req.body;
  db.prepare(`
    UPDATE companies SET
      name = COALESCE(?, name),
      domain = COALESCE(?, domain),
      industry = COALESCE(?, industry),
      phone = COALESCE(?, phone),
      address = COALESCE(?, address),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name, domain, industry, phone, address, notes, req.params.id);

  res.json(db.prepare('SELECT * FROM companies WHERE id = ?').get(req.params.id));
});

// DELETE /api/companies/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM companies WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Company not found' });
  res.json({ success: true });
});

module.exports = router;
