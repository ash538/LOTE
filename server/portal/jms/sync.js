const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { JMS_EVENT_TO_STATUS, isForwardMove } = require('./statuses');

/**
 * Apply a JMS event to the portal database. Used by the webhook route and by
 * the mock simulator, so both paths share one state machine.
 *
 * Event shape:
 * {
 *   event_id: "evt_...",        // unique per delivery, used for idempotency
 *   event_type: "job.quoted",   // see statuses.js
 *   job_id: "JMS-...",
 *   occurred_at: "2026-08-05T02:00:00Z",
 *   data: {
 *     quote?: { amount, currency },
 *     deliverables?: [{ language, format, url }],
 *     note?: "..."
 *   }
 * }
 */
function applyJmsEvent(event) {
  const eventId = event.event_id || uuidv4();

  // Idempotency: a redelivered event is acknowledged but not reapplied.
  const seen = db.prepare('SELECT id FROM jms_events WHERE event_id = ?').get(eventId);
  if (seen) return { ok: true, duplicate: true };

  const record = {
    id: uuidv4(),
    event_id: eventId,
    job_id: event.job_id || '',
    event_type: event.event_type || '',
    payload: JSON.stringify(event),
  };

  const request = event.job_id
    ? db.prepare('SELECT * FROM translation_requests WHERE jms_job_id = ?').get(event.job_id)
    : null;

  if (!request) {
    db.prepare(
      `INSERT INTO jms_events (id, event_id, job_id, event_type, payload, processed, error)
       VALUES (@id, @event_id, @job_id, @event_type, @payload, 0, 'no matching request')`
    ).run(record);
    return { ok: false, error: `No translation request linked to JMS job ${event.job_id}` };
  }

  const nextStatus = JMS_EVENT_TO_STATUS[event.event_type];
  if (!nextStatus) {
    db.prepare(
      `INSERT INTO jms_events (id, event_id, job_id, event_type, payload, processed, error)
       VALUES (@id, @event_id, @job_id, @event_type, @payload, 0, 'unknown event type')`
    ).run(record);
    return { ok: false, error: `Unknown JMS event type: ${event.event_type}` };
  }

  const data = event.data || {};
  const apply = db.transaction(() => {
    db.prepare(
      `INSERT INTO jms_events (id, event_id, job_id, event_type, payload, processed)
       VALUES (@id, @event_id, @job_id, @event_type, @payload, 1)`
    ).run(record);

    const updates = { jms_status: event.event_type, jms_last_sync: new Date().toISOString() };
    if (data.quote) {
      updates.jms_quote_amount = data.quote.amount;
      updates.jms_quote_currency = data.quote.currency || 'AUD';
    }
    if (Array.isArray(data.deliverables)) {
      updates.jms_deliverables = JSON.stringify(data.deliverables);
    }
    if (isForwardMove(request.status, nextStatus)) {
      updates.status = nextStatus;
    }

    const setSql = Object.keys(updates).map((k) => `${k} = @${k}`).join(', ');
    db.prepare(
      `UPDATE translation_requests SET ${setSql}, updated_at = datetime('now') WHERE id = @id`
    ).run({ ...updates, id: request.id });

    db.prepare(
      `INSERT INTO request_events (id, request_id, type, detail, source, payload)
       VALUES (?, ?, ?, ?, 'jms', ?)`
    ).run(
      uuidv4(),
      request.id,
      event.event_type,
      data.note || `JMS ${event.event_type}` + (data.quote ? ` — ${data.quote.currency || 'AUD'} ${data.quote.amount}` : ''),
      JSON.stringify(data)
    );
  });
  apply();

  return {
    ok: true,
    requestId: request.id,
    statusApplied: isForwardMove(request.status, nextStatus) ? nextStatus : request.status,
  };
}

module.exports = { applyJmsEvent };
