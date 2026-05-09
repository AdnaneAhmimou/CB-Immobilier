const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

const BIEN_INCLUDE = {
  vendeur:   { select: { id: true, nom: true, prenom: true, commission: true } },
  acheteur:  { select: { id: true, nom: true, prenom: true } },
  bailleur:  { select: { id: true, nom: true, prenom: true, commission: true } },
  locataire: { select: { id: true, nom: true, prenom: true } },
  documents: true,
};

exports.getPublicBiens = catchAsync(async (req, res) => {
  const biens = await prisma.bien.findMany({
    where: { statut: 'Disponible' },
    include: { documents: { take: 1 } },
    orderBy: { createdAt: 'desc' },
    take: 9,
  });
  res.json(biens);
});

exports.getAllBiens = catchAsync(async (req, res) => {
  const biens = await prisma.bien.findMany({
    include: BIEN_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
  res.json(biens);
});

exports.getBien = catchAsync(async (req, res) => {
  const bien = await prisma.bien.findUnique({
    where: { id: req.params.id },
    include: { ...BIEN_INCLUDE, visites: true, offres: true },
  });
  if (!bien) return res.status(404).json({ message: 'Bien introuvable.' });
  res.json(bien);
});

exports.createBien = catchAsync(async (req, res) => {
  const { type, statut, transactionType, localisation, superficie, pieces, prix, equipements, vendeurId, bailleurId } = req.body;

  const data = {
    type,
    statut: statut || 'Disponible',
    transactionType,
    localisation,
    superficie: parseFloat(superficie),
    pieces: parseInt(pieces),
    prix: parseFloat(prix),
    equipements,
  };

  if (transactionType === 'Vente' && vendeurId) data.vendeurId = vendeurId;
  if (transactionType === 'Location' && bailleurId) data.bailleurId = bailleurId;

  const bien = await prisma.bien.create({ data, include: BIEN_INCLUDE });
  res.status(201).json(bien);
});

exports.updateBien = catchAsync(async (req, res) => {
  const { type, statut, transactionType, localisation, superficie, pieces, prix, equipements, acheteurId, locataireId } = req.body;
  const data = {};
  if (type)                    data.type            = type;
  if (statut)                  data.statut          = statut;
  if (transactionType)         data.transactionType = transactionType;
  if (localisation)            data.localisation    = localisation;
  if (superficie)              data.superficie      = parseFloat(superficie);
  if (pieces)                  data.pieces          = parseInt(pieces);
  if (prix)                    data.prix            = parseFloat(prix);
  if (equipements !== undefined) data.equipements   = equipements;
  if (acheteurId  !== undefined) data.acheteurId    = acheteurId;
  if (locataireId !== undefined) data.locataireId   = locataireId;

  const bien = await prisma.bien.update({ where: { id: req.params.id }, data, include: BIEN_INCLUDE });
  res.json(bien);
});

exports.deleteBien = catchAsync(async (req, res) => {
  await prisma.bien.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
