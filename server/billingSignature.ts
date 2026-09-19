import { createHmac, timingSafeEqual } from "node:crypto";

export function createBillingSignature(rawBody: string, secret: string) {
  return `sha256=${createHmac("sha256", secret).update(rawBody, "utf8").digest("hex")}`;
}

export function verifyBillingSignature(rawBody: string, secret: string, receivedHeader: string) {
  const expected = Buffer.from(createBillingSignature(rawBody, secret), "utf8");
  const received = Buffer.from(receivedHeader, "utf8");
  return expected.length === received.length && timingSafeEqual(expected, received);
}
