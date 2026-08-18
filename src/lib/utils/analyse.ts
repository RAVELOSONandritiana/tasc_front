// Helpers partagés pour les pages d'analyse (niveau / élève).
// Centralise les calculs de moyennes afin d'éviter la duplication entre les
// pages et de garantir une cohérence des coefficients.

export type AnalyseNote = {
	id: string;
	valeur: number;
	coefficient: number;
	coursId: string;
	examenId: string | null;
	sousExamenId: string | null;
};

export type AnalyseCoursLite = {
	id: string;
	nom: string;
	coefficient: number;
	professeurId: string | null;
	professeur: string;
	participants: string[];
	matiereId: string;
	matiere: { id: string; nom: string; couleur?: string };
};

export type AnalyseEleveBase = {
	id: string;
	nom: string;
	prenom: string;
	sexe: string | null;
	im: string | null;
	situation: string;
	notes: AnalyseNote[];
};

export function round(v: number): number {
	return Math.round(v * 100) / 100;
}

/** Vrai si l'élève est concerné par le cours (participants vide = toute la classe). */
export function estParticipant(
	cours: { participants?: string[] } | undefined,
	eleveId: string
): boolean {
	const p = cours?.participants || [];
	return p.length === 0 || p.includes(eleveId);
}

export function getCoef(
	coursById: Record<string, AnalyseCoursLite | undefined>,
	coursId: string
): number {
	return coursById[coursId]?.coefficient || 0;
}

/** Moyenne d'un élève pour un cours sur un ensemble d'examens (null si pas de note). */
export function moyenneMatiere(
	notes: AnalyseNote[],
	coursById: Record<string, AnalyseCoursLite | undefined>,
	coursId: string,
	examenIds: string[]
): number {
	const ns = notes.filter(
		(n) => n.coursId === coursId && n.examenId && examenIds.includes(n.examenId)
	);
	if (ns.length === 0) return 0;
	let tot = 0;
	let coef = 0;
	for (const n of ns) {
		const c = getCoef(coursById, n.coursId) || n.coefficient;
		tot += n.valeur * c;
		coef += c;
	}
	return coef > 0 ? round(tot / coef) : 0;
}

/** Moyenne générale pondérée par les coefficients des cours de la classe. */
export function moyenneGenerale(
	eleve: { notes: AnalyseNote[]; id: string },
	coursList: AnalyseCoursLite[],
	coursById: Record<string, AnalyseCoursLite | undefined>,
	examenIds: string[]
): number {
	let tot = 0;
	let coef = 0;
	for (const cours of coursList) {
		if (!estParticipant(cours, eleve.id)) continue;
		const m = moyenneMatiere(eleve.notes, coursById, cours.id, examenIds);
		if (m > 0) {
			const c = cours.coefficient;
			tot += m * c;
			coef += c;
		}
	}
	return coef > 0 ? round(tot / coef) : 0;
}

/** Moyenne de la classe pour un cours sur un ensemble d'examens. */
export function moyenneClasseMatiere(
	eleves: { id: string; notes: AnalyseNote[] }[],
	coursById: Record<string, AnalyseCoursLite | undefined>,
	coursId: string,
	examenIds: string[]
): number {
	let sum = 0;
	let n = 0;
	for (const e of eleves) {
		if (!estParticipant(coursById[coursId], e.id)) continue;
		const m = moyenneMatiere(e.notes, coursById, coursId, examenIds);
		if (m > 0) {
			sum += m;
			n++;
		}
	}
	return n > 0 ? round(sum / n) : 0;
}

/** Formate un nombre en notation française (virgule, 2 décimales max). */
export function formatFr(v: number): string {
	return (Number.isInteger(v) ? v.toString() : v.toFixed(2)).replace('.', ',');
}
