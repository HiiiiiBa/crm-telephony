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

## 🔒 Variables d'environnement

- **Backend** : voir `backend/.env.example`
- **Frontend** : voir `frontend/.env.example` (si nécessaire)

---

## 🛠️ Stack Technique

- **Frontend** : React, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Lucide Icons
- **Backend** : Node.js, Express, TypeScript, Prisma ORM, SQLite (Dev) / PostgreSQL (Prod), JWT, Bcrypt
