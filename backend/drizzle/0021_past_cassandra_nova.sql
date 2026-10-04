ALTER TABLE "users" ALTER COLUMN "auth_provider" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_profile" jsonb;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "onboarding_completed_at" timestamp with time zone;