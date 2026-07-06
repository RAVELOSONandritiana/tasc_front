import type { PageServerLoad } from './$types';
import { getEleveById } from '$lib/server/prisma';
import type { Eleve, EleveStats } from '$lib/types/Personne.type';
import type { IncidentType } from '$lib/types/Incident.type';

export const load: PageServerLoad = async ({ params }) => {
	const prismaEleve = await getEleveById(params.id);
	if (!prismaEleve) {
		throw new Error('Élève non trouvé');
	}
	const inscription = prismaEleve.inscriptions?.[0];
	const notesPositives = prismaEleve.incidents?.filter(i => i.type === 'NOTE').length || 0;
	const notesNegatives = prismaEleve.incidents?.filter(i => i.type === 'ERREUR').length || 0;

	const incidents = (prismaEleve.incidents || []).map((inc) => ({
		id: inc.id,
		type: inc.type.toLowerCase() as IncidentType,
		message: inc.message,
		auteur: inc.auteur,
		date: inc.date.toISOString(),
		auteurId: inc.compteId || undefined
	}));

	const stats: EleveStats = {
		retards: 0,
		absences: 0,
		incidents: prismaEleve.incidents?.length || 0,
		notesPositives,
		notesNegatives,
		heuresCours: 0
	};

	const eleve: Eleve = {
		id: prismaEleve.id,
		nom: prismaEleve.personne.name,
		prenom: prismaEleve.personne.lastname,
		dateNaissance: prismaEleve.dateNaissance?.toISOString().split('T')[0] || '2008-05-15',
		classe: inscription?.classe?.nom || '',
		stats
	};
	return { eleve, incidents };
};
