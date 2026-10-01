const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');
const { COOKIE_NAME, verifySession, shouldRefresh, setSessionCookie } = require('../config/auth');

const unauthorized = (res, message) => res.status(401).json({ message });

// Every /api route goes through this unless it is explicitly listed as public in app.js.
exports.protect = catchAsync(async (req, res, next) => {
    // The cookie is the real session. The Bearer header is kept for scripts and tests
    // that cannot hold a cookie jar.
    let token = req.cookies?.[COOKIE_NAME];
    const header = req.headers.authorization;
    if (!token && header && header.startsWith('Bearer ')) token = header.slice(7);

    if (!token) return unauthorized(res, 'Non autorisé. Connexion requise.');

    let decoded;
    try {
        decoded = verifySession(token);
    } catch {
        // Expired, tampered with, or signed by a different secret — all the same to us.
        return unauthorized(res, 'Session expirée ou invalide. Reconnectez-vous.');
    }

    const agent = await prisma.agent.findUnique({
        where: { id: decoded.id },
        select: { id: true, nom: true, email: true, telephone: true, tokenVersion: true },
    });
    // A token stays cryptographically valid after its account is deleted, so the
    // account has to be re-checked on every request, not just at login.
    if (!agent) return unauthorized(res, 'Compte introuvable.');

    // Sessions issued before the last password change are no longer accepted.
    if ((decoded.v ?? 0) !== agent.tokenVersion) {
        return unauthorized(res, 'Session expirée ou invalide. Reconnectez-vous.');
    }

    // Sliding window: a token only lives IDLE_MINUTES, so an active agent needs it
    // renewed well before then or every few minutes of real use would bounce them
    // to the login screen. An abandoned tab stops sending requests, stops getting
    // renewed, and the token simply expires — that is the idle timeout.
    //
    // setSessionCookie (not res.cookie directly) so that if the route handler also
    // reissues the session later in this same request — change-password does, with
    // the account's new tokenVersion — that later call wins instead of the response
    // carrying two conflicting Set-Cookie headers.
    if (shouldRefresh(decoded)) {
        setSessionCookie(res, agent);
    }

    req.user = agent;
    next();
});
