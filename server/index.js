const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const { UPLOAD_DIR } = require('./paths');

const ratesRouter = require('./routes/rates');
const quotesRouter = require('./routes/quotes');

const seedRates = require('./seed');
const cmsSeed = require('./cms/seed');
const site = require('./cms/site');
const adminApi = require('./cms/routes/admin-api');
const publicApi = require('./cms/routes/public-api');

const app = express();
const PORT = process.env.PORT || 4000;

// Ensure the tables, settings, admin account and starter content exist. Both
// seeds are idempotent, so this runs on every boot — including the first boot
// after a deploy, when a persistent disk is mounted for the first time.
seedRates();
cmsSeed();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

// Static assets: site CSS/JS, admin UI and uploaded media.
app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: '1h' }));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
// nosniff keeps a mislabelled upload from ever being interpreted as markup.
app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: '7d',
  setHeaders: res => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

// APIs
app.use('/api/admin', adminApi);
app.use('/api/site', publicApi);
app.use('/api/rates', ratesRouter);
app.use('/api/quotes', quotesRouter);

// The admin SPA is hash-routed, so every /admin/* path serves the same shell.
app.get('/admin*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// The internal quote builder (React) keeps its own mount point.
const clientBuild = path.join(__dirname, '..', 'client', 'build');
app.use('/app', express.static(clientBuild));
app.get('/app*', (req, res, next) => {
  res.sendFile(path.join(clientBuild, 'index.html'), err => (err ? next() : null));
});

// Public marketing site (includes the catch-all CMS page route).
app.use('/', site.router);

app.use(site.notFound);

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  if (req.path.startsWith('/api/')) return res.status(500).json({ error: 'Server error' });
  res.status(500).send('Something went wrong.');
});

app.listen(PORT, () => {
  console.log(`LOTE site + CMS running on port ${PORT}`);
  console.log(`  Public site: http://localhost:${PORT}/`);
  console.log(`  Admin:       http://localhost:${PORT}/admin`);
  console.log(`  Quote tool:  http://localhost:${PORT}/app`);
});
