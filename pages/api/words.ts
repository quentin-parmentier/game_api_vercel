import type { NextApiRequest, NextApiResponse } from "next";
import { authenticate } from "../../lib/auth";
import { getRandomWords } from "../../lib/db";
import { setCorsHeaders, parseCount } from "../../lib/utils";

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

  const count = parseCount(req.query.count);

  try {
    const words = await getRandomWords(count);
    return res.status(200).json({ count: words.length, words });
  } catch (err) {
    console.error("Error fetching random words:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
