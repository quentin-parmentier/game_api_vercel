import { neon } from "@neondatabase/serverless";
import crypto from "crypto";
import type { frenchWords as FrenchWordsType } from "../data/french-words";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

const sql = neon(process.env.DATABASE_URL);

let tablesReady: Promise<void> | null = null;

function ensureTables(): Promise<void> {
  if (!tablesReady) {
    tablesReady = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS api_keys (
          id SERIAL PRIMARY KEY,
          key TEXT UNIQUE NOT NULL,
          name TEXT,
          created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW())::BIGINT
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name TEXT UNIQUE NOT NULL
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS words (
          id SERIAL PRIMARY KEY,
          word TEXT NOT NULL,
          category_id INTEGER NOT NULL REFERENCES categories(id)
        )
      `;
      await sql`
        CREATE UNIQUE INDEX IF NOT EXISTS words_word_category_idx
        ON words (word, category_id)
      `;
    })();
  }
  return tablesReady;
}

export async function validateApiKey(key: string): Promise<boolean> {
  const rows = await sql`SELECT id FROM api_keys WHERE key = ${key}`;
  return rows.length > 0;
}

export async function createApiKey(
  name: string
): Promise<{ key: string; name: string }> {
  const key = crypto.randomBytes(32).toString("hex");
  await sql`INSERT INTO api_keys (key, name) VALUES (${key}, ${name})`;
  return { key, name };
}

export async function getRandomWord(): Promise<{
  word: string;
  category: string;
}> {
  const rows = await sql`
    SELECT w.word, c.name AS category
    FROM words w
    JOIN categories c ON c.id = w.category_id
    ORDER BY RANDOM()
    LIMIT 1
  `;
  return rows[0] as { word: string; category: string };
}

export async function getRandomWords(
  count: number
): Promise<Array<{ word: string; category: string }>> {
  const rows = await sql`
    SELECT w.word, c.name AS category
    FROM words w
    JOIN categories c ON c.id = w.category_id
    ORDER BY RANDOM()
    LIMIT ${count}
  `;
  return rows as Array<{ word: string; category: string }>;
}

export async function getWordsByCategory(
  category: string,
  count: number
): Promise<Array<{ word: string; category: string }> | null> {
  const cats = await sql`
    SELECT id, name FROM categories WHERE LOWER(name) = LOWER(${category})
  `;
  if (cats.length === 0) return null;
  const cat = cats[0] as { id: number; name: string };
  const rows = await sql`
    SELECT w.word, c.name AS category
    FROM words w
    JOIN categories c ON c.id = w.category_id
    WHERE w.category_id = ${cat.id}
    ORDER BY RANDOM()
    LIMIT ${count}
  `;
  return rows as Array<{ word: string; category: string }>;
}

export async function listCategories(): Promise<string[]> {
  const rows = await sql`SELECT name FROM categories ORDER BY name`;
  return (rows as Array<{ name: string }>).map((r) => r.name);
}

export async function seedDatabase(
  data: typeof FrenchWordsType
): Promise<void> {
  await ensureTables();

  // 1. Insert all categories in one batch
  const categoryNames = data.map((item) => item.category);
  await sql`
    INSERT INTO categories (name)
    SELECT unnest(${categoryNames}::text[])
    ON CONFLICT (name) DO NOTHING
  `;

  // 2. Fetch all category IDs in one query
  const cats = await sql`
    SELECT id, name FROM categories WHERE name = ANY(${categoryNames}::text[])
  `;
  const categoryMap = new Map(
    (cats as Array<{ id: number; name: string }>).map((c) => [c.name, c.id])
  );

  // 3. Build all word rows and insert in one batch
  const wordRows = data.flatMap((item) => {
    const category_id = categoryMap.get(item.category);
    if (category_id === undefined) return [];
    return item.words.map((word) => ({ word, category_id }));
  });
  const words = wordRows.map((r) => r.word);
  const categoryIds = wordRows.map((r) => r.category_id);

  await sql`
    INSERT INTO words (word, category_id)
    SELECT unnest(${words}::text[]), unnest(${categoryIds}::int[])
    ON CONFLICT (word, category_id) DO NOTHING
  `;
}
