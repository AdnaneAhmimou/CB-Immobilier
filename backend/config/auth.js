// Single source of truth for how sessions are signed and carried.
const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');
const { nextDailyCutoff } = require('./dailyCutoff');

const IS_PROD = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

const COOKIE_NAME = 'cb_session';

// Sessions last from whenever the agent signs in until a fixed clock time each day —
// not a fixed duration, not an idle timer. Per the agency: the app should stay open
// for the whole working day and only ask for a password again the next morning.
const CUTOFF_HOUR = Number(process.env.SESSION_CUTOFF_HOUR ?? 21);       // 9pm
const CUTOFF_TZ   = process.env.SESSION_CUTOFF_TZ || 'Africa/Casablanca';

const sessionCutoff = (from = new Date()) => nextDailyCutoff(from, { hour: CUTOFF_HOUR, timeZone: CUTOFF_TZ });

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

// Both the JWT's own expiry and the cookie's Max-Age are pinned to the exact same
// instant, computed once per sign so the two can never drift apart — a cookie that
// outlives its token would just mean a pointless 401 at the door; a token that
// outlives its cookie would never be presented past that point anyway.
const signSession = (agent, { now = new Date() } = {}) => {
  const cutoff = sessionCutoff(now);
  const token = jwt.sign(
    { id: agent.id, v: agent.tokenVersion ?? 0 },
    SECRET,
    { expiresIn: Math.max(1, Math.round((cutoff.getTime() - now.getTime()) / 1000)) },
  );
  return { token, cutoff };
};

const verifySession = (token) => jwt.verify(token, SECRET);

// httpOnly keeps the token out of reach of any script on the page, so an XSS bug
// cannot walk off with a session the way it could with localStorage.
const cookieOptions = (expires) => ({
  httpOnly: true,
  secure: IS_PROD,          // plain http on localhost would drop a Secure cookie
  sameSite: 'lax',          // survives normal navigation, not cross-site form posts
  path: '/',
  // A real expiry (not a plain session cookie) on purpose: the whole point of the
  // daily cutoff is that the app stays signed in across closing the tab or the
  // browser during the working day — only the 9pm cutoff itself signs anyone out.
  ...(expires ? { expires } : {}),
});

/**
 * Sets the session cookie, replacing any Set-Cookie already queued for it on this
 * response rather than appending another one. protect() never sets this cookie
 * (the daily cutoff is fixed, nothing to renew mid-session), so today only login
 * and change-password ever call this — but a response ending up with two
 * conflicting Set-Cookie headers for the same name is the kind of bug that is
 * cheap to make impossible outright rather than merely unlikely.
 */
const setSessionCookie = (res, agent) => {
  const existing = res.getHeader('Set-Cookie');
  if (existing) {
    const kept = (Array.isArray(existing) ? existing : [existing])
      .filter((c) => !c.startsWith(`${COOKIE_NAME}=`));
    res.setHeader('Set-Cookie', kept);
  }
  const { token, cutoff } = signSession(agent);
  res.cookie(COOKIE_NAME, token, cookieOptions(cutoff));
};

module.exports = {
  COOKIE_NAME, CUTOFF_HOUR, CUTOFF_TZ, IS_PROD,
  sessionCutoff, signSession, verifySession, cookieOptions, setSessionCookie,
};
