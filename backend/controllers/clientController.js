const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

exports.getAllClients = catchAsync(async (_req, res) => {
  const clients = await prisma.client.findMany({
    include: {
      _count: {
        select: {
          biensAVendre: true,
          biensALouer:  true,
          biensAchetes: true,
          biensLoues:   true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(clients);
});

exports.createClient = catchAsync(async (req, res) => {
  const { nom, prenom, cin, telephone, email, type, budget, commission, statut, criteres } = req.body;
  const client = await prisma.client.create({
    data: {
      nom,
      prenom,
      cin:        cin        || null,
      telephone,
      email:      email      || null,
      type,
      budget:     budget     ? parseFloat(budget)     : null,
      commission: commission ? parseFloat(commission) : null,
      statut:     statut     || 'Nouveau contact',
      criteres:   criteres   || null,
    },
  });
  res.status(201).json(client);
});

exports.updateClient = catchAsync(async (req, res) => {
  const { nom, prenom, cin, telephone, email, type, budget, commission, statut, criteres } = req.body;
  const data = {};
  if (nom        !== undefined) data.nom        = nom;
  if (prenom     !== undefined) data.prenom     = prenom;
  if (cin        !== undefined) data.cin        = cin || null;
  if (telephone  !== undefined) data.telephone  = telephone;
  if (email      !== undefined) data.email      = email || null;
  if (type       !== undefined) data.type       = type;
  if (budget     !== undefined) data.budget     = budget     ? parseFloat(budget)     : null;
  if (commission !== undefined) data.commission = commission ? parseFloat(commission) : null;
  if (statut     !== undefined) data.statut     = statut;
  if (criteres   !== undefined) data.criteres   = criteres || null;

  const client = await prisma.client.update({ where: { id: req.params.id }, data });
  res.json(client);
});

exports.deleteClient = catchAsync(async (req, res) => {
  await prisma.client.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
