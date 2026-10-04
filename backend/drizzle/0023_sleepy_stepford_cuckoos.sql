CREATE TABLE "google_oauth_transactions" (
	"state_hash" text PRIMARY KEY NOT NULL,
	"browser_secret_hash" text NOT NULL,
	"mode" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"nonce" text,
	"code_verifier" text,
	"profile" jsonb,
	"consent_request_id" text,
	"result" jsonb,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "google_oauth_transactions_expires_at_idx" ON "google_oauth_transactions" USING btree ("expires_at");