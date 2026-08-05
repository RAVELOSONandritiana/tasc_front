/**
 * Bus temps réel générique, inspiré du système de notifications.
 *
 * Diffuse à tous les clients connectés (via SSE) les modifications de
 * données métier : création, mise à jour ou suppression d'une entité
 * (personne, enseignant, élève, classe, cours, salle, etc.).
 *
 * Côté client, la réception d'un événement déclenche un rafraîchissement
 * des données de la page courante (invalidateAll), ce qui synchronise
 * instantanément toutes les pages ouvertes chez tous les utilisateurs.
 */

export type RealtimeScope = 'ALL' | 'ADMIN';

import { hasAdminPower, type AdminPowerUser } from '$lib/permissions';

export type RealtimeEntity =
	| 'personne'
	| 'enseignant'
	| 'eleve'
	| 'classe'
	| 'cours'
	| 'matiere'
	| 'salle'
	| 'surveillant'
	| 'operateur'
	| 'incident'
	| 'examen'
	| 'sousExamen'
	| 'note'
	| 'compte'
	| 'annee';

export type RealtimeAction = 'create' | 'update' | 'delete';

export type RealtimeEvent = {
	entity: RealtimeEntity;
	action: RealtimeAction;
	id: string;
	scope?: RealtimeScope;
	data?: unknown;
};

type Subscriber = (event: RealtimeEvent) => void;

// Comme pour les notifications, on stocke l'ensemble des abonnés sur
// `globalThis` pour qu'il soit partagé entre toutes les instances du
// module (rechargements Vite en dev compris).
const globalStore = globalThis as unknown as {
	__tascRealtimeSubscribers?: Set<Subscriber>;
};

const subscribers: Set<Subscriber> =
	globalStore.__tascRealtimeSubscribers ??
	(globalStore.__tascRealtimeSubscribers = new Set<Subscriber>());

export function subscribeToRealtime(fn: Subscriber): () => void {
	subscribers.add(fn);
	return () => {
		subscribers.delete(fn);
	};
}

function publish(event: RealtimeEvent) {
	const evt: RealtimeEvent = { ...event, scope: event.scope ?? 'ALL' };
	for (const fn of subscribers) {
		try {
			fn(evt);
		} catch {
			// ignore broken subscribers
		}
	}
}

/**
 * Diffuse en temps réel un changement de donnée à tous les clients
 * connectés autorisés à le voir (selon la portée).
 */
export function broadcastRealtime(event: RealtimeEvent) {
	publish(event);
}

/**
 * Détermine si un événement d'une portée donnée est visible pour un rôle.
 */
export function canSeeRealtime(scope: string, user: AdminPowerUser | null | undefined): boolean {
	if (scope === 'ADMIN') {
		return hasAdminPower(user);
	}
	return true;
}
