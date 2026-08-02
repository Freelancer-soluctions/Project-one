-- CreateEnum
CREATE TYPE "AttendeeStatus" AS ENUM ('CONFIRMED', 'WAITLIST', 'CANCELLED');

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "attendeeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "capacity" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "attendees" (
    "id" SERIAL NOT NULL,
    "eventId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "status" "AttendeeStatus" NOT NULL DEFAULT 'CONFIRMED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3),

    CONSTRAINT "attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registration_log" (
    "id" SERIAL NOT NULL,
    "attendeeId" INTEGER NOT NULL,
    "eventId" INTEGER NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT NOT NULL,
    "changedBy" INTEGER,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registration_log_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "attendees_eventId_status_idx" ON "attendees"("eventId", "status");

-- CreateIndex
CREATE INDEX "attendees_eventId_userId_idx" ON "attendees"("eventId", "userId");

-- CreateIndex
CREATE INDEX "attendees_userId_idx" ON "attendees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "attendees_eventId_userId_key" ON "attendees"("eventId", "userId");

-- CreateIndex
CREATE INDEX "registration_log_eventId_createdOn_idx" ON "registration_log"("eventId", "createdOn");

-- CreateIndex
CREATE INDEX "registration_log_attendeeId_idx" ON "registration_log"("attendeeId");

-- AddForeignKey
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "attendees" ADD CONSTRAINT "attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_log" ADD CONSTRAINT "registration_log_attendeeId_fkey" FOREIGN KEY ("attendeeId") REFERENCES "attendees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registration_log" ADD CONSTRAINT "registration_log_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
