import { randomBytes } from "crypto";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

export async function initDatabase(): Promise<void> {
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
      category_id INTEGER NOT NULL REFERENCES categories(id),
      UNIQUE (word, category_id)
    )
  `;
}

export async function validateApiKey(key: string): Promise<boolean> {
  const rows = await sql`SELECT id FROM api_keys WHERE key = ${key}`;
  return rows.length > 0;
}

export async function createApiKey(
  name: string
): Promise<{ key: string; name: string }> {
  const key = randomBytes(32).toString("hex");
  await sql`INSERT INTO api_keys (key, name) VALUES (${key}, ${name})`;
  return { key, name };
}

export async function getRandomWord(): Promise<{
  word: string;
  category: string;
} | null> {
  const rows = await sql`
    SELECT w.word, c.name AS category
    FROM words w
    JOIN categories c ON w.category_id = c.id
    ORDER BY RANDOM()
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  return { word: rows[0].word as string, category: rows[0].category as string };
}

export async function getRandomWords(
  count: number
): Promise<Array<{ word: string; category: string }>> {
  const rows = await sql`
    SELECT w.word, c.name AS category
    FROM words w
    JOIN categories c ON w.category_id = c.id
    ORDER BY RANDOM()
    LIMIT ${count}
  `;
  return rows.map((r) => ({
    word: r.word as string,
    category: r.category as string,
  }));
}

export async function getWordsByCategory(
  category: string,
  count: number
): Promise<{ words: Array<{ word: string; category: string }>; found: boolean }> {
  const cats = await sql`
    SELECT id, name FROM categories WHERE LOWER(name) = LOWER(${category})
  `;
  if (cats.length === 0) return { words: [], found: false };

  const categoryName = cats[0].name as string;
  const categoryId = cats[0].id as number;

  const rows = await sql`
    SELECT w.word, ${categoryName} AS category
    FROM words w
    WHERE w.category_id = ${categoryId}
    ORDER BY RANDOM()
    LIMIT ${count}
  `;
  return {
    words: rows.map((r) => ({
      word: r.word as string,
      category: r.category as string,
    })),
    found: true,
  };
}

export async function listCategories(): Promise<string[]> {
  const rows = await sql`SELECT name FROM categories ORDER BY name`;
  return rows.map((r) => r.name as string);
}

export async function seedDatabase(
  data: Array<{ category: string; words: string[] }>
): Promise<void> {
  await initDatabase();

  for (const { category, words } of data) {
    await sql`
      INSERT INTO categories (name) VALUES (${category})
      ON CONFLICT (name) DO NOTHING
    `;
    const cats = await sql`SELECT id FROM categories WHERE name = ${category}`;
    const categoryId = cats[0].id as number;

    for (const word of words) {
      await sql`
        INSERT INTO words (word, category_id) VALUES (${word}, ${categoryId})
        ON CONFLICT DO NOTHING
      `;
    }
  }
}
