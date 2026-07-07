import type { PageServerLoad, Actions } from './$types';
import { prisma, getClasseById, getCours } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';

export const load: PageServerLoad = async ({ params }) => {
	const classeId = params.id;
	const coursId = params.coursId;

	const classe = await getClasseById(classeId);
	if (!classe) {
		throw fail(404, { error: 'Classe introuvable' });
	}

	const [coursList, examens, inscriptions] = await Promise.all([
		getCours(),
		prisma.examen.findMany({
			where: { classeId },
			orderBy: { date: 'asc' }
		}),
		prisma.inscription.findMany({
			where: { classeId, actif: true },
			include: {
				eleve: {
					include: {
						personne: true,
						notes: {
							where: {
								coursId: coursId
							}
						}
					}
				}
			}
		})
	]);

	const listeCours = coursList
		.filter((c) => c.classeId === classeId)
		.map((c) => ({
			id: c.id,
			nom: c.matiere?.nom || 'Matière inconnue',
			coefficient: c.coefficient,
			professeur: c.professeur
				? `${c.professeur.personne.name} ${c.professeur.personne.lastname}`
				: '',
			participants: c.participants || []
		}));

	const listeExamens = examens.map((e) => ({
		id: e.id,
		nom: e.nom,
		date: e.date.toISOString().split('T')[0],
		classeId: e.classeId,
		periode: e.periode || undefined
	}));

	const elevesClasse = inscriptions.map((i) => ({
		id: i.eleve.id,
		nom: i.eleve.personne.name,
		prenom: i.eleve.personne.lastname,
		dateNaissance: i.eleve.dateNaissance?.toISOString().split('T')[0] || '',
		actif: i.actif,
		notes: i.eleve.notes.map((n) => ({
			id: n.id,
			valeur: n.valeur,
			coefficient: n.coefficient,
			date: n.date.toISOString().split('T')[0],
			libelle: n.libelle || '',
			coursId: n.coursId,
			examenId: n.examenId || undefined
		}))
	}));

	return {
		classe,
		listeCours,
		listeExamens,
		elevesClasse
	};
};

export const actions: Actions = {
	sauvegarderNotes: async ({ request, params, locals }) => {
		const formData = await request.formData();
		const examenId = formData.get('examenId') as string;
		const notesData = formData.get('notes') as string;

		if (!examenId || !notesData) {
			return fail(400, { error: 'Données manquantes' });
		}

		try {
			const notes = JSON.parse(notesData) as Record<string, number>;
			const result = await prisma.$transaction(async (tx) => {
				const createdOrUpdated = [];
				for (const [eleveId, valeur] of Object.entries(notes)) {
					if (valeur === null || valeur === undefined || isNaN(valeur) || valeur < 0 || valeur > 20) {
						continue;
					}

					// Fetch inscription for this student to attach to the note
					const inscription = await tx.inscription.findUnique({
						where: {
							eleveId_classeId_anneeId: {
								eleveId,
								classeId: params.id,
								anneeId: (await tx.anneeScolaire.findFirst({ where: { active: true } }))?.id || ''
							}
						}
					});

					// Check if note already exists
					const noteExistante = await tx.note.findFirst({
						where: {
							eleveId,
							coursId: params.coursId,
							examenId
						}
					});

					if (noteExistante) {
						const updated = await tx.note.update({
							where: { id: noteExistante.id },
							data: { valeur, inscriptionId: inscription?.id || null }
						});
						createdOrUpdated.push(updated);
					} else {
						const cours = await tx.cours.findUnique({ where: { id: params.coursId } });
						const created = await tx.note.create({
							data: {
								valeur,
								coefficient: cours?.coefficient || 1,
								eleveId,
								coursId: params.coursId,
								examenId,
								inscriptionId: inscription?.id || null
							}
						});
						createdOrUpdated.push(created);
					}
				}
				return createdOrUpdated;
			});

			logActivity(locals.user, 'modification_eleve' as any, `Sauvegarde des notes de l'examen`).catch(() => {});
			return { success: true, notes: result };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la sauvegarde' });
		}
	}
};
