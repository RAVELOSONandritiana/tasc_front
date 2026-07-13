import type { PageServerLoad, Actions } from './$types';
import { getEleves, getActiveAnneeScolaire, deleteEleve } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { broadcastRealtime } from '$lib/server/realtime';
import type { Prisma } from '@prisma/client';
import type { Eleve } from '$lib/types/Personne.type';
import { formatClasseNom } from '$lib/utils';

type EleveWithInscriptions = Prisma.EleveGetPayload<{
	include: { personne: true; inscriptions: { include: { classe: true } } };
}>;

function mapEleve(prismaEleve: EleveWithInscriptions): Eleve {
	const inscription = prismaEleve.inscriptions?.[0];
	return {
		id: prismaEleve.id,
		nom: prismaEleve.personne.name,
		prenom: prismaEleve.personne.lastname,
		dateNaissance: prismaEleve.personne.dateNaissance?.toISOString().split('T')[0] || '2008-05-15',
		classe: formatClasseNom(inscription?.classe?.niveau, inscription?.classe?.nom),
		imageUrl: prismaEleve.personne.imageUrl || null,
		stats: {
			retards: 0,
			absences: 0,
			incidents: 0,
			notesPositives: 0,
			notesNegatives: 0,
			heuresCours: 0
		}
	};
}

export const load: PageServerLoad = async () => {
	const annee = await getActiveAnneeScolaire();
	const eleves = annee ? await getEleves(annee.id) : [];
	const list_eleve: Eleve[] = eleves.map(mapEleve);
	return { list_eleve };
};

export const actions: Actions = {
	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'ID requis' });
		try {
			await deleteEleve(id);
			logActivity(locals.user, 'suppression_eleve', 'Suppression de l\'élève').catch(() => {});
			broadcastRealtime({ entity: 'eleve', action: 'delete', id });
			return { success: true };
		} catch (e) {
			const message = e instanceof Error ? e.message : 'Erreur lors de la suppression';
			return fail(500, { error: message });
		}
	}
};
