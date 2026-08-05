const express = require('express');
const cors = require('cors');
const path = require('path');
const ratesRouter = require('./routes/rates');
const quotesRouter = require('./routes/quotes');
const portalRouter = require('./routes/portal');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
// Keep the raw body so the JMS webhook signature can be verified.
app.use(express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }));

// API routes
app.use('/api/rates', ratesRouter);
app.use('/api/quotes', quotesRouter);
app.use('/api/portal', portalRouter);

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
