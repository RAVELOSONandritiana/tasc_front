import type { PageServerLoad, Actions } from './$types';
import {
	getAnneeScolaires,
	getActiveAnneeScolaire,
	createAnneeScolaire,
	setActiveAnneeScolaire,
	prisma
} from '$lib/server/prisma';
import type { StatutCompte, RoleCompte } from '@prisma/client';
import { hashPassword } from '$lib/server/auth';
import { logActivity } from '$lib/server/activity';
import { broadcastNotification, type NotificationScope } from '$lib/server/notifications';
import { broadcastRealtime } from '$lib/server/realtime';
import { hasAdminPower } from '$lib/permissions';
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

	return { comptes, listeAnnees, demandesReset };
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

		const annee = await getActiveAnneeScolaire();
		if (!annee) return fail(400, { error: 'Aucune année scolaire active' });

		const inscriptions = await prisma.inscription.findMany({
			where: { anneeId: annee.id, actif: true },
			include: { eleve: { include: { notes: true } } }
		});

		// Coefficients des cours de l'année pour calculer la moyenne générale.
		const cours = await prisma.cours.findMany({
			where: { anneeId: annee.id },
			select: { id: true, coefficient: true }
		});
		const coefCours = new Map<string, number>(cours.map((c) => [c.id, c.coefficient || 0]));

		let majeres = 0;
		let redoublants = 0;
		for (const ins of inscriptions) {
			const notes = (ins.eleve.notes ?? []).filter((n) => coefCours.has(n.coursId));

			// Moyenne par matière (pondérée par le coefficient de la note ou du cours).
			const parMatiere = new Map<string, { pts: number; coef: number }>();
			for (const n of notes) {
				const coef = n.coefficient || coefCours.get(n.coursId) || 0;
				if (coef <= 0) continue;
				const m = parMatiere.get(n.coursId) ?? { pts: 0, coef: 0 };
				m.pts += n.valeur * coef;
				m.coef += coef;
				parMatiere.set(n.coursId, m);
			}

			let totalPts = 0;
			let totalCoef = 0;
			for (const [coursId, m] of parMatiere) {
				if (m.coef <= 0) continue;
				const cCoef = coefCours.get(coursId) || 0;
				totalPts += (m.pts / m.coef) * cCoef;
				totalCoef += cCoef;
			}

			// Sans note (aucun coefficient), on ne peut pas décider : on laisse tel quel.
			if (totalCoef === 0) continue;

			const moyenne = totalPts / totalCoef;
			const redoublant = moyenne < 10;
			if (redoublant) redoublants++;

			await prisma.eleve.update({
				where: { id: ins.eleve.id },
				data: {
					redoublant,
					situation: redoublant ? 'R' : 'P'
				}
			});
			majeres++;
		}

		return { termine: true, majeres, redoublants };
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
