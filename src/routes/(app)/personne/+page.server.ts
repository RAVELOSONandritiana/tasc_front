import type { Personne } from '$lib/types/Personne.type';
import type { ServerLoad } from '@sveltejs/kit';
import { getPersonnes } from '$lib/server/prisma';

export const load: ServerLoad = async () => {
	const personnes = await getPersonnes();
	return {
		personnes: personnes.map((p) => ({
			id: p.id,
			name: p.name,
			lastname: p.lastname,
			domicile: p.domicile || '',
			fokontany: p.fokontany || '',
			commune: p.commune || '',
			phone: p.phone,
			email: p.email,
			compte: p.compte
		}))
	};
};
