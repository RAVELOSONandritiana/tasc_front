import type { PageServerLoad, Actions } from './$types';
import { prisma, getActiveAnneeScolaire, getEleves } from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';
import { fail, redirect } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { formatClasseNom } from '$lib/utils';
import type { Rapport, EleveRapport } from '$lib/types/Rapport.type';

function mapRapport(
	r: Prisma.RapportGetPayload<{
		include: {
			eleve: { include: { personne: true } };
			inscription: { include: { classe: true } };
			lignes: true;
		};
	}>
): Rapport {
	return {
		id: r.id,
		type: r.type,
		message: r.message,
		auteur: r.auteur,
		auteurId: r.compteId || undefined,
		eleveId: r.eleveId,
		eleveNom: r.eleve.personne.lastname,
		elevePrenom: r.eleve.personne.name,
		eleveImageUrl: r.eleve.personne.imageUrl || null,
		classe: formatClasseNom(r.inscription?.classe?.niveau, r.inscription?.classe?.nom),
		date: r.date.toISOString(),
		createdAt: r.createdAt.toISOString(),
		lignes: r.lignes.map((l) => ({
			id: l.id,
			type: l.type,
			date: l.date.toISOString(),
			heure: null,
			motif: l.motif,
			eleveNom: r.eleve.personne.lastname,
			elevePrenom: r.eleve.personne.name,
			classe: formatClasseNom(r.inscription?.classe?.niveau, r.inscription?.classe?.nom)
		}))
	};
}

export const load: PageServerLoad = async ({ locals }) => {
	const role = locals.user?.role;
	const canEdit = role === 'SURVEILLANT' || role === 'ADMINISTRATEUR' || role === 'OPERATEUR';
	if (!canEdit && role !== 'ENSEIGNANT') {
		throw redirect(303, '/dashboard');
	}

	const annee = await getActiveAnneeScolaire();
	const anneeId = annee?.id;

	const rapportsRaw = anneeId
		? await prisma.rapport.findMany({
				where: { anneeId },
				include: {
					eleve: { include: { personne: true } },
					inscription: { include: { classe: true } },
					lignes: { orderBy: { date: 'desc' } }
				},
				orderBy: { date: 'desc' }
			})
		: [];

	const elevesRaw = anneeId ? await getEleves(anneeId) : [];
	const eleves: EleveRapport[] = elevesRaw.map((e) => ({
		id: e.id,
		nom: e.personne.lastname,
		prenom: e.personne.name,
		classe: formatClasseNom(
			e.inscriptions?.find((i) => i.actif)?.classe?.niveau,
			e.inscriptions?.find((i) => i.actif)?.classe?.nom
		),
		dateNaissance: e.dateNaissance?.toISOString().split('T')[0] || '',
		imageUrl: e.personne.imageUrl || null
	}));

	// Absences et retards de l'annee pour alimenter la selection. On exclut
	// les elements deja justifies (un rapport les a deja traites) : ils ne
	// doivent plus etre proposables.
	const [absences, retards, seancesEDT] = anneeId
		? await Promise.all([
				prisma.absence.findMany({
					where: {
						justifie: false,
						eleve: { inscriptions: { some: { anneeId, actif: true } } }
					},
					include: {
						eleve: { include: { personne: true } },
						inscription: { include: { classe: true } },
						pointage: { select: { coursId: true } }
					},
					orderBy: { date: 'desc' }
				}),
				prisma.retard.findMany({
					where: {
						justifie: false,
						eleve: { inscriptions: { some: { anneeId, actif: true } } }
					},
					include: {
						eleve: { include: { personne: true } },
						inscription: { include: { classe: true } },
						pointage: { select: { coursId: true } }
					},
					orderBy: { date: 'desc' }
				}),
				prisma.seanceEDT.findMany({
					include: { salle: true }
				})
			])
		: [[], [], []];

	// Heure reelle du cours d'apres l'emploi du temps (le pointage ne stocke
	// que la date). Cle par coursId.
	const heureDebutParCours = new Map(seancesEDT.map((s) => [s.coursId, s.heureDebut]));

	const absenceItems = absences.map((a) => ({
		id: a.id,
		eleveId: a.eleveId,
		type: 'ABSENCE' as const,
		date: a.date.toISOString(),
		heure: a.pointage ? heureDebutParCours.get(a.pointage.coursId) || null : null,
		motif: a.motif,
		justifie: a.justifie,
		eleveNom: a.eleve.personne.lastname,
		elevePrenom: a.eleve.personne.name,
		classe: formatClasseNom(a.inscription?.classe?.niveau, a.inscription?.classe?.nom)
	}));
	const retardItems = retards.map((r) => ({
		id: r.id,
		eleveId: r.eleveId,
		type: 'RETARD' as const,
		date: r.date.toISOString(),
		heure: r.pointage ? heureDebutParCours.get(r.pointage.coursId) || null : null,
		motif: r.motif,
		justifie: r.justifie,
		eleveNom: r.eleve.personne.lastname,
		elevePrenom: r.eleve.personne.name,
		classe: formatClasseNom(r.inscription?.classe?.niveau, r.inscription?.classe?.nom)
	}));

	return {
		rapports: rapportsRaw.map(mapRapport),
		eleves,
		absenceItems,
		retardItems,
		canEdit,
		anneeActive: annee?.nom || null
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		const type = (data.get('type') as string)?.toUpperCase();
		const eleveId = data.get('eleveId') as string;
		const message = (data.get('message') as string)?.trim() || null;
		const itemIds = data.getAll('itemId') as string[];
		const author = `${locals.user?.prenom || ''} ${locals.user?.nom || ''}`.trim() || 'Surveillant';
		const compteId = locals.user?.userId;

		if (!eleveId || !type || itemIds.length === 0) {
			return fail(400, { error: 'Sélectionnez au moins un élément à rapporter' });
		}
		if (!message) {
			return fail(400, { error: 'La note (cause) est obligatoire' });
		}
		if (type !== 'RETARD' && type !== 'ABSENCE') {
			return fail(400, { error: 'Type de rapport invalide' });
		}

		try {
			const annee = await getActiveAnneeScolaire();
			if (!annee) return fail(400, { error: 'Aucune année scolaire active' });

			const inscription = await prisma.inscription.findFirst({
				where: { eleveId, anneeId: annee.id, actif: true }
			});

			if (type === 'ABSENCE') {
				const rows = await prisma.absence.findMany({ where: { id: { in: itemIds }, eleveId } });
				await prisma.rapport.create({
					data: {
						type: 'ABSENCE',
						eleveId,
						inscriptionId: inscription?.id || null,
						anneeId: annee.id,
						message,
						auteur: author,
						compteId: compteId || null,
						lignes: {
							create: rows.map((a) => ({
								type: 'ABSENCE',
								eleveId,
								date: a.date,
								motif: a.motif,
								absenceId: a.id
							}))
						}
					}
				});
				await prisma.absence.updateMany({
					where: { id: { in: itemIds }, eleveId },
					data: { justifie: true }
				});
			} else {
				const rows = await prisma.retard.findMany({ where: { id: { in: itemIds }, eleveId } });
				await prisma.rapport.create({
					data: {
						type: 'RETARD',
						eleveId,
						inscriptionId: inscription?.id || null,
						anneeId: annee.id,
						message,
						auteur: author,
						compteId: compteId || null,
						lignes: {
							create: rows.map((r) => ({
								type: 'RETARD',
								eleveId,
								date: r.date,
								motif: r.motif,
								retardId: r.id
							}))
						}
					}
				});
				await prisma.retard.updateMany({
					where: { id: { in: itemIds }, eleveId },
					data: { justifie: true }
				});
			}

			const eleve = await prisma.eleve.findUnique({
				where: { id: eleveId },
				include: { personne: true }
			});
			const eleveNom = eleve ? `${eleve.personne.name} ${eleve.personne.lastname}`.trim() : 'élève';
			logActivity(locals.user, 'creation_rapport', `Rapport ${type} pour ${eleveNom}`).catch(
				() => {}
			);
		} catch (e) {
			console.error('Create rapport error:', e);
			return fail(500, { error: 'Erreur lors de la création du rapport' });
		}

		throw redirect(303, '/rapport');
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const rapportId = data.get('rapportId') as string;

		if (!rapportId) return fail(400, { error: 'ID du rapport requis' });

		try {
			const rapport = await prisma.rapport.findUnique({ where: { id: rapportId } });
			if (!rapport) return fail(404, { error: 'Rapport introuvable' });
			// Les surveillants et administrateurs peuvent supprimer tout rapport.
			// Les autres (ex. enseignants auteurs) ne peuvent supprimer que leurs propres rapports.
			if (
				locals.user?.role !== 'SURVEILLANT' &&
				locals.user?.role !== 'ADMINISTRATEUR' &&
				rapport.compteId &&
				rapport.compteId !== locals.user?.userId
			) {
				return fail(403, {
					error: "Seul l'auteur ou un surveillant/admin peut supprimer ce rapport"
				});
			}
			await prisma.rapport.delete({ where: { id: rapportId } });
			logActivity(locals.user, 'suppression_rapport', "Suppression d'un rapport").catch(() => {});
		} catch (e) {
			console.error('Delete rapport error:', e);
			return fail(500, { error: 'Erreur lors de la suppression' });
		}

		throw redirect(303, '/rapport');
	}
};
