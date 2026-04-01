# INSIDE - OpenStack Skills Gap Analysis Platform

Plateforme interne d'evaluation des competences OpenStack. Permet aux candidats de passer un audit de competences sur 12 axes techniques et genere un rapport detaille avec gap analysis et recommandations de formation.

## Stack Technique

- **Framework**: Next.js 16.2 (App Router)
- **UI**: Tailwind CSS 4 + shadcn/ui + Recharts
- **ORM**: Drizzle ORM
- **BDD**: PostgreSQL 17
- **Auth**: Auth.js v5 (Google SSO)
- **PDF**: @react-pdf/renderer
- **Container**: Docker + Docker Compose

## Quick Start (Docker)

```bash
# 1. Cloner le repo
git clone https://github.com/Xta-zie/inside-qualification.git
cd inside-qualification

# 2. Configurer les variables d'environnement
cp .env.example .env
# Editer .env avec vos credentials Google OAuth

# 3. Lancer
docker-compose up -d

# 4. Initialiser la base de donnees
docker-compose exec app npm run db:push
docker-compose exec app npm run db:seed
```

L'application est accessible sur http://localhost:3000

## Developpement Local

```bash
# Prerequisites: Node.js 22+, PostgreSQL 17

# 1. Installer les dependances
npm install

# 2. Lancer PostgreSQL (ou via Docker)
docker-compose up db -d

# 3. Configurer .env
cp .env.example .env

# 4. Creer les tables
npm run db:push

# 5. Peupler la base
npm run db:seed

# 6. Lancer le serveur de dev
npm run dev
```

## Variables d'environnement

| Variable | Description | Requis |
|---|---|---|
| `DATABASE_URL` | URL de connexion PostgreSQL | Oui |
| `AUTH_SECRET` | Secret pour Auth.js (`openssl rand -base64 32`) | Oui |
| `AUTH_URL` | URL de l'application | Oui |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | Oui |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | Oui |
| `SMTP_HOST` | Serveur SMTP | Non |
| `SMTP_PORT` | Port SMTP | Non |
| `SMTP_USER` | Utilisateur SMTP | Non |
| `SMTP_PASS` | Mot de passe SMTP | Non |

## Configuration Google OAuth

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Creer un projet ou en selectionner un existant
3. Activer l'API Google+ / People API
4. Creer des identifiants OAuth 2.0 (Application Web)
5. Ajouter les URI de redirection autorises :
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://votre-domaine.com/api/auth/callback/google` (prod)
6. Copier le Client ID et Client Secret dans `.env`

## Structure du Projet

```
src/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── assessment/                 # Parcours candidat (3 etapes)
│   ├── dashboard/                  # Vue manager (resultats + analytics)
│   ├── admin/                      # Administration (questions, roles, formations)
│   ├── auth/signin/                # Page de connexion
│   └── api/                        # API Routes
├── components/
│   ├── ui/                         # shadcn/ui (Button, Card, Table, Dialog...)
│   ├── assessment/                 # StepRole, StepQuiz, StepReport
│   ├── charts/                     # RadarChart, GapBarChart, ScoreGauge, Heatmap
│   ├── dashboard/                  # Sidebar
│   └── admin/                      # AdminSidebar
├── db/
│   ├── schema.ts                   # Drizzle schema (7 tables)
│   ├── index.ts                    # Connection pool
│   └── seed.ts                     # Donnees initiales
├── lib/
│   ├── auth.ts                     # Auth.js config
│   ├── scoring.ts                  # Logique de scoring/gap analysis
│   ├── pdf.ts                      # Template PDF
│   ├── email.ts                    # Service email
│   └── utils.ts                    # cn() utility
└── types/index.ts                  # Types TypeScript
```

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de developpement (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Lancer en production |
| `npm run db:push` | Appliquer le schema a la BDD |
| `npm run db:seed` | Peupler la BDD avec les donnees initiales |
| `npm run db:generate` | Generer les migrations |
| `npm run db:studio` | Ouvrir Drizzle Studio |

## Roles Utilisateurs

| Role | Acces |
|---|---|
| `user` | Passer une evaluation, voir ses resultats |
| `manager` | Dashboard + consultation de tous les resultats |
| `admin` | Tout + gestion des questions, baselines, formations, utilisateurs |
