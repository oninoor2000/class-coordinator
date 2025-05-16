CREATE TYPE "public"."class_type" AS ENUM('theory', 'practicum', 'midterm-exams', 'end-of-semester-exams');--> statement-breakpoint
CREATE TYPE "public"."course_type" AS ENUM('practicum', 'theory');--> statement-breakpoint
CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TYPE "public"."file_type" AS ENUM('img', 'pdf');--> statement-breakpoint
CREATE TYPE "public"."gender" AS ENUM('male', 'female', 'other');--> statement-breakpoint
CREATE TYPE "public"."meeting_type" AS ENUM('online', 'offline', 'hybrid');--> statement-breakpoint
CREATE TYPE "public"."period" AS ENUM('1', '2');--> statement-breakpoint
CREATE TYPE "public"."platform" AS ENUM('google-meet', 'zoom', 'youtube');--> statement-breakpoint
CREATE TYPE "public"."position" AS ENUM('coordinator', 'lecturer', 'student');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TABLE "bsi_accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"type" varchar(500) NOT NULL,
	"provider" varchar(500) NOT NULL,
	"providerAccountId" varchar(500) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" timestamp with time zone,
	"id_token" text,
	"scope" text,
	"session_state" text,
	"token_type" text
);
--> statement-breakpoint
CREATE TABLE "bsi_class_to_course" (
	"id" serial PRIMARY KEY NOT NULL,
	"class_id" serial NOT NULL,
	"course_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bsi_class_to_participant" (
	"id" serial PRIMARY KEY NOT NULL,
	"coordinator_id" serial NOT NULL,
	"class_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bsi_classes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"total_student" integer,
	"semester" integer,
	CONSTRAINT "bsi_classes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "bsi_courses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"semester" integer,
	"sks" integer,
	"course_type" "course_type" DEFAULT 'theory' NOT NULL,
	CONSTRAINT "bsi_courses_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "bsi_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"timezone" varchar(50),
	"color" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "bsi_exam_coordinators" (
	"id" serial PRIMARY KEY NOT NULL,
	"lecturer_id" serial NOT NULL,
	"question_submitted" timestamp with time zone,
	"question_sub_reminder_sent" integer,
	"grade_submitted" timestamp with time zone,
	"grade_sub_reminder_sent" integer,
	"exam_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bsi_exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"subject_id" serial NOT NULL,
	"question_sub_deadline" timestamp with time zone NOT NULL,
	"grading_sub_deadline" timestamp with time zone NOT NULL,
	"period" "period" NOT NULL,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bsi_files" (
	"id" text PRIMARY KEY NOT NULL,
	"uploader_id" serial NOT NULL,
	"name" varchar(500),
	"description" varchar(500),
	"url" text NOT NULL,
	"file_type" "file_type" DEFAULT 'img' NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bsi_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"platform" "platform" NOT NULL,
	"name" varchar(500) NOT NULL,
	"url" varchar(500) NOT NULL,
	"shortened_url" varchar(500) NOT NULL,
	"meeting_username" varchar(500),
	"meeting_password" varchar(500),
	"description" text,
	"qr_img_id" text,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bsi_locations" (
	"id" varchar(500) PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"description" varchar(500),
	"capacity" integer,
	"image_id" text
);
--> statement-breakpoint
CREATE TABLE "bsi_office_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"timezone_id" serial NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"start_time" time with time zone NOT NULL,
	"end_time" time with time zone NOT NULL,
	"is_active" boolean NOT NULL,
	CONSTRAINT "bsi_office_hours_day_of_week_unique" UNIQUE("day_of_week")
);
--> statement-breakpoint
CREATE TABLE "bsi_participants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"gender" "gender" NOT NULL,
	"phone" varchar(500) NOT NULL,
	"position" "position" NOT NULL,
	"image" text,
	"email" varchar(500),
	"organization" varchar(500),
	"user_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bsi_schedule_exeption_req" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" serial NOT NULL,
	"timezone_id" serial NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"start" timestamp with time zone NOT NULL,
	"end" timestamp with time zone NOT NULL,
	"exception_end" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bsi_schedule_to_link" (
	"id" serial PRIMARY KEY NOT NULL,
	"schedule_id" text NOT NULL,
	"meeting_link_id" serial NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bsi_schedules" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(500) NOT NULL,
	"description" text,
	"creator_id" serial NOT NULL,
	"events_id" serial NOT NULL,
	"start" timestamp with time zone NOT NULL,
	"end" timestamp with time zone NOT NULL,
	"class_type" "class_type" NOT NULL,
	"meeting_type" "meeting_type" NOT NULL,
	"recurrence" varchar(500),
	"recurring_id" text,
	"sequence" integer,
	"ical_uid" text,
	"color" varchar(500),
	"location_id" varchar(500),
	"class_id" serial NOT NULL,
	"subject_id" serial NOT NULL,
	"created_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "bsi_sessions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" serial NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"sessionToken" varchar(500) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bsi_timezones" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500) NOT NULL,
	"offset" varchar(500) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bsi_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(500),
	"email" varchar(500),
	"emailVerified" timestamp with time zone,
	"image_id" text,
	"password" text,
	"role" "role",
	"phone" varchar(500),
	CONSTRAINT "bsi_users_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "bsi_verification_token" (
	"identifier" text PRIMARY KEY NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"token" text NOT NULL,
	CONSTRAINT "bsi_verification_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE INDEX "class_to_course_idx" ON "bsi_class_to_course" USING btree ("course_id","class_id");--> statement-breakpoint
CREATE INDEX "class_to_participant_idx" ON "bsi_class_to_participant" USING btree ("coordinator_id","class_id");--> statement-breakpoint
CREATE INDEX "class_name_idx" ON "bsi_classes" USING btree ("name");--> statement-breakpoint
CREATE INDEX "class_semester_idx" ON "bsi_classes" USING btree ("semester");--> statement-breakpoint
CREATE INDEX "subject_name_idx" ON "bsi_courses" USING btree ("name");--> statement-breakpoint
CREATE INDEX "subject_type_idx" ON "bsi_courses" USING btree ("course_type");--> statement-breakpoint
CREATE INDEX "subject_semester_idx" ON "bsi_courses" USING btree ("semester");--> statement-breakpoint
CREATE INDEX "subject_name_type_semester_idx" ON "bsi_courses" USING btree ("name","semester","course_type");--> statement-breakpoint
CREATE INDEX "event_name_idx" ON "bsi_events" USING btree ("name");--> statement-breakpoint
CREATE INDEX "event_timezone_idx" ON "bsi_events" USING btree ("timezone");--> statement-breakpoint
CREATE INDEX "exam_coord_question_sumitted_idx" ON "bsi_exam_coordinators" USING btree ("question_submitted");--> statement-breakpoint
CREATE INDEX "exam_coord_question_submitted_sent_idx" ON "bsi_exam_coordinators" USING btree ("question_sub_reminder_sent");--> statement-breakpoint
CREATE INDEX "exam_coord_grade_submitted_idx" ON "bsi_exam_coordinators" USING btree ("grade_submitted");--> statement-breakpoint
CREATE INDEX "exam_coord_grade_submitted_sent_idx" ON "bsi_exam_coordinators" USING btree ("grade_sub_reminder_sent");--> statement-breakpoint
CREATE INDEX "exam_coord_exam_id_idx" ON "bsi_exam_coordinators" USING btree ("exam_id");--> statement-breakpoint
CREATE INDEX "exam_coord_lecurer_id_idx" ON "bsi_exam_coordinators" USING btree ("lecturer_id");--> statement-breakpoint
CREATE INDEX "exam_subject_idx" ON "bsi_exams" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "exam_question_sub_deadline_idx" ON "bsi_exams" USING btree ("question_sub_deadline");--> statement-breakpoint
CREATE INDEX "exam_grading_sub_deadline_idx" ON "bsi_exams" USING btree ("grading_sub_deadline");--> statement-breakpoint
CREATE INDEX "exam_period_year_idx" ON "bsi_exams" USING btree ("period","year");--> statement-breakpoint
CREATE INDEX "file_user_idx" ON "bsi_files" USING btree ("uploader_id");--> statement-breakpoint
CREATE INDEX "file_identity_idx" ON "bsi_files" USING btree ("name","description");--> statement-breakpoint
CREATE INDEX "file_type_idx" ON "bsi_files" USING btree ("file_type");--> statement-breakpoint
CREATE INDEX "link_platform_idx" ON "bsi_links" USING btree ("platform");--> statement-breakpoint
CREATE INDEX "link_name_idx" ON "bsi_links" USING btree ("name");--> statement-breakpoint
CREATE INDEX "link_url_idx" ON "bsi_links" USING btree ("url","shortened_url");--> statement-breakpoint
CREATE INDEX "room_name_idx" ON "bsi_locations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "room_name_capacity_idx" ON "bsi_locations" USING btree ("name","capacity");--> statement-breakpoint
CREATE INDEX "office_hours_day_of_week_idx" ON "bsi_office_hours" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "office_hours_time_idx" ON "bsi_office_hours" USING btree ("start_time","end_time");--> statement-breakpoint
CREATE INDEX "office_hours_active_idx" ON "bsi_office_hours" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "participants_name_idx" ON "bsi_participants" USING btree ("name");--> statement-breakpoint
CREATE INDEX "participants_phone_idx" ON "bsi_participants" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "participants_user_id_idx" ON "bsi_participants" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "participants_position_idx" ON "bsi_participants" USING btree ("position");--> statement-breakpoint
CREATE INDEX "sched_except_userid_idx" ON "bsi_schedule_exeption_req" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sched_except_day_idx" ON "bsi_schedule_exeption_req" USING btree ("day_of_week");--> statement-breakpoint
CREATE INDEX "sched_except_ended_idx" ON "bsi_schedule_exeption_req" USING btree ("exception_end");--> statement-breakpoint
CREATE INDEX "schedule_to_link_idx" ON "bsi_schedule_to_link" USING btree ("schedule_id","meeting_link_id");--> statement-breakpoint
CREATE INDEX "schedule_event_idx" ON "bsi_schedules" USING btree ("events_id");--> statement-breakpoint
CREATE INDEX "schedule_time_idx" ON "bsi_schedules" USING btree ("start","end");--> statement-breakpoint
CREATE INDEX "schedule_event_type_idx" ON "bsi_schedules" USING btree ("class_type");--> statement-breakpoint
CREATE INDEX "schedule_recurring_idx" ON "bsi_schedules" USING btree ("recurring_id");--> statement-breakpoint
CREATE INDEX "schedule_ical_idx" ON "bsi_schedules" USING btree ("ical_uid");--> statement-breakpoint
CREATE INDEX "schedule_location_idx " ON "bsi_schedules" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "schedule_class_idx" ON "bsi_schedules" USING btree ("class_id");--> statement-breakpoint
CREATE INDEX "schedule_subject_idx" ON "bsi_schedules" USING btree ("subject_id");--> statement-breakpoint
CREATE INDEX "schedule_filter_idx" ON "bsi_schedules" USING btree ("location_id","class_id","subject_id","class_type","meeting_type");--> statement-breakpoint
CREATE INDEX "schedule_meeting_type_idx" ON "bsi_schedules" USING btree ("meeting_type");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "bsi_sessions" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "timezone_name_idx" ON "bsi_timezones" USING btree ("name");--> statement-breakpoint
CREATE INDEX "timezone_offset_idx" ON "bsi_timezones" USING btree ("offset");--> statement-breakpoint
CREATE INDEX "user_name_idx" ON "bsi_users" USING btree ("name");--> statement-breakpoint
CREATE INDEX "user_email_and_verified_idx" ON "bsi_users" USING btree ("email","emailVerified");--> statement-breakpoint
CREATE INDEX "user_role_idx" ON "bsi_users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "user_phone_and_verified_idx" ON "bsi_users" USING btree ("phone");--> statement-breakpoint
CREATE INDEX "verification_token_identifier_idx" ON "bsi_verification_token" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "verification_token_token_idx" ON "bsi_verification_token" USING btree ("token");--> statement-breakpoint
CREATE INDEX "verification_token_expires_idx" ON "bsi_verification_token" USING btree ("expires");