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
			imageUrl?: string | null;
		};
	};
	actif: boolean;
};

type AbsenceWithInscription = {
	id: string;
	date: Date;
	justifie: boolean;
	motif?: string | null;
	inscription: {
		eleve: {
			id: string;
		};
	};
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
			matiere: true,
			professeur: {
				include: {
					personne: true
				}
			}
		}
	});

	if (!classe || !cours) {
		throw redirect(303, `/classe/${classeId}/cours`);
	}

	const seance = await prisma.seanceEDT.findFirst({
		where: { coursId: coursId },
		include: { salle: true }
	});

	const eleves = (classe.inscriptions as InscriptionWithEleve[]).map((inscription) => ({
		id: inscription.eleve.id,
		nom: inscription.eleve.personne.lastname,
		prenom: inscription.eleve.personne.name,
		dateNaissance: inscription.eleve.dateNaissance.toISOString().split('T')[0],
		actif: inscription.actif,
		photoUrl: inscription.eleve.photoUrl,
		imageUrl: inscription.eleve.personne.imageUrl || null
	}));

	const absenceNotes = await prisma.absence.findMany({
		where: {
			inscription: {
				classeId: classeId,
				actif: true
			}
		},
		include: {
			inscription: {
				include: {
					eleve: true
				}
			}
		},
		take: 100
	});

	const absenceMap: Record<
		string,
		{ id: string; date: string; justifie: boolean; motif?: string | null }
	> = {};
	(absenceNotes as AbsenceWithInscription[]).forEach((abs) => {
		if (abs.inscription?.eleve?.id) {
			absenceMap[abs.inscription.eleve.id] = {
				id: abs.id,
				date: abs.date.toISOString(),
				justifie: abs.justifie,
				motif: abs.motif
			};
		}
	});

	return {
		eleves,
		cours: {
			id: cours.id,
			nom: cours.matiere.nom,
			coefficient: cours.coefficient
		},
		coursNom: cours.matiere.nom,
		salleNom: seance?.salle?.nom || 'Non définie',
		heureDebut: seance?.heureDebut || '08:00',
		heureFin: seance?.heureFin || '10:00',
		absenceNotes: absenceMap
	};
};

export const actions: Actions = {
	markPresence: async ({ request, params }) => {
		const formData = await request.formData();
		const eleveId = formData.get('eleveId') as string;
		const status = formData.get('status') as 'present' | 'absent' | 'retard';

		const inscription = await prisma.inscription.findFirst({
			where: {
				eleveId: eleveId,
				classeId: params.id,
				actif: true
			}
		});

		if (!inscription) {
			return { error: 'Inscription non trouvée' };
		}

		if (status === 'absent') {
			await prisma.absence.create({
				data: {
					eleveId,
					inscriptionId: inscription.id,
					date: new Date()
				}
			});
		} else if (status === 'retard') {
			await prisma.retard.create({
				data: {
					eleveId,
					duree: '10min',
					date: new Date()
				}
			});
		}

		return { success: true };
	}
};
