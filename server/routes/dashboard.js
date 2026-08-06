const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/dashboard - CRM overview stats
router.get('/', (req, res) => {
  const pipeline = db.prepare(`
    SELECT stage, COUNT(*) AS count, SUM(amount) AS value
    FROM deals GROUP BY stage
  `).all();

  const openDeals = db.prepare(`
    SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS value
    FROM deals WHERE stage NOT IN ('won', 'lost')
  `).get();

  const wonThisMonth = db.prepare(`
    SELECT COUNT(*) AS count, COALESCE(SUM(amount), 0) AS value
    FROM deals WHERE stage = 'won' AND closed_at >= datetime('now', 'start of month')
  `).get();

  const counts = {
    contacts: db.prepare('SELECT COUNT(*) AS c FROM contacts').get().c,
    companies: db.prepare('SELECT COUNT(*) AS c FROM companies').get().c,
    deals: db.prepare('SELECT COUNT(*) AS c FROM deals').get().c,
    quotes: db.prepare('SELECT COUNT(*) AS c FROM quotes').get().c,
  };

  const quotesByStatus = db.prepare(`
    SELECT status, COUNT(*) AS count FROM quotes GROUP BY status
  `).all();

  const upcomingTasks = db.prepare(`
    SELECT a.*, ct.first_name || ' ' || ct.last_name AS contact_name, co.name AS company_name, d.name AS deal_name
    FROM activities a
    LEFT JOIN contacts ct ON a.contact_id = ct.id
    LEFT JOIN companies co ON a.company_id = co.id
    LEFT JOIN deals d ON a.deal_id = d.id
    WHERE a.type = 'task' AND a.completed = 0
    ORDER BY CASE WHEN a.due_date = '' THEN 1 ELSE 0 END, a.due_date
    LIMIT 8
  `).all();

  const recentActivities = db.prepare(`
    SELECT a.*, ct.first_name || ' ' || ct.last_name AS contact_name, co.name AS company_name, d.name AS deal_name
    FROM activities a
    LEFT JOIN contacts ct ON a.contact_id = ct.id
    LEFT JOIN companies co ON a.company_id = co.id
    LEFT JOIN deals d ON a.deal_id = d.id
    ORDER BY a.created_at DESC
    LIMIT 8
  `).all();

  const recentQuotes = db.prepare(`
    SELECT id, quote_number, client_name, status, created_at FROM quotes
    ORDER BY created_at DESC LIMIT 5
  `).all();

  res.json({ pipeline, openDeals, wonThisMonth, counts, quotesByStatus, upcomingTasks, recentActivities, recentQuotes });
});

module.exports = router;
