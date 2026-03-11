import type { NextApiRequest, NextApiResponse } from "next";
import { authenticateBff } from "../../../lib/bff-auth";
import { getRandomWord } from "../../../lib/db";
import { setCorsHeaders } from "../../../lib/utils";

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

  const auth = authenticateBff(req);
  if (!auth.valid) {
    return res.status(401).json({ error: auth.error });
  }

  try {
    const result = await getRandomWord();
    return res.status(200).json(result);
  } catch (err) {
    console.error("Error fetching random word (BFF):", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
