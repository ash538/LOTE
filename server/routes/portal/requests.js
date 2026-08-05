const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../portal/db');
const jms = require('../../portal/jms/client');
const { TERMINAL_STATUSES } = require('../../portal/jms/statuses');

const router = express.Router();

const parseRequest = (row) => ({
  ...row,
  target_langs: JSON.parse(row.target_langs),
  formats: JSON.parse(row.formats),
  jms_deliverables: JSON.parse(row.jms_deliverables),
});

function nextRequestNumber() {
  const year = new Date().getFullYear();
  const prefix = `REQ-${year}-`;
  const last = db
    .prepare("SELECT request_number FROM translation_requests WHERE request_number LIKE ? ORDER BY request_number DESC LIMIT 1")
    .get(`${prefix}%`);
  const n = last ? parseInt(last.request_number.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(n).padStart(4, '0')}`;
}

function logEvent(requestId, type, detail, source = 'portal', payload = '') {
  db.prepare(
    'INSERT INTO request_events (id, request_id, type, detail, source, payload) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(uuidv4(), requestId, type, detail, source, payload);
}

router.get('/', (req, res) => {
  const clauses = [];
  const params = [];
  for (const field of ['status', 'corridor', 'kind']) {
    if (req.query[field]) {
      clauses.push(`${field} = ?`);
      params.push(req.query[field]);
    }
  }
  const where = clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM translation_requests${where} ORDER BY created_at DESC`).all(...params);
  res.json(rows.map(parseRequest));
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });
  const events = db
    .prepare('SELECT id, type, detail, source, created_at FROM request_events WHERE request_id = ? ORDER BY created_at')
    .all(req.params.id);
  res.json({ ...parseRequest(row), events });
});

router.post('/', (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ error: 'title is required' });
  const targetLangs = req.body.target_langs || [];
  if (!Array.isArray(targetLangs)) return res.status(400).json({ error: 'target_langs must be an array' });

  const id = uuidv4();
  const requestNumber = nextRequestNumber();
  db.prepare(
    `INSERT INTO translation_requests
       (id, request_number, kind, title, asset_name, scenario, corridor, source_lang,
        target_langs, formats, brief, due_date, requested_by, plan_id, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`
  ).run(
    id,
    requestNumber,
    req.body.kind || 'Translation',
    title,
    req.body.asset_name || '',
    req.body.scenario || '',
    req.body.corridor || '',
    req.body.source_lang || 'en-AU',
    JSON.stringify(targetLangs),
    JSON.stringify(req.body.formats || []),
    req.body.brief || '',
    req.body.due_date || '',
    req.body.requested_by || '',
    req.body.plan_id || ''
  );
  logEvent(id, 'created', `Request ${requestNumber} created`);
  res.status(201).json(parseRequest(db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(id)));
});

router.put('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });
  if (row.status !== 'draft') {
    return res.status(409).json({ error: `Only draft requests can be edited (status: ${row.status})` });
  }
  const merged = {
    kind: req.body.kind ?? row.kind,
    title: req.body.title ?? row.title,
    asset_name: req.body.asset_name ?? row.asset_name,
    scenario: req.body.scenario ?? row.scenario,
    corridor: req.body.corridor ?? row.corridor,
    source_lang: req.body.source_lang ?? row.source_lang,
    target_langs: JSON.stringify(req.body.target_langs ?? JSON.parse(row.target_langs)),
    formats: JSON.stringify(req.body.formats ?? JSON.parse(row.formats)),
    brief: req.body.brief ?? row.brief,
    due_date: req.body.due_date ?? row.due_date,
    requested_by: req.body.requested_by ?? row.requested_by,
    plan_id: req.body.plan_id ?? row.plan_id,
    id: req.params.id,
  };
  db.prepare(
    `UPDATE translation_requests SET kind=@kind, title=@title, asset_name=@asset_name,
     scenario=@scenario, corridor=@corridor, source_lang=@source_lang, target_langs=@target_langs,
     formats=@formats, brief=@brief, due_date=@due_date, requested_by=@requested_by,
     plan_id=@plan_id, updated_at=datetime('now') WHERE id=@id`
  ).run(merged);
  res.json(parseRequest(db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(req.params.id)));
});

// Submit a draft request to JMS: creates the JMS job and links it.
router.post('/:id/submit', async (req, res) => {
  const row = db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });
  if (row.status !== 'draft') {
    return res.status(409).json({ error: `Request already submitted (status: ${row.status})` });
  }
  if (!JSON.parse(row.target_langs).length) {
    return res.status(400).json({ error: 'At least one target language is required before submitting' });
  }
  try {
    const result = await jms.submitJob(row);
    db.prepare(
      `UPDATE translation_requests
       SET status='submitted', jms_job_id=?, jms_status=?, jms_last_sync=?, updated_at=datetime('now')
       WHERE id=?`
    ).run(result.jobId, result.status, new Date().toISOString(), row.id);
    logEvent(row.id, 'submitted', `Submitted to JMS as job ${result.jobId}${result.mock ? ' (mock mode)' : ''}`, 'portal');
    res.json(parseRequest(db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(row.id)));
  } catch (err) {
    logEvent(row.id, 'submit_failed', String(err.message), 'portal');
    res.status(502).json({ error: 'JMS submission failed', detail: err.message, jmsStatus: err.status || null });
  }
});

// Approve a JMS quote so the job moves into production.
router.post('/:id/approve-quote', async (req, res) => {
  const row = db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });
  if (row.status !== 'quoted') {
    return res.status(409).json({ error: `Only quoted requests can be approved (status: ${row.status})` });
  }
  try {
    await jms.approveQuote(row.jms_job_id);
    db.prepare(
      `UPDATE translation_requests SET status='in_production', updated_at=datetime('now') WHERE id=?`
    ).run(row.id);
    logEvent(row.id, 'quote_approved', `Quote approved by ${req.body.approved_by || 'portal user'}`);
    res.json(parseRequest(db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(row.id)));
  } catch (err) {
    res.status(502).json({ error: 'JMS quote approval failed', detail: err.message });
  }
});

// Cancel: draft requests are cancelled locally; submitted ones also cancel in JMS.
router.post('/:id/cancel', async (req, res) => {
  const row = db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });
  if (TERMINAL_STATUSES.includes(row.status)) {
    return res.status(409).json({ error: `Request is already ${row.status}` });
  }
  try {
    if (row.jms_job_id) await jms.cancelJob(row.jms_job_id, req.body.reason || '');
    db.prepare(
      `UPDATE translation_requests SET status='cancelled', updated_at=datetime('now') WHERE id=?`
    ).run(row.id);
    logEvent(row.id, 'cancelled', req.body.reason || 'Cancelled from portal');
    res.json(parseRequest(db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(row.id)));
  } catch (err) {
    res.status(502).json({ error: 'JMS cancellation failed', detail: err.message });
  }
});

// Mark a delivered request as closed after the team has filed the assets.
router.post('/:id/close', (req, res) => {
  const row = db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });
  if (row.status !== 'delivered') {
    return res.status(409).json({ error: `Only delivered requests can be closed (status: ${row.status})` });
  }
  db.prepare(`UPDATE translation_requests SET status='closed', updated_at=datetime('now') WHERE id=?`).run(row.id);
  logEvent(row.id, 'closed', 'Request closed');
  res.json(parseRequest(db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(row.id)));
});

// Pull current state from JMS on demand (fallback when webhooks are unavailable).
router.post('/:id/refresh', async (req, res) => {
  const row = db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });
  if (!row.jms_job_id) return res.status(409).json({ error: 'Request has not been submitted to JMS' });
  try {
    const job = await jms.getJob(row.jms_job_id);
    db.prepare(
      `UPDATE translation_requests SET jms_status=?, jms_last_sync=?, updated_at=datetime('now') WHERE id=?`
    ).run(job.status || '', new Date().toISOString(), row.id);
    res.json({ request: parseRequest(db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(row.id)), jms: job });
  } catch (err) {
    res.status(502).json({ error: 'JMS lookup failed', detail: err.message });
  }
});

router.delete('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Request not found' });
  if (row.status !== 'draft' && row.status !== 'cancelled') {
    return res.status(409).json({ error: 'Only draft or cancelled requests can be deleted' });
  }
  db.prepare('DELETE FROM translation_requests WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
