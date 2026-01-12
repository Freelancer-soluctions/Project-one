-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "firstName" VARCHAR(50) NOT NULL,
    "lastName" VARCHAR(50) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "address" VARCHAR(250),
    "birthday" TIMESTAMP(3) NOT NULL,
    "city" VARCHAR(35),
    "isAdmin" BOOLEAN DEFAULT false,
    "picture" TEXT,
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
    "refreshToken" VARCHAR(200),
    "userPermitId" INTEGER NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userPermits" (
    "id" SERIAL NOT NULL,
    "accessConfiguration" BOOLEAN DEFAULT false,
    "accessNews" BOOLEAN DEFAULT false,

    CONSTRAINT "userPermits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "userStatus" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(8) NOT NULL,

    CONSTRAINT "userStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" SERIAL NOT NULL,
    "closedOn" TIMESTAMP(3) NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "document" TEXT,
    "documentId" TEXT,
    "note" VARCHAR(2000) NOT NULL,
    "statusId" INTEGER NOT NULL,
    "closedBy" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "noteStatus" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "noteStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsStatus" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(3) NOT NULL,
    "description" VARCHAR(10) NOT NULL,

    CONSTRAINT "newsStatus_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news" (
    "id" SERIAL NOT NULL,
    "closedOn" TIMESTAMP(3),
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" VARCHAR(400) NOT NULL,
    "document" TEXT,
    "documentId" TEXT,
    "statusId" INTEGER NOT NULL,
    "closedBy" INTEGER NOT NULL,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "answer" BOOLEAN NOT NULL,
    "description" VARCHAR(250) NOT NULL,
    "newsId" INTEGER NOT NULL,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "roles_code_key" ON "roles"("code");

-- CreateIndex
CREATE UNIQUE INDEX "roles_description_key" ON "roles"("description");

-- CreateIndex
CREATE UNIQUE INDEX "userStatus_code_key" ON "userStatus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "userStatus_description_key" ON "userStatus"("description");

-- CreateIndex
CREATE UNIQUE INDEX "noteStatus_code_key" ON "noteStatus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "noteStatus_description_key" ON "noteStatus"("description");

-- CreateIndex
CREATE UNIQUE INDEX "newsStatus_code_key" ON "newsStatus"("code");

-- CreateIndex
CREATE UNIQUE INDEX "newsStatus_description_key" ON "newsStatus"("description");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "userStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_userPermitId_fkey" FOREIGN KEY ("userPermitId") REFERENCES "userPermits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "noteStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_statusId_fkey" FOREIGN KEY ("statusId") REFERENCES "newsStatus"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_closedBy_fkey" FOREIGN KEY ("closedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "news" ADD CONSTRAINT "news_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_newsId_fkey" FOREIGN KEY ("newsId") REFERENCES "news"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
