/*
  Warnings:

  - You are about to drop the column `userPermitId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the `userPermits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "users" DROP CONSTRAINT "users_userPermitId_fkey";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "userPermitId";

-- DropTable
DROP TABLE "userPermits";

-- CreateTable
CREATE TABLE "permissions" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" VARCHAR(100) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rolePermits" (
    "id" SERIAL NOT NULL,
    "roleId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "rolePermits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- CreateIndex
CREATE UNIQUE INDEX "rolePermits_roleId_permissionId_key" ON "rolePermits"("roleId", "permissionId");

-- AddForeignKey
ALTER TABLE "rolePermits" ADD CONSTRAINT "rolePermits_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rolePermits" ADD CONSTRAINT "rolePermits_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
