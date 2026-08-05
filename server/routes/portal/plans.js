const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../portal/db');

const router = express.Router();

const parsePlan = (row) => ({
  ...row,
  languages: JSON.parse(row.languages),
  methods: JSON.parse(row.methods),
  orgs: JSON.parse(row.orgs),
});

router.get('/', (req, res) => {
  let sql = 'SELECT * FROM engagement_plans';
  const params = [];
  if (req.query.corridor) {
    sql += ' WHERE corridor = ?';
    params.push(req.query.corridor);
  }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params).map(parsePlan));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM engagement_plans WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Plan not found' });
  res.json(parsePlan(row));
});

router.post('/', (req, res) => {
  const { title, corridor } = req.body;
  if (!title || !corridor) return res.status(400).json({ error: 'title and corridor are required' });
  const id = uuidv4();
  db.prepare(
    `INSERT INTO engagement_plans (id, title, corridor, area_token, scenario, languages, methods, orgs, notes, status, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    id,
    title,
    corridor,
    req.body.area_token || '',
    req.body.scenario || '',
    JSON.stringify(req.body.languages || []),
    JSON.stringify(req.body.methods || []),
    JSON.stringify(req.body.orgs || []),
    req.body.notes || '',
    req.body.status || 'draft',
    req.body.created_by || ''
  );
  res.status(201).json(parsePlan(db.prepare('SELECT * FROM engagement_plans WHERE id = ?').get(id)));
});

router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM engagement_plans WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Plan not found' });
  const merged = {
    title: req.body.title ?? row.title,
    corridor: req.body.corridor ?? row.corridor,
    area_token: req.body.area_token ?? row.area_token,
    scenario: req.body.scenario ?? row.scenario,
    languages: JSON.stringify(req.body.languages ?? JSON.parse(row.languages)),
    methods: JSON.stringify(req.body.methods ?? JSON.parse(row.methods)),
    orgs: JSON.stringify(req.body.orgs ?? JSON.parse(row.orgs)),
    notes: req.body.notes ?? row.notes,
    status: req.body.status ?? row.status,
    id: req.params.id,
  };
  db.prepare(
    `UPDATE engagement_plans SET title=@title, corridor=@corridor, area_token=@area_token,
     scenario=@scenario, languages=@languages, methods=@methods, orgs=@orgs, notes=@notes,
     status=@status, updated_at=datetime('now') WHERE id=@id`
  ).run(merged);
  res.json(parsePlan(db.prepare('SELECT * FROM engagement_plans WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM engagement_plans WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'Plan not found' });
  res.json({ ok: true });
});

module.exports = router;
