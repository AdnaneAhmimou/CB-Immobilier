# CB Immobilier — Full System Design (Option B)
**Date:** 2026-05-08

## Scope
Complete the real estate management system with all critical transaction-lifecycle modules and a full frontend redesign.

## Backend Additions

### New: Transaction model (Prisma)
```
Transaction { id, type (Vente/Location), prixFinal, commission (auto-calculated), dateSignature?, bienId, clientId, agentId?, documents[], createdAt }
```

### New endpoints
- `GET/POST /api/visites` — list all visits, create visit (bienId, clientId, agentId, date, retour)
- `PATCH /api/visites/:id` — record outcome (retour field)
- `GET/POST /api/offres` — list all offers, create offer (bienId, clientId, montant, statut)
- `PATCH /api/offres/:id` — update offer status (acceptée / refusée / contre-offre)
- `GET/POST /api/transactions` — list closed deals, create transaction
- `GET /api/stats` — dashboard stats (counts + recent visites)

### Existing gaps fixed
- Bien: add `DELETE /api/biens/:id` and `PATCH /api/biens/:id`
- Client: add `DELETE`, `PATCH`
- Proprietaire: add `DELETE`, `PATCH`

## Frontend Redesign

### Design system
- Lucide React for all icons (no more emojis)
- `index.css` tokens unchanged (already match design.md)
- New reusable components: `StatusBadge`, `Modal`, `PageHeader`, `EmptyState`, `StatCard`
- Sidebar: icons + labels, navy left-border active indicator, agent info at bottom

### Pages
| Page | Key changes |
|------|-------------|
| Login | Two-panel kept, polish decorative elements |
| Dashboard | 5 stat cards (+ Visites count), recent activity list |
| Biens | Photo-placeholder cards, status + transaction type badges, slide-in modal form |
| Clients | Table with colored pipeline badges, search bar, modal form |
| Proprietaires | Table with bien count, commission, modal form |
| Visites (new) | Table: date, bien, client, agent, retour badge; create + update outcome |
| Offres (new) | Table: bien, client, montant, statut pipeline; create + accept/refuse |
| Transactions (new) | Table: type, bien, client, prix final, commission auto-calc, date |

## Architecture
- Frontend → `http://localhost:3000/api/*` (unchanged)
- Auth: JWT Bearer token in localStorage (unchanged)
- File uploads: multer → `/uploads` (unchanged, future work for bien photos)
- DB: SQLite via Prisma (unchanged)

## Out of Scope (this session)
- Agent performance reports
- Financial analytics / charts
- Document upload UI
- Map view
- Mobile responsive polish
