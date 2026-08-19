const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');

const { UPLOAD_DIR } = require('./paths');
const seed = require('./seed');
const site = require('./site');
const adminApi = require('./routes/admin-api');
const publicApi = require('./routes/public-api');

const app = express();
const PORT = process.env.PORT || 3000;

// Idempotent: creates tables, settings, the admin account and the starter
// content when they are missing, and does nothing once they exist.
seed();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/assets', express.static(path.join(__dirname, 'public', 'assets'), { maxAge: '1h' }));
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin')));
// nosniff keeps a mislabelled upload from ever being interpreted as markup.
app.use('/uploads', express.static(UPLOAD_DIR, {
  maxAge: '7d',
  setHeaders: res => res.setHeader('X-Content-Type-Options', 'nosniff'),
}));

app.use('/api/admin', adminApi);
app.use('/api/site', publicApi);

// The admin is hash-routed, so every /admin/* path serves the same shell.
app.get('/admin*', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html')));

app.use('/', site.router);
app.use(site.notFound);

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  if (req.path.startsWith('/api/')) return res.status(500).json({ error: 'Server error' });
  res.status(500).send('Something went wrong.');
});

app.listen(PORT, () => {
  console.log(`ashchand.com.au running on port ${PORT}`);
  console.log(`  Site:  http://localhost:${PORT}/`);
  console.log(`  Admin: http://localhost:${PORT}/admin`);
});
