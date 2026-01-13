/*
  Warnings:

  - You are about to drop the `rolePermits` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "rolePermits" DROP CONSTRAINT "rolePermits_permissionId_fkey";

-- DropForeignKey
ALTER TABLE "rolePermits" DROP CONSTRAINT "rolePermits_roleId_fkey";

-- DropTable
DROP TABLE "rolePermits";

-- CreateTable
CREATE TABLE "userPermits" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "permissionId" INTEGER NOT NULL,

    CONSTRAINT "userPermits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "userPermits_userId_permissionId_key" ON "userPermits"("userId", "permissionId");

-- AddForeignKey
ALTER TABLE "userPermits" ADD CONSTRAINT "userPermits_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "userPermits" ADD CONSTRAINT "userPermits_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
