import type { PageServerLoad, Actions } from './$types';
import { prisma, getProfesseurs, updateCours } from '$lib/server/prisma';
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
		salleNom: seance.salle?.nom
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

	return {
		classe,
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
		userRole: locals.user?.role ?? null
	};
};

const MODIFIABLE_ROLES = ['ADMINISTRATEUR', 'SURVEILLANT', 'ENSEIGNANT', 'OPERATEUR'];

function peutModifierEDT(role: string | undefined): boolean {
	return !!role && MODIFIABLE_ROLES.includes(role);
}

export const actions: Actions = {
	createSeance: async ({ request, params, locals }) => {
		if (!peutModifierEDT(locals.user?.role)) {
			return fail(403, { error: 'Action non autorisée' });
		}
		const formData = await request.formData();
		const jour = formData.get('jour') as string;
		const heureDebut = formData.get('heureDebut') as string;
		const heureFin = formData.get('heureFin') as string;
		const coursId = formData.get('coursId') as string;
		const salleId = formData.get('salleId') as string | null;
		const classeId = params.id;

		let emploiDuTemps = await prisma.emploiDuTemps.findFirst({
			where: { classeId: classeId }
		});

		if (!emploiDuTemps) {
			emploiDuTemps = await prisma.emploiDuTemps.create({
				data: {
					classeId: classeId,
					anneeId: (await prisma.anneeScolaire.findFirst({ where: { active: true } }))?.id || ''
				}
			});
		}

		await prisma.seanceEDT.create({
			data: {
				jour,
				heureDebut,
				heureFin,
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
		const jour = formData.get('jour') as string;
		const heureDebut = formData.get('heureDebut') as string;
		const heureFin = formData.get('heureFin') as string;
		const salleId = formData.get('salleId') as string | null;

		await prisma.seanceEDT.update({
			where: { id },
			data: {
				jour,
				heureDebut,
				heureFin,
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
		const seanceId = formData.get('seanceId') as string | null;
		const salleId = (formData.get('salleId') as string) || null;
		const heureDebut = (formData.get('heureDebut') as string) || null;
		const heureFin = (formData.get('heureFin') as string) || null;

		if (!coursId) {
			return fail(400, { error: 'Cours requis' });
		}

		try {
			await updateCours(coursId, { professeurId: professeurId || undefined });

			if (seanceId) {
				await prisma.seanceEDT.update({
					where: { id: seanceId },
					data: {
						salleId: salleId || undefined,
						...(heureDebut ? { heureDebut } : {}),
						...(heureFin ? { heureFin } : {})
					}
				});
			}
		} catch (e: unknown) {
			return fail(500, { error: (e as Error)?.message || 'Erreur lors du changement de professeur' });
		}

		throw redirect(303, `/classe/${params.id}/edt`);
	}
};