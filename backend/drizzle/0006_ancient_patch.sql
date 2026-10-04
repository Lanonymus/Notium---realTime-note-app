ALTER TABLE "projects" ADD COLUMN "icon" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "type" text NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "resources" jsonb DEFAULT '{"hasNotes":false,"hasQuiz":false,"hasFlashcards":false,"hasPodcast":false}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "flashcards_mastered" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "total_flashcards" integer DEFAULT 0 NOT NULL;