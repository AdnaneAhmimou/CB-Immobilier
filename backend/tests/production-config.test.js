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

test('the app refuses to boot in production without JWT_SECRET', () => {
    const result = runNode("require('./config/auth')", {
        NODE_ENV: 'production',
        JWT_SECRET: '',
        DOTENV_CONFIG_QUIET: 'true',
    });

    assert.equal(result.ok, false, 'it started anyway — sessions would be forgeable');
    assert.match(result.out, /JWT_SECRET is not set/);
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
    assert.equal(prod.maxAge, 30 * 24 * 60 * 60 * 1000);

    const dev = read({ NODE_ENV: 'development', JWT_SECRET: 'dev', VERCEL: '' });
    assert.equal(dev.secure, false, 'a Secure cookie would never be stored over plain-http localhost');
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
