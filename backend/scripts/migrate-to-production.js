// One-time migration: reads the LOCAL SQLite dev.db + LOCAL uploads/ folder on THIS
// machine, uploads every referenced file to Cloudinary, then writes everything into
// the PRODUCTION Postgres database (via DATABASE_URL in .env — the same value your
// Vercel project uses).
//
// Safe to re-run: every write is an upsert keyed on the original id, so running this
// twice won't create duplicates.
//
// Usage (from backend/):
//   node scripts/migrate-to-production.js
//
// Requires in .env: DATABASE_URL (production Postgres), CLOUDINARY_CLOUD_NAME,
// CLOUDINARY_API_KEY, CLOUDINARY_SECRET — same values as your Vercel project.

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');
const cloudinary = require('../config/cloudinary');
const prisma = require('../config/prisma');

const DB_PATH = path.join(__dirname, '..', 'prisma', 'dev.db');
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// sql.js (pure JS/WASM, no native compilation needed) returns { columns, values }
// per query — convert to the array-of-row-objects shape the rest of this script expects.
function execToObjects(db, sql) {
    const res = db.exec(sql);
    if (res.length === 0) return [];
    const { columns, values } = res[0];
    return values.map(row => Object.fromEntries(columns.map((col, i) => [col, row[i]])));
}

function readTable(db, name) {
    try {
        return execToObjects(db, `SELECT * FROM "${name}"`);
    } catch (err) {
        console.log(`  (skipping ${name}: ${err.message})`);
        return [];
    }
}

function toDate(ms) {
    return ms == null ? null : new Date(ms);
}

async function uploadLocalFile(filePath, originalname) {
    const localName = filePath.replace(/^\/uploads\//, '');
    const fullPath = path.join(UPLOADS_DIR, localName);
    if (!fs.existsSync(fullPath)) {
        console.log(`  ⚠ file missing on disk, skipping: ${localName}`);
        return null;
    }
    const result = await cloudinary.uploader.upload(fullPath, {
        folder: 'cb-immobilier',
        resource_type: 'auto',
        filename_override: originalname,
        use_filename: true,
    });
    return result;
}

async function main() {
    if (!fs.existsSync(DB_PATH)) {
        console.error(`No dev.db found at ${DB_PATH} — nothing to migrate.`);
        process.exit(1);
    }
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set in .env — refusing to run (would write nowhere useful).');
        process.exit(1);
    }

    const SQL = await initSqlJs();
    const db = new SQL.Database(fs.readFileSync(DB_PATH));
    console.log(`Reading ${DB_PATH}...\n`);

    const bienTypes    = readTable(db, 'BienType');
    const agents        = readTable(db, 'Agent');
    const clients        = readTable(db, 'Client');
    const biens          = readTable(db, 'Bien');
    const visites        = readTable(db, 'Visite');
    const offres          = readTable(db, 'Offre');
    const transactions    = readTable(db, 'Transaction');
    const factures         = readTable(db, 'Facture');
    const documents         = readTable(db, 'Document');
    db.close();

    console.log(`Found: ${bienTypes.length} bienTypes, ${agents.length} agents, ${clients.length} clients, ` +
        `${biens.length} biens, ${visites.length} visites, ${offres.length} offres, ` +
        `${transactions.length} transactions, ${factures.length} factures, ${documents.length} documents\n`);

    if (process.argv.includes('--dry-run')) {
        console.log('--dry-run: stopping here, nothing was uploaded or written.');
        await prisma.$disconnect();
        return;
    }

    // ── Upload every local file to Cloudinary first (external side effect, do before any DB writes) ──
    console.log('Uploading files to Cloudinary...');
    const uploadedDocs = [];
    for (const d of documents) {
        if (/^https?:\/\//.test(d.filePath)) {
            // Already an absolute URL (already migrated in a prior run) — keep as-is.
            uploadedDocs.push(d);
            continue;
        }
        const result = await uploadLocalFile(d.filePath, d.nom);
        if (!result) continue;
        uploadedDocs.push({
            ...d,
            filePath: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type,
        });
        console.log(`  ✓ ${d.nom}`);
    }
    console.log(`Uploaded ${uploadedDocs.length}/${documents.length} documents.\n`);

    // ── Write everything into production Postgres, in dependency order ──
    console.log('Writing to production database...');

    for (const bt of bienTypes) {
        await prisma.bienType.upsert({ where: { id: bt.id }, create: { id: bt.id, label: bt.label }, update: { label: bt.label } });
    }

    for (const a of agents) {
        await prisma.agent.upsert({
            where: { id: a.id },
            create: { id: a.id, nom: a.nom, telephone: a.telephone, email: a.email, password: a.password },
            update: { nom: a.nom, telephone: a.telephone, email: a.email, password: a.password },
        });
    }

    for (const c of clients) {
        const data = {
            nom: c.nom, prenom: c.prenom, cin: c.cin, telephone: c.telephone, email: c.email,
            type: c.type, budget: c.budget, commission: c.commission, statut: c.statut,
            criteres: c.criteres, createdAt: toDate(c.createdAt),
        };
        await prisma.client.upsert({ where: { id: c.id }, create: { id: c.id, ...data }, update: data });
    }

    for (const b of biens) {
        const data = {
            type: b.type, statut: b.statut, transactionType: b.transactionType, localisation: b.localisation,
            superficie: b.superficie, pieces: b.pieces, prix: b.prix, equipements: b.equipements,
            createdAt: toDate(b.createdAt),
            vendeurId: b.vendeurId, acheteurId: b.acheteurId, bailleurId: b.bailleurId, locataireId: b.locataireId,
        };
        await prisma.bien.upsert({ where: { id: b.id }, create: { id: b.id, ...data }, update: data });
    }

    for (const v of visites) {
        const data = { date: toDate(v.date), retour: v.retour, bienId: v.bienId, clientId: v.clientId, agentId: v.agentId };
        await prisma.visite.upsert({ where: { id: v.id }, create: { id: v.id, ...data }, update: data });
    }

    for (const o of offres) {
        const data = { montant: o.montant, statut: o.statut, createdAt: toDate(o.createdAt), bienId: o.bienId, clientId: o.clientId };
        await prisma.offre.upsert({ where: { id: o.id }, create: { id: o.id, ...data }, update: data });
    }

    for (const t of transactions) {
        const data = {
            type: t.type, prixFinal: t.prixFinal, commission: t.commission,
            dateSignature: toDate(t.dateSignature), notes: t.notes, createdAt: toDate(t.createdAt),
            bienId: t.bienId, clientId: t.clientId,
        };
        await prisma.transaction.upsert({ where: { id: t.id }, create: { id: t.id, ...data }, update: data });
    }

    for (const f of factures) {
        const data = {
            numero: f.numero, dateEmission: toDate(f.dateEmission), dateEcheance: toDate(f.dateEcheance),
            reference: f.reference, objet: f.objet, clientNom: f.clientNom, clientVille: f.clientVille,
            clientTelephone: f.clientTelephone, clientEmail: f.clientEmail, lignes: f.lignes,
            totalHT: f.totalHT, totalTVA: f.totalTVA, totalTTC: f.totalTTC,
            createdAt: toDate(f.createdAt), transactionId: f.transactionId,
        };
        await prisma.facture.upsert({ where: { id: f.id }, create: { id: f.id, ...data }, update: data });
    }

    for (const d of uploadedDocs) {
        const data = {
            nom: d.nom, filePath: d.filePath, publicId: d.publicId, resourceType: d.resourceType,
            order: d.order ?? 0, createdAt: toDate(d.createdAt), bienId: d.bienId, clientId: d.clientId,
        };
        await prisma.document.upsert({ where: { id: d.id }, create: { id: d.id, ...data }, update: data });
    }

    console.log('\nDone. Production database and Cloudinary now have your real data.');
    await prisma.$disconnect();
}

main().catch(async (err) => {
    console.error('\nMigration failed:', err);
    await prisma.$disconnect();
    process.exit(1);
});
