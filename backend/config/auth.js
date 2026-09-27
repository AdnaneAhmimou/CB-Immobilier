// Single source of truth for how sessions are signed and carried.
const jwt = require('jsonwebtoken');

const IS_PROD = process.env.NODE_ENV === 'production' || !!process.env.VERCEL;

// Sessions last a month, per the agency's request: agents work from their phones
// and should not be pushed back to the login screen every day.
const SESSION_DAYS = Number(process.env.SESSION_DAYS || 30);
const SESSION_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;

const COOKIE_NAME = 'cb_session';

// No fallback secret in production. A hard-coded default would be committed to the
// repo, and anyone reading it could mint a valid session for any account.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && IS_PROD) {
  throw new Error(
    'JWT_SECRET is not set. Refusing to start: sessions would be forgeable by anyone ' +
    'who can read the source. Set JWT_SECRET in the Vercel project environment variables.'
  );
}
const SECRET = JWT_SECRET || 'dev-only-insecure-secret-never-used-in-production';
if (!JWT_SECRET) {
  console.warn('[auth] JWT_SECRET unset — using the insecure development secret.');
}

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
