CREATE TABLE "collection" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collection_item" (
	"collection_id" text NOT NULL,
	"sloka_slug" text NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "collection_item_collection_id_sloka_slug_pk" PRIMARY KEY("collection_id","sloka_slug")
);
--> statement-breakpoint
CREATE TABLE "sloka_note" (
	"user_id" text NOT NULL,
	"sloka_slug" text NOT NULL,
	"body" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sloka_note_user_id_sloka_slug_pk" PRIMARY KEY("user_id","sloka_slug")
);
--> statement-breakpoint
ALTER TABLE "user_prefs" ADD COLUMN "script" text DEFAULT 'devanagari' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_prefs" ADD COLUMN "meaning_lang" text DEFAULT 'en' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_prefs" ADD COLUMN "goal" text;--> statement-breakpoint
ALTER TABLE "user_prefs" ADD COLUMN "reminder_hour" integer;--> statement-breakpoint
ALTER TABLE "user_prefs" ADD COLUMN "last_reminder_day" text;--> statement-breakpoint
ALTER TABLE "collection" ADD CONSTRAINT "collection_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collection_item" ADD CONSTRAINT "collection_item_collection_id_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."collection"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sloka_note" ADD CONSTRAINT "sloka_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collection_user_idx" ON "collection" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collection_user_name_idx" ON "collection" USING btree ("user_id",lower("name"));