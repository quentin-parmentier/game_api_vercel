import type { NextApiRequest, NextApiResponse } from "next";
import { authenticate } from "../../../../lib/auth";
import { getWordsByCategory } from "../../../../lib/db";
import { setCorsHeaders, parseCount } from "../../../../lib/utils";

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

  const name =
    typeof req.query.name === "string" ? req.query.name : undefined;

  if (!name) {
    return res.status(400).json({ error: "Category name is required" });
  }

  const count = parseCount(req.query.count);

  try {
    const words = await getWordsByCategory(name, count);
    if (words === null) {
      return res.status(404).json({ error: `Category '${name}' not found` });
    }
    return res.status(200).json({ count: words.length, words });
  } catch (err) {
    console.error("Error fetching words by category:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
