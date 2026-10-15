CREATE TYPE "public"."student_plan_status" AS ENUM('trial', 'pending', 'active', 'expired');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TABLE "student_plan" (
  "user_id" text PRIMARY KEY NOT NULL,
  "status" "student_plan_status" DEFAULT 'trial' NOT NULL,
  "trial_started_at" timestamp with time zone,
  "subscription_started_at" timestamp with time zone,
  "subscription_expires_at" timestamp with time zone,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "subscription_payment" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "amount_paise" integer DEFAULT 7900 NOT NULL,
  "mode" text NOT NULL,
  "utr" text NOT NULL,
  "status" "payment_status" DEFAULT 'pending' NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "verified_at" timestamp with time zone
);--> statement-breakpoint
ALTER TABLE "student_plan" ADD CONSTRAINT "student_plan_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscription_payment" ADD CONSTRAINT "subscription_payment_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscription_payment_user_idx" ON "subscription_payment" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subscription_payment_status_idx" ON "subscription_payment" USING btree ("status");
