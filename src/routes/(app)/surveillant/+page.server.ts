import type { Personne, Surveillant } from '$lib/types/Personne.type';
import type { Actions, PageServerLoad } from './$types';
import { getSurveillants, createSurveillant } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';

function mapSurveillant(prismaSurv: any): Surveillant {
	return {
		id: prismaSurv.id,
		name: prismaSurv.personne.name,
		lastname: prismaSurv.personne.lastname,
		domicile: prismaSurv.personne.domicile || '',
		fokontany: prismaSurv.personne.fokontany || '',
		commune: prismaSurv.personne.commune || '',
		phone: prismaSurv.personne.phone,
		email: prismaSurv.personne.email,
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
	const personnes: Personne[] = listSurveillant.map((p) => ({
		id: p.id,
		name: p.name,
		lastname: p.lastname,
		domicile: p.domicile,
		fokontany: p.fokontany,
		commune: p.commune,
		phone: p.phone,
		email: p.email
	}));
	return {
		personnes,
		listSurveillant
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();

		const name = data.get('name') as string;
		const lastname = data.get('lastname') as string;
		const email = data.get('email') as string;
		const phone = data.get('phone') as string;
		const poste = (data.get('poste') as string) || 'Surveillant';
		const domicile = data.get('domicile') as string;
		const fokontany = data.get('fokontany') as string;
		const commune = data.get('commune') as string;

		const errors: Record<string, string> = {};
		if (!name?.trim()) errors.name = 'Le nom est obligatoire';
		if (!lastname?.trim()) errors.lastname = 'Le prénom est obligatoire';
		if (!email?.trim()) errors.email = "L'email est obligatoire";
		if (!phone?.trim()) errors.phone = 'Le téléphone est obligatoire';
		if (!domicile?.trim()) errors.domicile = 'Le domicile est obligatoire';
		if (!fokontany?.trim()) errors.fokontany = 'Le fokontany est obligatoire';
		if (!commune?.trim()) errors.commune = 'La commune est obligatoire';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		try {
			await createSurveillant({
				name: name.trim(),
				lastname: lastname.trim(),
				email: email.trim(),
				phone: phone.trim(),
				domicile: domicile.trim(),
				fokontany: fokontany.trim(),
				commune: commune.trim(),
				poste
			});

			logActivity(
				locals.user,
				'creation_surveillant',
				`Création du surveillant ${name} ${lastname}`
			).catch(() => {});

			throw redirect(303, '/surveillant');
		} catch (e: any) {
			if (e?.message === 'NEXT_REDIRECT') throw e;
			return fail(500, { error: 'Erreur lors de la création' });
		}
	}
};
