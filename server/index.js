const express = require('express');
const cors = require('cors');
const path = require('path');
const ratesRouter = require('./routes/rates');
const quotesRouter = require('./routes/quotes');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/rates', ratesRouter);
app.use('/api/quotes', quotesRouter);

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
