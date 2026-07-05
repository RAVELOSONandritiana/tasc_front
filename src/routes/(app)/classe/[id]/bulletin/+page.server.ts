import type { PageServerLoad } from './$types';
import { getClasseById, prisma } from '$lib/server/prisma';
import type { Cours, Examen, EleveCours, Note } from '$lib/types/Materiel.type';

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

	const listeCours: Cours[] = coursList.map(c => ({
		id: c.id,
		nom: c.matiere.nom,
		coefficient: c.coefficient,
		professeur: c.professeur ? `${c.professeur.personne.name} ${c.professeur.personne.lastname}` : ''
	}));

	const examens = await prisma.examen.findMany({
		where: { classeId: params.id },
		orderBy: { date: 'asc' }
	});

	const listeExamens: Examen[] = examens.map(e => ({
		id: e.id,
		nom: e.nom,
		date: e.date.toISOString().split('T')[0],
		classeId: e.classeId,
		periode: e.periode || undefined
	}));

	const elevesClasse: EleveCours[] = (classe?.inscriptions || []).map((i: any) => ({
		id: i.eleve.id,
		nom: i.eleve.personne.name,
		prenom: i.eleve.personne.lastname,
		dateNaissance: i.eleve.dateNaissance?.toISOString().split('T')[0] || '',
		actif: i.actif,
		notes: i.notes?.map((n: any) => ({
			id: n.id,
			valeur: n.valeur,
			coefficient: n.coefficient,
			date: n.date.toISOString(),
			libelle: n.libelle || '',
			coursId: n.coursId,
			examenId: n.examenId || undefined
		})) || []
	}));

	return {
		classe,
		listeCours,
		listeExamens,
		elevesClasse
	};
};