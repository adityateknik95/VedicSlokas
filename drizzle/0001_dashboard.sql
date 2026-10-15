CREATE TYPE "public"."feature" AS ENUM('live_classes', 'notes', 'courses');--> statement-breakpoint
ALTER TYPE "public"."audit_event" ADD VALUE 'account_deleted';--> statement-breakpoint
ALTER TYPE "public"."audit_event" ADD VALUE 'data_exported';--> statement-breakpoint
CREATE TABLE "activity_day" (
	"user_id" text NOT NULL,
	"day" text NOT NULL,
	"views" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "activity_day_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "favourites" (
	"user_id" text NOT NULL,
	"sloka_slug" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "favourites_user_id_sloka_slug_pk" PRIMARY KEY("user_id","sloka_slug")
);
--> statement-breakpoint
CREATE TABLE "feature_interest" (
	"user_id" text NOT NULL,
	"feature" "feature" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feature_interest_user_id_feature_pk" PRIMARY KEY("user_id","feature")
);
--> statement-breakpoint
CREATE TABLE "sloka_progress" (
	"user_id" text NOT NULL,
	"sloka_slug" text NOT NULL,
	"first_viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_viewed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"view_count" integer DEFAULT 1 NOT NULL,
	"learned_at" timestamp with time zone,
	CONSTRAINT "sloka_progress_user_id_sloka_slug_pk" PRIMARY KEY("user_id","sloka_slug")
);
--> statement-breakpoint
CREATE TABLE "user_prefs" (
	"user_id" text PRIMARY KEY NOT NULL,
	"interests" text[] DEFAULT '{}' NOT NULL,
	"daily_email" boolean DEFAULT false NOT NULL,
	"onboarded_at" timestamp with time zone,
	"timezone" text,
	"motion" text DEFAULT 'system' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_day" ADD CONSTRAINT "activity_day_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "favourites" ADD CONSTRAINT "favourites_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feature_interest" ADD CONSTRAINT "feature_interest_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sloka_progress" ADD CONSTRAINT "sloka_progress_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_prefs" ADD CONSTRAINT "user_prefs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "favourites_user_id_idx" ON "favourites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sloka_progress_user_last_viewed_idx" ON "sloka_progress" USING btree ("user_id","last_viewed_at" DESC NULLS LAST);