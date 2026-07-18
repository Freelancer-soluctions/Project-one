/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `productProviders` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `createdOn` to the `productCategories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "productCategories" ADD COLUMN     "createdOn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "updatedOn" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "productProviders_name_key" ON "productProviders"("name");
