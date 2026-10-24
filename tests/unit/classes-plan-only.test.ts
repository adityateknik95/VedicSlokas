import { randomUUID } from "node:crypto";
import { describe, expect, it } from "vitest";
import { getDb, schema } from "@/db";
import { getEntitlements } from "@/lib/entitlements";

process.env.LIVE_CLASSES = "plan";

describe("live classes for subscribers only", () => {
  it("a student without a plan cannot join once LIVE_CLASSES=plan", async () => {
    const db = await getDb();
    const id = randomUUID();
    await db.insert(schema.user).values({ id, name: "Student", email: `${id}@example.com` });
    expect((await getEntitlements(id)).liveClasses).toBe(false);
  });
});
