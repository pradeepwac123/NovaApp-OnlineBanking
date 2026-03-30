-- Add missing account-block column expected by the Prisma schema
ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "blockedUntil" TIMESTAMP(3);
