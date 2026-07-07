import type { PageServerLoad, Actions } from './$types';
import { getElevesByClasseId, deleteEleve, prisma } from '$lib/server/prisma';
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
		elevesInscrits
	};
};

export const actions: Actions = {
	create: async ({ request, params }) => {
		const data = await request.formData();
		const nom = (data.get('nom') as string | null)?.trim() || '';
		const prenom = (data.get('prenom') as string | null)?.trim() || '';
		const dateNaissance = (data.get('dateNaissance') as string | null)?.trim() || '';

		if (!nom || !prenom || !dateNaissance) {
			return fail(400, { error: 'Nom, prénom et date de naissance requis' });
		}

		try {
			const annee = await prisma.anneeScolaire.findFirst({ where: { active: true } });
			if (!annee) {
				return fail(400, { error: 'Aucune année scolaire active trouvée' });
			}

			const result = await prisma.$transaction(async (tx) => {
				const personne = await tx.personne.create({
					data: {
						name: nom,
						lastname: prenom,
						email: `${nom.toLowerCase()}.${prenom.toLowerCase()}.${Date.now()}@tasc.com`,
						phone: ''
					}
				});

				const eleve = await tx.eleve.create({
					data: {
						personneId: personne.id,
						dateNaissance: new Date(dateNaissance)
					}
				});

				const inscription = await tx.inscription.create({
					data: {
						eleveId: eleve.id,
						classeId: params.id,
						anneeId: annee.id,
						actif: true
					}
				});

				await tx.classe.update({
					where: { id: params.id },
					data: {
						elevesCount: {
							increment: 1
						}
					}
				});

				return {
					id: eleve.id,
					nom: personne.name,
					prenom: personne.lastname,
					dateNaissance: eleve.dateNaissance.toISOString().split('T')[0],
					actif: inscription.actif
				};
			});

			return { success: true, eleve: result };
		} catch (e: any) {
			return fail(500, { error: e?.message || "Erreur lors de l'ajout de l'élève" });
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
	}
};
