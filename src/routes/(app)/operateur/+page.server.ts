import type { PageServerLoad, Actions } from './$types';
import {
	getOperateurs,
	getAllPersonnes,
	createOperateurFromPersonne,
	deleteOperateur
} from '$lib/server/prisma';
import type { Personne } from '$lib/types/Personne.type';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { broadcastRealtime } from '$lib/server/realtime';

type ServerPersonne = {
	id: string;
	name: string;
	lastname: string;
	domicile: string | null;
	fokontany: string | null;
	commune: string | null;
	phone: string;
	email: string;
	compte?: { id: string; matricule: string; role: string } | null;
};

export const load: PageServerLoad = async () => {
	const operateurs = await getOperateurs();
	const personnel = await getAllPersonnes();
	const personnelList: Personne[] = personnel.map((personne) => ({
		id: personne.id,
		name: personne.name,
		lastname: personne.lastname,
		domicile: personne.domicile ?? undefined,
		fokontany: personne.fokontany ?? undefined,
		commune: personne.commune ?? undefined,
		phone: personne.phone,
		email: personne.email,
		imageUrl: personne.imageUrl || null,
		compte: personne.compte ?? undefined
	}));
	return {
		operateur: operateurs,
		personnel: personnelList
	};
};

export const actions: Actions = {
	createFromPersonne: async ({ request, locals }) => {
		const data = await request.formData();
		const personneId = data.get('personneId') as string;
		const matricule = (data.get('matricule') as string | null)?.trim() || '';

		const errors: Record<string, string> = {};
		if (!personneId) errors.personneId = 'Personne requise';
		if (!matricule) errors.matricule = 'Matricule requise';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		try {
			const result = await createOperateurFromPersonne(personneId, matricule);

			logActivity(
				locals.user,
				'creation_operateur',
				`Création de l'opérateur ${result.personne.name} ${result.personne.lastname}`
			).catch(() => {});

			broadcastRealtime({ entity: 'operateur', action: 'create', id: result.compte.id });

			return { success: true, result };
		} catch (e: unknown) {
			return fail(500, { error: (e as Error)?.message || 'Erreur lors de la création' });
		}
	},
	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'ID requis' });
		try {
			const result = await deleteOperateur(id);
			logActivity(
				locals.user,
				'suppression_operateur',
				`Suppression de l'opérateur ${result.personne?.name || ''} ${result.personne?.lastname || ''}`
			).catch(() => {});
			broadcastRealtime({ entity: 'operateur', action: 'delete', id });
			return { success: true };
		} catch (e: unknown) {
			return fail(500, { error: (e as Error)?.message || 'Erreur lors de la suppression' });
		}
	}
};
