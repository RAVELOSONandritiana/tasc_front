import type { PageServerLoad, Actions } from './$types';
import { prisma, getActiveAnneeScolaire } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';

type ElevePresence = {
	id: string;
	nom: string;
	prenom: string;
	dateNaissance: string;
	actif: boolean;
	photoUrl?: string | null;
	imageUrl?: string | null;
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
					eleve: { include: { personne: true } }
				}
			}
		}
	});

	const cours = await prisma.cours.findUnique({
		where: { id: coursId },
		include: { matiere: true, professeur: { include: { personne: true } } }
	});

	if (!classe || !cours) {
		throw redirect(303, `/classe/${classeId}/cours`);
	}

	const seanceEDT = await prisma.seanceEDT.findFirst({
		where: { coursId: coursId },
		include: { salle: true }
	});

	const eleves: ElevePresence[] = classe.inscriptions.map((inscription) => ({
		id: inscription.eleve.id,
		nom: inscription.eleve.personne.lastname,
		prenom: inscription.eleve.personne.name,
		dateNaissance: inscription.eleve.dateNaissance.toISOString().split('T')[0],
		actif: inscription.actif,
		photoUrl: inscription.eleve.photoUrl,
		imageUrl: inscription.eleve.personne.imageUrl || null
	}));

	const seanceActive = await prisma.seanceCours.findFirst({
		where: { coursId: coursId, statut: 'EN_COURS' },
		include: { presences: true }
	});

	const presencesMap: Record<string, 'PRESENT' | 'ABSENT' | 'RETARD'> = {};
	if (seanceActive) {
		seanceActive.presences.forEach((p) => {
			presencesMap[p.eleveId] = p.statut;
		});
	}

	const historique = await prisma.seanceCours.findMany({
		where: { coursId: coursId, statut: 'TERMINE' },
		include: {
			presences: true,
			professeur: { include: { personne: true } }
		},
		orderBy: { dateDebut: 'desc' },
		take: 10
	});

	return {
		eleves,
		classeId,
		coursId,
		coursNom: cours.matiere.nom,
		coefficient: cours.coefficient,
		professeur: cours.professeur
			? `${cours.professeur.personne.name} ${cours.professeur.personne.lastname}`
			: '—',
		salleNom: seanceEDT?.salle?.nom || 'Non définie',
		heureDebut: seanceEDT?.heureDebut || '08:00',
		heureFin: seanceEDT?.heureFin || '10:00',
		seance: seanceActive
			? {
					id: seanceActive.id,
					dateDebut: seanceActive.dateDebut.toISOString(),
					statut: seanceActive.statut
				}
			: null,
		presencesMap,
		historique: historique.map((s) => ({
			id: s.id,
			dateDebut: s.dateDebut.toISOString(),
			professeur: s.professeur
				? `${s.professeur.personne.name} ${s.professeur.personne.lastname}`
				: '—',
			presents: s.presences.filter((p) => p.statut === 'PRESENT').length,
			retards: s.presences.filter((p) => p.statut === 'RETARD').length,
			absents: s.presences.filter((p) => p.statut === 'ABSENT').length,
			total: s.presences.length
		}))
	};
};

async function getProfesseurId(locals: App.Locals): Promise<string | null> {
	if (!locals.user) return null;
	const compte = await prisma.compte.findUnique({
		where: { id: locals.user.userId },
		include: { personne: { include: { professeur: true } } }
	});
	return compte?.personne?.professeur?.id ?? null;
}

export const actions: Actions = {
	startSeance: async ({ params, locals }) => {
		const coursId = params.coursId;
		const annee = await getActiveAnneeScolaire();
		if (!annee) return fail(400, { error: 'Aucune année scolaire active' });

		const professeurId = await getProfesseurId(locals);
		if (!professeurId) return fail(400, { error: 'Professeur introuvable' });

		const existante = await prisma.seanceCours.findFirst({
			where: { coursId, statut: 'EN_COURS' }
		});
		if (existante) {
			return { seanceId: existante.id, alreadyActive: true };
		}

		const inscriptions = await prisma.inscription.findMany({
			where: { classeId: params.id, actif: true },
			select: { id: true, eleveId: true }
		});

		const seance = await prisma.seanceCours.create({
			data: {
				coursId,
				professeurId,
				anneeId: annee.id,
				statut: 'EN_COURS',
				presences: {
					create: inscriptions.map((ins) => ({
						eleveId: ins.eleveId,
						inscriptionId: ins.id,
						statut: 'PRESENT'
					}))
				}
			},
			include: { presences: true }
		});

		await logActivity(locals.user ?? null, 'debut_seance', `Début du cours ${coursId}`, undefined, undefined).catch(
			() => {}
		);

		return { seanceId: seance.id, success: true };
	},

	markPresence: async ({ request, params }) => {
		const formData = await request.formData();
		const seanceId = formData.get('seanceId') as string;
		const eleveId = formData.get('eleveId') as string;
		const statut = formData.get('statut') as 'PRESENT' | 'ABSENT' | 'RETARD';
		const coursId = params.coursId;

		if (!seanceId || !eleveId || !statut) {
			return fail(400, { error: 'Paramètres manquants' });
		}

		const inscription = await prisma.inscription.findFirst({
			where: { eleveId, classeId: params.id, actif: true }
		});

		await prisma.presenceEleve.upsert({
			where: { seanceId_eleveId: { seanceId, eleveId } },
			update: { statut, heureMarquage: new Date() },
			create: {
				seanceId,
				eleveId,
				inscriptionId: inscription?.id || null,
				statut
			}
		});

		return { success: true };
	},

	stopSeance: async ({ params, locals }) => {
		const coursId = params.coursId;

		const seance = await prisma.seanceCours.findFirst({
			where: { coursId, statut: 'EN_COURS' },
			include: { presences: true }
		});

		if (!seance) {
			return fail(400, { error: 'Aucune séance en cours' });
		}

		await prisma.$transaction(async (tx) => {
			for (const p of seance.presences) {
				if (p.statut === 'ABSENT') {
					await tx.absence.create({
						data: {
							eleveId: p.eleveId,
							inscriptionId: p.inscriptionId || null,
							date: seance.dateDebut
						}
					});
				} else if (p.statut === 'RETARD') {
					await tx.retard.create({
						data: {
							eleveId: p.eleveId,
							inscriptionId: p.inscriptionId || null,
							duree: '10min',
							date: seance.dateDebut
						}
					});
				}
			}

			await tx.seanceCours.update({
				where: { id: seance.id },
				data: { statut: 'TERMINE', dateFin: new Date() }
			});
		});

		await logActivity(locals.user ?? null, 'fin_seance', `Fin du cours ${coursId}`, undefined, undefined).catch(
			() => {}
		);

		return { success: true };
	}
};
