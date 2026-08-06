const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

const STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const dealWithNames = `
  SELECT d.*, ct.first_name || ' ' || ct.last_name AS contact_name, co.name AS company_name
  FROM deals d
  LEFT JOIN contacts ct ON d.contact_id = ct.id
  LEFT JOIN companies co ON d.company_id = co.id
`;

// GET /api/deals - List deals (filter: ?stage=X&contact_id=X&company_id=X)
router.get('/', (req, res) => {
  const { stage, contact_id, company_id } = req.query;
  let sql = `${dealWithNames} WHERE 1=1`;
  const params = [];

  if (stage) {
    sql += ' AND d.stage = ?';
    params.push(stage);
  }
  if (contact_id) {
    sql += ' AND d.contact_id = ?';
    params.push(contact_id);
  }
  if (company_id) {
    sql += ' AND d.company_id = ?';
    params.push(company_id);
  }

  sql += ' ORDER BY d.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

// GET /api/deals/stages - Pipeline stage list
router.get('/stages', (req, res) => {
  res.json(STAGES);
});

// GET /api/deals/:id - Deal with linked quotes
router.get('/:id', (req, res) => {
  const deal = db.prepare(`${dealWithNames} WHERE d.id = ?`).get(req.params.id);
  if (!deal) return res.status(404).json({ error: 'Deal not found' });

  const quotes = db.prepare('SELECT * FROM quotes WHERE deal_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json({ ...deal, quotes });
});

// POST /api/deals - Create a deal
router.post('/', (req, res) => {
  const { name, stage, amount, contact_id, company_id, expected_close_date, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'name is required' });
  if (stage && !STAGES.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${STAGES.join(', ')}` });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO deals (id, name, stage, amount, contact_id, company_id, expected_close_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, stage || 'lead', amount || 0, contact_id || null, company_id || null, expected_close_date || '', notes || '');

  res.status(201).json(db.prepare(`${dealWithNames} WHERE d.id = ?`).get(id));
});

// PUT /api/deals/:id - Update a deal (including stage moves)
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM deals WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Deal not found' });

  const { name, stage, amount, contact_id, company_id, expected_close_date, notes } = req.body;
  if (stage && !STAGES.includes(stage)) {
    return res.status(400).json({ error: `stage must be one of: ${STAGES.join(', ')}` });
  }

  const newStage = stage || existing.stage;
  const isClosing = (newStage === 'won' || newStage === 'lost') && existing.stage !== newStage;
  const isReopening = (newStage !== 'won' && newStage !== 'lost') && existing.closed_at;
  const closedAt = isClosing ? new Date().toISOString() : (isReopening ? null : existing.closed_at);

  db.prepare(`
    UPDATE deals SET
      name = COALESCE(?, name),
      stage = COALESCE(?, stage),
      amount = COALESCE(?, amount),
      contact_id = ?,
      company_id = ?,
      expected_close_date = COALESCE(?, expected_close_date),
      notes = COALESCE(?, notes),
      closed_at = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name, stage, amount,
    contact_id !== undefined ? (contact_id || null) : existing.contact_id,
    company_id !== undefined ? (company_id || null) : existing.company_id,
    expected_close_date, notes, closedAt, req.params.id
  );

  res.json(db.prepare(`${dealWithNames} WHERE d.id = ?`).get(req.params.id));
});

// DELETE /api/deals/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM deals WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Deal not found' });
  res.json({ success: true });
});

module.exports = router;
