import { sql } from "drizzle-orm";
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
  "payment_submitted",
  "payment_verified",
  "payment_rejected",
  "class_saved",
  "class_cancelled",
  "google_connected",
  "google_disconnected",
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


/**
 * A paid subscription is just an end date: the student is subscribed while expires_at is in
 * the future. Renewals push it forward. Removed with the account.
 */
export const subscription = pgTable("subscription", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const PAYMENT_MODES = ["upi", "bank"] as const;
export type PaymentMode = (typeof PAYMENT_MODES)[number];
export const paymentStatus = pgEnum("payment_status", ["pending", "verified", "rejected"]);

/**
 * A manual payment the student reports (UPI or bank transfer), checked by an admin against
 * the bank statement. The reference (UTR) is unique, so one transfer can never be claimed
 * twice, and a student has at most one pending payment. Kept for the accounts when the
 * student deletes their account: user_id becomes null, so nothing identifies them.
 */
export const subscriptionPayment = pgTable(
  "subscription_payment",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    amountPaise: integer("amount_paise").notNull(),
    mode: text("mode", { enum: PAYMENT_MODES }).notNull(),
    /** Normalised: upper case, no spaces. */
    reference: text("reference").notNull().unique(),
    status: paymentStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
  },
  (t) => [
    index("subscription_payment_user_idx").on(t.userId),
    index("subscription_payment_status_idx").on(t.status, t.createdAt),
    uniqueIndex("subscription_payment_one_pending_idx")
      .on(t.userId)
      .where(sql`${t.status} = 'pending'`),
  ],
);

/**
 * A live class, held on Zoom or Google Meet. The meeting link is only handed out (by the
 * join API) around the class time, never rendered into pages. Teachers manage their own
 * classes; admins manage all.
 */
export const liveClass = pgTable(
  "live_class",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    teacherId: text("teacher_id").references(() => user.id, { onDelete: "set null" }),
    /** Shown to students; kept even if the teacher's account goes. */
    teacherName: text("teacher_name").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    durationMin: integer("duration_min").notNull().default(60),
    meetingUrl: text("meeting_url").notNull(),
    recordingUrl: text("recording_url"),
    /** The Google Calendar event that holds the Meet link, when the site created it. */
    googleEventId: text("google_event_id"),
    /** Whose Google account owns that event (so edits and cancellations go to the same calendar). */
    googleOwnerId: text("google_owner_id").references(() => user.id, { onDelete: "set null" }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("live_class_starts_at_idx").on(t.startsAt)],
);

/** Who joined which class (first join only), for the teacher's count. */
export const classAttendance = pgTable(
  "class_attendance",
  {
    classId: text("class_id")
      .notNull()
      .references(() => liveClass.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.classId, t.userId] })],
);

/**
 * A teacher's Google account, connected so the site can create Calendar events with Meet
 * links for their classes. Only the refresh token is kept, encrypted (AES-256-GCM with a key
 * derived from BETTER_AUTH_SECRET). Removed with the account, or on Disconnect.
 */
export const googleCalendarLink = pgTable("google_calendar_link", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  googleEmail: text("google_email").notNull(),
  refreshToken: text("refresh_token").notNull(),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
});
