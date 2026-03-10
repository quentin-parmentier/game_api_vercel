import type { NextApiRequest, NextApiResponse } from "next";
import { authenticate } from "../../../../lib/auth";
import { getWordsByCategory, initDatabase } from "../../../../lib/db";

function setCorsHeaders(res: NextApiResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key"
  );
}

function parseCount(value: string | string[] | undefined): number {
  const n = parseInt(String(value ?? "10"), 10);
  if (isNaN(n) || n < 1) return 10;
  return Math.min(n, 100);
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCorsHeaders(res);
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const auth = await authenticate(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error });
  }

  const { name } = req.query;
  const categoryName = Array.isArray(name) ? name[0] : name ?? "";
  const count = parseCount(req.query.count);

  try {
    await initDatabase();
    const result = await getWordsByCategory(categoryName, count);
    if (!result.found) {
      return res.status(404).json({ error: `Category '${categoryName}' not found` });
    }
    return res.status(200).json({ count: result.words.length, words: result.words });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
