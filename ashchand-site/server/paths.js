const path = require('path');
const fs = require('fs');

// Everything that must survive a redeploy lives under DATA_DIR: the SQLite
// database and uploaded files. Locally it defaults to this app's folder. In
// production point DATA_DIR at a mounted persistent disk — and keep it to this
// app alone, since the database file is this app's own schema.
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
  DB_PATH: process.env.DB_PATH || path.join(DATA_DIR, 'ashchand.db'),
};
