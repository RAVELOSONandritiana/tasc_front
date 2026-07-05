import type { PageServerLoad } from './$types';
import { getEleves } from '$lib/server/prisma';
import type { Eleve } from '$lib/types/Personne.type';

function mapEleve(prismaEleve: any): Eleve {
	const inscription = prismaEleve.inscriptions?.[0];
	return {
		id: prismaEleve.id,
		nom: prismaEleve.personne.name,
		prenom: prismaEleve.personne.lastname,
		dateNaissance: prismaEleve.personne.dateNaissance?.toISOString().split('T')[0] || '2008-05-15',
		classe: inscription?.classe?.nom || '',
		stats: {
			retards: 0,
			absences: 0,
			incidents: 0,
			notesPositives: 0,
			notesNegatives: 0,
			heuresCours: 0
		}
	};
}

export const load: PageServerLoad = async () => {
	const eleves = await getEleves();
	const list_eleve: Eleve[] = eleves.map(mapEleve);
	return { list_eleve };
};
