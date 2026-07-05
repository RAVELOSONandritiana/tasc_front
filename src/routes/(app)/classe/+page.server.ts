import type { PageServerLoad } from './$types';
import { getClasses } from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
	const classes = await getClasses();
	const listClasse = classes.map(
		(c): { id: string; niveau: number; series: string; titulaire: string; eleves: number } => ({
			id: c.id,
			niveau: c.niveau,
			series: c.serie || '',
			titulaire: c.titulaire ? `${c.titulaire.personne.name} ${c.titulaire.personne.lastname}` : '',
			eleves: c.elevesCount
		})
	);
	return {
		listClasse
	};
};
