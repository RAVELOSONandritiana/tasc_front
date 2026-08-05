import type { PageServerLoad } from './$types';
import { prisma, getCoursByProfesseurId, getEleveStats, getActiveAnneeScolaire } from '$lib/server/prisma';
import { hasAdminPower } from '$lib/permissions';

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

	// Absences du professeur (cours manqués) pour l'année active.
	const absencesProfP = personne?.professeur
		? await prisma.absenceProf.findMany({
				where: {
					professeurId: personne.professeur.id,
					...(activeAnneeP ? { anneeId: activeAnneeP.id } : {})
				},
				orderBy: { date: 'desc' },
				take: 100,
				include: { cours: { include: { matiere: true } } }
			})
		: [];

	return {
		viewerRole: locals.user?.role ?? null,
		viewerIsAdmin: hasAdminPower(locals.user),
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
		totalAbsencesAnnee: absencesEleveP.length,
		absencesProf: absencesProfP.map((a) => ({
			id: a.id,
			date: a.date.toISOString().split('T')[0],
			motif: a.motif || null,
			justifie: a.justifie,
			cours: a.cours?.matiere?.nom || 'Cours'
		}))
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
			const anneeS = await getActiveAnneeScolaire();
			const anneeSId = anneeS?.id;
			const coursProf = anneeSId
				? await prisma.cours.findMany({
						where: { professeurId: profId, anneeId: anneeSId },
						select: { id: true }
					})
				: [];
			const coursIds = coursProf.map((c) => c.id);
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

			// Volume horaire prévu (emploi du temps) et heures réalisées (pointages).
			let heuresPrevues = 0;
			const dureeParSeance = new Map<string, number[]>();
			if (coursIds.length) {
				const seances = await prisma.seanceEDT.findMany({
					where: { coursId: { in: coursIds } },
					select: { coursId: true, heureDebut: true, heureFin: true }
				});
				for (const s of seances) {
					const [h1, m1] = (s.heureDebut || '0:0').split(':').map(Number);
					const [h2, m2] = (s.heureFin || '0:0').split(':').map(Number);
					const diff = h2 * 60 + (m2 || 0) - (h1 * 60 + (m1 || 0));
					if (diff > 0) {
						heuresPrevues += diff / 60;
						const liste = dureeParSeance.get(`${s.coursId}|${s.heureDebut}`) ?? [];
						liste.push(diff / 60);
						dureeParSeance.set(`${s.coursId}|${s.heureDebut}`, liste);
					}
				}
			}
			let heuresEffectuees = 0;
			if (coursIds.length) {
				const pts = await prisma.pointage.findMany({
					where: { coursId: { in: coursIds }, anneeId: anneeSId },
					select: { heuresEffectuees: true }
				});
				heuresEffectuees = pts.reduce((s, x) => s + (x.heuresEffectuees || 0), 0);
			}

			// Heures manquées : uniquement les séances de l'emploi du temps non
			// assurées (absences déclarées), pas un cumul depuis le début de
			// l'année scolaire.
			const absencesDuProf = anneeSId
				? await prisma.absenceProf.findMany({
						where: { professeurId: profId, anneeId: anneeSId },
						select: { coursId: true, date: true }
					})
				: [];
			let heuresManquees = 0;
			for (const a of absencesDuProf) {
				const heure = `${String(a.date.getHours()).padStart(2, '0')}:${String(a.date.getMinutes()).padStart(2, '0')}`;
				const durees = a.coursId ? dureeParSeance.get(`${a.coursId}|${heure}`) : undefined;
				heuresManquees += durees?.[0] ?? 0;
			}

			result.heuresPrevues = Math.round(heuresPrevues * 100) / 100;
			result.heuresEffectuees = Math.round(heuresEffectuees * 100) / 100;
			result.absencesProf = absencesDuProf.length;
			result.heuresManquees = Math.round(heuresManquees * 100) / 100;

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
