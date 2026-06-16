-- AlterTable
ALTER TABLE "Activiteit" ADD COLUMN     "mailVerstuurdOp" TIMESTAMP(3),
ADD COLUMN     "verwittigPerMail" BOOLEAN NOT NULL DEFAULT false;

