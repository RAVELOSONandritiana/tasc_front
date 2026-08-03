-- CreateEnum
CREATE TYPE "ResultatEleve" AS ENUM ('EN_ATTENTE', 'ADMIS', 'AJOURNE');

-- AlterTable
ALTER TABLE "inscriptions" ADD COLUMN     "resultat" "ResultatEleve" NOT NULL DEFAULT 'EN_ATTENTE';
