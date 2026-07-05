import type { PageServerLoad, Actions } from './$types';
import { getProfesseurs, getAllPersonnes, createProfesseurFromPersonne, deleteProfesseur } from '$lib/server/prisma';
import type { Professeur } from '$lib/types/Personne.type';
import { fail } from '@sveltejs/kit';
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
	const personnel = await getAllPersonnes();
	return {
		professeur: listProfesseur,
		personnel
	};
};

export const actions: Actions = {
	createFromPersonne: async ({ request, locals }) => {
		const data = await request.formData();
		const personneId = data.get('personneId') as string;
		const matricule = (data.get('matricule') as string | null)?.trim() || '';
		const matiere = (data.get('matiere') as string | null)?.trim() || '';
		const matieres = matiere ? matiere.split(',').map((m) => m.trim()).filter(Boolean) : [];

		const errors: Record<string, string> = {};
		if (!personneId) errors.personneId = 'Personne requise';
		if (!matricule) errors.matricule = 'Matricule requise';
		if (matieres.length === 0) errors.matiere = 'Matière requise';

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		try {
			const result = await createProfesseurFromPersonne(personneId, matricule, matieres);

			logActivity(
				locals.user,
				'creation_enseignant',
				`Création de l'enseignant ${result.personne.name} ${result.personne.lastname}`
			).catch(() => {});

			return { success: true, result };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la création' });
		}
	},
	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const id = data.get('id') as string;
		if (!id) return fail(400, { error: 'ID requis' });
		try {
			await deleteProfesseur(id);
			logActivity(
				locals.user,
				'suppression_enseignant',
				'Suppression de l\'enseignant'
			).catch(() => {});
			return { success: true };
		} catch (e: any) {
			return fail(500, { error: e?.message || 'Erreur lors de la suppression' });
		}
	}
};
