-- CreateEnum
CREATE TYPE "RoleCompte" AS ENUM ('ADMINISTRATEUR', 'ENSEIGNANT', 'SURVEILLANT', 'PERSONNEL');

-- CreateEnum
CREATE TYPE "StatutCompte" AS ENUM ('EN_ATTENTE', 'ACTIF', 'BLOQUE');

-- CreateEnum
CREATE TYPE "TypeIncident" AS ENUM ('INFO', 'ERREUR', 'NOTE', 'ABSENT');

-- CreateEnum
CREATE TYPE "TypeRapport" AS ENUM ('RETARD', 'ABSENCE');

-- CreateEnum
CREATE TYPE "StatutSeance" AS ENUM ('EN_COURS', 'TERMINE');

-- CreateEnum
CREATE TYPE "StatutPresence" AS ENUM ('PRESENT', 'ABSENT', 'RETARD');

-- CreateTable
CREATE TABLE "annees_scolaires" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "annees_scolaires_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matieres" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "couleur" TEXT,
    "icone" TEXT,
    "imageUrl" TEXT,
    "anneeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "matieres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" TEXT NOT NULL,
    "nom" TEXT,
    "niveau" INTEGER NOT NULL,
    "serie" TEXT,
    "capacite" INTEGER,
    "imageUrl" TEXT,
    "anneeId" TEXT NOT NULL,
    "titulaireId" TEXT,
    "elevesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inscriptions" (
    "id" TEXT NOT NULL,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eleveId" TEXT NOT NULL,
    "classeId" TEXT,
    "anneeId" TEXT NOT NULL,

    CONSTRAINT "inscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cours" (
    "id" TEXT NOT NULL,
    "coefficient" INTEGER NOT NULL DEFAULT 1,
    "classeId" TEXT NOT NULL,
    "matiereId" TEXT NOT NULL,
    "professeurId" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "participants" TEXT[],
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL,
    "valeur" DOUBLE PRECISION NOT NULL,
    "coefficient" INTEGER NOT NULL DEFAULT 1,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "libelle" TEXT,
    "eleveId" TEXT NOT NULL,
    "inscriptionId" TEXT,
    "coursId" TEXT NOT NULL,
    "examenId" TEXT,
    "sousExamenId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sous_examens" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "examenId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sous_examens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examens" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "periode" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "classeId" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "examens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "lastname" TEXT NOT NULL,
    "domicile" TEXT,
    "fokontany" TEXT,
    "commune" TEXT,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "professeurs" (
    "id" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "matiere" TEXT[],
    "retards" INTEGER NOT NULL DEFAULT 0,
    "absences" INTEGER NOT NULL DEFAULT 0,
    "heuresCours" INTEGER NOT NULL DEFAULT 0,
    "incidents" INTEGER NOT NULL DEFAULT 0,
    "notesPositives" INTEGER NOT NULL DEFAULT 0,
    "notesNegatives" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "professeurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "surveillants" (
    "id" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "poste" TEXT NOT NULL,
    "retards" INTEGER NOT NULL DEFAULT 0,
    "absences" INTEGER NOT NULL DEFAULT 0,
    "heuresCours" INTEGER NOT NULL DEFAULT 0,
    "incidents" INTEGER NOT NULL DEFAULT 0,
    "notesPositives" INTEGER NOT NULL DEFAULT 0,
    "notesNegatives" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "surveillants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "personnel" (
    "id" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "poste" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personnel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eleves" (
    "id" TEXT NOT NULL,
    "personneId" TEXT NOT NULL,
    "dateNaissance" TIMESTAMP(3) NOT NULL,
    "im" TEXT,
    "sexe" TEXT,
    "redoublant" BOOLEAN NOT NULL DEFAULT false,
    "cin" TEXT,
    "lieuNaissance" TEXT,
    "communeNaissance" TEXT,
    "regionNaissance" TEXT,
    "provinceNaissance" TEXT,
    "regionResidence" TEXT,
    "provinceResidence" TEXT,
    "photoUrl" TEXT,
    "incidentsCount" INTEGER NOT NULL DEFAULT 0,
    "notesPositives" INTEGER NOT NULL DEFAULT 0,
    "notesNegatives" INTEGER NOT NULL DEFAULT 0,
    "coursTermines" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "nomMere" TEXT,
    "nomPere" TEXT,
    "nomTuteur" TEXT,
    "prenomMere" TEXT,
    "prenomPere" TEXT,
    "prenomTuteur" TEXT,
    "telephoneMere" TEXT,
    "telephonePere" TEXT,
    "telephoneTuteur" TEXT,

    CONSTRAINT "eleves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comptes" (
    "id" TEXT NOT NULL,
    "matricule" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "RoleCompte" NOT NULL,
    "statut" "StatutCompte" NOT NULL DEFAULT 'EN_ATTENTE',
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateInscription" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "personneId" TEXT NOT NULL,

    CONSTRAINT "comptes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profils" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL,
    "adresse" TEXT,
    "bio" TEXT,
    "dateInscription" TIMESTAMP(3) NOT NULL,
    "photoUrl" TEXT,
    "compteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profils_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activites" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "compteId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "salles" (
    "id" TEXT NOT NULL,
    "num" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "capacite" INTEGER NOT NULL,
    "occupe" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "salles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "emplois_du_temps" (
    "id" TEXT NOT NULL,
    "classeId" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emplois_du_temps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seances_edt" (
    "id" TEXT NOT NULL,
    "jour" TEXT NOT NULL,
    "heureDebut" TEXT NOT NULL,
    "heureFin" TEXT NOT NULL,
    "edtId" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "salleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seances_edt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seances_cours" (
    "id" TEXT NOT NULL,
    "coursId" TEXT NOT NULL,
    "professeurId" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "statut" "StatutSeance" NOT NULL DEFAULT 'EN_COURS',
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seances_cours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "presences_eleve" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "eleveId" TEXT NOT NULL,
    "inscriptionId" TEXT,
    "statut" "StatutPresence" NOT NULL DEFAULT 'PRESENT',
    "heureMarquage" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "commentaire" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "presences_eleve_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "absences" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "justifie" BOOLEAN NOT NULL DEFAULT false,
    "motif" TEXT,
    "eleveId" TEXT NOT NULL,
    "inscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "absences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retards" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duree" TEXT NOT NULL,
    "motif" TEXT,
    "justifie" BOOLEAN NOT NULL DEFAULT false,
    "eleveId" TEXT NOT NULL,
    "inscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "retards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapports" (
    "id" TEXT NOT NULL,
    "type" "TypeRapport" NOT NULL DEFAULT 'RETARD',
    "message" TEXT,
    "auteur" TEXT NOT NULL,
    "compteId" TEXT,
    "eleveId" TEXT NOT NULL,
    "inscriptionId" TEXT,
    "anneeId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rapports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rapport_lignes" (
    "id" TEXT NOT NULL,
    "rapportId" TEXT NOT NULL,
    "type" "TypeRapport" NOT NULL,
    "eleveId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "motif" TEXT,
    "absenceId" TEXT,
    "retardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rapport_lignes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" TEXT NOT NULL,
    "type" "TypeIncident" NOT NULL,
    "message" TEXT NOT NULL,
    "auteur" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eleveId" TEXT NOT NULL,
    "anneeId" TEXT NOT NULL,
    "inscriptionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "compteId" TEXT,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reactions" (
    "id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "user" TEXT NOT NULL,
    "incidentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "authorId" TEXT,
    "text" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "incidentId" TEXT NOT NULL,
    "parentId" TEXT,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "scope" TEXT NOT NULL DEFAULT 'ALL',
    "actionType" TEXT,
    "matricule" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "media" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "nom" TEXT,
    "type" TEXT,
    "taille" INTEGER,
    "ownerType" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "matieres_nom_anneeId_key" ON "matieres"("nom", "anneeId");

-- CreateIndex
CREATE UNIQUE INDEX "inscriptions_eleveId_anneeId_key" ON "inscriptions"("eleveId", "anneeId");

-- CreateIndex
CREATE INDEX "notes_sousExamenId_idx" ON "notes"("sousExamenId");

-- CreateIndex
CREATE INDEX "sous_examens_examenId_idx" ON "sous_examens"("examenId");

-- CreateIndex
CREATE UNIQUE INDEX "personnes_email_key" ON "personnes"("email");

-- CreateIndex
CREATE UNIQUE INDEX "professeurs_personneId_key" ON "professeurs"("personneId");

-- CreateIndex
CREATE UNIQUE INDEX "surveillants_personneId_key" ON "surveillants"("personneId");

-- CreateIndex
CREATE UNIQUE INDEX "personnel_personneId_key" ON "personnel"("personneId");

-- CreateIndex
CREATE UNIQUE INDEX "eleves_personneId_key" ON "eleves"("personneId");

-- CreateIndex
CREATE UNIQUE INDEX "comptes_matricule_key" ON "comptes"("matricule");

-- CreateIndex
CREATE UNIQUE INDEX "comptes_personneId_key" ON "comptes"("personneId");

-- CreateIndex
CREATE UNIQUE INDEX "profils_compteId_key" ON "profils"("compteId");

-- CreateIndex
CREATE INDEX "seances_cours_coursId_statut_idx" ON "seances_cours"("coursId", "statut");

-- CreateIndex
CREATE UNIQUE INDEX "presences_eleve_seanceId_eleveId_key" ON "presences_eleve"("seanceId", "eleveId");

-- CreateIndex
CREATE INDEX "rapports_eleveId_idx" ON "rapports"("eleveId");

-- CreateIndex
CREATE INDEX "rapports_anneeId_idx" ON "rapports"("anneeId");

-- CreateIndex
CREATE INDEX "rapport_lignes_rapportId_idx" ON "rapport_lignes"("rapportId");

-- CreateIndex
CREATE INDEX "rapport_lignes_absenceId_idx" ON "rapport_lignes"("absenceId");

-- CreateIndex
CREATE INDEX "rapport_lignes_retardId_idx" ON "rapport_lignes"("retardId");

-- AddForeignKey
ALTER TABLE "matieres" ADD CONSTRAINT "matieres_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees_scolaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees_scolaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_titulaireId_fkey" FOREIGN KEY ("titulaireId") REFERENCES "professeurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees_scolaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inscriptions" ADD CONSTRAINT "inscriptions_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours" ADD CONSTRAINT "cours_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees_scolaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours" ADD CONSTRAINT "cours_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours" ADD CONSTRAINT "cours_matiereId_fkey" FOREIGN KEY ("matiereId") REFERENCES "matieres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cours" ADD CONSTRAINT "cours_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "professeurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_sousExamenId_fkey" FOREIGN KEY ("sousExamenId") REFERENCES "sous_examens"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sous_examens" ADD CONSTRAINT "sous_examens_examenId_fkey" FOREIGN KEY ("examenId") REFERENCES "examens"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examens" ADD CONSTRAINT "examens_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees_scolaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examens" ADD CONSTRAINT "examens_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "professeurs" ADD CONSTRAINT "professeurs_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "personnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "surveillants" ADD CONSTRAINT "surveillants_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "personnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "personnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "eleves" ADD CONSTRAINT "eleves_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "personnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comptes" ADD CONSTRAINT "comptes_personneId_fkey" FOREIGN KEY ("personneId") REFERENCES "personnes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profils" ADD CONSTRAINT "profils_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activites" ADD CONSTRAINT "activites_compteId_fkey" FOREIGN KEY ("compteId") REFERENCES "comptes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplois_du_temps" ADD CONSTRAINT "emplois_du_temps_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees_scolaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "emplois_du_temps" ADD CONSTRAINT "emplois_du_temps_classeId_fkey" FOREIGN KEY ("classeId") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seances_edt" ADD CONSTRAINT "seances_edt_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seances_edt" ADD CONSTRAINT "seances_edt_edtId_fkey" FOREIGN KEY ("edtId") REFERENCES "emplois_du_temps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seances_edt" ADD CONSTRAINT "seances_edt_salleId_fkey" FOREIGN KEY ("salleId") REFERENCES "salles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seances_cours" ADD CONSTRAINT "seances_cours_coursId_fkey" FOREIGN KEY ("coursId") REFERENCES "cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seances_cours" ADD CONSTRAINT "seances_cours_professeurId_fkey" FOREIGN KEY ("professeurId") REFERENCES "professeurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seances_cours" ADD CONSTRAINT "seances_cours_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees_scolaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences_eleve" ADD CONSTRAINT "presences_eleve_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "seances_cours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences_eleve" ADD CONSTRAINT "presences_eleve_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "presences_eleve" ADD CONSTRAINT "presences_eleve_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "absences" ADD CONSTRAINT "absences_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retards" ADD CONSTRAINT "retards_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retards" ADD CONSTRAINT "retards_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees_scolaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapports" ADD CONSTRAINT "rapports_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport_lignes" ADD CONSTRAINT "rapport_lignes_rapportId_fkey" FOREIGN KEY ("rapportId") REFERENCES "rapports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport_lignes" ADD CONSTRAINT "rapport_lignes_absenceId_fkey" FOREIGN KEY ("absenceId") REFERENCES "absences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rapport_lignes" ADD CONSTRAINT "rapport_lignes_retardId_fkey" FOREIGN KEY ("retardId") REFERENCES "retards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_eleveId_fkey" FOREIGN KEY ("eleveId") REFERENCES "eleves"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_anneeId_fkey" FOREIGN KEY ("anneeId") REFERENCES "annees_scolaires"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_inscriptionId_fkey" FOREIGN KEY ("inscriptionId") REFERENCES "inscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reactions" ADD CONSTRAINT "reactions_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_incidentId_fkey" FOREIGN KEY ("incidentId") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
