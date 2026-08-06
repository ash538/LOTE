const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const rates = [
  // Translation Services
  { category: 'Translation', name: 'Standard Translation', description: 'General document translation', unit: 'per word', unit_price: 0.12 },
  { category: 'Translation', name: 'Technical Translation', description: 'Technical/specialized document translation', unit: 'per word', unit_price: 0.18 },
  { category: 'Translation', name: 'Legal Translation', description: 'Legal document translation with certification', unit: 'per word', unit_price: 0.22 },
  { category: 'Translation', name: 'Medical Translation', description: 'Medical/pharmaceutical translation', unit: 'per word', unit_price: 0.20 },
  { category: 'Translation', name: 'Website Localization', description: 'Full website content translation and localization', unit: 'per word', unit_price: 0.15 },

  // Editing & Proofreading
  { category: 'Editing', name: 'Proofreading', description: 'Grammar, spelling, and punctuation check', unit: 'per word', unit_price: 0.06 },
  { category: 'Editing', name: 'Copy Editing', description: 'Style, clarity, and consistency editing', unit: 'per word', unit_price: 0.08 },
  { category: 'Editing', name: 'Substantive Editing', description: 'Deep structural and content editing', unit: 'per word', unit_price: 0.10 },

  // Interpreting Services
  { category: 'Interpreting', name: 'Phone Interpreting', description: 'Over-the-phone interpretation', unit: 'per minute', unit_price: 1.50 },
  { category: 'Interpreting', name: 'Video Interpreting', description: 'Video remote interpretation', unit: 'per minute', unit_price: 2.00 },
  { category: 'Interpreting', name: 'On-site Interpreting', description: 'In-person consecutive interpreting', unit: 'per hour', unit_price: 75.00 },
  { category: 'Interpreting', name: 'Conference Interpreting', description: 'Simultaneous conference interpreting', unit: 'per hour', unit_price: 120.00 },

  // Desktop Publishing
  { category: 'DTP', name: 'Simple Layout', description: 'Basic document formatting and layout', unit: 'per page', unit_price: 15.00 },
  { category: 'DTP', name: 'Complex Layout', description: 'Advanced layout with graphics and tables', unit: 'per page', unit_price: 30.00 },
  { category: 'DTP', name: 'Graphic Design', description: 'Custom graphic design work', unit: 'per hour', unit_price: 65.00 },

  // Project Management
  { category: 'Project Management', name: 'Project Management Fee', description: 'Project coordination and management', unit: 'flat rate', unit_price: 150.00 },
  { category: 'Project Management', name: 'Rush Surcharge', description: 'Expedited delivery surcharge', unit: 'percent', unit_price: 25.00 },
  { category: 'Project Management', name: 'Certification Fee', description: 'Certified translation statement', unit: 'per document', unit_price: 35.00 },
];

console.log('Seeding rates...');
const insert = db.prepare(`
  INSERT OR IGNORE INTO rates (id, category, name, description, unit, unit_price)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((items) => {
  for (const item of items) {
    insert.run(uuidv4(), item.category, item.name, item.description, item.unit, item.unit_price);
  }
});

insertMany(rates);
console.log(`Seeded ${rates.length} rates successfully.`);

// Sample CRM data (only seeded once — skipped if companies already exist)
const existingCompanies = db.prepare('SELECT COUNT(*) AS c FROM companies').get().c;
if (existingCompanies === 0) {
  console.log('Seeding sample CRM data...');

  const companies = [
    { name: 'Northside Health Network', domain: 'northsidehealth.com.au', industry: 'Healthcare', phone: '02 9555 0100' },
    { name: 'Brightpath Legal', domain: 'brightpathlegal.com.au', industry: 'Legal', phone: '03 8555 0200' },
    { name: 'Cascade Manufacturing', domain: 'cascademfg.com', industry: 'Manufacturing', phone: '07 3555 0300' },
  ];
  const companyIds = {};
  const insertCompany = db.prepare('INSERT INTO companies (id, name, domain, industry, phone) VALUES (?, ?, ?, ?, ?)');
  for (const c of companies) {
    const cid = uuidv4();
    companyIds[c.name] = cid;
    insertCompany.run(cid, c.name, c.domain, c.industry, c.phone);
  }

  const contacts = [
    { first_name: 'Sarah', last_name: 'Chen', email: 'sarah.chen@northsidehealth.com.au', job_title: 'Communications Manager', company: 'Northside Health Network', lifecycle_stage: 'customer' },
    { first_name: 'James', last_name: 'Okafor', email: 'j.okafor@brightpathlegal.com.au', job_title: 'Practice Manager', company: 'Brightpath Legal', lifecycle_stage: 'prospect' },
    { first_name: 'Maria', last_name: 'Rossi', email: 'm.rossi@cascademfg.com', job_title: 'HR Director', company: 'Cascade Manufacturing', lifecycle_stage: 'lead' },
  ];
  const contactIds = {};
  const insertContact = db.prepare('INSERT INTO contacts (id, first_name, last_name, email, job_title, company_id, lifecycle_stage) VALUES (?, ?, ?, ?, ?, ?, ?)');
  for (const ct of contacts) {
    const ctid = uuidv4();
    contactIds[ct.first_name] = ctid;
    insertContact.run(ctid, ct.first_name, ct.last_name, ct.email, ct.job_title, companyIds[ct.company], ct.lifecycle_stage);
  }

  const deals = [
    { name: 'Patient info sheets — 12 languages', stage: 'proposal', amount: 8500, contact: 'Sarah', company: 'Northside Health Network' },
    { name: 'Court document translation retainer', stage: 'qualified', amount: 15000, contact: 'James', company: 'Brightpath Legal' },
    { name: 'Safety manual localization', stage: 'lead', amount: 5200, contact: 'Maria', company: 'Cascade Manufacturing' },
  ];
  const insertDeal = db.prepare('INSERT INTO deals (id, name, stage, amount, contact_id, company_id) VALUES (?, ?, ?, ?, ?, ?)');
  for (const d of deals) {
    insertDeal.run(uuidv4(), d.name, d.stage, d.amount, contactIds[d.contact], companyIds[d.company]);
  }

  console.log(`Seeded ${companies.length} companies, ${contacts.length} contacts, ${deals.length} deals.`);
} else {
  console.log('CRM data already present — skipping sample CRM seed.');
}
