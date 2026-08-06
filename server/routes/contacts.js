const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// GET /api/contacts - List contacts with company name
router.get('/', (req, res) => {
  const { search, company_id, lifecycle_stage } = req.query;
  let sql = `
    SELECT ct.*, co.name AS company_name,
      (SELECT COUNT(*) FROM deals WHERE contact_id = ct.id AND stage NOT IN ('won', 'lost')) AS open_deal_count
    FROM contacts ct
    LEFT JOIN companies co ON ct.company_id = co.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    sql += ' AND (ct.first_name LIKE ? OR ct.last_name LIKE ? OR ct.email LIKE ? OR co.name LIKE ?)';
    const like = `%${search}%`;
    params.push(like, like, like, like);
  }
  if (company_id) {
    sql += ' AND ct.company_id = ?';
    params.push(company_id);
  }
  if (lifecycle_stage) {
    sql += ' AND ct.lifecycle_stage = ?';
    params.push(lifecycle_stage);
  }

  sql += ' ORDER BY ct.first_name COLLATE NOCASE, ct.last_name COLLATE NOCASE';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/contacts/:id - Contact with related deals and quotes
router.get('/:id', (req, res) => {
  const contact = db.prepare(`
    SELECT ct.*, co.name AS company_name
    FROM contacts ct
    LEFT JOIN companies co ON ct.company_id = co.id
    WHERE ct.id = ?
  `).get(req.params.id);
  if (!contact) return res.status(404).json({ error: 'Contact not found' });

  const deals = db.prepare('SELECT * FROM deals WHERE contact_id = ? ORDER BY created_at DESC').all(req.params.id);
  const quotes = db.prepare('SELECT * FROM quotes WHERE contact_id = ? ORDER BY created_at DESC').all(req.params.id);

  res.json({ ...contact, deals, quotes });
});

// POST /api/contacts - Create a contact
router.post('/', (req, res) => {
  const { first_name, last_name, email, phone, job_title, company_id, lifecycle_stage, notes } = req.body;
  if (!first_name) return res.status(400).json({ error: 'first_name is required' });

  const id = uuidv4();
  db.prepare(`
    INSERT INTO contacts (id, first_name, last_name, email, phone, job_title, company_id, lifecycle_stage, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, first_name, last_name || '', email || '', phone || '', job_title || '', company_id || null, lifecycle_stage || 'lead', notes || '');

  res.status(201).json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(id));
});

// PUT /api/contacts/:id - Update a contact
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Contact not found' });

  const { first_name, last_name, email, phone, job_title, company_id, lifecycle_stage, notes } = req.body;
  db.prepare(`
    UPDATE contacts SET
      first_name = COALESCE(?, first_name),
      last_name = COALESCE(?, last_name),
      email = COALESCE(?, email),
      phone = COALESCE(?, phone),
      job_title = COALESCE(?, job_title),
      company_id = ?,
      lifecycle_stage = COALESCE(?, lifecycle_stage),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    first_name, last_name, email, phone, job_title,
    company_id !== undefined ? (company_id || null) : existing.company_id,
    lifecycle_stage, notes, req.params.id
  );

  res.json(db.prepare('SELECT * FROM contacts WHERE id = ?').get(req.params.id));
});

// DELETE /api/contacts/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Contact not found' });
  res.json({ success: true });
});

module.exports = router;
