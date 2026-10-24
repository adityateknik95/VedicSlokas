# VedicSlokas

A home for Sanskrit slokas: grand like the Vedic age, built for a young audience.
Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · GSAP + ScrollTrigger · Framer Motion · Lenis.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build (also type-checks)
npm start
```

Deploys to Vercel as-is: import the repo, no settings needed. Optionally set
`NEXT_PUBLIC_SITE_URL` (e.g. `https://vedicslokas.com`) so canonical URLs, the sitemap
and Open Graph links use your domain; otherwise Vercel's production URL is used.

## Content

All verses live in [`data/slokas.json`](data/slokas.json) (typed by [`lib/types.ts`](lib/types.ts)).
Every entry has `"verified": false`. Check each one against a trusted critical edition, then
flip it to `true`; the sloka page badge and footer count update automatically.

Things to look at when verifying:
- **Gāyatrī (Ṛgveda 3.62.10)**: the text omits the liturgical "oṃ bhūr bhuvaḥ svaḥ" prefix on purpose.
- **Stotras** have no chapters, so they're cited by work and verse number (`chapter: null`).
- **Śiva Tāṇḍava Stotram** has small spelling variants across printed editions.
- Translations and word glosses are original and should be reviewed too.

Translations: the **Translate** page (`/translate?sloka=<slug>&lang=kn|hi|ta|te|ml|en`) shows
the sloka in that language's script and its meaning in that language.
- The script versions are generated in code from the Devanagari ([`lib/transliterate.ts`](lib/transliterate.ts)), so they're exact.
  Tamil marks sounds it has no letter for with superscripts (க² kha, க³ ga, க⁴ gha).
- The meanings in Hindi, Kannada, Tamil, Telugu and Malayalam live in
  [`data/translations.json`](data/translations.json). They were AI-drafted from the English and are
  marked `"verified": false`; have a fluent reader check each language before launch.

Audio: each entry points to `/audio/<slug>.mp3`. Drop files into `public/audio/`; until then the
Listen button says "Recitation coming soon".

## Structure

```
app/                 routes: home, library, sloka/[slug] (+ per-sloka OG image), about, sitemap, robots
components/motifs    inline-SVG motifs: mandala, lotus, pillar, palm-leaf edge, diya, Om, gold divider
components/motion    MotionProvider (Lenis + GSAP, reveal observer, reduced-motion)
components/home      hero, sloka of the day, pillars, 3D carousel, embers, count-up
components/library   search/filter browser, sloka card
components/sloka     audio, copy/share, Instagram-story card export
lib/                 data access + search normalisation, favorites store, fonts/idle helpers
scripts/             build-motifs.mjs: regenerates public/motifs/*.svg (`npm run motifs`)
```

## Performance notes (why things are the way they are)

- **Fonts.** Tiro Devanagari (117 KB) is registered by the inline boot script right after
  first paint (instantly on repeat visits), Inter is one self-hosted Latin file, and Cormorant is
  one weight. See [`assets/fonts/README.md`](assets/fonts/README.md).
- **Mandalas** are drawn with `<svg><use href="/motifs/…#m">`: cached once, themeable via
  `currentColor`, no DOM bloat, and never an LCP image.
- **Animation code is lazy.** Lenis + GSAP load on the first scroll/touch/key; embers start when
  the page is idle; the 3D carousel loads when it nears the viewport; Framer Motion's engine
  loads asynchronously. Below-the-fold sections use `content-visibility: auto`.
- **Reduced motion.** With `prefers-reduced-motion`, every animation becomes a simple fade and
  Lenis/GSAP/embers are never loaded.

Lighthouse (local production build, quiet machine): mobile Performance 91–95,
desktop 100; Accessibility, Best Practices and SEO 100 on every page.

## Authentication

Passwordless sign-in for students: **Continue with Google**, or **Continue with email** (a
single-use magic link). There are no passwords anywhere. Built with Better Auth (Drizzle
adapter, Google provider, magic-link plugin), Neon Postgres, Resend, Upstash and zod.

### How it works

- **Sign up (email):** name + email + consent → the account is created *unverified* (with
  `terms_accepted_at` / `terms_version`) and a link is emailed. Using the link verifies the email.
- **Log in (email):** if the account exists, a sign-in link is sent; if not, a "we couldn't find an
  account, create one here" email is sent. The screen is identical either way (no enumeration).
- **The link** opens `/auth/confirm`, which only *shows* "Sign in as you@example.com". The
  **Confirm sign in** button (a POST) is what uses the token, so mail scanners that prefetch links
  can't burn it. Links are single-use, expire after 15 minutes, are stored only as a SHA-256 hash,
  and requesting a new one cancels the old ones. "This was not me" cancels the link.
- **Google:** email + profile scopes only. A Google sign-in is linked to an existing email account
  only when Google reports the address verified.
- **Sessions:** database-backed, httpOnly + SameSite=Lax cookies (Secure on https), 30 days,
  sliding. Sign-out deletes the session row and signs out other open tabs.
- **Cross-device:** the "Check your inbox" tab polls `/api/sign-in-status`. Confirm in the same
  browser and it moves on to the dashboard; confirm on another device and it says so (it does
  not sign in the waiting browser, which would let someone hijack a sign-in by requesting it).
- **Roles:** `user.role` is `student` (default), `teacher` or `admin`. See `requireRole()` in
  `lib/session.ts`.
- **Rate limits:** 10 link emails per IP per hour, 5 per address per hour, 60 s between links to
  the same address (all sliding windows, keys hashed). Limits answer with a friendly countdown.
- **Audit log:** `audit_log` records link requested/used/expired/invalid, Google sign-in, sign-out,
  rate limiting and email failures. Tokens are never logged.

Key files: `lib/auth.ts` (config), `lib/auth-flows.ts` (send/confirm logic), `app/(auth)/actions.ts`
(server actions), `lib/session.ts`, `proxy.ts` (cookie-presence redirects only),
`db/schema.ts`, `components/auth/*`.

### Setup

1. **Environment.** Copy `.env.example` to `.env.local` and fill it in. Every variable is
   documented there. In development all of them are optional (see below); in production the
   auth routes refuse to run until the required ones are set.
2. **Database (Neon).** Create a project at neon.tech, copy the pooled connection string into
   `DATABASE_URL`, then apply migrations:
   ```bash
   npm run db:migrate
   ```
   After changing `db/schema.ts`, create a new migration with `npm run db:generate`.
3. **Google OAuth.** Google Cloud Console → APIs & Services → OAuth consent screen (scopes:
   `email`, `profile`, `openid`), then Credentials → OAuth client ID → *Web application*.
   Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-domain>/api/auth/callback/google` (e.g. `https://vedicslokas.vercel.app/...`)

   Put the ID and secret in `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.
4. **Email (Resend).** Add and verify a sending domain at resend.com (DNS records for SPF/DKIM),
   create an API key, and set `RESEND_API_KEY` and `EMAIL_FROM` (an address on that domain).
5. **Rate limiting (Upstash).** Create a Redis database at upstash.com and copy its REST URL and
   token into `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`.
6. **Secret and URL.** `BETTER_AUTH_SECRET` (`openssl rand -base64 32`) and `BETTER_AUTH_URL`
   (the public origin, e.g. `https://vedicslokas.vercel.app`).
7. **Vercel.** Add the same variables under Project → Settings → Environment Variables, run
   `npm run db:migrate` against the production database, then deploy.
8. **Bot protection (optional).** Cloudflare Turnstile is wired in but off. Set
   `TURNSTILE_ENABLED=true` plus both keys to turn it on.

### Testing locally

With no `.env.local` at all, `npm run dev` just works:
- the database is an embedded Postgres (PGlite) in `./.pglite`, migrated automatically;
- emails are written to `./.dev-outbox/<address>.json` (open the file and copy the link);
- rate limits are kept in memory (a warning is printed);
- the Google button shows as unavailable until Google keys are set.

```bash
npm run typecheck   # route types + TypeScript
npm test            # unit + integration (in-memory Postgres): redirects, typos, tokens
npm run build
npm run test:e2e    # Playwright smoke tests against the production build (uses installed Chrome)
```

### Decisions and follow-ups

- **Security headers on every response** (`next.config.ts`): Content-Security-Policy (only this
  site, Google profile photos and Turnstile may load; nothing may frame the site), X-Frame-Options,
  nosniff, Referrer-Policy, Permissions-Policy and Cross-Origin-Opener-Policy. HSTS comes from
  Vercel. The CSP allows `'unsafe-inline'` scripts (Next.js bootstrap and the theme boot script);
  nonces would force every static page to render per request.
- **Deleting an account needs a sign-in from the last hour** (`signedInRecently` in
  `lib/dashboard/api.ts`). Older sessions get `reauth_required`, and Settings links to
  `/login?reauth=1`, which shows the form even to a signed-in visitor and returns to Settings.
  Sign out everywhere deliberately does not need it: it is how a student locks out a stolen session.
- **Token lookup** is by SHA-256 hash in the database (no raw-token comparison happens), which is
  the constant-time-safe approach.
- **Out of scope, intentionally not built** (each has a `TODO` in the code): payments and plans,
  live classes, recordings, notes and courses content (see Dashboard below), the admin panel,
  video, a per-student device limit, 2FA and phone OTP. Passwords will never be added.

## Dashboard

The signed-in app lives under `/dashboard`. Public pages (`/`, `/library`, `/sloka/*`) stay
static. Nothing about the account is rendered on the server for them; signed-in extras on a
sloka page (the Learned toggle and view tracking) load on the client, and only when the
`vs_signed_in` hint cookie is set.

### Routes

| Route | What it is |
| --- | --- |
| `/dashboard` | Home: greeting, Sloka of the Day, Surprise me, continue exploring, favourites, progress, browse by feeling, coming-soon rail |
| `/dashboard/welcome` | Onboarding, three skippable steps (shown once, until `onboardedAt` is set) |
| `/dashboard/library` | The library with New and Learned badges |
| `/dashboard/favourites` | Favourites, synced to the account |
| `/dashboard/progress` | Explored and learned counts, a 12-week streak calendar, per-source lists, history |
| `/dashboard/classes`, `/notes`, `/courses` | Coming soon, with Notify me |
| `/dashboard/settings` | Profile, preferences, data export, sign out everywhere, delete account |
| `/api/me/*` | The JSON API used by the app |

### Where the code is

- `app/dashboard/*`: pages. Each one is `force-dynamic`, with sections streamed in through Suspense.
- `components/dashboard/*`: the shell (`DashFrame`, `Sidebar`, `TopBar`, `TabBar`) and the
  sections. `components/layout/SiteChrome.tsx` hides the public header and footer inside the app.
- `lib/dashboard/`:
  - `modules.ts`: the module registry, which drives the sidebar, the phone tab bar and the home rail.
  - `data.ts`: every database query. Each one is scoped by the session user id.
  - `api.ts` and `schemas.ts`: the route wrapper and the zod bodies.
  - `state.ts`: per-request cached loaders.
  - Pure, unit-tested logic: `surprise.ts`, `streak.ts`, `favourites-merge.ts`.
- `lib/favorites.ts`: one hook (`useFavorites`) over two stores:
  - signed out, it uses localStorage, as before;
  - signed in, it uses the account, with optimistic writes, rollback and cross-tab sync.

  On first sign-in, local favourites are merged into the account once. The merge is idempotent.
- `lib/entitlements.ts`: `getEntitlements(userId)`. Today it grants nothing, because there are
  no subscriptions yet.

### Adding a module

1. Add an entry to `MODULES` in `lib/dashboard/modules.ts` with:
   - `key` and `href`;
   - `placements`: `sidebar`, `tabBar` and/or `homeRail`;
   - `status`: `"soon"` or `"live"`.
2. If it will be paid, also set `requires` to an entitlement key. Then:
   - add that key to `Entitlement`;
   - compute it in `getEntitlements`.
3. Build the page under `app/dashboard/<name>`. While the module is `"soon"`, `ModulePage` shows
   the coming-soon screen. Once it is `"live"`, wrap the paid parts in `<LockedFeature>`, which
   uses `moduleAccess`.

### API rules

Every `/api/me/*` route goes through `meRoute`:
- The user id comes only from the session. Bodies are `.strict()`, so a `userId` field is
  rejected with 400.
- Writes from another Origin get 403.
- Responses are `Cache-Control: no-store`.
- Rate limits apply per user (`lib/rate-limit.ts`).
- Writes are idempotent: upserts and PUT-like `{ slug, saved }` bodies.

Export and delete are written to `audit_log`, with counts only. Deleting an account cascades to
every per-user table and scrubs email and IP from that user's audit rows.

### Database

Migration `drizzle/0001_dashboard.sql` adds:

| Table | Holds | Primary key |
| --- | --- | --- |
| `favourites` | Saved slokas | `(user_id, sloka_slug)` |
| `sloka_progress` | First and last viewed, view count (once per day), `learned_at` | `(user_id, sloka_slug)` |
| `activity_day` | One row per day with activity, for streaks in the student's timezone | `(user_id, day)` |
| `user_prefs` | Interests, daily email opt-in, timezone, motion, `onboarded_at` | `user_id` |
| `feature_interest` | Notify me per coming-soon feature | `(user_id, feature)` |

Every table has `ON DELETE CASCADE` to `user`. The migration is additive only.

> **Before deploying the dashboard, apply the migration to Neon:** `npm run db:migrate` (with
> `DATABASE_URL` in `.env.local`). Without it, `/dashboard` and `/api/me/*` fail in production.

### Working on it locally

```bash
npm run dev:local
```

This runs the app on <http://localhost:3001> against a local PGlite database in `.pglite-dev`,
which is migrated automatically. External keys are blanked, so it never touches Neon, Resend,
Upstash or Google.

To sign in:
1. Use the email form.
2. Open `.dev-outbox/<address>.json`.
3. Follow the link inside it.

Tests:
- Unit tests (`npm test`) cover:
  - the surprise picker, streaks and the favourites merge;
  - the registry and gating, and the schemas;
  - the data layer against PGlite: isolation between students, once-per-day views, export and delete.
- `tests/e2e/dashboard.spec.ts` signs up through the real magic-link form via
  `tests/e2e/helpers.ts`, which reads `.dev-outbox`. Each test context sends its own
  `x-forwarded-for`, so the per-IP sign-in limit doesn't trip.

### Not built (TODO in code)

- Live classes and the timetable, booking, notes content, courses and recordings.
- Payments and plans (`getEntitlements`).
- Announcements: the bell is a placeholder.
- The daily email: only the preference is stored. There is no sender yet.
- Push notifications, an admin panel and a native app.

## Paid plan (testing)

**Access model:** every verse is free. The monthly plan unlocks the learning modules (live
classes, notes, courses) through `getEntitlements`, the only place that decides access. While
a module's status is `"soon"` it shows as coming soon, paid or not.

**Who sees it:** `SUBSCRIPTIONS` in the environment.
- `on` (the default): every signed-in student.
- `testers`: only accounts with the `admin` role and the emails in `SUBSCRIPTION_TESTERS`.
- `off`: no one.

Anyone it isn't shown to gets no "Your plan" link, a not-found page at `/dashboard/upgrade`, and 403 from
the API.

**How paying works:** manual UPI or bank transfer, no gateway.
1. The student pays `SUBSCRIPTION_PRICE_INR`.
   - The UPI QR is drawn on our own server from `PAYMENT_UPI_ID`.
   - Bank details come from `PAYMENT_BANK_*`. Both stay server side, and a method is hidden
     until it's configured.
2. They report the transaction reference (UTR), and the payment waits as pending.
3. An admin finds it in the bank or UPI statement at `/admin/payments` and approves or rejects
   it.
   - Approval adds one month, from today or from the end of a plan that is still running.
   - Every report and review is in `audit_log`.

**Safeguards:**
- A reference is unique, so one transfer can never be claimed twice.
- A student has at most one pending payment.
- Only one review of a payment can win.
- Students cannot review payments.

**Data:** `drizzle/0002_subscriptions.sql` adds two tables.

| Table | Holds | When the account is deleted |
| --- | --- | --- |
| `subscription` | The plan's end date | Removed |
| `subscription_payment` | Each reported payment | Kept for the accounts, with `user_id` set to null |

Export includes the plan and payments. The logic is in `lib/subscriptions.ts`, with tests in
`tests/unit/subscriptions.test.ts`.

**Making an admin:** run this in the Neon SQL editor:

```sql
update "user" set role = 'admin' where email = 'you@example.com';
```

**Before taking real payments:**
- Set the `PAYMENT_*` details in Vercel (until then the page says payment isn't set up yet).
- Add the price, what it includes and the refund policy to the Terms.
- Turn the modules' status to `"live"` as their content arrives.

## Live classes

Classes run on **Zoom or Google Meet**. The dashboard holds the timetable and decides who may
join.

**For students:**
- `/dashboard/classes` shows what's live now, coming up (next 30 days), and recent classes with
  their recordings. Times are shown in the student's timezone.
- **Join class** works from 10 minutes before the start until the end. The meeting link is
  handed out only by `POST /api/me/classes/join`, never written into a page, and each join is
  counted once.
- Every class is one hour. In its last 15 minutes a countdown ("Ends in 14:59") appears on the
  class card, on the class page (`/dashboard/classes/<id>`, with a large clock the teacher can
  keep open or share) and in a pill in the top bar.
- The bell lists classes that are live, starting within a day, or newly scheduled. Home shows
  the next class.

**Who may join:** `LIVE_CLASSES` in the environment.
- `everyone` (the default): every signed-in student, while classes are a free trial.
- `plan`: students with an active monthly plan. Others see "Included in the monthly plan".

The rule lives in `getEntitlements`, like every other access rule.

**Automatic Google Meet links:** a teacher clicks **Connect Google Meet** on Manage classes once.
- After that, a class saved without a link gets a one-hour Google Calendar event with a new Meet
  link on that teacher's Google account, so the teacher owns the meeting and admits students.
- Changing the date or time moves the event, cancelling the class deletes it, and pasting your
  own link instead retires it.
- Only the refresh token is kept, encrypted with a key derived from `BETTER_AUTH_SECRET`
  (`lib/secret-box.ts`). Disconnecting or deleting the account revokes it at Google.
- Code: `lib/google-calendar.ts` (Google calls), `lib/class-meetings.ts` (scheduling), and the
  routes `/api/teach/google/{connect,callback,disconnect}`.

One-time Google Cloud setup, on the project that holds the sign-in OAuth client:
1. APIs & Services → Library → enable **Google Calendar API**.
2. Credentials → your OAuth client → Authorized redirect URIs → add
   `https://<your-domain>/api/teach/google/callback` (and `http://localhost:3000/api/teach/google/callback`).
3. OAuth consent screen → Data access (scopes) → add `.../auth/calendar.events`.
   - While the app is unverified, Google shows "Google hasn't verified this app" to the teacher:
     choose Advanced → continue.
   - Keep the app's publishing status "In production". In "Testing", Google expires the connection
     after 7 days.

**Scheduling:** at `/dashboard/classes/manage` ("Manage classes" in the account menu).
- Teachers create, edit and cancel their own classes.
- Admins manage every class, and can set the teacher by email.
- Only `https` Google Meet and Zoom links are accepted.
- Saves and cancellations are recorded in `audit_log`.

To make someone a teacher, run in the Neon SQL editor:

```sql
update "user" set role = 'teacher' where email = 'teacher@example.com';
```

**Code:**
- Logic: `lib/classes.ts`, with timing in `lib/classes-time.ts` (shared by server and browser).
- UI: `components/dashboard/classes/*`.
- Data: `live_class` and `class_attendance`, from migration `drizzle/0003_live_classes.sql`.
- Tests: `tests/unit/classes*.test.ts`.

