-- The paid plan: subscription (an end date per student) and subscription_payment (manual
-- UPI/bank payments checked by an admin).
-- An earlier draft of this feature was applied to some databases: it created payment_status
-- (same values) and its own subscription_payment table with a "utr" column. This migration
-- tolerates the first and keeps the second's rows as subscription_payment_legacy.
DO $$ BEGIN
  CREATE TYPE "public"."payment_status" AS ENUM('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;--> statement-breakpoint
ALTER TYPE "public"."audit_event" ADD VALUE IF NOT EXISTS 'payment_submitted';--> statement-breakpoint
ALTER TYPE "public"."audit_event" ADD VALUE IF NOT EXISTS 'payment_verified';--> statement-breakpoint
ALTER TYPE "public"."audit_event" ADD VALUE IF NOT EXISTS 'payment_rejected';--> statement-breakpoint
DO $$
DECLARE c record;
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'subscription_payment' AND column_name = 'utr') THEN
    ALTER TABLE "public"."subscription_payment" RENAME TO "subscription_payment_legacy";
    -- Free the old names, so the new table can use them.
    FOR c IN SELECT conname FROM pg_constraint WHERE conrelid = 'public.subscription_payment_legacy'::regclass AND conname LIKE 'subscription_payment%' LOOP
      EXECUTE format('ALTER TABLE "public"."subscription_payment_legacy" RENAME CONSTRAINT %I TO %I', c.conname, replace(c.conname, 'subscription_payment', 'subscription_payment_legacy'));
    END LOOP;
    FOR c IN SELECT indexname FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'subscription_payment_legacy' AND indexname LIKE 'subscription_payment%' AND indexname NOT LIKE 'subscription_payment_legacy%' LOOP
      EXECUTE format('ALTER INDEX "public".%I RENAME TO %I', c.indexname, replace(c.indexname, 'subscription_payment', 'subscription_payment_legacy'));
    END LOOP;
  END IF;
END $$;--> statement-breakpoint
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
