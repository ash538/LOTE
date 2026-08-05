const { v4: uuidv4 } = require('uuid');
const db = require('./db');
const ref = require('./data/reference');

// Seed the research insights feed (idempotent: keyed off is_seed + source).
const insertInsight = db.prepare(
  `INSERT INTO insights (id, text, source, tag, lang, added_by, insight_date, is_seed)
   VALUES (?, ?, ?, ?, ?, ?, ?, 1)`
);
const seedCount = db.prepare('SELECT COUNT(*) AS n FROM insights WHERE is_seed = 1').get().n;
if (seedCount === 0) {
  for (const s of ref.INSIGHT_SEED) {
    insertInsight.run(uuidv4(), s.text, s.source, s.tag, s.lang, s.by, s.date);
  }
  console.log(`Seeded ${ref.INSIGHT_SEED.length} research insights`);
} else {
  console.log('Insights already seeded, skipping');
}

// Seed engagement state for organisations that already have a logged status.
const upsertOrg = db.prepare(
  `INSERT INTO org_engagements (org_name, status, engagement_level, contact_person, updated_by)
   VALUES (?, ?, ?, ?, 'seed')
   ON CONFLICT(org_name) DO NOTHING`
);
let orgCount = 0;
for (const o of ref.ORGS) {
  if (o.status && o.status !== 'Not yet contacted') {
    orgCount += upsertOrg.run(o.name, o.status, o.eng || '', o.person || '').changes;
  }
}
console.log(`Seeded engagement state for ${orgCount} organisations`);

console.log('Portal seed complete');
