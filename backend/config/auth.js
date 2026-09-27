// Single source of truth for how sessions are signed and carried.
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const IS_PROD = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

// Sessions last a month, per the agency's request: agents work from their phones
// and should not be pushed back to the login screen every day.
const SESSION_DAYS = Number(process.env.SESSION_DAYS || 30);
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

const COOKIE_NAME = 'cb_session';

// The key that signs sessions. Two supported sources, in order:
//
//  1. JWT_SECRET, if you set one. Preferred: it is independent of everything else,
//     so rotating it is a deliberate act.
//  2. Otherwise it is derived from DATABASE_URL, which production already has and
//     which is already a secret (it carries the database password).
//
// The second exists so the deployment needs no hand-managed variable. What matters
// is that the key is (a) never in the repo — the old hard-coded fallback could be
// read by anyone and used to forge a session for any account — and (b) identical
// across every serverless instance and every deploy, or tokens signed by one copy
// of the backend would be rejected by the next.
//
// HMAC with a fixed label means the signing key is not the database password itself,
// so a leaked token tells an attacker nothing about the database. Rotating the
// database password changes the key and signs everyone out once, which is the
// trade-off for not having to manage a separate variable.
let LOGGED_DERIVATION = false;

const deriveSecret = () => {
  const explicit = process.env.JWT_SECRET;
  if (explicit) return explicit;

  const fromDatabase = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (fromDatabase) {
    if (!LOGGED_DERIVATION) {
      console.warn('[auth] JWT_SECRET unset — signing key derived from DATABASE_URL.');
      LOGGED_DERIVATION = true;
    }
    return crypto.createHmac('sha256', fromDatabase)
      .update('cb-immobilier/session-signing-key/v1')   // domain separation
      .digest();
  }

  if (IS_PROD) {
    throw new Error(
      'Neither JWT_SECRET nor DATABASE_URL is set. Refusing to start: there is no ' +
      'safe key to sign sessions with, and a hard-coded one could be read by anyone.'
    );
  }

  console.warn('[auth] No JWT_SECRET or DATABASE_URL — using the insecure development key.');
  return 'dev-only-insecure-secret-never-used-in-production';
};

const SECRET = deriveSecret();

const signSession = (agent) =>
  jwt.sign({ id: agent.id, v: agent.tokenVersion ?? 0 }, SECRET, { expiresIn: `${SESSION_DAYS}d` });

const verifySession = (token) => jwt.verify(token, SECRET);

// httpOnly keeps the token out of reach of any script on the page, so an XSS bug
// cannot walk off with a session the way it could with localStorage.
const cookieOptions = () => ({
  httpOnly: true,
  secure: IS_PROD,          // plain http on localhost would drop a Secure cookie
  sameSite: 'lax',          // survives normal navigation, not cross-site form posts
  maxAge: SESSION_MS,
  path: '/',
});

module.exports = { COOKIE_NAME, SESSION_DAYS, SESSION_MS, IS_PROD, signSession, verifySession, cookieOptions };
