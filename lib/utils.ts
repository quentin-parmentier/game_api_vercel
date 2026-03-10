import type { NextApiResponse } from "next";

export function setCorsHeaders(res: NextApiResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-api-key"
  );
}

export function parseCount(
  value: unknown,
  defaultVal = 10,
  max = 100
): number {
  const n = parseInt(String(value), 10);
  if (isNaN(n) || n < 1) return defaultVal;
  return Math.min(n, max);
}
