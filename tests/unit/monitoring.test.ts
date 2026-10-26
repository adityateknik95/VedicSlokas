import { describe, expect, it } from "vitest";
import { scrubBreadcrumb, scrubEvent, scrubSpan, sentryOptions, stripQuery } from "@/lib/monitoring";

describe("error reports carry no way into an account", () => {
  it("drops query strings and fragments from URLs", () => {
    expect(stripQuery("https://vedicslokas.vercel.app/auth/confirm?token=SECRET123")).toBe("https://vedicslokas.vercel.app/auth/confirm");
    expect(stripQuery("/api/teach/google/callback?code=abc&state=xyz")).toBe("/api/teach/google/callback");
    expect(stripQuery("/dashboard#section")).toBe("/dashboard");
    expect(stripQuery("/library")).toBe("/library");
  });

  it("removes cookies, bodies, auth headers, the user, and secrets in breadcrumbs", () => {
    const event = scrubEvent({
      request: {
        url: "https://site/auth/confirm?token=SECRET123",
        query_string: "token=SECRET123",
        cookies: { "better-auth.session_token": "s" },
        data: { email: "a@example.com" },
        headers: { Cookie: "x", Authorization: "Bearer t", "User-Agent": "UA", "X-Forwarded-For": "1.2.3.4" },
      },
      user: { email: "a@example.com" },
      transaction: "/auth/confirm?token=SECRET123",
      breadcrumbs: [
        { data: { url: "/api/me/plan?x=1", to: "/auth/confirm?token=SECRET123", from: "/login?callbackUrl=%2F" } },
        { message: "GET /api/teach/google/callback?code=abc" },
      ],
    });
    const text = JSON.stringify(event);
    for (const secret of ["SECRET123", "a@example.com", "Bearer", "1.2.3.4", "session_token", "code=abc"]) expect(text).not.toContain(secret);
    expect(event.request?.headers).toEqual({ "User-Agent": "UA" });
    expect(event.request?.url).toBe("https://site/auth/confirm");
    expect(event.user).toBeUndefined();
  });

  it("leaves harmless breadcrumbs alone", () => {
    expect(scrubBreadcrumb({ message: "Clicked Join class" }).message).toBe("Clicked Join class");
  });

  it("is off without a DSN and never sends personal data", () => {
    expect(sentryOptions(undefined)).toMatchObject({ enabled: false, sendDefaultPii: false });
    expect(sentryOptions("https://key@o1.ingest.sentry.io/1")).toMatchObject({ enabled: true, sendDefaultPii: false });
  });

  it("finds secret-looking URLs anywhere in a report, including spans", () => {
    const event = scrubEvent({
      contexts: { trace: { data: { "url.full": "https://site/api/teach/google/callback?code=GOOGLECODE&state=S" } } },
      spans: [{ description: "GET /auth/confirm?token=SECRET123", data: { "http.query": "?token=SECRET123" } }],
      tags: { url: "/library?q=gita" },
    } as Parameters<typeof scrubEvent>[0]);
    const text = JSON.stringify(event);
    expect(text).not.toContain("GOOGLECODE");
    expect(text).not.toContain("SECRET123");
    // A harmless search query elsewhere is left as it was.
    expect(text).toContain("/library?q=gita");
    const span = scrubSpan({ description: "navigation /dashboard?x=1", data: { "url.query": "token=SECRET123", other: 3 } });
    expect(JSON.stringify(span)).not.toContain("SECRET123");
    expect(span.description).toBe("navigation /dashboard");
    const streamed = scrubSpan({ name: "GET /auth/confirm?token=SECRET123", attributes: { "url.full": "https://site/x?code=GOOGLECODE", "http.method": "GET" } });
    expect(JSON.stringify(streamed)).not.toMatch(/SECRET123|GOOGLECODE/);
    expect(streamed.attributes["http.method"]).toBe("GET");
  });
});
