-- AlterTable
ALTER TABLE "settings" ADD COLUMN     "displayEvents" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "displayLanguage" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "displayNews" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "displayNotes" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "displayPayroll" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "displayProfile" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "displayReports" BOOLEAN NOT NULL DEFAULT false;
