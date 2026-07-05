import type { PageServerLoad, Actions } from './$types';
import { getProfesseurs, createProfesseur } from '$lib/server/prisma';
import type { Professeur, Personne } from '$lib/types/Personne.type';
import { fail, redirect } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';

function mapProfesseur(prismaProf: any): Professeur {
	return {
		id: prismaProf.id,
		name: prismaProf.personne.name,
		lastname: prismaProf.personne.lastname,
		domicile: prismaProf.personne.domicile || '',
		fokontany: prismaProf.personne.fokontany || '',
		commune: prismaProf.personne.commune || '',
		phone: prismaProf.personne.phone,
		email: prismaProf.personne.email,
		matiere: prismaProf.matiere,
		stats: {
			retards: prismaProf.retards,
			absences: prismaProf.absences,
			heuresCours: prismaProf.heuresCours,
			incidents: prismaProf.incidents,
			notesPositives: prismaProf.notesPositives,
			notesNegatives: prismaProf.notesNegatives
		}
	};
}

export const load: PageServerLoad = async () => {
	const profs = await getProfesseurs();
	const listProfesseur: Professeur[] = profs.map(mapProfesseur);
	const personnes: Personne[] = listProfesseur.map((p) => ({
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
		professeur: listProfesseur
	};
};

export const actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();

		const name = data.get('name') as string;
		const lastname = data.get('lastname') as string;
		const email = data.get('email') as string;
		const phone = data.get('phone') as string;
		const matiere = data.get('matiere') as string;

		const errors: Record<string, string> = {};
		if (!name?.trim()) errors.name = 'Le nom est obligatoire';
		if (!lastname?.trim()) errors.lastname = 'Le prénom est obligatoire';
		if (!email?.trim()) errors.email = "L'email est obligatoire";
		if (!phone?.trim()) errors.phone = 'Le téléphone est obligatoire';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		try {
			await createProfesseur({
				name: name.trim(),
				lastname: lastname.trim(),
				email: email.trim(),
				phone: phone.trim(),
				domicile: '',
				fokontany: '',
				commune: '',
				matiere: matiere ? matiere.split(',').map((m) => m.trim()).filter(Boolean) : []
			});

			logActivity(
				locals.user,
				'creation_enseignant',
				`Création de l'enseignant ${name} ${lastname}`
			).catch(() => {});

			throw redirect(303, '/enseignant');
		} catch (e: any) {
			if (e?.message === 'NEXT_REDIRECT') throw e;
			return fail(500, { error: 'Erreur lors de la création' });
		}
	}
};
