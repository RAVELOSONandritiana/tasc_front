import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/signin');
	}

	const compte = await prisma.compte.findUnique({
		where: { id: locals.user.userId },
		include: { personne: true }
	});

	if (!compte || compte.statut !== 'ACTIF') {
		throw redirect(303, '/signin');
	}

	return {
		user: {
			userId: compte.id,
			matricule: compte.matricule,
			role: compte.role,
			nom: compte.personne.lastname,
			prenom: compte.personne.name,
			statut: compte.statut
		}
	};
};
