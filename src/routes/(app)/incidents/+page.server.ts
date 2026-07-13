import type { PageServerLoad, Actions } from './$types';
import { getIncidents, getEleves, getActiveAnneeScolaire, prisma } from '$lib/server/prisma';
import type { Incident, IncidentType } from '$lib/types/Incident.type';
import type { Prisma } from '@prisma/client';
import { fail, redirect } from '@sveltejs/kit';
import { logActivity } from '$lib/server/activity';
import { createNotification } from '$lib/server/notifications';
import { broadcastRealtime } from '$lib/server/realtime';
import { formatClasseNom } from '$lib/utils';

/**
 * Notifie l'auteur d'un incident (si différent du déclencheur) quand quelqu'un
 * aime ou commente son incident. La notification est personnelle (userId défini)
 * et n'est donc visible que par l'auteur.
 */
async function notifyIncidentAuthor(
	incidentId: string,
	currentUserId: string | undefined,
	declencheur: string,
	kind: 'like' | 'commentaire' | 'reponse'
) {
	if (!currentUserId) return;
	try {
		const incident = await prisma.incident.findUnique({
			where: { id: incidentId },
			include: { eleve: { include: { personne: true } } }
		});
		if (!incident || !incident.compteId || incident.compteId === currentUserId) return;

		const nomEleve = incident.eleve
			? `${incident.eleve.personne.name} ${incident.eleve.personne.lastname}`.trim()
			: 'un élève';
		const label =
			kind === 'like'
				? 'a aimé'
				: kind === 'reponse'
					? 'a répondu à un commentaire sur'
					: 'a commenté';

		await createNotification({
			title:
				kind === 'like'
					? 'Nouveau like sur votre incident'
					: 'Nouveau commentaire sur votre incident',
			description: `${declencheur} ${label} votre incident concernant ${nomEleve}.`,
			scope: 'ALL',
			userId: incident.compteId,
			actionType: 'INCIDENT_INTERACTION'
		});
	} catch (e) {
		console.error('notifyIncidentAuthor error:', e);
	}
}

function mapIncident(
	prismaIncident: Prisma.IncidentGetPayload<{
		include: { eleve: { include: { personne: true } }; reactions: true; comments: true };
	}>
): Incident {
	return {
		id: prismaIncident.id,
		eleveId: prismaIncident.eleveId,
		eleveNom: prismaIncident.eleve?.personne?.lastname || '',
		elevePrenom: prismaIncident.eleve?.personne?.name || '',
		type: prismaIncident.type.toLowerCase() as IncidentType,
		message: prismaIncident.message,
		auteur: prismaIncident.auteur,
		auteurId: prismaIncident.compteId || undefined,
		date: prismaIncident.date.toISOString(),
		reactions: prismaIncident.reactions.map((r) => ({ emoji: r.emoji, user: r.user })),
		comments: prismaIncident.comments.map((c) => ({
			id: c.id,
			author: c.author,
			authorId: c.authorId,
			text: c.text,
			date: c.date.toISOString(),
			parentId: c.parentId,
			edited: c.edited
		}))
	};
}

type EleveInfo = {
	id: string;
	nom: string;
	prenom: string;
	classe: string;
	dateNaissance: string;
	imageUrl: string | null;
};

export const load: PageServerLoad = async ({ locals }) => {
	const annee = await getActiveAnneeScolaire();
	const anneeId = annee?.id;
	const incidents = anneeId ? await getIncidents(anneeId) : [];
	const elevesRaw = anneeId ? await getEleves(anneeId) : [];
	const eleves: EleveInfo[] = elevesRaw.map((e) => ({
		id: e.id,
		nom: e.personne.lastname,
		prenom: e.personne.name,
		classe: formatClasseNom(
			e.inscriptions?.find((i) => i.actif)?.classe?.niveau,
			e.inscriptions?.find((i) => i.actif)?.classe?.nom
		),
		dateNaissance: e.dateNaissance?.toISOString().split('T')[0] || '',
		imageUrl: e.personne.imageUrl || null
	}));
	return { incidents: incidents.map(mapIncident), eleves, currentUserId: locals.user?.userId };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const data = await request.formData();
		console.log('Form Data:', Object.fromEntries(data.entries()));
		const eleveId = data.get('eleveId') as string;
		const type = (data.get('type') as string)?.toUpperCase();
		const message = data.get('message') as string;
		const author = locals.user?.prenom || 'Admin';
		const compteId = locals.user?.userId;

		if (!eleveId || !type || !message?.trim()) {
			return fail(400, { error: 'Champs requis manquants' });
		}

		const validTypes = ['INFO', 'ERREUR', 'NOTE', 'ABSENT'] as const;
		if (!validTypes.includes(type as (typeof validTypes)[number])) {
			return fail(400, { error: 'Type invalide' });
		}

		try {
			const annee = await getActiveAnneeScolaire();
			await prisma.$transaction(async (tx) => {
				const incident = await tx.incident.create({
					data: {
						eleveId,
						anneeId: annee?.id || '',
						type: type as (typeof validTypes)[number],
						message: message.trim(),
						auteur: author,
						compteId: compteId || null
					}
				});

				const updateData: Prisma.EleveUpdateInput = {};

				// atomic increment for incidentsCount
				updateData.incidentsCount = { increment: 1 } as Prisma.IntFieldUpdateOperationsInput;

				if (type === 'NOTE') {
					updateData.notesPositives = { increment: 1 } as Prisma.IntFieldUpdateOperationsInput;
				} else if (type === 'ERREUR') {
					updateData.notesNegatives = { increment: 1 } as Prisma.IntFieldUpdateOperationsInput;
				}

				await tx.eleve.update({
					where: { id: eleveId },
					data: updateData
				});

				broadcastRealtime({ entity: 'incident', action: 'create', id: incident.id });
				broadcastRealtime({ entity: 'eleve', action: 'update', id: eleveId });
			});
		} catch (e: unknown) {
			console.error('Create incident error:', e);
			return fail(500, { error: 'Erreur lors de la création' });
		}

		// Notification en temps réel pour tout le monde.
		try {
			const eleve = await prisma.eleve.findUnique({
				where: { id: eleveId },
				include: { personne: true }
			});
			const nomEleve = eleve
				? `${eleve.personne.name} ${eleve.personne.lastname}`.trim()
				: 'un élève';
			const typeLabels: Record<string, string> = {
				INFO: 'Information',
				ERREUR: 'Erreur',
				NOTE: 'Note positive',
				ABSENT: 'Absence'
			};
			await createNotification({
				title: `Nouvel incident : ${typeLabels[type] || type}`,
				description: `${author} a signalé un incident concernant ${nomEleve}.`,
				scope: 'ALL'
			});
		} catch (e) {
			console.error('Notification incident error:', e);
		}

		logActivity(locals.user, 'creation_incident', `Création d'un incident de type ${type}`).catch(
			() => {}
		);

		throw redirect(303, '/incidents');
	},

	delete: async ({ request, locals }) => {
		const data = await request.formData();
		const incidentId = data.get('incidentId') as string;

		if (!incidentId) {
			return fail(400, { error: "ID de l'incident requis" });
		}

		try {
			const incident = await prisma.incident.findUnique({
				where: { id: incidentId }
			});

			if (!incident) {
				return fail(404, { error: 'Incident introuvable' });
			}

			if (incident.compteId && incident.compteId !== locals.user?.userId) {
				return fail(403, { error: "Seul l'auteur peut supprimer cet incident" });
			}

			await prisma.$transaction(async (tx) => {
				await tx.incident.delete({ where: { id: incidentId } });

				const updateData: Prisma.EleveUpdateInput = {};

				// atomic decrement for incidentsCount
				updateData.incidentsCount = { decrement: 1 } as Prisma.IntFieldUpdateOperationsInput;

				if (incident.type === 'NOTE') {
					updateData.notesPositives = { decrement: 1 } as Prisma.IntFieldUpdateOperationsInput;
				} else if (incident.type === 'ERREUR') {
					updateData.notesNegatives = { decrement: 1 } as Prisma.IntFieldUpdateOperationsInput;
				}

				await tx.eleve.update({
					where: { id: incident.eleveId },
					data: updateData
				});

				broadcastRealtime({ entity: 'incident', action: 'delete', id: incidentId });
				broadcastRealtime({ entity: 'eleve', action: 'update', id: incident.eleveId });
			});

			logActivity(
				locals.user,
				'suppression_incident',
				`Suppression d'un incident: ${incident.message.substring(0, 50)}...`
			).catch(() => {});
		} catch (e: unknown) {
			console.error('Delete incident error:', e);
			return fail(500, { error: 'Erreur lors de la suppression' });
		}

		throw redirect(303, '/incidents');
	},

	comment: async ({ request, locals }) => {
		const data = await request.formData();
		const incidentId = data.get('incidentId') as string;
		const text = data.get('text') as string;
		const author = locals.user?.prenom || 'Admin';
		const compteId = locals.user?.userId || null;
		console.log('Comment action called with:', { incidentId, text, author });

		if (!incidentId || !text?.trim()) {
			return fail(400, { error: 'Champs requis manquants' });
		}

		try {
			const comment = await prisma.comment.create({
				data: {
					incidentId,
					author,
					authorId: compteId,
					text: text.trim()
				}
			});
			console.log('Comment created:', comment);
		} catch (e: unknown) {
			console.error('Comment error:', e);
			return fail(500, { error: "Erreur lors de l'ajout du commentaire" });
		}

		logActivity(locals.user, 'creation_incident', "Ajout d'un commentaire sur un incident").catch(
			() => {}
		);
		await notifyIncidentAuthor(incidentId, compteId, author, 'commentaire');
		broadcastRealtime({ entity: 'incident', action: 'update', id: incidentId });

		throw redirect(303, '/incidents');
	},

	reaction: async ({ request, locals }) => {
		const data = await request.formData();
		const incidentId = data.get('incidentId') as string;
		const emoji = data.get('emoji') as string;
		const userId = locals.user?.userId;

		if (!incidentId || !emoji) {
			return fail(400, { error: 'Champs requis manquants' });
		}

		if (!userId) {
			return fail(401, { error: 'Non authentifié' });
		}

		try {
			const existing = await prisma.reaction.findFirst({
				where: { incidentId, emoji, user: userId }
			});

			if (existing) {
				await prisma.reaction.delete({ where: { id: existing.id } });
			} else {
				await prisma.reaction.create({
					data: {
						incidentId,
						emoji,
						user: userId
					}
				});
				await notifyIncidentAuthor(incidentId, userId, locals.user?.prenom || 'Admin', 'like');
			}
		} catch (e: unknown) {
			console.error('Reaction error:', e);
			return fail(500, { error: 'Erreur lors de la réaction' });
		}

		logActivity(locals.user, 'creation_incident', "Ajout d'une réaction sur un incident").catch(
			() => {}
		);
		broadcastRealtime({ entity: 'incident', action: 'update', id: incidentId });

		throw redirect(303, '/incidents');
	},

	replyComment: async ({ request, locals }) => {
		const data = await request.formData();
		const incidentId = data.get('incidentId') as string;
		const parentId = data.get('parentId') as string;
		const text = data.get('text') as string;
		const author = locals.user?.prenom || 'Admin';
		const compteId = locals.user?.userId || null;

		if (!incidentId || !parentId || !text?.trim()) {
			return fail(400, { error: 'Champs requis manquants' });
		}

		try {
			await prisma.comment.create({
				data: {
					incidentId,
					parentId,
					author,
					authorId: compteId,
					text: text.trim()
				}
			});
		} catch (e: unknown) {
			console.error('Reply error:', e);
			return fail(500, { error: 'Erreur lors de la réponse' });
		}

		logActivity(locals.user, 'creation_incident', 'Réponse à un commentaire sur un incident').catch(
			() => {}
		);
		await notifyIncidentAuthor(incidentId, compteId, author, 'reponse');
		broadcastRealtime({ entity: 'incident', action: 'update', id: incidentId });

		throw redirect(303, '/incidents');
	},

	editComment: async ({ request, locals }) => {
		const data = await request.formData();
		const commentId = data.get('commentId') as string;
		const text = data.get('text') as string;

		if (!commentId || !text?.trim()) {
			return fail(400, { error: 'Champs requis manquants' });
		}

		const comment = await prisma.comment.findUnique({ where: { id: commentId } });
		if (!comment) {
			return fail(404, { error: 'Commentaire introuvable' });
		}

		// Seul l'auteur du commentaire (ou un admin) peut le modifier.
		if (
			comment.authorId &&
			comment.authorId !== locals.user?.userId &&
			locals.user?.role !== 'ADMINISTRATEUR'
		) {
			return fail(403, { error: 'Modification non autorisée' });
		}

		try {
			await prisma.comment.update({
				where: { id: commentId },
				data: { text: text.trim(), edited: true }
			});
		} catch (e: unknown) {
			console.error('Edit comment error:', e);
			return fail(500, { error: 'Erreur lors de la modification' });
		}

		logActivity(locals.user, 'modification_incident', "Modification d'un commentaire").catch(
			() => {}
		);

		throw redirect(303, '/incidents');
	}
};
