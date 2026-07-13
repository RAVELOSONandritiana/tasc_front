-- CreateTable
CREATE TABLE "sous_examens" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sous_examens_pkey" PRIMARY KEY ("id")
);

-- Add sousExamenId column to notes (nullable to keep backfill safe)
ALTER TABLE "notes" ADD COLUMN "sousExamenId" TEXT;

-- Backfill: for each examen that has notes without sousExamenId, create a
-- default sous-examen "Composition" and attach those notes to it.
DO $$
DECLARE
    r RECORD;
    new_id TEXT;
BEGIN
    FOR r IN
        SELECT DISTINCT n."examenId"
        FROM "notes" n
        WHERE n."examenId" IS NOT NULL AND n."sousExamenId" IS NULL
    LOOP
        new_id := gen_random_uuid();
        INSERT INTO "sous_examens" ("id", "nom", "examenId", "createdAt", "updatedAt")
        VALUES (new_id, 'Composition', r."examenId", now(), now());
        UPDATE "notes" SET "sousExamenId" = new_id
        WHERE "examenId" = r."examenId" AND "sousExamenId" IS NULL;
    END LOOP;
END $$;

-- Indexes
CREATE INDEX "notes_sousExamenId_idx" ON "notes"("sousExamenId");
CREATE INDEX "sous_examens_examenId_idx" ON "sous_examens"("examenId");

-- Foreign keys
ALTER TABLE "notes" ADD CONSTRAINT "notes_sousExamenId_fkey"
    FOREIGN KEY ("sousExamenId") REFERENCES "sous_examens"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sous_examens" ADD CONSTRAINT "sous_examens_examenId_fkey"
    FOREIGN KEY ("examenId") REFERENCES "examens"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
