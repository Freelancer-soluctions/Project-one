/*
  Warnings:

  - You are about to drop the column `expiration` on the `Stock` table. All the data in the column will be lost.
  - Added the required column `createdBy` to the `Stock` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "unitMeasureStock" AS ENUM ('PIECES', 'KILOGRAMS', 'LITERS', 'METERS');

-- AlterTable
ALTER TABLE "Stock" DROP COLUMN "expiration",
ADD COLUMN     "createdBy" INTEGER NOT NULL,
ADD COLUMN     "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "entryDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "expirationDate" TIMESTAMP(3),
ADD COLUMN     "unitMeasure" "unitMeasureStock" NOT NULL DEFAULT 'PIECES',
ADD COLUMN     "updatedBy" INTEGER,
ADD COLUMN     "updatedOn" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stock" ADD CONSTRAINT "Stock_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
