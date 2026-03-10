import type { NextApiRequest, NextApiResponse } from "next";
import { authenticate } from "../../lib/auth";
import { getRandomWord, initDatabase } from "../../lib/db";

function setCorsHeaders(res: NextApiResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key"
  );
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

  try {
    await initDatabase();
    const result = await getRandomWord();
    if (!result) {
      return res.status(404).json({ error: "No words found in database" });
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
