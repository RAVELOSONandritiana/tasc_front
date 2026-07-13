import type { PageServerLoad, Actions } from './$types';
import {
	getElevesByClasseId,
	deleteEleve,
	addEleveToClasse,
	getElevesDisponiblesForClasse,
	prisma
} from '$lib/server/prisma';
import type { EleveCours } from '$lib/types/Materiel.type';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { broadcastRealtime } from '$lib/server/realtime';

export const load: PageServerLoad = async ({ params }) => {
	const inscriptions = await getElevesByClasseId(params.id);

	// Une absence/retard est justifiée uniquement si elle est liée à un rapport.
	const allAbsenceIds = inscriptions.flatMap((i) => i.absences?.map((a) => a.id) ?? []);
	const allRetardIds = inscriptions.flatMap((i) => i.retards?.map((r) => r.id) ?? []);
	const lignesJustifiees = await prisma.rapportLigne.findMany({
		where: {
			OR: [{ absenceId: { in: allAbsenceIds } }, { retardId: { in: allRetardIds } }]
		},
		select: { absenceId: true, retardId: true }
	});
	const justifiedAbsenceIds = new Set(
		lignesJustifiees.filter((l) => l.absenceId).map((l) => l.absenceId as string)
	);
	const justifiedRetardIds = new Set(
		lignesJustifiees.filter((l) => l.retardId).map((l) => l.retardId as string)
	);

	const elevesInscrits: EleveCours[] = inscriptions.map((i) => ({
		id: i.eleve.id,
		nom: i.eleve.personne.name,
		prenom: i.eleve.personne.lastname,
		dateNaissance: i.eleve.dateNaissance?.toISOString().split('T')[0] || '',
		domicile: i.eleve.personne.domicile || '',
		sexe: i.eleve.sexe ?? null,
		im: i.eleve.im ?? null,
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
				justifie: justifiedAbsenceIds.has(a.id)
			})) || [],
		retards:
			i.retards?.map((r) => ({
				id: r.id,
				date: r.date.toISOString(),
				duree: r.duree,
				justifie: justifiedRetardIds.has(r.id)
			})) || []
	}));

	return {
		elevesInscrits,
		elevesDisponibles: await getElevesDisponiblesForClasse(params.id),
		classe: await prisma.classe.findUnique({
			where: { id: params.id },
			select: { niveau: true, nom: true }
		}),
		classeId: params.id
	};
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
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
			broadcastRealtime({ entity: 'eleve', action: 'delete', id });
			return { success: true };
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Erreur lors de la suppression';
			return fail(500, { error: message });
		}
	},

	addExisting: async ({ request, params, locals }) => {
		const data = await request.formData();
		const eleveId = data.get('eleveId') as string;

		if (!eleveId) {
			return fail(400, { error: "ID de l'élève requis" });
		}

		try {
			const annee = await prisma.anneeScolaire.findFirst({ where: { active: true } });
			if (!annee) {
				return fail(500, { error: 'Aucune année scolaire active' });
			}

			const existingInscription = await prisma.inscription.findFirst({
				where: {
					eleveId,
					classeId: params.id,
					anneeId: annee.id
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

				if (!eleve) {
					return fail(404, { error: 'Élève introuvable' });
				}

				return {
					success: true,
					eleve: {
						id: eleve.id,
						nom: eleve.personne.name,
						prenom: eleve.personne.lastname,
						dateNaissance: eleve.dateNaissance?.toISOString().split('T')[0] || '',
						domicile: eleve.personne.domicile || '',
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

			broadcastRealtime({ entity: 'eleve', action: 'create', id: eleve.id });
			broadcastRealtime({ entity: 'classe', action: 'update', id: params.id ?? '' });

			return { success: true, eleve };
		} catch (e) {
			const message = e instanceof Error ? e.message : "Erreur lors de l'inscription";
			return fail(500, { error: message });
		}
	}
};
