-- Remove heuresCours column from professeurs and add nbCours
ALTER TABLE "professeurs" DROP COLUMN IF EXISTS "heuresCours";
ALTER TABLE "professeurs" ADD COLUMN IF NOT EXISTS "nbCours" INTEGER NOT NULL DEFAULT 0;

-- Remove heuresCours column from surveillants and add nbCours
ALTER TABLE "surveillants" DROP COLUMN IF EXISTS "heuresCours";
ALTER TABLE "surveillants" ADD COLUMN IF NOT EXISTS "nbCours" INTEGER NOT NULL DEFAULT 0;
