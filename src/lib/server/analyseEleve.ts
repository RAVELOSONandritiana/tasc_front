import { prisma } from '$lib/server/prisma';
import { round } from '$lib/utils/analyse';

export type EleveMatiereSerie = { date: string; label: string; valeur: number };
export type EleveMatiereAnalyse = {
	matiereId: string;
	nom: string;
	couleur?: string | null;
	series: EleveMatiereSerie[];
	slope: number;
	tendance: 'progression' | 'stagnation' | 'regression';
	classeSlope: number | null;
	badge: 'pedagogique' | 'individuelle' | 'ok' | null;
};
export type EleveAnnee = {
	anneeId: string;
	anneeNom: string;
	classeNom: string | null;
	resultat: string | null;
	moyenne: number;
};
export type EleveDetail = {
	id: string;
	nom: string;
	prenom: string;
	im: string | null;
	sexe: string | null;
	dateNaissance: string | null;
	annees: EleveAnnee[];
	matieres: EleveMatiereAnalyse[];
	globalSlope: number;
	globalTendance: 'progression' | 'stagnation' | 'regression';
	hasHistory: boolean;
};

/** Régression linéaire simple (moindres carrés) sur y en fonction de l'index.
 *  Retourne la pente (par point). null si moins de 2 points. */
export function linearSlope(values: number[]): number | null {
	const n = values.length;
	if (n < 2) return null;
	const xs = values.map((_, i) => i);
	const meanX = xs.reduce((s, v) => s + v, 0) / n;
	const meanY = values.reduce((s, v) => s + v, 0) / n;
	let num = 0;
	let den = 0;
	for (let i = 0; i < n; i++) {
		num += (xs[i] - meanX) * (values[i] - meanY);
		den += (xs[i] - meanX) ** 2;
	}
	if (den === 0) return 0;
	return num / den;
}

function tendanceOf(slope: number | null): 'progression' | 'stagnation' | 'regression' {
	if (slope === null) return 'stagnation';
	if (slope <= -0.5) return 'regression';
	if (slope >= 0.5) return 'progression';
	return 'stagnation';
}

export async function getEleveDetail(eleveId: string): Promise<EleveDetail> {
	const eleve = await prisma.eleve.findUnique({
		where: { id: eleveId },
		include: {
			personne: true,
			notes: {
				include: {
					cours: { include: { matiere: true, professeur: { include: { personne: true } } } },
					examen: true,
					sousExamen: true
				},
				orderBy: { date: 'asc' }
			},
			inscriptions: {
				include: {
					anneeScolaire: true,
					classe: { include: { titulaire: { include: { personne: true } } } }
				},
				orderBy: { anneeScolaire: { dateCreation: 'asc' } }
			}
		}
	});
	if (!eleve) throw new Error('Élève introuvable');

	// ---- Années scolaires (historique via inscriptions) ----
	const annees: EleveAnnee[] = eleve.inscriptions.map((ins) => {
		const notesAnnee = eleve.notes.filter((n) => n.cours.anneeId === ins.anneeId);
		const moyenne = notesAnnee.length
			? round(
					notesAnnee.reduce((s, n) => s + n.valeur * (n.coefficient || 1), 0) /
						Math.max(
							1,
							notesAnnee.reduce((s, n) => s + (n.coefficient || 1), 0)
						)
				)
			: 0;
		return {
			anneeId: ins.anneeId,
			anneeNom: ins.anneeScolaire?.nom ?? 'Année',
			classeNom: ins.classe
				? `${ins.classe.niveau}${ins.classe.serie ? ' ' + ins.classe.serie : ''}${ins.classe.nom ? ' ' + ins.classe.nom : ''}`
				: null,
			resultat: ins.resultat ?? null,
			moyenne
		};
	});

	// ---- Séries par matière + pente élève ----
	const matiereMap = new Map<
		string,
		{ id: string; nom: string; couleur?: string | null; notes: typeof eleve.notes }
	>();
	for (const n of eleve.notes) {
		const m = n.cours.matiere;
		if (!matiereMap.has(m.id))
			matiereMap.set(m.id, { id: m.id, nom: m.nom, couleur: m.couleur, notes: [] });
		matiereMap.get(m.id)!.notes.push(n);
	}

	// Notes des camarades pour comparer la pente de la classe (même prof, même matière)
	const coursIds = [...new Set(eleve.notes.map((n) => n.coursId))];
	const peerNotes =
		coursIds.length > 0
			? await prisma.note.findMany({
					where: { coursId: { in: coursIds } },
					include: { cours: { include: { matiere: true } }, examen: true }
				})
			: [];

	const matieres: EleveMatiereAnalyse[] = [];
	for (const [matiereId, m] of matiereMap) {
		const series: EleveMatiereSerie[] = m.notes
			.map((n) => ({
				date: n.date.toISOString().split('T')[0],
				label:
					n.examen?.nom ?? n.sousExamen?.nom ?? n.libelle ?? n.date.toISOString().split('T')[0],
				valeur: n.valeur
			}))
			.sort((a, b) => a.date.localeCompare(b.date));
		const slope = linearSlope(series.map((s) => s.valeur));
		const tendance = tendanceOf(slope);

		// Pente moyenne de la classe pour cette matière (tous les cours de la matière, par examen)
		const coursDeLaMatiere = [...new Set(m.notes.map((n) => n.coursId))];
		const peerForMatiere = peerNotes.filter((n) => coursDeLaMatiere.includes(n.coursId));
		// Moyenne de classe par examen
		const examensMatiere = [
			...new Set(peerForMatiere.map((n) => n.examenId).filter(Boolean))
		] as string[];
		const classeParExamen: number[] = [];
		for (const exId of examensMatiere) {
			const ns = peerForMatiere.filter((n) => n.examenId === exId);
			if (!ns.length) continue;
			const sum = ns.reduce((s, n) => s + n.valeur * (n.coefficient || 1), 0);
			const coef = ns.reduce((s, n) => s + (n.coefficient || 1), 0);
			classeParExamen.push(coef > 0 ? round(sum / coef) : 0);
		}
		const classeSlope = linearSlope(classeParExamen);

		let badge: EleveMatiereAnalyse['badge'] = 'ok';
		if (slope !== null && slope <= -0.5) {
			badge = classeSlope !== null && classeSlope <= -0.5 ? 'pedagogique' : 'individuelle';
		}

		matieres.push({
			matiereId,
			nom: m.nom,
			couleur: m.couleur,
			series,
			slope: slope ?? 0,
			tendance,
			classeSlope,
			badge
		});
	}

	const globalSlope = linearSlope(eleve.notes.map((n) => n.valeur)) ?? 0;
	const globalTendance = tendanceOf(globalSlope);

	return {
		id: eleve.id,
		nom: eleve.personne.name,
		prenom: eleve.personne.lastname,
		im: eleve.im ?? null,
		sexe: eleve.sexe ?? null,
		dateNaissance: eleve.dateNaissance ? eleve.dateNaissance.toISOString().split('T')[0] : null,
		annees,
		matieres,
		globalSlope,
		globalTendance,
		hasHistory: eleve.notes.length > 0 || eleve.inscriptions.length > 0
	};
}
