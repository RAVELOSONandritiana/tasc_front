import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createPersonnel } from '$lib/server/prisma';
import { logActivity } from '$lib/server/activity';
import { capitalize } from '$lib/actions/capitalize';

export const actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();

		const nom = data.get('nom') as string;
		const prenom = data.get('prenom') as string;
		const dateNaissance = data.get('dateNaissance') as string;
		const lieuNaissance = data.get('lieuNaissance') as string;
		const communeNaissance = data.get('communeNaissance') as string;
		const regionNaissance = data.get('regionNaissance') as string;
		const provinceNaissance = data.get('provinceNaissance') as string;
		const domicile = data.get('domicile') as string;
		const fokontany = data.get('fokontany') as string;
		const communeResidence = data.get('communeResidence') as string;
		const regionResidence = data.get('regionResidence') as string;
		const provinceResidence = data.get('provinceResidence') as string;
		const telephone = data.get('telephone') as string;
		const email = data.get('email') as string;
		const cin = data.get('cin') as string;

		const errors: Record<string, string> = {};

		if (!nom?.trim()) errors.nom = 'Le nom est obligatoire';
		if (!prenom?.trim()) errors.prenom = 'Le prénom est obligatoire';
		if (!dateNaissance) errors.dateNaissance = 'La date de naissance est obligatoire';
		if (!lieuNaissance?.trim()) errors.lieuNaissance = 'Le lieu de naissance est obligatoire';
		if (!domicile?.trim()) errors.domicile = 'Le domicile est obligatoire';
		if (!fokontany?.trim()) errors.fokontany = 'Le fokontany est obligatoire';
		if (!communeResidence?.trim()) errors.communeResidence = 'La commune de résidence est obligatoire';
		if (!telephone?.trim()) errors.telephone = 'Le téléphone est obligatoire';
		else if (!/^(\+261|0)[0-9]{9,10}$/.test(telephone)) errors.telephone = 'Format invalide';
		if (email?.trim() && !/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) errors.email = 'Format invalide';
		if (!cin?.trim()) errors.cin = 'Le CIN est obligatoire';
		else if (!/^[0-9]{12}$/.test(cin.replace(/\s/g, ''))) errors.cin = '12 chiffres requis';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		try {
			await createPersonnel({
				name: nom.trim(),
				lastname: prenom.trim(),
			email: email.trim() || `${Date.now()}@tmp.com`,
			phone: telephone.trim(),
			domicile: domicile.trim().toUpperCase(),
			fokontany: fokontany.trim().toUpperCase(),
			commune: communeResidence.trim().toUpperCase(),
			region: regionResidence.trim().toUpperCase() || undefined,
			province: provinceResidence.trim() || undefined,
			lieuNaissance: lieuNaissance.trim().toUpperCase() || undefined,
			regionNaissance: regionNaissance.trim().toUpperCase() || undefined,
			provinceNaissance: provinceNaissance.trim() || undefined,
				dateNaissance: dateNaissance || undefined,
				cin: cin.replace(/\s/g, '')
			});
		} catch (e) {
			return fail(500, { errors: { _form: 'Erreur lors de la création' } });
		}

		logActivity(locals.user, 'creation_personnel', `Création du personnel ${nom} ${prenom}`).catch(() => {});

		return { success: true };
	}
};
