import type { PageServerLoad, Actions } from './$types';
import { getElevesByClasseId, deleteEleve, addEleveToClasse, getElevesNotInClasse, prisma } from '$lib/server/prisma';
import type { EleveCours } from '$lib/types/Materiel.type';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';

export const load: PageServerLoad = async ({ params }) => {
	const inscriptions = await getElevesByClasseId(params.id);

	const elevesInscrits: EleveCours[] = inscriptions.map((i) => ({
		id: i.eleve.id,
		nom: i.eleve.personne.name,
		prenom: i.eleve.personne.lastname,
		dateNaissance: i.eleve.dateNaissance?.toISOString().split('T')[0] || '',
		actif: i.actif,
		notes: i.notes?.map((n) => ({
			id: n.id,
			valeur: n.valeur,
			coefficient: n.coefficient,
			date: n.date.toISOString(),
			libelle: n.libelle || '',
			coursId: n.coursId
		})),
		incidents:
			i.incidents?.map((inc) => ({
				id: inc.id,
				type: 'incident',
				date: inc.date.toISOString(),
				description: (inc as any).motif || inc.message || ''
			})) || [],
		absences:
			i.absences?.map((a) => ({
				id: a.id,
				date: a.date.toISOString(),
				justifie: a.justifie
			})) || [],
		retards:
			i.retards?.map((r) => ({
				id: r.id,
				date: r.date.toISOString(),
				duree: r.duree
			})) || []
	}));

	return {
		elevesInscrits,
		classeId: params.id
	};
};

export const actions: Actions = {
	getDisponibles: async ({ params }) => {
		try {
			const elevesDisponibles = await getElevesNotInClasse(params.id);
			return {
				success: true,
				elevesDisponibles: elevesDisponibles.map((e: any) => ({
					id: e.id,
					nom: e.personne.name,
					prenom: e.personne.lastname,
					dateNaissance: e.dateNaissance?.toISOString().split('T')[0] || ''
				}))
			};
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors du chargement' });
		}
	},

	delete: async ({ request, params, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'ID requis' });
		try {
			await deleteEleve(id);
			logActivity(
				locals.user,
				'suppression_eleve',
				'Suppression de l\'élève'
			).catch(() => {});
			return { success: true };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la suppression' });
		}
	},

	addExisting: async ({ request, params, locals }) => {
		const data = await request.formData();
		const eleveId = data.get('eleveId') as string;

		if (!eleveId) {
			return fail(400, { error: 'ID de l\'élève requis' });
		}

		try {
			const existingInscription = await prisma.inscription.findFirst({
				where: {
					eleveId,
					classeId: params.id,
					anneeId: (await prisma.anneeScolaire.findFirst({ where: { active: true } }))?.id
				}
			});

			if (existingInscription) {
				if (existingInscription.actif) {
					return fail(400, { error: 'Cet élève est déjà inscrit dans cette classe' });
				}

				await prisma.inscription.update({
					where: { id: existingInscription.id },
					data: { actif: true }
				});

				const eleve = await prisma.eleve.findUnique({
					where: { id: eleveId },
					include: { personne: true }
				});

				return {
					success: true,
					eleve: {
						id: eleve?.id,
						nom: eleve?.personne.name,
						prenom: eleve?.personne.lastname,
						dateNaissance: eleve?.dateNaissance?.toISOString().split('T')[0] || '',
						actif: true,
						dejaInscrit: true
					}
				};
			}

			const eleve = await addEleveToClasse(eleveId, params.id);

			logActivity(
				locals.user,
				'creation_eleve',
				`Inscription de l'élève ${eleve.nom} ${eleve.prenom} dans la classe`
			).catch(() => {});

			return { success: true, eleve };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de l\'inscription' });
		}
	}
};
