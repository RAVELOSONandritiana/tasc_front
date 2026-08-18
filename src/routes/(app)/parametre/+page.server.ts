import type { PageServerLoad, Actions } from './$types';
import {
	getAnneeScolaires,
	getActiveAnneeScolaire,
	createAnneeScolaire,
	setActiveAnneeScolaire,
	getSeries,
	prisma
} from '$lib/server/prisma';
import type { StatutCompte, RoleCompte } from '@prisma/client';
import { hashPassword } from '$lib/server/auth';
import { logActivity } from '$lib/server/activity';
import { broadcastNotification, type NotificationScope } from '$lib/server/notifications';
import { broadcastRealtime } from '$lib/server/realtime';
import { hasAdminPower } from '$lib/permissions';
import { mergeSeries, SERIES_PAR_DEFAUT } from '$lib/utils';
import { fail, redirect } from '@sveltejs/kit';

function genererMotDePasse(longueur = 6): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let mdp = '';
	for (let i = 0; i < longueur; i++) {
		mdp += chars[Math.floor(Math.random() * chars.length)];
	}
	return mdp;
}

interface CompteView {
	id: string;
	nom: string;
	prenom: string;
	email: string;
	role: string;
	dateCreation: string;
	statut: 'en_attente' | 'actif' | 'bloque';
}

/**
 * Compare la moyenne d'une matière au seuil d'une condition de règle d'affectation.
 * Opérateurs supportés : '>=', '>', '<=', '<', '=='. Par défaut '>='.
 */
function comparerMoyenne(moyenne: number, op: string, seuil: number): boolean {
	switch (op) {
		case '>':
			return moyenne > seuil;
		case '>=':
			return moyenne >= seuil;
		case '<':
			return moyenne < seuil;
		case '<=':
			return moyenne <= seuil;
		case '==':
			return Math.abs(moyenne - seuil) < 1e-9;
		default:
			return moyenne >= seuil;
	}
}

/**
 * Retourne la moyenne (sur 20) d'une matière pour la classe donnée, à partir
 * des moyennes par cours. Renvoie 0 si la matière n'est pas enseignée ou notée.
 */
function moyParMatiereClasse(
	moyParCours: Map<string, number>,
	coursList: { id: string; classeId: string; matiereId: string | null }[],
	classeId: string | undefined | null,
	matiereId: string
): number {
	if (!classeId) return 0;
	const cours = coursList.find((c) => c.classeId === classeId && c.matiereId === matiereId);
	if (cours && moyParCours.has(cours.id)) return moyParCours.get(cours.id) as number;
	return 0;
}

/**
 * Calcule la moyenne par cours (pondérée par le coefficient de la note ou du
 * cours) à partir d'un ensemble de notes filtré.
 */
function calculerMoyParCours(
	notes: { coursId: string; valeur: number; coefficient: number }[],
	coefCours: Map<string, number>
): Map<string, number> {
	const parMatiere = new Map<string, { pts: number; coef: number }>();
	for (const n of notes) {
		const coef = n.coefficient || coefCours.get(n.coursId) || 0;
		if (coef <= 0) continue;
		const m = parMatiere.get(n.coursId) ?? { pts: 0, coef: 0 };
		m.pts += n.valeur * coef;
		m.coef += coef;
		parMatiere.set(n.coursId, m);
	}
	const moy = new Map<string, number>();
	for (const [coursId, m] of parMatiere) {
		if (m.coef > 0) moy.set(coursId, m.pts / m.coef);
	}
	return moy;
}

export const load: PageServerLoad = async () => {
	const annees = await getAnneeScolaires();
	const listeAnnees = annees.map((a) => ({
		id: a.id,
		nom: a.nom,
		dateCreation: a.dateCreation.toISOString().split('T')[0],
		active: a.active
	}));

	// Nettoyage des comptes orphelins (personne supprimée) pour ne plus les afficher.
	const comptesRaw = await prisma.compte.findMany({
		include: {
			personne: true,
			profil: true
		},
		orderBy: {
			dateCreation: 'desc'
		}
	});

	const comptesOrphelins = comptesRaw.filter((c) => !c.personne).map((c) => c.id);
	if (comptesOrphelins.length > 0) {
		await prisma.compte.deleteMany({
			where: { id: { in: comptesOrphelins } }
		});
	}

	const comptes: CompteView[] = comptesRaw
		.filter((c) => c.personne)
		.map((c) => ({
			id: c.id,
			nom: c.personne.lastname,
			prenom: c.profil?.prenom || c.personne.name,
			email: c.personne.email,
			role: c.role,
			dateCreation: c.dateCreation.toISOString().split('T')[0],
			statut: c.statut === 'EN_ATTENTE' ? 'en_attente' : c.statut === 'ACTIF' ? 'actif' : 'bloque'
		}));

	// Demandes de réinitialisation de mot de passe (notifications admin).
	const demandesRaw = await prisma.notification.findMany({
		where: { actionType: { in: ['PASSWORD_RESET', 'PASSWORD_RESET_DONE'] } },
		orderBy: { createdAt: 'desc' },
		take: 50
	});

	const demandesReset = demandesRaw.map((n) => ({
		id: n.id,
		matricule: n.matricule || '',
		description: n.description,
		time: n.time,
		done: n.actionType === 'PASSWORD_RESET_DONE'
	}));

	const anneeActive = await getActiveAnneeScolaire();
	const series = anneeActive ? await getSeries(anneeActive.id) : mergeSeries(SERIES_PAR_DEFAUT);
	const matieres = anneeActive
		? await prisma.matiere.findMany({
				where: { anneeId: anneeActive.id },
				select: { id: true, nom: true },
				orderBy: { nom: 'asc' }
			})
		: [];
	const examens = anneeActive
		? await prisma.examen.findMany({
				where: { anneeId: anneeActive.id },
				select: { id: true, nom: true, periode: true, date: true },
				orderBy: { date: 'asc' }
			})
		: [];

	return { comptes, listeAnnees, demandesReset, series, matieres, examens };
};

export const actions: Actions = {
	validerCompte: async ({ request, locals }) => {
		if (!hasAdminPower(locals.user)) {
			return fail(403, { error: 'Réservé à l’administrateur' });
		}

		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { error: 'ID requis' });

		try {
			await prisma.compte.update({
				where: { id },
				data: { statut: 'ACTIF' }
			});
			broadcastRealtime({ entity: 'compte', action: 'update', id, scope: 'ADMIN' });
		} catch (error) {
			return fail(500, { error: 'Erreur lors de la validation' });
		}
		throw redirect(303, '/parametre');
	},

	bloquerCompte: async ({ request, locals }) => {
		if (!hasAdminPower(locals.user)) {
			return fail(403, { error: 'Réservé à l’administrateur' });
		}

		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { error: 'ID requis' });

		try {
			await prisma.compte.update({
				where: { id },
				data: { statut: 'BLOQUE' }
			});
			broadcastRealtime({ entity: 'compte', action: 'update', id, scope: 'ADMIN' });
		} catch (error) {
			return fail(500, { error: 'Erreur lors du blocage' });
		}
		throw redirect(303, '/parametre');
	},

	debloquerCompte: async ({ request, locals }) => {
		if (!hasAdminPower(locals.user)) {
			return fail(403, { error: 'Réservé à l’administrateur' });
		}

		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { error: 'ID requis' });

		try {
			await prisma.compte.update({
				where: { id },
				data: { statut: 'ACTIF' }
			});
			broadcastRealtime({ entity: 'compte', action: 'update', id, scope: 'ADMIN' });
		} catch (error) {
			return fail(500, { error: 'Erreur lors du déblocage' });
		}
		throw redirect(303, '/parametre');
	},

	creerAnnee: async ({ request, locals }) => {
		if (!hasAdminPower(locals.user)) {
			return fail(403, { error: 'Réservé à l’administrateur' });
		}

		const data = await request.formData();
		const nom = data.get('nom') as string;
		const seuilRaw = data.get('seuil') as string;
		const seuil = parseInt(seuilRaw, 10);

		if (!nom?.trim()) return fail(400, { error: 'Nom requis' });

		try {
			await createAnneeScolaire(nom.trim(), Number.isNaN(seuil) ? undefined : seuil);
			broadcastRealtime({ entity: 'annee', action: 'create', id: '', scope: 'ADMIN' });
		} catch (error) {
			return fail(500, { error: 'Erreur lors de la création' });
		}
		throw redirect(303, '/parametre');
	},

	activerAnnee: async ({ request, locals }) => {
		if (!hasAdminPower(locals.user)) {
			return fail(403, { error: 'Réservé à l’administrateur' });
		}

		const data = await request.formData();
		const id = data.get('id') as string;

		if (!id) return fail(400, { error: 'ID requis' });

		try {
			await setActiveAnneeScolaire(id);
			broadcastRealtime({ entity: 'annee', action: 'update', id, scope: 'ADMIN' });
		} catch (error) {
			return fail(500, { error: "Erreur lors de l'activation" });
		}
		throw redirect(303, '/parametre');
	},

	terminerAnnee: async ({ request, locals }) => {
		if (!hasAdminPower(locals.user)) {
			return fail(403, { error: 'Réservé à l’administrateur' });
		}

		const formData = await request.formData();

		// Règles d'affectation de série (saisies dans le formulaire de clôture).
		// Structure : { examens: { tous, ids }, series: [{ serie, conditions: [...] }] }
		const reglesRaw = (formData.get('regles') as string) || '';
		let reglesConfig: {
			examens?: { tous: boolean; ids: string[] };
			series?: { serie: string; conditions: { matiereId: string; op: string; valeur: number }[] }[];
		} = { examens: { tous: false, ids: [] }, series: [] };
		if (reglesRaw) {
			try {
				const parsed = JSON.parse(reglesRaw);
				if (parsed && typeof parsed === 'object') reglesConfig = parsed;
			} catch {
				// Règles invalides : on ignore et on ne fait que le recalcul.
			}
		}
		const examensConfig = reglesConfig.examens ?? { tous: false, ids: [] };
		const regles = reglesConfig.series ?? [];

		const annee = await getActiveAnneeScolaire();
		if (!annee) return fail(400, { error: 'Aucune année scolaire active' });

		// Ensemble des examens autorisés pour le calcul des moyennes de matière.
		const examenIdsAnnee = (
			await prisma.examen.findMany({ where: { anneeId: annee.id }, select: { id: true } })
		).map((e) => e.id);
		const examensAutorises = new Set<string>(
			examenIdsAnnee.filter((id) => examensConfig.tous || examensConfig.ids.includes(id))
		);

		const inscriptions = await prisma.inscription.findMany({
			where: { anneeId: annee.id, actif: true },
			include: {
				eleve: { include: { notes: true } },
				classe: { select: { id: true, niveau: true, serie: true } }
			}
		});

		// Coefficients des cours + matières enseignées par classe (pour la moyenne par matière).
		const coursList = await prisma.cours.findMany({
			where: { anneeId: annee.id },
			select: { id: true, classeId: true, matiereId: true, coefficient: true }
		});
		const coefCours = new Map<string, number>(coursList.map((c) => [c.id, c.coefficient || 0]));

		let majeres = 0;
		let redoublants = 0;
		let seriesAttribuees = 0;
		for (const ins of inscriptions) {
			const classe = ins.classe;
			const notes = (ins.eleve.notes ?? []).filter((n) => coefCours.has(n.coursId));

			// Moyennes par cours sur l'ensemble des notes (pour la moyenne générale / passation).
			const moyParCours = calculerMoyParCours(notes, coefCours);

			// Moyennes par cours restreintes aux examens sélectionnés (pour les règles de série).
			const notesExam = notes.filter((n) => n.examenId && examensAutorises.has(n.examenId));
			const moyParCoursExam = calculerMoyParCours(notesExam, coefCours);

			// Moyenne générale (pondérée par le coefficient du cours).
			let totalPts = 0;
			let totalCoef = 0;
			for (const [coursId, moy] of moyParCours) {
				const cCoef = coefCours.get(coursId) || 0;
				if (cCoef <= 0) continue;
				totalPts += moy * cCoef;
				totalCoef += cCoef;
			}

			// Sans note (aucun coefficient), on ne peut pas décider : on laisse tel quel.
			if (totalCoef === 0) continue;

			const moyenne = totalPts / totalCoef;
			const redoublant = moyenne < 10;
			if (redoublant) redoublants++;

			// Affectation de série : uniquement pour les 2nde (niveau 0) admis.
			// Pour les 1ère/terminales, la série est déjà choisie (automatique) : on la conserve.
			let serieAffectee: string | null = null;
			if (!redoublant && classe?.niveau === 0 && regles.length > 0) {
				for (const r of regles) {
					const ok = (r.conditions ?? []).every((c) =>
						comparerMoyenne(
							moyParMatiereClasse(moyParCoursExam, coursList, classe?.id, c.matiereId),
							c.op,
							Number(c.valeur)
						)
					);
					if (ok) {
						serieAffectee = (r.serie || '').trim().toUpperCase() || null;
						break;
					}
				}
				if (serieAffectee) seriesAttribuees++;
			}

			await prisma.eleve.update({
				where: { id: ins.eleve.id },
				data: {
					redoublant,
					situation: redoublant ? 'R' : 'P',
					...(serieAffectee ? { serie: serieAffectee } : {})
				}
			});
			majeres++;
		}

		return { termine: true, majeres, redoublants, seriesAttribuees };
	},

	traiterReset: async ({ request, locals }) => {
		if (!hasAdminPower(locals.user)) {
			return fail(403, { error: "Réservé à l'administrateur" });
		}

		const data = await request.formData();
		const notifId = data.get('notifId') as string;
		if (!notifId) return fail(400, { error: 'Demande introuvable' });

		const notif = await prisma.notification.findUnique({ where: { id: notifId } });
		if (!notif || !notif.matricule) {
			return fail(400, { error: 'Demande invalide' });
		}

		const compte = await prisma.compte.findUnique({ where: { matricule: notif.matricule } });
		if (!compte) return fail(400, { error: 'Aucun compte avec ce matricule' });

		const nouveauMdp = genererMotDePasse(6);
		const hashed = hashPassword(nouveauMdp);

		try {
			await prisma.compte.update({
				where: { id: compte.id },
				data: { password: hashed }
			});

			const updated = await prisma.notification.update({
				where: { id: notifId },
				data: {
					title: 'Mot de passe réinitialisé',
					description: `Compte ${compte.matricule} : nouveau mot de passe « ${nouveauMdp} ». Communiquez-le à l'utilisateur.`,
					actionType: 'PASSWORD_RESET_DONE',
					read: true
				}
			});

			// Met à jour la cloche de notification en temps réel (si connectée).
			broadcastNotification({
				id: updated.id,
				title: updated.title,
				description: updated.description,
				time: updated.time,
				read: updated.read,
				scope: updated.scope as NotificationScope,
				actionType: updated.actionType,
				matricule: updated.matricule,
				userId: updated.userId,
				createdAt: updated.createdAt.toISOString()
			});

			logActivity(
				locals.user,
				'changement_mot_de_passe',
				`Réinitialisation du mot de passe du compte ${compte.matricule}`
			).catch(() => {});
		} catch (error) {
			return fail(500, { error: 'Erreur lors de la réinitialisation' });
		}

		return { resetSuccess: true, matricule: compte.matricule, nouveauMdp };
	}
};
