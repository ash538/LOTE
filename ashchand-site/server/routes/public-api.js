const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const content = require('../content');
const settingsStore = require('../settings');

const router = express.Router();

// Crude in-memory throttle: enough to stop a bored bot hammering the form.
const recent = new Map();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 5;

function throttled(ip) {
  const now = Date.now();
  const hits = (recent.get(ip) || []).filter(t => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 500) {
    for (const [key, times] of recent) {
      if (!times.some(t => now - t < WINDOW_MS)) recent.delete(key);
    }
  }
  return hits.length > MAX_PER_WINDOW;
}

// POST /api/site/enquiries — the public enquiry form.
router.post('/enquiries', (req, res) => {
  const body = req.body || {};
  const fields = body.fields && typeof body.fields === 'object' ? body.fields : {};
  const source_page = body.source_page || '';
  const company_website = body.company_website || '';

  // Honeypot: real people never fill this in.
  if (company_website) return res.json({ ok: true, message: settingsStore.get('form_success_message') });

  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  if (throttled(ip)) {
    return res.status(429).json({ error: 'Too many submissions. Please try again in a minute.' });
  }

  const defs = content.listFormFields();
  const errors = {};
  const clean = {};

  for (const def of defs) {
    const raw = fields[def.name];
    const value = Array.isArray(raw) ? raw.filter(Boolean) : String(raw == null ? '' : raw).trim().slice(0, 5000);
    const empty = Array.isArray(value) ? value.length === 0 : value === '';

    if (def.is_required && empty) {
      errors[def.name] = `${def.label} is required.`;
    } else if (def.type === 'email' && !empty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      errors[def.name] = 'Enter a valid email address.';
    }
    // Keyed by the field's stable name, with the label captured alongside, so
    // renaming a label later does not split the history or the CSV columns.
    if (!empty) clean[def.name] = { label: def.label, value };
  }

  if (Object.keys(errors).length) {
    return res.status(400).json({ error: 'Please check the highlighted fields.', errors });
  }

  const emailField = defs.find(d => d.type === 'email');
  const nameField = defs.find(d => /name/i.test(d.name));

  const id = uuidv4();
  db.prepare(`
    INSERT INTO enquiries (id, name, email, data, source_page) VALUES (?, ?, ?, ?, ?)
  `).run(
    id,
    nameField ? String(fields[nameField.name] || '').slice(0, 200) : '',
    emailField ? String(fields[emailField.name] || '').slice(0, 200) : '',
    JSON.stringify(clean),
    String(source_page).slice(0, 200)
  );

  const notify = settingsStore.get('form_notify_email');
  if (notify) {
    // No mail transport is configured in this environment; the enquiry is
    // stored and shows in the admin inbox. Wire up SMTP here when ready.
    console.log(`[cms] New enquiry ${id} — notify ${notify}`);
  }

  res.status(201).json({ ok: true, message: settingsStore.get('form_success_message') });
});

// The form definition, so the enquiry form can be rendered elsewhere too.
router.get('/form-fields', (req, res) => res.json(content.listFormFields()));

module.exports = router;
