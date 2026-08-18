import type { PageServerLoad, Actions } from './$types';
import { prisma, getActiveAnneeScolaire } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { broadcastRealtime } from '$lib/server/realtime';
import {
	AbsenceProfError,
	JOURS_SEMAINE,
	ROLES_ABSENCE_PROF,
	declareAbsenceProf
} from '$lib/server/absenceProf';
import type { Cours, Examen } from '$lib/types/Materiel.type';

function dureeHeures(heureDebut: string, heureFin: string): number {
	const [dh, dm] = heureDebut.split(':').map(Number);
	const [fh, fm] = heureFin.split(':').map(Number);
	const debut = dh * 60 + (dm || 0);
	const fin = fh * 60 + (fm || 0);
	const diff = fin - debut;
	return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

/// Heure locale "HH:MM" d'une date (l'heure de debut de la seance manquee est
/// stockee dans la date de l'absence).
function heureLocale(d: Date): string {
	return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/// Date locale au format "AAAA-MM-JJ" (on evite toISOString qui bascule en UTC).
function dateLocale(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const load: PageServerLoad = async ({ params, locals }) => {
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
		id: s.id,
		coursId: s.coursId,
		jour: s.jour,
		heureDebut: s.heureDebut,
		heureFin: s.heureFin,
		duree: dureeHeures(s.heureDebut, s.heureFin)
	}));

	// Seances de l'emploi du temps indexees par "cours + heure de debut" :
	// une absence d'enseignant reference toujours une seance prevue a l'emploi
	// du temps (sa date porte l'heure de debut de la seance manquee).
	const seanceParCle = new Map(edtSeances.map((s) => [`${s.coursId}|${s.heureDebut}`, s]));
	const nomCoursById = new Map(listeCours.map((c) => [c.id, c.nom]));

	// Duree moyenne d'une seance par cours : sert de repli si la seance a ete
	// supprimee ou deplacee dans l'emploi du temps depuis la declaration.
	const dureeMoyenneParCours = new Map<string, number>();
	for (const c of listeCours) {
		const s = edtSeances.filter((x) => x.coursId === c.id);
		if (s.length > 0) {
			dureeMoyenneParCours.set(
				c.id,
				Math.round((s.reduce((t, x) => t + x.duree, 0) / s.length) * 100) / 100
			);
		}
	}

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

	// ---- Pointages effectués par les opérateurs / surveillants ----
	// Ils alimentent aussi l'assiduité des enseignants (heures réalisées).
	const pointages = anneeId
		? await prisma.pointage.findMany({
				where: { coursId: { in: coursIds }, anneeId },
				select: {
					id: true,
					coursId: true,
					professeurId: true,
					date: true,
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
		date: p.date.toISOString(),
		heuresPrevues: p.heuresPrevues ?? null,
		heuresEffectuees: p.heuresEffectuees,
		incomplet: Boolean(p.causeIncomplet),
		motif: p.causeIncomplet || null
	}));

	// ---- Absences des enseignants ----
	// Une absence d'enseignant = une seance de l'emploi du temps qui n'a pas
	// ete assuree. Les heures manquees sont exactement celles de cette seance :
	// on ne les deduit plus d'un cumul depuis le debut de l'annee scolaire.
	const absencesProfBrutes =
		anneeId && coursIds.length
			? await prisma.absenceProf.findMany({
					where: { anneeId, coursId: { in: coursIds } },
					orderBy: { date: 'desc' },
					include: { professeur: { include: { personne: true } } }
				})
			: [];

	const absencesProf = absencesProfBrutes.map((a) => {
		const heureDebut = heureLocale(a.date);
		const seance = a.coursId ? seanceParCle.get(`${a.coursId}|${heureDebut}`) : undefined;
		const heures =
			seance?.duree ?? (a.coursId ? (dureeMoyenneParCours.get(a.coursId) ?? 0) : 0);
		return {
			id: a.id,
			professeurId: a.professeurId,
			professeurNom: `${a.professeur.personne.name} ${a.professeur.personne.lastname}`,
			coursId: a.coursId,
			coursNom: (a.coursId ? nomCoursById.get(a.coursId) : null) ?? 'Cours',
			date: dateLocale(a.date),
			jour: JOURS_SEMAINE[a.date.getDay()],
			heureDebut,
			heureFin: seance?.heureFin ?? null,
			heures,
			motif: a.motif || null,
			justifie: a.justifie
		};
	});

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
		seanceCours: seancesBrutes,
		pointages: pointagesBruts,
		absencesProf,
		anneeActive: !!annee,
		canGererAbsenceProf: ROLES_ABSENCE_PROF.includes(locals.user?.role ?? '')
	};
};

export const actions: Actions = {
	/**
	 * Declare l'absence d'un enseignant sur une seance de l'emploi du temps.
	 * La seance choisie determine le cours, l'enseignant et le nombre d'heures
	 * manquees ; la date doit tomber le meme jour de la semaine que la seance.
	 */
	absenceProf: async ({ request, params, locals }) => {
		const form = await request.formData();
		const seanceId = ((form.get('seanceId') as string) || '').trim();
		const dateRaw = ((form.get('date') as string) || '').trim();
		const motif = ((form.get('motif') as string) || '').trim() || null;
		const justifie = form.get('justifie') === 'true' || form.get('justifie') === 'on';

		try {
			const absence = await declareAbsenceProf({
				classeId: params.id,
				seanceId,
				dateRaw,
				motif,
				justifie,
				locals
			});
			return { success: true, absenceId: absence.absenceId };
		} catch (e) {
			if (e instanceof AbsenceProfError) return fail(e.status, { error: e.message });
			console.error('Erreur absence enseignant:', e);
			return fail(500, { error: 'Erreur lors de l’enregistrement de l’absence' });
		}
	},

	/** Annule une absence d'enseignant declaree par erreur. */
	supprimerAbsenceProf: async ({ request, params, locals }) => {
		if (!ROLES_ABSENCE_PROF.includes(locals.user?.role ?? '')) {
			return fail(403, {
				error: 'Réservé à l’administrateur, au surveillant ou à l’opérateur'
			});
		}

		const form = await request.formData();
		const id = ((form.get('id') as string) || '').trim();
		if (!id) return fail(400, { error: 'Absence requise' });

		const absence = await prisma.absenceProf.findUnique({
			where: { id },
			include: { cours: true }
		});
		if (!absence) return fail(404, { error: 'Absence introuvable' });
		if (absence.classeId !== params.id && absence.cours?.classeId !== params.id) {
			return fail(400, { error: 'Cette absence n’appartient pas à cette classe' });
		}

		try {
			await prisma.absenceProf.delete({ where: { id } });
			const prof = await prisma.professeur.findUnique({
				where: { id: absence.professeurId },
				select: { absences: true }
			});
			if (prof && prof.absences > 0) {
				await prisma.professeur
					.update({ where: { id: absence.professeurId }, data: { absences: { decrement: 1 } } })
					.catch(() => {});
			}

			logActivity(
				locals.user ?? null,
				'absence_enseignant',
				`Annulation d’une absence d’enseignant du ${dateLocale(absence.date)}`
			).catch(() => {});

			broadcastRealtime({ entity: 'enseignant', action: 'update', id: absence.professeurId });

			return { success: true };
		} catch (e) {
			console.error('Erreur suppression absence enseignant:', e);
			return fail(500, { error: 'Erreur lors de la suppression' });
		}
	}
};
