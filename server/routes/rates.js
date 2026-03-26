const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

// GET /api/rates - List all rates (optionally filter by category or active status)
router.get('/', (req, res) => {
  const { category, active } = req.query;
  let sql = 'SELECT * FROM rates WHERE 1=1';
  const params = [];

  if (category) {
    sql += ' AND category = ?';
    params.push(category);
  }
  if (active !== undefined) {
    sql += ' AND is_active = ?';
    params.push(active === 'true' ? 1 : 0);
  }

  sql += ' ORDER BY category, name';
  const rates = db.prepare(sql).all(...params);
  res.json(rates);
});

// GET /api/rates/categories - List distinct categories
router.get('/categories', (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM rates ORDER BY category').all();
  res.json(categories.map(c => c.category));
});

// GET /api/rates/:id
router.get('/:id', (req, res) => {
  const rate = db.prepare('SELECT * FROM rates WHERE id = ?').get(req.params.id);
  if (!rate) return res.status(404).json({ error: 'Rate not found' });
  res.json(rate);
});

// POST /api/rates - Create a new rate
router.post('/', (req, res) => {
  const { category, name, description, unit, unit_price } = req.body;
  if (!category || !name || unit_price === undefined) {
    return res.status(400).json({ error: 'category, name, and unit_price are required' });
  }

  const id = uuidv4();
  db.prepare(`
    INSERT INTO rates (id, category, name, description, unit, unit_price)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, category, name, description || '', unit || 'each', unit_price);

  const rate = db.prepare('SELECT * FROM rates WHERE id = ?').get(id);
  res.status(201).json(rate);
});

// PUT /api/rates/:id - Update a rate
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM rates WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Rate not found' });

  const { category, name, description, unit, unit_price, is_active } = req.body;
  db.prepare(`
    UPDATE rates SET
      category = COALESCE(?, category),
      name = COALESCE(?, name),
      description = COALESCE(?, description),
      unit = COALESCE(?, unit),
      unit_price = COALESCE(?, unit_price),
      is_active = COALESCE(?, is_active),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(category, name, description, unit, unit_price, is_active, req.params.id);

  const rate = db.prepare('SELECT * FROM rates WHERE id = ?').get(req.params.id);
  res.json(rate);
});

// DELETE /api/rates/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM rates WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Rate not found' });
  res.json({ success: true });
});

module.exports = router;
