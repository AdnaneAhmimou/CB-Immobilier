// Single source of truth for how sessions are signed and carried.
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const IS_PROD = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

// Sessions are deliberately short-lived, per the agency: leaving the app should mean
// signing in again. Two separate mechanisms, because neither covers the other:
//
//  * The cookie has no Max-Age, so the browser drops it when it closes.
//  * The token expires after IDLE_MINUTES and is renewed while the agent is active,
//    so an abandoned screen stops working even if the browser stays open.
const IDLE_MINUTES = Number(process.env.SESSION_IDLE_MINUTES || 10);
const IDLE_MS = IDLE_MINUTES * 60 * 1000;

// Re-issuing on every single request would re-sign a token many times a second for
// no benefit; once a minute keeps the sliding window accurate enough. Overridable so
// tests can force a refresh on every request instead of waiting a minute for one.
const REFRESH_AFTER_MS = Number(process.env.SESSION_REFRESH_AFTER_MS ?? 60 * 1000);

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
  jwt.sign({ id: agent.id, v: agent.tokenVersion ?? 0 }, SECRET, { expiresIn: `${IDLE_MINUTES}m` });

// True once the token is old enough to be worth re-issuing (see REFRESH_AFTER_MS).
const shouldRefresh = (decoded) =>
  !decoded.iat || Date.now() - decoded.iat * 1000 >= REFRESH_AFTER_MS;

const verifySession = (token) => jwt.verify(token, SECRET);

// httpOnly keeps the token out of reach of any script on the page, so an XSS bug
// cannot walk off with a session the way it could with localStorage.
const cookieOptions = () => ({
  httpOnly: true,
  secure: IS_PROD,          // plain http on localhost would drop a Secure cookie
  sameSite: 'lax',          // survives normal navigation, not cross-site form posts
  path: '/',
  // No maxAge and no expires on purpose: that makes it a session cookie, which the
  // browser discards when it closes rather than writing to disk.
});

/**
 * Sets the session cookie, replacing any Set-Cookie already queued for it on this
 * response rather than appending another one.
 *
 * Without this, a request that both (a) is old enough for protect()'s idle-window
 * refresh and (b) hits a handler that reissues the session itself — change-password
 * is the one case today — ends up with two "Set-Cookie: cb_session=..." headers in
 * the same response: one stale (the middleware's, still the old tokenVersion) and
 * one authoritative (the handler's). Which one a browser keeps is not something to
 * rely on, so every place that sets this cookie goes through here instead of
 * res.cookie() directly, and the most recent call always wins.
 */
const setSessionCookie = (res, agent) => {
  const existing = res.getHeader('Set-Cookie');
  if (existing) {
    const kept = (Array.isArray(existing) ? existing : [existing])
      .filter((c) => !c.startsWith(`${COOKIE_NAME}=`));
    res.setHeader('Set-Cookie', kept);
  }
  res.cookie(COOKIE_NAME, signSession(agent), cookieOptions());
};

module.exports = {
  COOKIE_NAME, IDLE_MINUTES, IDLE_MS, REFRESH_AFTER_MS, IS_PROD,
  signSession, verifySession, shouldRefresh, cookieOptions, setSessionCookie,
};
