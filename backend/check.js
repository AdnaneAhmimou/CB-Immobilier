const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const clients = await prisma.client.findMany({ include: { biensPossedes: true } });
  console.log(JSON.stringify(clients, null, 2));
}
main().finally(() => prisma.$disconnect());
