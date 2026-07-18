-- CreateTable
CREATE TABLE "mentions" (
    "id" SERIAL NOT NULL,
    "noteId" INTEGER NOT NULL,
    "mentionedUserId" INTEGER NOT NULL,
    "mentionedByUserId" INTEGER NOT NULL,
    "positionStart" INTEGER NOT NULL,
    "positionEnd" INTEGER NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isRead" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "mentions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_mentionedUserId_fkey" FOREIGN KEY ("mentionedUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "mentions" ADD CONSTRAINT "mentions_mentionedByUserId_fkey" FOREIGN KEY ("mentionedByUserId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- CreateIndex
CREATE INDEX "mentions_noteId_idx" ON "mentions"("noteId");

-- CreateIndex
CREATE INDEX "mentions_mentionedUserId_idx" ON "mentions"("mentionedUserId");

-- CreateIndex
CREATE INDEX "mentions_mentionedByUserId_idx" ON "mentions"("mentionedByUserId");

-- AlterTable
ALTER TABLE "notes" ADD COLUMN "hasMentions" BOOLEAN NOT NULL DEFAULT false;