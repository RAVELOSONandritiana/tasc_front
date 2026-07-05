import type { PageServerLoad } from './$types';
import { getEleveById } from '$lib/server/prisma';
import type { Eleve } from '$lib/types/Personne.type';

export const load: PageServerLoad = async ({ params }) => {
	const prismaEleve = await getEleveById(params.id);
	if (!prismaEleve) {
		throw new Error('Élève non trouvé');
	}
	const inscription = prismaEleve.inscriptions?.[0];
	const eleve: Eleve = {
		id: prismaEleve.id,
		nom: prismaEleve.personne.name,
		prenom: prismaEleve.personne.lastname,
		dateNaissance: prismaEleve.dateNaissance?.toISOString().split('T')[0] || '2008-05-15',
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
	return { eleve };
};
