import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { authenticate, createSessionToken, SESSION_COOKIE } from '$lib/server/auth';
import { logActivity } from '$lib/server/activity';
import { createNotification } from '$lib/server/notifications';
import { prisma } from '$lib/server/prisma';
import { GEO_COOKIE, type GeoPoint } from '$lib/geo';
import { isRateLimited, getRateLimitReset } from '$lib/server/ratelimit';
import type { RequestEvent } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies, getClientAddress }: RequestEvent) => {
		const ip = getClientAddress();
		const data = await request.formData();
		const matricule = data.get('matricule') as string;
		const password = data.get('password') as string;

		if (!matricule || !password) {
			return fail(400, { error: 'Matricule et mot de passe requis' });
		}

		// Limite de tentatives par IP et par compte pour freiner le brute-force.
		if (isRateLimited(`login:ip:${ip}`) || isRateLimited(`login:mat:${matricule}`)) {
			const resetIp = Math.ceil(getRateLimitReset(`login:ip:${ip}`) / 1000);
			const resetMat = Math.ceil(getRateLimitReset(`login:mat:${matricule}`) / 1000);
			const reset = Math.max(resetIp, resetMat);
			return fail(429, {
				error: `Trop de tentatives. Réessayez dans ${reset} seconde(s).`
			});
		}

		const compte = await prisma.compte.findUnique({
			where: { matricule },
			include: { personne: { include: { surveillant: true } } }
		});

		const { verifyPassword, hashPassword } = await import('$lib/server/auth');
		if (!compte || !verifyPassword(password, compte.password)) {
			return fail(401, { error: 'Matricule ou mot de passe incorrect' });
		}

		if (compte.statut !== 'ACTIF') {
			return fail(403, { error: 'Compte inactif ou bloqué' });
		}

		// Migration transparente : les anciens mots de passe (sha256 non salé)
		// sont re-hachés en scrypt dès la première connexion réussie.
		if (!compte.password.startsWith('scrypt$')) {
			await prisma.compte
				.update({ where: { id: compte.id }, data: { password: hashPassword(password) } })
				.catch(() => {});
		}

		const session = {
			userId: compte.id,
			matricule: compte.matricule,
			role: compte.role,
			nom: compte.personne.lastname,
			prenom: compte.personne.name,
			isSurveillantGeneral:
				compte.role === 'SURVEILLANT' &&
				compte.personne.surveillant?.poste === 'Surveillant General'
		};

		const token = createSessionToken(session);
		cookies.set(SESSION_COOKIE, token, {
			path: '/',
			httpOnly: true,
			secure: import.meta.env.PROD,
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7
		});

		let geo: GeoPoint | null = null;
		const rawGeo = cookies.get(GEO_COOKIE);
		if (rawGeo) {
			try {
				geo = JSON.parse(rawGeo) as GeoPoint;
			} catch {
				geo = null;
			}
		}
		const userAgent = request.headers.get('user-agent') || undefined;

		logActivity(
			session,
			'connexion',
			`Connexion réussie avec le matricule ${matricule}`,
			ip,
			userAgent,
			geo
		).catch(() => {});

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
