CREATE TABLE "project_skills" (
	"project_id" uuid NOT NULL,
	"skill_key" text NOT NULL,
	"detected_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_skills_project_id_skill_key_pk" PRIMARY KEY("project_id","skill_key")
);
--> statement-breakpoint
CREATE TABLE "skill_catalog" (
	"key" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"category" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_skills" ADD CONSTRAINT "project_skills_skill_key_skill_catalog_key_fk" FOREIGN KEY ("skill_key") REFERENCES "public"."skill_catalog"("key") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "project_skills_detected_idx" ON "project_skills" USING btree ("detected_at");