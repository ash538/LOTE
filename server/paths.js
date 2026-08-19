const path = require('path');
const fs = require('fs');

// Everything that must survive a redeploy lives under DATA_DIR: the SQLite
// database and uploaded images. Locally it defaults to the project root, so
// nothing changes for development. In production point DATA_DIR at a mounted
// persistent disk.
const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.join(__dirname, '..');

const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(DATA_DIR, 'uploads');

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

module.exports = {
  DATA_DIR,
  UPLOAD_DIR,
  DB_PATH: process.env.DB_PATH || path.join(DATA_DIR, 'quotes.db'),
};
