import type { PageServerLoad } from './$types';
import { getClasseById, prisma } from '$lib/server/prisma';
import type { Cours, Examen, EleveCours } from '$lib/types/Materiel.type';

export const load: PageServerLoad = async ({ params }) => {
	const classe = await getClasseById(params.id);

	const coursList = await prisma.cours.findMany({
		where: { classeId: params.id },
		include: {
			matiere: true,
			professeur: {
				include: {
					personne: true
				}
			}
		}
	});

	const listeCours: Cours[] = coursList.map((c) => ({
		id: c.id,
		nom: c.matiere.nom,
		coefficient: c.coefficient,
		professeur: c.professeur
			? `${c.professeur.personne.name} ${c.professeur.personne.lastname}`
			: '',
		participants: c.participants || []
	}));

	const examens = await prisma.examen.findMany({
		where: { classeId: params.id },
		orderBy: { date: 'asc' }
	});

	const listeExamens: Examen[] = examens.map((e) => ({
		id: e.id,
		nom: e.nom,
		date: e.date.toISOString().split('T')[0],
		classeId: e.classeId,
		periode: e.periode || undefined
	}));

	const elevesClasse: EleveCours[] = (classe?.inscriptions || []).map((i) => ({
		id: i.eleve.id,
		nom: i.eleve.personne.name,
		prenom: i.eleve.personne.lastname,
		dateNaissance: i.eleve.dateNaissance?.toISOString().split('T')[0] || '',
		actif: i.actif,
		notes: []
	}));

	return {
		classe,
		listeCours,
		listeExamens,
		elevesClasse
	};
};
