import { prisma, getActiveAnneeScolaire } from './prisma';

/**
 * Évaluation automatique d'un enseignant sur l'année scolaire active.
 *
 * La note est recalculée à la demande à partir des données de l'année :
 * toutes les requêtes filtrent sur `anneeId`, donc à chaque nouvelle année
 * scolaire l'évaluation repart de zéro (aucun héritage de l'année précédente).
 *
 * Deux composantes, pondérées 50/50 :
 *  - Assiduité   : heures réellement assurées / heures prévues à l'emploi du
 *                  temps (absences déclarées + pointages incomplets) → /10.
 *  - Réussite    : moyenne des élèves dans ses cours (sur /20, ramenée /10).
 * Si une composante n'a pas de données (aucun emploi du temps, aucune note),
 * elle est ignorée et la note porte sur les composantes disponibles.
 */
export type EvaluationProf = {
	professeurId: string;
	/** Note finale /10 (0 si aucune donnée exploitable). */
	note: number;
	/** Composante assiduité /10 (null si pas d'heures prévues). */
	noteAssiduite: number | null;
	/** Composante réussite des élèves /10 (null si pas de notes). */
	noteReussite: number | null;
	heuresPrevues: number;
	heuresManquees: number;
	nbAbsences: number;
	/** Moyenne des élèves dans les cours du prof, sur /20. */
	moyenneEleves: number;
	nbCours: number;
	nbEleves: number;
};

type EvaluationBrute = {
	heuresPrevues: number;
	heuresManquees: number;
	nbAbsences: number;
	moyenneEleves: number;
	nbCours: number;
	nbEleves: number;
};

function dureeHeures(heureDebut: string, heureFin: string): number {
	const [dh, dm] = heureDebut.split(':').map(Number);
	const [fh, fm] = heureFin.split(':').map(Number);
	const diff = fh * 60 + fm - (dh * 60 + dm);
	return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

function clamp10(v: number): number {
	return Math.max(0, Math.min(10, Math.round(v * 100) / 100));
}

/** Applique la formule de notation aux données brutes d'un prof. */
export function noteFromBrute(b: EvaluationBrute): EvaluationProf {
	// Assiduité : part des heures assurées, ramenée sur 10.
	const noteAssiduite =
		b.heuresPrevues > 0
			? clamp10(10 * (1 - Math.min(1, b.heuresManquees / b.heuresPrevues)))
			: null;
	// Réussite : moyenne des élèves /20 → /10.
	const noteReussite = b.moyenneEleves > 0 ? clamp10((b.moyenneEleves / 20) * 10) : null;

	const composantes = [noteAssiduite, noteReussite].filter((n): n is number => n !== null);
	const note = composantes.length
		? clamp10(composantes.reduce((s, n) => s + n, 0) / composantes.length)
		: 0;

	return {
		professeurId: '',
		note,
		noteAssiduite,
		noteReussite,
		heuresPrevues: Math.round(b.heuresPrevues * 100) / 100,
		heuresManquees: Math.round(b.heuresManquees * 100) / 100,
		nbAbsences: b.nbAbsences,
		moyenneEleves: Math.round(b.moyenneEleves * 100) / 100,
		nbCours: b.nbCours,
		nbEleves: b.nbEleves
	};
}

/** Évalue tous les enseignants pour l'année scolaire donnée (active par défaut). */
export async function evaluerProfesseurs(
	anneeIdArg?: string | null
): Promise<Record<string, EvaluationProf>> {
	const annee = anneeIdArg ? { id: anneeIdArg } : await getActiveAnneeScolaire();
	if (!annee) return {};
	const anneeId = annee.id;

	const [coursList, edts, absencesProf, pointages, notes, inscriptions] = await Promise.all([
		prisma.cours.findMany({
			where: { anneeId },
			select: {
				id: true,
				coefficient: true,
				professeurId: true,
				classeId: true,
				classe: { select: { elevesCount: true } }
			}
		}),
		prisma.emploiDuTemps.findMany({
			where: { anneeId },
			select: { seances: { select: { coursId: true, heureDebut: true, heureFin: true } } }
		}),
		prisma.absenceProf.findMany({
			where: { anneeId },
			select: { professeurId: true, coursId: true, date: true }
		}),
		prisma.pointage.findMany({
			where: { anneeId },
			select: { professeurId: true, heuresPrevues: true, heuresEffectuees: true }
		}),
		prisma.note.findMany({
			where: { cours: { anneeId }, examenId: { not: null } },
			select: { valeur: true, coefficient: true, coursId: true }
		}),
		prisma.inscription.findMany({
			where: { anneeId, actif: true, classeId: { not: null } },
			select: { classeId: true }
		})
	]);

	// Heures prévues par cours, d'après l'emploi du temps.
	const heuresParCours = new Map<string, number>();
	for (const edt of edts) {
		for (const s of edt.seances) {
			heuresParCours.set(
				s.coursId,
				(heuresParCours.get(s.coursId) ?? 0) + dureeHeures(s.heureDebut, s.heureFin)
			);
		}
	}

	// Moyenne par cours (notes pondérées par leur coefficient).
	const sommeNotesCours = new Map<string, { tot: number; coef: number }>();
	for (const n of notes) {
		const c = sommeNotesCours.get(n.coursId) ?? { tot: 0, coef: 0 };
		const coef = n.coefficient || 1;
		c.tot += n.valeur * coef;
		c.coef += coef;
		sommeNotesCours.set(n.coursId, c);
	}
	const moyenneParCours = new Map<string, number>();
	for (const [coursId, c] of sommeNotesCours) {
		if (c.coef > 0) moyenneParCours.set(coursId, c.tot / c.coef);
	}

	// Élèves concernés par classe (participants non gérés ici : on prend la classe).
	const elevesParClasse = new Map<string, number>();
	for (const i of inscriptions) {
		if (!i.classeId) continue;
		elevesParClasse.set(i.classeId, (elevesParClasse.get(i.classeId) ?? 0) + 1);
	}

	const brut = new Map<string, EvaluationBrute & { sommeCoef: number }>();
	const init = (profId: string) => {
		if (!brut.has(profId))
			brut.set(profId, {
				heuresPrevues: 0,
				heuresManquees: 0,
				nbAbsences: 0,
				moyenneEleves: 0,
				nbCours: 0,
				nbEleves: 0,
				sommeCoef: 0
			});
		return brut.get(profId)!;
	};

	for (const cours of coursList) {
		if (!cours.professeurId) continue;
		const b = init(cours.professeurId);
		b.nbCours++;
		b.nbEleves += elevesParClasse.get(cours.classeId) ?? cours.classe.elevesCount ?? 0;
		b.heuresPrevues += heuresParCours.get(cours.id) ?? 0;
		const moy = moyenneParCours.get(cours.id);
		if (moy !== undefined && moy > 0) {
			const coef = cours.coefficient || 1;
			b.moyenneEleves += moy * coef;
			b.sommeCoef += coef;
		}
	}

	// Absences déclarées : heures estimées via l'emploi du temps du cours.
	for (const a of absencesProf) {
		if (!a.professeurId) continue;
		const b = brut.get(a.professeurId);
		if (!b) continue;
		b.nbAbsences++;
		const prevues = heuresParCours.get(a.coursId ?? '') ?? 0;
		b.heuresManquees += prevues > 0 ? prevues : 0;
	}
	// Pointages incomplets : heures manquantes relevées.
	for (const p of pointages) {
		if (!p.professeurId) continue;
		const b = brut.get(p.professeurId);
		if (!b) continue;
		if (p.heuresPrevues != null) {
			const manque = Math.max(0, p.heuresPrevues - p.heuresEffectuees);
			b.heuresManquees += manque;
		}
	}

	const result: Record<string, EvaluationProf> = {};
	for (const [profId, b] of brut) {
		const moy = b.sommeCoef > 0 ? b.moyenneEleves / b.sommeCoef : 0;
		// Les heures manquées ne peuvent pas dépasser les heures prévues.
		const manque = Math.min(b.heuresManquees, b.heuresPrevues);
		const evaluation = noteFromBrute({
			heuresPrevues: b.heuresPrevues,
			heuresManquees: manque,
			nbAbsences: b.nbAbsences,
			moyenneEleves: moy,
			nbCours: b.nbCours,
			nbEleves: b.nbEleves
		});
		result[profId] = { ...evaluation, professeurId: profId };
	}
	return result;
}
