import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { hasAdminPower } from '$lib/permissions';

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

	const annees = await prisma.anneeScolaire.findMany({
		orderBy: { dateCreation: 'desc' }
	});
	const anneeActive = annees.find((a) => a.active) || null;

	const notifications = await prisma.notification.findMany({
		where: {
			AND: [
				hasAdminPower(locals.user) ? {} : { scope: { not: 'ADMIN' } },
				{ OR: [{ userId: null }, { userId: compte.id }] }
			]
		},
		orderBy: { createdAt: 'desc' },
		take: 50
	});

	return {
		user: {
			userId: compte.id,
			matricule: compte.matricule,
			role: compte.role,
			nom: compte.personne.lastname,
			prenom: compte.personne.name,
			imageUrl: compte.personne.imageUrl || null,
			statut: compte.statut,
			isSurveillantGeneral: locals.user.isSurveillantGeneral
		},
		annees: annees.map((a) => ({ id: a.id, nom: a.nom, active: a.active })),
		anneeActiveId: anneeActive?.id || '',
		notifications: notifications.map((n) => ({
			id: n.id,
			title: n.title,
			description: n.description,
			time: n.time,
			read: n.read,
			actionType: n.actionType,
			matricule: n.matricule,
			userId: n.userId,
			createdAt: n.createdAt.toISOString()
		}))
	};
};
