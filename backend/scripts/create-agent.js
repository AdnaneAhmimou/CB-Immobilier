/**
 * Creates (or resets the password of) an agent account.
 *
 * There is no public sign-up, so this is how the first account comes into being.
 * Afterwards the Équipe page inside the app can add the rest.
 *
 *   cd backend
 *   node scripts/create-agent.js "Nom Complet" email@exemple.com "+212600000000"
 *
 * The password is asked for interactively so it never lands in your shell history.
 * It can also be piped in:  printf 'the-password' | node scripts/create-agent.js ...
 * Run against production by pointing DATABASE_URL at the production database
 * (backend/.env already does).
 */
require('dotenv').config();

const bcrypt = require('bcryptjs');
const readline = require('readline');
const prisma = require('../config/prisma');

const BCRYPT_ROUNDS = 12;
const MIN_PASSWORD = 10;

// Reads the password: from a pipe when there is one (so it can be scripted without
// landing in shell history), otherwise from the terminal without echoing it.
function readPassword(question) {
    if (!process.stdin.isTTY) {
        return new Promise((resolve) => {
            let buf = '';
            process.stdin.on('data', (c) => { buf += c; });
            process.stdin.on('end', () => resolve(buf.replace(/\r?\n$/, '')));
        });
    }
    return askHidden(question);
}

// Reads a line without echoing it back to the terminal.
function askHidden(question) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
        const onData = (char) => {
            if (['\n', '\r', '\u0004'].includes(char.toString('utf8'))) {
                process.stdin.removeListener('data', onData);
            } else {
                process.stdout.write('\x1B[2K\x1B[200D' + question + '*'.repeat(rl.line.length));
            }
        };
        process.stdin.on('data', onData);
        rl.question(question, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
    });
}

(async () => {
    const [nom, email, telephone = ''] = process.argv.slice(2);

    if (!nom || !email) {
        console.error('Usage: node scripts/create-agent.js "Nom Complet" email@exemple.com "+212600000000"');
        process.exit(1);
    }

    const normalized = email.trim().toLowerCase();
    const password = await readPassword(`Mot de passe pour ${normalized} : `);

    if (password.length < MIN_PASSWORD) {
        console.error(`Mot de passe trop court : ${MIN_PASSWORD} caractères minimum.`);
        process.exit(1);
    }

    const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const existing = await prisma.agent.findUnique({ where: { email: normalized } });

    const agent = await prisma.agent.upsert({
        where: { email: normalized },
        update: { password: hashed },
        create: { nom: nom.trim(), email: normalized, telephone: telephone.trim(), password: hashed },
    });

    console.log(existing
        ? `Mot de passe réinitialisé pour ${agent.email}.`
        : `Compte créé : ${agent.nom} <${agent.email}>`);

    await prisma.$disconnect();
})().catch(async (err) => {
    console.error(err.message);
    await prisma.$disconnect();
    process.exit(1);
});
