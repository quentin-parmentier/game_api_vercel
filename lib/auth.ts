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
    const xApiKey = req.headers["x-api-key"];
    if (typeof xApiKey === "string") {
      key = xApiKey.trim();
    }
  }

  if (!key) {
    return { valid: false, error: "Missing API key" };
  }

  const valid = await validateApiKey(key);
  if (!valid) {
    return { valid: false, error: "Invalid API key" };
  }

  return { valid: true };
}
