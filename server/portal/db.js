const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.PORTAL_DB_PATH || path.join(__dirname, '..', '..', 'portal.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  -- Saved outputs of the Engagement Planner wizard
  CREATE TABLE IF NOT EXISTS engagement_plans (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    corridor TEXT NOT NULL,
    area_token TEXT DEFAULT '',
    scenario TEXT DEFAULT '',
    languages TEXT NOT NULL DEFAULT '[]',
    methods TEXT NOT NULL DEFAULT '[]',
    orgs TEXT NOT NULL DEFAULT '[]',
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    created_by TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Request Centre: translation / outreach / asset requests.
  -- Translation requests are the unit of work handed to JMS.
  CREATE TABLE IF NOT EXISTS translation_requests (
    id TEXT PRIMARY KEY,
    request_number TEXT NOT NULL UNIQUE,
    kind TEXT NOT NULL DEFAULT 'Translation',
    title TEXT NOT NULL,
    asset_name TEXT DEFAULT '',
    scenario TEXT DEFAULT '',
    corridor TEXT DEFAULT '',
    source_lang TEXT NOT NULL DEFAULT 'en-AU',
    target_langs TEXT NOT NULL DEFAULT '[]',
    formats TEXT NOT NULL DEFAULT '[]',
    brief TEXT DEFAULT '',
    due_date TEXT DEFAULT '',
    requested_by TEXT DEFAULT '',
    plan_id TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    jms_job_id TEXT DEFAULT '',
    jms_status TEXT DEFAULT '',
    jms_quote_amount REAL,
    jms_quote_currency TEXT DEFAULT 'AUD',
    jms_deliverables TEXT NOT NULL DEFAULT '[]',
    jms_last_sync TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Immutable audit trail per request (portal actions + JMS callbacks)
  CREATE TABLE IF NOT EXISTS request_events (
    id TEXT PRIMARY KEY,
    request_id TEXT NOT NULL,
    type TEXT NOT NULL,
    detail TEXT DEFAULT '',
    source TEXT NOT NULL DEFAULT 'portal',
    payload TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (request_id) REFERENCES translation_requests(id) ON DELETE CASCADE
  );

  -- Live insights feed (research + field observations)
  CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY,
    text TEXT NOT NULL,
    source TEXT DEFAULT '',
    tag TEXT DEFAULT '',
    lang TEXT DEFAULT '',
    added_by TEXT DEFAULT '',
    insight_date TEXT NOT NULL DEFAULT (date('now')),
    is_seed INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Engagement state per community organisation (directory itself is reference data)
  CREATE TABLE IF NOT EXISTS org_engagements (
    org_name TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'Not yet contacted',
    engagement_level TEXT DEFAULT '',
    contact_person TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    updated_by TEXT DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- Raw JMS webhook deliveries, kept for idempotency + audit
  CREATE TABLE IF NOT EXISTS jms_events (
    id TEXT PRIMARY KEY,
    event_id TEXT UNIQUE,
    job_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload TEXT NOT NULL DEFAULT '{}',
    processed INTEGER NOT NULL DEFAULT 0,
    error TEXT DEFAULT '',
    received_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_requests_status ON translation_requests(status);
  CREATE INDEX IF NOT EXISTS idx_requests_jms_job ON translation_requests(jms_job_id);
  CREATE INDEX IF NOT EXISTS idx_request_events_request ON request_events(request_id);
  CREATE INDEX IF NOT EXISTS idx_jms_events_job ON jms_events(job_id);
`);

module.exports = db;
