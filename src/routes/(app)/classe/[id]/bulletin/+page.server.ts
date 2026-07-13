import type { PageServerLoad } from './$types';
import { getClasseById, prisma } from '$lib/server/prisma';
import type { Cours, Examen, EleveCours, Note } from '$lib/types/Materiel.type';

export const load: PageServerLoad = async ({ params, locals }) => {
	const classe = await prisma.classe.findUnique({
		where: { id: params.id },
		include: {
			anneeScolaire: true,
			titulaire: {
				include: {
					personne: true
				}
			},
			inscriptions: {
				include: {
					eleve: {
						include: {
							personne: true,
							notes: true,
							absences: true,
							retards: true,
							incidents: true
						}
					}
				}
			}
		}
	});

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
		participants: c.participants || [],
		matiereId: c.matiereId,
		matiere: c.matiere
			? { id: c.matiere.id, nom: c.matiere.nom, couleur: c.matiere.couleur || undefined }
			: undefined
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

	const elevesClasse: EleveCours[] = (classe?.inscriptions || []).map((i: any) => ({
		id: i.eleve.id,
		nom: i.eleve.personne.name,
		prenom: i.eleve.personne.lastname,
		dateNaissance: i.eleve.dateNaissance?.toISOString().split('T')[0] || '',
		im: i.eleve.im ?? null,
		sexe: i.eleve.sexe ?? null,
		redoublant: i.eleve.redoublant ?? false,
		actif: i.actif,
		notes:
			i.eleve.notes?.map((n: any) => ({
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
		elevesClasse,
		administrateurNom: locals.user
			? await prisma.compte
					.findUnique({
						where: { id: locals.user.userId },
						include: { personne: true }
					})
					.then((c) => (c ? `${c.personne.lastname} ${c.personne.name}` : null))
			: null
	};
};
