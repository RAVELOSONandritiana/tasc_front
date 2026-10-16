import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { getProfesseurById } from '$lib/server/prisma';
import { editerPersonne } from '$lib/server/personneEdit';
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
		compte: prismaProf.personne.compte as
			| { id: string; role: string; matricule: string }
			| undefined,
		personneId: prismaProf.personne.id,
		imageUrl: prismaProf.personne.imageUrl,
		matiere: prismaProf.matiere,
		stats: {
			retards: prismaProf.retards,
			absences: prismaProf.absences,
			nbCours: prismaProf.nbCours,
			incidents: prismaProf.incidents,
			notesPositives: prismaProf.notesPositives,
			notesNegatives: prismaProf.notesNegatives
		}
	};
	return { professeur };
};

/** Édition des informations de l'enseignant (admin / opérateur). */
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
