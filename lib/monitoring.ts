/**
 * What error reports may carry. Shared by the server, edge and browser Sentry set-ups.
 * Reports must never hold a way into someone's account or their personal data:
 *   - query strings and fragments are dropped from every URL (sign-in links carry a token in
 *     ?token=, Google replies carry ?code= and ?state=),
 *   - cookies, request bodies and auth headers are removed,
 *   - no user is attached (sendDefaultPii stays off; this is a second line).
 */

const STRIPPED_HEADERS = new Set(["cookie", "set-cookie", "authorization", "x-forwarded-for", "x-real-ip"]);

/** "https://site/auth/confirm?token=abc#x" → "https://site/auth/confirm", also inside text like "GET /x?code=1". */
export function stripQuery(value: string): string {
  return value.replace(/[?#]\S*/g, "");
}

/** Query parameters that can open an account or a Google grant. */
const SECRET_PARAM = /(^|[?&#;])(token|code|state|pwd|password|secret|key|session[_-]?token)=/i;

/**
 * Walks a report (spans, contexts, tags…) and strips the query string from any text that
 * carries a secret-looking parameter, wherever the SDK happened to put the URL. Bounded in
 * depth and size, so a strange report can't make it slow.
 */
export function scrubDeep(value: unknown, depth = 0): unknown {
  if (typeof value === "string") return SECRET_PARAM.test(value) ? stripQuery(value) : value;
  if (depth > 8 || value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) {
    for (let i = 0; i < Math.min(value.length, 500); i++) value[i] = scrubDeep(value[i], depth + 1);
    return value;
  }
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj).slice(0, 500)) obj[key] = scrubDeep(obj[key], depth + 1);
  return obj;
}

type Breadcrumbish = { data?: Record<string, unknown> | undefined; message?: string | undefined };
type Requestish = {
  url?: string;
  query_string?: unknown;
  cookies?: unknown;
  data?: unknown;
  headers?: Record<string, string>;
};
type Eventish = {
  request?: Requestish;
  user?: unknown;
  breadcrumbs?: Breadcrumbish[];
  transaction?: string;
};

export function scrubBreadcrumb<B extends Breadcrumbish>(crumb: B): B {
  if (crumb.data) {
    for (const key of ["url", "to", "from"]) {
      const v = crumb.data[key];
      if (typeof v === "string") crumb.data[key] = stripQuery(v);
    }
  }
  if (typeof crumb.message === "string" && /[?&#](token|code|state)=/.test(crumb.message)) crumb.message = stripQuery(crumb.message);
  return crumb;
}

export function scrubEvent<E extends Eventish>(event: E): E {
  const req = event.request;
  if (req) {
    if (req.url) req.url = stripQuery(req.url);
    delete req.query_string;
    delete req.cookies;
    delete req.data;
    if (req.headers) {
      for (const name of Object.keys(req.headers)) if (STRIPPED_HEADERS.has(name.toLowerCase())) delete req.headers[name];
    }
  }
  delete event.user;
  if (event.transaction) event.transaction = stripQuery(event.transaction);
  event.breadcrumbs?.forEach(scrubBreadcrumb);
  // Spans, contexts, tags and anything else: no secret-looking query string anywhere.
  scrubDeep(event);
  return event;
}

/** Each span of a performance trace: names and attributes often hold the full URL. Handles both span shapes the SDK uses. */
export function scrubSpan<S extends { name?: string; description?: string; data?: Record<string, unknown>; attributes?: Record<string, unknown> }>(span: S): S {
  if (span.name) span.name = stripQuery(span.name);
  if (span.description) span.description = stripQuery(span.description);
  for (const bag of [span.data, span.attributes]) {
    if (!bag) continue;
    for (const [k, v] of Object.entries(bag)) {
      if (typeof v !== "string") continue;
      // A query on its own ("token=…") is dropped; URLs and paths lose their query string.
      if (/query/i.test(k)) bag[k] = "";
      else if (/url|target|path|route/i.test(k)) bag[k] = stripQuery(v);
    }
    scrubDeep(bag);
  }
  return span;
}

/** Shared options. Tracing is sampled lightly; nothing personal is sent. */
export const sentryOptions = (dsn: string | undefined) => ({
  dsn,
  enabled: Boolean(dsn),
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
});
