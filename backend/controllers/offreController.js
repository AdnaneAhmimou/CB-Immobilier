const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

exports.getAllOffres = catchAsync(async (req, res) => {
    const offres = await prisma.offre.findMany({
        include: {
            bien: { select: { id: true, type: true, localisation: true, prix: true, transactionType: true } },
            client: { select: { id: true, nom: true, prenom: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.json(offres);
});

exports.createOffre = catchAsync(async (req, res) => {
    const { bienId, clientId, montant } = req.body;
    const offre = await prisma.offre.create({
        data: { bienId, clientId, montant: parseFloat(montant), statut: 'En cours' },
        include: {
            bien: { select: { id: true, type: true, localisation: true, prix: true, transactionType: true } },
            client: { select: { id: true, nom: true, prenom: true } }
        }
    });
    res.status(201).json(offre);
});

exports.updateOffre = catchAsync(async (req, res) => {
    const { statut, montant, bienId, clientId } = req.body;
    const data = {};
    if (statut   !== undefined) data.statut   = statut;
    if (montant  !== undefined) data.montant  = parseFloat(montant);
    if (bienId   !== undefined) data.bienId   = bienId;
    if (clientId !== undefined) data.clientId = clientId;

    const offre = await prisma.offre.update({
        where: { id: req.params.id },
        data,
        include: {
            bien: { select: { id: true, type: true, localisation: true, prix: true, transactionType: true } },
            client: { select: { id: true, nom: true, prenom: true } }
        }
    });
    res.json(offre);
});

exports.deleteOffre = catchAsync(async (req, res) => {
    await prisma.offre.delete({ where: { id: req.params.id } });
    res.status(204).send();
});
