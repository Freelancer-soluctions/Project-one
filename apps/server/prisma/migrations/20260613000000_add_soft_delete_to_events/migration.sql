-- Add soft delete fields to events table
ALTER TABLE "events" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "events" ADD COLUMN "deletedBy" INTEGER;

-- Add foreign key constraint for deletedBy -> users.id
ALTER TABLE "events" ADD CONSTRAINT "events_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;