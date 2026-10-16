import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getSurveillantById } from '$lib/server/prisma';
import { editerPersonne } from '$lib/server/personneEdit';
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
		compte: prismaSurv.personne.compte as
			| { id: string; role: string; matricule: string }
			| undefined,
		personneId: prismaSurv.personne.id,
		imageUrl: prismaSurv.personne.imageUrl,
		poste: prismaSurv.poste,
		stats: {
			retards: prismaSurv.retards,
			absences: prismaSurv.absences,
			nbCours: prismaSurv.nbCours,
			incidents: prismaSurv.incidents,
			notesPositives: prismaSurv.notesPositives,
			notesNegatives: prismaSurv.notesNegatives
		}
	};
	return { surveillant };
};

/** Édition des informations du surveillant (admin / opérateur). */
export const actions: Actions = {
	updateInfo: async ({ request, locals, params }) => {
		const data = await request.formData();
		const result = await editerPersonne(locals, params.id, {
			name: data.get('name'),
			lastname: data.get('lastname'),
			email: data.get('email'),
			phone: data.get('phone'),
			domicile: data.get('domicile'),
			fokontany: data.get('fokontany'),
			commune: data.get('commune')
		});
		if (!result.ok) return fail(result.status, { error: result.error });
		return { success: true };
	}
};
