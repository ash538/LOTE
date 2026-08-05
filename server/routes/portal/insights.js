const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../portal/db');

const router = express.Router();

router.get('/', (req, res) => {
  const clauses = [];
  const params = [];
  if (req.query.tag) {
    clauses.push('tag = ?');
    params.push(req.query.tag);
  }
  if (req.query.lang) {
    clauses.push('lang = ?');
    params.push(req.query.lang);
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  res.json(db.prepare(`SELECT * FROM insights${where} ORDER BY insight_date DESC, created_at DESC`).all(...params));
});

router.post('/', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'text is required' });
  const id = uuidv4();
  db.prepare(
    `INSERT INTO insights (id, text, source, tag, lang, added_by, insight_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    text,
    req.body.source || 'Field team',
    req.body.tag || '',
    req.body.lang || '',
    req.body.added_by || '',
    req.body.insight_date || new Date().toISOString().slice(0, 10)
  );
  res.status(201).json(db.prepare('SELECT * FROM insights WHERE id = ?').get(id));
});

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM insights WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Insight not found' });
  if (row.is_seed) return res.status(409).json({ error: 'Seed research insights cannot be deleted' });
  db.prepare('DELETE FROM insights WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
