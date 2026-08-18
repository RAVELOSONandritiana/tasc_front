import type { PageServerLoad, Actions } from './$types';
import { prisma, getProfesseurs, updateCours, getActiveAnneeScolaire } from '$lib/server/prisma';
import { registerPointage, PointageError } from '$lib/server/pointage';
import { AbsenceProfError, declareAbsenceProf, normaliserHeure } from '$lib/server/absenceProf';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const classeId = params.id;

	const classe = await prisma.classe.findUnique({
		where: { id: classeId },
		include: {
			emploisDuTemps: {
				include: {
					seances: {
						include: {
							cours: {
								include: {
									matiere: true,
									professeur: {
										include: {
											personne: true
										}
									}
								}
							},
							salle: true
						}
					}
				}
			}
		}
	});

	if (!classe) {
		throw redirect(303, '/classe');
	}

	const salles = await prisma.salle.findMany({
		orderBy: { num: 'asc' }
	});

	const jours = [
		'Lundi',
		'Mardi',
		'Mercredi',
		'Jeudi',
		'Vendredi'
	];
	const heures = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];

	const emploiDuTemps = classe.emploisDuTemps?.[0];
	const seances = (emploiDuTemps?.seances ?? []).map((seance) => ({
		id: seance.id,
		jour: seance.jour,
		heureDebut: seance.heureDebut,
		heureFin: seance.heureFin,
		coursId: seance.cours.id,
		coursNom: seance.cours.matiere.nom,
		salleId: seance.salle?.id,
		salleNom: seance.salle?.nom,
		salleNum: seance.salle?.num
	}));

	const coursList = await prisma.cours.findMany({
		where: { classeId: classeId },
		include: {
			matiere: true,
			professeur: {
				include: {
					personne: true
				}
			}
		}
	});

	const cours = coursList.map((c) => ({
		id: c.id,
		matiereId: c.matiereId,
		matiereNom: c.matiere?.nom || 'Matière',
		coefficient: c.coefficient,
		professeur: c.professeur ? `${c.professeur.personne.name} ${c.professeur.personne.lastname}` : '',
		professeurId: c.professeurId || null
	}));

	const currentProfesseurId = locals.user
		? ((await prisma.compte.findUnique({
				where: { id: locals.user.userId },
				include: { personne: { include: { professeur: true } } }
			}))?.personne?.professeur?.id ?? null)
		: null;

	const profs = await getProfesseurs();

	// Eleves de la classe pour l'annee active (utiles pour la fenetre
	// "Demarrer le cours" : pointage des absents/retards par numero).
	const annee = await getActiveAnneeScolaire();
	const seuilAbsence = annee?.seuilAbsenceConvoc ?? 3;

	function numeroClasse(
		eleve: { id: string; nom: string; prenom: string; sexe: string },
		tous: { id: string; nom: string; prenom: string; sexe: string }[]
	): string {
		const ordre =
			tous
				.filter((e) => e.sexe === eleve.sexe)
				.sort((a, b) =>
					`${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr')
				)
				.findIndex((e) => e.id === eleve.id) + 1;
		const suffix = eleve.sexe === 'F' ? 'F' : 'G';
		return `${ordre}${suffix}`;
	}

	const elevesBruts = annee
		? await prisma.inscription.findMany({
				where: { classeId, anneeId: annee.id, actif: true },
				include: { eleve: { include: { personne: true } } }
			})
		: [];

	const eleves: { id: string; nom: string; prenom: string; sexe: string; numero: string }[] =
		elevesBruts.map((ins) => ({
			id: ins.eleve.id,
			nom: ins.eleve.personne.lastname,
			prenom: ins.eleve.personne.name,
			sexe: ins.eleve.sexe || 'G',
			numero: ''
		}));
	for (const e of eleves) e.numero = numeroClasse(e, eleves);

	return {
		classe,
		annee: annee?.nom || '',
		seances,
		salles: salles.map((s) => ({
			id: s.id,
			num: s.num,
			name: s.nom,
			place: s.capacite,
			imageUrl: s.imageUrl
		})),
		jours,
		heures,
		cours,
		professeurs: profs.map((p) => ({
			id: p.id,
			nom: `${p.personne?.name || ''} ${p.personne?.lastname || ''}`.trim() || 'Professeur'
		})),
		currentProfesseurId,
		userRole: locals.user?.role ?? null,
		eleves,
		seuilAbsence,
		anneeActive: !!annee
	};
};

const MODIFIABLE_ROLES = ['ADMINISTRATEUR', 'SURVEILLANT', 'ENSEIGNANT', 'OPERATEUR'];

const JOURS_VALIDES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function peutModifierEDT(role: string | undefined): boolean {
	return !!role && MODIFIABLE_ROLES.includes(role);
}

/**
 * Valide le creneau d'une seance. Sans ce controle, un champ vide creait une
 * seance sans horaire, ce qui cassait l'affichage de l'emploi du temps et la
 * declaration d'absence (date invalide).
 */
function validerCreneau(
	jour: string | null,
	heureDebut: string | null,
	heureFin: string | null
): { jour: string; heureDebut: string; heureFin: string } | { error: string } {
	if (!jour || !JOURS_VALIDES.includes(jour)) return { error: 'Jour invalide' };
	const debut = normaliserHeure(heureDebut);
	const fin = normaliserHeure(heureFin);
	if (!debut) return { error: 'Heure de début requise' };
	if (!fin) return { error: 'Heure de fin requise' };
	if (fin <= debut) return { error: 'L’heure de fin doit être après l’heure de début' };
	return { jour, heureDebut: debut, heureFin: fin };
}

export const actions: Actions = {
	createSeance: async ({ request, params, locals }) => {
		if (!peutModifierEDT(locals.user?.role)) {
			return fail(403, { error: 'Action non autorisée' });
		}
		const formData = await request.formData();
		const coursId = (formData.get('coursId') as string) || '';
		const salleId = formData.get('salleId') as string | null;
		const classeId = params.id;

		const creneau = validerCreneau(
			formData.get('jour') as string | null,
			formData.get('heureDebut') as string | null,
			formData.get('heureFin') as string | null
		);
		if ('error' in creneau) return fail(400, { error: creneau.error });
		if (!coursId) return fail(400, { error: 'Matière requise' });

		const cours = await prisma.cours.findFirst({ where: { id: coursId, classeId } });
		if (!cours) return fail(400, { error: 'Cette matière n’appartient pas à cette classe' });

		let emploiDuTemps = await prisma.emploiDuTemps.findFirst({
			where: { classeId: classeId }
		});

		if (!emploiDuTemps) {
			const annee = await getActiveAnneeScolaire();
			if (!annee) return fail(400, { error: "Aucune année scolaire n'est active" });
			emploiDuTemps = await prisma.emploiDuTemps.create({
				data: {
					classeId: classeId,
					anneeId: annee.id
				}
			});
		}

		await prisma.seanceEDT.create({
			data: {
				jour: creneau.jour,
				heureDebut: creneau.heureDebut,
				heureFin: creneau.heureFin,
				edtId: emploiDuTemps.id,
				coursId,
				salleId: salleId || undefined
			}
		});

		throw redirect(303, `/classe/${classeId}/edt`);
	},

	updateSeance: async ({ request, params, locals }) => {
		if (!peutModifierEDT(locals.user?.role)) {
			return fail(403, { error: 'Action non autorisée' });
		}
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const salleId = formData.get('salleId') as string | null;

		const creneau = validerCreneau(
			formData.get('jour') as string | null,
			formData.get('heureDebut') as string | null,
			formData.get('heureFin') as string | null
		);
		if ('error' in creneau) return fail(400, { error: creneau.error });

		await prisma.seanceEDT.update({
			where: { id },
			data: {
				jour: creneau.jour,
				heureDebut: creneau.heureDebut,
				heureFin: creneau.heureFin,
				salleId: salleId || undefined
			}
		});

		throw redirect(303, `/classe/${params.id}/edt`);
	},

	deleteSeance: async ({ request, params, locals }) => {
		if (!peutModifierEDT(locals.user?.role)) {
			return fail(403, { error: 'Action non autorisée' });
		}
		const formData = await request.formData();
		const id = formData.get('id') as string;

		await prisma.seanceEDT.delete({
			where: { id }
		});

		throw redirect(303, `/classe/${params.id}/edt`);
	},

	// Change le professeur d'un cours. Cela ne supprime ni le cours, ni les
	// notes/retards associés : seule la liaison professeur du cours est mise à
	// jour, ce qui synchronise automatiquement les profils et la page enseignant
	// (qui lisent les cours par professeurId).
	updateCoursProfesseur: async ({ request, params, locals }) => {
		if (!peutModifierEDT(locals.user?.role)) {
			return fail(403, { error: 'Action non autorisée' });
		}
		const formData = await request.formData();
		const coursId = formData.get('coursId') as string;
		const professeurId = (formData.get('professeurId') as string) || null;
		const seanceId = (formData.get('seanceId') as string) || null;
		const salleId = (formData.get('salleId') as string) || null;
		const heureDebut = (formData.get('heureDebut') as string) || null;
		const heureFin = (formData.get('heureFin') as string) || null;
		const jour = (formData.get('jour') as string) || null;

		if (!coursId) {
			return fail(400, { error: 'Cours requis' });
		}

		// Le creneau n'est valide que si la seance est modifiee : on refuse une
		// heure vide ou incoherente plutot que d'enregistrer un horaire casse.
		if (seanceId) {
			const creneau = validerCreneau(jour, heureDebut, heureFin);
			if ('error' in creneau) return fail(400, { error: creneau.error });
		}

		try {
			await updateCours(coursId, { professeurId: professeurId || undefined });

			if (seanceId) {
				await prisma.seanceEDT.update({
					where: { id: seanceId },
					data: {
						salleId: salleId || undefined,
						...(jour ? { jour } : {}),
						...(heureDebut ? { heureDebut: normaliserHeure(heureDebut) ?? heureDebut } : {}),
						...(heureFin ? { heureFin: normaliserHeure(heureFin) ?? heureFin } : {})
					}
				});
			}
		} catch (e: unknown) {
			return fail(500, { error: (e as Error)?.message || 'Erreur lors du changement de professeur' });
		}

		throw redirect(303, `/classe/${params.id}/edt`);
	},

	/**
	 * Declare le professeur absent (cours manque) pour une seance de l'emploi
	 * du temps. Renvoie un JSON pour la fenetre de l'emploi du temps.
	 */
	absenceProf: async ({ request, params, locals }) => {
		const formData = await request.formData();
		try {
			const absence = await declareAbsenceProf({
				classeId: params.id,
				seanceId: (formData.get('seanceId') as string) || '',
				dateRaw: (formData.get('date') as string) || '',
				motif: (formData.get('motif') as string) || null,
				justifie: formData.get('justifie') === 'true' || formData.get('justifie') === 'on',
				locals
			});
			return {
				success: true,
				absenceId: absence.absenceId,
				message: `Absence de ${absence.professeurNom} enregistrée (${absence.heures} h manquée(s)).`
			};
		} catch (e) {
			if (e instanceof AbsenceProfError) return fail(e.status, { error: e.message });
			console.error('Erreur absence enseignant:', e);
			return fail(500, { error: 'Erreur lors de l’enregistrement de l’absence' });
		}
	},

	// Pointage d'un cours directement depuis l'emploi du temps (fenetre
	// "Demarrer le cours"). Renvoie un JSON (pas de redirection) pour que la
	// fenetre popup puisse afficher le resultat.
	enregistrer: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const dateRaw = (formData.get('date') as string) || '';
		const heuresEffectueesRaw = formData.get('heuresEffectuees') as string;
		const causeIncomplet = (formData.get('causeIncomplet') as string)?.trim() || null;
		const absentIds = formData.getAll('absentIds').map(String).filter(Boolean);
		const retardIds = formData.getAll('retardIds').map(String).filter(Boolean);
		const profAbsent = formData.get('profAbsent') === 'true';
		const motifProfAbsent = (formData.get('motifProfAbsent') as string)?.trim() || null;
		const seanceId = (formData.get('seanceId') as string) || null;

		const heuresEffectuees = parseFloat(heuresEffectueesRaw);

		try {
			const result = await registerPointage({
				classeId: params.id,
				coursId: (formData.get('coursId') as string) || '',
				seanceId,
				dateRaw,
				heuresEffectuees,
				causeIncomplet,
				absentIds,
				retardIds,
				profAbsent,
				motifProfAbsent,
				locals
			});
			return { success: true, alertes: result.alertes };
		} catch (e) {
			if (e instanceof PointageError) {
				return fail(e.status, { error: e.message });
			}
			console.error('Erreur pointage:', e);
			return fail(500, { error: 'Erreur lors de l’enregistrement' });
		}
	}
};