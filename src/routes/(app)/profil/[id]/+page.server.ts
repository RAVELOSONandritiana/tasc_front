import type { PageServerLoad } from './$types';
import { prisma, getCoursByProfesseurId, getEleveStats, getActiveAnneeScolaire } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ params, locals }) => {
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
		PERSONNEL: 'Personnel',
		OPERATEUR: 'Operateur'
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
			take: 200
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
				take: 200
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

	const stats = await buildStats();

	const cours = personne?.professeur
		? await getCoursByProfesseurId(personne.professeur.id)
		: [];

	// Absences et retards saisies par l'operateur (visibles sur le profil eleve).
	const activeAnneeP = await getActiveAnneeScolaire();
	const whereAnneeP = activeAnneeP
		? { OR: [{ inscription: { anneeId: activeAnneeP.id } }, { inscriptionId: null }] }
		: {};
	const absencesEleveP = personne?.eleve
		? await prisma.absence.findMany({
				where: { eleveId: personne.eleve.id, ...whereAnneeP },
				orderBy: { date: 'desc' },
				take: 100
			})
		: [];
	const retardsEleveP = personne?.eleve
		? await prisma.retard.findMany({
				where: { eleveId: personne.eleve.id, ...whereAnneeP },
				orderBy: { date: 'desc' },
				take: 100
			})
		: [];
	const seuilAbsenceP = activeAnneeP?.seuilAbsenceConvoc ?? 3;

	return {
		viewerRole: locals.user?.role ?? null,
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
			adresse: compte.profil?.adresse || compte.personne.domicile || '',
			photoUrl: compte.personne.imageUrl || null,
			stats,
			cours
		},
		presence,
		absences: absencesEleveP.map((a) => ({
			id: a.id,
			date: a.date.toISOString().split('T')[0],
			motif: a.motif || null,
			justifie: a.justifie
		})),
		retards: retardsEleveP.map((r) => ({
			id: r.id,
			date: r.date.toISOString().split('T')[0],
			motif: r.motif || null,
			justifie: r.justifie
		})),
		seuilAbsence: seuilAbsenceP,
		totalAbsencesAnnee: absencesEleveP.length
	};

	async function buildStats() {
		const result: Record<string, number> = {};
		if (personne?.eleve) {
			// Compteurs recalcules depuis la base (les champs denormalises de la
			// table `eleves` ne sont pas fiables).
			const eleveStats = await getEleveStats(personne.eleve.id);
			result.coursTermines = eleveStats.coursTermines;
			result.absencesEleve = eleveStats.absences;
			result.retardsEleve = eleveStats.retards;
			result.incidentsEleve = eleveStats.incidents;
		}
		if (personne?.professeur) {
			const profId = personne.professeur.id;
			const coursIds = (
				await prisma.cours.findMany({ where: { professeurId: profId }, select: { id: true } })
			).map((c) => c.id);
			result.coursCount = coursIds.length;

			// Élèves participants : union des listes de participants de ses cours.
			const coursAvecParticipants = await prisma.cours.findMany({
				where: { professeurId: profId },
				select: { participants: true }
			});
			const participantsSet = new Set<string>();
			for (const c of coursAvecParticipants) {
				for (const p of c.participants ?? []) participantsSet.add(p);
			}
			result.elevesParticipants = participantsSet.size;

			let efficacite = 0;
			let sansMoyenne = 0;
			if (coursIds.length > 0) {
				const notes = await prisma.note.findMany({
					where: { coursId: { in: coursIds } },
					select: { eleveId: true, valeur: true }
				});
				const sums: Record<string, { s: number; n: number }> = {};
				for (const note of notes) {
					const v = Number(note.valeur);
					if (Number.isNaN(v)) continue;
					if (!sums[note.eleveId]) sums[note.eleveId] = { s: 0, n: 0 };
					sums[note.eleveId].s += v;
					sums[note.eleveId].n += 1;
				}
				for (const id in sums) {
					if (sums[id].s / sums[id].n >= 10) efficacite += 1;
					else sansMoyenne += 1;
				}
			}
			result.efficacite = efficacite;
			result.elevesSansMoyenne = sansMoyenne;
		}
		return result;
	}
};
