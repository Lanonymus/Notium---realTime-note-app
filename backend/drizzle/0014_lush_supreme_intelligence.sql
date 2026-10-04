CREATE TABLE "streak_days" (
	"user_id" uuid NOT NULL,
	"activity_date" date NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"type" text DEFAULT 'activity' NOT NULL,
	CONSTRAINT "streak_days_user_id_activity_date_pk" PRIMARY KEY("user_id","activity_date")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_streak_date" date;--> statement-breakpoint
ALTER TABLE "streak_days" ADD CONSTRAINT "streak_days_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "has_used_freeze_today";