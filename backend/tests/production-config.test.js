/**
 * Behaviour that only differs once NODE_ENV=production, checked in child processes
 * so the main suite keeps its development settings.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const BACKEND = path.join(__dirname, '..');

const runNode = (code, env) => {
    try {
        return {
            ok: true,
            out: execFileSync(process.execPath, ['-e', code], {
                cwd: BACKEND,
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
                env: { ...process.env, ...env },
            }),
        };
    } catch (err) {
        return { ok: false, out: `${err.stdout || ''}${err.stderr || ''}` };
    }
};

const DB_URL = 'postgresql://user:a-strong-password@host:5432/db';

// Signs a token in one process and verifies it in another: the case that matters on
// Vercel, where consecutive requests hit different instances of the function.
const signIn = (env) => runNode(
    "const a=require('./config/auth');process.stdout.write(a.signSession({id:'abc',tokenVersion:0}))",
    { DOTENV_CONFIG_QUIET: 'true', ...env },
).out.trim();

const verifyIn = (token, env) => runNode(
    `const a=require('./config/auth');
     try { a.verifySession(${JSON.stringify(token)}); process.stdout.write('ok') }
     catch { process.stdout.write('rejected') }`,
    { DOTENV_CONFIG_QUIET: 'true', ...env },
).out.trim();

test('the app refuses to boot in production with no key material at all', () => {
    const result = runNode("require('./config/auth')", {
        NODE_ENV: 'production',
        JWT_SECRET: '',
        DATABASE_URL: '',
        POSTGRES_URL: '',
        DOTENV_CONFIG_QUIET: 'true',
    });

    assert.equal(result.ok, false, 'it started anyway — sessions would be forgeable');
    assert.match(result.out, /Neither JWT_SECRET nor DATABASE_URL/);
});

test('with no JWT_SECRET, the key derived from DATABASE_URL is the same in every process', () => {
    const env = { NODE_ENV: 'production', JWT_SECRET: '', DATABASE_URL: DB_URL };
    const token = signIn(env);

    assert.ok(token.startsWith('eyJ'), `expected a JWT, got: ${token.slice(0, 40)}`);
    assert.equal(verifyIn(token, env), 'ok',
        'a token signed by one instance was rejected by another — everyone would be signed out at random');
});

test('a different database password yields a different key', () => {
    const token = signIn({ NODE_ENV: 'production', JWT_SECRET: '', DATABASE_URL: DB_URL });
    const other = verifyIn(token, {
        NODE_ENV: 'production',
        JWT_SECRET: '',
        DATABASE_URL: 'postgresql://user:a-different-password@host:5432/db',
    });

    assert.equal(other, 'rejected', 'the key is not actually tied to the database URL');
});

test('the derived key is not the database password itself', () => {
    // The password must not be recoverable from anything the key touches.
    const token = signIn({ NODE_ENV: 'production', JWT_SECRET: '', DATABASE_URL: DB_URL });
    const rejected = verifyIn(token, {
        NODE_ENV: 'production',
        JWT_SECRET: 'a-strong-password',        // the raw password, used directly
        DATABASE_URL: '',
    });

    assert.equal(rejected, 'rejected', 'the signing key is the raw password rather than a derivation of it');
});

test('an explicit JWT_SECRET takes priority over the derived key', () => {
    const token = signIn({ NODE_ENV: 'production', JWT_SECRET: 'an-explicit-secret', DATABASE_URL: DB_URL });

    // Same DATABASE_URL, no explicit secret: must NOT verify, proving the explicit one was used.
    assert.equal(verifyIn(token, { NODE_ENV: 'production', JWT_SECRET: '', DATABASE_URL: DB_URL }), 'rejected');
    // And it still verifies with the explicit secret, whatever the database URL is.
    assert.equal(verifyIn(token, { NODE_ENV: 'production', JWT_SECRET: 'an-explicit-secret', DATABASE_URL: 'postgresql://x:y@z/db' }), 'ok');
});

test('the session cookie is Secure in production and not on localhost', () => {
    const read = (env) => JSON.parse(runNode(
        "const a=require('./config/auth');process.stdout.write(JSON.stringify(a.cookieOptions()))",
        { DOTENV_CONFIG_QUIET: 'true', ...env },
    ).out.trim());

    const prod = read({ NODE_ENV: 'production', JWT_SECRET: 'a-real-secret' });
    assert.equal(prod.secure, true, 'production cookie must be HTTPS-only');
    assert.equal(prod.httpOnly, true);
    assert.equal(prod.sameSite, 'lax');
    // Deliberately no maxAge/expires: it must be a session cookie, so closing the
    // browser signs the agent out (the whole point of this session model).
    assert.equal('maxAge' in prod, false, 'cookie has a maxAge — it would survive closing the browser');
    assert.equal('expires' in prod, false, 'cookie has an expires — it would survive closing the browser');

    const dev = read({ NODE_ENV: 'development', JWT_SECRET: 'dev', VERCEL: '' });
    assert.equal(dev.secure, false, 'a Secure cookie would never be stored over plain-http localhost');
    assert.equal('maxAge' in dev, false);
});

test('server errors do not leak internals in production', () => {
    // The error middleware decides by IS_PROD; assert the branch rather than boot a server.
    const code = `
        process.env.NODE_ENV='production';
        const mw = require('./middlewares/errorMiddleware');
        const res = { statusCode: 0, body: null, status(c){this.statusCode=c; return this;}, json(b){this.body=b;} };
        const original = console.error; console.error = () => {};
        mw(Object.assign(new Error('Invalid \`prisma.agent.findUnique()\`: column secret_stuff'), {}), {}, res);
        mw(Object.assign(new Error('Email déjà utilisé.'), { statusCode: 409 }), {}, res2 = { statusCode:0, body:null, status(c){this.statusCode=c; return this;}, json(b){this.body=b;} });
        console.error = original;
        process.stdout.write(JSON.stringify({ five: res.body, four: res2.body }));
    `;
    const { five, four } = JSON.parse(runNode(code, { JWT_SECRET: 'x', DOTENV_CONFIG_QUIET: 'true' }).out.trim());

    assert.equal(five.message, 'Erreur interne du serveur');
    assert.equal(five.message.includes('prisma'), false);
    // Deliberate 4xx messages are still shown — they are written for the user.
    assert.equal(four.message, 'Email déjà utilisé.');
});
