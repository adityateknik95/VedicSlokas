import { describe, expect, it } from "vitest";
import { DEFAULT_AFTER_LOGIN, safeCallbackUrl } from "@/lib/redirects";

describe("safeCallbackUrl (open-redirect allowlist)", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/dashboard/classes?week=2#live", "/dashboard/classes?week=2#live"],
    ["/library?theme=courage", "/library?theme=courage"],
    ["/sloka/gayatri-mantra", "/sloka/gayatri-mantra"],
    ["/translate?sloka=gayatri-mantra&lang=kn", "/translate?sloka=gayatri-mantra&lang=kn"],
    ["/", "/"],
  ])("allows same-origin app path %s", (input, expected) => {
    expect(safeCallbackUrl(input)).toBe(expected);
  });

  it.each([
    "https://evil.example/phish",
    "//evil.example",
    "///evil.example",
    "/\evil.example",
    "\\evil.example",
    "javascript:alert(1)",
    "data:text/html,hi",
    "/%2F%2Fevil.example",
    "/%5Cevil.example",
    "http:/evil.example",
    "/login",
    "/signup",
    "/auth/confirm?token=abc",
    "/api/auth/sign-out",
    "/sloka/",
    "/dashboardevil",
    "/admin",
    "/dash\nboard",
    "",
    "   ",
    `/${"a".repeat(600)}`,
  ])("rejects %s", (input) => {
    expect(safeCallbackUrl(input)).toBe(DEFAULT_AFTER_LOGIN);
  });

  it("rejects non-strings and honours a custom fallback", () => {
    expect(safeCallbackUrl(undefined)).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeCallbackUrl(42)).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeCallbackUrl(["/dashboard"])).toBe(DEFAULT_AFTER_LOGIN);
    expect(safeCallbackUrl("https://evil.example", "/")).toBe("/");
  });
});
