const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const router = express.Router();

function generateQuoteNumber() {
  const year = new Date().getFullYear();
  const count = db.prepare(
    "SELECT COUNT(*) as c FROM quotes WHERE quote_number LIKE ?"
  ).get(`Q-${year}-%`);
  const num = (count.c + 1).toString().padStart(4, '0');
  return `Q-${year}-${num}`;
}

function getQuoteWithItems(quoteId) {
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(quoteId);
  if (!quote) return null;

  const items = db.prepare(`
    SELECT qi.*, r.category, r.name, r.description, r.unit, r.unit_price AS rate_unit_price
    FROM quote_items qi
    JOIN rates r ON qi.rate_id = r.id
    WHERE qi.quote_id = ?
    ORDER BY qi.sort_order
  `).all(quoteId);

  const lineItems = items.map(item => {
    const effectivePrice = item.unit_price_override !== null ? item.unit_price_override : item.rate_unit_price;
    return {
      ...item,
      effective_unit_price: effectivePrice,
      line_total: effectivePrice * item.quantity
    };
  });

  const subtotal = lineItems.reduce((sum, item) => sum + item.line_total, 0);
  const discountAmount = subtotal * (quote.discount_percent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (quote.tax_percent / 100);
  const total = afterDiscount + taxAmount;

  return {
    ...quote,
    items: lineItems,
    subtotal: Math.round(subtotal * 100) / 100,
    discount_amount: Math.round(discountAmount * 100) / 100,
    tax_amount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100
  };
}

// GET /api/quotes - List all quotes
router.get('/', (req, res) => {
  const { status, contact_id, company_id, deal_id } = req.query;
  let sql = 'SELECT * FROM quotes WHERE 1=1';
  const params = [];

  if (status) {
    sql += ' AND status = ?';
    params.push(status);
  }
  if (contact_id) {
    sql += ' AND contact_id = ?';
    params.push(contact_id);
  }
  if (company_id) {
    sql += ' AND company_id = ?';
    params.push(company_id);
  }
  if (deal_id) {
    sql += ' AND deal_id = ?';
    params.push(deal_id);
  }

  sql += ' ORDER BY created_at DESC';
  const quotes = db.prepare(sql).all(...params);

  // Add totals to each quote
  const result = quotes.map(q => {
    const full = getQuoteWithItems(q.id);
    return { ...q, subtotal: full.subtotal, total: full.total, item_count: full.items.length };
  });

  res.json(result);
});

// GET /api/quotes/:id - Get quote with all line items and calculations
router.get('/:id', (req, res) => {
  const quote = getQuoteWithItems(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });
  res.json(quote);
});

// POST /api/quotes - Create a new quote (optionally linked to CRM records)
router.post('/', (req, res) => {
  const { client_name, client_email, client_company, notes, discount_percent, tax_percent, created_by, contact_id, company_id, deal_id } = req.body;

  // If linked to a contact, fill in client details from the CRM record
  let name = client_name, email = client_email, company = client_company;
  let resolvedCompanyId = company_id || null;
  if (contact_id) {
    const contact = db.prepare(`
      SELECT ct.*, co.name AS company_name FROM contacts ct
      LEFT JOIN companies co ON ct.company_id = co.id
      WHERE ct.id = ?
    `).get(contact_id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    name = name || `${contact.first_name} ${contact.last_name}`.trim();
    email = email || contact.email;
    company = company || contact.company_name || '';
    resolvedCompanyId = resolvedCompanyId || contact.company_id;
  }

  if (!name) {
    return res.status(400).json({ error: 'client_name is required' });
  }

  const id = uuidv4();
  const quote_number = generateQuoteNumber();

  db.prepare(`
    INSERT INTO quotes (id, quote_number, client_name, client_email, client_company, notes, discount_percent, tax_percent, created_by, contact_id, company_id, deal_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, quote_number, name, email || '', company || '', notes || '', discount_percent || 0, tax_percent || 0, created_by || '', contact_id || null, resolvedCompanyId, deal_id || null);

  res.status(201).json(getQuoteWithItems(id));
});

// PUT /api/quotes/:id - Update quote details
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Quote not found' });

  const { client_name, client_email, client_company, status, notes, discount_percent, tax_percent, contact_id, company_id, deal_id } = req.body;
  db.prepare(`
    UPDATE quotes SET
      client_name = COALESCE(?, client_name),
      client_email = COALESCE(?, client_email),
      client_company = COALESCE(?, client_company),
      status = COALESCE(?, status),
      notes = COALESCE(?, notes),
      discount_percent = COALESCE(?, discount_percent),
      tax_percent = COALESCE(?, tax_percent),
      contact_id = ?,
      company_id = ?,
      deal_id = ?,
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    client_name, client_email, client_company, status, notes, discount_percent, tax_percent,
    contact_id !== undefined ? (contact_id || null) : existing.contact_id,
    company_id !== undefined ? (company_id || null) : existing.company_id,
    deal_id !== undefined ? (deal_id || null) : existing.deal_id,
    req.params.id
  );

  // When a quote linked to a deal is accepted, log it on the deal timeline
  if (status === 'accepted' && existing.status !== 'accepted' && existing.deal_id) {
    db.prepare(`
      INSERT INTO activities (id, type, subject, body, deal_id, contact_id, company_id)
      VALUES (?, 'note', ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      `Quote ${existing.quote_number} accepted`,
      'Quote was marked as accepted.',
      existing.deal_id, existing.contact_id, existing.company_id
    );
  }

  res.json(getQuoteWithItems(req.params.id));
});

// DELETE /api/quotes/:id
router.delete('/:id', (req, res) => {
  const result = db.prepare('DELETE FROM quotes WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Quote not found' });
  res.json({ success: true });
});

// POST /api/quotes/:id/items - Add a line item to a quote
router.post('/:id/items', (req, res) => {
  const quote = db.prepare('SELECT * FROM quotes WHERE id = ?').get(req.params.id);
  if (!quote) return res.status(404).json({ error: 'Quote not found' });

  const { rate_id, quantity, unit_price_override } = req.body;
  if (!rate_id) return res.status(400).json({ error: 'rate_id is required' });

  const rate = db.prepare('SELECT * FROM rates WHERE id = ?').get(rate_id);
  if (!rate) return res.status(404).json({ error: 'Rate not found' });

  const id = uuidv4();
  const maxOrder = db.prepare('SELECT MAX(sort_order) as max_order FROM quote_items WHERE quote_id = ?').get(req.params.id);
  const sortOrder = (maxOrder.max_order || 0) + 1;

  db.prepare(`
    INSERT INTO quote_items (id, quote_id, rate_id, quantity, unit_price_override, sort_order)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, req.params.id, rate_id, quantity || 1, unit_price_override || null, sortOrder);

  db.prepare("UPDATE quotes SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);

  res.status(201).json(getQuoteWithItems(req.params.id));
});

// PUT /api/quotes/:id/items/:itemId - Update a line item
router.put('/:id/items/:itemId', (req, res) => {
  const item = db.prepare('SELECT * FROM quote_items WHERE id = ? AND quote_id = ?').get(req.params.itemId, req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const { quantity, unit_price_override, rate_id } = req.body;
  db.prepare(`
    UPDATE quote_items SET
      quantity = COALESCE(?, quantity),
      unit_price_override = ?,
      rate_id = COALESCE(?, rate_id)
    WHERE id = ?
  `).run(quantity, unit_price_override !== undefined ? unit_price_override : item.unit_price_override, rate_id, req.params.itemId);

  db.prepare("UPDATE quotes SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);

  res.json(getQuoteWithItems(req.params.id));
});

// DELETE /api/quotes/:id/items/:itemId - Remove a line item
router.delete('/:id/items/:itemId', (req, res) => {
  const result = db.prepare('DELETE FROM quote_items WHERE id = ? AND quote_id = ?').run(req.params.itemId, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Item not found' });

  db.prepare("UPDATE quotes SET updated_at = datetime('now') WHERE id = ?").run(req.params.id);

  res.json(getQuoteWithItems(req.params.id));
});

// POST /api/quotes/:id/duplicate - Duplicate a quote
router.post('/:id/duplicate', (req, res) => {
  const original = getQuoteWithItems(req.params.id);
  if (!original) return res.status(404).json({ error: 'Quote not found' });

  const newId = uuidv4();
  const quote_number = generateQuoteNumber();

  db.prepare(`
    INSERT INTO quotes (id, quote_number, client_name, client_email, client_company, notes, discount_percent, tax_percent, created_by, contact_id, company_id, deal_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(newId, quote_number, original.client_name, original.client_email, original.client_company, original.notes, original.discount_percent, original.tax_percent, original.created_by, original.contact_id, original.company_id, original.deal_id);

  for (const item of original.items) {
    db.prepare(`
      INSERT INTO quote_items (id, quote_id, rate_id, quantity, unit_price_override, sort_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuidv4(), newId, item.rate_id, item.quantity, item.unit_price_override, item.sort_order);
  }

  res.status(201).json(getQuoteWithItems(newId));
});

module.exports = router;
