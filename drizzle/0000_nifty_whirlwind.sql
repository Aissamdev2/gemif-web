CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'dev');--> statement-breakpoint
CREATE TYPE "public"."scope" AS ENUM('user', 'admin', 'dev');--> statement-breakpoint
CREATE TYPE "public"."tools-and-simulations-type" AS ENUM('tool', 'simulation');--> statement-breakpoint
CREATE TYPE "public"."verification-type" AS ENUM('verify', 'forgot');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"provider_account_id" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"date" date NOT NULL,
	"time" varchar(255),
	"scope" "scope" NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_id" uuid,
	"primitive_id" varchar(255) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"scope" "scope" NOT NULL,
	"year" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "primitive_subjects_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"new_data" jsonb NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "primitive_subjects" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"qual" real[] DEFAULT ARRAY[0,0]::real[],
	"diff" real[] DEFAULT ARRAY[0,0]::real[],
	"year" integer,
	"quadri" integer NOT NULL,
	"credits" real NOT NULL,
	"professors" varchar(255)[] DEFAULT '{}' NOT NULL,
	"emails" varchar(255)[] DEFAULT '{}' NOT NULL,
	"info" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "primitive_subjects_name_idx" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "primitive_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"used" boolean DEFAULT false NOT NULL,
	CONSTRAINT "primitive_users_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "resources_posts_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"subject_id" varchar(255) NOT NULL,
	"action" varchar(50) NOT NULL,
	"new_data" jsonb NOT NULL,
	"changed_by" uuid NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources_posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"filenames" text[] NOT NULL,
	"foldername" varchar(255) NOT NULL,
	"links" text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"anonymous" boolean DEFAULT false NOT NULL,
	"user_id" uuid NOT NULL,
	"subject_id" varchar(255) DEFAULT '11111111' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subjects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"archived" boolean DEFAULT false,
	"qual" real,
	"diff" real,
	"primitive_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tools_and_simulations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"href_name" varchar(255),
	"name" varchar(255) NOT NULL,
	"description" text,
	"type" "tools-and-simulations-type" NOT NULL,
	"link" text,
	"tags" varchar(255)[] DEFAULT '{}' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"anonymous" boolean DEFAULT false NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "tools_and_simulations_href_name_unique" UNIQUE("href_name")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"public_name" varchar(255),
	"year" varchar(255),
	"role" "role" NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"password" text,
	"primitive_id" uuid,
	"login_count" integer DEFAULT 0 NOT NULL,
	"last_seen" timestamp DEFAULT now() NOT NULL,
	"weekly_challenges_score" real DEFAULT 0 NOT NULL,
	"flags" jsonb DEFAULT '{"is_verified":false,"is_complete_user_info":false,"is_complete_subjects":false}'::jsonb NOT NULL,
	CONSTRAINT "users_email_idx" UNIQUE("email"),
	CONSTRAINT "users_name_idx" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" text NOT NULL,
	"type" "verification-type" NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weekly_challenge_answers" (
	"challenge_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"score" real,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "weekly_challenge_answers_challenge_id_user_id_pk" PRIMARY KEY("challenge_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "weekly_challenges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_multiple_choice" boolean DEFAULT false NOT NULL,
	"options" text[],
	"correct_answer" text[] DEFAULT ARRAY[]::text[],
	"suggested" boolean DEFAULT false NOT NULL,
	"difficulty" integer DEFAULT 3 NOT NULL,
	"deadline" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"user_id" uuid NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_subject_id_subjects_id_fk" FOREIGN KEY ("subject_id") REFERENCES "public"."subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources_posts" ADD CONSTRAINT "resources_posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_primitive_id_primitive_subjects_id_fk" FOREIGN KEY ("primitive_id") REFERENCES "public"."primitive_subjects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subjects" ADD CONSTRAINT "subjects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools_and_simulations" ADD CONSTRAINT "tools_and_simulations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_primitive_id_primitive_users_id_fk" FOREIGN KEY ("primitive_id") REFERENCES "public"."primitive_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_challenge_answers" ADD CONSTRAINT "weekly_challenge_answers_challenge_id_weekly_challenges_id_fk" FOREIGN KEY ("challenge_id") REFERENCES "public"."weekly_challenges"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_challenge_answers" ADD CONSTRAINT "weekly_challenge_answers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weekly_challenges" ADD CONSTRAINT "weekly_challenges_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_user_id_idx" ON "events" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "events_subject_id_idx" ON "events" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "events_date_idx" ON "events" USING btree ("date");--> statement-breakpoint
CREATE INDEX "events_scope_idx" ON "events" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "events_primitive_scope_idx" ON "events" USING btree ("primitive_id","scope");--> statement-breakpoint
CREATE INDEX "events_user_scope_idx" ON "events" USING btree ("user_id","scope");--> statement-breakpoint
CREATE INDEX "messages_user_id_idx" ON "messages" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "messages_created_at_idx" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "primitive_subjects_audit_changed_at_idx" ON "primitive_subjects_audit" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "primitive_subjects_audit_subject_id_changed_at_idx" ON "primitive_subjects_audit" USING btree ("subject_id","changed_at");--> statement-breakpoint
CREATE INDEX "primitive_users_name_idx" ON "primitive_users" USING btree ("name");--> statement-breakpoint
CREATE INDEX "resources_posts_audit_changed_at_idx" ON "resources_posts_audit" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "resources_posts_audit_subject_id_changed_at_idx" ON "resources_posts_audit" USING btree ("subject_id","changed_at");--> statement-breakpoint
CREATE INDEX "main_posts_user_id_idx" ON "resources_posts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subjects_primitive_id_idx" ON "subjects" USING btree ("primitive_id");--> statement-breakpoint
CREATE INDEX "subjects_user_id_idx" ON "subjects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "subjects_user_primitive_idx" ON "subjects" USING btree ("user_id","primitive_id");--> statement-breakpoint
CREATE INDEX "users_year_idx" ON "users" USING btree ("year");--> statement-breakpoint
CREATE INDEX "verification_tokens_user_type_expires_idx" ON "verification_tokens" USING btree ("user_id","type","expires");--> statement-breakpoint
CREATE INDEX "verification_tokens_type_expires_idx" ON "verification_tokens" USING btree ("type","expires");--> statement-breakpoint
CREATE INDEX "weekly_answers_challenge_id_idx" ON "weekly_challenge_answers" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "weekly_answers_user_id_idx" ON "weekly_challenge_answers" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "weekly_challenges_user_id_idx" ON "weekly_challenges" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "weekly_challenges_difficulty_idx" ON "weekly_challenges" USING btree ("difficulty");--> statement-breakpoint
CREATE INDEX "weekly_challenges_deadline_idx" ON "weekly_challenges" USING btree ("deadline");