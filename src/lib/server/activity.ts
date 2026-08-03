import { prisma } from '$lib/server/prisma';
import type { Session } from './auth';

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
	| 'debut_seance'
	| 'fin_seance'
	| 'creation_eleve'
	| 'suppression_eleve'
	| 'creation_rapport'
	| 'suppression_rapport'
	| 'deliberation'
	| 'changement_mot_de_passe';

export async function logActivity(
	session: Session | null,
	action: ActivityAction,
	description: string,
	ipAddress?: string,
	userAgent?: string
) {
	if (!session?.userId) return;

	try {
		await prisma.activite.create({
			data: {
				compteId: session.userId,
				action,
				description,
				ipAddress: ipAddress || '',
				userAgent: userAgent || ''
			}
		});
	} catch {
		// silently fail - don't block the app for logging issues
	}
}
