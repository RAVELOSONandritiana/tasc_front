import type { PageServerLoad, Actions } from './$types';
import { getEleves, getElevesStats, getActiveAnneeScolaire, deleteEleve } from '$lib/server/prisma';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { broadcastRealtime } from '$lib/server/realtime';
import type { Prisma } from '@prisma/client';
import type { Eleve, EleveStats } from '$lib/types/Personne.type';
import { formatClasseNom } from '$lib/utils';

type EleveWithInscriptions = Prisma.EleveGetPayload<{
	include: { personne: true; inscriptions: { include: { classe: true } } };
}>;

function mapEleve(prismaEleve: EleveWithInscriptions, stats?: EleveStats): Eleve {
	const inscription = prismaEleve.inscriptions?.[0];
	return {
		id: prismaEleve.id,
		nom: prismaEleve.personne.name,
		prenom: prismaEleve.personne.lastname,
		dateNaissance: prismaEleve.dateNaissance?.toISOString().split('T')[0] || '',
		classe: formatClasseNom(inscription?.classe?.niveau, inscription?.classe?.nom),
		imageUrl: prismaEleve.personne.imageUrl || null,
		stats
	};
}

export const load: PageServerLoad = async () => {
	const annee = await getActiveAnneeScolaire();
	const eleves = annee ? await getEleves(annee.id) : [];
	// Compteurs reels (absences, retards, incidents, cours suivis) calcules en
	// une seule passe pour toute la liste.
	const stats = await getElevesStats(eleves.map((e) => e.id));
	const list_eleve: Eleve[] = eleves.map((e) => mapEleve(e, stats[e.id]));
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
