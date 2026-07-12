-- AlterTable: rendre les matieres propres a chaque annee scolaire
ALTER TABLE "matieres" ADD COLUMN "anneeId" TEXT;

-- Backfill: rattache les matieres existantes a l'annee active (ou la plus recente)
UPDATE "matieres" SET "anneeId" = COALESCE(
  (SELECT id FROM "annees_scolaires" WHERE "active" = true LIMIT 1),
  (SELECT id FROM "annees_scolaires" ORDER BY "dateCreation" DESC LIMIT 1)
)
WHERE "anneeId" IS NULL;

ALTER TABLE "matieres" ALTER COLUMN "anneeId" SET NOT NULL;

ALTER TABLE "matieres" ADD CONSTRAINT "matieres_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees_scolaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Remplace l'unicite globale du nom par une unicite par annee
ALTER TABLE "matieres" DROP CONSTRAINT "matieres_nom_key";

ALTER TABLE "matieres" ADD CONSTRAINT "matieres_nom_anneeId_key" UNIQUE ("nom", "anneeId");
