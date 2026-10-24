ALTER TYPE "public"."audit_event" ADD VALUE 'google_connected';--> statement-breakpoint
ALTER TYPE "public"."audit_event" ADD VALUE 'google_disconnected';--> statement-breakpoint
CREATE TABLE "google_calendar_link" (
	"user_id" text PRIMARY KEY NOT NULL,
	"google_email" text NOT NULL,
	"refresh_token" text NOT NULL,
	"connected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "live_class" ADD COLUMN "google_event_id" text;--> statement-breakpoint
ALTER TABLE "live_class" ADD COLUMN "google_owner_id" text;--> statement-breakpoint
ALTER TABLE "google_calendar_link" ADD CONSTRAINT "google_calendar_link_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "live_class" ADD CONSTRAINT "live_class_google_owner_id_user_id_fk" FOREIGN KEY ("google_owner_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;