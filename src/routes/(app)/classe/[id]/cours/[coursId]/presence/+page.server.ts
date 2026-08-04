import type { PageServerLoad, Actions } from './$types';
import { prisma, getActiveAnneeScolaire } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { broadcastRealtime } from '$lib/server/realtime';
import { createNotification } from '$lib/server/notifications';

type ElevePresence = {
	id: string;
	nom: string;
	prenom: string;
	dateNaissance: string;
	actif: boolean;
	photoUrl?: string | null;
	imageUrl?: string | null;
};

function heuresPrevuesCalc(seanceEDT: { heureDebut?: string | null; heureFin?: string | null } | null): number | null {
	if (!seanceEDT?.heureDebut || !seanceEDT?.heureFin) return null;
	const [h1, m1] = seanceEDT.heureDebut.split(':').map(Number);
	const [h2, m2] = seanceEDT.heureFin.split(':').map(Number);
	if ([h1, m1, h2, m2].some((n) => Number.isNaN(n))) return null;
	const diff = h2 * 60 + m2 - (h1 * 60 + m1);
	return diff > 0 ? Math.round((diff / 60) * 100) / 100 : null;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const classeId = params.id;
	const coursId = params.coursId;

	const classe = await prisma.classe.findUnique({
		where: { id: classeId },
		include: {
			inscriptions: {
				where: { actif: true },
				include: { eleve: { include: { personne: true } } }
			}
		}
	});

	const cours = await prisma.cours.findUnique({
		where: { id: coursId },
		include: { matiere: true, professeur: { include: { personne: true } } }
	});

	if (!classe || !cours) {
		throw redirect(303, `/classe/${classeId}/cours`);
	}

	const seanceEDT = await prisma.seanceEDT.findFirst({
		where: { coursId: coursId },
		include: { salle: true }
	});

	const eleves: ElevePresence[] = classe.inscriptions.map((inscription) => ({
		id: inscription.eleve.id,
		nom: inscription.eleve.personne.lastname,
		prenom: inscription.eleve.personne.name,
		dateNaissance: inscription.eleve.dateNaissance.toISOString().split('T')[0],
		actif: inscription.actif,
		photoUrl: inscription.eleve.photoUrl,
		imageUrl: inscription.eleve.personne.imageUrl || null
	}));

	const annee = await getActiveAnneeScolaire();

	const historique = await prisma.pointage.findMany({
		where: { coursId: coursId },
		orderBy: { date: 'desc' },
		take: 15,
		include: {
			professeur: { include: { personne: true } },
			absences: { include: { eleve: { include: { personne: true } } } },
			retards: { include: { eleve: { include: { personne: true } } } }
		}
	});

	return {
		eleves,
		classeId,
		coursId,
		coursNom: cours.matiere.nom,
		coefficient: cours.coefficient,
		professeur: cours.professeur
			? `${cours.professeur.personne.name} ${cours.professeur.personne.lastname}`
			: '—',
		professeurId: cours.professeurId ?? null,
		salleNom: seanceEDT?.salle?.nom || 'Non définie',
		heureDebut: seanceEDT?.heureDebut || '08:00',
		heureFin: seanceEDT?.heureFin || '10:00',
		heuresPrevues: heuresPrevuesCalc(seanceEDT),
		seuilAbsence: annee?.seuilAbsenceConvoc ?? 3,
		canEdit:
			!!annee &&
			(locals.user?.role === 'SURVEILLANT' || locals.user?.role === 'ADMINISTRATEUR'),
		historique: historique.map((p) => ({
			id: p.id,
			date: p.date.toISOString(),
			professeur: p.professeur
				? `${p.professeur.personne.name} ${p.professeur.personne.lastname}`
				: '—',
			heuresEffectuees: p.heuresEffectuees,
			heuresPrevues: p.heuresPrevues ?? null,
			causeIncomplet: p.causeIncomplet || null,
			absents: p.absences.map((a) => `${a.eleve.personne.name} ${a.eleve.personne.lastname}`),
			retards: p.retards.map((r) => `${r.eleve.personne.name} ${r.eleve.personne.lastname}`)
		}))
	};
};

export const actions: Actions = {
	enregistrer: async ({ request, params, locals }) => {
		const role = locals.user?.role;
		if (role !== 'SURVEILLANT' && role !== 'ADMINISTRATEUR') {
			return fail(403, { error: 'Réservé au surveillant ou à l’opérateur' });
		}

		const formData = await request.formData();
		const coursId = params.coursId;
		const classeId = params.id;
		const dateRaw = (formData.get('date') as string) || '';
		const heuresEffectueesRaw = formData.get('heuresEffectuees') as string;
		const causeIncomplet = (formData.get('causeIncomplet') as string)?.trim() || null;
		const absentIds = formData.getAll('absentIds').map(String).filter(Boolean);
		const retardIds = formData.getAll('retardIds').map(String).filter(Boolean);

		const heuresEffectuees = parseFloat(heuresEffectueesRaw);
		if (Number.isNaN(heuresEffectuees) || heuresEffectuees < 0) {
			return fail(400, { error: 'Nombre d’heures effectuées invalide' });
		}
		if (!dateRaw) {
			return fail(400, { error: 'Date requise' });
		}

		const annee = await getActiveAnneeScolaire();
		if (!annee) {
			return fail(400, { error: "Aucune année scolaire n'est sélectionnée" });
		}

		const cours = await prisma.cours.findUnique({
			where: { id: coursId },
			include: { matiere: true, classe: true }
		});
		if (!cours) return fail(400, { error: 'Cours introuvable' });

		const seuil = annee.seuilAbsenceConvoc || 3;

		// Inscriptions de la classe pour cette année (pour lier absences/retards).
		const inscriptions = await prisma.inscription.findMany({
			where: { classeId, anneeId: annee.id, actif: true },
			select: { id: true, eleveId: true }
		});
		const inscriptionParEleve = new Map(inscriptions.map((i) => [i.eleveId, i.id]));
		const motifCours = `Cours : ${cours.matiere.nom} (${cours.classe ? `${cours.classe.nom}` : ''})`;

		const datePointage = new Date(dateRaw);

		const seanceEDT = await prisma.seanceEDT.findFirst({
			where: { coursId: coursId },
			select: { heureDebut: true, heureFin: true }
		});
		const heuresPrevues = heuresPrevuesCalc(seanceEDT);

		const pointage = await prisma.pointage.create({
			data: {
				coursId,
				classeId,
				professeurId: cours.professeurId || null,
				anneeId: annee.id,
				operateurId: locals.user?.userId ?? null,
				date: datePointage,
				heuresPrevues,
				heuresEffectuees,
				causeIncomplet
			}
		});

		// Les élèves à traiter : absents en priorité, retards sur le reste.
		const ensembleAbsents = new Set(absentIds);
		const ensembleRetards = new Set(retardIds.filter((id) => !ensembleAbsents.has(id)));

		const elevesConcernes = new Set<string>([...ensembleAbsents, ...ensembleRetards]);

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
			return fail(500, { error: 'Erreur lors de l’enregistrement' });
		}

		// Alertes de convocation des parents aux multiples du seuil.
		const alertes: string[] = [];
		for (const eleveId of elevesConcernes) {
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
			`Pointage du cours ${cours.matiere.nom} (${heuresEffectuees}h)`
		).catch(() => {});

		return { success: true, alertes };
	}
};
