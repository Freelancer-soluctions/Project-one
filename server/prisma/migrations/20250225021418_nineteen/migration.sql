-- AlterTable
ALTER TABLE "settings" ALTER COLUMN "displayEvents" DROP NOT NULL,
ALTER COLUMN "displayLanguage" DROP NOT NULL,
ALTER COLUMN "displayNews" DROP NOT NULL,
ALTER COLUMN "displayNotes" DROP NOT NULL,
ALTER COLUMN "displayPayroll" DROP NOT NULL,
ALTER COLUMN "displayProfile" DROP NOT NULL,
ALTER COLUMN "displayReports" DROP NOT NULL;
