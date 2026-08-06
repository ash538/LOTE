// Demo-mode API: mirrors the server API but stores everything in
// localStorage, so the app runs fully in the browser (GitHub Pages,
// hosted demos). Enabled with REACT_APP_DEMO=1 at build time.

const STORE_KEY = 'lote-crm-demo';

const uuid = () =>
  (window.crypto && window.crypto.randomUUID)
    ? window.crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

// Matches SQLite's datetime('now') format (UTC, no 'Z')
const now = (offsetMs = 0) => new Date(Date.now() + offsetMs).toISOString().slice(0, 19).replace('T', ' ');

function seedData() {
  const rates = [
    ['Translation', 'Standard Translation', 'General document translation', 'per word', 0.12],
    ['Translation', 'Technical Translation', 'Technical/specialized document translation', 'per word', 0.18],
    ['Translation', 'Legal Translation', 'Legal document translation with certification', 'per word', 0.22],
    ['Translation', 'Medical Translation', 'Medical/pharmaceutical translation', 'per word', 0.20],
    ['Translation', 'Website Localization', 'Full website content translation and localization', 'per word', 0.15],
    ['Editing', 'Proofreading', 'Grammar, spelling, and punctuation check', 'per word', 0.06],
    ['Editing', 'Copy Editing', 'Style, clarity, and consistency editing', 'per word', 0.08],
    ['Editing', 'Substantive Editing', 'Deep structural and content editing', 'per word', 0.10],
    ['Interpreting', 'Phone Interpreting', 'Over-the-phone interpretation', 'per minute', 1.50],
    ['Interpreting', 'Video Interpreting', 'Video remote interpretation', 'per minute', 2.00],
    ['Interpreting', 'On-site Interpreting', 'In-person consecutive interpreting', 'per hour', 75.00],
    ['Interpreting', 'Conference Interpreting', 'Simultaneous conference interpreting', 'per hour', 120.00],
    ['DTP', 'Simple Layout', 'Basic document formatting and layout', 'per page', 15.00],
    ['DTP', 'Complex Layout', 'Advanced layout with graphics and tables', 'per page', 30.00],
    ['DTP', 'Graphic Design', 'Custom graphic design work', 'per hour', 65.00],
    ['Project Management', 'Project Management Fee', 'Project coordination and management', 'flat rate', 150.00],
    ['Project Management', 'Rush Surcharge', 'Expedited delivery surcharge', 'percent', 25.00],
    ['Project Management', 'Certification Fee', 'Certified translation statement', 'per document', 35.00],
  ].map(([category, name, description, unit, unit_price]) => ({
    id: uuid(), category, name, description, unit, unit_price,
    is_active: 1, created_at: now(), updated_at: now(),
  }));

  const co1 = uuid(), co2 = uuid(), co3 = uuid();
  const companies = [
    { id: co1, name: 'Northside Health Network', domain: 'northsidehealth.com.au', industry: 'Healthcare', phone: '02 9555 0100', address: '', notes: '', created_at: now(-86400000 * 21), updated_at: now() },
    { id: co2, name: 'Brightpath Legal', domain: 'brightpathlegal.com.au', industry: 'Legal', phone: '03 8555 0200', address: '', notes: '', created_at: now(-86400000 * 14), updated_at: now() },
    { id: co3, name: 'Cascade Manufacturing', domain: 'cascademfg.com', industry: 'Manufacturing', phone: '07 3555 0300', address: '', notes: '', created_at: now(-86400000 * 7), updated_at: now() },
  ];

  const ct1 = uuid(), ct2 = uuid(), ct3 = uuid();
  const contacts = [
    { id: ct1, first_name: 'Sarah', last_name: 'Chen', email: 'sarah.chen@northsidehealth.com.au', phone: '', job_title: 'Communications Manager', company_id: co1, lifecycle_stage: 'customer', notes: '', created_at: now(-86400000 * 21), updated_at: now() },
    { id: ct2, first_name: 'James', last_name: 'Okafor', email: 'j.okafor@brightpathlegal.com.au', phone: '', job_title: 'Practice Manager', company_id: co2, lifecycle_stage: 'prospect', notes: '', created_at: now(-86400000 * 14), updated_at: now() },
    { id: ct3, first_name: 'Maria', last_name: 'Rossi', email: 'm.rossi@cascademfg.com', phone: '', job_title: 'HR Director', company_id: co3, lifecycle_stage: 'lead', notes: '', created_at: now(-86400000 * 7), updated_at: now() },
  ];

  const d1 = uuid(), d2 = uuid(), d3 = uuid();
  const deals = [
    { id: d1, name: 'Patient info sheets — 12 languages', stage: 'proposal', amount: 8500, contact_id: ct1, company_id: co1, expected_close_date: '', notes: '', closed_at: null, created_at: now(-86400000 * 10), updated_at: now() },
    { id: d2, name: 'Court document translation retainer', stage: 'qualified', amount: 15000, contact_id: ct2, company_id: co2, expected_close_date: '', notes: '', closed_at: null, created_at: now(-86400000 * 6), updated_at: now() },
    { id: d3, name: 'Safety manual localization', stage: 'lead', amount: 5200, contact_id: ct3, company_id: co3, expected_close_date: '', notes: '', closed_at: null, created_at: now(-86400000 * 2), updated_at: now() },
  ];

  const q1 = uuid();
  const quotes = [
    { id: q1, quote_number: `Q-${new Date().getFullYear()}-0001`, client_name: 'Sarah Chen', client_email: 'sarah.chen@northsidehealth.com.au', client_company: 'Northside Health Network', status: 'sent', notes: 'Patient information sheets, 12 community languages.', discount_percent: 0, tax_percent: 10, created_by: '', contact_id: ct1, company_id: co1, deal_id: d1, created_at: now(-86400000 * 3), updated_at: now() },
  ];

  const stdTranslation = rates.find(r => r.name === 'Standard Translation');
  const pmFee = rates.find(r => r.name === 'Project Management Fee');
  const quote_items = [
    { id: uuid(), quote_id: q1, rate_id: stdTranslation.id, quantity: 6000, unit_price_override: null, sort_order: 1 },
    { id: uuid(), quote_id: q1, rate_id: pmFee.id, quantity: 1, unit_price_override: null, sort_order: 2 },
  ];

  const activities = [
    { id: uuid(), type: 'call', subject: 'Intro call with Sarah', body: 'Discussed scope: 12 languages, ~6,000 words per sheet set.', contact_id: ct1, company_id: co1, deal_id: d1, due_date: '', completed: 0, created_at: now(-86400000 * 9), updated_at: now() },
    { id: uuid(), type: 'task', subject: 'Follow up on sent quote', body: '', contact_id: ct1, company_id: co1, deal_id: d1, due_date: new Date(Date.now() + 86400000 * 3).toISOString().slice(0, 10), completed: 0, created_at: now(-86400000 * 2), updated_at: now() },
  ];

  return { rates, companies, contacts, deals, quotes, quote_items, activities };
}

function load() {
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* corrupted store — reseed */ }
  const data = seedData();
  save(data);
  return data;
}

function save(data) {
  window.localStorage.setItem(STORE_KEY, JSON.stringify(data));
}

const contactName = (db, id) => {
  const ct = db.contacts.find(c => c.id === id);
  return ct ? `${ct.first_name} ${ct.last_name}` : null;
};
const companyName = (db, id) => db.companies.find(c => c.id === id)?.name || null;
const byCreatedDesc = (a, b) => b.created_at.localeCompare(a.created_at);
const nameSort = (field) => (a, b) => (a[field] || '').toLowerCase().localeCompare((b[field] || '').toLowerCase());

// ---- Rates ----

export async function getRates(params = {}) {
  const db = load();
  let rates = [...db.rates];
  if (params.category) rates = rates.filter(r => r.category === params.category);
  if (params.active !== undefined) rates = rates.filter(r => r.is_active === (params.active === 'true' || params.active === true ? 1 : 0));
  return rates.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export async function getCategories() {
  const db = load();
  return [...new Set(db.rates.map(r => r.category))].sort();
}

export async function createRate(data) {
  const db = load();
  const rate = { id: uuid(), category: data.category, name: data.name, description: data.description || '', unit: data.unit || 'each', unit_price: data.unit_price, is_active: 1, created_at: now(), updated_at: now() };
  db.rates.push(rate);
  save(db);
  return rate;
}

export async function updateRate(id, data) {
  const db = load();
  const rate = db.rates.find(r => r.id === id);
  if (!rate) throw new Error('Rate not found');
  for (const key of ['category', 'name', 'description', 'unit', 'unit_price', 'is_active']) {
    if (data[key] !== undefined && data[key] !== null) rate[key] = data[key];
  }
  rate.updated_at = now();
  save(db);
  return rate;
}

export async function deleteRate(id) {
  const db = load();
  db.rates = db.rates.filter(r => r.id !== id);
  save(db);
  return { success: true };
}

// ---- Quotes ----

function quoteWithItems(db, quoteId) {
  const quote = db.quotes.find(q => q.id === quoteId);
  if (!quote) return null;
  const items = db.quote_items
    .filter(i => i.quote_id === quoteId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(i => {
      const rate = db.rates.find(r => r.id === i.rate_id) || {};
      const effectivePrice = i.unit_price_override !== null ? i.unit_price_override : rate.unit_price;
      return {
        ...i,
        category: rate.category, name: rate.name, description: rate.description,
        unit: rate.unit, rate_unit_price: rate.unit_price,
        effective_unit_price: effectivePrice,
        line_total: effectivePrice * i.quantity,
      };
    });
  const subtotal = items.reduce((s, i) => s + i.line_total, 0);
  const discountAmount = subtotal * (quote.discount_percent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (quote.tax_percent / 100);
  const round = (n) => Math.round(n * 100) / 100;
  return {
    ...quote, items,
    subtotal: round(subtotal),
    discount_amount: round(discountAmount),
    tax_amount: round(taxAmount),
    total: round(afterDiscount + taxAmount),
  };
}

function nextQuoteNumber(db) {
  const year = new Date().getFullYear();
  const count = db.quotes.filter(q => q.quote_number.startsWith(`Q-${year}-`)).length;
  return `Q-${year}-${String(count + 1).padStart(4, '0')}`;
}

export async function getQuotes(params = {}) {
  const db = load();
  let quotes = [...db.quotes];
  for (const key of ['status', 'contact_id', 'company_id', 'deal_id']) {
    if (params[key]) quotes = quotes.filter(q => q[key] === params[key]);
  }
  return quotes.sort(byCreatedDesc).map(q => {
    const full = quoteWithItems(db, q.id);
    return { ...q, subtotal: full.subtotal, total: full.total, item_count: full.items.length };
  });
}

export async function getQuote(id) {
  const quote = quoteWithItems(load(), id);
  if (!quote) throw new Error('Quote not found');
  return quote;
}

export async function createQuote(data) {
  const db = load();
  let { client_name, client_email, client_company, contact_id, company_id, deal_id } = data;
  if (contact_id) {
    const contact = db.contacts.find(c => c.id === contact_id);
    if (!contact) throw new Error('Contact not found');
    client_name = client_name || `${contact.first_name} ${contact.last_name}`.trim();
    client_email = client_email || contact.email;
    client_company = client_company || companyName(db, contact.company_id) || '';
    company_id = company_id || contact.company_id;
  }
  if (!client_name) throw new Error('client_name is required');
  const quote = {
    id: uuid(), quote_number: nextQuoteNumber(db),
    client_name, client_email: client_email || '', client_company: client_company || '',
    status: 'draft', notes: data.notes || '',
    discount_percent: data.discount_percent || 0, tax_percent: data.tax_percent || 0,
    created_by: data.created_by || '',
    contact_id: contact_id || null, company_id: company_id || null, deal_id: deal_id || null,
    created_at: now(), updated_at: now(),
  };
  db.quotes.push(quote);
  save(db);
  return quoteWithItems(db, quote.id);
}

export async function updateQuote(id, data) {
  const db = load();
  const quote = db.quotes.find(q => q.id === id);
  if (!quote) throw new Error('Quote not found');
  const wasAccepted = quote.status === 'accepted';
  for (const key of ['client_name', 'client_email', 'client_company', 'status', 'notes', 'discount_percent', 'tax_percent']) {
    if (data[key] !== undefined && data[key] !== null) quote[key] = data[key];
  }
  for (const key of ['contact_id', 'company_id', 'deal_id']) {
    if (data[key] !== undefined) quote[key] = data[key] || null;
  }
  quote.updated_at = now();
  if (data.status === 'accepted' && !wasAccepted && quote.deal_id) {
    db.activities.push({
      id: uuid(), type: 'note',
      subject: `Quote ${quote.quote_number} accepted`,
      body: 'Quote was marked as accepted.',
      contact_id: quote.contact_id, company_id: quote.company_id, deal_id: quote.deal_id,
      due_date: '', completed: 0, created_at: now(), updated_at: now(),
    });
  }
  save(db);
  return quoteWithItems(db, id);
}

export async function deleteQuote(id) {
  const db = load();
  db.quotes = db.quotes.filter(q => q.id !== id);
  db.quote_items = db.quote_items.filter(i => i.quote_id !== id);
  save(db);
  return { success: true };
}

export async function duplicateQuote(id) {
  const db = load();
  const original = db.quotes.find(q => q.id === id);
  if (!original) throw new Error('Quote not found');
  const newId = uuid();
  db.quotes.push({ ...original, id: newId, quote_number: nextQuoteNumber(db), status: 'draft', created_at: now(), updated_at: now() });
  for (const item of db.quote_items.filter(i => i.quote_id === id)) {
    db.quote_items.push({ ...item, id: uuid(), quote_id: newId });
  }
  save(db);
  return quoteWithItems(db, newId);
}

export async function addQuoteItem(quoteId, data) {
  const db = load();
  if (!db.quotes.find(q => q.id === quoteId)) throw new Error('Quote not found');
  if (!db.rates.find(r => r.id === data.rate_id)) throw new Error('Rate not found');
  const maxOrder = Math.max(0, ...db.quote_items.filter(i => i.quote_id === quoteId).map(i => i.sort_order));
  db.quote_items.push({
    id: uuid(), quote_id: quoteId, rate_id: data.rate_id,
    quantity: data.quantity || 1,
    unit_price_override: data.unit_price_override !== undefined ? data.unit_price_override : null,
    sort_order: maxOrder + 1,
  });
  save(db);
  return quoteWithItems(db, quoteId);
}

export async function updateQuoteItem(quoteId, itemId, data) {
  const db = load();
  const item = db.quote_items.find(i => i.id === itemId && i.quote_id === quoteId);
  if (!item) throw new Error('Item not found');
  if (data.quantity !== undefined && data.quantity !== null) item.quantity = data.quantity;
  if (data.unit_price_override !== undefined) item.unit_price_override = data.unit_price_override;
  if (data.rate_id) item.rate_id = data.rate_id;
  save(db);
  return quoteWithItems(db, quoteId);
}

export async function removeQuoteItem(quoteId, itemId) {
  const db = load();
  db.quote_items = db.quote_items.filter(i => !(i.id === itemId && i.quote_id === quoteId));
  save(db);
  return quoteWithItems(db, quoteId);
}

// ---- Companies ----

export async function getCompanies(params = {}) {
  const db = load();
  let companies = [...db.companies];
  if (params.search) {
    const s = params.search.toLowerCase();
    companies = companies.filter(c =>
      c.name.toLowerCase().includes(s) || c.domain.toLowerCase().includes(s) || c.industry.toLowerCase().includes(s));
  }
  return companies.sort(nameSort('name')).map(c => ({
    ...c,
    contact_count: db.contacts.filter(ct => ct.company_id === c.id).length,
    open_deal_count: db.deals.filter(d => d.company_id === c.id && d.stage !== 'won' && d.stage !== 'lost').length,
  }));
}

export async function getCompany(id) {
  const db = load();
  const company = db.companies.find(c => c.id === id);
  if (!company) throw new Error('Company not found');
  return {
    ...company,
    contacts: db.contacts.filter(ct => ct.company_id === id).sort(nameSort('first_name')),
    deals: db.deals.filter(d => d.company_id === id).sort(byCreatedDesc),
    quotes: db.quotes.filter(q => q.company_id === id).sort(byCreatedDesc),
  };
}

export async function createCompany(data) {
  const db = load();
  if (!data.name) throw new Error('name is required');
  const company = { id: uuid(), name: data.name, domain: data.domain || '', industry: data.industry || '', phone: data.phone || '', address: data.address || '', notes: data.notes || '', created_at: now(), updated_at: now() };
  db.companies.push(company);
  save(db);
  return company;
}

export async function updateCompany(id, data) {
  const db = load();
  const company = db.companies.find(c => c.id === id);
  if (!company) throw new Error('Company not found');
  for (const key of ['name', 'domain', 'industry', 'phone', 'address', 'notes']) {
    if (data[key] !== undefined && data[key] !== null) company[key] = data[key];
  }
  company.updated_at = now();
  save(db);
  return company;
}

export async function deleteCompany(id) {
  const db = load();
  db.companies = db.companies.filter(c => c.id !== id);
  db.contacts.forEach(ct => { if (ct.company_id === id) ct.company_id = null; });
  db.deals.forEach(d => { if (d.company_id === id) d.company_id = null; });
  db.quotes.forEach(q => { if (q.company_id === id) q.company_id = null; });
  db.activities = db.activities.filter(a => a.company_id !== id);
  save(db);
  return { success: true };
}

// ---- Contacts ----

export async function getContacts(params = {}) {
  const db = load();
  let contacts = [...db.contacts];
  if (params.search) {
    const s = params.search.toLowerCase();
    contacts = contacts.filter(c =>
      c.first_name.toLowerCase().includes(s) || c.last_name.toLowerCase().includes(s) ||
      c.email.toLowerCase().includes(s) || (companyName(db, c.company_id) || '').toLowerCase().includes(s));
  }
  if (params.company_id) contacts = contacts.filter(c => c.company_id === params.company_id);
  if (params.lifecycle_stage) contacts = contacts.filter(c => c.lifecycle_stage === params.lifecycle_stage);
  return contacts.sort(nameSort('first_name')).map(c => ({
    ...c,
    company_name: companyName(db, c.company_id),
    open_deal_count: db.deals.filter(d => d.contact_id === c.id && d.stage !== 'won' && d.stage !== 'lost').length,
  }));
}

export async function getContact(id) {
  const db = load();
  const contact = db.contacts.find(c => c.id === id);
  if (!contact) throw new Error('Contact not found');
  return {
    ...contact,
    company_name: companyName(db, contact.company_id),
    deals: db.deals.filter(d => d.contact_id === id).sort(byCreatedDesc),
    quotes: db.quotes.filter(q => q.contact_id === id).sort(byCreatedDesc),
  };
}

export async function createContact(data) {
  const db = load();
  if (!data.first_name) throw new Error('first_name is required');
  const contact = {
    id: uuid(), first_name: data.first_name, last_name: data.last_name || '',
    email: data.email || '', phone: data.phone || '', job_title: data.job_title || '',
    company_id: data.company_id || null, lifecycle_stage: data.lifecycle_stage || 'lead',
    notes: data.notes || '', created_at: now(), updated_at: now(),
  };
  db.contacts.push(contact);
  save(db);
  return contact;
}

export async function updateContact(id, data) {
  const db = load();
  const contact = db.contacts.find(c => c.id === id);
  if (!contact) throw new Error('Contact not found');
  for (const key of ['first_name', 'last_name', 'email', 'phone', 'job_title', 'lifecycle_stage', 'notes']) {
    if (data[key] !== undefined && data[key] !== null) contact[key] = data[key];
  }
  if (data.company_id !== undefined) contact.company_id = data.company_id || null;
  contact.updated_at = now();
  save(db);
  return contact;
}

export async function deleteContact(id) {
  const db = load();
  db.contacts = db.contacts.filter(c => c.id !== id);
  db.deals.forEach(d => { if (d.contact_id === id) d.contact_id = null; });
  db.quotes.forEach(q => { if (q.contact_id === id) q.contact_id = null; });
  db.activities = db.activities.filter(a => a.contact_id !== id);
  save(db);
  return { success: true };
}

// ---- Deals ----

const DEAL_STAGES = ['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const dealWithNames = (db, d) => ({
  ...d,
  contact_name: contactName(db, d.contact_id),
  company_name: companyName(db, d.company_id),
});

export async function getDeals(params = {}) {
  const db = load();
  let deals = [...db.deals];
  for (const key of ['stage', 'contact_id', 'company_id']) {
    if (params[key]) deals = deals.filter(d => d[key] === params[key]);
  }
  return deals.sort(byCreatedDesc).map(d => dealWithNames(db, d));
}

export async function getDeal(id) {
  const db = load();
  const deal = db.deals.find(d => d.id === id);
  if (!deal) throw new Error('Deal not found');
  return {
    ...dealWithNames(db, deal),
    quotes: db.quotes.filter(q => q.deal_id === id).sort(byCreatedDesc),
  };
}

export async function createDeal(data) {
  const db = load();
  if (!data.name) throw new Error('name is required');
  const deal = {
    id: uuid(), name: data.name, stage: data.stage || 'lead', amount: data.amount || 0,
    contact_id: data.contact_id || null, company_id: data.company_id || null,
    expected_close_date: data.expected_close_date || '', notes: data.notes || '',
    closed_at: null, created_at: now(), updated_at: now(),
  };
  db.deals.push(deal);
  save(db);
  return dealWithNames(db, deal);
}

export async function updateDeal(id, data) {
  const db = load();
  const deal = db.deals.find(d => d.id === id);
  if (!deal) throw new Error('Deal not found');
  if (data.stage && !DEAL_STAGES.includes(data.stage)) throw new Error('Invalid stage');
  const newStage = data.stage || deal.stage;
  const isClosing = (newStage === 'won' || newStage === 'lost') && deal.stage !== newStage;
  const isReopening = newStage !== 'won' && newStage !== 'lost' && deal.closed_at;
  for (const key of ['name', 'stage', 'amount', 'expected_close_date', 'notes']) {
    if (data[key] !== undefined && data[key] !== null) deal[key] = data[key];
  }
  for (const key of ['contact_id', 'company_id']) {
    if (data[key] !== undefined) deal[key] = data[key] || null;
  }
  if (isClosing) deal.closed_at = new Date().toISOString();
  else if (isReopening) deal.closed_at = null;
  deal.updated_at = now();
  save(db);
  return dealWithNames(db, deal);
}

export async function deleteDeal(id) {
  const db = load();
  db.deals = db.deals.filter(d => d.id !== id);
  db.quotes.forEach(q => { if (q.deal_id === id) q.deal_id = null; });
  db.activities = db.activities.filter(a => a.deal_id !== id);
  save(db);
  return { success: true };
}

// ---- Activities ----

const activityWithNames = (db, a) => ({
  ...a,
  contact_name: contactName(db, a.contact_id),
  company_name: companyName(db, a.company_id),
  deal_name: db.deals.find(d => d.id === a.deal_id)?.name || null,
});

export async function getActivities(params = {}) {
  const db = load();
  let activities = [...db.activities];
  for (const key of ['contact_id', 'company_id', 'deal_id', 'type']) {
    if (params[key]) activities = activities.filter(a => a[key] === params[key]);
  }
  if (params.open_tasks === 'true' || params.open_tasks === true) {
    activities = activities.filter(a => a.type === 'task' && !a.completed);
    activities.sort((a, b) => (a.due_date === '' ? 1 : 0) - (b.due_date === '' ? 1 : 0) || a.due_date.localeCompare(b.due_date));
  } else {
    activities.sort(byCreatedDesc);
  }
  if (params.limit) activities = activities.slice(0, parseInt(params.limit, 10));
  return activities.map(a => activityWithNames(db, a));
}

export async function createActivity(data) {
  const db = load();
  if (!data.subject) throw new Error('subject is required');
  const activity = {
    id: uuid(), type: data.type || 'note', subject: data.subject, body: data.body || '',
    contact_id: data.contact_id || null, company_id: data.company_id || null, deal_id: data.deal_id || null,
    due_date: data.due_date || '', completed: 0, created_at: now(), updated_at: now(),
  };
  db.activities.push(activity);
  save(db);
  return activityWithNames(db, activity);
}

export async function updateActivity(id, data) {
  const db = load();
  const activity = db.activities.find(a => a.id === id);
  if (!activity) throw new Error('Activity not found');
  for (const key of ['type', 'subject', 'body', 'due_date']) {
    if (data[key] !== undefined && data[key] !== null) activity[key] = data[key];
  }
  if (data.completed !== undefined) activity.completed = data.completed ? 1 : 0;
  activity.updated_at = now();
  save(db);
  return activityWithNames(db, activity);
}

export async function deleteActivity(id) {
  const db = load();
  db.activities = db.activities.filter(a => a.id !== id);
  save(db);
  return { success: true };
}

// ---- Dashboard ----

export async function getDashboard() {
  const db = load();
  const pipelineMap = {};
  for (const d of db.deals) {
    pipelineMap[d.stage] = pipelineMap[d.stage] || { stage: d.stage, count: 0, value: 0 };
    pipelineMap[d.stage].count += 1;
    pipelineMap[d.stage].value += d.amount;
  }
  const open = db.deals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const wonThisMonth = db.deals.filter(d => d.stage === 'won' && d.closed_at && new Date(d.closed_at) >= monthStart);

  const statusMap = {};
  for (const q of db.quotes) statusMap[q.status] = (statusMap[q.status] || 0) + 1;

  return {
    pipeline: Object.values(pipelineMap),
    openDeals: { count: open.length, value: open.reduce((s, d) => s + d.amount, 0) },
    wonThisMonth: { count: wonThisMonth.length, value: wonThisMonth.reduce((s, d) => s + d.amount, 0) },
    counts: { contacts: db.contacts.length, companies: db.companies.length, deals: db.deals.length, quotes: db.quotes.length },
    quotesByStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    upcomingTasks: (await getActivities({ open_tasks: 'true' })).slice(0, 8),
    recentActivities: (await getActivities({ limit: 8 })),
    recentQuotes: [...db.quotes].sort(byCreatedDesc).slice(0, 5),
  };
}
