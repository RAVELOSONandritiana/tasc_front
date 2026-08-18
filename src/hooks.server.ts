import type { Handle } from '@sveltejs/kit';
import { validateSession, SESSION_COOKIE } from '$lib/server/auth';
import { initDb } from '$lib/server/prisma';
import { GEO_COOKIE, type GeoPoint } from '$lib/geo';
import { normalizeIp } from '$lib/utils';

await initDb();

export const handle: Handle = async ({ event, resolve }) => {
	const session = await validateSession(event.cookies.get(SESSION_COOKIE));
	if (session) {
		let geo: GeoPoint | null = null;
		const rawGeo = event.cookies.get(GEO_COOKIE);
		if (rawGeo) {
			try {
				geo = JSON.parse(rawGeo) as GeoPoint;
			} catch {
				geo = null;
			}
		}
		event.locals.user = {
			...session,
			ip: normalizeIp(event.getClientAddress()),
			userAgent: event.request.headers.get('user-agent') || undefined,
			geo
		};
	}
	return resolve(event);
};
