import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { error } from '@sveltejs/kit';
import { formatClasseNom, numeroClasse } from '$lib/utils';

export type LigneEleveSeance = {
	id: string;
	eleveId: string;
	numero: string;
	nom: string;
	justifie: boolean;
	motif: string | null;
	/** Cause affichable : justification du rapport, sinon motif saisi a la main. */
	cause: string | null;
	/** Auteur de la justification (surveillant ayant redige le rapport). */
	justifiePar: string | null;
	duree?: string | null;
};

export type SeanceMatiere = {
	id: string;
	source: 'POINTAGE' | 'DIRECT';
	date: string;
	professeur: string;
	heuresEffectuees: number | null;
	heuresPrevues: number | null;
	causeIncomplet: string | null;
	profAbsent: boolean;
	motifProfAbsent: string | null;
	effectif: number;
	presents: number;
	absents: LigneEleveSeance[];
	retards: LigneEleveSeance[];
};

export type RecapEleve = {
	id: string;
	numero: string;
	nom: string;
	prenom: string;
	absences: number;
	absencesJustifiees: number;
	retards: number;
	retardsJustifies: number;
	presences: number;
	tauxPresence: number;
	derniereAbsence: string | null;
	dernierRetard: string | null;
};

/** Duree en heures d'un creneau de l'emploi du temps (« 08:00 » -> « 10:00 »). */
function dureeCreneau(heureDebut?: string | null, heureFin?: string | null): number | null {
	if (!heureDebut || !heureFin) return null;
	const [h1, m1] = heureDebut.split(':').map(Number);
	const [h2, m2] = heureFin.split(':').map(Number);
	if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return null;
	const diff = h2 * 60 + m2 - (h1 * 60 + m1);
	return diff > 0 ? Math.round((diff / 60) * 100) / 100 : null;
}

function arrondi(valeur: number, decimales = 2): number {
	const facteur = 10 ** decimales;
	return Math.round(valeur * facteur) / facteur;
}

/**
 * Les absences / retards generes par le pointage recoivent un motif technique
 * (« Cours : Mathematiques (1G) ») qui ne renseigne pas la cause reelle : on ne
 * l'affiche donc pas comme cause.
 */
function motifLisible(motif?: string | null): string | null {
	const valeur = (motif || '').trim();
	if (!valeur) return null;
	return /^cours\s*:/i.test(valeur) ? null : valeur;
}

export const load: PageServerLoad = async ({ params }) => {
	const classeId = params.id;
	const coursId = params.coursId;

	const [classe, cours] = await Promise.all([
		prisma.classe.findUnique({
			where: { id: classeId },
			select: { id: true, nom: true, niveau: true, serie: true }
		}),
		prisma.cours.findUnique({
			where: { id: coursId },
			include: { matiere: true, professeur: { include: { personne: true } } }
		})
	]);

	if (!classe || !cours || cours.classeId !== classeId) {
		throw error(404, 'Cours introuvable pour cette classe');
	}

	const [inscriptions, pointages, seancesEDT, seancesDirect] = await Promise.all([
		prisma.inscription.findMany({
			where: { classeId, actif: true },
			include: { eleve: { include: { personne: true } } }
		}),
		prisma.pointage.findMany({
			where: { coursId },
			orderBy: { date: 'desc' },
			include: {
				professeur: { include: { personne: true } },
				absences: { include: { eleve: { include: { personne: true } } } },
				retards: { include: { eleve: { include: { personne: true } } } },
				absencesProf: true
			}
		}),
		prisma.seanceEDT.findMany({ where: { coursId }, include: { salle: true } }),
		prisma.seanceCours.findMany({
			where: { coursId },
			orderBy: { dateDebut: 'desc' },
			include: {
				professeur: { include: { personne: true } },
				presences: { include: { eleve: { include: { personne: true } } } }
			}
		})
	]);

	// --- Eleves de la classe + numero de classe ---
	// Le numero doit rester identique a celui utilise lors du pointage : on
	// conserve donc le meme tri (nom de famille puis prenom).
	const elevesBruts = inscriptions.map((i) => ({
		id: i.eleve.id,
		nom: i.eleve.personne.lastname,
		prenom: i.eleve.personne.name,
		sexe: i.eleve.sexe || 'G'
	}));
	const numeroParEleve = new Map(elevesBruts.map((e) => [e.id, numeroClasse(e, elevesBruts)]));

	// Affichage : meme convention que le reste de l'application (« name lastname »).
	const elevesAffichage = inscriptions.map((i) => ({
		id: i.eleve.id,
		nom: i.eleve.personne.name,
		prenom: i.eleve.personne.lastname
	}));

	// --- Une absence / un retard n'est justifie que s'il est rattache a un rapport ---
	// Le rapport porte la cause reelle (champ « message », obligatoire a la saisie).
	const absenceIds = pointages.flatMap((p) => p.absences.map((a) => a.id));
	const retardIds = pointages.flatMap((p) => p.retards.map((r) => r.id));
	const lignesJustifiees =
		absenceIds.length || retardIds.length
			? await prisma.rapportLigne.findMany({
					where: {
						OR: [{ absenceId: { in: absenceIds } }, { retardId: { in: retardIds } }]
					},
					orderBy: { createdAt: 'desc' },
					select: {
						absenceId: true,
						retardId: true,
						motif: true,
						rapport: { select: { message: true, auteur: true } }
					}
				})
			: [];

	type Justification = { cause: string | null; auteur: string | null };
	const justificationAbsences = new Map<string, Justification>();
	const justificationRetards = new Map<string, Justification>();
	for (const ligne of lignesJustifiees) {
		const justification: Justification = {
			cause: (ligne.rapport?.message || '').trim() || motifLisible(ligne.motif),
			auteur: ligne.rapport?.auteur?.trim() || null
		};
		// La liste est triee du plus recent au plus ancien : on garde la
		// justification la plus recente pour chaque absence / retard.
		if (ligne.absenceId && !justificationAbsences.has(ligne.absenceId)) {
			justificationAbsences.set(ligne.absenceId, justification);
		}
		if (ligne.retardId && !justificationRetards.has(ligne.retardId)) {
			justificationRetards.set(ligne.retardId, justification);
		}
	}

	// Effectif concerne : participants du cours si la liste est renseignee,
	// sinon tous les inscrits actifs de la classe.
	const participants = cours.participants || [];
	const effectif = participants.length > 0 ? participants.length : inscriptions.length;

	const nomComplet = (personne: { name: string; lastname: string }) =>
		`${personne.name} ${personne.lastname}`;

	const seancesPointage: SeanceMatiere[] = pointages.map((p) => {
		const absents: LigneEleveSeance[] = p.absences.map((a) => {
			const justification = justificationAbsences.get(a.id);
			return {
				id: a.id,
				eleveId: a.eleveId,
				numero: numeroParEleve.get(a.eleveId) || '—',
				nom: nomComplet(a.eleve.personne),
				justifie: Boolean(justification),
				motif: a.motif || null,
				cause: justification?.cause ?? motifLisible(a.motif),
				justifiePar: justification?.auteur ?? null
			};
		});
		const retards: LigneEleveSeance[] = p.retards.map((r) => {
			const justification = justificationRetards.get(r.id);
			return {
				id: r.id,
				eleveId: r.eleveId,
				numero: numeroParEleve.get(r.eleveId) || '—',
				nom: nomComplet(r.eleve.personne),
				justifie: Boolean(justification),
				motif: r.motif || null,
				cause: justification?.cause ?? motifLisible(r.motif),
				justifiePar: justification?.auteur ?? null,
				duree: r.duree || null
			};
		});
		const absenceProf = p.absencesProf[0] || null;
		return {
			id: p.id,
			source: 'POINTAGE',
			date: p.date.toISOString(),
			professeur: p.professeur ? nomComplet(p.professeur.personne) : '—',
			heuresEffectuees: p.heuresEffectuees,
			heuresPrevues: p.heuresPrevues ?? null,
			causeIncomplet: p.causeIncomplet || null,
			profAbsent: Boolean(absenceProf) || p.heuresEffectuees === 0,
			motifProfAbsent: absenceProf?.motif || null,
			effectif,
			presents: Math.max(effectif - absents.length, 0),
			absents,
			retards
		};
	});

	// Seances « en direct » (prise de presence par l'enseignant) : elles ne
	// passent pas par le pointage mais restent des seances de la matiere.
	const seancesEnDirect: SeanceMatiere[] = seancesDirect.map((s) => {
		const absents: LigneEleveSeance[] = s.presences
			.filter((pr) => pr.statut === 'ABSENT')
			.map((pr) => ({
				id: pr.id,
				eleveId: pr.eleveId,
				numero: numeroParEleve.get(pr.eleveId) || '—',
				nom: nomComplet(pr.eleve.personne),
				justifie: false,
				motif: pr.commentaire || null,
				cause: motifLisible(pr.commentaire),
				justifiePar: null
			}));
		const retards: LigneEleveSeance[] = s.presences
			.filter((pr) => pr.statut === 'RETARD')
			.map((pr) => ({
				id: pr.id,
				eleveId: pr.eleveId,
				numero: numeroParEleve.get(pr.eleveId) || '—',
				nom: nomComplet(pr.eleve.personne),
				justifie: false,
				motif: pr.commentaire || null,
				cause: motifLisible(pr.commentaire),
				justifiePar: null
			}));
		const dureeReelle =
			s.dateFin && s.dateDebut
				? arrondi((s.dateFin.getTime() - s.dateDebut.getTime()) / 3_600_000)
				: null;
		return {
			id: s.id,
			source: 'DIRECT',
			date: s.dateDebut.toISOString(),
			professeur: s.professeur ? nomComplet(s.professeur.personne) : '—',
			heuresEffectuees: dureeReelle,
			heuresPrevues: null,
			causeIncomplet: null,
			profAbsent: false,
			motifProfAbsent: null,
			effectif,
			presents: s.presences.filter((pr) => pr.statut === 'PRESENT').length,
			absents,
			retards
		};
	});

	const seances = [...seancesPointage, ...seancesEnDirect].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);

	// --- Recapitulatif par eleve sur l'ensemble des seances de la matiere ---
	const recapParEleve = new Map<string, RecapEleve>();
	for (const e of elevesAffichage) {
		recapParEleve.set(e.id, {
			id: e.id,
			numero: numeroParEleve.get(e.id) || '—',
			nom: e.nom,
			prenom: e.prenom,
			absences: 0,
			absencesJustifiees: 0,
			retards: 0,
			retardsJustifies: 0,
			presences: 0,
			tauxPresence: 0,
			derniereAbsence: null,
			dernierRetard: null
		});
	}

	for (const seance of seances) {
		for (const a of seance.absents) {
			const recap = recapParEleve.get(a.eleveId);
			if (!recap) continue;
			recap.absences++;
			if (a.justifie) recap.absencesJustifiees++;
			if (!recap.derniereAbsence || seance.date > recap.derniereAbsence) {
				recap.derniereAbsence = seance.date;
			}
		}
		for (const r of seance.retards) {
			const recap = recapParEleve.get(r.eleveId);
			if (!recap) continue;
			recap.retards++;
			if (r.justifie) recap.retardsJustifies++;
			if (!recap.dernierRetard || seance.date > recap.dernierRetard) {
				recap.dernierRetard = seance.date;
			}
		}
	}

	const nbSeances = seances.length;
	const eleves = [...recapParEleve.values()]
		.map((recap) => {
			const presences = Math.max(nbSeances - recap.absences, 0);
			return {
				...recap,
				presences,
				tauxPresence: nbSeances > 0 ? arrondi((presences / nbSeances) * 100, 1) : 100
			};
		})
		.sort((a, b) => `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`, 'fr'));

	const totalAbsences = seances.reduce((s, x) => s + x.absents.length, 0);
	const totalRetards = seances.reduce((s, x) => s + x.retards.length, 0);
	const heuresEffectuees = arrondi(seances.reduce((s, x) => s + (x.heuresEffectuees || 0), 0));
	const heuresPrevues = arrondi(seances.reduce((s, x) => s + (x.heuresPrevues || 0), 0));

	const stats = {
		nbSeances,
		effectif,
		heuresEffectuees,
		heuresPrevues,
		totalAbsences,
		totalRetards,
		absencesJustifiees: eleves.reduce((s, e) => s + e.absencesJustifiees, 0),
		retardsJustifies: eleves.reduce((s, e) => s + e.retardsJustifies, 0),
		seancesIncompletes: seances.filter((s) => s.causeIncomplet).length,
		coursManques: seances.filter((s) => s.profAbsent).length,
		tauxPresence:
			nbSeances > 0 && effectif > 0
				? arrondi(((nbSeances * effectif - totalAbsences) / (nbSeances * effectif)) * 100, 1)
				: 100,
		premiereSeance: nbSeances > 0 ? seances[nbSeances - 1].date : null,
		derniereSeance: nbSeances > 0 ? seances[0].date : null
	};

	return {
		classeId,
		coursId,
		classeNom: formatClasseNom(classe.niveau, classe.nom),
		classeSerie: classe.serie || null,
		cours: {
			id: cours.id,
			nom: cours.matiere.nom,
			couleur: cours.matiere.couleur || null,
			coefficient: cours.coefficient,
			professeur: cours.professeur ? nomComplet(cours.professeur.personne) : '—'
		},
		creneaux: seancesEDT.map((s) => ({
			id: s.id,
			jour: s.jour,
			heureDebut: s.heureDebut,
			heureFin: s.heureFin,
			salle: s.salle?.nom || null,
			duree: dureeCreneau(s.heureDebut, s.heureFin)
		})),
		seances,
		eleves,
		stats
	};
};

