const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

exports.getAllProprietaires = catchAsync(async (req, res) => {
    const proprietaires = await prisma.proprietaire.findMany({
        include: { _count: { select: { biens: true } } },
        orderBy: { createdAt: 'desc' }
    });
    res.json(proprietaires);
});

exports.createProprietaire = catchAsync(async (req, res) => {
    const { nom, prenom, cin, telephone, email, commission } = req.body;
    const proprietaire = await prisma.proprietaire.create({
        data: { nom, prenom, cin, telephone, email, commission: parseFloat(commission) }
    });
    res.status(201).json(proprietaire);
});

exports.updateProprietaire = catchAsync(async (req, res) => {
    const { nom, prenom, telephone, email, commission } = req.body;
    const data = {};
    if (nom) data.nom = nom;
    if (prenom) data.prenom = prenom;
    if (telephone) data.telephone = telephone;
    if (email !== undefined) data.email = email;
    if (commission !== undefined) data.commission = parseFloat(commission);

    const proprietaire = await prisma.proprietaire.update({ where: { id: req.params.id }, data });
    res.json(proprietaire);
});

exports.deleteProprietaire = catchAsync(async (req, res) => {
    await prisma.proprietaire.delete({ where: { id: req.params.id } });
    res.status(204).send();
});
