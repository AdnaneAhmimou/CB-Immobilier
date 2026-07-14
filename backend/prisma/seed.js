const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const BIEN_TYPES = ['Appartement', 'Villa', 'Maison', 'Terrain', 'Bureau', 'Café', 'Magasin', 'Entrepôt', 'Local commercial'];

const VILLES = [
  'Casablanca, Maarif', 'Casablanca, Ain Diab', 'Casablanca, Bourgogne',
  'Rabat, Agdal', 'Rabat, Hay Riad', 'Marrakech, Guéliz',
  'Marrakech, Hivernage', 'Tanger, Malabata', 'Fès, Ville Nouvelle',
  'Agadir, Founty',
];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randDate(daysBack) {
  return new Date(Date.now() - randInt(0, daysBack) * 24 * 60 * 60 * 1000);
}

const NOMS = ['Alaoui', 'Bennani', 'Tazi', 'Fassi', 'Chraibi', 'Benjelloun', 'Idrissi', 'Berrada', 'Squalli', 'Lahlou', 'Cherkaoui', 'Amrani', 'Sbai', 'Guessous', 'Kabbaj'];
const PRENOMS_H = ['Youssef', 'Karim', 'Omar', 'Rachid', 'Hamza', 'Adil', 'Nabil', 'Anas'];
const PRENOMS_F = ['Salma', 'Nadia', 'Imane', 'Hind', 'Leila', 'Meryem', 'Sara', 'Fatima-Zahra'];

async function main() {
  console.log('Nettoyage des données existantes...');
  await prisma.document.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.offre.deleteMany();
  await prisma.visite.deleteMany();
  await prisma.bien.deleteMany();
  await prisma.client.deleteMany();
  await prisma.agent.deleteMany();
  await prisma.bienType.deleteMany();

  console.log('Création des types de biens...');
  await prisma.bienType.createMany({
    data: BIEN_TYPES.map((label) => ({ label })),
  });

  console.log('Création des agents...');
  const agentPassword = await bcrypt.hash('password123', 10);
  const agents = await Promise.all([
    prisma.agent.create({ data: { nom: 'Chouaib Benali', telephone: '0661122334', email: 'chouaib@cb-immobilier.ma', password: agentPassword } }),
    prisma.agent.create({ data: { nom: 'Amine Rachidi', telephone: '0662233445', email: 'amine@cb-immobilier.ma', password: agentPassword } }),
    prisma.agent.create({ data: { nom: 'Sofia El Amrani', telephone: '0663344556', email: 'sofia@cb-immobilier.ma', password: agentPassword } }),
  ]);

  console.log('Création des clients...');
  const clientTypes = ['Acheteur', 'Locataire', 'Vendeur', 'Bailleur'];
  const clientStatuts = ['Nouveau contact', 'En recherche', 'Visite effectuée', 'Offre faite', 'Dossier clôturé'];
  const clients = [];
  for (let i = 0; i < 24; i++) {
    const isHomme = Math.random() > 0.5;
    const prenom = rand(isHomme ? PRENOMS_H : PRENOMS_F);
    const nom = rand(NOMS);
    const type = clientTypes[i % clientTypes.length];
    const isOwner = type === 'Vendeur' || type === 'Bailleur';
    const client = await prisma.client.create({
      data: {
        nom,
        prenom,
        cin: `BK${randInt(100000, 999999)}`,
        telephone: `06${randInt(10000000, 99999999)}`,
        email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@gmail.com`,
        type,
        budget: isOwner ? null : randInt(3, 25) * (type === 'Locataire' ? 1000 : 100000),
        commission: isOwner ? randInt(2, 5) : null,
        statut: rand(clientStatuts),
        criteres: isOwner ? null : `${rand(BIEN_TYPES)}, ${rand(VILLES)}, ${randInt(2, 5)} pièces`,
        createdAt: randDate(180),
      },
    });
    clients.push(client);
  }

  const vendeurs = clients.filter((c) => c.type === 'Vendeur');
  const acheteurs = clients.filter((c) => c.type === 'Acheteur');
  const bailleurs = clients.filter((c) => c.type === 'Bailleur');
  const locataires = clients.filter((c) => c.type === 'Locataire');

  console.log('Création des biens...');
  const biens = [];
  for (let i = 0; i < 20; i++) {
    const isVente = i % 2 === 0;
    const type = rand(BIEN_TYPES);
    const superficie = randInt(45, 400);
    const pieces = randInt(1, 8);
    const prix = isVente
      ? randInt(400, 5000) * 1000
      : randInt(3, 40) * 1000;

    let statut = 'Disponible';
    const roll = Math.random();
    if (roll < 0.15) statut = 'Réservé';
    else if (roll < 0.35) statut = isVente ? 'Vendu' : 'Loué';

    const closed = statut === 'Vendu' || statut === 'Loué';

    const data = {
      type,
      statut,
      transactionType: isVente ? 'Vente' : 'Location',
      localisation: rand(VILLES),
      superficie,
      pieces,
      prix,
      equipements: rand(['Ascenseur, Parking, Balcon', 'Piscine, Jardin, Garage', 'Climatisation, Terrasse', 'Parking, Sécurité 24h', null]),
      createdAt: randDate(150),
    };

    if (isVente) {
      data.vendeurId = rand(vendeurs).id;
      if (closed) data.acheteurId = rand(acheteurs).id;
    } else {
      data.bailleurId = rand(bailleurs).id;
      if (closed) data.locataireId = rand(locataires).id;
    }

    const bien = await prisma.bien.create({ data });
    biens.push(bien);
  }

  console.log('Création des visites...');
  for (let i = 0; i < 25; i++) {
    const bien = rand(biens);
    const isVente = bien.transactionType === 'Vente';
    const clientPool = isVente ? acheteurs : locataires;
    await prisma.visite.create({
      data: {
        date: randDate(60),
        retour: rand(['Très intéressé, souhaite faire une offre', 'Pas convaincu par la luminosité', 'À revoir avec la famille', 'Coup de cœur', null]),
        bienId: bien.id,
        clientId: rand(clientPool).id,
        agentId: rand(agents).id,
      },
    });
  }

  console.log('Création des offres...');
  const offreStatuts = ['En cours', 'Acceptée', 'Refusée'];
  for (let i = 0; i < 15; i++) {
    const bien = rand(biens);
    const isVente = bien.transactionType === 'Vente';
    const clientPool = isVente ? acheteurs : locataires;
    await prisma.offre.create({
      data: {
        montant: Math.round(bien.prix * (0.85 + Math.random() * 0.2)),
        statut: rand(offreStatuts),
        createdAt: randDate(45),
        bienId: bien.id,
        clientId: rand(clientPool).id,
      },
    });
  }

  console.log('Création des transactions...');
  const closedBiens = biens.filter((b) => b.statut === 'Vendu' || b.statut === 'Loué');
  for (const bien of closedBiens) {
    const isVente = bien.transactionType === 'Vente';
    const clientPool = isVente ? acheteurs : locataires;
    await prisma.transaction.create({
      data: {
        type: bien.transactionType,
        prixFinal: bien.prix,
        commission: Math.round(bien.prix * 0.025),
        dateSignature: randDate(30),
        notes: rand(['Dossier complet', 'Paiement en plusieurs tranches', null]),
        bienId: bien.id,
        clientId: rand(clientPool).id,
      },
    });
  }

  console.log(`Terminé : ${agents.length} agents, ${clients.length} clients, ${biens.length} biens, 25 visites, 15 offres, ${closedBiens.length} transactions.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
