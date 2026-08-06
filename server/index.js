const express = require('express');
const cors = require('cors');
const path = require('path');
const ratesRouter = require('./routes/rates');
const quotesRouter = require('./routes/quotes');
const companiesRouter = require('./routes/companies');
const contactsRouter = require('./routes/contacts');
const dealsRouter = require('./routes/deals');
const activitiesRouter = require('./routes/activities');
const dashboardRouter = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/rates', ratesRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/contacts', contactsRouter);
app.use('/api/deals', dealsRouter);
app.use('/api/activities', activitiesRouter);
app.use('/api/dashboard', dashboardRouter);

// Serve React build in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'client', 'build')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'build', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`LOTE Quote Builder API running on port ${PORT}`);
});
