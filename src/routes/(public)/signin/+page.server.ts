import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { authenticate, createSessionToken, SESSION_COOKIE } from '$lib/server/auth';
import { logActivity } from '$lib/server/activity';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	login: async ({ request, cookies }) => {
		const data = await request.formData();
		const matricule = data.get('matricule') as string;
		const password = data.get('password') as string;

		if (!matricule || !password) {
			return fail(400, { error: 'Matricule et mot de passe requis' });
		}

		const compte = await prisma.compte.findFirst({
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
	}
};
