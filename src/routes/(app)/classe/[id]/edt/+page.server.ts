import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';

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
		currentProfesseurId
	};
};

export const actions: Actions = {
	createSeance: async ({ request, params }) => {
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

	updateSeance: async ({ request, params }) => {
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

	deleteSeance: async ({ request, params }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		await prisma.seanceEDT.delete({
			where: { id }
		});

		throw redirect(303, `/classe/${params.id}/edt`);
	}
};