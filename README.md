# game_api_vercel

API REST de mots français par catégorie, avec authentification par clé d'API. Portage du projet [game_api](https://github.com/quentin-parmentier/game_api) pour Vercel + Neon PostgreSQL.

## Stack technique

- **Framework** : Next.js 14 (Pages Router)
- **Runtime** : Node.js (Vercel Serverless Functions)
- **Base de données** : Neon PostgreSQL (`@neondatabase/serverless`)
- **Langage** : TypeScript
- **Requêtes SQL** : directes, sans ORM

## Structure du projet

```
game_api_vercel/
├── pages/
│   └── api/
│       ├── health.ts                    → GET /api/health
│       ├── keys.ts                      → POST /api/keys
│       ├── word.ts                      → GET /api/word
│       ├── words.ts                     → GET /api/words?count=N
│       └── words/
│           └── category/
│               └── [name].ts            → GET /api/words/category/:name?count=N
├── lib/
│   ├── db.ts                            → connexion Neon + helpers SQL
│   └── auth.ts                          → middleware d'authentification
├── data/
│   └── french-words.ts                  → 1000 mots en 10 catégories
├── scripts/
│   └── seed.ts                          → script pour peupler la BDD
├── package.json
├── tsconfig.json
├── next.config.js
└── README.md
```

## Variables d'environnement

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connection string Neon PostgreSQL (ex: `postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require`) |
| `ADMIN_SECRET` | Secret pour protéger `POST /api/keys` |

## Déploiement sur Vercel

### 1. Créer un projet Neon

1. Aller sur [neon.tech](https://neon.tech) et créer un compte gratuit
2. Créer un nouveau projet
3. Copier la **Connection string** (format `postgresql://...`)

### 2. Créer un projet Vercel

1. Aller sur [vercel.com](https://vercel.com) et se connecter
2. Cliquer sur **Add New → Project**
3. Importer le repo GitHub `game_api_vercel`
4. Dans **Environment Variables**, ajouter :
   - `DATABASE_URL` → votre connection string Neon
   - `ADMIN_SECRET` → une chaîne secrète (ex: générez avec `openssl rand -hex 32`)
5. Cliquer sur **Deploy**

### 3. Créer la BDD et seeder les données

Une fois les variables d'environnement configurées, exécuter localement :

```bash
# Installer les dépendances
npm install

# Peupler la base de données (crée les tables et insère les 1000 mots)
npm run seed
```

> **Note** : Le script de seed utilise la variable `DATABASE_URL` de votre `.env.local`. Les tables sont aussi créées automatiquement au premier appel API.

### 4. Générer une clé d'API

```bash
curl -X POST https://votre-projet.vercel.app/api/keys \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: VOTRE_ADMIN_SECRET" \
  -d '{"name": "mon-client"}'
```

Réponse :
```json
{
  "key": "abc123...",
  "name": "mon-client"
}
```

## Référence de l'API

### `GET /api/health`

Health check, pas d'authentification requise.

```bash
curl https://votre-projet.vercel.app/api/health
```

Réponse :
```json
{ "status": "ok" }
```

---

### `POST /api/keys`

Créer une nouvelle clé d'API. Protégé par le header `x-admin-secret`.

```bash
curl -X POST https://votre-projet.vercel.app/api/keys \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: VOTRE_ADMIN_SECRET" \
  -d '{"name": "mon-client"}'
```

Réponse (201) :
```json
{
  "key": "abc123def456...",
  "name": "mon-client"
}
```

---

### `GET /api/word`

Retourne un mot français aléatoire avec sa catégorie. **Auth requise.**

```bash
curl https://votre-projet.vercel.app/api/word \
  -H "Authorization: Bearer VOTRE_CLE_API"
```

Réponse :
```json
{
  "word": "guitare",
  "category": "Musique et arts"
}
```

---

### `GET /api/words?count=N`

Retourne N mots aléatoires (défaut : 10, max : 100). **Auth requise.**

```bash
curl "https://votre-projet.vercel.app/api/words?count=5" \
  -H "x-api-key: VOTRE_CLE_API"
```

Réponse :
```json
{
  "count": 5,
  "words": [
    { "word": "chat", "category": "Animaux" },
    { "word": "piano", "category": "Musique et arts" }
  ]
}
```

---

### `GET /api/words/category/[name]?count=N`

Retourne N mots aléatoires d'une catégorie spécifique (lookup insensible à la casse). Retourne 404 si la catégorie est inconnue. **Auth requise.**

```bash
curl "https://votre-projet.vercel.app/api/words/category/Animaux?count=5" \
  -H "Authorization: Bearer VOTRE_CLE_API"
```

Réponse :
```json
{
  "count": 5,
  "words": [
    { "word": "chien", "category": "Animaux" },
    { "word": "chat", "category": "Animaux" }
  ]
}
```

Réponse 404 si catégorie inconnue :
```json
{ "error": "Category 'inconnu' not found" }
```

## Catégories disponibles

- Animaux
- Cuisine et gastronomie
- Sports et loisirs
- Vêtements et mode
- Nature et environnement
- Musique et arts
- Corps humain et santé
- Métiers et professions
- Technologie et informatique
- Voyage et géographie

## Authentification

Tous les endpoints `/api/*` sauf `GET /api/health` et `POST /api/keys` nécessitent une clé d'API via :

- Header `Authorization: Bearer <key>`
- OU header `x-api-key: <key>`

## Développement local

```bash
# Cloner le repo
git clone https://github.com/quentin-parmentier/game_api_vercel.git
cd game_api_vercel

# Installer les dépendances
npm install

# Créer le fichier .env.local
cat > .env.local << EOF
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
ADMIN_SECRET=votre-secret-local
EOF

# Peupler la base de données
npm run seed

# Lancer le serveur de développement
npm run dev
```

L'API sera disponible sur `http://localhost:3000`.