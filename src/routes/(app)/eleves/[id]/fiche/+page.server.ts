import type { PageServerLoad, Actions } from './$types';
import {
	prisma,
	getEleveById,
	getActiveAnneeScolaire,
	getElevesByClasseId
} from '$lib/server/prisma';
import { broadcastRealtime } from '$lib/server/realtime';
import { error, fail } from '@sveltejs/kit';
import { formatClasseNom } from '$lib/utils';

function peutModifier(role?: string): boolean {
	return role === 'ADMINISTRATEUR' || role === 'SURVEILLANT';
}

export const load: PageServerLoad = async ({ params }) => {
	const annee = await getActiveAnneeScolaire();
	const anneeId = annee?.id ?? null;

	const prismaEleve = await getEleveById(params.id, anneeId);
	if (!prismaEleve) {
		throw error(404, 'Élève non trouvé');
	}

	const inscription =
		prismaEleve.inscriptions?.find((i) => i.anneeId === anneeId && i.actif) ??
		prismaEleve.inscriptions?.find((i) => i.anneeId === anneeId) ??
		prismaEleve.inscriptions?.[0];

	// Numero de classe (ex: 1F / 1G) : ordre de l'eleve au sein de son sexe
	// dans sa classe, suivi du suffixe F (fille) ou G (garcon).
	let numeroClasse: string | null = null;
	if (inscription?.classeId) {
		const camarades = await getElevesByClasseId(inscription.classeId);
		const memesSexe = camarades
			.filter((c) => c.eleve?.sexe === prismaEleve.sexe)
			.sort((a, b) =>
				`${a.eleve?.personne?.name} ${a.eleve?.personne?.lastname}`.localeCompare(
					`${b.eleve?.personne?.name} ${b.eleve?.personne?.lastname}`,
					'fr'
				)
			);
		const rang = memesSexe.findIndex((c) => c.eleve?.id === prismaEleve.id);
		if (rang >= 0) {
			numeroClasse = `${rang + 1}${prismaEleve.sexe === 'F' ? 'F' : 'G'}`;
		}
	}

	const eleve = {
		id: prismaEleve.id,
		nom: prismaEleve.personne.name,
		prenom: prismaEleve.personne.lastname,
		dateNaissance: prismaEleve.dateNaissance?.toISOString().split('T')[0] || '',
		lieuNaissance: (prismaEleve as { lieuNaissance?: string | null }).lieuNaissance ?? null,
		im: prismaEleve.im,
		situation: (prismaEleve as { situation?: string }).situation,
		classe: formatClasseNom(inscription?.classe?.niveau, inscription?.classe?.nom),
		numeroClasse,
		sexe: prismaEleve.sexe,
		redoublant: prismaEleve.redoublant,
		telephone: prismaEleve.personne.phone || null,
		telephonePere: prismaEleve.telephonePere,
		telephoneMere: prismaEleve.telephoneMere,
		telephoneTuteur: prismaEleve.telephoneTuteur
	};

	const absences = (prismaEleve.absences || []).map((a) => ({
		id: a.id,
		date: a.date.toISOString(),
		motif: a.motif ?? null
	}));

	return { eleve, absences };
};

export const actions: Actions = {
	addAbsence: async ({ request, params, locals }) => {
		if (!peutModifier(locals.user?.role)) {
			return fail(403, { error: 'Non autorisé' });
		}
		const form = await request.formData();
		const read = (k: string) => (form.get(k) as string | null)?.trim() ?? '';
		const dateHeure = read('dateHeure');
		const duree = read('duree');
		const motif = read('motif');
		const dateRetour = read('dateRetour');

		if (!dateHeure) {
			return fail(400, { error: 'La date / heure est obligatoire' });
		}

		const annee = await getActiveAnneeScolaire();

		try {
			const inscription = annee
				? await prisma.inscription.findFirst({
						where: { eleveId: params.id, anneeId: annee.id, actif: true }
					})
				: null;

			await prisma.absence.create({
				data: {
					eleveId: params.id,
					inscriptionId: inscription?.id || null,
					date: new Date(dateHeure),
					duree: duree || null,
					motif: motif || null
				}
			});
			broadcastRealtime({ entity: 'eleve', action: 'update', id: params.id });
		} catch {
			return fail(500, { error: "Erreur lors de l'enregistrement de l'absence" });
		}
		return { success: true };
	}
};
