CREATE TYPE "public"."access_action" AS ENUM('consultation', 'televersement', 'suppression', 'ouverture_dossier');--> statement-breakpoint
CREATE TYPE "public"."area_level" AS ENUM('region', 'departement', 'commune', 'quartier');--> statement-breakpoint
CREATE TYPE "public"."document_kind" AS ENUM('piece_identite', 'photo', 'justificatif', 'autre');--> statement-breakpoint
CREATE TYPE "public"."dossier_status" AS ENUM('en_attente', 'en_cours', 'verifie', 'refuse', 'suspendu');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('femme', 'homme');--> statement-breakpoint
CREATE TYPE "public"."incident_status" AS ENUM('ouvert', 'en_cours', 'resolu');--> statement-breakpoint
CREATE TYPE "public"."placement_status" AS ENUM('rencontre_demandee', 'rencontre_prevue', 'essai', 'confirme', 'termine', 'annule');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('ouverte', 'pourvue', 'fermee');--> statement-breakpoint
CREATE TYPE "public"."search_mode" AS ENUM('autour', 'zone');--> statement-breakpoint
CREATE TYPE "public"."step_status" AS ENUM('a_faire', 'fait', 'echec');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('famille', 'prestataire', 'agent', 'admin');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('actif', 'suspendu');--> statement-breakpoint
CREATE TABLE "access_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" "access_action" NOT NULL,
	"document_id" uuid,
	"worker_profile_id" uuid,
	"ip" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_id" uuid,
	"level" "area_level" NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"path_ids" uuid[] NOT NULL,
	"centroid" "geo_point" NOT NULL,
	"boundary" "geo_multipolygon",
	"is_open" boolean DEFAULT false NOT NULL,
	"wikidata_id" text,
	CONSTRAINT "areas_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_profile_id" uuid NOT NULL,
	"verification_step_id" uuid,
	"kind" "document_kind" NOT NULL,
	"storage_key" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"label" text,
	"uploaded_by_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "documents_storageKey_unique" UNIQUE("storage_key")
);
--> statement-breakpoint
CREATE TABLE "family_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"display_name" text NOT NULL,
	"area_id" uuid,
	"phone_verified_at" timestamp with time zone NOT NULL,
	"commitments_accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "family_profiles_userId_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "incidents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_id" uuid NOT NULL,
	"placement_id" uuid,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"status" "incident_status" DEFAULT 'ouvert' NOT NULL,
	"admin_notes" text,
	"handled_by_id" uuid,
	"resolved_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" smallint DEFAULT 0 NOT NULL,
	"consumed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"worker_service_id" uuid NOT NULL,
	"family_user_id" uuid NOT NULL,
	"worker_profile_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"formula_key" text NOT NULL,
	"status" "placement_status" DEFAULT 'rencontre_demandee' NOT NULL,
	"family_message" text,
	"meeting_at" timestamp with time zone,
	"meeting_place" text,
	"start_date" date,
	"end_date" date,
	"agreed_monthly_fcfa" integer,
	"agreed_daily_fcfa" integer,
	"rest_days" text[],
	"conditions" text,
	"family_accepted_at" timestamp with time zone,
	"worker_accepted_at" timestamp with time zone,
	"guarantee_ends_at" date,
	"follow_up_due_at" date,
	"follow_up_done_at" timestamp with time zone,
	"follow_up_notes" text,
	"follow_up_by_id" uuid,
	"scheduled_at" timestamp with time zone,
	"trial_started_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"end_reason" text,
	"replaces_placement_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_user_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"formula_key" text NOT NULL,
	"answers" jsonb NOT NULL,
	"search_mode" "search_mode" NOT NULL,
	"area_id" uuid NOT NULL,
	"location" "geo_point" NOT NULL,
	"radius_km" smallint,
	"status" "request_status" DEFAULT 'ouverte' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"placement_id" uuid NOT NULL,
	"author_id" uuid NOT NULL,
	"target_user_id" uuid NOT NULL,
	"author_role" "user_role" NOT NULL,
	"rating" smallint NOT NULL,
	"comment" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_rating_range" CHECK ("reviews"."rating" between 1 and 5)
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"icon" text NOT NULL,
	"hue" text NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"config" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "services_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_tokenHash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by_id" uuid
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"role" "user_role" NOT NULL,
	"status" "user_status" DEFAULT 'actif' NOT NULL,
	"name" text,
	"consent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_login_at" timestamp with time zone,
	CONSTRAINT "users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "verification_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_service_id" uuid NOT NULL,
	"type" text NOT NULL,
	"sort_order" smallint NOT NULL,
	"status" "step_status" DEFAULT 'a_faire' NOT NULL,
	"notes" text,
	"agent_id" uuid,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone" text NOT NULL,
	"user_id" uuid,
	"area_id" uuid NOT NULL,
	"service_id" uuid,
	"formula_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"notified_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "worker_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"gender" "gender" NOT NULL,
	"birth_year" smallint NOT NULL,
	"languages" text[] DEFAULT '{}'::text[] NOT NULL,
	"experience_years" smallint DEFAULT 0 NOT NULL,
	"presentation" text,
	"area_id" uuid NOT NULL,
	"location" "geo_point" NOT NULL,
	"intervention_radius_km" smallint DEFAULT 5 NOT NULL,
	"accepted_area_ids" uuid[] DEFAULT '{}'::uuid[] NOT NULL,
	"willing_to_relocate" boolean DEFAULT false NOT NULL,
	"available_from" date,
	"monthly_rate_fcfa" integer,
	"daily_rate_fcfa" integer,
	"card_id" text NOT NULL,
	"rating_avg" real,
	"rating_count" integer DEFAULT 0 NOT NULL,
	"photo_key" text,
	"consent_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "worker_profiles_userId_unique" UNIQUE("user_id"),
	CONSTRAINT "worker_profiles_cardId_unique" UNIQUE("card_id")
);
--> statement-breakpoint
CREATE TABLE "worker_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"worker_profile_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"formula_keys" text[] NOT NULL,
	"skills" text[] DEFAULT '{}'::text[] NOT NULL,
	"status" "dossier_status" DEFAULT 'en_attente' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"verified_at" timestamp with time zone,
	"decision_reason" text,
	"decided_at" timestamp with time zone,
	"decided_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "areas" ADD CONSTRAINT "areas_parent_id_areas_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_verification_step_id_verification_steps_id_fk" FOREIGN KEY ("verification_step_id") REFERENCES "public"."verification_steps"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_id_users_id_fk" FOREIGN KEY ("uploaded_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_profiles" ADD CONSTRAINT "family_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "family_profiles" ADD CONSTRAINT "family_profiles_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_reporter_id_users_id_fk" FOREIGN KEY ("reporter_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_handled_by_id_users_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_request_id_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_worker_service_id_worker_services_id_fk" FOREIGN KEY ("worker_service_id") REFERENCES "public"."worker_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_family_user_id_users_id_fk" FOREIGN KEY ("family_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_follow_up_by_id_users_id_fk" FOREIGN KEY ("follow_up_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placements" ADD CONSTRAINT "placements_replaces_placement_id_placements_id_fk" FOREIGN KEY ("replaces_placement_id") REFERENCES "public"."placements"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_family_user_id_users_id_fk" FOREIGN KEY ("family_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requests" ADD CONSTRAINT "requests_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_placement_id_placements_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_id_users_id_fk" FOREIGN KEY ("updated_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_steps" ADD CONSTRAINT "verification_steps_worker_service_id_worker_services_id_fk" FOREIGN KEY ("worker_service_id") REFERENCES "public"."worker_services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_steps" ADD CONSTRAINT "verification_steps_agent_id_users_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "waitlist" ADD CONSTRAINT "waitlist_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_area_id_areas_id_fk" FOREIGN KEY ("area_id") REFERENCES "public"."areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_services" ADD CONSTRAINT "worker_services_worker_profile_id_worker_profiles_id_fk" FOREIGN KEY ("worker_profile_id") REFERENCES "public"."worker_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_services" ADD CONSTRAINT "worker_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "worker_services" ADD CONSTRAINT "worker_services_decided_by_id_users_id_fk" FOREIGN KEY ("decided_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_logs_at_index" ON "access_logs" USING btree ("at");--> statement-breakpoint
CREATE INDEX "access_logs_worker_profile_id_index" ON "access_logs" USING btree ("worker_profile_id");--> statement-breakpoint
CREATE INDEX "areas_parent_id_index" ON "areas" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "areas_level_index" ON "areas" USING btree ("level");--> statement-breakpoint
CREATE INDEX "areas_centroid_index" ON "areas" USING gist ("centroid");--> statement-breakpoint
CREATE INDEX "areas_path_ids_index" ON "areas" USING gin ("path_ids");--> statement-breakpoint
CREATE INDEX "documents_worker_profile_id_index" ON "documents" USING btree ("worker_profile_id");--> statement-breakpoint
CREATE INDEX "incidents_status_index" ON "incidents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "otp_codes_phone_created_at_index" ON "otp_codes" USING btree ("phone","created_at");--> statement-breakpoint
CREATE INDEX "placements_family_user_id_index" ON "placements" USING btree ("family_user_id");--> statement-breakpoint
CREATE INDEX "placements_worker_profile_id_index" ON "placements" USING btree ("worker_profile_id");--> statement-breakpoint
CREATE INDEX "placements_status_index" ON "placements" USING btree ("status");--> statement-breakpoint
CREATE INDEX "placements_request_id_index" ON "placements" USING btree ("request_id");--> statement-breakpoint
CREATE INDEX "requests_family_user_id_index" ON "requests" USING btree ("family_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "reviews_placement_id_author_id_index" ON "reviews" USING btree ("placement_id","author_id");--> statement-breakpoint
CREATE INDEX "reviews_target_user_id_index" ON "reviews" USING btree ("target_user_id");--> statement-breakpoint
CREATE INDEX "sessions_user_id_index" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "verification_steps_worker_service_id_type_index" ON "verification_steps" USING btree ("worker_service_id","type");--> statement-breakpoint
CREATE UNIQUE INDEX "waitlist_phone_area_id_service_id_index" ON "waitlist" USING btree ("phone","area_id","service_id");--> statement-breakpoint
CREATE INDEX "worker_profiles_location_index" ON "worker_profiles" USING gist ("location");--> statement-breakpoint
CREATE INDEX "worker_profiles_area_id_index" ON "worker_profiles" USING btree ("area_id");--> statement-breakpoint
CREATE INDEX "worker_profiles_accepted_area_ids_index" ON "worker_profiles" USING gin ("accepted_area_ids");--> statement-breakpoint
CREATE UNIQUE INDEX "worker_services_worker_profile_id_service_id_index" ON "worker_services" USING btree ("worker_profile_id","service_id");--> statement-breakpoint
CREATE INDEX "worker_services_status_index" ON "worker_services" USING btree ("status");