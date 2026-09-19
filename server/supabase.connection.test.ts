import { describe, expect, it } from "vitest";

describe("Supabase connection", () => {
  it("can reach the RLS-protected workspaces endpoint with the configured publishable key", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

    expect(url, "VITE_SUPABASE_URL is required").toBeTruthy();
    expect(key, "VITE_SUPABASE_PUBLISHABLE_KEY is required").toBeTruthy();

    const response = await fetch(`${url}/rest/v1/workspaces?select=id&limit=1`, {
      headers: {
        apikey: key!,
        Authorization: `Bearer ${key!}`,
      },
    });

    const bodyText = await response.text();
    expect(response.ok, bodyText).toBe(true);
    const body = JSON.parse(bodyText);
    expect(Array.isArray(body)).toBe(true);
  }, 15_000);
});
