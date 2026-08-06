# ProdFlow

Application de gestion de stock, commandes et magasin.

Stack :

- **Frontend** — Angular 18 (`frontend/`)
- **Backend** — Node.js / Express / MongoDB (`backand/`)

## Fonctionnalités

- Authentification JWT et gestion des rôles
- Produits, stock et alertes de stock bas
- Bons de commande (création, vérification, confirmation, réception, expédition)
- Fournisseurs et catégories
- Société / infos société pour les bons de commande (PDF)
- Tableau de bord, recherche et rapports
- Impression / téléchargement PDF des commandes

### Rôles

| Rôle | Label |
|------|--------|
| `super_admin` | Super Administrateur |
| `admin_magasin` | Responsable Magasin |
| `responsable_reception` | Responsable Réception |
| `expedition_magasin` | Magasin Expédition |

## Prérequis

- [Node.js](https://nodejs.org/) (LTS recommandé)
- [MongoDB](https://www.mongodb.com/) (local ou distant)
- npm

## Installation

### 1. Backend

```bash
cd backand
npm install
``

Démarrez l’API :

```bash
npm run dev
# ou
npm start
```

L’API écoute sur `http://localhost:3000` (préfixe `/api`).

### 2. Frontend

Dans un autre terminal :

```bash
cd frontend
npm install
npm start
```

L’application Angular est disponible sur `http://localhost:4200`.  
Le proxy (`proxy.conf.json`) redirige `/api` vers le backend sur le port `3000`.

## Structure du projet

```
ProdFlow/
├── backand/          # API Express
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── index.js
└── frontend/         # Application Angular
    └── src/app/
        ├── guards/
        ├── pages/
        └── services/
```

## Scripts utiles

| Emplacement | Commande | Description |
|-------------|----------|-------------|
| `backand/` | `npm start` | Lance le serveur |
| `backand/` | `npm run dev` | Lance avec rechargement (`node --watch`) |
| `frontend/` | `npm start` | Serveur de développement Angular |
| `frontend/` | `npm run build` | Build de production |

## API (aperçu)

Routes principales sous `/api` :

- `POST /auth/login` — connexion
- `/products`, `/orders`, `/suppliers`, `/categories`
- `/company`, `/companies` — infos société
- `/dashboard`, `/reports/*`
- `/orders/:id/print`, `/orders/:id/download` — PDF
- `GET /health` — santé du service


