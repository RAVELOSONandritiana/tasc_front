import { json } from '@sveltejs/kit';
import { setActiveAnneeScolaire } from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	const formData = await request.formData();
	const id = formData.get('id') as string;

	if (!id) {
		return json({ error: 'id requis' }, { status: 400 });
	}

	try {
		await setActiveAnneeScolaire(id);
		return json({ success: true });
	} catch (e: unknown) {
		return json({ error: (e as Error)?.message || 'Erreur' }, { status: 500 });
	}
};
