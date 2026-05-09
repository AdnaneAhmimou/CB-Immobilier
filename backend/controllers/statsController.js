const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

exports.getFinances = catchAsync(async (_req, res) => {
  const transactions = await prisma.transaction.findMany({
    include: { bien: { select: { type: true, localisation: true } }, client: { select: { nom: true, prenom: true } } },
    orderBy: { createdAt: 'asc' },
  });

  // Monthly buckets for last 12 months
  const now = new Date();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }), vente: 0, location: 0 };
  });

  transactions.forEach(t => {
    const d   = new Date(t.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const bucket = months.find(m => m.key === key);
    if (!bucket) return;
    if (t.type === 'Vente')    bucket.vente    += t.commission;
    if (t.type === 'Location') bucket.location += t.commission;
  });

  const thisMonth = months[months.length - 1];
  const thisYear  = months.reduce((s, m) => {
    const year = m.key.split('-')[0];
    return year === String(now.getFullYear()) ? s + m.vente + m.location : s;
  }, 0);

  const totalCommissions = transactions.reduce((s, t) => s + t.commission, 0);
  const totalVente       = transactions.filter(t => t.type === 'Vente').reduce((s, t) => s + t.commission, 0);
  const totalLocation    = transactions.filter(t => t.type === 'Location').reduce((s, t) => s + t.commission, 0);

  res.json({
    totalCommissions,
    totalVente,
    totalLocation,
    thisMois: thisMonth.vente + thisMonth.location,
    thisMoisLabel: thisMonth.label,
    thisYear,
    nbTransactions: transactions.length,
    monthly: months,
    recent: transactions.slice(-10).reverse(),
  });
});

exports.getStats = catchAsync(async (_req, res) => {
  const [biens, acheteurs, locataires, vendeurs, bailleurs, visites, offres, transactions] = await Promise.all([
    prisma.bien.count(),
    prisma.client.count({ where: { type: 'Acheteur' } }),
    prisma.client.count({ where: { type: 'Locataire' } }),
    prisma.client.count({ where: { type: 'Vendeur' } }),
    prisma.client.count({ where: { type: 'Bailleur' } }),
    prisma.visite.count(),
    prisma.offre.count(),
    prisma.transaction.count(),
  ]);

  const [biensDisponibles, biensVendus, offresEnCours, recentVisites, recentTransactions, totalCommissions] = await Promise.all([
    prisma.bien.count({ where: { statut: 'Disponible' } }),
    prisma.bien.count({ where: { statut: { in: ['Vendu', 'Loué'] } } }),
    prisma.offre.count({ where: { statut: 'En cours' } }),
    prisma.visite.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        bien:   { select: { type: true, localisation: true } },
        client: { select: { nom: true, prenom: true } },
      },
    }),
    prisma.transaction.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        bien:   { select: { type: true, localisation: true } },
        client: { select: { nom: true, prenom: true } },
      },
    }),
    prisma.transaction.aggregate({ _sum: { commission: true } }),
  ]);

  const clients = acheteurs + locataires + vendeurs + bailleurs;

  res.json({
    counts:  { biens, clients, acheteurs, locataires, vendeurs, bailleurs, visites, offres, transactions },
    biens:   { disponibles: biensDisponibles, closedDeals: biensVendus },
    offres:  { enCours: offresEnCours },
    finances:{ totalCommissions: totalCommissions._sum.commission || 0 },
    recentVisites,
    recentTransactions,
  });
});
