/*
  Warnings:

  - Added the required column `eventTypesId` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "eventTypesId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "eventTypes" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "eventTypes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "eventTypes_code_key" ON "eventTypes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "eventTypes_description_key" ON "eventTypes"("description");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_eventTypesId_fkey" FOREIGN KEY ("eventTypesId") REFERENCES "eventTypes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
