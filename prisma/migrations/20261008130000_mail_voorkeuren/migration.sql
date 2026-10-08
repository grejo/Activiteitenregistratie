-- AlterTable
-- Mailvoorkeuren voor staff: globale hoofdschakelaar op User en verfijning per
-- gekoppelde opleiding. Default true zodat niemand bestaande mails verliest.
ALTER TABLE "User" ADD COLUMN "ontvangtMail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "DocentOpleiding" ADD COLUMN "ontvangtMail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AdminOpleiding" ADD COLUMN "ontvangtMail" BOOLEAN NOT NULL DEFAULT true;
