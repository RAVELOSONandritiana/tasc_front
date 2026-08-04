import type { PageServerLoad } from './$types';
import { prisma, getActiveAnneeScolaire } from '$lib/server/prisma';
import type { Cours, Examen } from '$lib/types/Materiel.type';

function dureeHeures(heureDebut: string, heureFin: string): number {
	const [dh, dm] = heureDebut.split(':').map(Number);
	const [fh, fm] = heureFin.split(':').map(Number);
	const debut = dh * 60 + (dm || 0);
	const fin = fh * 60 + (fm || 0);
	const diff = fin - debut;
	return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

export const load: PageServerLoad = async ({ params }) => {
	const classe = await prisma.classe.findUnique({
		where: { id: params.id },
		include: { anneeScolaire: true }
	});

	const annee = await getActiveAnneeScolaire();
	const anneeId = annee?.id ?? classe?.anneeScolaire?.id ?? '';

	const coursList = await prisma.cours.findMany({
		where: { classeId: params.id },
		include: { matiere: true, professeur: { include: { personne: true } } }
	});

	const listeCours: Cours[] = coursList.map((c) => ({
		id: c.id,
		nom: c.matiere.nom,
		coefficient: c.coefficient,
		professeur: c.professeur
			? `${c.professeur.personne.name} ${c.professeur.personne.lastname}`
			: '',
		professeurId: c.professeurId ?? null,
		participants: c.participants || [],
		matiereId: c.matiereId,
		matiere: { id: c.matiere.id, nom: c.matiere.nom, couleur: c.matiere.couleur || undefined }
	}));
	const coursIds = listeCours.map((c) => c.id);

	const examens = await prisma.examen.findMany({
		where: { classeId: params.id },
		orderBy: { date: 'asc' },
		include: { sousExamens: { orderBy: { createdAt: 'asc' } } }
	});

	const listeExamens: Examen[] = examens.map((e) => ({
		id: e.id,
		nom: e.nom,
		date: e.date.toISOString().split('T')[0],
		classeId: e.classeId,
		periode: e.periode || undefined,
		sousExamens: (e.sousExamens || []).map((s) => ({ id: s.id, nom: s.nom, examenId: s.examenId }))
	}));

	const inscriptions = await prisma.inscription.findMany({
		where: { classeId: params.id, actif: true },
		include: {
			eleve: {
				include: {
					personne: true,
					notes: true,
					absences: true,
					retards: true
				}
			}
		}
	});

	const allAbsenceIds = inscriptions.flatMap((i) => i.eleve.absences?.map((a) => a.id) ?? []);
	const allRetardIds = inscriptions.flatMap((i) => i.eleve.retards?.map((r) => r.id) ?? []);
	const lignesJustifiees = await prisma.rapportLigne.findMany({
		where: {
			OR: [{ absenceId: { in: allAbsenceIds } }, { retardId: { in: allRetardIds } }]
		},
		select: { absenceId: true, retardId: true }
	});
	const justifiedAbsenceIds = new Set(
		lignesJustifiees.filter((l) => l.absenceId).map((l) => l.absenceId as string)
	);
	const justifiedRetardIds = new Set(
		lignesJustifiees.filter((l) => l.retardId).map((l) => l.retardId as string)
	);

	const eleves = inscriptions.map((i) => ({
		id: i.eleve.id,
		nom: i.eleve.personne.name,
		prenom: i.eleve.personne.lastname,
		sexe: i.eleve.sexe ?? null,
		im: i.eleve.im ?? null,
		situation: i.eleve.situation ?? 'P',
		dateNaissance: i.eleve.dateNaissance?.toISOString().split('T')[0] || '',
		notes:
			i.eleve.notes?.map((n) => ({
				id: n.id,
				valeur: n.valeur,
				coefficient: n.coefficient,
				coursId: n.coursId,
				examenId: n.examenId || null,
				sousExamenId: n.sousExamenId || null
			})) || [],
		absences:
			i.eleve.absences?.map((a) => ({
				id: a.id,
				date: a.date.toISOString().split('T')[0],
				justifie: justifiedAbsenceIds.has(a.id),
				motif: (a as any).motif || null
			})) || [],
		retards:
			i.eleve.retards?.map((r) => ({
				id: r.id,
				date: r.date.toISOString().split('T')[0],
				duree: r.duree,
				justifie: justifiedRetardIds.has(r.id),
				motif: (r as any).motif || null
			})) || []
	}));

	// ---- Incidents par élève (année active) ----
	const eleveIds = eleves.map((e) => e.id);
	const incidents = anneeId
		? await prisma.incident.findMany({
				where: { eleveId: { in: eleveIds }, anneeId },
				select: { eleveId: true, type: true }
			})
		: [];
	const incidentsByEleve: Record<
		string,
		{ INFO: number; ERREUR: number; NOTE: number; ABSENT: number; total: number }
	> = {};
	for (const e of eleves) {
		incidentsByEleve[e.id] = { INFO: 0, ERREUR: 0, NOTE: 0, ABSENT: 0, total: 0 };
	}
	for (const inc of incidents) {
		const bucket = incidentsByEleve[inc.eleveId];
		if (!bucket) continue;
		if (inc.type === 'INFO') bucket.INFO++;
		else if (inc.type === 'ERREUR') bucket.ERREUR++;
		else if (inc.type === 'NOTE') bucket.NOTE++;
		else if (inc.type === 'ABSENT') bucket.ABSENT++;
		bucket.total++;
	}

	// ---- Emploi du temps : volume horaire hebdomadaire ----
	const emploiDuTemps = await prisma.emploiDuTemps.findFirst({
		where: { classeId: params.id },
		include: { seances: true }
	});
	const edtSeances = (emploiDuTemps?.seances ?? []).map((s) => ({
		coursId: s.coursId,
		jour: s.jour,
		heureDebut: s.heureDebut,
		heureFin: s.heureFin,
		duree: dureeHeures(s.heureDebut, s.heureFin)
	}));

	// ---- Séances de cours en direct (assiduité des enseignants) ----
	const seanceCours = anneeId
		? await prisma.seanceCours.findMany({
				where: { coursId: { in: coursIds }, anneeId },
				select: {
					id: true,
					coursId: true,
					professeurId: true,
					statut: true,
					dateDebut: true,
					dateFin: true
				}
			})
		: [];
	const seancesBrutes = seanceCours.map((s) => ({
		id: s.id,
		coursId: s.coursId,
		professeurId: s.professeurId,
		statut: s.statut,
		dateDebut: s.dateDebut.toISOString(),
		dateFin: s.dateFin ? s.dateFin.toISOString() : null
	}));

	return {
		classe: classe
			? {
					id: classe.id,
					nom: classe.nom,
					niveau: classe.niveau,
					anneeScolaire: classe.anneeScolaire ? { nom: classe.anneeScolaire.nom } : null
				}
			: null,
		listeCours,
		listeExamens,
		eleves,
		incidentsByEleve,
		edtSeances,
		seanceCours: seancesBrutes
	};
};
