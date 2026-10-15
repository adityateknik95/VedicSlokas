import { boolean, index, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

/**
 * Tables used by Better Auth (user, session, account, verification) plus our own audit log.
 * Property names follow Better Auth's field names (camelCase); columns are snake_case.
 */

export const userRole = pgEnum("user_role", ["student", "teacher", "admin"]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  role: userRole("role").notNull().default("student"),
  termsAcceptedAt: timestamp("terms_accepted_at", { withTimezone: true }),
  termsVersion: text("terms_version"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    token: text("token").notNull().unique(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("session_user_id_idx").on(t.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
    scope: text("scope"),
    // Part of Better Auth's core account model. Always null here: this system is passwordless.
    password: text("password"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("account_user_id_idx").on(t.userId), uniqueIndex("account_provider_account_idx").on(t.providerId, t.accountId)],
);

/** Magic-link tokens live here, stored only as a SHA-256 hash inside `identifier`. */
export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("verification_identifier_idx").on(t.identifier)],
);

/**
 * One row per "email me a link" request, keyed by a hash of a random secret held only
 * in the requesting browser's httpOnly cookie. Lets the waiting tab notice when the link
 * was used on another device. It never grants a session to that tab.
 */
export const signInAttempt = pgTable(
  "sign_in_attempt",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sign_in_attempt_email_idx").on(t.email)],
);

export const auditEvent = pgEnum("audit_event", [
  "link_requested",
  "link_used",
  "link_expired",
  "link_invalid",
  "google_sign_in",
  "sign_out",
  "rate_limited",
  "email_send_failed",
  "account_deleted",
  "data_exported",
]);

/** Security-relevant auth events. Never stores tokens. */
export const auditLog = pgTable(
  "audit_log",
  {
    id: text("id").primaryKey(),
    event: auditEvent("event").notNull(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    email: text("email"),
    ip: text("ip"),
    userAgent: text("user_agent"),
    metadata: jsonb("metadata").$type<Record<string, string | number | boolean | null>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_log_created_at_idx").on(t.createdAt), index("audit_log_email_idx").on(t.email)],
);

/*
 * Student state. Sloka content stays in data/slokas.json and is never copied here:
 * these tables only remember what a person did with it. Every row belongs to a user and
 * disappears with them (ON DELETE CASCADE), so deleting an account is complete.
 */

/** Saved slokas. One row per (user, sloka). */
export const favourites = pgTable(
  "favourites",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slokaSlug: text("sloka_slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.slokaSlug] }), index("favourites_user_id_idx").on(t.userId)],
);

/** What a student has read and learned. One row per (user, sloka). */
export const slokaProgress = pgTable(
  "sloka_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    slokaSlug: text("sloka_slug").notNull(),
    firstViewedAt: timestamp("first_viewed_at", { withTimezone: true }).notNull().defaultNow(),
    lastViewedAt: timestamp("last_viewed_at", { withTimezone: true }).notNull().defaultNow(),
    viewCount: integer("view_count").notNull().default(1),
    learnedAt: timestamp("learned_at", { withTimezone: true }),
  },
  (t) => [primaryKey({ columns: [t.userId, t.slokaSlug] }), index("sloka_progress_user_last_viewed_idx").on(t.userId, t.lastViewedAt.desc())],
);

/**
 * Days on which a student viewed at least one sloka, as a calendar date in their own
 * timezone. Lets the streak and the 12-week calendar be exact, which `last_viewed_at`
 * alone cannot be (it only keeps the latest view of each sloka).
 */
export const activityDay = pgTable(
  "activity_day",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** YYYY-MM-DD in the user's timezone at the time of the view. */
    day: text("day").notNull(),
    views: integer("views").notNull().default(1),
  },
  (t) => [primaryKey({ columns: [t.userId, t.day] })],
);

/** Onboarding answers and preferences. One row per user, created on first save. */
export const userPrefs = pgTable("user_prefs", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  interests: text("interests").array().notNull().default([]),
  dailyEmail: boolean("daily_email").notNull().default(false),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  /** IANA name, e.g. "Asia/Kolkata". Detected from the browser, editable in Settings. */
  timezone: text("timezone"),
  /** "system" follows the device; "reduce" forces fades only. */
  motion: text("motion").notNull().default("system"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const FEATURES = ["live_classes", "notes", "courses"] as const;
export const feature = pgEnum("feature", FEATURES);

/** "Notify me" on a coming-soon module. Tells us what to build first. */
export const featureInterest = pgTable(
  "feature_interest",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    feature: feature("feature").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.feature] })],
);

export type UserRole = (typeof userRole.enumValues)[number];
export type Feature = (typeof FEATURES)[number];
export type AuditEvent = (typeof auditEvent.enumValues)[number];


/** Customer-selected plan and current entitlement state. */
export const studentPlanStatus = pgEnum("student_plan_status", ["trial", "pending", "active", "expired"]);
export const studentPlan = pgTable("student_plan", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  status: studentPlanStatus("status").notNull().default("trial"),
  trialStartedAt: timestamp("trial_started_at", { withTimezone: true }),
  subscriptionStartedAt: timestamp("subscription_started_at", { withTimezone: true }),
  subscriptionExpiresAt: timestamp("subscription_expires_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const paymentStatus = pgEnum("payment_status", ["pending", "verified", "rejected"]);
export const subscriptionPayment = pgTable("subscription_payment", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  amountPaise: integer("amount_paise").notNull().default(7900),
  mode: text("mode").notNull(),
  utr: text("utr").notNull(),
  status: paymentStatus("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
}, (t) => [index("subscription_payment_user_idx").on(t.userId), index("subscription_payment_status_idx").on(t.status)]);
