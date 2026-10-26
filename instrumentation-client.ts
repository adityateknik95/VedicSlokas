import * as Sentry from "@sentry/nextjs";
import { scrubBreadcrumb, scrubEvent, scrubSpan, sentryOptions } from "@/lib/monitoring";

// Browser errors. Reports go to /monitoring on this site (Sentry's tunnel), so the CSP stays
// 'self' only and ad blockers don't drop them. No session replay. Off without a DSN.
Sentry.init({
  ...sentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN),
  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
  beforeBreadcrumb: (crumb) => scrubBreadcrumb(crumb),
  beforeSendSpan: (span) => scrubSpan(span),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
