SYSTEME DE GESTION IMMOBILIERE
Cahier des Charges Fonctionnel
Pour Agence Immobiliere


1. Introduction et Objectifs
Ce document decrit les fonctionnalites attendues d'un systeme de gestion immobiliere complet destine a une agence immobiliere. L'objectif est de centraliser la gestion des biens, des proprietaires, des clients et des transactions dans une seule plateforme.

L'agence immobiliere joue le role d'intermediaire entre :
Les proprietaires : personnes souhaitant vendre ou louer leur bien
Les clients/acheteurs : personnes souhaitant acheter ou louer un bien
Les agents immobiliers : qui gerent les relations et concluent les transactions


2. Modules Fonctionnels
2.1 - Gestion des Biens Immobiliers
Le coeur du systeme. Chaque bien enregistre contient les informations suivantes :

Champ	Description	Exemples / Valeurs
Type de bien	Nature du bien immobilier	Appartement, Villa, Maison, Terrain
Statut	Etat actuel du bien	Disponible, Reserve, Vendu, Loue
Type de transaction	Ce que le proprietaire souhaite	Vente ou Location
Localisation	Adresse complete	Ville, Quartier, Etage, N° appart.
Superficie	Surface en metres carres	Ex: 85 m2, 150 m2
Pieces	Nombre de chambres / salles de bain	Ex: 3 chambres, 2 SDB
Prix	Prix de vente ou loyer mensuel	Ex: 850 000 MAD / 5 000 MAD/mois
Equipements	Details complementaires	Meuble, Garage, Balcon, Ascenseur
Photos	Images du bien	Fichiers JPG / PNG
Documents	Papiers legaux associes	Titre foncier, plan cadastral

2.2 - Gestion des Proprietaires
Chaque proprietaire qui confie un bien a l'agence signe un mandat. Le systeme enregistre :
Profil complet : nom, prenom, CIN, telephone, email
Mandat de vente ou location : date de debut, date de fin, exclusivite ou non
Taux de commission convenu avec l'agence
Liste de tous les biens appartenant au proprietaire

2.3 - Gestion des Clients
Les clients sont les personnes cherchant a acheter ou louer un bien. Le systeme gere :
Profil client : nom, prenom, telephone, email, budget
Criteres de recherche : type de bien, quartier prefere, superficie minimale, prix maximum
Statut du dossier : Nouveau contact, En recherche, Visite effectuee, Offre faite, Dossier cloture

2.4 - Matching et Recherche
Le systeme doit permettre a l'agent de retrouver rapidement les biens correspondant aux criteres d'un client. Filtres disponibles :
Type de bien (appartement, villa, terrain...)
Type de transaction (vente ou location)
Localisation (ville, quartier)
Fourchette de prix
Superficie minimale
Nombre de pieces

2.5 - Gestion des Visites
Lorsqu'un client souhaite visiter un bien, le systeme permet de :
Planifier un rendez-vous de visite (date, heure, lieu)
Affecter un agent immobilier responsable de la visite
Enregistrer le retour de visite : interesse, pas interesse, veut negocier
Historiser toutes les visites par bien et par client

2.6 - Offres et Negociation
Apres une visite concluante, le client peut soumettre une offre. Le systeme gere :
Montant de l'offre propose par le client
Contre-offre du proprietaire
Historique complet des echanges de negociation
Statut de la negociation : En cours, Acceptee, Refusee

2.7 - Gestion des Transactions
Lors de la cloture d'un dossier (vente ou location), le systeme enregistre :
Type : Vente definitive ou Contrat de location
Prix final convenu entre les parties
Commission de l'agence calculee automatiquement
Date de signature chez le notaire (pour les ventes)
Documents contractuels telecharges (compromis, acte de vente, bail)

2.8 - Gestion Documentaire
L'immobilier est tres dependant des documents officiels. Le systeme centralise :

Document	Concerne	Obligatoire
Titre foncier	Bien immobilier	Oui
CIN du proprietaire	Proprietaire	Oui
Mandat de l'agence	Proprietaire + Agence	Oui
Compromis de vente	Transaction vente	Oui
Acte de vente notarie	Transaction vente	Oui
Contrat de bail	Transaction location	Oui
Quittances de loyer	Location en cours	Recommande
Photos du bien	Bien immobilier	Recommande

2.9 - Gestion des Agents
Suivi de l'activite des agents immobiliers de l'agence :
Profil de chaque agent : nom, telephone, email
Biens et clients assignes a chaque agent
Performance : nombre de transactions closes, commissions generees
Agenda personnel avec rendez-vous de visites

2.10 - Suivi Financier
Vision globale des revenus de l'agence :
Commissions percues par transaction
Commissions en attente (dossiers en negociation)
Revenus mensuels et annuels
Rapport de performance par agent et par periode


3. Tableau Recapitulatif des Modules

Module	Ce qu'il gere	Priorite
Biens Immobiliers	Appartements, villas, terrains, maisons	Critique
Proprietaires	Mandats, coordonnees, biens possedes	Critique
Clients	Acheteurs, locataires, criteres de recherche	Critique
Visites	Rendez-vous de visite, retours, planification	Haute
Matching	Connecter clients aux biens correspondants	Haute
Offres	Negociation entre acheteur et proprietaire	Haute
Transactions	Dossiers clos, contrats, paiements	Critique
Documents	Tous les papiers legaux et administratifs	Haute
Agents	Performance, assignations, agenda	Moyenne
Finances	Commissions, revenus, rapports	Moyenne


4. Stack Technique Recommande

Composant	Technologie	Justification
Frontend	Next.js / React	Interface moderne et reactive
Backend	Node.js ou FastAPI (Python)	API REST performante
Base de donnees	PostgreSQL via Supabase	Relationnel + Auth + Stockage inclus
Stockage fichiers	Supabase Storage ou AWS S3	Photos et documents securises
Authentification	Supabase Auth	Roles : Admin, Agent, Lecture seule
Deploiement	Docker sur VPS	Controle total de l'environnement
Automatisation	n8n (optionnel)	Notifications, relances automatiques


5. Roles et Permissions Utilisateurs

Role	Acces
Administrateur	Acces complet : biens, clients, agents, finances, parametres
Agent Immobilier	Biens, clients, visites, offres, transactions (ses dossiers)
Assistante / Secretaire	Consultation et saisie uniquement, sans acces financier
Lecture seule	Visualisation des biens disponibles uniquement


6. Prochaines Etapes
Pour lancer le developpement du systeme, voici les etapes recommandees :

Phase 1 : Schema de base de donnees complet (tables, relations, contraintes)
Phase 2 : Backend API - modules Biens, Proprietaires, Clients
Phase 3 : Interface web - tableau de bord, fiches biens, formulaires
Phase 4 : Modules Visites, Offres et Transactions
Phase 5 : Gestion documentaire et stockage fichiers
Phase 6 : Reporting financier et tableau de bord analytique
Phase 7 : Recette, tests utilisateurs et mise en production

Ce document servira de reference tout au long du projet. Chaque module peut etre developpe et livre independamment dans une logique agile.