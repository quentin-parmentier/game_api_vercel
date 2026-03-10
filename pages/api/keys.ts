import type { NextApiRequest, NextApiResponse } from "next";
import { createApiKey } from "../../lib/db";
import { setCorsHeaders } from "../../lib/utils";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const adminSecret = req.headers["x-admin-secret"];
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const name: string =
    typeof req.body?.name === "string" ? req.body.name : "unnamed";

  try {
    const result = await createApiKey(name);
    return res.status(201).json(result);
  } catch (err) {
    console.error("Error creating API key:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
