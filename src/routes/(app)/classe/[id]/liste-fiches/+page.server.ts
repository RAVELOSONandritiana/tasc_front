import type { PageServerLoad } from './$types';
import { prisma, getElevesByClasseId, getActiveAnneeScolaire } from '$lib/server/prisma';
import { formatClasseNom } from '$lib/utils';

type LigneFiche = {
	id: string;
	im?: string | null;
	nom: string;
	prenom: string;
	dateNaissance: string;
	sexe?: string | null;
	redoublant?: boolean;
	situation?: string;
	classe: string;
};

export const load: PageServerLoad = async ({ params }) => {
	const inscriptions = await getElevesByClasseId(params.id);

	const classeNom = await prisma.classe
		.findUnique({ where: { id: params.id }, select: { niveau: true, nom: true } })
		.then((c) => (c ? formatClasseNom(c.niveau, c.nom) : ''));

	const lignes: LigneFiche[] = inscriptions.map((i) => ({
		id: i.eleve.id,
		im: i.eleve.im,
		nom: (i.eleve.personne.name || '').toUpperCase(),
		prenom: i.eleve.personne.lastname || '',
		dateNaissance: i.eleve.dateNaissance ? new Date(i.eleve.dateNaissance).toISOString() : '',
		sexe: i.eleve.sexe,
		redoublant: i.eleve.redoublant,
		situation: (i.eleve as { situation?: string }).situation,
		classe: classeNom
	}));

	// Numérotation par bloc : filles (F) puis garçons (G).
	const filles = lignes
		.filter((l) => l.sexe === 'F')
		.map((l, idx) => ({ ...l, numero: idx + 1, sexeBloc: 'F' as const }))
		.sort((a, b) => a.numero - b.numero);
	const garcons = lignes
		.filter((l) => l.sexe !== 'F')
		.map((l, idx) => ({ ...l, numero: idx + 1, sexeBloc: 'G' as const }))
		.sort((a, b) => a.numero - b.numero);

	return {
		classe: classeNom,
		annee: (await getActiveAnneeScolaire())?.nom ?? '',
		lignes,
		filles,
		garcons
	};
};
