const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');
const { COOKIE_NAME, cookieOptions, setSessionCookie } = require('../config/auth');
const rateLimit = require('../middlewares/rateLimitMiddleware');

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD = 10;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const publicAgent = (a) => ({ id: a.id, nom: a.nom, email: a.email, telephone: a.telephone });

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

// Creating agents is an authenticated action (see authRoutes) — there is no public
// sign-up, so nobody who finds the URL can hand themselves an account.
exports.register = catchAsync(async (req, res) => {
    const { nom, telephone, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!nom?.trim())        return res.status(400).json({ message: 'Nom requis.' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Email invalide.' });
    if (!password || password.length < MIN_PASSWORD) {
        return res.status(400).json({ message: `Mot de passe : ${MIN_PASSWORD} caractères minimum.` });
    }

    const existing = await prisma.agent.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: 'Email déjà utilisé.' });

    const agent = await prisma.agent.create({
        data: {
            nom: nom.trim(),
            telephone: String(telephone || '').trim(),
            email,
            password: await bcrypt.hash(password, BCRYPT_ROUNDS),
        },
    });

    res.status(201).json(publicAgent(agent));
});

exports.login = catchAsync(async (req, res) => {
    const email = normalizeEmail(req.body.email);
    const { password } = req.body;

    const agent = email ? await prisma.agent.findUnique({ where: { email } }) : null;

    // Compare against a dummy hash when the account does not exist, so a wrong email
    // and a wrong password take the same time to answer and cannot be told apart.
    const hash = agent?.password || '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv';
    const ok = await bcrypt.compare(String(password || ''), hash);

    if (!agent || !ok) return res.status(401).json({ message: 'Identifiants incorrects.' });

    // Correct credentials: forget the attempts, so normal sign-ins never accumulate
    // toward a lockout.
    rateLimit.succeeded(req);

    setSessionCookie(res, agent);
    res.json(publicAgent(agent));
});

exports.logout = (req, res) => {
    // cookieOptions() carries no maxAge now (see config/auth.js), so this just needs
    // to match httpOnly/secure/sameSite/path for the browser to recognize it as the
    // same cookie and drop it.
    res.clearCookie(COOKIE_NAME, cookieOptions());
    res.json({ message: 'Déconnecté.' });
};

// The frontend calls this on load to find out whether the cookie it already holds
// is still good, without having to store anything itself.
exports.me = (req, res) => res.json(publicAgent(req.user));

exports.changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!newPassword || newPassword.length < MIN_PASSWORD) {
        return res.status(400).json({ message: `Mot de passe : ${MIN_PASSWORD} caractères minimum.` });
    }

    const agent = await prisma.agent.findUnique({ where: { id: req.user.id } });
    const ok = await bcrypt.compare(String(currentPassword || ''), agent.password);
    if (!ok) return res.status(401).json({ message: 'Mot de passe actuel incorrect.' });

    // Bumping tokenVersion invalidates every session that exists right now,
    // including any on a device that was lost — that is the point of it.
    const updated = await prisma.agent.update({
        where: { id: agent.id },
        data: {
            password: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
            tokenVersion: { increment: 1 },
        },
    });

    // ...then hand this device, the one that knew the old password, a fresh session.
    // Via setSessionCookie so this wins over any stale refresh protect() already
    // queued earlier in this same request (see config/auth.js for why that matters).
    setSessionCookie(res, updated);
    res.json({ message: 'Mot de passe mis à jour.' });
});
