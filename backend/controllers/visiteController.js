const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

exports.getAllVisites = catchAsync(async (req, res) => {
    const visites = await prisma.visite.findMany({
        include: {
            bien: { select: { id: true, type: true, localisation: true } },
            client: { select: { id: true, nom: true, prenom: true } },
            agent: { select: { id: true, nom: true } }
        },
        orderBy: { date: 'desc' }
    });
    res.json(visites);
});

exports.createVisite = catchAsync(async (req, res) => {
    const { bienId, clientId, agentId, date } = req.body;
    const visite = await prisma.visite.create({
        data: { bienId, clientId, agentId: agentId || null, date: new Date(date) },
        include: {
            bien: { select: { id: true, type: true, localisation: true } },
            client: { select: { id: true, nom: true, prenom: true } },
            agent: { select: { id: true, nom: true } }
        }
    });
    res.status(201).json(visite);
});

exports.updateVisite = catchAsync(async (req, res) => {
    const { retour, bienId, clientId, date } = req.body;
    const data = {};
    if (retour    !== undefined) data.retour   = retour;
    if (bienId    !== undefined) data.bienId   = bienId;
    if (clientId  !== undefined) data.clientId = clientId;
    if (date      !== undefined) data.date     = new Date(date);
    const visite = await prisma.visite.update({
        where: { id: req.params.id },
        data,
        include: {
            bien:   { select: { id: true, type: true, localisation: true } },
            client: { select: { id: true, nom: true, prenom: true } },
            agent:  { select: { id: true, nom: true } }
        }
    });
    res.json(visite);
});

exports.deleteVisite = catchAsync(async (req, res) => {
    await prisma.visite.delete({ where: { id: req.params.id } });
    res.status(204).send();
});
