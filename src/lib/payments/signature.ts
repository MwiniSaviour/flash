import { createHmac, timingSafeEqual } from "node:crypto";

/** HMAC-SHA512 over the raw webhook body, compared in constant time. */
export function verifyWebhookSignature(
  raw: ArrayBuffer | Buffer,
  signature: string | undefined,
  key: string,
): boolean {
  if (!key || !signature) return false;

  const expected = createHmac("sha512", key)
    .update(Buffer.isBuffer(raw) ? raw : Buffer.from(raw))
    .digest("hex");

  const provided = Buffer.from(signature.toLowerCase());
  const wanted = Buffer.from(expected);
  return provided.length === wanted.length && timingSafeEqual(provided, wanted);
}
