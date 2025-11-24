-- AlterTable: Add activity tracking columns to users
ALTER TABLE "users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "users" ADD COLUMN "last_activity_at" TIMESTAMP(3);

-- Update existing users to have last_activity_at
UPDATE "users" SET "last_activity_at" = "created_at" WHERE "last_activity_at" IS NULL;

