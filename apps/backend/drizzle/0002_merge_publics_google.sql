-- Create signup_method enum
CREATE TYPE "signup_method" AS ENUM ('manual', 'google');

-- Add new columns to publics
ALTER TABLE "publics" ADD COLUMN "signup_method" "signup_method" DEFAULT 'manual' NOT NULL;
ALTER TABLE "publics" ADD COLUMN "google_id" varchar(255) UNIQUE;
ALTER TABLE "publics" ADD COLUMN "google_email" varchar(255);

-- Create index for google_id
CREATE INDEX "publics_google_id_idx" ON "publics" ("google_id");

-- Migrate data from publics_google to publics
UPDATE "publics" p
SET
  "signup_method" = 'google',
  "google_id" = pg."google_id",
  "google_email" = pg."google_email"
FROM "publics_google" pg
WHERE p."id" = pg."public_id" AND p."password" IS NULL;

-- For users who have both password and google (linked later)
UPDATE "publics" p
SET
  "google_id" = pg."google_id",
  "google_email" = pg."google_email"
FROM "publics_google" pg
WHERE p."id" = pg."public_id" AND p."password" IS NOT NULL;

-- Drop publics_google table
DROP TABLE "publics_google";

-- Drop is_active and is_verified columns (not needed)
ALTER TABLE "publics" DROP COLUMN "is_active";
ALTER TABLE "publics" DROP COLUMN "is_verified";
