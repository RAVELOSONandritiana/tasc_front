import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { authenticate, createSessionToken, SESSION_COOKIE } from '$lib/server/auth';
import { logActivity } from '$lib/server/activity';
import { createNotification } from '$lib/server/notifications';
import { prisma } from '$lib/server/prisma';
import { isRateLimited, getRateLimitReset } from '$lib/server/ratelimit';
import type { RequestEvent } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies, getClientAddress }: RequestEvent) => {
		const ip = getClientAddress();
		if (isRateLimited(`login:${ip}`)) {
			const reset = Math.ceil(getRateLimitReset(`login:${ip}`) / 1000);
			return fail(429, {
				error: `Trop de tentatives. Réessayez dans ${reset} seconde(s).`
			});
		}

		const data = await request.formData();
		const matricule = data.get('matricule') as string;
		const password = data.get('password') as string;

		if (!matricule || !password) {
			return fail(400, { error: 'Matricule et mot de passe requis' });
		}

		const compte = await prisma.compte.findUnique({
			where: { matricule },
			include: { personne: true }
		});

		if (!compte) {
			return fail(401, { error: 'Matricule incorrect' });
		}

		const { verifyPassword } = await import('$lib/server/auth');
		if (!verifyPassword(password, compte.password)) {
			return fail(401, { error: 'Mot de passe incorrect' });
		}

		if (compte.statut !== 'ACTIF') {
			return fail(403, { error: 'Compte inactif ou bloqué' });
		}

		const session = {
			userId: compte.id,
			matricule: compte.matricule,
			role: compte.role,
			nom: compte.personne.lastname,
			prenom: compte.personne.name
		};

		const token = createSessionToken(session);
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			secure: false,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7
		});

		logActivity(session, 'connexion', `Connexion réussie avec le matricule ${matricule}`).catch(() => {});

		throw redirect(303, '/dashboard');
	},

	forgotPassword: async ({ request }) => {
		const data = await request.formData();
		const matricule = (data.get('matricule') as string)?.trim();

		if (!matricule) {
			return fail(400, { resetError: 'Matricule requis', reset: true });
		}

		const compte = await prisma.compte.findUnique({
			where: { matricule },
			include: { personne: true }
		});

		// Toujours renvoyer un message de succès pour ne pas révéler
		// l'existence d'un compte. La notification n'est créée que si le
		// matricule correspond réellement à un compte.
		if (compte) {
			const nomComplet = `${compte.personne.name} ${compte.personne.lastname}`.trim();
			await createNotification({
				title: 'Demande de réinitialisation de mot de passe',
				description: `${nomComplet || 'Un utilisateur'} (matricule ${matricule}) a demandé la réinitialisation de son mot de passe.`,
				scope: 'ADMIN',
				actionType: 'PASSWORD_RESET',
				matricule
			}).catch(() => {});
		}

		return {
			reset: true,
			resetSuccess:
				'Votre demande a été envoyée. Un administrateur vous contactera directement pour réinitialiser votre mot de passe.'
		};
	}
};
