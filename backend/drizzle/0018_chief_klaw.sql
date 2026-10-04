CREATE TABLE "activity_completions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" uuid,
	"resource_id" text,
	"attempt_id" uuid NOT NULL,
	"activity_type" text NOT NULL,
	"correct_answers" integer,
	"total_questions" integer,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity_completions" ADD CONSTRAINT "activity_completions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity_completions" ADD CONSTRAINT "activity_completions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "activity_completions_user_attempt_unique" ON "activity_completions" USING btree ("user_id","attempt_id");--> statement-breakpoint
CREATE INDEX "activity_completions_user_date_idx" ON "activity_completions" USING btree ("user_id","completed_at");--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "activities_completed";