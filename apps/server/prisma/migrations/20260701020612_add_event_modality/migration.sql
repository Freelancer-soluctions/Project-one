-- CreateEnum
CREATE TYPE "EventModality" AS ENUM ('ONLINE', 'IN_PERSON', 'HYBRID');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "location" VARCHAR(200),
ADD COLUMN     "meetingUrl" VARCHAR(500),
ADD COLUMN     "modality" "EventModality" NOT NULL DEFAULT 'IN_PERSON';

-- CreateIndex
CREATE INDEX "events_eventDate_idx" ON "events"("eventDate");

-- CreateIndex
CREATE INDEX "events_modality_idx" ON "events"("modality");
