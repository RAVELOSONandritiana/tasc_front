import type { PageServerLoad } from './$types';
import { getProfesseurById } from '$lib/server/prisma';
import type { Professeur } from '$lib/types/Personne.type';

export const load: PageServerLoad = async ({ params }) => {
	const prismaProf = await getProfesseurById(params.id);
	if (!prismaProf) {
		throw new Error('Professeur non trouvé');
	}
	const professeur: Professeur = {
		id: prismaProf.id,
		name: prismaProf.personne.name,
		lastname: prismaProf.personne.lastname,
		domicile: prismaProf.personne.domicile || '',
		fokontany: prismaProf.personne.fokontany || '',
		commune: prismaProf.personne.commune || '',
		phone: prismaProf.personne.phone,
		email: prismaProf.personne.email,
		matiere: prismaProf.matiere,
		stats: {
			retards: prismaProf.retards,
			absences: prismaProf.absences,
			heuresCours: prismaProf.heuresCours,
			incidents: prismaProf.incidents,
			notesPositives: prismaProf.notesPositives,
			notesNegatives: prismaProf.notesNegatives
		}
	};
	return { professeur };
};
