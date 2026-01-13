/*
  Warnings:

  - You are about to drop the column `dni` on the `employees` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[dni_hash]` on the table `employees` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `dni_encrypted` to the `employees` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dni_hash` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "employees_dni_key";

-- AlterTable
ALTER TABLE "employees" DROP COLUMN "dni",
ADD COLUMN     "dni_encrypted" VARCHAR(128) NOT NULL,
ADD COLUMN     "dni_hash" VARCHAR(64) NOT NULL,
ALTER COLUMN "salary" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "employees_dni_hash_key" ON "employees"("dni_hash");
