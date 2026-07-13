import { browser } from '$app/environment';
import { invalidateAll } from '$app/navigation';

export type RealtimeEvent = {
	entity: string;
	action: 'create' | 'update' | 'delete';
	id: string;
	scope?: string;
	data?: unknown;
};

let source: EventSource | null = null;
let pending: ReturnType<typeof setTimeout> | null = null;

// Coalesce les événements rapprochés (ex: plusieurs créations successives)
// en un seul rafraîchissement des données de la page courante.
const COALESCE_MS = 250;

function flush() {
	pending = null;
	invalidateAll();
}

function scheduleFlush() {
	if (pending) clearTimeout(pending);
	pending = setTimeout(flush, COALESCE_MS);
}

/**
 * Ouvre une unique connexion SSE (côté client) qui écoute les
 * modifications de données en temps réel et rafraîchit automatiquement
 * la page courante pour tous les utilisateurs connectés.
 *
 * Appelé une seule fois depuis le layout de l'application.
 */
export function initRealtime() {
	if (!browser || source) return;

	source = new EventSource('/api/realtime/stream');
	source.addEventListener('realtime', (event) => {
		try {
			JSON.parse((event as MessageEvent).data) as RealtimeEvent;
			scheduleFlush();
		} catch {
			// ignore malformed payloads
		}
	});

	// EventSource reconnaît automatiquement en cas d'erreur réseau.
	source.onerror = () => {
		// la reconnexion est gérée nativement par le navigateur
	};
}
