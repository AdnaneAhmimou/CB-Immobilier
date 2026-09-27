/**
 * Authentication and access-control tests.
 *
 * These run against a throwaway Postgres, never the production database:
 *
 *   docker run -d --name cb-test-pg -e POSTGRES_PASSWORD=test -e POSTGRES_DB=cbtest \
 *     -p 55432:5432 postgres:16-alpine
 *   DATABASE_URL="postgresql://postgres:test@localhost:55432/cbtest" npx prisma db push
 *   npm test
 */
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
    || 'postgresql://postgres:test@localhost:55432/cbtest';
process.env.JWT_SECRET = 'test-secret-not-the-production-one';
process.env.NODE_ENV = 'test';

const { test, before, after, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = require('../app');
const prisma = require('../config/prisma');
const rateLimit = require('../middlewares/rateLimitMiddleware');
const { COOKIE_NAME } = require('../config/auth');

const PASSWORD = 'correct-horse-battery';
const EMAIL = 'agent@cb-immobilier.test';

let server, base, agentId;

// Paths that are meant to be reachable without a session. Anything not listed here
// must answer 401 when called without one — see "every route is protected" below.
const PUBLIC = [
    'GET /api/health',
    'POST /api/auth/login',
    'POST /api/auth/logout',
    'POST /api/contact',
];

const call = (method, path, { body, cookie, token, headers = {} } = {}) =>
    fetch(`${base}${path}`, {
        method,
        headers: {
            ...(body ? { 'Content-Type': 'application/json' } : {}),
            ...(cookie ? { Cookie: cookie } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        redirect: 'manual',
    });

const sessionCookie = (res) => {
    const raw = res.headers.getSetCookie?.() ?? [];
    const found = raw.find(c => c.startsWith(`${COOKIE_NAME}=`));
    return { raw: found, header: found ? found.split(';')[0] : null };
};

async function loginAs(email = EMAIL, password = PASSWORD) {
    const res = await call('POST', '/api/auth/login', { body: { email, password } });
    assert.equal(res.status, 200, `login failed: ${await res.text()}`);
    return sessionCookie(res).header;
}

/**
 * Builds the route inventory from the source rather than from Express, whose v5
 * layers no longer expose their mount path. Reading app.js and routes/*.js means a
 * route added later is picked up here automatically — the point of this test is to
 * fail the day someone mounts something without auth.
 */
function registeredRoutes() {
    const routesDir = path.join(__dirname, '..', 'routes');
    const appSource = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

    // const xRoutes = require('./routes/xRoutes')  ->  { xRoutes: 'xRoutes.js' }
    const byVariable = {};
    for (const m of appSource.matchAll(/const\s+(\w+)\s*=\s*require\(['"]\.\/routes\/(\w+)['"]\)/g)) {
        byVariable[m[1]] = `${m[2]}.js`;
    }

    // app.use('/api/x', ..., xRoutes)  ->  { 'xRoutes.js': '/api/x' }
    const mounted = {};
    for (const m of appSource.matchAll(/app\.use\(\s*['"]([^'"]+)['"][^;]*?(\w+Routes)\s*\)\s*;/g)) {
        const file = byVariable[m[2]];
        if (file) mounted[file] = m[1];
    }

    // Files that exist but are deliberately not mounted anywhere.
    const UNMOUNTED = ['proprietaireRoutes.js'];
    const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));
    const unaccounted = files.filter(f => !mounted[f] && !UNMOUNTED.includes(f));
    assert.deepEqual(unaccounted, [], `route files neither mounted nor listed as unmounted: ${unaccounted}`);

    const out = [];
    for (const [file, prefix] of Object.entries(mounted)) {
        const src = fs.readFileSync(path.join(routesDir, file), 'utf8');

        // router.get('/x', ...) / router.post('/x', ...)
        for (const m of src.matchAll(/router\.(get|post|patch|put|delete)\(\s*['"]([^'"]*)['"]/g)) {
            out.push(`${m[1].toUpperCase()} ${join(prefix, m[2])}`);
        }
        // router.route('/x').get(...).post(...)
        for (const m of src.matchAll(/router\.route\(\s*['"]([^'"]*)['"]\s*\)([^;]*)/g)) {
            for (const v of m[2].matchAll(/\.(get|post|patch|put|delete)\s*\(/g)) {
                out.push(`${v[1].toUpperCase()} ${join(prefix, m[1])}`);
            }
        }
    }
    // Endpoints declared directly on the app rather than in a router file.
    out.push('GET /api/health');
    return [...new Set(out)];
}

const join = (prefix, sub) => (sub === '/' || sub === '' ? prefix : prefix + sub);

before(async () => {
    server = app.listen(0);
    await new Promise(r => server.once('listening', r));
    base = `http://127.0.0.1:${server.address().port}`;

    await prisma.agent.deleteMany();
    const agent = await prisma.agent.create({
        data: {
            nom: 'Agent Test',
            telephone: '+212600000000',
            email: EMAIL,
            password: await bcrypt.hash(PASSWORD, 10),
        },
    });
    agentId = agent.id;
});

after(async () => {
    await prisma.agent.deleteMany();
    await prisma.$disconnect();
    server.close();
});

beforeEach(() => rateLimit.reset());

// ── The core claim: nothing is reachable without a session ────────────────────

test('every registered route except the public allowlist rejects anonymous callers', async () => {
    const routes = registeredRoutes();
    assert.ok(routes.length >= 25, `expected the full route table, got ${routes.length}`);

    const leaked = [];
    for (const route of routes) {
        if (PUBLIC.includes(route)) continue;
        const [method, path] = route.split(' ');
        // Give path params something to match; the request must die at auth anyway.
        const res = await call(method, path.replace(/:[^/]+/g, '00000000-0000-4000-8000-000000000000'));
        if (res.status !== 401) leaked.push(`${route} -> ${res.status}`);
    }

    assert.deepEqual(leaked, [], `these routes answered without a session:\n${leaked.join('\n')}`);
});

test('the public allowlist is reachable without a session', async () => {
    const health = await call('GET', '/api/health');
    assert.equal(health.status, 200);

    // The contact form may fail on mail configuration; what matters is that the
    // request is not turned away for lack of a session.
    const contact = await call('POST', '/api/contact', {
        body: { nom: 'Visiteur', email: 'visiteur@example.com', message: 'Bonjour' },
    });
    assert.notEqual(contact.status, 401);
});

test('an unknown /api path is 401 anonymously and 404 with a session', async () => {
    const anon = await call('GET', '/api/does-not-exist');
    assert.equal(anon.status, 401);

    const cookie = await loginAs();
    const authed = await call('GET', '/api/does-not-exist', { cookie });
    assert.equal(authed.status, 404);
    assert.equal(authed.headers.get('content-type')?.includes('application/json'), true);
});

// ── Login ─────────────────────────────────────────────────────────────────────

test('login rejects a wrong password and sets no cookie', async () => {
    const res = await call('POST', '/api/auth/login', { body: { email: EMAIL, password: 'wrong-password-x' } });
    assert.equal(res.status, 401);
    assert.equal(sessionCookie(res).header, null);
});

test('login rejects an unknown email with the same message as a wrong password', async () => {
    const unknown = await call('POST', '/api/auth/login', { body: { email: 'nobody@example.com', password: PASSWORD } });
    const wrong = await call('POST', '/api/auth/login', { body: { email: EMAIL, password: 'wrong-password-x' } });

    assert.equal(unknown.status, 401);
    // Different messages would let someone enumerate which emails have accounts.
    assert.equal((await unknown.json()).message, (await wrong.json()).message);
});

test('login with no body fails cleanly rather than crashing', async () => {
    const res = await call('POST', '/api/auth/login', { body: {} });
    assert.equal(res.status, 401);
});

test('login succeeds and returns a hardened session cookie', async () => {
    const res = await call('POST', '/api/auth/login', { body: { email: EMAIL, password: PASSWORD } });
    assert.equal(res.status, 200);

    const { raw } = sessionCookie(res);
    assert.ok(raw, 'no session cookie was set');
    assert.match(raw, /HttpOnly/i, 'cookie is readable by page scripts');
    assert.match(raw, /SameSite=Lax/i, 'cookie would ride along on cross-site requests');
    assert.match(raw, /Path=\//i);

    const maxAge = Number(raw.match(/Max-Age=(\d+)/i)?.[1]);
    assert.equal(maxAge, 30 * 24 * 60 * 60, 'session should last 30 days');

    const body = await res.json();
    assert.equal(body.email, EMAIL);
    assert.equal('password' in body, false, 'login response leaked the password hash');
});

test('login accepts the email in any case, with surrounding spaces', async () => {
    const res = await call('POST', '/api/auth/login', {
        body: { email: `  ${EMAIL.toUpperCase()} `, password: PASSWORD },
    });
    assert.equal(res.status, 200);
});

// ── Session validation ────────────────────────────────────────────────────────

test('a valid session reaches protected data', async () => {
    const cookie = await loginAs();
    for (const path of ['/api/auth/me', '/api/biens', '/api/clients', '/api/agents', '/api/stats']) {
        const res = await call('GET', path, { cookie });
        assert.notEqual(res.status, 401, `${path} rejected a valid session`);
        assert.ok(res.status < 500, `${path} returned ${res.status}`);
    }
});

test('a garbage or tampered token is rejected', async () => {
    const cookie = await loginAs();
    const tampered = cookie.slice(0, -3) + 'aaa';

    for (const value of [`${COOKIE_NAME}=not-a-token`, `${COOKIE_NAME}=a.b.c`, tampered]) {
        const res = await call('GET', '/api/auth/me', { cookie: value });
        assert.equal(res.status, 401, `accepted: ${value.slice(0, 40)}`);
    }
});

test('a token signed with a different secret is rejected', async () => {
    const forged = jwt.sign({ id: agentId, v: 0 }, 'attacker-secret', { expiresIn: '30d' });
    const res = await call('GET', '/api/auth/me', { token: forged });
    assert.equal(res.status, 401);
});

test('an expired token is rejected', async () => {
    const expired = jwt.sign({ id: agentId, v: 0 }, process.env.JWT_SECRET, { expiresIn: '-1h' });
    const res = await call('GET', '/api/auth/me', { token: expired });
    assert.equal(res.status, 401);
});

test('a token for a deleted account is rejected', async () => {
    const doomed = await prisma.agent.create({
        data: { nom: 'Parti', telephone: '', email: 'parti@test.local', password: await bcrypt.hash(PASSWORD, 10) },
    });
    const token = jwt.sign({ id: doomed.id, v: 0 }, process.env.JWT_SECRET, { expiresIn: '30d' });

    assert.equal((await call('GET', '/api/auth/me', { token })).status, 200);
    await prisma.agent.delete({ where: { id: doomed.id } });
    assert.equal((await call('GET', '/api/auth/me', { token })).status, 401);
});

// ── Account creation is authenticated only ────────────────────────────────────

test('registration is closed to anonymous callers', async () => {
    const res = await call('POST', '/api/auth/register', {
        body: { nom: 'Intrus', email: 'intrus@example.com', telephone: '', password: 'password-long-enough' },
    });
    assert.equal(res.status, 401);
    assert.equal(await prisma.agent.findUnique({ where: { email: 'intrus@example.com' } }), null);
});

test('a signed-in agent can create an account, with validation', async () => {
    const cookie = await loginAs();

    const short = await call('POST', '/api/auth/register', {
        cookie, body: { nom: 'X', email: 'x@test.local', telephone: '', password: 'short' },
    });
    assert.equal(short.status, 400);

    const badEmail = await call('POST', '/api/auth/register', {
        cookie, body: { nom: 'X', email: 'not-an-email', telephone: '', password: 'password-long-enough' },
    });
    assert.equal(badEmail.status, 400);

    const created = await call('POST', '/api/auth/register', {
        cookie, body: { nom: 'Collègue', email: 'Collegue@Test.Local', telephone: '+2126', password: 'password-long-enough' },
    });
    assert.equal(created.status, 201);
    const body = await created.json();
    assert.equal('password' in body, false, 'register response leaked the password hash');
    assert.equal(body.email, 'collegue@test.local', 'email should be stored lowercased');

    const duplicate = await call('POST', '/api/auth/register', {
        cookie, body: { nom: 'Collègue', email: 'collegue@test.local', telephone: '', password: 'password-long-enough' },
    });
    assert.equal(duplicate.status, 409);

    // The new account is usable.
    const asNew = await call('POST', '/api/auth/login', {
        body: { email: 'collegue@test.local', password: 'password-long-enough' },
    });
    assert.equal(asNew.status, 200);

    await prisma.agent.delete({ where: { email: 'collegue@test.local' } });
});

// ── Password change and session revocation ────────────────────────────────────

test('changing the password revokes sessions elsewhere and keeps this one', async () => {
    const victim = await prisma.agent.create({
        data: { nom: 'Rotatif', telephone: '', email: 'rotatif@test.local', password: await bcrypt.hash(PASSWORD, 10) },
    });

    const phone = await loginAs('rotatif@test.local', PASSWORD);   // the "lost" device
    const laptop = await loginAs('rotatif@test.local', PASSWORD);

    const wrongCurrent = await call('POST', '/api/auth/change-password', {
        cookie: laptop, body: { currentPassword: 'not-the-password', newPassword: 'brand-new-password' },
    });
    assert.equal(wrongCurrent.status, 401);

    const tooShort = await call('POST', '/api/auth/change-password', {
        cookie: laptop, body: { currentPassword: PASSWORD, newPassword: 'short' },
    });
    assert.equal(tooShort.status, 400);

    const changed = await call('POST', '/api/auth/change-password', {
        cookie: laptop, body: { currentPassword: PASSWORD, newPassword: 'brand-new-password' },
    });
    assert.equal(changed.status, 200);
    const refreshed = sessionCookie(changed).header;

    // The other device is out...
    assert.equal((await call('GET', '/api/auth/me', { cookie: phone })).status, 401);
    // ...this one carries on with the cookie it was just handed.
    assert.equal((await call('GET', '/api/auth/me', { cookie: refreshed })).status, 200);

    // Old password no longer works, new one does.
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'rotatif@test.local', password: PASSWORD } })).status, 401);
    assert.equal((await call('POST', '/api/auth/login', { body: { email: 'rotatif@test.local', password: 'brand-new-password' } })).status, 200);

    await prisma.agent.delete({ where: { id: victim.id } });
});

test('logout clears the session cookie', async () => {
    const cookie = await loginAs();
    const res = await call('POST', '/api/auth/logout', { cookie });
    assert.equal(res.status, 200);

    const cleared = res.headers.getSetCookie().find(c => c.startsWith(`${COOKIE_NAME}=`));
    assert.ok(cleared, 'logout did not clear the cookie');
    assert.match(cleared, /cb_session=;|Expires=Thu, 01 Jan 1970/i);
});

// ── Leakage ───────────────────────────────────────────────────────────────────

test('no endpoint hands back a password hash', async () => {
    const cookie = await loginAs();
    for (const path of ['/api/auth/me', '/api/agents', '/api/visites']) {
        const text = await (await call('GET', path, { cookie })).text();
        assert.equal(text.includes('password'), false, `${path} mentions a password field`);
        assert.equal(/\$2[aby]\$/.test(text), false, `${path} leaked a bcrypt hash`);
    }
});

// ── Brute force ───────────────────────────────────────────────────────────────

test('repeated failed logins are rate limited', async () => {
    let sawLimit = false;
    for (let i = 0; i < 12; i++) {
        const res = await call('POST', '/api/auth/login', { body: { email: EMAIL, password: `wrong-${i}` } });
        if (res.status === 429) {
            assert.ok(res.headers.get('retry-after'), '429 should say when to retry');
            sawLimit = true;
            break;
        }
    }
    assert.ok(sawLimit, 'login accepted 12 wrong passwords in a row without limiting');

    // The lockout is per email: a different account is unaffected.
    const other = await call('POST', '/api/auth/login', { body: { email: 'someone-else@test.local', password: 'x' } });
    assert.equal(other.status, 401);
});

test('signing in repeatedly with the right password is never locked out', async () => {
    // Only failures should count: several devices, or a sign-out and back in, must
    // not use up the allowance.
    for (let i = 0; i < 15; i++) {
        const res = await call('POST', '/api/auth/login', { body: { email: EMAIL, password: PASSWORD } });
        assert.equal(res.status, 200, `successful login #${i + 1} was turned away with ${res.status}`);
    }
});

test('a few failures followed by a success clear the counter', async () => {
    for (let i = 0; i < 5; i++) {
        await call('POST', '/api/auth/login', { body: { email: EMAIL, password: `wrong-${i}` } });
    }
    assert.equal((await call('POST', '/api/auth/login', { body: { email: EMAIL, password: PASSWORD } })).status, 200);

    // The slate is clean, so a fresh run of failures is not immediately blocked.
    const next = await call('POST', '/api/auth/login', { body: { email: EMAIL, password: 'wrong-again' } });
    assert.equal(next.status, 401, 'counter was not cleared by the successful login');
});

test('a correct password still works after the limiter is reset', async () => {
    rateLimit.reset();
    assert.equal((await call('POST', '/api/auth/login', { body: { email: EMAIL, password: PASSWORD } })).status, 200);
});

// ── Headers ───────────────────────────────────────────────────────────────────

test('responses carry the baseline security headers', async () => {
    const res = await call('GET', '/api/health');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-frame-options'), 'DENY');
    assert.equal(res.headers.get('referrer-policy'), 'no-referrer');
    assert.match(res.headers.get('x-robots-tag'), /noindex/);
    assert.equal(res.headers.get('cache-control'), 'no-store');
});

test('a browser origin that is not allowlisted gets no CORS grant', async () => {
    const res = await call('GET', '/api/health', { headers: { Origin: 'https://evil.example.com' } });
    assert.equal(res.headers.get('access-control-allow-origin'), null);
});
