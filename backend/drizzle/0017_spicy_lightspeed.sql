ALTER TABLE "activity_segments" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "activity_segments" CASCADE;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "activities_completed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "learning_sessions_user_started_idx" ON "learning_sessions" USING btree ("userId","started_at");