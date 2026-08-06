const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

const TYPES = ['note', 'call', 'email', 'meeting', 'task'];

const activityWithNames = `
  SELECT a.*, ct.first_name || ' ' || ct.last_name AS contact_name, co.name AS company_name, d.name AS deal_name
  FROM activities a
  LEFT JOIN contacts ct ON a.contact_id = ct.id
  LEFT JOIN companies co ON a.company_id = co.id
  LEFT JOIN deals d ON a.deal_id = d.id
`;

// GET /api/activities - Timeline (filter: ?contact_id=X&company_id=X&deal_id=X&type=X&open_tasks=true)
router.get('/', (req, res) => {
  const { contact_id, company_id, deal_id, type, open_tasks, limit } = req.query;
  let sql = `${activityWithNames} WHERE 1=1`;
  const params = [];

  if (contact_id) {
    sql += ' AND a.contact_id = ?';
    params.push(contact_id);
  }
  if (company_id) {
    sql += ' AND a.company_id = ?';
    params.push(company_id);
  }
  if (deal_id) {
    sql += ' AND a.deal_id = ?';
    params.push(deal_id);
  }
  if (type) {
    sql += ' AND a.type = ?';
    params.push(type);
  }
  if (open_tasks === 'true') {
    sql += " AND a.type = 'task' AND a.completed = 0";
  }

  sql += open_tasks === 'true'
    ? " ORDER BY CASE WHEN a.due_date = '' THEN 1 ELSE 0 END, a.due_date"
    : ' ORDER BY a.created_at DESC';
  if (limit) {
    sql += ' LIMIT ?';
    params.push(parseInt(limit, 10));
  }

  res.json(db.prepare(sql).all(...params));
});

// POST /api/activities - Log an activity or create a task
router.post('/', (req, res) => {
  const { type, subject, body, contact_id, company_id, deal_id, due_date } = req.body;
  if (!subject) return res.status(400).json({ error: 'subject is required' });
  if (type && !TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${TYPES.join(', ')}` });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO activities (id, type, subject, body, contact_id, company_id, deal_id, due_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, type || 'note', subject, body || '', contact_id || null, company_id || null, deal_id || null, due_date || '');

  res.status(201).json(db.prepare(`${activityWithNames} WHERE a.id = ?`).get(id));
});

// PUT /api/activities/:id - Update an activity (e.g. complete a task)
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM activities WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Activity not found' });

  const { type, subject, body, due_date, completed } = req.body;
  if (type && !TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${TYPES.join(', ')}` });
  }

  db.prepare(`
    UPDATE activities SET
      type = COALESCE(?, type),
      subject = COALESCE(?, subject),
      body = COALESCE(?, body),
      due_date = COALESCE(?, due_date),
      completed = COALESCE(?, completed),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(type, subject, body, due_date, completed !== undefined ? (completed ? 1 : 0) : null, req.params.id);

  res.json(db.prepare(`${activityWithNames} WHERE a.id = ?`).get(req.params.id));
});

// DELETE /api/activities/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM activities WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Activity not found' });
  res.json({ success: true });
});

module.exports = router;
