/*
  Warnings:

  - You are about to drop the column `dni_encrypted` on the `employees` table. All the data in the column will be lost.
  - Added the required column `dni` to the `employees` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "dni_encrypted",
ADD COLUMN     "dni" VARCHAR(128) NOT NULL;
