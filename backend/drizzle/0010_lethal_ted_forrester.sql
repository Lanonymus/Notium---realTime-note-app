CREATE TABLE "voice_samples" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cache_key" text NOT NULL,
	"provider" text NOT NULL,
	"model_id" text NOT NULL,
	"voice_id" text NOT NULL,
	"language_id" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"storage_key" text,
	"mime_type" text DEFAULT 'audio/wav' NOT NULL,
	"lease_token" uuid,
	"lease_expires_at" timestamp with time zone,
	"retry_after" timestamp with time zone,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error_code" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "voice_samples_status_check" CHECK ("voice_samples"."status" in ('pending', 'ready', 'failed')),
	CONSTRAINT "voice_samples_ready_check" CHECK ("voice_samples"."status" <> 'ready' or "voice_samples"."storage_key" is not null),
	CONSTRAINT "voice_samples_attempts_check" CHECK ("voice_samples"."attempts" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "voice_samples_cache_key_unique" ON "voice_samples" USING btree ("cache_key");