import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ url }) => {
	const status = url.searchParams.get('status') || 'all';

	let where: Record<string, boolean> | undefined;
	if (status === 'libre') {
		where = { occupe: false };
	} else if (status === 'occupe') {
		where = { occupe: true };
	}

	const salles = await prisma.salle.findMany({
		where: where as never,
		orderBy: { num: 'asc' }
	});

	return {
		list_salle: salles.map((s) => ({
			id: s.id,
			num: s.num,
			name: s.nom,
			place: s.capacite,
			occupe: s.occupe,
			imageUrl: s.imageUrl
		})),
		statusFilter: status
	};
};

export const actions: Actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const num = parseInt(formData.get('num') as string);
		const nom = formData.get('nom') as string;
		const capacite = parseInt(formData.get('capacite') as string);

		await prisma.salle.create({
			data: {
				num,
				nom,
				capacite
			}
		});

		throw redirect(303, '/salle');
	},

	update: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const nom = formData.get('nom') as string;
		const capacite = parseInt(formData.get('capacite') as string);

		await prisma.salle.update({
			where: { id },
			data: {
				nom,
				capacite
			}
		});

		throw redirect(303, '/salle');
	},

	delete: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;

		await prisma.salle.delete({
			where: { id }
		});

		throw redirect(303, '/salle');
	},

	updateImage: async ({ request }) => {
		const formData = await request.formData();
		const id = formData.get('id') as string;
		const imageUrl = formData.get('imageUrl') as string;

		await prisma.salle.update({
			where: { id },
			data: { imageUrl }
		});

		return { success: true };
	}
};
