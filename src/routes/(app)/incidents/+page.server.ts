import type { Incident } from '$lib/types/Incident.type';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const incidents: Incident[] = [
		{
			id: '1',
			eleveId: '1',
			eleveNom: 'RANDRIANANTENAINA',
			elevePrenom: 'Tsitoarimanjakely',
			type: 'erreur',
			message: 'L\'élève a perturbé le cours de maths en parlant fort et en dérangeant les autres.',
			auteur: 'M. Jean Dupont',
			date: '2024-12-18T10:30:00',
			reactions: [{ emoji: '⚠️', user: 'Mme Pierre' }],
			comments: [
				{ id: 'c1', author: 'Mme Pierre', text: 'Je confirme, il était très agité ce jour-là.', date: '2024-12-18T11:00:00' },
				{ id: 'c2', author: 'M. Jean Dupont', text: 'Je lui ai mis un avertissement.', date: '2024-12-18T11:05:00' }
			]
		},
		{
			id: '2',
			eleveId: '2',
			eleveNom: 'RAKOTO',
			elevePrenom: 'Fanomezamasy',
			type: 'note',
			message: 'Excellent travail sur le devoir de physique, il a eu la note maximale.',
			auteur: 'Mme Marie Curie',
			date: '2024-12-17T14:00:00',
			reactions: [{ emoji: '🌟', user: 'M. Jean Dupont' }],
			comments: []
		}
	];

	return { incidents };
};
