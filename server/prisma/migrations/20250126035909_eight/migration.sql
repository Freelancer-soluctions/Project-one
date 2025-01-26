-- CreateTable
CREATE TABLE "settings" (
    "id" SERIAL NOT NULL,
    "language" VARCHAR(2) NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "settings_language_key" ON "settings"("language");
