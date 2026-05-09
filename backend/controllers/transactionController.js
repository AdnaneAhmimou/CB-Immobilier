const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

exports.getAllTransactions = catchAsync(async (req, res) => {
  const transactions = await prisma.transaction.findMany({
    include: {
      bien: {
        select: {
          id: true, type: true, localisation: true, transactionType: true,
          vendeur:  { select: { nom: true, prenom: true, commission: true } },
          bailleur: { select: { nom: true, prenom: true, commission: true } },
        },
      },
      client: { select: { id: true, nom: true, prenom: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(transactions);
});

exports.createTransaction = catchAsync(async (req, res) => {
  const { bienId, clientId, type, prixFinal, dateSignature, notes } = req.body;

  // Fetch bien + its owner to calculate commission
  const bien = await prisma.bien.findUnique({
    where: { id: bienId },
    include: {
      vendeur:  true,
      bailleur: true,
    },
  });
  if (!bien) return res.status(404).json({ message: 'Bien introuvable.' });

  const owner = bien.transactionType === 'Vente' ? bien.vendeur : bien.bailleur;
  const tauxCommission = owner?.commission ?? 3;
  const commission = (parseFloat(prixFinal) * tauxCommission) / 100;

  const transaction = await prisma.transaction.create({
    data: {
      bienId,
      clientId,
      type,
      prixFinal: parseFloat(prixFinal),
      commission,
      dateSignature: dateSignature ? new Date(dateSignature) : null,
      notes,
    },
    include: {
      bien:   { select: { id: true, type: true, localisation: true, transactionType: true } },
      client: { select: { id: true, nom: true, prenom: true } },
    },
  });

  // Mark bien as sold / rented
  await prisma.bien.update({
    where: { id: bienId },
    data: {
      statut:     type === 'Vente' ? 'Vendu' : 'Loué',
      acheteurId:  type === 'Vente'     ? clientId : undefined,
      locataireId: type === 'Location'  ? clientId : undefined,
    },
  });

  res.status(201).json(transaction);
});

exports.updateTransaction = catchAsync(async (req, res) => {
  const { prixFinal, dateSignature, notes, type } = req.body;
  const data = {};
  if (type          !== undefined) data.type          = type;
  if (prixFinal     !== undefined) data.prixFinal     = parseFloat(prixFinal);
  if (dateSignature !== undefined) data.dateSignature = dateSignature ? new Date(dateSignature) : null;
  if (notes         !== undefined) data.notes         = notes;

  const transaction = await prisma.transaction.update({
    where: { id: req.params.id },
    data,
    include: {
      bien:   { select: { id: true, type: true, localisation: true } },
      client: { select: { id: true, nom: true, prenom: true } },
    },
  });
  res.json(transaction);
});

exports.deleteTransaction = catchAsync(async (req, res) => {
  await prisma.transaction.delete({ where: { id: req.params.id } });
  res.status(204).send();
});
