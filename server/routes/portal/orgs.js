const express = require('express');
const db = require('../../portal/db');
const ref = require('../../portal/data/reference');

const router = express.Router();

const ORG_STATUSES = ['Not yet contacted', 'In conversation', 'Active', 'On hold', 'Closed'];

// Directory (reference data) merged with live engagement state.
router.get('/', (req, res) => {
  const states = new Map(db.prepare('SELECT * FROM org_engagements').all().map((r) => [r.org_name, r]));
  let orgs = ref.ORGS.map((o) => {
    const s = states.get(o.name);
    return {
      ...o,
      status: s ? s.status : o.status || 'Not yet contacted',
      engagement_level: s ? s.engagement_level : o.eng || '',
      contact_person: s ? s.contact_person : o.person || '',
      engagement_notes: s ? s.notes : '',
      last_updated: s ? s.updated_at : null,
    };
  });
  if (req.query.corridor) orgs = orgs.filter((o) => o.corridor === req.query.corridor);
  if (req.query.status) orgs = orgs.filter((o) => o.status === req.query.status);
  if (req.query.type) orgs = orgs.filter((o) => o.type === req.query.type);
  res.json(orgs);
});

// Update engagement state for one organisation (upsert keyed by name).
router.patch('/:name', (req, res) => {
  const name = req.params.name;
  const org = ref.ORGS.find((o) => o.name === name);
  if (!org) return res.status(404).json({ error: `Unknown organisation: ${name}` });
  if (req.body.status && !ORG_STATUSES.includes(req.body.status)) {
    return res.status(400).json({ error: `Invalid status`, valid: ORG_STATUSES });
  }
  const existing = db.prepare('SELECT * FROM org_engagements WHERE org_name = ?').get(name);
  const merged = {
    org_name: name,
    status: req.body.status ?? (existing ? existing.status : org.status || 'Not yet contacted'),
    engagement_level: req.body.engagement_level ?? (existing ? existing.engagement_level : org.eng || ''),
    contact_person: req.body.contact_person ?? (existing ? existing.contact_person : org.person || ''),
    notes: req.body.notes ?? (existing ? existing.notes : ''),
    updated_by: req.body.updated_by || '',
  };
  db.prepare(
    `INSERT INTO org_engagements (org_name, status, engagement_level, contact_person, notes, updated_by, updated_at)
     VALUES (@org_name, @status, @engagement_level, @contact_person, @notes, @updated_by, datetime('now'))
     ON CONFLICT(org_name) DO UPDATE SET
       status=@status, engagement_level=@engagement_level, contact_person=@contact_person,
       notes=@notes, updated_by=@updated_by, updated_at=datetime('now')`
  ).run(merged);
  res.json(db.prepare('SELECT * FROM org_engagements WHERE org_name = ?').get(name));
});

module.exports = router;
