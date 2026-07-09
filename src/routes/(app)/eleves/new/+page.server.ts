import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { createEleve } from '$lib/server/prisma';
import { logActivity } from '$lib/server/activity';

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();

		const nom = (data.get('nom') as string | null)?.trim() || '';
		const prenom = (data.get('prenom') as string | null)?.trim() || '';
		const dateNaissance = (data.get('dateNaissance') as string | null)?.trim() || '';
		const lieuNaissance = (data.get('lieuNaissance') as string | null)?.trim() || '';
		const regionNaissance = (data.get('regionNaissance') as string | null)?.trim() || '';
		const provinceNaissance = (data.get('provinceNaissance') as string | null)?.trim() || '';
		const domicile = (data.get('domicile') as string | null)?.trim() || '';
		const fokontany = (data.get('fokontany') as string | null)?.trim() || '';
		const communeResidence = (data.get('communeResidence') as string | null)?.trim() || '';
		const regionResidence = (data.get('regionResidence') as string | null)?.trim() || '';
		const provinceResidence = (data.get('provinceResidence') as string | null)?.trim() || '';
		const telephoneEleve = (data.get('telephoneEleve') as string | null)?.trim() || '';
		const emailEleve = (data.get('emailEleve') as string | null)?.trim() || '';
		const cin = (data.get('cin') as string | null)?.trim() || '';
		const nomPere = (data.get('nomPere') as string | null)?.trim() || '';
		const prenomPere = (data.get('prenomPere') as string | null)?.trim() || '';
		const telephonePere = (data.get('telephonePere') as string | null)?.trim() || '';
		const nomMere = (data.get('nomMere') as string | null)?.trim() || '';
		const prenomMere = (data.get('prenomMere') as string | null)?.trim() || '';
		const telephoneMere = (data.get('telephoneMere') as string | null)?.trim() || '';
		const nomTuteur = (data.get('nomTuteur') as string | null)?.trim() || '';
		const prenomTuteur = (data.get('prenomTuteur') as string | null)?.trim() || '';
		const telephoneTuteur = (data.get('telephoneTuteur') as string | null)?.trim() || '';

		const errors: Record<string, string> = {};

		if (!nom) errors.nom = 'Le nom est obligatoire';
		if (!prenom) errors.prenom = 'Le prénom est obligatoire';
		if (!dateNaissance) errors.dateNaissance = 'La date de naissance est obligatoire';
		if (!lieuNaissance) errors.lieuNaissance = 'Le lieu de naissance est obligatoire';
		if (!domicile) errors.domicile = 'Le domicile est obligatoire';
		if (!fokontany) errors.fokontany = 'Le fokontany est obligatoire';
		if (!communeResidence) errors.communeResidence = 'La commune de résidence est obligatoire';
		if (telephoneEleve && !/^(\+261|0)[0-9]{9,10}$/.test(telephoneEleve)) errors.telephoneEleve = 'Format invalide';
		if (emailEleve && !/^[\w.-]+@[\w.-]+\.\w+$/.test(emailEleve)) errors.emailEleve = 'Format invalide';
		if (cin && !/^[0-9]{12}$/.test(cin.replace(/\s/g, ''))) errors.cin = '12 chiffres requis';
		if (!nomPere) errors.nomPere = 'Le nom du père est obligatoire';
		if (!prenomPere) errors.prenomPere = 'Le prénom du père est obligatoire';
		if (telephonePere && !/^(\+261|0)[0-9]{9,10}$/.test(telephonePere)) errors.telephonePere = 'Format invalide';
		if (!nomMere) errors.nomMere = 'Le nom de la mère est obligatoire';
		if (!prenomMere) errors.prenomMere = 'Le prénom de la mère est obligatoire';
		if (telephoneMere && !/^(\+261|0)[0-9]{9,10}$/.test(telephoneMere)) errors.telephoneMere = 'Format invalide';
		if (telephoneTuteur && !/^(\+261|0)[0-9]{9,10}$/.test(telephoneTuteur)) errors.telephoneTuteur = 'Format invalide';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		try {
			await createEleve({
				name: nom,
				lastname: prenom,
				email: emailEleve || `${Date.now()}@tmp.com`,
				phone: telephoneEleve || '',
				domicile: domicile.toUpperCase(),
				fokontany: fokontany.toUpperCase(),
				commune: communeResidence.toUpperCase(),
				region: regionResidence.toUpperCase() || undefined,
				province: provinceResidence || undefined,
				dateNaissance,
				lieuNaissance: lieuNaissance.toUpperCase() || undefined,
				regionNaissance: regionNaissance.toUpperCase() || undefined,
				provinceNaissance: provinceNaissance || undefined
			});
		} catch (e: unknown) {
			return fail(500, { errors: { _form: 'Erreur lors de la création' , error: e} });
		}

		logActivity(locals.user, 'creation_eleve', `Création de l'élève ${nom} ${prenom}`).catch(() => {});

		return { success: true };
	}
};
