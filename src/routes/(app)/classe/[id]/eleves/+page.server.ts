import type { PageServerLoad } from './$types';
import { getElevesByClasseId } from '$lib/server/prisma';
import type { EleveCours } from '$lib/types/Materiel.type';

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
