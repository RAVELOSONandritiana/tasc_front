import type { PageServerLoad, Actions } from './$types';
import { prisma } from '$lib/server/prisma';
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
		PERSONNEL: 'Personnel'
	};

	const getStats = () => {
		const prof = compte.personne?.professeur;
		const surv = compte.personne?.surveillant;
		if (compte.role === 'ENSEIGNANT' && prof) {
			return {
				retards: prof.retards,
				absences: prof.absences,
				heuresCours: prof.heuresCours,
				incidents: prof.incidents,
				notesPositives: prof.notesPositives,
				notesNegatives: prof.notesNegatives
			};
		}
		if (compte.role === 'SURVEILLANT' && surv) {
			return {
				retards: surv.retards,
				absences: surv.absences,
				heuresCours: surv.heuresCours,
				incidents: surv.incidents,
				notesPositives: surv.notesPositives,
				notesNegatives: surv.notesNegatives
			};
		}
		return null;
	};

	return {
		profil: {
			id: compte.id,
			nom: compte.personne.lastname,
			prenom: compte.personne.name,
			email: compte.personne.email,
			phone: compte.personne.phone,
			role: roleMap[compte.role] || compte.role,
			dateInscription: compte.dateInscription.toISOString().split('T')[0],
			adresse: compte.profil?.adresse || compte.personne.domicile || '',
			bio: compte.profil?.bio || '',
			stats: getStats()
		}
	};
};

export const actions = {
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
			logActivity(locals.user, 'changement_mot_de_passe', 'Changement de mot de passe').catch(() => {});
			return { success: true };
		} catch {
			return fail(500, { error: 'Erreur lors du changement de mot de passe' });
		}
	}
};
