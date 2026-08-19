const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('./db');

const SESSION_DAYS = 14;
const COOKIE = 'lote_admin';

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const derived = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, expected] = stored.split(':');
  const actual = crypto.scryptSync(String(password), salt, 64).toString('hex');
  const a = Buffer.from(actual, 'hex');
  const b = Buffer.from(expected, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Creates the first sign-in from env vars (or safe defaults) on boot.
function ensureAdmin() {
  const count = db.prepare('SELECT COUNT(*) AS n FROM users').get().n;
  if (count > 0) return null;

  const email = process.env.ADMIN_EMAIL || 'ash@ashchand.com.au';
  // An unset ADMIN_PASSWORD always gets a random one, printed once to the log.
  // A known default would otherwise ship to anywhere NODE_ENV is not set.
  const generated = !process.env.ADMIN_PASSWORD;
  const password = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');

  const id = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, 'admin')
  `).run(id, email.toLowerCase(), 'Site admin', hashPassword(password));

  if (generated) {
    console.log(`[site] Created sign-in ${email} with the password "${password}" — change it under Account.`);
  }
  return { id, email };
}

function createUser({ email, name, password, role = 'editor' }) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO users (id, email, name, password_hash, role) VALUES (?, ?, ?, ?, ?)
  `).run(id, String(email).toLowerCase(), name || '', hashPassword(password), role);
  return db.prepare('SELECT id, email, name, role, created_at FROM users WHERE id = ?').get(id);
}

// Simple lockout so a stolen email address cannot be brute-forced.
const attempts = new Map();
const ATTEMPT_WINDOW_MS = 15 * 60_000;
const MAX_ATTEMPTS = 10;

function loginBlocked(key) {
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter(t => now - t < ATTEMPT_WINDOW_MS);
  attempts.set(key, recent);
  return recent.length >= MAX_ATTEMPTS;
}

function recordFailure(key) {
  const now = Date.now();
  attempts.set(key, [...(attempts.get(key) || []).filter(t => now - t < ATTEMPT_WINDOW_MS), now]);
  if (attempts.size > 500) {
    for (const [k, times] of attempts) {
      if (!times.some(t => now - t < ATTEMPT_WINDOW_MS)) attempts.delete(k);
    }
  }
}

function login(email, password, key = 'global') {
  if (loginBlocked(key)) return { blocked: true };

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').toLowerCase());
  if (!user || !verifyPassword(password, user.password_hash)) {
    recordFailure(key);
    return null;
  }
  attempts.delete(key);

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5).toISOString();
  db.prepare('INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, user.id, expires);
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
  return { token, expires, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
}

function logout(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

function userForToken(token) {
  if (!token) return null;
  const row = db.prepare(`
    SELECT u.id, u.email, u.name, u.role FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token = ? AND s.expires_at > datetime('now')
  `).get(token);
  return row || null;
}

function tokenFromRequest(req) {
  const header = req.get('authorization');
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return (req.cookies && req.cookies[COOKIE]) || null;
}

function requireAuth(req, res, next) {
  const user = userForToken(tokenFromRequest(req));
  if (!user) return res.status(401).json({ error: 'Not signed in' });
  req.user = user;
  next();
}

// Editors manage content; admins additionally control site settings (which can
// inject scripts and CSS) and who has access.
function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only an admin can do that.' });
    }
    next();
  });
}

function changePassword(userId, password) {
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hashPassword(password), userId);
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

module.exports = {
  COOKIE, SESSION_DAYS, ensureAdmin, createUser, login, logout,
  userForToken, tokenFromRequest, requireAuth, requireAdmin, changePassword, hashPassword, verifyPassword,
};
