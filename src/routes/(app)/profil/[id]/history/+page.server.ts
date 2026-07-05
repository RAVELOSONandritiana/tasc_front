import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import type { RoleCompte } from '@prisma/client';

type Activity = {
	id: string;
	action: string;
	description: string;
	ipAddress: string | null;
	userAgent: string | null;
	compteId: string;
	createdAt: string;
	compte: {
		matricule: string;
		role: RoleCompte;
		personne: {
			name: string;
			lastname: string;
		};
	};
};

export const load: PageServerLoad = async ({ params, locals, url }) => {
	const userId = params.id;

	const where = locals.user?.role === 'ADMINISTRATEUR'
		? { compteId: userId }
		: { compteId: locals.user?.userId };

	const activities = await prisma.activite.findMany({
		where,
		include: {
			compte: {
				include: {
					personne: true
				}
			}
		},
		orderBy: {
			createdAt: 'desc'
		},
		take: 50
	});

	const mapped = activities.map((a) => ({
		id: a.id,
		action: a.action,
		description: a.description,
		ipAddress: a.ipAddress,
		userAgent: a.userAgent,
		compteId: a.compteId,
		createdAt: a.createdAt.toISOString(),
		compte: {
			matricule: a.compte.matricule,
			role: a.compte.role,
			personne: {
				name: a.compte.personne.name,
				lastname: a.compte.personne.lastname
			}
		}
	}));

	return { activities: mapped };
};
