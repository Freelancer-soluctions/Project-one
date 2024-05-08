-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(128) NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "lastUpdatedOn" TIMESTAMP(3) NOT NULL,
    "lastUpdatedBy" TIMESTAMP(3) NOT NULL,
    "socialSecurity" VARCHAR(9) NOT NULL,
    "telephone" VARCHAR(13) NOT NULL,
    "birthday" TIME NOT NULL,
    "zipcode" VARCHAR(5) NOT NULL,
    "state" VARCHAR(50) NOT NULL,
    "city" VARCHAR(50) NOT NULL,
    "address" VARCHAR(250) NOT NULL,
    "isAdmin" BOOLEAN,
    "isManager" BOOLEAN,
    "document" TEXT NOT NULL,
    "statusId" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserStatus" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(8) NOT NULL,

    CONSTRAINT "UserStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" SERIAL NOT NULL,
    "note" VARCHAR(2000) NOT NULL,
    "statusId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "closedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3) NOT NULL,
    "document" TEXT,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NoteStatus" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "NoteStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewStatus" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "NewStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "News" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(400) NOT NULL,
    "statusId" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,
    "closedBy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" TIMESTAMP(3) NOT NULL,
    "document" TEXT,

    CONSTRAINT "News_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" SERIAL NOT NULL,
    "description" VARCHAR(250) NOT NULL,
    "answer" BOOLEAN NOT NULL,
    "newsId" INTEGER NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserStatus_description_key" ON "UserStatus"("description");

-- CreateIndex
CREATE UNIQUE INDEX "NoteStatus_description_key" ON "NoteStatus"("description");

-- CreateIndex
CREATE UNIQUE INDEX "NewStatus_description_key" ON "NewStatus"("description");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "UserStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "NoteStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "NewStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "News" ADD CONSTRAINT "News_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "News"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
