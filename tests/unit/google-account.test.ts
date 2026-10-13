import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { getDb, schema } from "@/db";
import { getAuth } from "@/lib/auth";

beforeAll(() => {
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
});

describe("Google accounts", () => {
  it("never stores Google's API tokens, on create or update", async () => {
    const db = await getDb();
    const userId = randomUUID();
    await db.insert(schema.user).values({ id: userId, name: "G User", email: "g.user@example.com", emailVerified: true });

    const ctx = await (await getAuth()).$context;
    const account = await ctx.internalAdapter.createAccount({
      userId,
      providerId: "google",
      accountId: "google-sub-123",
      accessToken: "ya29.secret-access-token",
      refreshToken: "1//secret-refresh-token",
      idToken: "eyJ.secret.id-token",
      accessTokenExpiresAt: new Date(Date.now() + 3_600_000),
      scope: "openid email profile",
    });
    await ctx.internalAdapter.updateAccount(account.id, { accessToken: "ya29.another-secret", idToken: "eyJ.another" });

    const [row] = await db.select().from(schema.account).where(eq(schema.account.userId, userId));
    expect(row.providerId).toBe("google");
    expect(row.accountId).toBe("google-sub-123");
    expect(row.accessToken).toBeNull();
    expect(row.refreshToken).toBeNull();
    expect(row.idToken).toBeNull();
    expect(row.accessTokenExpiresAt).toBeNull();
    expect(JSON.stringify(row)).not.toMatch(/secret/);
  });
});
