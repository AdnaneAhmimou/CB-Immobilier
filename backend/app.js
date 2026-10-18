require('dotenv').config();

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const errorMiddleware = require('./middlewares/errorMiddleware');
const { protect } = require('./middlewares/authMiddleware');
const rateLimit = require('./middlewares/rateLimitMiddleware');
const { IS_PROD } = require('./config/auth');

const authRoutes = require('./routes/authRoutes');
const clientRoutes = require('./routes/clientRoutes');
const bienRoutes = require('./routes/bienRoutes');
const documentRoutes = require('./routes/documentRoutes');
const visiteRoutes = require('./routes/visiteRoutes');
const offreRoutes = require('./routes/offreRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const statsRoutes = require('./routes/statsRoutes');
const agentRoutes = require('./routes/agentRoutes');
const bienTypeRoutes = require('./routes/bienTypeRoutes');
const contactRoutes = require('./routes/contactRoutes');
const factureRoutes = require('./routes/factureRoutes');

const app = express();

// Vercel terminates TLS upstream; without this every request looks like it comes
// from the proxy and the rate limiter would treat the whole internet as one client.
app.set('trust proxy', 1);

// ── Origins ────────────────────────────────────────────────
// The admin app is served from the same origin as the API, so it needs no entry here.
// ALLOWED_ORIGINS exists for the separate public website (contact form).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',').map(o => o.trim()).filter(Boolean);
if (!IS_PROD) allowedOrigins.push('http://localhost:5173', 'http://localhost:4173');

app.use(cors({
    origin: (origin, cb) => {
        // No Origin header: same-origin navigation, curl, server-to-server. Not a
        // browser cross-site request, so there is nothing for CORS to guard against.
        if (!origin) return cb(null, true);
        cb(null, allowedOrigins.includes(origin));
    },
    credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

// ── Baseline security headers ──────────────────────────────
app.use((req, res, next) => {
    res.set('X-Content-Type-Options', 'nosniff');
    res.set('X-Frame-Options', 'DENY');
    res.set('Referrer-Policy', 'no-referrer');
    // Keeps the API itself out of search results (the app is deliberately unlisted).
    res.set('X-Robots-Tag', 'noindex, nofollow');
    // Nothing here is cacheable by a shared cache: it is all per-agent data.
    res.set('Cache-Control', 'no-store');
    next();
});

// ── Public endpoints ───────────────────────────────────────
// Everything mounted before the app.use('/api', protect) line below is reachable
// without a session. Keep this list as short as it can be.
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);                       // login is public; the rest self-protect
app.use('/api/contact', rateLimit({ max: 5, windowMs: 10 * 60 * 1000 }), contactRoutes);

// ── Everything below requires a valid session ──────────────
app.use('/api', protect);

app.use('/api/clients', clientRoutes);
app.use('/api/biens', bienRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/visites', visiteRoutes);
app.use('/api/offres', offreRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/bien-types', bienTypeRoutes);
app.use('/api/factures', factureRoutes);

// An unknown /api path must not fall through to anything else.
app.use('/api', (req, res) => res.status(404).json({ message: 'Ressource introuvable.' }));

app.use(errorMiddleware);

module.exports = app;
