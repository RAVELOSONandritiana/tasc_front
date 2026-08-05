import { prisma, getActiveAnneeScolaire } from './prisma';
import { logActivity } from './activity';
import { broadcastRealtime } from './realtime';
import { createNotification } from './notifications';

export class PointageError extends Error {
	status: number;
	constructor(message: string, status = 400) {
		super(message);
		this.status = status;
	}
}

export type RegisterPointageInput = {
	classeId: string;
	coursId: string;
	dateRaw: string;
	heuresEffectuees: number;
	causeIncomplet: string | null;
	absentIds: string[];
	retardIds: string[];
	profAbsent?: boolean;
	motifProfAbsent?: string | null;
	locals: App.Locals;
};

export type PointageResult = {
	alertes: string[];
	absents: number;
	retards: number;
	profAbsent: boolean;
	absenceProfId: string | null;
};

function heuresPrevuesCalc(seanceEDT: {
	heureDebut?: string | null;
	heureFin?: string | null;
} | null): number | null {
	if (!seanceEDT?.heureDebut || !seanceEDT?.heureFin) return null;
	const [h1, m1] = seanceEDT.heureDebut.split(':').map(Number);
	const [h2, m2] = seanceEDT.heureFin.split(':').map(Number);
	if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return null;
	const diff = h2 * 60 + m2 - (h1 * 60 + m1);
	return diff > 0 ? Math.round((diff / 60) * 100) / 100 : null;
}

/**
 * Enregistre un pointage de cours (heures + absences/retards). Partage entre la
 * page de pointage complete et la fenetre "Demarrer le cours" de l'emploi du
 * temps.
 *
 * Les absences/retards sont rattaches a l'inscription active de l'eleve pour
 * l'annee scolaire active, meme si la classe de l'inscription differe (cas
 * d'inscriptions sans classeId). Cela garantit qu'ils sont visibles sur le
 * profil de l'eleve et dans le dashboard.
 */
export async function registerPointage(input: RegisterPointageInput): Promise<PointageResult> {
	const {
		classeId,
		coursId,
		dateRaw,
		heuresEffectuees: heuresEffectueesRaw,
		causeIncomplet,
		absentIds,
		retardIds,
		profAbsent: profAbsentInput,
		motifProfAbsent,
		locals
	} = input;
	const userId = locals.user?.userId ?? null;
	const role = locals.user?.role ?? null;

	// Une absence du professeur (cours manqué) compte pour 0 heure effectuée :
	// on force la valeur afin de ne pas bloquer la validation sur un champ vide.
	const profAbsent = Boolean(profAbsentInput);
	let heuresEffectuees = profAbsent ? 0 : heuresEffectueesRaw;

	if (Number.isNaN(heuresEffectuees) || heuresEffectuees < 0) {
		throw new PointageError('Nombre d’heures effectuées invalide');
	}
	if (!dateRaw) {
		throw new PointageError('Date requise');
	}

	const annee = await getActiveAnneeScolaire();
	if (!annee) {
		throw new PointageError("Aucune année scolaire n'est sélectionnée");
	}

	const cours = await prisma.cours.findUnique({
		where: { id: coursId },
		include: { matiere: true, classe: true, professeur: true }
	});
	if (!cours) throw new PointageError('Cours introuvable');

	// Un enseignant ne peut pointer que les cours dont il est titulaire.
	if (role === 'ENSEIGNANT') {
		let profId: string | null = null;
		if (userId) {
			const compte = await prisma.compte.findUnique({
				where: { id: userId },
				include: { personne: { include: { professeur: true } } }
			});
			profId = compte?.personne?.professeur?.id ?? null;
		}
		if (!profId || cours.professeurId !== profId) {
			throw new PointageError(
				'Réservé au surveillant, à l’opérateur ou au professeur titulaire du cours',
				403
			);
		}
	}

	const seuil = annee.seuilAbsenceConvoc || 3;

	const eleveIdsConcernes = [...new Set<string>([...absentIds, ...retardIds])];

	// Inscription active de l'annee pour chaque eleve concerne. On prefere
	// l'inscription dont la classe correspond, mais on retombe sur n'importe
	// quelle inscription active de l'annee (utile si classeId est null).
	const inscriptions = await prisma.inscription.findMany({
		where: { anneeId: annee.id, actif: true, eleveId: { in: eleveIdsConcernes } },
		select: { id: true, eleveId: true, classeId: true }
	});
	const inscriptionParEleve = new Map<string, string>();
	for (const i of inscriptions) {
		const courante = inscriptionParEleve.get(i.eleveId);
		if (!courante || i.classeId === classeId) {
			inscriptionParEleve.set(i.eleveId, i.id);
		}
	}

	const motifCours = `Cours : ${cours.matiere.nom} (${cours.classe ? `${cours.classe.nom}` : ''})`;

	const datePointage = new Date(dateRaw);

	const seanceEDT = await prisma.seanceEDT.findFirst({
		where: { coursId },
		select: { heureDebut: true, heureFin: true }
	});
	const heuresPrevues = heuresPrevuesCalc(seanceEDT);

	const pointage = await prisma.pointage.create({
		data: {
			coursId,
			classeId,
			professeurId: cours.professeurId || null,
			anneeId: annee.id,
			operateurId: userId ?? null,
			date: datePointage,
			heuresPrevues,
			heuresEffectuees,
			causeIncomplet
		}
	});

	// Absence du professeur (cours manqué) : on cree une absenceProf rattachee
	// au pointage. Elle alimente a la fois le profil de l'enseignant (heures
	// manquees) et la fiche de la classe (heures manquees de la classe).
	// La date porte l'heure de debut de la seance (comme dans l'action
	// absenceProf) afin que le calcul des heures manquees retrouve la duree.
	let absenceProfId: string | null = null;
	if (profAbsent && cours.professeurId) {
		const absenceDate =
			seanceEDT?.heureDebut
				? new Date(`${dateRaw}T${seanceEDT.heureDebut}:00`)
				: datePointage;
		const existe = await prisma.absenceProf.findFirst({
			where: {
				professeurId: cours.professeurId,
				coursId,
				date: absenceDate
			}
		});
		if (!existe) {
			const absenceProf = await prisma.absenceProf.create({
				data: {
					date: absenceDate,
					motif: motifProfAbsent?.trim() || null,
					professeurId: cours.professeurId,
					coursId,
					classeId,
					anneeId: annee.id,
					pointageId: pointage.id
				}
			});
			absenceProfId = absenceProf.id;
			await prisma.professeur
				.update({ where: { id: cours.professeurId }, data: { absences: { increment: 1 } } })
				.catch(() => {});
		} else {
			absenceProfId = existe.id;
		}
	}

	const ensembleAbsents = new Set(absentIds);
	const ensembleRetards = new Set(retardIds.filter((id) => !ensembleAbsents.has(id)));

	try {
		await prisma.$transaction(async (tx) => {
			for (const eleveId of ensembleAbsents) {
				await tx.absence.create({
					data: {
						eleveId,
						inscriptionId: inscriptionParEleve.get(eleveId) || null,
						date: datePointage,
						motif: motifCours,
						pointageId: pointage.id
					}
				});
			}
			for (const eleveId of ensembleRetards) {
				await tx.retard.create({
					data: {
						eleveId,
						inscriptionId: inscriptionParEleve.get(eleveId) || null,
						date: datePointage,
						duree: '—',
						motif: motifCours,
						pointageId: pointage.id
					}
				});
			}
		});
	} catch (e) {
		console.error('Erreur création absences/retards:', e);
		throw new PointageError('Erreur lors de l’enregistrement', 500);
	}

	// Alertes de convocation des parents aux multiples du seuil.
	const alertes: string[] = [];
	for (const eleveId of eleveIdsConcernes) {
		const total = await prisma.absence.count({
			where: { eleveId, inscription: { anneeId: annee.id } }
		});
		if (total > 0 && total % seuil === 0) {
			const eleve = await prisma.eleve.findUnique({
				where: { id: eleveId },
				include: { personne: true }
			});
			const nomComplet = eleve ? `${eleve.personne.name} ${eleve.personne.lastname}` : 'Un élève';
			await createNotification({
				title: 'Convocation des parents',
				description: `${nomComplet} a atteint ${total} absences (seuil : ${seuil}). Convocation des parents requise.`,
				scope: 'ALL',
				actionType: 'CONVOCATION_PARENTS'
			}).catch(() => {});
			alertes.push(`${nomComplet} → ${total} absences`);
			broadcastRealtime({ entity: 'eleve', action: 'update', id: eleveId });
		}
	}

	await logActivity(
		locals.user ?? null,
		'pointage_cours',
		profAbsent
			? `Cours manqué (professeur absent) — ${cours.matiere.nom} : ${heuresEffectuees}h`
			: `Pointage du cours ${cours.matiere.nom} (${heuresEffectuees}h)`
	).catch(() => {});

	if (profAbsent && absenceProfId && cours.professeurId) {
		broadcastRealtime({ entity: 'enseignant', action: 'update', id: cours.professeurId });
	}

	return {
		alertes,
		absents: ensembleAbsents.size,
		retards: ensembleRetards.size,
		profAbsent,
		absenceProfId
	};
}
