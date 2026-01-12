/*
  Warnings:

  - You are about to alter the column `salary` on the `employees` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.
  - You are about to alter the column `document` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(128)`.

*/
-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "salary" SET DATA TYPE VARCHAR(128);

-- AlterTable
ALTER TABLE "payroll" ALTER COLUMN "baseSalary" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "extraHours" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "deductions" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "totalPayment" SET DATA TYPE VARCHAR(128);

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "document" SET DATA TYPE VARCHAR(128),
ALTER COLUMN "socialSecurity" SET DATA TYPE VARCHAR(128);
