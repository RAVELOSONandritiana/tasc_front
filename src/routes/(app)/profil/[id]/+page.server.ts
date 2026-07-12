import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ params }) => {
	let compte = await prisma.compte.findUnique({
		where: { id: params.id },
		include: {
			personne: true,
			profil: true
		}
	});

	if (!compte) {
		compte = await prisma.compte.findFirst({
			where: { personneId: params.id },
			include: {
				personne: true,
				profil: true
			}
		});
	}

	if (!compte) {
		throw new Error('Utilisateur non trouvé');
	}

	const roleMap: Record<string, string> = {
		ADMINISTRATEUR: 'Administrateur',
		ENSEIGNANT: 'Enseignant',
		SURVEILLANT: 'Surveillant',
		PERSONNEL: 'Personnel'
	};

	const personne = await prisma.personne.findUnique({
		where: { id: compte.personneId },
		include: { eleve: true, professeur: true }
	});

	const presenceEleve = personne?.eleve
		? await prisma.presenceEleve.findMany({
				where: { eleveId: personne.eleve.id },
				include: {
					seance: { include: { cours: { include: { matiere: true } } } }
				},
				orderBy: { heureMarquage: 'desc' },
				take: 50
			})
		: [];

	const seancesDonnees = personne?.professeur
		? await prisma.seanceCours.findMany({
				where: { professeurId: personne.professeur.id },
				include: {
					cours: { include: { matiere: true } },
					presences: true
				},
				orderBy: { dateDebut: 'desc' },
				take: 50
			})
		: [];

	const presence = {
		statutEleve: presenceEleve.map((p) => ({
			id: p.id,
			date: p.seance?.dateDebut.toISOString() || p.heureMarquage.toISOString(),
			cours: p.seance?.cours?.matiere?.nom || 'Cours',
			statut: p.statut,
			seanceTerminee: p.seance?.statut === 'TERMINE'
		})),
		seancesDonnees: seancesDonnees.map((s) => ({
			id: s.id,
			date: s.dateDebut.toISOString(),
			cours: s.cours?.matiere?.nom || 'Cours',
			statut: s.statut,
			presents: s.presences.filter((p) => p.statut === 'PRESENT').length,
			retards: s.presences.filter((p) => p.statut === 'RETARD').length,
			absents: s.presences.filter((p) => p.statut === 'ABSENT').length,
			total: s.presences.length
		}))
	};

	return {
		user: {
			id: compte.id,
			matricule: compte.matricule,
			role: roleMap[compte.role] || compte.role,
			nom: compte.personne.lastname,
			prenom: compte.personne.name,
			email: compte.personne.email,
			phone: compte.personne.phone,
			domicile: compte.personne.domicile || '',
			commune: compte.personne.commune || '',
			fokontany: compte.personne.fokontany || '',
			dateCreation: compte.dateCreation.toISOString().split('T')[0],
			bio: compte.profil?.bio || '',
			adresse: compte.profil?.adresse || compte.personne.domicile || ''
		},
		presence
	};
};
