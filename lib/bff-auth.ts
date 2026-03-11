import crypto from "crypto";
import type { NextApiRequest } from "next";

export function authenticateBff(
  req: NextApiRequest
): { valid: boolean; error?: string } {
  const configuredSecret = process.env.FLUTTER_APP_SECRET;

  if (!configuredSecret) {
    return { valid: false, error: "BFF secret not configured" };
  }

  const secret = req.headers["x-flutter-secret"];

  if (!secret || typeof secret !== "string") {
    return { valid: false, error: "Missing x-flutter-secret header" };
  }

  const a = Buffer.from(secret);
  const b = Buffer.from(configuredSecret);

  if (
    a.length !== b.length ||
    !crypto.timingSafeEqual(a, b)
  ) {
    return { valid: false, error: "Invalid Flutter secret" };
  }

  return { valid: true };
}
