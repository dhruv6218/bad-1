import { describe, expect, it } from "vitest";
import { createBillingSignature, verifyBillingSignature } from "./billingSignature";

describe("billing webhook signatures", () => {
  const body = JSON.stringify({ id: "evt_123", type: "subscription.updated" });
  const secret = "test-webhook-secret";

  it("accepts the exact raw-body HMAC signature", () => {
    const signature = createBillingSignature(body, secret);
    expect(verifyBillingSignature(body, secret, signature)).toBe(true);
  });

  it("rejects modified bodies, wrong secrets, and malformed headers", () => {
    const signature = createBillingSignature(body, secret);
    expect(verifyBillingSignature(`${body} `, secret, signature)).toBe(false);
    expect(verifyBillingSignature(body, "wrong-secret", signature)).toBe(false);
    expect(verifyBillingSignature(body, secret, "sha256=invalid")).toBe(false);
  });

  it("produces a stable replay key for the same event body", () => {
    expect(createBillingSignature(body, secret)).toBe(createBillingSignature(body, secret));
  });
});
