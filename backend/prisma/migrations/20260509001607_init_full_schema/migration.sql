-- CreateTable
CREATE TABLE "Bien" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'Disponible',
    "transactionType" TEXT NOT NULL,
    "localisation" TEXT NOT NULL,
    "superficie" REAL NOT NULL,
    "pieces" INTEGER NOT NULL,
    "prix" REAL NOT NULL,
    "equipements" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vendeurId" TEXT,
    "acheteurId" TEXT,
    "bailleurId" TEXT,
    "locataireId" TEXT,
    CONSTRAINT "Bien_vendeurId_fkey" FOREIGN KEY ("vendeurId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bien_acheteurId_fkey" FOREIGN KEY ("acheteurId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bien_bailleurId_fkey" FOREIGN KEY ("bailleurId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Bien_locataireId_fkey" FOREIGN KEY ("locataireId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "cin" TEXT,
    "telephone" TEXT NOT NULL,
    "email" TEXT,
    "type" TEXT NOT NULL,
    "budget" REAL,
    "commission" REAL,
    "statut" TEXT NOT NULL DEFAULT 'Nouveau contact',
    "criteres" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Visite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "retour" TEXT,
    "bienId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "agentId" TEXT,
    CONSTRAINT "Visite_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Visite_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Visite_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Offre" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "montant" REAL NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'En cours',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bienId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "Offre_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Offre_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "prixFinal" REAL NOT NULL,
    "commission" REAL NOT NULL,
    "dateSignature" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bienId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    CONSTRAINT "Transaction_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Transaction_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "nom" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bienId" TEXT,
    "clientId" TEXT,
    CONSTRAINT "Document_bienId_fkey" FOREIGN KEY ("bienId") REFERENCES "Bien" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_cin_key" ON "Client"("cin");

-- CreateIndex
CREATE UNIQUE INDEX "Agent_email_key" ON "Agent"("email");
