import type { NextApiRequest } from "next";
import { validateApiKey } from "./db";

export async function authenticate(
  req: NextApiRequest
): Promise<{ valid: boolean; error?: string }> {
  let key: string | undefined;

  const authHeader = req.headers["authorization"];
  if (authHeader && authHeader.startsWith("Bearer ")) {
    key = authHeader.slice(7).trim();
  }

  if (!key) {
    const apiKeyHeader = req.headers["x-api-key"];
    if (typeof apiKeyHeader === "string") {
      key = apiKeyHeader.trim();
    }
  }

  if (!key) {
    return {
      valid: false,
      error: "Missing API key. Use Authorization: Bearer <key> or x-api-key header.",
    };
  }

  const valid = await validateApiKey(key);
  if (!valid) {
    return { valid: false, error: "Invalid API key." };
  }

  return { valid: true };
}
