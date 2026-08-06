# CRM Cloud & Téléphonie d'Entreprise 📞💼

Plateforme centralisée de gestion de la relation client (CRM) et téléphonie d'entreprise cloud inspirée de Ringover.

---

## 🏗️ Architecture du Projet

```text
crm-telephony/
├── backend/          # API REST Node.js, Express, TypeScript, Prisma ORM, SQLite
├── frontend/         # Web App React, TypeScript, Vite, Tailwind CSS, Recharts
└── README.md
```

---

## 🚀 Démarrage Rapide

### Préréquis
- **Node.js** (v18+ recommandé)
- **npm** ou **pnpm**

---

### 1. Initialiser & Lancer le Backend

```bash
cd backend
npm install
npx prisma db push
npm run dev
```

L'API backend sera accessible sur `http://localhost:5000`.  
Vérifiez l'état du serveur via `http://localhost:5000/api/health`.

---

### 2. Initialiser & Lancer le Frontend

```bash
cd frontend
npm install
npm run dev
```

L'application frontend sera accessible sur `http://localhost:5173`.

---

### 3. Données de démonstration (seed)

```bash
cd backend
npx prisma db seed
```

Comptes créés automatiquement :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `admin@crm-telephony.local` | `AdminPassword123!` |
| Manager | `manager@crm-telephony.local` | `ManagerPassword123!` |
| Agent | `agent@crm-telephony.local` | `AgentPassword123!` |

> **Note :** le seed **réinitialise** toutes les données (contacts, deals, utilisateurs précédents).

Si la connexion échoue avec « Identifiants incorrects », videz le token stocké dans le navigateur (F12 → Application → Local Storage → supprimer `crm_token`) puis reconnectez-vous.

---

## 🔒 Variables d'environnement

- **Backend** : voir `backend/.env.example`
- **Frontend** : voir `frontend/.env.example` (si nécessaire)

---

## 🛠️ Stack Technique

- **Frontend** : React, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Lucide Icons
- **Backend** : Node.js, Express, TypeScript, Prisma ORM, SQLite (Dev) / PostgreSQL (Prod), JWT, Bcrypt

---

## 📋 Exigences non fonctionnelles (NF-01 à NF-07)

| ID | Exigence | État |
|----|----------|------|
| NF-01 | Mots de passe hachés (bcrypt) | ✅ |
| NF-02 | JWT sur chaque route protégée | ✅ |
| NF-03 | Contrôle de rôle côté serveur | ✅ |
| NF-04 | Performance (centaines d'enregistrements) | ✅ |
| NF-05 | RGPD (minimisation, suppression, export) | ✅ |
| NF-06 | Charte cohérente + focus clavier | ✅ |
| NF-07 | Architecture modulaire (SQLite → PostgreSQL) | ✅ |

---

## ⚡ NF-04 — Performance

L'application utilise la **pagination serveur** (20 résultats par page, max 100) et des **index Prisma** sur les colonnes fréquemment filtrées (`workspaceId`, `createdAt`, `ownerId`, etc.).

### Jeu de données volumineux

```bash
cd backend
npx prisma db seed
npm run prisma:seed:bulk
```

Cela ajoute **500 contacts** et **200 appels** au workspace de démonstration (sans écraser le seed de base).

### Test de performance automatisé

```bash
cd backend
npm run test:perf
```

Le test crée 500 contacts en base isolée et vérifie que les listes paginées répondent en **moins de 500 ms**.

---

## 🔐 NF-05 — Conformité RGPD

### Minimisation des données

- Les mots de passe ne sont **jamais** renvoyés par l'API (`passwordHash` filtré côté serveur).
- Seules les données nécessaires au CRM sont stockées (identité, coordonnées, notes, historique commercial).

### Droit à l'effacement

- `DELETE /api/contacts/:id` — supprime le contact et les affaires associées (cascade Prisma).
- Les appels et SMS conservent l'historique anonymisé (`contactId` mis à null).

### Droit d'accès (export)

- `GET /api/contacts/:id/export` — télécharge un fichier JSON regroupant le contact, ses deals, appels et messages.
- Bouton **Exporter** disponible sur la fiche contact (`/contacts/:id`).

---

## ♿ NF-06 — Accessibilité

- Charte visuelle unifiée (palette slate/indigo, composants réutilisables).
- Styles globaux `:focus-visible` dans `frontend/src/index.css` pour une navigation clavier visible sur liens, boutons et champs.

---

## 🗄️ NF-07 — Migration SQLite → PostgreSQL

L'accès aux données passe exclusivement par **Prisma** ; le code métier n'utilise pas de SQL spécifique à SQLite.

### Étapes de migration

1. Modifier `backend/prisma/schema.prisma` :

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

2. Configurer la variable d'environnement (voir `backend/.env.example`) :

```env
DATABASE_URL="postgresql://user:password@localhost:5432/crm_telephony?schema=public"
```

3. Appliquer le schéma et peupler :

```bash
cd backend
npx prisma migrate dev --name init_postgres
npx prisma db seed
```

4. Relancer le backend — **aucune modification du code métier** n'est requise.

> En développement, SQLite reste le choix par défaut (`file:./dev.db`).
