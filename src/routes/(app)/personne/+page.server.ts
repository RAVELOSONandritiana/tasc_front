import type { Actions, ServerLoad } from '@sveltejs/kit';
import { getPersonnes, deletePersonnel, isForeignKeyError, FOREIGN_KEY_MESSAGE } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';

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

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'ID requis' });
		try {
			await deletePersonnel(id);
			logActivity(
				locals.user,
				'suppression_personnel',
				'Suppression du personnel'
			).catch(() => {});
			return { success: true };
		} catch (e: any) {
			if (isForeignKeyError(e)) {
				return fail(409, { error: FOREIGN_KEY_MESSAGE });
			}
			return fail(500, { error: e?.message || 'Erreur lors de la suppression' });
		}
	}
};
