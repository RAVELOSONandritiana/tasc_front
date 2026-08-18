import { prisma } from '$lib/server/prisma';
import type { Session } from './auth';
import type { GeoPoint } from '$lib/geo';

export type ActivityAction =
	| 'connexion'
	| 'deconnexion'
	| 'creation_incident'
	| 'suppression_incident'
	| 'modification_incident'
	| 'modification_eleve'
	| 'creation_cours'
	| 'creation_classe'
	| 'modification_classe'
	| 'suppression_classe'
	| 'validation_compte'
	| 'creation_personnel'
	| 'suppression_personnel'
	| 'creation_surveillant'
	| 'suppression_surveillant'
	| 'creation_enseignant'
	| 'suppression_enseignant'
	| 'creation_operateur'
	| 'suppression_operateur'
	| 'debut_seance'
	| 'fin_seance'
	| 'creation_eleve'
	| 'suppression_eleve'
	| 'creation_rapport'
	| 'suppression_rapport'
	| 'deliberation'
	| 'changement_mot_de_passe'
	| 'pointage_cours'
	| 'absence_enseignant';

type ActivitySession = Session & {
	ip?: string;
	userAgent?: string;
	geo?: GeoPoint | null;
};

export async function logActivity(
	session: ActivitySession | null,
	action: ActivityAction,
	description: string,
	ipAddress?: string,
	userAgent?: string,
	geo?: GeoPoint | null
) {
	if (!session?.userId) return;

	const ip = ipAddress || session.ip || '';
	const ua = userAgent || session.userAgent || '';
	const g = geo ?? session.geo ?? null;

	try {
		await prisma.activite.create({
			data: {
				compteId: session.userId,
				action,
				description,
				ipAddress: ip,
				userAgent: ua,
				latitude: g ? g.latitude : null,
				longitude: g ? g.longitude : null,
				geoPrecision: g ? g.accuracy : null
			}
		});
	} catch {
		// silently fail - don't block the app for logging issues
	}
}
