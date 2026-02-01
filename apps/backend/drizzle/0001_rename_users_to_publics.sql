-- Rename users table to publics
ALTER TABLE "users" RENAME TO "publics";

-- Rename user_google_accounts table to publics_google
ALTER TABLE "user_google_accounts" RENAME TO "publics_google";

-- Rename user_id column to public_id in publics_google table
ALTER TABLE "publics_google" RENAME COLUMN "user_id" TO "public_id";

-- Rename user_id column to public_id in members table
ALTER TABLE "members" RENAME COLUMN "user_id" TO "public_id";

-- Rename user_id column to public_id in reports table
ALTER TABLE "reports" RENAME COLUMN "user_id" TO "public_id";

-- Rename user_id column to public_id in sessions table
ALTER TABLE "sessions" RENAME COLUMN "user_id" TO "public_id";

-- Rename user_id column to public_id in password_reset_tokens table
ALTER TABLE "password_reset_tokens" RENAME COLUMN "user_id" TO "public_id";

-- Rename user_id column to public_id in kitchen_needs_requests table
ALTER TABLE "kitchen_needs_requests" RENAME COLUMN "user_id" TO "public_id";
