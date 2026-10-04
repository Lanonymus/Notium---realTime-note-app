ALTER TABLE "projects" ADD COLUMN "cover_prompt" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_image_status" text DEFAULT 'not_requested' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_image_key" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_image_mime_type" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_image_error_code" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_image_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_image_retry_after" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_image_lease_token" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_image_lease_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_image_updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_image_status_check" CHECK ("projects"."cover_image_status" in ('not_requested', 'pending', 'generating', 'ready', 'failed'));--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_image_ready_check" CHECK ("projects"."cover_image_status" <> 'ready' or "projects"."cover_image_key" is not null);--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_cover_image_attempts_check" CHECK ("projects"."cover_image_attempts" >= 0);