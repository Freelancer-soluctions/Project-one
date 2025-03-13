/*
  Warnings:

  - You are about to drop the column `description` on the `productProviders` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[contactEmail]` on the table `productProviders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdBy` to the `productProviders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `createdOn` to the `productProviders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `productProviders` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "productProviders_description_key";

-- AlterTable
ALTER TABLE "productProviders" DROP COLUMN "description",
ADD COLUMN     "address" VARCHAR(120),
ADD COLUMN     "contactEmail" VARCHAR(80),
ADD COLUMN     "contactName" VARCHAR(60),
ADD COLUMN     "contactPhone" VARCHAR(15),
ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "createdOn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "name" VARCHAR(100) NOT NULL,
ADD COLUMN     "status" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "updatedBy" INTEGER,
ADD COLUMN     "updatedOn" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "productProviders_contactEmail_key" ON "productProviders"("contactEmail");

-- AddForeignKey
ALTER TABLE "productProviders" ADD CONSTRAINT "productProviders_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "productProviders" ADD CONSTRAINT "productProviders_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
