import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Non autorisé' }, { status: 401 });
	}

	const im = (url.searchParams.get('im') || '').trim();
	if (!im) {
		return json({ found: false, error: 'IM requis' }, { status: 400 });
	}

	try {
		const eleve = await prisma.eleve.findFirst({
			where: { im: { equals: im, mode: 'insensitive' as const } },
			include: { personne: true }
		});

		if (!eleve) {
			return json({ found: false });
		}

		return json({
			found: true,
			eleve: {
				nom: eleve.personne.name,
				prenom: eleve.personne.lastname,
				dateNaissance: eleve.dateNaissance?.toISOString().split('T')[0] || '',
				lieuNaissance: eleve.lieuNaissance || '',
				regionNaissance: eleve.regionNaissance || '',
				provinceNaissance: eleve.provinceNaissance || '',
				domicile: eleve.personne.domicile || '',
				fokontany: eleve.personne.fokontany || '',
				communeResidence: eleve.personne.commune || '',
				regionResidence: eleve.regionResidence || '',
				provinceResidence: eleve.provinceResidence || '',
				telephoneEleve: eleve.personne.phone || '',
				emailEleve: eleve.personne.email || '',
				cin: eleve.cin || '',
				nomPere: eleve.nomPere || '',
				prenomPere: eleve.prenomPere || '',
				telephonePere: eleve.telephonePere || '',
				nomMere: eleve.nomMere || '',
				prenomMere: eleve.prenomMere || '',
				telephoneMere: eleve.telephoneMere || '',
				nomTuteur: eleve.nomTuteur || '',
				prenomTuteur: eleve.prenomTuteur || '',
				telephoneTuteur: eleve.telephoneTuteur || '',
				im: eleve.im || '',
				sexe: eleve.sexe || '',
				situation: eleve.situation ?? 'P',
				statut: eleve.redoublant ? 'true' : 'false'
			}
		});
	} catch (e: unknown) {
		return json({ error: (e as Error)?.message || 'Erreur' }, { status: 500 });
	}
};
