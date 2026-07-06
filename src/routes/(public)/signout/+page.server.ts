import type { Actions } from './$types';
import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE } from '$lib/server/auth';
import { logActivity } from '$lib/server/activity';

export const actions: Actions = {
	logout: async ({ cookies, locals }) => {
		logActivity(locals.user, 'deconnexion', 'Déconnexion').catch(() => {});
		cookies.delete(SESSION_COOKIE, { path: '/' });
		throw redirect(303, '/signin');
	}
};
