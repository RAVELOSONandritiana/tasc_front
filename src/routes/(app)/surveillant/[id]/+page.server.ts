import type { PageServerLoad } from './$types';
import { getSurveillantById } from '$lib/server/prisma';
import type { Surveillant } from '$lib/types/Personne.type';

export const load: PageServerLoad = async ({ params }) => {
	const prismaSurv = await getSurveillantById(params.id);
	if (!prismaSurv) {
		throw new Error('Surveillant non trouvé');
	}
	const surveillant: Surveillant = {
		id: prismaSurv.id,
		name: prismaSurv.personne.name,
		lastname: prismaSurv.personne.lastname,
		domicile: prismaSurv.personne.domicile || '',
		fokontany: prismaSurv.personne.fokontany || '',
		commune: prismaSurv.personne.commune || '',
		phone: prismaSurv.personne.phone,
		email: prismaSurv.personne.email,
		compte: prismaSurv.personne.compte as { id: string; role: string; matricule: string } | undefined,
		personneId: prismaSurv.personne.id,
		poste: prismaSurv.poste,
		stats: {
			retards: prismaSurv.retards,
			absences: prismaSurv.absences,
			heuresCours: prismaSurv.heuresCours,
			incidents: prismaSurv.incidents,
			notesPositives: prismaSurv.notesPositives,
			notesNegatives: prismaSurv.notesNegatives
		}
	};
	return { surveillant };
};
