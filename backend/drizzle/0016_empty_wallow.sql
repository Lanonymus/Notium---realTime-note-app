ALTER TABLE "learning_sessions" DROP CONSTRAINT "learning_sessions_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD COLUMN "resource_id" text;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD COLUMN "ended_reason" text;--> statement-breakpoint
ALTER TABLE "learning_sessions" ADD CONSTRAINT "learning_sessions_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE set null ON UPDATE no action;