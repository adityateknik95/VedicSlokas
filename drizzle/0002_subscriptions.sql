CREATE TYPE "public"."payment_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."audit_event" ADD VALUE 'payment_submitted';--> statement-breakpoint
ALTER TYPE "public"."audit_event" ADD VALUE 'payment_verified';--> statement-breakpoint
ALTER TYPE "public"."audit_event" ADD VALUE 'payment_rejected';--> statement-breakpoint
CREATE TABLE "subscription" (
	"user_id" text PRIMARY KEY NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscription_payment" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"amount_paise" integer NOT NULL,
	"mode" text NOT NULL,
	"reference" text NOT NULL,
	"status" "payment_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by" text,
	CONSTRAINT "subscription_payment_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_payment_user_idx" ON "subscription_payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_payment_status_idx" ON "subscription_payment" USING btree ("status","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "subscription_payment_one_pending_idx" ON "subscription_payment" USING btree ("user_id") WHERE "subscription_payment"."status" = 'pending';