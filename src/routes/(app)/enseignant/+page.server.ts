import type { PageServerLoad, Actions } from './$types';
import { getProfesseurs, getAllPersonnes, createProfesseurFromPersonne, deleteProfesseur, isForeignKeyError, FOREIGN_KEY_MESSAGE } from '$lib/server/prisma';
import type { Professeur } from '$lib/types/Personne.type';
import type { Personne } from '$lib/types/Personne.type';
import { fail } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { broadcastRealtime } from '$lib/server/realtime';

type PrismaProfesseurShape = {
	id: string;
	matiere: string[];
	retards: number;
	absences: number;
	heuresCours: number;
	incidents: number;
	notesPositives: number;
	notesNegatives: number;
	personne: {
		id: string;
		name: string;
		lastname: string;
		domicile: string | null;
		fokontany: string | null;
		commune: string | null;
		phone: string;
		email: string;
		imageUrl: string | null;
		compte?: { id: string; role: string; matricule: string } | null;
	};
};

function mapProfesseur(prismaProf: PrismaProfesseurShape): Professeur {
	return {
		id: prismaProf.id,
		name: prismaProf.personne.name,
		lastname: prismaProf.personne.lastname,
		domicile: prismaProf.personne.domicile || '',
		fokontany: prismaProf.personne.fokontany || '',
		commune: prismaProf.personne.commune || '',
		phone: prismaProf.personne.phone,
		email: prismaProf.personne.email,
		imageUrl: prismaProf.personne.imageUrl || null,
		compte: prismaProf.personne.compte as { id: string; role: string; matricule: string } | undefined,
		personneId: prismaProf.personne.id,
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
	const personnelList: Personne[] = personnel.map((personne) => ({
		id: personne.id,
		name: personne.name,
		lastname: personne.lastname,
		domicile: personne.domicile ?? undefined,
		fokontany: personne.fokontany ?? undefined,
		commune: personne.commune ?? undefined,
		phone: personne.phone,
		email: personne.email,
		imageUrl: personne.imageUrl || null,
		compte: personne.compte ?? undefined
	}));
	return {
		professeur: listProfesseur,
		personnel: personnelList
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

			broadcastRealtime({ entity: 'enseignant', action: 'create', id: result.professeur?.id ?? '' });

			return { success: true, result };
		} catch (e: unknown) {
			return fail(500, { error: (e as Error)?.message || 'Erreur lors de la création' });
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
			broadcastRealtime({ entity: 'enseignant', action: 'delete', id });
			return { success: true };
		} catch (e: unknown) {
			if (isForeignKeyError(e)) {
				return fail(409, { error: FOREIGN_KEY_MESSAGE });
			}
			return fail(500, { error: (e as Error)?.message || 'Erreur lors de la suppression' });
		}
	}
};
