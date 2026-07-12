-- Incident appartient desormais a une annee scolaire
ALTER TABLE "incidents" ADD COLUMN "anneeId" TEXT;

-- Backfill: année de l'inscription la plus recente de l'eleve, sinon année active/recente
UPDATE "incidents" SET "anneeId" = (
  SELECT i."anneeId" FROM "inscriptions" i
  WHERE i."eleveId" = "incidents"."eleveId"
  ORDER BY i."dateInscription" DESC LIMIT 1
)
WHERE "anneeId" IS NULL;

UPDATE "incidents" SET "anneeId" = COALESCE(
  (SELECT id FROM "annees_scolaires" WHERE "active" = true LIMIT 1),
  (SELECT id FROM "annees_scolaires" ORDER BY "dateCreation" DESC LIMIT 1)
)
WHERE "anneeId" IS NULL;

ALTER TABLE "incidents" ALTER COLUMN "anneeId" SET NOT NULL;

ALTER TABLE "incidents" ADD CONSTRAINT "incidents_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees_scolaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Inscription: une inscription par eleve et par annee (classe optionnelle)
ALTER TABLE "inscriptions" ALTER COLUMN "classeId" DROP NOT NULL;

ALTER TABLE "inscriptions" DROP CONSTRAINT "inscriptions_eleveId_classeId_anneeId_key";

ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_eleveId_anneeId_key" UNIQUE ("eleveId", "anneeId");
