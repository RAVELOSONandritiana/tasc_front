import { prisma, getActiveAnneeScolaire } from './prisma';
import { logActivity } from './activity';
import { broadcastRealtime } from './realtime';

/** Roles autorises a declarer / supprimer une absence d'enseignant. */
export const ROLES_ABSENCE_PROF = ['ADMINISTRATEUR', 'SURVEILLANT', 'OPERATEUR'];

/** Jours tels qu'ils sont stockes dans l'emploi du temps (SeanceEDT.jour). */
export const JOURS_SEMAINE = [
	'Dimanche',
	'Lundi',
	'Mardi',
	'Mercredi',
	'Jeudi',
	'Vendredi',
	'Samedi'
];

/** Erreur metier renvoyee au client avec un message lisible. */
export class AbsenceProfError extends Error {
	status: number;
	constructor(message: string, status = 400) {
		super(message);
		this.status = status;
	}
}

/** "7:5" -> "07:05". Renvoie null si l'heure est inexploitable. */
export function normaliserHeure(heure: string | null | undefined): string | null {
	const m = /^(\d{1,2})\s*[:hH]\s*(\d{1,2})$/.exec((heure ?? '').trim());
	if (!m) return null;
	const h = Number(m[1]);
	const min = Number(m[2]);
	if (!Number.isFinite(h) || !Number.isFinite(min) || h > 23 || min > 59) return null;
	return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

/** Date locale au format "AAAA-MM-JJ" (on evite toISOString qui bascule en UTC). */
export function dateLocaleISO(d: Date): string {
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Duree en heures entre deux horaires "HH:MM" (0 si incoherent). */
export function dureeHeures(heureDebut: string, heureFin: string): number {
	const debut = normaliserHeure(heureDebut);
	const fin = normaliserHeure(heureFin);
	if (!debut || !fin) return 0;
	const [dh, dm] = debut.split(':').map(Number);
	const [fh, fm] = fin.split(':').map(Number);
	const diff = fh * 60 + fm - (dh * 60 + dm);
	return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0;
}

export type DeclareAbsenceProfInput = {
	/** Classe a laquelle appartient la seance (verification de coherence). */
	classeId: string;
	/** Seance de l'emploi du temps qui n'a pas ete assuree. */
	seanceId: string;
	/** Date de la seance manquee, au format "AAAA-MM-JJ". */
	dateRaw: string;
	motif?: string | null;
	justifie?: boolean;
	locals: App.Locals;
};

export type DeclareAbsenceProfResult = {
	absenceId: string;
	professeurId: string;
	professeurNom: string;
	coursNom: string;
	date: string;
	heures: number;
};

/**
 * Declare l'absence d'un enseignant sur une seance de l'emploi du temps.
 *
 * La seance choisie determine le cours, l'enseignant et le nombre d'heures
 * manquees ; la date doit tomber le meme jour de la semaine que la seance et
 * ne peut pas etre dans le futur. Le meme creneau ne peut etre declare qu'une
 * seule fois.
 *
 * Partage entre la page « Analyse » et la fenetre de l'emploi du temps afin
 * que les deux ecrans appliquent exactement les memes regles.
 */
export async function declareAbsenceProf(
	input: DeclareAbsenceProfInput
): Promise<DeclareAbsenceProfResult> {
	const { classeId, locals } = input;
	const seanceId = (input.seanceId || '').trim();
	const dateRaw = (input.dateRaw || '').trim();
	const motif = (input.motif || '').trim() || null;
	const justifie = Boolean(input.justifie);

	if (!ROLES_ABSENCE_PROF.includes(locals.user?.role ?? '')) {
		throw new AbsenceProfError(
			'Réservé à l’administrateur, au surveillant ou à l’opérateur',
			403
		);
	}

	if (!seanceId) throw new AbsenceProfError('Séance de l’emploi du temps requise');
	if (!/^\d{4}-\d{2}-\d{2}$/.test(dateRaw)) throw new AbsenceProfError('Date invalide');
	if (!motif) throw new AbsenceProfError('Le motif est obligatoire.');

	const annee = await getActiveAnneeScolaire();
	if (!annee) throw new AbsenceProfError("Aucune année scolaire n'est active");

	const seance = await prisma.seanceEDT.findUnique({
		where: { id: seanceId },
		include: { cours: { include: { matiere: true, professeur: { include: { personne: true } } } } }
	});
	if (!seance) throw new AbsenceProfError('Séance introuvable dans l’emploi du temps', 404);
	if (seance.cours.classeId !== classeId) {
		throw new AbsenceProfError('Cette séance n’appartient pas à cette classe');
	}
	if (!seance.cours.professeurId) {
		throw new AbsenceProfError(
			`Aucun enseignant n’est affecté au cours « ${seance.cours.matiere.nom} » : affectez d’abord un professeur depuis l’emploi du temps.`
		);
	}

	const heureDebut = normaliserHeure(seance.heureDebut);
	if (!heureDebut) {
		throw new AbsenceProfError(
			'L’horaire de cette séance est incomplet : corrigez-le dans l’emploi du temps avant de déclarer une absence.'
		);
	}

	const date = new Date(`${dateRaw}T${heureDebut}:00`);
	if (Number.isNaN(date.getTime())) throw new AbsenceProfError('Date invalide');

	// La seance a lieu un jour precis de la semaine : declarer une absence un
	// autre jour fausserait le decompte des heures manquees.
	const jourDeLaDate = JOURS_SEMAINE[date.getDay()];
	if (seance.jour && jourDeLaDate !== seance.jour) {
		throw new AbsenceProfError(
			`Le ${dateRaw} est un ${jourDeLaDate.toLowerCase()} : cette séance a lieu le ${seance.jour.toLowerCase()}. Choisissez une date qui tombe un ${seance.jour.toLowerCase()}.`
		);
	}

	const finDeJournee = new Date();
	finDeJournee.setHours(23, 59, 59, 999);
	if (date.getTime() > finDeJournee.getTime()) {
		throw new AbsenceProfError('Impossible de déclarer une absence sur une séance à venir');
	}

	const existe = await prisma.absenceProf.findFirst({
		where: { professeurId: seance.cours.professeurId, coursId: seance.coursId, date }
	});
	if (existe) {
		throw new AbsenceProfError(
			`Cette séance du ${dateRaw} (${heureDebut}) est déjà déclarée comme absence.`
		);
	}

	const nomProf = seance.cours.professeur
		? `${seance.cours.professeur.personne.name} ${seance.cours.professeur.personne.lastname}`
		: 'Enseignant';

	const absence = await prisma.absenceProf.create({
		data: {
			date,
			justifie,
			motif,
			professeurId: seance.cours.professeurId,
			coursId: seance.coursId,
			classeId,
			anneeId: annee.id
		}
	});

	await prisma.professeur
		.update({
			where: { id: seance.cours.professeurId },
			data: { absences: { increment: 1 } }
		})
		.catch(() => {});

	logActivity(
		locals.user ?? null,
		'absence_enseignant',
		`Absence de ${nomProf} — ${seance.cours.matiere.nom} du ${dateRaw} (${seance.heureDebut}-${seance.heureFin})`
	).catch(() => {});

	broadcastRealtime({
		entity: 'enseignant',
		action: 'update',
		id: seance.cours.professeurId
	});

	return {
		absenceId: absence.id,
		professeurId: seance.cours.professeurId,
		professeurNom: nomProf,
		coursNom: seance.cours.matiere.nom,
		date: dateRaw,
		heures: dureeHeures(seance.heureDebut, seance.heureFin)
	};
}
