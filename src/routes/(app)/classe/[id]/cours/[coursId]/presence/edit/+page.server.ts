import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';

type InscriptionWithEleve = {
	eleve: {
		id: string;
		dateNaissance: Date;
		photoUrl?: string | null;
		personne: {
			name: string;
			lastname: string;
		};
	};
	actif: boolean;
};

export const load: PageServerLoad = async ({ params }) => {
	const classeId = params.id;
	const coursId = params.coursId;

	const classe = await prisma.classe.findUnique({
		where: { id: classeId },
		include: {
			inscriptions: {
				where: { actif: true },
				include: {
					eleve: {
						include: {
							personne: true
						}
					}
				}
			}
		}
	});

	const cours = await prisma.cours.findUnique({
		where: { id: coursId },
		include: {
			matiere: true
		}
	});

	const seance = await prisma.seanceEDT.findFirst({
		where: { coursId: coursId },
		include: { salle: true }
	});

	if (!classe || !cours) {
		throw redirect(303, `/classe/${classeId}/cours`);
	}

	const eleves = (classe.inscriptions as InscriptionWithEleve[]).map((inscription) => ({
		id: inscription.eleve.id,
		nom: inscription.eleve.personne.lastname,
		prenom: inscription.eleve.personne.name,
		dateNaissance: inscription.eleve.dateNaissance.toISOString().split('T')[0],
		actif: inscription.actif,
		photoUrl: inscription.eleve.photoUrl
	}));

	return {
		eleves,
		cours: {
			id: cours.id,
			nom: cours.matiere.nom
		},
		coursNom: cours.matiere.nom,
		salleNom: seance?.salle?.nom || 'Non définie',
		heureDebut: seance?.heureDebut || '08:00',
		heureFin: seance?.heureFin || '10:00'
	};
};

export const actions: Actions = {
	updatePresence: async ({ request, params }) => {
		const formData = await request.formData();
		const eleveIds = formData.getAll('eleveId[]') as string[];
		const statuses = formData.getAll('status[]') as string[];

		// Bornes de la journee : on evite de creer un doublon si l'eleve a deja
		// ete marque absent / en retard aujourd'hui (double soumission,
		// correction faite apres la cloture de la seance, ...).
		const debutJour = new Date();
		debutJour.setHours(0, 0, 0, 0);
		const finJour = new Date(debutJour);
		finJour.setDate(finJour.getDate() + 1);

		for (let i = 0; i < eleveIds.length; i++) {
			const eleveId = eleveIds[i];
			const status = statuses[i] as 'present' | 'absent' | 'retard';

			const inscription = await prisma.inscription.findFirst({
				where: {
					eleveId: eleveId,
					classeId: params.id,
					actif: true
				}
			});

			if (!inscription) continue;

			if (status === 'absent') {
				const existante = await prisma.absence.findFirst({
					where: { eleveId, date: { gte: debutJour, lt: finJour } }
				});
				if (existante) continue;
				await prisma.absence.create({
					data: {
						eleveId,
						inscriptionId: inscription.id,
						date: new Date()
					}
				});
			} else if (status === 'retard') {
				const existant = await prisma.retard.findFirst({
					where: { eleveId, date: { gte: debutJour, lt: finJour } }
				});
				if (existant) continue;
				await prisma.retard.create({
					data: {
						eleveId,
						inscriptionId: inscription.id,
						duree: '10min',
						date: new Date()
					}
				});
			}
		}

		throw redirect(303, `/classe/${params.id}/cours/${params.coursId}/presence`);
	}
};
