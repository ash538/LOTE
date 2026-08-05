const crypto = require('crypto');

/**
 * JMS (Job Management System) adapter.
 *
 * Modes (JMS_MODE):
 *   mock  - default; no network calls. Returns deterministic fake job ids so the
 *           full portal flow works locally and in demos.
 *   live  - real HTTP calls against JMS_BASE_URL with JMS_API_KEY.
 *
 * The outbound payload shape lives in toJmsJob(); if JMS's real schema differs,
 * change the mapping here — nothing else in the portal needs to know.
 */
const config = {
  mode: process.env.JMS_MODE || 'mock',
  baseUrl: (process.env.JMS_BASE_URL || '').replace(/\/+$/, ''),
  apiKey: process.env.JMS_API_KEY || '',
  webhookSecret: process.env.JMS_WEBHOOK_SECRET || '',
  // Identifies this portal as the requesting client inside JMS
  clientCode: process.env.JMS_CLIENT_CODE || 'TU-CALD-PORTAL',
  timeoutMs: Number(process.env.JMS_TIMEOUT_MS || 15000),
};

class JmsError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'JmsError';
    this.status = status;
    this.body = body;
  }
}

/** Map a portal translation request row -> JMS job creation payload. */
function toJmsJob(request) {
  return {
    external_ref: request.request_number,
    client_code: config.clientCode,
    service: request.kind === 'Translation' ? 'translation' : 'multicultural-engagement',
    title: request.title,
    source_language: request.source_lang || 'en-AU',
    target_languages: JSON.parse(request.target_langs || '[]'),
    deliverable_formats: JSON.parse(request.formats || '[]'),
    domain: request.scenario || '',
    region: request.corridor || '',
    brief: request.brief || '',
    due_date: request.due_date || null,
    requested_by: request.requested_by || '',
    callback: { events: Object.keys(require('./statuses').JMS_EVENT_TO_STATUS) },
  };
}

async function jmsFetch(pathname, options = {}) {
  if (!config.baseUrl) throw new JmsError('JMS_BASE_URL is not configured', 0, null);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const res = await fetch(config.baseUrl + pathname, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
        ...(options.headers || {}),
      },
    });
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
    if (!res.ok) throw new JmsError(`JMS responded ${res.status}`, res.status, body);
    return body;
  } finally {
    clearTimeout(timer);
  }
}

function mockJobId(requestNumber) {
  const hash = crypto.createHash('sha1').update(requestNumber).digest('hex').slice(0, 8);
  return `JMS-MOCK-${hash.toUpperCase()}`;
}

/** Submit a portal request as a new JMS job. Returns { jobId, status }. */
async function submitJob(request) {
  if (config.mode === 'mock') {
    return { jobId: mockJobId(request.request_number), status: 'received', mock: true };
  }
  const body = await jmsFetch('/api/v2/jobs', {
    method: 'POST',
    body: JSON.stringify(toJmsJob(request)),
  });
  return { jobId: body.job_id || body.id, status: body.status || 'received' };
}

/** Fetch current JMS state for a job. */
async function getJob(jobId) {
  if (config.mode === 'mock') {
    return { job_id: jobId, status: 'received', mock: true };
  }
  return jmsFetch(`/api/v2/jobs/${encodeURIComponent(jobId)}`);
}

/** Approve a quote so JMS moves the job into production. */
async function approveQuote(jobId) {
  if (config.mode === 'mock') {
    return { job_id: jobId, status: 'in_production', mock: true };
  }
  return jmsFetch(`/api/v2/jobs/${encodeURIComponent(jobId)}/approve`, { method: 'POST' });
}

/** Cancel a job in JMS. */
async function cancelJob(jobId, reason = '') {
  if (config.mode === 'mock') {
    return { job_id: jobId, status: 'cancelled', mock: true };
  }
  return jmsFetch(`/api/v2/jobs/${encodeURIComponent(jobId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });
}

/**
 * Verify an incoming webhook: HMAC-SHA256 of the raw request body, hex-encoded,
 * sent by JMS in the X-JMS-Signature header. Always enforced in live mode;
 * in mock mode it is only enforced when a secret is configured.
 */
function verifySignature(rawBody, signature) {
  if (!config.webhookSecret) return config.mode === 'mock';
  if (!signature || !rawBody) return false;
  const expected = crypto
    .createHmac('sha256', config.webhookSecret)
    .update(rawBody)
    .digest('hex');
  const provided = String(signature).replace(/^sha256=/, '');
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(provided, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

module.exports = { config, toJmsJob, submitJob, getJob, approveQuote, cancelJob, verifySignature, JmsError };
