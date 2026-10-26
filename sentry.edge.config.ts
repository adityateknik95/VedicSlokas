import * as Sentry from "@sentry/nextjs";
import { scrubBreadcrumb, scrubEvent, scrubSpan, sentryOptions } from "@/lib/monitoring";

// The edge runtime (proxy.ts). Off unless NEXT_PUBLIC_SENTRY_DSN is set.
Sentry.init({
  ...sentryOptions(process.env.NEXT_PUBLIC_SENTRY_DSN),
  beforeSend: (event) => scrubEvent(event),
  beforeSendTransaction: (event) => scrubEvent(event),
  beforeBreadcrumb: (crumb) => scrubBreadcrumb(crumb),
  beforeSendSpan: (span) => scrubSpan(span),
});
