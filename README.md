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

``
cd backand
npm install
``

Démarrez l’API :

```
npm run dev
# ou
npm start
```



## Structure du projet

```
ProdFlow/
├── backand/         
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── services/
│   └── index.js
└── frontend/        
    └── src/app/
        ├── guards/
        ├── pages/
        └── services/
```



## API (aperçu)

Routes principales sous `/api` :

- `POST /auth/login` — connexion
- `/products`, `/orders`, `/suppliers`, `/categories`
- `/company`, `/companies` — infos société
- `/dashboard`, `/reports/*`
- `/orders/:id/print`, `/orders/:id/download` — PDF
- `GET /health` — santé du service


