import { describe, expect, it } from "vitest";
import { canUseSubscriptions } from "@/lib/subscriptions";

describe("the plan by default", () => {
  it("is shown to every signed-in student when SUBSCRIPTIONS is not set", () => {
    delete process.env.SUBSCRIPTIONS;
    expect(canUseSubscriptions({ email: "new.student@example.com", role: "student" })).toBe(true);
  });
});
