import { prisma } from '$lib/server/prisma';

/**
 * Portée d'une notification :
 * - 'ALL'   : visible par tous les utilisateurs connectés
 * - 'ADMIN' : visible uniquement par les administrateurs
 */
export type NotificationScope = 'ALL' | 'ADMIN';

export type NotificationPayload = {
	id: string;
	title: string;
	description: string;
	time: string;
	read: boolean;
	scope: NotificationScope;
	actionType: string | null;
	matricule: string | null;
	userId: string | null;
	createdAt: string;
};

type Subscriber = (notif: NotificationPayload) => void;

// In-memory set of active SSE subscribers. On le stocke sur `globalThis` afin
// que l'ensemble soit partagé par TOUTES les instances du module, même quand
// Vite (en dev) réévalue le module pour différents endpoints. Sans cela, une
// action (ex: formulaire "mot de passe oublié") et l'endpoint SSE peuvent se
// retrouver avec deux Set différents et la notification n'arrive jamais.
const globalStore = globalThis as unknown as {
	__tascNotificationSubscribers?: Set<Subscriber>;
};

const subscribers: Set<Subscriber> =
	globalStore.__tascNotificationSubscribers ??
	(globalStore.__tascNotificationSubscribers = new Set<Subscriber>());

export function subscribe(fn: Subscriber): () => void {
	subscribers.add(fn);
	return () => {
		subscribers.delete(fn);
	};
}

function publish(notif: NotificationPayload) {
	for (const fn of subscribers) {
		try {
			fn(notif);
		} catch {
			// ignore broken subscribers
		}
	}
}

/**
 * Diffuse en temps réel une notification déjà persistée (ex: après mise à jour).
 */
export function broadcastNotification(notif: NotificationPayload) {
	publish(notif);
}

/**
 * Détermine si une notification d'une portée donnée est visible pour un rôle.
 * Si la notification a un destinataire (userId), elle n'est visible que par ce
 * dernier ; sinon la règle de portée s'applique (ALL / ADMIN).
 */
export function canSeeNotification(
	scope: string,
	role: string | undefined,
	userId?: string | null,
	currentUserId?: string | null
): boolean {
	if (userId) {
		return userId === currentUserId;
	}
	if (scope === 'ADMIN') {
		return role === 'ADMINISTRATEUR';
	}
	return true;
}

/**
 * Persist a notification and push it in real time to every connected client
 * autorisé à la voir (selon la portée).
 */
export async function createNotification(input: {
	title: string;
	description: string;
	time?: string;
	scope?: NotificationScope;
	actionType?: string | null;
	matricule?: string | null;
	userId?: string | null;
}): Promise<NotificationPayload> {
	const notif = await prisma.notification.create({
		data: {
			title: input.title,
			description: input.description,
			time: input.time ?? new Date().toLocaleString('fr-FR'),
			scope: input.scope ?? 'ALL',
			actionType: input.actionType ?? null,
			matricule: input.matricule ?? null,
			userId: input.userId ?? null
		}
	});

	const payload: NotificationPayload = {
		id: notif.id,
		title: notif.title,
		description: notif.description,
		time: notif.time,
		read: notif.read,
		scope: notif.scope as NotificationScope,
		actionType: notif.actionType,
		matricule: notif.matricule,
		userId: notif.userId,
		createdAt: notif.createdAt.toISOString()
	};

	publish(payload);
	return payload;
}
