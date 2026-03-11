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
│       ├── seed.ts                      → POST /api/seed
│       ├── word.ts                      → GET /api/word
│       ├── words.ts                     → GET /api/words?count=N
│       ├── words/
│       │   └── category/
│       │       └── [name].ts            → GET /api/words/category/:name?count=N
│       └── bff/
│           ├── word.ts                  → GET /api/bff/word
│           ├── words.ts                 → GET /api/bff/words?count=N
│           ├── categories.ts            → GET /api/bff/categories
│           └── words/
│               └── category/
│                   └── [name].ts        → GET /api/bff/words/category/:name?count=N
├── lib/
│   ├── db.ts                            → connexion Neon + helpers SQL
│   ├── auth.ts                          → middleware d'authentification (API key)
│   ├── bff-auth.ts                      → middleware d'authentification BFF (Flutter)
│   └── utils.ts                         → helpers CORS + parsing
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
| `FLUTTER_APP_SECRET` | Secret partagé entre l'app Flutter et les routes BFF (protège `/api/bff/*`) |

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

### 3. Seeder la base de données

Une fois le projet déployé sur Vercel, vous pouvez seeder la base de données directement depuis l'API (sans exécuter de script en local) :

```bash
curl -X POST https://votre-projet.vercel.app/api/seed \
  -H "x-admin-secret: VOTRE_ADMIN_SECRET"
```

Réponse :
```json
{ "message": "Seeded 10 categories and 1000 words." }
```

> **Note** : L'endpoint est idempotent — il peut être appelé plusieurs fois sans dupliquer les données. Les tables sont aussi créées automatiquement au premier appel API.

Vous pouvez aussi seeder depuis votre machine locale :

```bash
# Installer les dépendances
npm install

# Peupler la base de données (crée les tables et insère les 1000 mots)
npm run seed
```

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

### `POST /api/seed`

Seeder la base de données avec les 1000 mots et 10 catégories. Protégé par le header `x-admin-secret`. Idempotent : peut être appelé plusieurs fois sans dupliquer les données.

```bash
curl -X POST https://votre-projet.vercel.app/api/seed \
  -H "x-admin-secret: VOTRE_ADMIN_SECRET"
```

Réponse (200) :
```json
{ "message": "Seeded 10 categories and 1000 words." }
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

## BFF Routes (Flutter App)

### Pourquoi un BFF ?

L'app Flutter **ne doit jamais** contenir la clé API (elle serait extractable par décompilation). Les routes `/api/bff/*` servent de proxy sécurisé : le Flutter s'authentifie avec un secret distinct (`FLUTTER_APP_SECRET`), le serveur appelle directement les fonctions de base de données en interne, sans exposer la vraie clé API.

### Authentification BFF

Toutes les routes BFF nécessitent le header :

```
x-flutter-secret: <FLUTTER_APP_SECRET>
```

Configurer la variable d'environnement `FLUTTER_APP_SECRET` sur Vercel avec une valeur secrète (ex: `openssl rand -hex 32`).

---

### `GET /api/bff/word`

Retourne un mot aléatoire avec sa catégorie.

```bash
curl https://votre-projet.vercel.app/api/bff/word \
  -H "x-flutter-secret: VOTRE_FLUTTER_APP_SECRET"
```

Réponse :
```json
{ "word": "guitare", "category": "Musique et arts" }
```

---

### `GET /api/bff/words?count=N`

Retourne N mots aléatoires (défaut : 10, max : 100).

```bash
curl "https://votre-projet.vercel.app/api/bff/words?count=5" \
  -H "x-flutter-secret: VOTRE_FLUTTER_APP_SECRET"
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

### `GET /api/bff/words/category/:name?count=N`

Retourne N mots d'une catégorie spécifique (défaut : 10, max : 100). Retourne 404 si la catégorie est inconnue.

```bash
curl "https://votre-projet.vercel.app/api/bff/words/category/Animaux?count=5" \
  -H "x-flutter-secret: VOTRE_FLUTTER_APP_SECRET"
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

---

### `GET /api/bff/categories`

Retourne la liste des catégories disponibles.

```bash
curl https://votre-projet.vercel.app/api/bff/categories \
  -H "x-flutter-secret: VOTRE_FLUTTER_APP_SECRET"
```

Réponse :
```json
{ "categories": ["Animaux", "Cuisine et gastronomie", "..."] }
```

---

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
FLUTTER_APP_SECRET=votre-flutter-secret-local
EOF

# Peupler la base de données
npm run seed

# Lancer le serveur de développement
npm run dev
```

L'API sera disponible sur `http://localhost:3000`.