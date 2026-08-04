import type { PageServerLoad, Actions } from './$types';
import { prisma, getUserActivities } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import { updateUserPassword } from '$lib/server/prisma';
import { logActivity } from '$lib/server/activity';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/signin');
	}

	const compte = await prisma.compte.findUnique({
		where: { id: locals.user.userId },
		include: {
			personne: {
				include: {
					professeur: true,
					surveillant: true
				}
			},
			profil: true
		}
	});

	if (!compte) {
		throw redirect(303, '/signin');
	}

	const roleMap: Record<string, string> = {
		ADMINISTRATEUR: 'Administrateur',
		ENSEIGNANT: 'Enseignant',
		SURVEILLANT: 'Surveillant',
		PERSONNEL: 'Personnel',
		OPERATEUR: 'Operateur'
	};

	const getStats = () => {
		const prof = compte.personne?.professeur;
		const surv = compte.personne?.surveillant;
		if (compte.role === 'ENSEIGNANT' && prof) {
			return {
			retards: prof.retards,
			absences: prof.absences,
			nbCours: prof.nbCours,
			incidents: prof.incidents,
			notesPositives: prof.notesPositives,
			notesNegatives: prof.notesNegatives
			};
		}
		if (compte.role === 'SURVEILLANT' && surv) {
			return {
			retards: surv.retards,
			absences: surv.absences,
			nbCours: surv.nbCours,
			incidents: surv.incidents,
			notesPositives: surv.notesPositives,
			notesNegatives: surv.notesNegatives
			};
		}
		return null;
	};

	const activities = await getUserActivities(compte.id, 20);

	return {
		profil: {
			id: compte.id,
			personneId: compte.personne.id,
			imageUrl: compte.personne.imageUrl || null,
			nom: compte.personne.lastname,
			prenom: compte.personne.name,
			email: compte.personne.email,
			phone: compte.personne.phone,
			role: roleMap[compte.role] || compte.role,
			dateInscription: compte.dateInscription.toISOString().split('T')[0],
			adresse: compte.profil?.adresse || compte.personne.domicile || '',
			bio: compte.profil?.bio || '',
			matricule: compte.matricule,
			stats: getStats()
		},
		activities
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Non autorisé' });
		}

		const data = await request.formData();
		const name = (data.get('prenom') as string | null)?.trim() ?? '';
		const lastname = (data.get('nom') as string | null)?.trim() ?? '';
		const email = (data.get('email') as string | null)?.trim() ?? '';
		const phone = (data.get('phone') as string | null)?.trim() ?? '';
		const adresse = (data.get('adresse') as string | null)?.trim() ?? '';
		const bio = (data.get('bio') as string | null)?.trim() ?? '';

		if (!name || !lastname) {
			return fail(400, { error: 'Le nom et le prénom sont obligatoires' });
		}
		if (email && !/^[\w.-]+@[\w.-]+\.\w+$/.test(email)) {
			return fail(400, { error: 'Adresse email invalide' });
		}
		if (phone && !/^(\+261|0)[0-9]{9,10}$/.test(phone)) {
			return fail(400, { error: 'Numéro de téléphone invalide' });
		}

		try {
			const compte = await prisma.compte.findUnique({
				where: { id: locals.user.userId },
				include: { personne: true }
			});
			if (!compte) {
				return fail(404, { error: 'Compte introuvable' });
			}

			await prisma.$transaction(async (tx) => {
				await tx.personne.update({
					where: { id: compte.personne.id },
					data: {
						name,
						lastname,
						email: email || undefined,
						phone: phone || undefined
					}
				});

				await tx.profil.upsert({
					where: { compteId: compte.id },
					create: {
						compteId: compte.id,
						nom: name,
						prenom: lastname,
						email: email || compte.personne.email || '',
						role: compte.role,
						dateInscription: new Date(),
						adresse,
						bio
					},
					update: { adresse, bio }
				});
			});
			logActivity(locals.user, 'modification_eleve', 'Mise à jour du profil').catch(() => {});
			return { success: true };
		} catch {
			return fail(500, { error: 'Erreur lors de la mise à jour du profil' });
		}
	},

	changePassword: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Non autorisé' });
		}

		const data = await request.formData();
		const currentPassword = data.get('currentPassword') as string;
		const newPassword = data.get('newPassword') as string;
		const confirmPassword = data.get('confirmPassword') as string;

		const errors: Record<string, string> = {};

		if (!currentPassword) {
			errors.currentPassword = 'Mot de passe actuel requis';
		}

		if (!newPassword) {
			errors.newPassword = 'Nouveau mot de passe requis';
		} else if (newPassword.length < 6) {
			errors.newPassword = 'Le mot de passe doit contenir au moins 6 caractères';
		}

		if (newPassword !== confirmPassword) {
			errors.confirmPassword = 'Les mots de passe ne correspondent pas';
		}

		if (Object.keys(errors).length > 0) {
			return fail(400, { errors });
		}

		const { prisma } = await import('$lib/server/prisma');
		const { verifyPassword } = await import('$lib/server/auth');

		const compte = await prisma.compte.findUnique({
			where: { id: locals.user.userId }
		});

		if (!compte || !verifyPassword(currentPassword, compte.password)) {
			return fail(400, { errors: { currentPassword: 'Mot de passe actuel incorrect' } });
		}

		try {
			await updateUserPassword(locals.user.userId, newPassword);
			logActivity(locals.user, 'changement_mot_de_passe', 'Changement de mot de passe').catch(
				() => {}
			);
			return { success: true };
		} catch {
			return fail(500, { error: 'Erreur lors du changement de mot de passe' });
		}
	},

	changeMatricule: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Non autorisé' });
		}

		const data = await request.formData();
		const matricule = (data.get('matricule') as string | null)?.trim() ?? '';

		if (!matricule) {
			return fail(400, { error: 'Le matricule est requis' });
		}

		const existing = await prisma.compte.findUnique({ where: { matricule } });
		if (existing && existing.id !== locals.user.userId) {
			return fail(400, { error: 'Ce matricule est déjà utilisé' });
		}

		try {
			await prisma.compte.update({
				where: { id: locals.user.userId },
				data: { matricule }
			});
			logActivity(locals.user, 'modification_compte', 'Changement de matricule').catch(
				() => {}
			);
			return { success: true };
		} catch {
			return fail(500, { error: 'Erreur lors du changement de matricule' });
		}
	}
};
