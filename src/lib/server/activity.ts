import { prisma } from '$lib/server/prisma';
import type { Session } from './auth';

export type ActivityAction =
	| 'connexion'
	| 'deconnexion'
	| 'creation_incident'
	| 'modification_eleve'
	| 'creation_cours'
	| 'creation_classe'
	| 'validation_compte'
	| 'creation_personnel'
	| 'creation_surveillant'
	| 'creation_enseignant'
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
