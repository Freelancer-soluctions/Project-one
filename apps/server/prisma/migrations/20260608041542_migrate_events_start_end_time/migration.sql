/*
  Warnings:

  - Changed the type of `startTime` on the `events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `endTime` on the `events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "events" DROP COLUMN "startTime",
ADD COLUMN     "startTime" TIME(0) NOT NULL,
DROP COLUMN "endTime",
ADD COLUMN     "endTime" TIME(0) NOT NULL;

-- CreateIndex
CREATE INDEX "mentions_noteId_mentionedUserId_idx" ON "mentions"("noteId", "mentionedUserId");

-- CreateIndex
CREATE INDEX "mentions_mentionedUserId_isRead_idx" ON "mentions"("mentionedUserId", "isRead");

-- CreateIndex
CREATE INDEX "notes_createdBy_idx" ON "notes"("createdBy");
