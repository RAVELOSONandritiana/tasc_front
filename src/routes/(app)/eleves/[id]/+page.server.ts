import type { PageServerLoad } from './$types';
import type { EleveDetail } from '$lib/types/Materiel.type';

export const load: PageServerLoad = async ({ params }) => {
	const eleve: EleveDetail = {
		id: params.id,
		nom: 'RANDRIANANTENAINA',
		prenom: 'Tsitoarimanjakely',
		dateNaissance: '2008-05-15',
		classe: '2nd S',
		actif: true,
		notes: []
	};
	return { eleve };
};
