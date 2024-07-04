/*
  Warnings:

  - You are about to drop the `Users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_roleId_fkey";

-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_statusId_fkey";

-- DropForeignKey
ALTER TABLE "Users" DROP CONSTRAINT "Users_userPermitId_fkey";

-- DropForeignKey
ALTER TABLE "news" DROP CONSTRAINT "news_closedBy_fkey";

-- DropForeignKey
ALTER TABLE "news" DROP CONSTRAINT "news_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_closedBy_fkey";

-- DropForeignKey
ALTER TABLE "notes" DROP CONSTRAINT "notes_createdBy_fkey";

-- DropTable
DROP TABLE "Users";

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password" VARCHAR(16) NOT NULL,
    "address" VARCHAR(250),
    "birthday" TIMESTAMP(3) NOT NULL,
    "city" VARCHAR(35),
    "isAdmin" BOOLEAN DEFAULT false,
    "picturte" TEXT,
    "document" TEXT,
    "lastUpdatedBy" INTEGER NOT NULL,
    "lastUpdatedOn" TIMESTAMP(3),
    "roleId" INTEGER NOT NULL,
    "socialSecurity" VARCHAR(9) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "statusId" INTEGER NOT NULL,
    "telephone" VARCHAR(15) NOT NULL,
    "zipcode" VARCHAR(9) NOT NULL,
    "userPermitId" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "userStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_userPermitId_fkey" FOREIGN KEY ("userPermitId") REFERENCES "userPermits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
