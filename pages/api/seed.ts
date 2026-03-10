import type { NextApiRequest, NextApiResponse } from "next";
import { frenchWords } from "../../data/french-words";
import { seedDatabase } from "../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, x-admin-secret"
  );

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

  try {
    await seedDatabase(frenchWords);
    return res
      .status(200)
      .json({ message: "Seeded 10 categories and 1000 words." });
  } catch (err) {
    console.error("Error seeding database:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
