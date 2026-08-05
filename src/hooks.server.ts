import type { Handle } from '@sveltejs/kit';
import { validateSession, SESSION_COOKIE } from '$lib/server/auth';
import { initDb } from '$lib/server/prisma';

await initDb();

export const handle: Handle = async ({ event, resolve }) => {
	const session = await validateSession(event.cookies.get(SESSION_COOKIE));
	if (session) {
		event.locals.user = {
			...session,
			ip: event.getClientAddress(),
			userAgent: event.request.headers.get('user-agent') || undefined
		};
	}
	return resolve(event);
};
