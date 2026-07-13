import type { Surveillant } from '$lib/types/Personne.type';
import type { Actions, PageServerLoad } from './$types';
import { getSurveillants, getAllPersonnesForSurveillant, createSurveillantFromPersonne, deleteSurveillant, isForeignKeyError, FOREIGN_KEY_MESSAGE } from '$lib/server/prisma';
import type { Prisma } from '@prisma/client';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { broadcastRealtime } from '$lib/server/realtime';

type SurveillantWithPersonne = Prisma.SurveillantGetPayload<{
	include: { personne: { include: { compte: { select: { id: true; role: true; matricule: true } } } } }
}>;

function mapSurveillant(prismaSurv: SurveillantWithPersonne): Surveillant {
	return {
		id: prismaSurv.id,
		name: prismaSurv.personne.name,
		lastname: prismaSurv.personne.lastname,
		domicile: prismaSurv.personne.domicile || '',
		fokontany: prismaSurv.personne.fokontany || '',
		commune: prismaSurv.personne.commune || '',
		phone: prismaSurv.personne.phone,
		email: prismaSurv.personne.email,
		imageUrl: prismaSurv.personne.imageUrl || null,
		compte: prismaSurv.personne.compte as { id: string; role: string; matricule: string } | undefined,
		personneId: prismaSurv.personne.id,
		poste: prismaSurv.poste,
		stats: {
			retards: prismaSurv.retards,
			absences: prismaSurv.absences,
			heuresCours: prismaSurv.heuresCours,
			incidents: prismaSurv.incidents,
			notesPositives: prismaSurv.notesPositives,
			notesNegatives: prismaSurv.notesNegatives
		}
	};
}

export const load: PageServerLoad = async () => {
	const surveillants = await getSurveillants();
	const listSurveillant: Surveillant[] = surveillants.map(mapSurveillant);
	const personnel = await getAllPersonnesForSurveillant();
	return {
		listSurveillant,
		personnel
	};
};

export const actions: Actions = {
	createFromPersonne: async ({ request, locals }) => {
		const data = await request.formData();
		const personneId = data.get('personneId') as string;
		const matricule = (data.get('matricule') as string | null)?.trim() || '';
		const poste = (data.get('poste') as string | null)?.trim() || 'Surveillant';

		const errors: Record<string, string> = {};
		if (!personneId) errors.personneId = 'Personne requise';
		if (!matricule) errors.matricule = 'Matricule requise';
		if (!poste) errors.poste = 'Poste requis';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		try {
			const result = await createSurveillantFromPersonne(personneId, matricule, poste);

			logActivity(
				locals.user,
				'creation_surveillant',
				`Création du surveillant ${result.personne.name} ${result.personne.lastname}`
			).catch(() => {});

			broadcastRealtime({ entity: 'surveillant', action: 'create', id: result.surveillant?.id ?? '' });

			return { success: true, result };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la création' });
		}
	},
	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'ID requis' });
		try {
			await deleteSurveillant(id);
			logActivity(
				locals.user,
				'suppression_surveillant',
				'Suppression du surveillant'
			).catch(() => {});
			broadcastRealtime({ entity: 'surveillant', action: 'delete', id });
			return { success: true };
		} catch (e: any) {
			if (isForeignKeyError(e)) {
				return fail(409, { error: FOREIGN_KEY_MESSAGE });
			}
			return fail(500, { error: e?.message || 'Erreur lors de la suppression' });
		}
	}
};
