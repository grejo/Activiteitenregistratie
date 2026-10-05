-- AlterTable
-- Bewaart de department-code uit de SSO per gebruiker, zodat studenten
-- automatisch (her)gekoppeld kunnen worden aan de juiste opleiding wanneer
-- de opleidingscodes wijzigen.
ALTER TABLE "User" ADD COLUMN "ssoDepartment" TEXT;
ALTER TABLE "User" ADD COLUMN "ssoDepartmentOp" TIMESTAMP(3);
