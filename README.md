# game_api_vercel

API REST de mots français par catégorie, hébergée sur **Vercel** avec **Next.js API Routes** et **Neon PostgreSQL**.

Port de [game_api](https://github.com/quentin-parmentier/game_api) (Bun/SQLite/Render) vers une architecture serverless Vercel.

---

## Stack technique

| Brique | Outil |
|---|---|
| Framework | Next.js 14 (Pages Router) |
| Runtime | Node.js (Vercel) |
| Base de données | Neon PostgreSQL (`@neondatabase/serverless`) |
| Langage | TypeScript |

---

## Structure du projet

```
game_api_vercel/
├── pages/
│   └── api/
│       ├── health.ts                    # GET /api/health
│       ├── keys.ts                      # POST /api/keys
│       ├── word.ts                      # GET /api/word
│       ├── words.ts                     # GET /api/words
│       └── words/
│           └── category/
│               └── [name].ts            # GET /api/words/category/[name]
├── lib/
│   ├── db.ts                            # Connexion Neon + fonctions DB
│   └── auth.ts                          # Authentification par clé d'API
├── data/
│   └── french-words.ts                  # 1000 mots français en 10 catégories
├── scripts/
│   └── seed.ts                          # Script de seed de la BDD
├── package.json
├── tsconfig.json
└── next.config.js
```

---

## Variables d'environnement

| Variable | Description |
|---|---|
| `DATABASE_URL` | Connection string Neon PostgreSQL |
| `ADMIN_SECRET` | Secret pour protéger `POST /api/keys` |

---

## Déploiement sur Vercel + Neon

### 1. Créer une base de données Neon

1. Aller sur [neon.tech](https://neon.tech) et créer un compte gratuit
2. Créer un nouveau projet
3. Copier la **Connection string** (format : `postgresql://user:pass@host/db?sslmode=require`)

### 2. Déployer sur Vercel

1. Aller sur [vercel.com](https://vercel.com) et connecter votre compte GitHub
2. Importer le repo `game_api_vercel`
3. Dans **Settings → Environment Variables**, ajouter :
   - `DATABASE_URL` → votre connection string Neon
   - `ADMIN_SECRET` → une chaîne secrète de votre choix (ex: `openssl rand -hex 32`)
4. Cliquer sur **Deploy**

### 3. Seeder la base de données

Une fois les variables d'environnement configurées :

```bash
# En local avec le fichier .env.local contenant DATABASE_URL
npm run seed
```

Cela insère les 1000 mots français dans la base Neon.

---

## Développement local

### Prérequis

- Node.js 18+
- Une base de données Neon (ou PostgreSQL locale)

### Installation

```bash
npm install
```

### Configuration

Créer un fichier `.env.local` à la racine :

```env
DATABASE_URL=postgresql://user:pass@host/db?sslmode=require
ADMIN_SECRET=mon-secret-admin
```

### Lancer le serveur de développement

```bash
npm run dev
```

L'API est disponible sur `http://localhost:3000`.

### Seeder la base de données

```bash
npm run seed
```

---

## Générer une clé d'API

```bash
curl -X POST https://votre-api.vercel.app/api/keys \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: votre-admin-secret" \
  -d '{"name": "mon-client"}'
```

Réponse :
```json
{
  "key": "abc123xyz...",
  "name": "mon-client"
}
```

---

## Référence des endpoints

### `GET /api/health`

Health check — pas d'authentification requise.

```bash
curl https://votre-api.vercel.app/api/health
```

```json
{ "status": "ok" }
```

---

### `POST /api/keys`

Créer une nouvelle clé d'API. Protégé par `x-admin-secret`.

```bash
curl -X POST https://votre-api.vercel.app/api/keys \
  -H "Content-Type: application/json" \
  -H "x-admin-secret: votre-admin-secret" \
  -d '{"name": "mon-client"}'
```

**Réponse (201) :**
```json
{
  "key": "abc123xyz...",
  "name": "mon-client"
}
```

---

### `GET /api/word`

Retourne un mot français aléatoire avec sa catégorie. **Auth requise.**

```bash
curl https://votre-api.vercel.app/api/word \
  -H "Authorization: Bearer votre-clé"
# ou
curl https://votre-api.vercel.app/api/word \
  -H "x-api-key: votre-clé"
```

**Réponse (200) :**
```json
{
  "word": "guitare",
  "category": "Musique et arts"
}
```

---

### `GET /api/words?count=10`

Retourne N mots aléatoires (défaut 10, max 100). **Auth requise.**

```bash
curl "https://votre-api.vercel.app/api/words?count=5" \
  -H "Authorization: Bearer votre-clé"
```

**Réponse (200) :**
```json
{
  "count": 5,
  "words": [
    { "word": "piano", "category": "Musique et arts" },
    { "word": "renard", "category": "Animaux" },
    ...
  ]
}
```

---

### `GET /api/words/category/[name]?count=10`

Retourne N mots aléatoires d'une catégorie spécifique (lookup insensible à la casse). **Auth requise.**

Retourne 404 si la catégorie est inconnue.

```bash
curl "https://votre-api.vercel.app/api/words/category/Animaux?count=5" \
  -H "Authorization: Bearer votre-clé"
```

**Réponse (200) :**
```json
{
  "count": 5,
  "words": [
    { "word": "chien", "category": "Animaux" },
    { "word": "chat", "category": "Animaux" },
    ...
  ]
}
```

**Réponse (404) :**
```json
{ "error": "Category 'Inconnu' not found" }
```

---

## Authentification

Tous les endpoints `/api/*` sauf `GET /api/health` et `POST /api/keys` nécessitent une clé d'API via :

- Header `Authorization: Bearer <key>`
- OU header `x-api-key: <key>`

---

## Catégories disponibles

1. Adjectifs
2. Alimentation et boissons
3. Animaux
4. Architecture et urbanisme
5. Cinéma et télévision
6. Corps humain et santé
7. Couleurs et formes
8. Cuisine et gastronomie
9. École et éducation
10. Économie et finances
11. Émotions et sentiments
12. Histoire et civilisations
13. Jeux et divertissements
14. Littérature et poésie
15. Maison et mobilier
16. Matériaux
17. Métiers et professions
18. Musique et arts
19. Mythologie et légendes
20. Nature et environnement
21. Personnages fictifs
22. Philosophie et religion
23. Politique et société
24. Sciences et mathématiques
25. Sports et loisirs
26. Technologie et informatique
27. Transports et mobilité
28. Univers et espace
29. Vêtements et mode
30. Voyage et géographie
