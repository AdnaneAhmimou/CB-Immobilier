const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const agents = await prisma.agent.findMany({
    select: { id: true, nom: true, email: true, telephone: true }
  });
  console.log(JSON.stringify(agents, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
