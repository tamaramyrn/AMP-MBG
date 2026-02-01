CREATE TYPE "public"."credibility_level" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."kitchen_needs_status" AS ENUM('pending', 'processed', 'completed', 'not_found');--> statement-breakpoint
CREATE TYPE "public"."member_type" AS ENUM('supplier', 'caterer', 'school', 'government', 'foundation', 'ngo', 'farmer', 'other');--> statement-breakpoint
CREATE TYPE "public"."relation" AS ENUM('parent', 'teacher', 'principal', 'supplier', 'student', 'community', 'other');--> statement-breakpoint
CREATE TYPE "public"."report_category" AS ENUM('poisoning', 'kitchen', 'quality', 'policy', 'implementation', 'social');--> statement-breakpoint
CREATE TYPE "public"."report_status" AS ENUM('pending', 'analyzing', 'needs_evidence', 'invalid', 'in_progress', 'resolved');--> statement-breakpoint
CREATE TABLE "admin_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"admin_id" uuid NOT NULL,
	"token" text NOT NULL,
	"user_agent" varchar(500),
	"ip_address" varchar(45),
	"is_revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(15),
	"admin_role" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "cities" (
	"id" varchar(5) PRIMARY KEY NOT NULL,
	"province_id" varchar(2) NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "districts" (
	"id" varchar(8) PRIMARY KEY NOT NULL,
	"city_id" varchar(5) NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kitchen_needs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"image_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "kitchen_needs_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"kitchen_need_id" uuid,
	"sppg_name" varchar(255) NOT NULL,
	"contact_person" varchar(255) NOT NULL,
	"position" varchar(100) NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"details" text NOT NULL,
	"status" "kitchen_needs_status" DEFAULT 'pending' NOT NULL,
	"admin_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mbg_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_name" varchar(255) NOT NULL,
	"province_id" varchar(2) NOT NULL,
	"city_id" varchar(5) NOT NULL,
	"district_id" varchar(8),
	"address" text,
	"schedule_days" varchar(10) DEFAULT '12345' NOT NULL,
	"start_time" varchar(5) DEFAULT '07:00' NOT NULL,
	"end_time" varchar(5) DEFAULT '12:00' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"member_type" "member_type" NOT NULL,
	"organization_name" varchar(255) NOT NULL,
	"organization_email" varchar(255),
	"organization_phone" varchar(20),
	"role_in_organization" text,
	"organization_mbg_role" text,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp,
	"verified_by" uuid,
	"applied_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "members_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "password_reset_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "provinces" (
	"id" varchar(2) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_type" varchar(50) NOT NULL,
	"file_size" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "report_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"from_status" "report_status",
	"to_status" "report_status" NOT NULL,
	"changed_by" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"category" "report_category" NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"location" varchar(255) NOT NULL,
	"province_id" varchar(2) NOT NULL,
	"city_id" varchar(5) NOT NULL,
	"district_id" varchar(8),
	"incident_date" timestamp NOT NULL,
	"status" "report_status" DEFAULT 'pending' NOT NULL,
	"relation" "relation" NOT NULL,
	"relation_detail" varchar(255),
	"score_relation" smallint DEFAULT 0 NOT NULL,
	"score_location_time" smallint DEFAULT 0 NOT NULL,
	"score_evidence" smallint DEFAULT 0 NOT NULL,
	"score_narrative" smallint DEFAULT 0 NOT NULL,
	"score_reporter_history" smallint DEFAULT 0 NOT NULL,
	"score_similarity" smallint DEFAULT 0 NOT NULL,
	"total_score" smallint DEFAULT 0 NOT NULL,
	"credibility_level" "credibility_level" DEFAULT 'low' NOT NULL,
	"admin_notes" text,
	"verified_by" uuid,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token" text NOT NULL,
	"user_agent" varchar(500),
	"ip_address" varchar(45),
	"is_revoked" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user_google_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"google_id" varchar(255) NOT NULL,
	"google_email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_google_accounts_google_id_unique" UNIQUE("google_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"phone" varchar(15),
	"password" text,
	"name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"report_count" integer DEFAULT 0 NOT NULL,
	"verified_report_count" integer DEFAULT 0 NOT NULL,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
ALTER TABLE "admin_sessions" ADD CONSTRAINT "admin_sessions_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cities" ADD CONSTRAINT "cities_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "districts" ADD CONSTRAINT "districts_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_needs_requests" ADD CONSTRAINT "kitchen_needs_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "kitchen_needs_requests" ADD CONSTRAINT "kitchen_needs_requests_kitchen_need_id_kitchen_needs_id_fk" FOREIGN KEY ("kitchen_need_id") REFERENCES "public"."kitchen_needs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mbg_schedules" ADD CONSTRAINT "mbg_schedules_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mbg_schedules" ADD CONSTRAINT "mbg_schedules_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mbg_schedules" ADD CONSTRAINT "mbg_schedules_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_verified_by_admins_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_files" ADD CONSTRAINT "report_files_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_report_id_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "report_status_history" ADD CONSTRAINT "report_status_history_changed_by_admins_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_province_id_provinces_id_fk" FOREIGN KEY ("province_id") REFERENCES "public"."provinces"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_city_id_cities_id_fk" FOREIGN KEY ("city_id") REFERENCES "public"."cities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_district_id_districts_id_fk" FOREIGN KEY ("district_id") REFERENCES "public"."districts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reports" ADD CONSTRAINT "reports_verified_by_admins_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."admins"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_google_accounts" ADD CONSTRAINT "user_google_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_sessions_admin_idx" ON "admin_sessions" USING btree ("admin_id");--> statement-breakpoint
CREATE INDEX "admin_sessions_token_idx" ON "admin_sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "cities_province_idx" ON "cities" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "districts_city_idx" ON "districts" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "kitchen_needs_requests_status_idx" ON "kitchen_needs_requests" USING btree ("status");--> statement-breakpoint
CREATE INDEX "mbg_schedules_province_idx" ON "mbg_schedules" USING btree ("province_id");--> statement-breakpoint
CREATE INDEX "mbg_schedules_city_idx" ON "mbg_schedules" USING btree ("city_id");--> statement-breakpoint
CREATE INDEX "members_user_idx" ON "members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "members_is_verified_idx" ON "members" USING btree ("is_verified");--> statement-breakpoint
CREATE INDEX "password_reset_token_idx" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "report_files_report_idx" ON "report_files" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "status_history_report_idx" ON "report_status_history" USING btree ("report_id");--> statement-breakpoint
CREATE INDEX "reports_user_idx" ON "reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "reports_status_idx" ON "reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reports_created_at_idx" ON "reports" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "reports_credibility_idx" ON "reports" USING btree ("credibility_level");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_token_idx" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "user_google_accounts_user_idx" ON "user_google_accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_google_accounts_google_id_idx" ON "user_google_accounts" USING btree ("google_id");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");