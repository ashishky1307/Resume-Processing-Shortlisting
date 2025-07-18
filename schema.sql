CREATE TABLE "candidates" (
  "candidate_id" int NOT NULL AUTO_INCREMENT,
  "full_name" varchar(255) NOT NULL,
  "email" varchar(255) DEFAULT NULL,
  "phone" varchar(50) DEFAULT NULL,
  "location" varchar(255) DEFAULT NULL,
  "years_experience" int DEFAULT NULL,
  "resume_file_path" varchar(1000) DEFAULT NULL,
  "resume_s3_url" varchar(1000) DEFAULT NULL,
  "original_filename" varchar(255) DEFAULT NULL,
  "status" enum('PENDING','SHORTLISTED','REJECTED') DEFAULT NULL,
  "created_at" datetime DEFAULT NULL,
  "updated_at" datetime DEFAULT NULL,
  "file_hash" varchar(64) DEFAULT NULL,
  "batch_id" varchar(36) DEFAULT NULL,
  "user_id" int DEFAULT NULL,
  PRIMARY KEY ("candidate_id"),
  KEY "idx_user_id" ("user_id"),
  KEY "idx_candidates_user_id" ("user_id"),
  KEY "idx_candidates_status" ("status"),
  KEY "idx_candidates_years_experience" ("years_experience"),
  KEY "idx_candidates_location" ("location"),
  KEY "idx_candidates_email" ("email"),
  KEY "idx_candidates_created_at" ("created_at"),
  KEY "idx_candidates_file_hash" ("file_hash"),
  KEY "idx_candidates_user_status" ("user_id","status"),
  KEY "idx_candidates_user_experience" ("user_id","years_experience")
);


CREATE TABLE "chat_sessions" (
  "id" int NOT NULL AUTO_INCREMENT,
  "user_id" int DEFAULT NULL,
  "session_id" varchar(36) DEFAULT NULL,
  "created_at" datetime DEFAULT NULL,
  "last_activity" datetime DEFAULT NULL,
  PRIMARY KEY ("id"),
  UNIQUE KEY "ix_chat_sessions_session_id" ("session_id"),
  KEY "ix_chat_sessions_id" ("id")
);


CREATE TABLE "chat_messages" (
  "id" int NOT NULL AUTO_INCREMENT,
  "session_id" varchar(36) DEFAULT NULL,
  "role" varchar(20) DEFAULT NULL,
  "content" text,
  "timestamp" datetime DEFAULT NULL,
  "message_metadata" text,
  PRIMARY KEY ("id"),
  KEY "session_id" ("session_id"),
  KEY "ix_chat_messages_id" ("id"),
  CONSTRAINT "chat_messages_ibfk_1" FOREIGN KEY ("session_id") REFERENCES "chat_sessions" ("session_id")
);


CREATE TABLE "education" (
  "education_id" int NOT NULL AUTO_INCREMENT,
  "candidate_id" int DEFAULT NULL,
  "degree" varchar(255) DEFAULT NULL,
  "institution" varchar(255) DEFAULT NULL,
  "graduation_year" int DEFAULT NULL,
  "gpa" float DEFAULT NULL,
  PRIMARY KEY ("education_id"),
  KEY "idx_education_candidate_id" ("candidate_id"),
  KEY "idx_education_degree" ("degree"),
  KEY "idx_education_institution" ("institution"),
  KEY "idx_education_graduation_year" ("graduation_year"),
  CONSTRAINT "education_ibfk_1" FOREIGN KEY ("candidate_id") REFERENCES "candidates" ("candidate_id") ON DELETE CASCADE
);


CREATE TABLE "sessions" (
  "session_id" varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  "expires" int unsigned NOT NULL,
  "data" mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin,
  PRIMARY KEY ("session_id")
);

CREATE TABLE "skills" (
  "skill_id" int NOT NULL AUTO_INCREMENT,
  "candidate_id" int DEFAULT NULL,
  "skill_name" text,
  "skill_category" enum('TECHNICAL','SOFT','LANGUAGE','OTHER') DEFAULT NULL,
  "proficiency_level" enum('BEGINNER','INTERMEDIATE','ADVANCED','EXPERT','UNKNOWN') DEFAULT NULL,
  PRIMARY KEY ("skill_id"),
  KEY "idx_skills_candidate_id" ("candidate_id"),
  KEY "idx_skills_category" ("skill_category"),
  CONSTRAINT "skills_ibfk_1" FOREIGN KEY ("candidate_id") REFERENCES "candidates" ("candidate_id") ON DELETE CASCADE
);

CREATE TABLE "users" (
  "id" int NOT NULL AUTO_INCREMENT,
  "google_id" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "email" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "name" varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  "profile_picture" varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  "created_at" timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  "last_login" timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY ("id"),
  UNIQUE KEY "google_id" ("google_id"),
  KEY "idx_google_id" ("google_id"),
  KEY "idx_email" ("email")
);

CREATE TABLE "work_experiences" (
  "experience_id" int NOT NULL AUTO_INCREMENT,
  "candidate_id" int DEFAULT NULL,
  "company" varchar(255) DEFAULT NULL,
  "position" varchar(255) DEFAULT NULL,
  "start_date" varchar(50) DEFAULT NULL,
  "end_date" varchar(50) DEFAULT NULL,
  "duration" varchar(100) DEFAULT NULL,
  "description" text,
  PRIMARY KEY ("experience_id"),
  KEY "idx_work_exp_candidate_id" ("candidate_id"),
  KEY "idx_work_exp_company" ("company"),
  KEY "idx_work_exp_position" ("position"),
  CONSTRAINT "work_experiences_ibfk_1" FOREIGN KEY ("candidate_id") REFERENCES "candidates" ("candidate_id") ON DELETE CASCADE
);






