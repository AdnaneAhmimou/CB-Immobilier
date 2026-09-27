// Small in-memory limiter for the few unauthenticated endpoints.
//
// On Vercel each serverless instance keeps its own counters, so a determined
// attacker spread across instances gets more attempts than the number below
// suggests. It still cuts off the common case — a script hammering one endpoint
// through one warm instance — and bcrypt makes each guess expensive anyway.
const buckets = new Map();

const prune = (now) => {
    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
};

/**
 * @param {object} opts
 * @param {number} opts.max        attempts allowed per window
 * @param {number} opts.windowMs   window length
 * @param {function} [opts.keyOn]  extra key part (e.g. the submitted email)
 */
const rateLimit = ({ max, windowMs, keyOn }) => (req, res, next) => {
    const now = Date.now();
    if (buckets.size > 5000) prune(now);   // keep the map from growing without bound

    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const key = `${req.path}|${ip}|${keyOn ? keyOn(req) : ''}`;
    const bucket = buckets.get(key);

    // Remember the keys this request counted against, so a handler that succeeds
    // can wipe them (see succeeded() below).
    (req.rateLimitKeys ||= []).push(key);

    if (!bucket || bucket.resetAt <= now) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return next();
    }

    bucket.count += 1;
    if (bucket.count > max) {
        const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({
            message: `Trop de tentatives. Réessayez dans ${Math.ceil(retryAfter / 60)} minute(s).`,
        });
    }
    next();
};

/**
 * Clears the counters for a request that turned out to be legitimate.
 *
 * Only failed attempts should count: an agent signing in on the phone, the laptop
 * and the office machine would otherwise lock themselves out, while an attacker
 * guessing passwords is only ever producing failures.
 */
rateLimit.succeeded = (req) => {
    for (const key of req.rateLimitKeys || []) buckets.delete(key);
};

// Exposed so tests can start from a clean slate.
rateLimit.reset = () => buckets.clear();

module.exports = rateLimit;
