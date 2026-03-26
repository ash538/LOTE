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
