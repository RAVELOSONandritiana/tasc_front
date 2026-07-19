import { json } from '@sveltejs/kit';
import { updatePersonneImage, prisma } from '$lib/server/prisma';
import { deletePbImage } from '$lib/pocketbase/pocketbase';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	const formData = await request.formData();
	const personneId = formData.get('personneId') as string;
	const imageUrl = formData.get('imageUrl') as string;

	if (!personneId || !imageUrl) {
		return json({ error: 'personneId et imageUrl requis' }, { status: 400 });
	}

	try {
		const oldPersonne = await prisma.personne.findUnique({
			where: { id: personneId },
			select: { imageUrl: true }
		});
		const oldImageUrl = oldPersonne?.imageUrl || null;
		await updatePersonneImage(personneId, imageUrl);
		if (oldImageUrl && oldImageUrl !== imageUrl) {
			await deletePbImage(oldImageUrl);
		}
		return json({ success: true, url: imageUrl });
	} catch (e: unknown) {
		return json({ error: (e as Error)?.message || 'Erreur lors de la mise à jour' }, { status: 500 });
	}
};
