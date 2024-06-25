-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "accessConfiguration" BOOLEAN DEFAULT false,
    "accessNews" BOOLEAN DEFAULT false,
    "address" VARCHAR(250) NOT NULL,
    "birthday" TIMESTAMP NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "document" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "email" VARCHAR(128) NOT NULL,
    "isAdmin" BOOLEAN DEFAULT false,
    "isManager" BOOLEAN DEFAULT false,
    "lastUpdatedBy" TIMESTAMP(3) NOT NULL,
    "lastUpdatedOn" TIMESTAMP(3) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "roleId" INTEGER NOT NULL,
    "socialSecurity" VARCHAR(9) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "statusId" INTEGER NOT NULL,
    "telephone" VARCHAR(13) NOT NULL,
    "zipcode" VARCHAR(5) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Role" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(50) NOT NULL,

    CONSTRAINT "Role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStatus" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(8) NOT NULL,

    CONSTRAINT "UserStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "closedOn" TIMESTAMP(3) NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "document" TEXT,
    "documentId" TEXT,
    "note" VARCHAR(2000) NOT NULL,
    "statusId" INTEGER NOT NULL,
    "closedBy" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteStatus" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "NoteStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsStatus" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "NewsStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" SERIAL NOT NULL,
    "closedOn" TIMESTAMP(3) NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" VARCHAR(400) NOT NULL,
    "document" TEXT,
    "documentId" TEXT,
    "statusId" INTEGER NOT NULL,
    "closedBy" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "answer" BOOLEAN NOT NULL,
    "description" VARCHAR(250) NOT NULL,
    "newsId" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Role_code_key" ON "Role"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Role_description_key" ON "Role"("description");

-- CreateIndex
CREATE UNIQUE INDEX "UserStatus_code_key" ON "UserStatus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "UserStatus_description_key" ON "UserStatus"("description");

-- CreateIndex
CREATE UNIQUE INDEX "NoteStatus_code_key" ON "NoteStatus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NoteStatus_description_key" ON "NoteStatus"("description");

-- CreateIndex
CREATE UNIQUE INDEX "NewsStatus_code_key" ON "NewsStatus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "NewsStatus_description_key" ON "NewsStatus"("description");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "UserStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "NoteStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "NewsStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
