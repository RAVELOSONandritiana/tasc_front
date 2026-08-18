import type { PageServerLoad } from './$types';
import { prisma, getActiveAnneeScolaire } from '$lib/server/prisma';

function dureeHeures(heureDebut: string, heureFin: string): number {
	const [dh, dm] = heureDebut.split(':').map(Number);
	const [fh, fm] = heureFin.split(':').map(Number);
	const debut = dh * 60 + (dm || 0);
	const fin = fh * 60 + (fm || 0);
	const diff = fin - debut;
	return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

export const load: PageServerLoad = async ({ url }) => {
	const annee = await getActiveAnneeScolaire();
	const anneeId = annee?.id ?? '';

	// ---- Toutes les classes (pour le sélecteur) ----
	const toutesClasses = await prisma.classe.findMany({
		where: { anneeId },
		include: { titulaire: { include: { personne: true } } },
		orderBy: [{ niveau: 'desc' }, { nom: 'asc' }]
	});

	const classesList = toutesClasses.map((c) => ({
		id: c.id,
		nom: c.nom,
		niveau: c.niveau,
		serie: c.serie,
		titulaireId: c.titulaireId,
		titulaire: c.titulaire
			? `${c.titulaire.personne.name} ${c.titulaire.personne.lastname}`
			: null
	}));

	// ---- Classes sélectionnées (via ?classes=id,id) ----
	const paramsClasses = (url.searchParams.get('classes') || '')
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean);
	const selectedIds = paramsClasses.length
		? paramsClasses.filter((id) => classesList.some((c) => c.id === id))
		: classesList.map((c) => c.id);
	const selectedSet = new Set(selectedIds);

	// ---- Cours des classes sélectionnées ----
	const coursList = await prisma.cours.findMany({
		where: { classeId: { in: selectedIds }, anneeId },
		include: { matiere: true, professeur: { include: { personne: true } } }
	});

	const listeCours = coursList.map((c) => ({
		id: c.id,
		nom: c.matiere.nom,
		coefficient: c.coefficient,
		professeur: c.professeur
			? `${c.professeur.personne.name} ${c.professeur.personne.lastname}`
			: '',
		professeurId: c.professeurId ?? null,
		participants: c.participants || [],
		matiereId: c.matiereId,
		classeId: c.classeId,
		matiere: { id: c.matiere.id, nom: c.matiere.nom, couleur: c.matiere.couleur || undefined }
	}));

	// ---- Examens des classes sélectionnées ----
	const examens = await prisma.examen.findMany({
		where: { classeId: { in: selectedIds }, anneeId },
		orderBy: { date: 'asc' },
		include: { sousExamens: { orderBy: { createdAt: 'asc' } } }
	});

	const listeExamens = examens.map((e) => ({
		id: e.id,
		nom: e.nom,
		date: e.date.toISOString().split('T')[0],
		classeId: e.classeId,
		periode: e.periode || undefined,
		sousExamens: (e.sousExamens || []).map((s) => ({ id: s.id, nom: s.nom, examenId: s.examenId }))
	}));

	// ---- Volume horaire (emploi du temps) des classes sélectionnées ----
	const edts = await prisma.emploiDuTemps.findMany({
		where: { classeId: { in: selectedIds }, anneeId },
		include: { seances: true }
	});
	const edtSeances = edts
		.flatMap((e) =>
			e.seances.map((s) => ({
				id: s.id,
				classeId: e.classeId,
				coursId: s.coursId,
				jour: s.jour,
				heureDebut: s.heureDebut,
				heureFin: s.heureFin,
				duree: dureeHeures(s.heureDebut, s.heureFin)
			}))
		)
		.filter((s) => selectedSet.has(s.classeId));

	// ---- Inscriptions actives des classes sélectionnées ----
	const inscriptions = await prisma.inscription.findMany({
		where: { classeId: { in: selectedIds }, actif: true, anneeId },
		include: {
			classe: { select: { id: true, nom: true, niveau: true, serie: true } },
			eleve: {
				include: {
					personne: true,
					notes: true,
					absences: true,
					retards: true,
					incidents: { where: { anneeId } }
				}
			}
		}
	});

	// Justification des absences/retards (rapports)
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
		classeId: i.classeId,
		classeNom: i.classe?.nom ?? null,
		classeNiveau: i.classe?.niveau ?? 0,
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
				justifie: justifiedAbsenceIds.has(a.id)
			})) || [],
		retards:
			i.eleve.retards?.map((r) => ({
				id: r.id,
				date: r.date.toISOString().split('T')[0],
				duree: r.duree,
				justifie: justifiedRetardIds.has(r.id)
			})) || [],
		incidents: (i.eleve.incidents || []).map((inc) => ({
			id: inc.id,
			type: inc.type,
			message: inc.message,
			date: inc.date.toISOString().split('T')[0]
		}))
	}));

	// ---- Assiduité des enseignants (pour repérer un professeur en difficulté) ----
	const coursIds = listeCours.map((c) => c.id);
	const absencesProfBrutes =
		anneeId && coursIds.length
			? await prisma.absenceProf.findMany({
					where: { anneeId, coursId: { in: coursIds } },
					orderBy: { date: 'desc' },
					include: { professeur: { include: { personne: true } } }
				})
			: [];
	const absencesProf = absencesProfBrutes.map((a) => {
		const heureDebut = `${String(a.date.getHours()).padStart(2, '0')}:${String(a.date.getMinutes()).padStart(2, '0')}`;
		const seance = edtSeances.find(
			(s) => s.coursId === a.coursId && s.heureDebut === heureDebut && s.classeId === a.classeId
		);
		const heures =
			seance?.duree ??
			(a.coursId
				? Math.round(
						(edtSeances.filter((s) => s.coursId === a.coursId).reduce((t, x) => t + x.duree, 0) /
							(Math.max(1, edtSeances.filter((s) => s.coursId === a.coursId).length))) *
							100
					) / 100
				: 0);
		return {
			id: a.id,
			professeurId: a.professeurId,
			professeurNom: `${a.professeur.personne.name} ${a.professeur.personne.lastname}`,
			coursId: a.coursId,
			coursNom: listeCours.find((c) => c.id === a.coursId)?.nom ?? 'Cours',
			classeId: a.classeId ?? null,
			date: `${a.date.getFullYear()}-${String(a.date.getMonth() + 1).padStart(2, '0')}-${String(a.date.getDate()).padStart(2, '0')}`,
			heures,
			justifie: a.justifie
		};
	});

	const pointages =
		anneeId && coursIds.length
			? await prisma.pointage.findMany({
					where: { coursId: { in: coursIds }, anneeId },
					select: {
						id: true,
						coursId: true,
						professeurId: true,
						heuresPrevues: true,
						heuresEffectuees: true,
						causeIncomplet: true
					}
				})
			: [];
	const pointagesBruts = pointages.map((p) => ({
		id: p.id,
		coursId: p.coursId,
		professeurId: p.professeurId,
		heuresPrevues: p.heuresPrevues ?? null,
		heuresEffectuees: p.heuresEffectuees,
		manque:
			p.heuresPrevues != null
				? Math.max(0, Math.round((p.heuresPrevues - p.heuresEffectuees) * 100) / 100)
				: 0
	}));

	return {
		classes: classesList,
		selectedIds,
		listeCours,
		listeExamens,
		edtSeances,
		eleves,
		absencesProf,
		pointages: pointagesBruts,
		anneeActive: !!annee
	};
};
