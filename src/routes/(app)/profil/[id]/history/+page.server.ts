import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import type { RoleCompte } from '@prisma/client';
import { hasAdminPower } from '$lib/permissions';
import { normalizeIp } from '$lib/utils';

type Activity = {
	id: string;
	action: string;
	description: string;
	ipAddress: string | null;
	userAgent: string | null;
	latitude: number | null;
	longitude: number | null;
	geoPrecision: number | null;
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

	// Seul l'administrateur peut consulter l'historique des activités.
	if (!hasAdminPower(locals.user)) {
		throw redirect(303, '/profil');
	}

	const baseWhere: Record<string, unknown> = { compteId: userId };

	const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
	const pageSize = 10;
	const actionFilter = url.searchParams.get('action') || 'all';
	const searchQuery = url.searchParams.get('search') || '';

	const whereClause: Record<string, unknown> = { ...baseWhere };

	if (actionFilter !== 'all') {
		whereClause.action = actionFilter;
	}

	if (searchQuery) {
		whereClause.OR = [
			{ description: { contains: searchQuery, mode: 'insensitive' as const } },
			{
				compte: {
					personne: {
						OR: [
							{ name: { contains: searchQuery, mode: 'insensitive' as const } },
							{ lastname: { contains: searchQuery, mode: 'insensitive' as const } }
						]
					}
				}
			}
		];
	}

	const [activities, total] = await Promise.all([
		prisma.activite.findMany({
			where: whereClause as never,
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
			skip: (page - 1) * pageSize,
			take: pageSize
		}),
		prisma.activite.count({ where: whereClause as never })
	]);

	const mapped = activities.map((a) => ({
		id: a.id,
		action: a.action,
		description: a.description,
		ipAddress: normalizeIp(a.ipAddress),
		userAgent: a.userAgent,
		latitude: a.latitude,
		longitude: a.longitude,
		geoPrecision: a.geoPrecision,
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

	return { activities: mapped, page, pageSize, total, actionFilter, searchQuery };
};
