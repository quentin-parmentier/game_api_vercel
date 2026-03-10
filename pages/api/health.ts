import type { NextApiRequest, NextApiResponse } from "next";
import { setCorsHeaders } from "../../lib/utils";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  setCorsHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  return res.status(200).json({ status: "ok" });
}
