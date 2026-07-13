import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { createPersonnel } from '$lib/server/prisma';
import { logActivity } from '$lib/server/activity';
import { broadcastRealtime } from '$lib/server/realtime';

export const actions: Actions = {
	create: async ({ request, locals }) => {
		console.log('=== CREATE PERSONNEL ACTION CALLED ===');
		const data = await request.formData();

		const nom = (data.get('nom') as string | null)?.trim() || '';
		const prenom = (data.get('prenom') as string | null)?.trim() || '';
		const dateNaissance = (data.get('dateNaissance') as string | null)?.trim() || '';
		const lieuNaissance = (data.get('lieuNaissance') as string | null)?.trim() || '';
		const communeNaissance = (data.get('communeNaissance') as string | null)?.trim() || '';
		const regionNaissance = (data.get('regionNaissance') as string | null)?.trim() || '';
		const provinceNaissance = (data.get('provinceNaissance') as string | null)?.trim() || '';
		const domicile = (data.get('domicile') as string | null)?.trim() || '';
		const fokontany = (data.get('fokontany') as string | null)?.trim() || '';
		const communeResidence = (data.get('communeResidence') as string | null)?.trim() || '';
		const regionResidence = (data.get('regionResidence') as string | null)?.trim() || '';
		const provinceResidence = (data.get('provinceResidence') as string | null)?.trim() || '';
		const telephone = (data.get('telephone') as string | null)?.trim() || '';
		const email = (data.get('email') as string | null)?.trim() || '';
		const cin = (data.get('cin') as string | null)?.trim() || '';

		console.log('Form data received:', {
			nom,
			prenom,
			dateNaissance,
			lieuNaissance,
			communeNaissance,
			regionNaissance,
			provinceNaissance,
			domicile,
			fokontany,
			communeResidence,
			regionResidence,
			provinceResidence,
			telephone,
			email,
			cin
		});

		const errors: Record<string, string> = {};

		if (!nom?.trim()) errors.nom = 'Le nom est obligatoire';
		if (!prenom?.trim()) errors.prenom = 'Le prénom est obligatoire';
		if (!dateNaissance) errors.dateNaissance = 'La date de naissance est obligatoire';
		if (!lieuNaissance?.trim()) errors.lieuNaissance = 'Le lieu de naissance est obligatoire';
		if (!domicile?.trim()) errors.domicile = 'Le domicile est obligatoire';
		if (!fokontany?.trim()) errors.fokontany = 'Le fokontany est obligatoire';
		if (!communeResidence?.trim())
			errors.communeResidence = 'La commune de résidence est obligatoire';
		if (!telephone?.trim()) errors.telephone = 'Le téléphone est obligatoire';
		else if (!/^(\+261|0)[0-9]{9,10}$/.test(telephone)) errors.telephone = 'Format invalide';
		if (email?.trim() && !/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) errors.email = 'Format invalide';
		if (!cin?.trim()) errors.cin = 'Le CIN est obligatoire';
		else if (!/^[0-9]{12}$/.test(cin.replace(/\s/g, ''))) errors.cin = '12 chiffres requis';

		console.log('Validation errors:', errors);

		if (Object.keys(errors).length > 0) {
			console.log('Returning validation errors');
			return fail(400, { errors });
		}

		try {
			console.log('Creating personnel in DB...');
			const result = await createPersonnel({
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
			console.log('Personnel created successfully:', result);
			broadcastRealtime({ entity: 'personne', action: 'create', id: result.personne.id });
		} catch (e) {
			console.error('Error creating personnel:', e);
			return fail(500, { errors: { _form: 'Erreur lors de la création' } });
		}

		logActivity(locals.user, 'creation_personnel', `Création du personnel ${nom} ${prenom}`).catch(
			() => {}
		);

		return { success: true };
	}
};
