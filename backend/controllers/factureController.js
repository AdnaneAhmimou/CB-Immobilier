const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

const toLignes = (facture) => ({ ...facture, lignes: JSON.parse(facture.lignes) });

async function nextNumero() {
    const year = new Date().getFullYear();
    const count = await prisma.facture.count({
        where: { numero: { startsWith: `FAC-${year}-` } },
    });
    return `FAC-${year}-${String(count + 1).padStart(4, '0')}`;
}

exports.getAllFactures = catchAsync(async (_req, res) => {
    const factures = await prisma.facture.findMany({
        include: { transaction: { include: { bien: true, client: true } } },
        orderBy: { createdAt: 'desc' },
    });
    res.json(factures.map(toLignes));
});

exports.getFactureById = catchAsync(async (req, res) => {
    const facture = await prisma.facture.findUnique({
        where: { id: req.params.id },
        include: { transaction: { include: { bien: true, client: true } } },
    });
    if (!facture) return res.status(404).json({ message: 'Facture introuvable.' });
    res.json(toLignes(facture));
});

exports.createFacture = catchAsync(async (req, res) => {
    const {
        transactionId, dateEcheance, reference, objet,
        clientNom, clientVille, clientTelephone, clientEmail, lignes,
    } = req.body;

    if (!Array.isArray(lignes) || lignes.length === 0) {
        return res.status(400).json({ message: 'Au moins une ligne est requise.' });
    }

    let totalHT = 0;
    let totalTVA = 0;
    for (const l of lignes) {
        const ht = parseFloat(l.qte) * parseFloat(l.prixUnitaire);
        totalHT += ht;
        totalTVA += ht * (parseFloat(l.tva) / 100);
    }

    const numero = await nextNumero();

    const facture = await prisma.facture.create({
        data: {
            numero,
            dateEcheance: dateEcheance ? new Date(dateEcheance) : null,
            reference: reference || null,
            objet: objet || null,
            clientNom,
            clientVille: clientVille || null,
            clientTelephone: clientTelephone || null,
            clientEmail: clientEmail || null,
            lignes: JSON.stringify(lignes),
            totalHT,
            totalTVA,
            totalTTC: totalHT + totalTVA,
            transactionId: transactionId || null,
        },
        include: { transaction: { include: { bien: true, client: true } } },
    });
    res.status(201).json(toLignes(facture));
});

exports.deleteFacture = catchAsync(async (req, res) => {
    await prisma.facture.delete({ where: { id: req.params.id } });
    res.status(204).send();
});
