const prisma = require('../config/prisma');
const catchAsync = require('../utils/catchAsync');

exports.getAllAgents = catchAsync(async (_req, res) => {
  const agents = await prisma.agent.findMany({
    select: {
      id: true, nom: true, telephone: true, email: true,
      _count: { select: { visites: true } },
    },
    orderBy: { nom: 'asc' },
  });
  res.json(agents);
});

exports.updateAgent = catchAsync(async (req, res) => {
  const { nom, telephone, email } = req.body;
  const agent = await prisma.agent.update({
    where: { id: req.params.id },
    // Login looks the account up by lowercased email, so it has to be stored that way.
    data: { nom, telephone, email: email ? String(email).trim().toLowerCase() : undefined },
    select: { id: true, nom: true, telephone: true, email: true },
  });
  res.json(agent);
});
