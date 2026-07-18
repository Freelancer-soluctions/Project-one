-- CreateTable
CREATE TABLE "user_notes_favorites" (
    "noteId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "user_notes_favorites_userId_idx" ON "user_notes_favorites"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "user_notes_favorites_noteId_userId_key" ON "user_notes_favorites"("noteId", "userId");

-- AddForeignKey
ALTER TABLE "user_notes_favorites" ADD CONSTRAINT "user_notes_favorites_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES "notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notes_favorites" ADD CONSTRAINT "user_notes_favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
