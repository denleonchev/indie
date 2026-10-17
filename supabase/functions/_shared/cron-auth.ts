import { timingSafeEqual } from "@std/crypto/timing-safe-equal";

const encoder = new TextEncoder();

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(
    await crypto.subtle.digest("SHA-256", encoder.encode(value)),
  );
}

export async function isCronCall(req: Request): Promise<boolean> {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) {
    console.error("CRON_SECRET is not set");
    return false;
  }
  const given = req.headers.get("x-cron-secret");
  if (!given) return false;

  const [a, b] = await Promise.all([sha256(expected), sha256(given)]);
  return timingSafeEqual(a, b);
}
