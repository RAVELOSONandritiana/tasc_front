import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { hashPassword } from '$lib/server/auth';
import { broadcastNotification, type NotificationScope } from '$lib/server/notifications';
import { logActivity } from '$lib/server/activity';
import { hasAdminPower } from '$lib/permissions';

function genererMotDePasse(longueur = 6): string {
	const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	let mdp = '';
	for (let i = 0; i < longueur; i++) {
		mdp += chars[Math.floor(Math.random() * chars.length)];
	}
	return mdp;
}

// Réinitialise le mot de passe lié à une notification de demande (admin uniquement).
// Le nouveau mot de passe est enregistré dans la notification et diffusé en temps réel.
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}
	if (!hasAdminPower(locals.user)) {
		return json({ success: false, error: "Réservé à l'administrateur" }, { status: 403 });
	}

	const body = await request.json().catch(() => ({}));
	const id = body?.id ? String(body.id) : '';
	if (!id) {
		return json({ success: false, error: 'id requis' }, { status: 400 });
	}

	const notif = await prisma.notification.findUnique({ where: { id } });
	if (!notif) {
		return json({ success: false, error: 'Notification introuvable' }, { status: 404 });
	}
	if (notif.actionType !== 'PASSWORD_RESET' || !notif.matricule) {
		return json(
			{ success: false, error: "Cette notification n'est pas réinitialisable" },
			{ status: 400 }
		);
	}

	const compte = await prisma.compte.findUnique({ where: { matricule: notif.matricule } });
	if (!compte) {
		return json({ success: false, error: 'Aucun compte avec ce matricule' }, { status: 400 });
	}

	const nouveauMdp = genererMotDePasse(6);
	const hashed = hashPassword(nouveauMdp);

	await prisma.compte.update({
		where: { id: compte.id },
		data: { password: hashed }
	});

	const updated = await prisma.notification.update({
		where: { id },
		data: {
			title: 'Mot de passe réinitialisé',
			description: `Compte ${compte.matricule} : nouveau mot de passe « ${nouveauMdp} ». Communiquez-le à l'utilisateur.`,
			actionType: 'PASSWORD_RESET_DONE',
			read: true
		}
	});

	logActivity(
		locals.user,
		'changement_mot_de_passe',
		`Réinitialisation du mot de passe du compte ${compte.matricule}`
	).catch(() => {});

	const payload = {
		id: updated.id,
		title: updated.title,
		description: updated.description,
		time: updated.time,
		read: updated.read,
		scope: updated.scope as NotificationScope,
		actionType: updated.actionType,
		matricule: updated.matricule,
		userId: updated.userId,
		createdAt: updated.createdAt.toISOString()
	};

	broadcastNotification(payload);

	return json({ success: true, notification: payload });
};

// Mark a notification (or all notifications) as read.
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const body = await request.json().catch(() => ({}));

	if (body?.all) {
		await prisma.notification.updateMany({
			where: { read: false },
			data: { read: true }
		});
		return json({ success: true });
	}

	if (body?.id) {
		await prisma.notification.update({
			where: { id: String(body.id) },
			data: { read: true }
		});
		return json({ success: true });
	}

	return json({ success: false, error: 'id ou all requis' }, { status: 400 });
};

// Delete a notification.
export const DELETE: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return new Response('Unauthorized', { status: 401 });
	}

	const id = url.searchParams.get('id');
	if (!id) {
		return json({ success: false, error: 'id requis' }, { status: 400 });
	}

	await prisma.notification.delete({ where: { id } }).catch(() => {});
	return json({ success: true });
};
