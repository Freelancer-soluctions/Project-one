/*
  Warnings:

  - You are about to drop the column `eventTypesId` on the `events` table. All the data in the column will be lost.
  - Added the required column `eventTypeId` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "events" DROP CONSTRAINT "events_eventTypesId_fkey";

-- AlterTable
ALTER TABLE "events" DROP COLUMN "eventTypesId",
ADD COLUMN     "eventTypeId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_eventTypeId_fkey" FOREIGN KEY ("eventTypeId") REFERENCES "eventTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
