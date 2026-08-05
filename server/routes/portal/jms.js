const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../../portal/db');
const jms = require('../../portal/jms/client');
const { applyJmsEvent } = require('../../portal/jms/sync');

const router = express.Router();

// Integration health/config (no secrets exposed).
router.get('/health', (req, res) => {
  res.json({
    mode: jms.config.mode,
    baseUrlConfigured: Boolean(jms.config.baseUrl),
    webhookSecretConfigured: Boolean(jms.config.webhookSecret),
    clientCode: jms.config.clientCode,
  });
});

/**
 * Inbound webhook from JMS. Register this URL in JMS:
 *   POST {portal}/api/portal/jms/webhook
 * Signed with HMAC-SHA256 over the raw body, header X-JMS-Signature.
 */
router.post('/webhook', (req, res) => {
  if (!jms.verifySignature(req.rawBody, req.get('X-JMS-Signature'))) {
    return res.status(401).json({ error: 'Invalid or missing webhook signature' });
  }
  const event = req.body || {};
  if (!event.event_type || !event.job_id) {
    return res.status(400).json({ error: 'event_type and job_id are required' });
  }
  const result = applyJmsEvent(event);
  if (!result.ok) {
    // 200 with error detail: the event was recorded, JMS should not retry forever.
    return res.status(200).json({ received: true, applied: false, error: result.error });
  }
  res.json({ received: true, applied: !result.duplicate, duplicate: Boolean(result.duplicate), status: result.statusApplied });
});

// Recent webhook deliveries for debugging the integration.
router.get('/events', (req, res) => {
  const rows = db
    .prepare('SELECT id, event_id, job_id, event_type, processed, error, received_at FROM jms_events ORDER BY received_at DESC LIMIT ?')
    .all(Number(req.query.limit) || 50);
  res.json(rows);
});

/**
 * Mock-mode helper: advance a submitted request through the JMS lifecycle by
 * synthesizing the next webhook event. Lets the whole flow be exercised
 * end-to-end without a live JMS. Disabled outside mock mode.
 */
router.post('/mock/advance/:requestId', (req, res) => {
  if (jms.config.mode !== 'mock') {
    return res.status(403).json({ error: 'Mock advance is only available when JMS_MODE=mock' });
  }
  const row = db.prepare('SELECT * FROM translation_requests WHERE id = ?').get(req.params.requestId);
  if (!row) return res.status(404).json({ error: 'Request not found' });
  if (!row.jms_job_id) return res.status(409).json({ error: 'Request has not been submitted to JMS' });

  const targetLangs = JSON.parse(row.target_langs);
  let event;
  switch (row.status) {
    case 'submitted':
      event = {
        event_type: 'job.quoted',
        data: {
          quote: { amount: 480 * Math.max(targetLangs.length, 1), currency: 'AUD' },
          note: `Quote issued for ${targetLangs.length} language(s)`,
        },
      };
      break;
    case 'quoted':
      return res.status(409).json({
        error: 'Request is awaiting quote approval — call POST /api/portal/requests/:id/approve-quote',
      });
    case 'in_production':
      event = { event_type: 'job.in_review', data: { note: 'Draft translations with community reviewers' } };
      break;
    case 'in_review':
      event = {
        event_type: 'job.delivered',
        data: {
          deliverables: targetLangs.map((lang) => ({
            language: lang,
            format: 'PDF',
            url: `https://jms.example.com/deliverables/${row.jms_job_id}/${encodeURIComponent(lang)}.pdf`,
          })),
          note: 'All deliverables uploaded',
        },
      };
      break;
    default:
      return res.status(409).json({ error: `No mock transition from status: ${row.status}` });
  }

  const result = applyJmsEvent({ ...event, event_id: `mock_${uuidv4()}`, job_id: row.jms_job_id, occurred_at: new Date().toISOString() });
  res.json(result);
});

module.exports = router;
